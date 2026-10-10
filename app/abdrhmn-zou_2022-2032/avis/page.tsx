'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Avis = {
  id: string
  parent_id: string
  parent_nom: string
  parent_email: string
  professeur_id: string
  prof_nom: string
  prof_email: string
  note: number
  commentaire: string
  publie: boolean
  signale: boolean
  created_at: string
}

type Onglet = 'tous' | 'publies' | 'signales' | 'masques'
type Tri = 'recent' | 'ancien' | 'note_haute' | 'note_basse'

export default function AdminAvis() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Onglet>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [avis, setAvis] = useState<Avis[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  const [avisDetail, setAvisDetail] = useState<Avis | null>(null)
  const [reponseAdmin, setReponseAdmin] = useState('')
  const [action, setAction] = useState(false)

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('avis')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Avis[] = []

      for (const a of data || []) {
        const [parentRes, profRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nom_complet, email')
            .eq('id', a.parent_id)
            .single(),
          supabase
            .from('profiles')
            .select('nom_complet, email')
            .eq('id', a.professeur_id)
            .single(),
        ])

        complets.push({
          id: a.id,
          parent_id: a.parent_id,
          parent_nom: parentRes.data?.nom_complet || 'Parent',
          parent_email: parentRes.data?.email || '—',
          professeur_id: a.professeur_id,
          prof_nom: profRes.data?.nom_complet || 'Prof',
          prof_email: profRes.data?.email || '—',
          note: a.note || 0,
          commentaire: a.commentaire || '',
          publie: a.publie !== false,
          signale: a.signale === true,
          created_at: a.created_at,
        })
      }

      setAvis(complets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePublie = async (a: Avis) => {
    setAction(true)
    try {
      await supabase
        .from('avis')
        .update({ publie: !a.publie })
        .eq('id', a.id)

      // Recalculer la note moyenne du prof
      await recalculerNoteProf(a.professeur_id)

      await supabase.from('admin_logs').insert({
        action: a.publie ? 'masquer_avis' : 'publier_avis',
        details: `${a.parent_nom} → ${a.prof_nom}`,
      })

      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const toggleSignale = async (a: Avis) => {
    setAction(true)
    try {
      await supabase
        .from('avis')
        .update({ signale: !a.signale })
        .eq('id', a.id)

      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const supprimerAvis = async (a: Avis) => {
    if (!confirm(`⚠️ SUPPRIMER définitivement cet avis ?\n\nDe : ${a.parent_nom}\nPour : ${a.prof_nom}`)) return

    setAction(true)
    try {
      await supabase.from('avis').delete().eq('id', a.id)

      await recalculerNoteProf(a.professeur_id)

      await supabase.from('admin_logs').insert({
        action: 'supprimer_avis',
        details: `${a.parent_nom} → ${a.prof_nom} (${a.note}/5)`,
      })

      await charger()
      setAvisDetail(null)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const repondreEnTantQuAdmin = async () => {
    if (!avisDetail || !reponseAdmin.trim()) return

    setAction(true)
    try {
      // On enregistre la réponse comme un champ dans le commentaire
      // (à défaut d'avoir une table dédiée)
      const nouveauCommentaire = `${avisDetail.commentaire}\n\n---\n📢 RÉPONSE ADMIN :\n${reponseAdmin.trim()}`

      await supabase
        .from('avis')
        .update({ commentaire: nouveauCommentaire })
        .eq('id', avisDetail.id)

      await supabase.from('notifications').insert({
        destinataire_id: avisDetail.parent_id,
        titre: '📢 Réponse de l\'équipe',
        contenu: `L'équipe a répondu à votre avis sur ${avisDetail.prof_nom}.`,
        lu: false,
      })

      await charger()
      setReponseAdmin('')
      setAvisDetail(null)
      alert('✅ Réponse publiée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const recalculerNoteProf = async (profId: string) => {
    const { data } = await supabase
      .from('avis')
      .select('note')
      .eq('professeur_id', profId)
      .eq('publie', true)

    if (data && data.length > 0) {
      const moyenne = data.reduce((acc, x) => acc + (x.note || 0), 0) / data.length
      await supabase
        .from('professeurs')
        .update({
          note_moyenne: Math.round(moyenne * 10) / 10,
          nombre_avis: data.length,
        })
        .eq('id', profId)
    } else {
      await supabase
        .from('professeurs')
        .update({ note_moyenne: 0, nombre_avis: 0 })
        .eq('id', profId)
    }
  }

  const avisFiltres = useMemo(() => {
    let resultat = avis.filter((a) => {
      if (onglet === 'publies' && !a.publie) return false
      if (onglet === 'masques' && a.publie) return false
      if (onglet === 'signales' && !a.signale) return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          a.parent_nom.toLowerCase().includes(r) ||
          a.prof_nom.toLowerCase().includes(r) ||
          a.commentaire.toLowerCase().includes(r)
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
    if (tri === 'note_haute') resultat.sort((a, b) => b.note - a.note)
    if (tri === 'note_basse') resultat.sort((a, b) => a.note - b.note)

    return resultat
  }, [avis, onglet, recherche, tri])

  const compte = (filtre: string) => {
    if (filtre === 'tous') return avis.length
    if (filtre === 'publies') return avis.filter((a) => a.publie).length
    if (filtre === 'masques') return avis.filter((a) => !a.publie).length
    if (filtre === 'signales') return avis.filter((a) => a.signale).length
    return 0
  }

  const noteMoyenne =
    avis.filter((a) => a.publie).length > 0
      ? avis
          .filter((a) => a.publie)
          .reduce((acc, x) => acc + x.note, 0) /
        avis.filter((a) => a.publie).length
      : 0

  const repartition = [5, 4, 3, 2, 1].map((n) => ({
    note: n,
    count: avis.filter((a) => a.note === n && a.publie).length,
  }))

  const couleurNote = (n: number) => {
    if (n >= 4) return 'text-emerald-400'
    if (n >= 3) return 'text-amber-400'
    return 'text-red-400'
  }

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">⭐ Modération des avis</h1>
          <p className="text-amber-100 text-sm mb-5">
            {avis.length} avis · Note moyenne : {noteMoyenne.toFixed(1)}/5
          </p>

          {/* Répartition */}
          <div className="grid grid-cols-5 gap-2">
            {repartition.map((r) => (
              <div
                key={r.note}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center"
              >
                <div className="text-xs font-black text-amber-200">
                  {r.note} ⭐
                </div>
                <div className="text-xl font-black">{r.count}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'tous', label: '📋 Tous', count: compte('tous') },
          { val: 'publies', label: '✅ Publiés', count: compte('publies') },
          { val: 'signales', label: '🚨 Signalés', count: compte('signales') },
          { val: 'masques', label: '🙈 Masqués', count: compte('masques') },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val as Onglet)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
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
            placeholder="Rechercher par nom ou contenu..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
          <option value="note_haute">Note élevée</option>
          <option value="note_basse">Note basse</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
          />
        </div>
      ) : avisFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun avis</h3>
          <p className="text-slate-400 text-sm">
            Aucun avis dans cette catégorie.
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {avisFiltres.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                a.signale
                  ? 'bg-red-500/10 border-red-500/40'
                  : !a.publie
                  ? 'bg-slate-900/50 border-slate-700 opacity-75'
                  : 'bg-slate-800/70 border-white/10 hover:border-amber-500/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.signale && (
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                      🚨 SIGNALÉ
                    </span>
                  )}
                  {!a.publie && (
                    <span className="text-[10px] bg-slate-500 text-white px-2 py-0.5 rounded-full font-black">
                      🙈 MASQUÉ
                    </span>
                  )}
                  {a.publie && !a.signale && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black border border-emerald-500/30">
                      ✅ PUBLIÉ
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  {formaterDate(a.created_at)}
                </div>
              </div>

              {/* Note */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-3xl font-black ${couleurNote(a.note)}`}>
                  {a.note}
                </span>
                <span className="text-lg">{'⭐'.repeat(a.note)}</span>
                <span className="text-slate-400 text-sm">/5</span>
              </div>

              {/* Commentaire */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
                <p className="text-sm text-slate-200 italic leading-relaxed line-clamp-4">
                  « {a.commentaire} »
                </p>
              </div>

              {/* Du / Vers */}
              <div className="text-[10px] text-slate-400 space-y-0.5 mb-3">
                <div>
                  👨‍👩‍👧 <span className="text-white font-bold">{a.parent_nom}</span>
                </div>
                <div>
                  👨‍🏫 <span className="text-white font-bold">{a.prof_nom}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setAvisDetail(a)}
                  className="flex-1 px-3 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 border border-white/20"
                >
                  👁️ Détails
                </button>
                <button
                  onClick={() => togglePublie(a)}
                  disabled={action}
                  className={`flex-1 px-3 py-2 rounded-xl font-bold text-xs border disabled:opacity-50 ${
                    a.publie
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                >
                  {a.publie ? '🙈 Masquer' : '✅ Publier'}
                </button>
                <button
                  onClick={() => toggleSignale(a)}
                  disabled={action}
                  className={`px-3 py-2 rounded-xl font-bold text-xs border disabled:opacity-50 ${
                    a.signale
                      ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                  }`}
                >
                  {a.signale ? '✓' : '🚨'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {avisDetail && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    ⭐ Détail de l'avis
                  </h2>
                  <button
                    onClick={() => {
                      setAvisDetail(null)
                      setReponseAdmin('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Note */}
                <div className="text-center py-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl border border-amber-500/30">
                  <div
                    className={`text-6xl font-black ${couleurNote(
                      avisDetail.note
                    )}`}
                  >
                    {avisDetail.note}
                  </div>
                  <div className="text-2xl mt-2">
                    {'⭐'.repeat(avisDetail.note)}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">sur 5</div>
                </div>

                {/* Du / Vers */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                    <div className="text-[10px] text-blue-300 font-black mb-1">
                      👨‍👩‍👧 PARENT
                    </div>
                    <div className="text-white font-bold">
                      {avisDetail.parent_nom}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {avisDetail.parent_email}
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-300 font-black mb-1">
                      👨‍🏫 PROF
                    </div>
                    <div className="text-white font-bold">
                      {avisDetail.prof_nom}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {avisDetail.prof_email}
                    </div>
                  </div>
                </div>

                {/* Commentaire */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-2">
                    💬 COMMENTAIRE
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed italic">
                    « {avisDetail.commentaire} »
                  </p>
                </div>

                {/* Réponse admin */}
                <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
                  <div className="text-xs font-black text-purple-300 mb-2">
                    📢 RÉPONDRE EN TANT QU'ADMIN
                  </div>
                  <textarea
                    value={reponseAdmin}
                    onChange={(e) => setReponseAdmin(e.target.value)}
                    rows={4}
                    placeholder="Ex : Merci pour votre retour. Nous prenons note et allons améliorer..."
                    className="w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-xl text-white text-sm outline-none resize-none"
                  />
                  <button
                    onClick={repondreEnTantQuAdmin}
                    disabled={action || !reponseAdmin.trim()}
                    className="w-full mt-3 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-700 shadow-lg disabled:opacity-50 text-sm"
                  >
                    {action ? '⏳...' : '📢 Publier la réponse'}
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setAvisDetail(null)
                    setReponseAdmin('')
                  }}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20"
                >
                  Fermer
                </button>
                <button
                  onClick={() => togglePublie(avisDetail)}
                  disabled={action}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                >
                  {avisDetail.publie ? '🙈 Masquer' : '✅ Publier'}
                </button>
                <button
                  onClick={() => supprimerAvis(avisDetail)}
                  disabled={action}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-700 shadow-lg disabled:opacity-50"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}