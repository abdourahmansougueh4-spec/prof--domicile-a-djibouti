'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type DemandeAmelioration = {
  id: string
  professeur_id: string
  prof_nom: string
  prof_email: string
  prof_photo: string | null
  prof_quartier: string | null
  prof_etoiles: number
  prof_badge: string | null
  prof_note: number
  prof_nb_avis: number
  prof_experience: number
  type: string
  motif: string
  statut: string
  created_at: string
}

type Onglet = 'en_attente' | 'acceptees' | 'refusees' | 'toutes'
type Tri = 'recent' | 'ancien'

const labelsStatut: {
  [k: string]: { label: string; couleur: string; emoji: string }
} = {
  en_attente: {
    label: 'En attente',
    couleur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    emoji: '⏳',
  },
  acceptee: {
    label: 'Acceptée',
    couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    emoji: '✅',
  },
  refusee: {
    label: 'Refusée',
    couleur: 'bg-red-500/20 text-red-300 border-red-500/30',
    emoji: '❌',
  },
}

const badgesConfig: {
  [k: string]: { label: string; emoji: string; couleur: string }
} = {
  recommande: {
    label: 'Recommandé',
    emoji: '🏅',
    couleur: 'from-blue-500 to-blue-600',
  },
  super_pro: {
    label: 'Super-Pro',
    emoji: '👑',
    couleur: 'from-amber-500 to-orange-600',
  },
}

