'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Signalement = {
  id: string
  signale_par: string
  signale_par_nom: string
  signale_par_email: string
  signale_par_tel: string
  signale_par_whatsapp: string
  cible_id: string
  cible_nom: string
  cible_email: string
  cible_tel: string
  cible_whatsapp: string
  cible_role: string
  type: string
  motif: string
  statut: string
  resolution: string | null
  created_at: string
}

type Onglet = 'nouveau' | 'en_cours' | 'resolu' | 'ignore' | 'tous'
type Tri = 'recent' | 'ancien' | 'type'

const labelsStatut: {
  [k: string]: { label: string; couleur: string; emoji: string }
} = {
  nouveau: {
    label: 'Nouveau',
    couleur: 'bg-red-500/20 text-red-300 border-red-500/30',
    emoji: '🚨',
  },
  en_cours: {
    label: 'En cours',
    couleur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    emoji: '⏳',
  },
  resolu: {
    label: 'Résolu',
    couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    emoji: '✅',
  },
  ignore: {
    label: 'Ignoré',
    couleur: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    emoji: '⚪',
  },
}

const labelsType: { [k: string]: string } = {
  absence: '📅 Absences répétées',
  comportement: '⚠️ Comportement inapproprié',
  pedagogie: '📚 Problème de pédagogie',
  violence: '🚨 Violence / Menace',
  argent: '💰 Problème d\'argent',
  autre: '📝 Autre',
}