export default function AdminDemandesAmelioration() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Onglet>('en_attente')
  const [tri, setTri] = useState<Tri>('recent')
  const [demandes, setDemandes] = useState<DemandeAmelioration[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  const [detail, setDetail] = useState<DemandeAmelioration | null>(null)
  const [decision, setDecision] = useState<DemandeAmelioration | null>(null)
  const [typeAction, setTypeAction] = useState<'etoile' | 'badge' | 'refus'>('etoile')
  const [badgeChoisi, setBadgeChoisi] = useState<string>('recommande')
  const [motifRefus, setMotifRefus] = useState('')
  const [action, setAction] = useState(false)

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('demandes_amelioration')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: DemandeAmelioration[] = []

      for (const d of data || []) {
        const [profRes, profInfoRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nom_complet, email, photo_url, quartier')
            .eq('id', d.professeur_id)
            .single(),
          supabase
            .from('professeurs')
            .select(
              'etoiles, badge_admin, note_moyenne, nombre_avis, experience_annees, photo_profil_url'
            )
            .eq('id', d.professeur_id)
            .single(),
        ])

        complets.push({
          id: d.id,
          professeur_id: d.professeur_id,
          prof_nom: profRes.data?.nom_complet || 'Prof',
          prof_email: profRes.data?.email || '—',
          prof_photo:
            profInfoRes.data?.photo_profil_url ||
            profRes.data?.photo_url ||
            null,
          prof_quartier: profRes.data?.quartier || null,
          prof_etoiles: profInfoRes.data?.etoiles || 0,
          prof_badge: profInfoRes.data?.badge_admin || null,
          prof_note: profInfoRes.data?.note_moyenne || 0,
          prof_nb_avis: profInfoRes.data?.nombre_avis || 0,
          prof_experience: profInfoRes.data?.experience_annees || 0,
          type: d.type || 'etoile',
          motif: d.motif,
          statut: d.statut || 'en_attente',
          created_at: d.created_at,
        })
      }

      setDemandes(complets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const accepter = async () => {
    if (!decision) return

    setAction(true)
    try {
      // 1. Appliquer l'action
      if (typeAction === 'etoile') {
        const nouvelleValeur = Math.min(decision.prof_etoiles + 1, 3)
        await supabase
          .from('professeurs')
          .update({
            etoiles: nouvelleValeur,
            date_derniere_etoile: new Date().toISOString(),
          })
          .eq('id', decision.professeur_id)

        await supabase.from('notifications').insert({
          destinataire_id: decision.professeur_id,
          titre: `⭐ Étoile obtenue !`,
          contenu: `Votre demande d'amélioration a été acceptée. Vous êtes maintenant niveau ${nouvelleValeur} étoile${nouvelleValeur > 1 ? 's' : ''} !`,
          lien: '/espace-professeur/statut',
          lu: false,
        })
      }

      if (typeAction === 'badge') {
        await supabase
          .from('professeurs')
          .update({ badge_admin: badgeChoisi })
          .eq('id', decision.professeur_id)

        await supabase.from('notifications').insert({
          destinataire_id: decision.professeur_id,
          titre: `${badgesConfig[badgeChoisi]?.emoji || '🏅'} Badge obtenu !`,
          contenu: `Félicitations ! Vous avez reçu le badge "${badgesConfig[badgeChoisi]?.label}".`,
          lien: '/espace-professeur/statut',
          lu: false,
        })
      }

      // 2. Marquer la demande acceptée
      await supabase
        .from('demandes_amelioration')
        .update({ statut: 'acceptee' })
        .eq('id', decision.id)

      // 3. Log
      await supabase.from('admin_logs').insert({
        action: 'accepter_amelioration',
        details: `${decision.prof_nom} → ${
          typeAction === 'etoile'
            ? 'Étoile +1'
            : `Badge ${badgesConfig[badgeChoisi]?.label}`
        }`,
      })

      await charger()
      setDecision(null)
      setTypeAction('etoile')
      setBadgeChoisi('recommande')
      alert('✅ Amélioration accordée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const refuser = async () => {
    if (!decision) return
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer un motif de refus')
      return
    }

    setAction(true)
    try {
      await supabase
        .from('demandes_amelioration')
        .update({ statut: 'refusee' })
        .eq('id', decision.id)

      await supabase.from('notifications').insert({
        destinataire_id: decision.professeur_id,
        titre: '❌ Demande refusée',
        contenu: `Votre demande d'amélioration n'a pas été acceptée. Motif : ${motifRefus}`,
        lien: '/espace-professeur/statut',
        lu: false,
      })

      await supabase.from('admin_logs').insert({
        action: 'refuser_amelioration',
        details: `${decision.prof_nom} | Motif: ${motifRefus}`,
      })

      await charger()
      setDecision(null)
      setMotifRefus('')
      alert('❌ Demande refusée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const demandesFiltrees = useMemo(() => {
    let resultat = demandes.filter((d) => {
      if (onglet === 'en_attente' && d.statut !== 'en_attente') return false
      if (onglet === 'acceptees' && d.statut !== 'acceptee') return false
      if (onglet === 'refusees' && d.statut !== 'refusee') return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          d.prof_nom.toLowerCase().includes(r) ||
          d.prof_email.toLowerCase().includes(r) ||
          d.motif.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'recent')
      resultat.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    if (tri === 'ancien')
      resultat.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

    return resultat
  }, [demandes, onglet, recherche, tri])

  const compte = (statut: string) =>
    demandes.filter((d) => d.statut === statut).length

  const tauxAcceptation =
    demandes.filter((d) => d.statut !== 'en_attente').length > 0
      ? Math.round(
          (compte('acceptee') /
            demandes.filter((d) => d.statut !== 'en_attente').length) *
            100
        )
      : 0

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">📩 Demandes d'amélioration</h1>
          <p className="text-cyan-100 text-sm mb-4">
            {demandes.length} demande{demandes.length > 1 ? 's' : ''} · Les
            profs demandent une promotion
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-cyan-200">
                En attente
              </div>
              <div className="text-2xl font-black">{compte('en_attente')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-cyan-200">
                Acceptées
              </div>
              <div className="text-2xl font-black">{compte('acceptee')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-cyan-200">
                Refusées
              </div>
              <div className="text-2xl font-black">{compte('refusee')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-cyan-200">
                Taux acceptation
              </div>
              <div className="text-2xl font-black">{tauxAcceptation}%</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <div className="bg-teal-500/10 border-l-4 border-teal-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-bold text-teal-200 mb-1">
              Le prof demande une promotion
            </p>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              Tu peux accepter en donnant <strong>+1 étoile</strong> OU un{' '}
              <strong>badge</strong>, ou refuser avec un motif clair.
            </p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            val: 'en_attente',
            label: '⏳ En attente',
            count: compte('en_attente'),
          },
          {
            val: 'acceptees',
            label: '✅ Acceptées',
            count: compte('acceptee'),
          },
          {
            val: 'refusees',
            label: '❌ Refusées',
            count: compte('refusee'),
          },
          { val: 'toutes', label: '📋 Toutes', count: demandes.length },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val as Onglet)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.label} ({o.count})
          </button>
        ))}
      </div>

      {/* Recherche + Tri */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par nom, email ou motif..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      ) : demandesFiltrees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucune demande
          </h3>
          <p className="text-slate-400 text-sm">
            Aucune demande d'amélioration dans cette catégorie.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {demandesFiltrees.map((d, i) => {
            const statutInfo =
              labelsStatut[d.statut] || labelsStatut.en_attente

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  d.statut === 'en_attente'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-slate-800/70 border-white/10 hover:border-teal-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Photo */}
                  {d.prof_photo ? (
                    <img
                      src={d.prof_photo}
                      alt={d.prof_nom}
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                      👨‍🏫
                    </div>
                  )}

                  {/* Infos */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statutInfo.couleur}`}
                      >
                        {statutInfo.emoji} {statutInfo.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formaterDate(d.created_at)}
                      </span>
                    </div>

                    <div className="font-black text-white text-base mb-1">
                      {d.prof_nom}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      📧 {d.prof_email}
                      {d.prof_quartier && ` · 📍 ${d.prof_quartier}`}
                    </div>

                    {/* Stats actuelles */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black border border-amber-500/30">
                        ⭐ {d.prof_etoiles}/3 étoiles
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-black border border-blue-500/30">
                        📊 {d.prof_note.toFixed(1)}/5 ({d.prof_nb_avis} avis)
                      </span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                        🎯 {d.prof_experience} an
                        {d.prof_experience > 1 ? 's' : ''}
                      </span>
                      {d.prof_badge && badgesConfig[d.prof_badge] && (
                        <span
                          className={`text-[10px] bg-gradient-to-r ${
                            badgesConfig[d.prof_badge].couleur
                          } text-white px-2 py-0.5 rounded-full font-black`}
                        >
                          {badgesConfig[d.prof_badge].emoji}{' '}
                          {badgesConfig[d.prof_badge].label}
                        </span>
                      )}
                    </div>

                    {/* Motif */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-[10px] text-slate-500 font-black mb-1">
                        📝 MOTIF DE LA DEMANDE
                      </div>
                      <p className="text-xs text-slate-300 italic whitespace-pre-line leading-relaxed line-clamp-4">
                        {d.motif}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(d)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 border border-white/20"
                    >
                      👁️ Détails
                    </button>

                    {d.statut === 'en_attente' && (
                      <button
                        onClick={() => {
                          setDecision(d)
                          setTypeAction('etoile')
                          setBadgeChoisi('recommande')
                          setMotifRefus('')
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold text-xs shadow-lg"
                      >
                        ⚡ Décider
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {detail && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-6 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    📩 Détail de la demande
                  </h2>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Prof */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                  {detail.prof_photo ? (
                    <img
                      src={detail.prof_photo}
                      alt={detail.prof_nom}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-2xl">
                      👨‍🏫
                    </div>
                  )}
                  <div>
                    <div className="text-white font-black">
                      {detail.prof_nom}
                    </div>
                    <div className="text-xs text-slate-400">
                      {detail.prof_email}
                    </div>
                  </div>
                </div>

                {/* Stats actuelles */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30 text-center">
                    <div className="text-2xl font-black text-amber-300">
                      {detail.prof_etoiles}/3
                    </div>
                    <div className="text-[10px] text-amber-200 font-black">
                      ÉTOILES
                    </div>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30 text-center">
                    <div className="text-2xl font-black text-blue-300">
                      {detail.prof_note.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-blue-200 font-black">
                      NOTE /5
                    </div>
                  </div>
                  <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/30 text-center">
                    <div className="text-2xl font-black text-purple-300">
                      {detail.prof_nb_avis}
                    </div>
                    <div className="text-[10px] text-purple-200 font-black">
                      AVIS
                    </div>
                  </div>
                </div>

                {/* Motif complet */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-2">
                    📝 MOTIF COMPLET
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                    {detail.motif}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20"
                >
                  Fermer
                </button>
                {detail.statut === 'en_attente' && (
                  <button
                    onClick={() => {
                      setDecision(detail)
                      setDetail(null)
                      setTypeAction('etoile')
                      setBadgeChoisi('recommande')
                      setMotifRefus('')
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-blue-600 shadow-lg"
                  >
                    ⚡ Décider
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DÉCISION */}
      <AnimatePresence>
        {decision && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      ⚡ Décision
                    </h2>
                    <p className="text-xs text-cyan-200 mt-1">
                      {decision.prof_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDecision(null)
                      setMotifRefus('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Choix type */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Que veux-tu accorder ?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTypeAction('etoile')}
                      className={`py-3 rounded-xl font-bold text-xs transition-all ${
                        typeAction === 'etoile'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      ⭐ +1 Étoile
                    </button>
                    <button
                      onClick={() => setTypeAction('badge')}
                      className={`py-3 rounded-xl font-bold text-xs transition-all ${
                        typeAction === 'badge'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      🏅 Badge
                    </button>
                    <button
                      onClick={() => setTypeAction('refus')}
                      className={`py-3 rounded-xl font-bold text-xs transition-all ${
                        typeAction === 'refus'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>

                {/* Détail selon type */}
                {typeAction === 'etoile' && (
                  <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
                    <div className="text-sm text-amber-200 font-bold mb-2">
                      ⭐ Niveau actuel : {decision.prof_etoiles}/3
                    </div>
                    <div className="text-xs text-amber-100/80">
                      Le prof passera à{' '}
                      <strong className="text-white">
                        {Math.min(decision.prof_etoiles + 1, 3)}/3 étoiles
                      </strong>
                      .
                    </div>
                  </div>
                )}

                {typeAction === 'badge' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      Quel badge donner ?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setBadgeChoisi('recommande')}
                        className={`py-3 rounded-xl font-bold text-xs transition-all ${
                          badgeChoisi === 'recommande'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        🏅 Recommandé
                      </button>
                      <button
                        onClick={() => setBadgeChoisi('super_pro')}
                        className={`py-3 rounded-xl font-bold text-xs transition-all ${
                          badgeChoisi === 'super_pro'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        👑 Super-Pro
                      </button>
                    </div>
                  </div>
                )}

                {typeAction === 'refus' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      Motif du refus
                    </label>
                    <textarea
                      value={motifRefus}
                      onChange={(e) => setMotifRefus(e.target.value)}
                      rows={4}
                      placeholder="Ex : Encore trop tôt, il vous faut plus d'avis positifs."
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-red-500/30 rounded-xl text-white text-sm outline-none focus:border-red-500 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => {
                    setDecision(null)
                    setMotifRefus('')
                  }}
                  disabled={action}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  Annuler
                </button>
                {typeAction === 'refus' ? (
                  <button
                    onClick={refuser}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 shadow-lg disabled:opacity-50"
                  >
                    {action ? '⏳...' : '❌ Refuser'}
                  </button>
                ) : (
                  <button
                    onClick={accepter}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-50"
                  >
                    {action ? '⏳...' : '✅ Accepter'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}