export default function AdminSignalements() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Onglet>('nouveau')
  const [tri, setTri] = useState<Tri>('recent')
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  const [detail, setDetail] = useState<Signalement | null>(null)
  const [decision, setDecision] = useState<Signalement | null>(null)
  const [actionChoisie, setActionChoisie] = useState<
    'bannir' | 'avertir' | 'ignorer' | 'resolu' | null
  >(null)
  const [motifAction, setMotifAction] = useState('')
  const [noteInterne, setNoteInterne] = useState('')
  const [action, setAction] = useState(false)

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('signalements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Signalement[] = []

      for (const s of data || []) {
        const [signaleurRes, cibleRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nom_complet, email, telephone, whatsapp')
            .eq('id', s.signale_par)
            .single(),
          supabase
            .from('profiles')
            .select('nom_complet, email, telephone, whatsapp, role')
            .eq('id', s.cible_id)
            .single(),
        ])

        complets.push({
          id: s.id,
          signale_par: s.signale_par,
          signale_par_nom: signaleurRes.data?.nom_complet || 'Signaleur',
          signale_par_email: signaleurRes.data?.email || '—',
          signale_par_tel: signaleurRes.data?.telephone || '—',
          signale_par_whatsapp: signaleurRes.data?.whatsapp || '—',
          cible_id: s.cible_id,
          cible_nom: cibleRes.data?.nom_complet || 'Cible',
          cible_email: cibleRes.data?.email || '—',
          cible_tel: cibleRes.data?.telephone || '—',
          cible_whatsapp: cibleRes.data?.whatsapp || '—',
          cible_role: cibleRes.data?.role || '—',
          type: s.type || 'autre',
          motif: s.motif,
          statut: s.statut || 'nouveau',
          resolution: s.resolution || null,
          created_at: s.created_at,
        })
      }

      setSignalements(complets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const appliquerAction = async () => {
    if (!decision || !actionChoisie) return

    if (actionChoisie === 'bannir' && !motifAction.trim()) {
      alert('Veuillez indiquer le motif du bannissement')
      return
    }

    if (actionChoisie === 'avertir' && !motifAction.trim()) {
      alert("Veuillez indiquer le message d'avertissement")
      return
    }

    if (actionChoisie === 'ignorer' && !motifAction.trim()) {
      alert('Veuillez indiquer pourquoi vous ignorez ce signalement')
      return
    }

    setAction(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Bannir
      if (actionChoisie === 'bannir') {
        await supabase
          .from('profiles')
          .update({
            banni: true,
            approuve: false,
            motif_bannissement: motifAction.trim(),
          })
          .eq('id', decision.cible_id)

        await supabase.from('notifications').insert({
          destinataire_id: decision.cible_id,
          titre: '🚫 Compte banni',
          contenu: `Votre compte a été banni suite à un signalement. Motif : ${motifAction}`,
          lu: false,
        })

        await supabase
          .from('signalements')
          .update({
            statut: 'resolu',
            resolution: `BANNISSEMENT : ${motifAction.trim()}`,
          })
          .eq('id', decision.id)
      }

      // 2. Avertir
      if (actionChoisie === 'avertir') {
        await supabase.from('notifications').insert({
          destinataire_id: decision.cible_id,
          titre: '⚠️ Avertissement',
          contenu: motifAction.trim(),
          lu: false,
        })

        await supabase
          .from('signalements')
          .update({
            statut: 'en_cours',
            resolution: `AVERTISSEMENT envoyé : ${motifAction.trim()}`,
          })
          .eq('id', decision.id)
      }

      // 3. Ignorer
      if (actionChoisie === 'ignorer') {
        await supabase
          .from('signalements')
          .update({
            statut: 'ignore',
            resolution: `IGNORÉ : ${motifAction.trim()}`,
          })
          .eq('id', decision.id)
      }

      // 4. Résolu
      if (actionChoisie === 'resolu') {
        await supabase
          .from('signalements')
          .update({
            statut: 'resolu',
            resolution: motifAction.trim() || 'Traité par l\'admin',
          })
          .eq('id', decision.id)
      }

      // Log
      await supabase.from('admin_logs').insert({
        action: `signalement_${actionChoisie}`,
        details: `${decision.cible_nom} | ${motifAction.trim()}`,
      })

      await charger()
      setDecision(null)
      setActionChoisie(null)
      setMotifAction('')
      alert('✅ Action appliquée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const mettreEnCours = async (s: Signalement) => {
    try {
      await supabase
        .from('signalements')
        .update({ statut: 'en_cours' })
        .eq('id', s.id)
      await charger()
      alert('✅ Signalement marqué "En cours"')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    }
  }

  const signalementsFiltres = useMemo(() => {
    let resultat = signalements.filter((s) => {
      if (onglet === 'nouveau' && s.statut !== 'nouveau') return false
      if (onglet === 'en_cours' && s.statut !== 'en_cours') return false
      if (onglet === 'resolu' && s.statut !== 'resolu') return false
      if (onglet === 'ignore' && s.statut !== 'ignore') return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          s.signale_par_nom.toLowerCase().includes(r) ||
          s.cible_nom.toLowerCase().includes(r) ||
          s.motif.toLowerCase().includes(r)
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
    if (tri === 'type')
      resultat.sort((a, b) => a.type.localeCompare(b.type))

    return resultat
  }, [signalements, onglet, recherche, tri])

  const compte = (statut: string) =>
    signalements.filter((s) => s.statut === statut).length

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const tauxResolution =
    signalements.length > 0
      ? Math.round((compte('resolu') / signalements.length) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-600 via-red-700 to-orange-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">🚨 Signalements</h1>
          <p className="text-red-100 text-sm mb-4">
            {signalements.length} signalement{signalements.length > 1 ? 's' : ''} · Traiter et résoudre
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">
                Nouveaux
              </div>
              <div className="text-2xl font-black">{compte('nouveau')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">
                En cours
              </div>
              <div className="text-2xl font-black">{compte('en_cours')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">
                Résolus
              </div>
              <div className="text-2xl font-black">{compte('resolu')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">
                Taux résolution
              </div>
              <div className="text-2xl font-black">{tauxResolution}%</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-200 mb-1">
              Décision rapide OU enquête approfondie
            </p>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Tu peux <strong>décider immédiatement</strong> (bannir / avertir
              / ignorer) ou <strong>enquêter</strong> en contactant les 2
              parties via WhatsApp avant de trancher.
            </p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            val: 'nouveau',
            label: '🚨 Nouveaux',
            count: compte('nouveau'),
          },
          {
            val: 'en_cours',
            label: '⏳ En cours',
            count: compte('en_cours'),
          },
          {
            val: 'resolu',
            label: '✅ Résolus',
            count: compte('resolu'),
          },
          {
            val: 'ignore',
            label: '⚪ Ignorés',
            count: compte('ignore'),
          },
          { val: 'tous', label: '📋 Tous', count: signalements.length },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val as Onglet)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
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
            placeholder="Rechercher par nom ou motif..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="recent">Trier : Plus récent</option>
          <option value="ancien">Plus ancien</option>
          <option value="type">Par type</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
          />
        </div>
      ) : signalementsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucun signalement
          </h3>
          <p className="text-slate-400 text-sm">
            Aucun signalement dans cette catégorie. Belle ambiance !
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {signalementsFiltres.map((s, i) => {
            const statutInfo = labelsStatut[s.statut] || labelsStatut.nouveau
            const typeLabel = labelsType[s.type] || s.type

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  s.statut === 'nouveau'
                    ? 'bg-red-500/10 border-red-500/40'
                    : 'bg-slate-800/70 border-white/10 hover:border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Icône */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0 ${
                      s.statut === 'nouveau'
                        ? 'bg-gradient-to-br from-red-500 to-orange-600 animate-pulse'
                        : s.statut === 'en_cours'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : s.statut === 'resolu'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-slate-500 to-slate-600'
                    }`}
                  >
                    {s.statut === 'nouveau'
                      ? '🚨'
                      : s.statut === 'en_cours'
                      ? '⏳'
                      : s.statut === 'resolu'
                      ? '✅'
                      : '⚪'}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statutInfo.couleur}`}
                      >
                        {statutInfo.emoji} {statutInfo.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-slate-700 text-slate-300">
                        {typeLabel}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formaterDate(s.created_at)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      {/* Signaleur */}
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="text-[10px] text-blue-300 font-black uppercase mb-1">
                          👤 SIGNALÉ PAR
                        </div>
                        <div className="font-bold text-white text-sm">
                          {s.signale_par_nom}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📧 {s.signale_par_email}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📞 {s.signale_par_tel}
                        </div>
                      </div>

                      {/* Cible */}
                      <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                        <div className="text-[10px] text-red-300 font-black uppercase mb-1">
                          🎯 CIBLE ({s.cible_role})
                        </div>
                        <div className="font-bold text-white text-sm">
                          {s.cible_nom}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📧 {s.cible_email}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📞 {s.cible_tel}
                        </div>
                      </div>
                    </div>

                    {/* Motif */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-[10px] text-slate-500 font-black mb-1">
                        📝 MOTIF
                      </div>
                      <p className="text-xs text-slate-300 italic whitespace-pre-line leading-relaxed line-clamp-3">
                        {s.motif}
                      </p>
                    </div>

                    {/* Résolution */}
                    {s.resolution && (
                      <div className="mt-3 bg-emerald-500/10 border-l-4 border-emerald-500 p-3 rounded-xl">
                        <div className="text-[10px] text-emerald-300 font-black mb-1">
                          ✅ RÉSOLUTION
                        </div>
                        <p className="text-xs text-emerald-100">
                          {s.resolution}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(s)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition-colors border border-white/20"
                    >
                      👁️ Détails
                    </button>

                    {s.statut === 'nouveau' && (
                      <button
                        onClick={() => mettreEnCours(s)}
                        className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl font-bold text-xs border border-amber-500/30 hover:bg-amber-500/30"
                      >
                        ⏳ Enquêter
                      </button>
                    )}

                    {['nouveau', 'en_cours'].includes(s.statut) && (
                      <button
                        onClick={() => {
                          setDecision(s)
                          setActionChoisie(null)
                          setMotifAction('')
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-bold text-xs shadow-lg"
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
              <div className="bg-gradient-to-r from-red-600 to-orange-700 p-6 rounded-t-3xl sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    🚨 Détail du signalement
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
                {/* Type + Statut */}
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-black border ${
                      labelsStatut[detail.statut]?.couleur
                    }`}
                  >
                    {labelsStatut[detail.statut]?.emoji}{' '}
                    {labelsStatut[detail.statut]?.label}
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full font-black bg-slate-700 text-slate-200">
                    {labelsType[detail.type] || detail.type}
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full font-black bg-slate-700 text-slate-200">
                    📅 {formaterDate(detail.created_at)}
                  </span>
                </div>

                {/* Signaleur */}
                <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-xs font-black text-blue-300 mb-2">
                    👤 SIGNALÉ PAR
                  </div>
                  <div className="text-white font-bold mb-1">
                    {detail.signale_par_nom}
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.signale_par_email}</div>
                    <div>📞 {detail.signale_par_tel}</div>
                    <div>💬 {detail.signale_par_whatsapp}</div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {detail.signale_par_whatsapp !== '—' && (
                      <a
                        href={`https://wa.me/${detail.signale_par_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {detail.signale_par_tel !== '—' && (
                      <a
                        href={`tel:${detail.signale_par_tel.replace(/\D/g, '')}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        📞 Appeler
                      </a>
                    )}
                  </div>
                </div>

                {/* Cible */}
                <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30">
                  <div className="text-xs font-black text-red-300 mb-2">
                    🎯 CIBLE — {detail.cible_role?.toUpperCase()}
                  </div>
                  <div className="text-white font-bold mb-1">
                    {detail.cible_nom}
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.cible_email}</div>
                    <div>📞 {detail.cible_tel}</div>
                    <div>💬 {detail.cible_whatsapp}</div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {detail.cible_whatsapp !== '—' && (
                      <a
                        href={`https://wa.me/${detail.cible_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {detail.cible_tel !== '—' && (
                      <a
                        href={`tel:${detail.cible_tel.replace(/\D/g, '')}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        📞 Appeler
                      </a>
                    )}
                  </div>
                </div>

                {/* Motif */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-2">
                    📝 MOTIF COMPLET
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                    {detail.motif}
                  </p>
                </div>

                {/* Résolution */}
                {detail.resolution && (
                  <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
                    <div className="text-xs font-black text-emerald-300 mb-2">
                      ✅ RÉSOLUTION
                    </div>
                    <p className="text-sm text-emerald-100">
                      {detail.resolution}
                    </p>
                  </div>
                )}

                {/* Note interne */}
                <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
                  <div className="text-xs font-black text-purple-300 mb-2">
                    🔒 NOTE INTERNE
                  </div>
                  <textarea
                    value={noteInterne}
                    onChange={(e) => setNoteInterne(e.target.value)}
                    rows={3}
                    placeholder="Notes privées (enquête, contacts, observations...)"
                    className="w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-xl text-white text-xs outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3 sticky bottom-0 bg-slate-800">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20"
                >
                  Fermer
                </button>
                {['nouveau', 'en_cours'].includes(detail.statut) && (
                  <button
                    onClick={() => {
                      setDecision(detail)
                      setDetail(null)
                      setActionChoisie(null)
                      setMotifAction('')
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-600 shadow-lg"
                  >
                    ⚡ Décider maintenant
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
              <div className="bg-gradient-to-r from-red-600 to-orange-700 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      ⚡ Décision
                    </h2>
                    <p className="text-xs text-red-200 mt-1">
                      {decision.signale_par_nom} → {decision.cible_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDecision(null)
                      setActionChoisie(null)
                      setMotifAction('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {!actionChoisie ? (
                  <>
                    <p className="text-sm text-slate-300 font-bold">
                      Que veux-tu faire ?
                    </p>

                    {/* Bannir */}
                    <button
                      onClick={() => setActionChoisie('bannir')}
                      className="w-full p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/20 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🚫</span>
                        <div>
                          <div className="font-black text-white">
                            Bannir la cible
                          </div>
                          <div className="text-xs text-red-200">
                            Le compte sera définitivement suspendu
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Avertir */}
                    <button
                      onClick={() => setActionChoisie('avertir')}
                      className="w-full p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 hover:bg-amber-500/20 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <div className="font-black text-white">
                            Avertir
                          </div>
                          <div className="text-xs text-amber-200">
                            Envoyer un avertissement formel
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Ignorer */}
                    <button
                      onClick={() => setActionChoisie('ignorer')}
                      className="w-full p-4 rounded-2xl bg-slate-500/10 border-2 border-slate-500/30 hover:bg-slate-500/20 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚪</span>
                        <div>
                          <div className="font-black text-white">
                            Ignorer
                          </div>
                          <div className="text-xs text-slate-300">
                            Signalement non fondé
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Résolu */}
                    <button
                      onClick={() => setActionChoisie('resolu')}
                      className="w-full p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <div className="font-black text-white">
                            Marquer résolu
                          </div>
                          <div className="text-xs text-emerald-200">
                            Problème traité / résolu manuellement
                          </div>
                        </div>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setActionChoisie(null)
                        setMotifAction('')
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ← Retour aux choix
                    </button>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-xs text-slate-400">Action choisie</div>
                      <div className="font-black text-white text-sm mt-1">
                        {actionChoisie === 'bannir' && '🚫 Bannir la cible'}
                        {actionChoisie === 'avertir' && '⚠️ Avertir'}
                        {actionChoisie === 'ignorer' && '⚪ Ignorer'}
                        {actionChoisie === 'resolu' && '✅ Marquer résolu'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">
                        {actionChoisie === 'bannir' && 'Motif du bannissement *'}
                        {actionChoisie === 'avertir' && "Message d'avertissement *"}
                        {actionChoisie === 'ignorer' && "Pourquoi ignorer ? *"}
                        {actionChoisie === 'resolu' && 'Note de résolution'}
                      </label>
                      <textarea
                        value={motifAction}
                        onChange={(e) => setMotifAction(e.target.value)}
                        rows={5}
                        placeholder={
                          actionChoisie === 'bannir'
                            ? 'Ex : Comportement violent confirmé par 3 parents différents.'
                            : actionChoisie === 'avertir'
                            ? 'Ex : Ceci est un avertissement formel. Évitez les retards répétés.'
                            : actionChoisie === 'ignorer'
                            ? 'Ex : Signalement non fondé après vérification.'
                            : 'Ex : Problème résolu après médiation.'
                        }
                        className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white text-sm outline-none focus:border-red-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={appliquerAction}
                      disabled={action}
                      className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${
                        actionChoisie === 'bannir'
                          ? 'bg-gradient-to-r from-red-600 to-red-700'
                          : actionChoisie === 'avertir'
                          ? 'bg-gradient-to-r from-amber-600 to-orange-700'
                          : actionChoisie === 'ignorer'
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-700'
                      }`}
                    >
                      {action ? '⏳ Application...' : '✓ Confirmer'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}