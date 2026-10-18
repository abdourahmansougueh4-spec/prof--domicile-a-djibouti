'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Demande = {
  id: string
  parent_id: string
  parent_nom: string
  parent_quartier: string | null
  matiere: string | null
  message: string | null
  statut: string
  nombre_enfants: number
  prix_souhaite: number | null
  niveaux_souhaites: string[]
  creneaux_souhaites: string[]
  pre_decision: string | null
  created_at: string
  updated_at: string
}

type Filtre = 'urgentes' | 'en_attente' | 'pre_acceptee' | 'acceptee' | 'toutes'
type Tri = 'recent' | 'ancien' | 'prix_eleve' | 'prix_bas' | 'urgentes'

const labelsStatut: { [k: string]: { label: string; couleur: string; emoji: string } } = {
  en_attente: { label: 'En attente', couleur: 'bg-amber-100 text-amber-800 border-amber-300', emoji: '⏳' },
  pre_acceptee: { label: 'Vous avez accepté', couleur: 'bg-blue-100 text-blue-800 border-blue-300', emoji: '👍' },
  pre_refusee: { label: 'Vous avez refusé', couleur: 'bg-orange-100 text-orange-800 border-orange-300', emoji: '👎' },
  acceptee: { label: 'Acceptée', couleur: 'bg-emerald-100 text-emerald-800 border-emerald-300', emoji: '✅' },
  refusee: { label: 'Refusée', couleur: 'bg-red-100 text-red-800 border-red-300', emoji: '❌' },
}

const labelsMatieres: { [k: string]: string } = {
  primaire_fr: 'Primaire FR', primaire_ar: 'Primaire AR', college_maths: 'Collège Maths',
  college_physique: 'Collège Physique', college_svt: 'Collège SVT', college_francais: 'Collège Français',
  college_anglais: 'Collège Anglais', college_arabe: 'Collège Arabe', lycee_maths: 'Lycée Maths',
  arabe: 'Arabe', coran: 'Coran', francais: 'Français', anglais: 'Anglais',
}

const labelsNiveaux: { [k: string]: string } = {
  primaire: '🎒 Primaire', college: '📖 Collège', lycee: '🎓 Lycée',
}

const estUrgente = (d: Demande): boolean => {
  if (d.statut !== 'en_attente' && d.statut !== 'pre_acceptee') return false
  return (Date.now() - new Date(d.created_at).getTime()) / 3600000 > 24
}

const tempsDepuisCreation = (d: Demande): string => {
  const h = (Date.now() - new Date(d.created_at).getTime()) / 3600000
  if (h < 1) return 'À l\'instant'
  if (h < 24) return `Il y a ${Math.floor(h)}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

const genererConseils = (demandes: Demande[]) => {
  const c: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []
  const enAttente = demandes.filter((d) => d.statut === 'en_attente')
  const urgentes = demandes.filter(estUrgente)
  if (urgentes.length > 0) c.push({ emoji: '🚨', texte: `${urgentes.length} demande(s) urgente(s) ! Répondez vite.`, priorite: 'haute' })
  if (enAttente.length > 0 && enAttente.length <= 3) c.push({ emoji: '📥', texte: `${enAttente.length} demande(s) en attente. Répondez rapidement.`, priorite: 'moyenne' })
  if (enAttente.length === 0 && demandes.length > 0) c.push({ emoji: '✨', texte: 'Bravo ! Toutes traitées.', priorite: 'basse' })
  return c.sort((a, b) => {
    const o = { haute: 0, moyenne: 1, basse: 2 }
    return o[a.priorite] - o[b.priorite]
  }).slice(0, 4)
}

export default function DemandesProfesseur() {
  const supabase = createClient()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [action, setAction] = useState(false)
  const [filtre, setFiltre] = useState<Filtre>('urgentes')
  const [tri, setTri] = useState<Tri>('urgentes')
  const [recherche, setRecherche] = useState('')
  const [detail, setDetail] = useState<Demande | null>(null)
  const [confirmation, setConfirmation] = useState<{ demande: Demande; action: 'pre_acceptee' | 'pre_refusee' } | null>(null)
  const [motifRefus, setMotifRefus] = useState('')

  const charger = useCallback(async () => {
    setLoading(true); setErreur('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setErreur('Session expirée.'); setLoading(false); return }
      const { data, error } = await supabase.from('demandes').select('*').eq('professeur_id', user.id).order('created_at', { ascending: false })
      if (error) {
        console.error('Erreur demandes:', JSON.stringify(error, null, 2))
        setErreur('Impossible de charger. Réessayez.')
        setLoading(false); return
      }
      const complets: Demande[] = []
      for (const d of data || []) {
        let parent: any = null
        try {
          const { data: p } = await supabase.from('profiles').select('nom_complet, quartier').eq('id', d.parent_id).single()
          parent = p
        } catch (e) { console.error('Parent:', e) }
        complets.push({
          id: d.id, parent_id: d.parent_id,
          parent_nom: parent?.nom_complet || 'Parent',
          parent_quartier: parent?.quartier || null,
          matiere: d.matiere || null, message: d.message || null,
          statut: d.statut || 'en_attente',
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          niveaux_souhaites: d.niveaux_souhaites || [],
          creneaux_souhaites: d.creneaux_souhaites || [],
          pre_decision: d.pre_decision || null,
          created_at: d.created_at, updated_at: d.updated_at || d.created_at,
        })
      }
      setDemandes(complets)
    } catch (err: any) {
      console.error('Erreur charger:', err)
      setErreur('Impossible de charger. Réessayez.')
    } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { charger() }, [charger])

  const preDecider = async () => {
    if (!confirmation) return
    if (confirmation.action === 'pre_refusee' && !motifRefus.trim()) { setErreur('Motif requis'); return }
    setAction(true); setErreur('')
    try {
      const update: any = { pre_decision: confirmation.action, statut: confirmation.action, updated_at: new Date().toISOString() }
      if (confirmation.action === 'pre_refusee' && motifRefus.trim()) update.motif_refus = motifRefus.trim()
      const { error } = await supabase.from('demandes').update(update).eq('id', confirmation.demande.id)
      if (error) {
        console.error('Erreur update:', JSON.stringify(error, null, 2))
        setErreur(`Erreur: ${error.message}`)
        setAction(false); return
      }
      try {
        await supabase.from('admin_logs').insert({
          action: 'pre_decision_prof',
          details: `${confirmation.demande.parent_nom} → ${confirmation.action}`,
        })
      } catch (e) { console.error('Log:', e) }
      setSucces(confirmation.action === 'pre_acceptee' ? '✅ Vous avez accepté !' : '✅ Refus enregistré')
      setTimeout(() => setSucces(''), 4000)
      setConfirmation(null); setMotifRefus(''); setDetail(null)
      await charger()
    } catch (err: any) {
      console.error('Erreur preDecider:', err)
      setErreur('Erreur. Réessayez.')
    } finally { setAction(false) }
  }

  const annulerPreDecision = async (d: Demande) => {
    if (!confirm('Annuler votre pré-décision ?')) return
    setAction(true); setErreur('')
    try {
      const { error } = await supabase.from('demandes').update({ pre_decision: null, statut: 'en_attente', motif_refus: null, updated_at: new Date().toISOString() }).eq('id', d.id)
      if (error) {
        console.error('Erreur:', JSON.stringify(error, null, 2))
        setErreur(`Erreur: ${error.message}`)
        setAction(false); return
      }
      setSucces('✅ Pré-décision annulée'); setTimeout(() => setSucces(''), 3000)
      setDetail(null); await charger()
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur('Erreur. Réessayez.')
    } finally { setAction(false) }
  }

  const demandesFiltrees = useMemo(() => {
    let r = demandes.filter((d) => {
      if (filtre === 'urgentes' && !estUrgente(d)) return false
      if (filtre === 'en_attente' && d.statut !== 'en_attente') return false
      if (filtre === 'pre_acceptee' && d.statut !== 'pre_acceptee') return false
      if (filtre === 'acceptee' && d.statut !== 'acceptee') return false
      if (recherche.trim()) {
        const s = recherche.toLowerCase().trim()
        return d.parent_nom.toLowerCase().includes(s) || d.parent_quartier?.toLowerCase().includes(s) || d.matiere?.toLowerCase().includes(s) || d.message?.toLowerCase().includes(s)
      }
      return true
    })
    if (tri === 'urgentes') r.sort((a, b) => {
      const ua = estUrgente(a) ? 1 : 0, ub = estUrgente(b) ? 1 : 0
      if (ua !== ub) return ub - ua
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    if (tri === 'recent') r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien') r.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'prix_eleve') r.sort((a, b) => (b.prix_souhaite || 0) - (a.prix_souhaite || 0))
    if (tri === 'prix_bas') r.sort((a, b) => (a.prix_souhaite || 0) - (b.prix_souhaite || 0))
    return r
  }, [demandes, filtre, tri, recherche])

  const compte = useMemo(() => ({
    urgente: demandes.filter(estUrgente).length,
    en_attente: demandes.filter((d) => d.statut === 'en_attente').length,
    pre_acceptee: demandes.filter((d) => d.statut === 'pre_acceptee').length,
    acceptee: demandes.filter((d) => d.statut === 'acceptee').length,
    total: demandes.length,
  }), [demandes])

  const statsPerso = useMemo(() => {
    const traitees = demandes.filter((d) => d.statut !== 'en_attente')
    const acceptees = demandes.filter((d) => d.statut === 'acceptee' || d.statut === 'pre_acceptee')
    return { traitees: traitees.length, acceptees: acceptees.length, taux: traitees.length > 0 ? Math.round((acceptees.length / traitees.length) * 100) : 0 }
  }, [demandes])

  const conseils = useMemo(() => genererConseils(demandes), [demandes])

  const formaterDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const formaterPrix = (n: number) => n.toLocaleString('fr-FR')

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-14 h-14 border-4 border-blue-700 border-t-transparent rounded-full" />
      <p className="text-slate-500 text-sm">Chargement...</p>
    </div>
  )

  if (erreur && demandes.length === 0) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border-2 border-red-200 rounded-3xl p-8 max-w-md text-center shadow-xl">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Erreur</h2>
        <p className="text-red-700 text-sm mb-6">{erreur}</p>
        <button onClick={charger} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-sm">🔄 Réessayer</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-10">
      <Link href="/espace-professeur" className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1">← Retour</Link>

      {/* HERO ULTRA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
        <motion.div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-pink-300/20 rounded-full blur-3xl" animate={{ x: [0, 40, 0], y: [0, -40, 0] }} transition={{ duration: 12, repeat: Infinity }} />
        <motion.div className="absolute bottom-[-80px] left-[-80px] w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity }} />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30 mb-3">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Demandes en direct
              </div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">📥 Demandes reçues</h1>
                {compte.urgente > 0 && (
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1 rounded-full text-xs font-black text-white shadow-lg">🚨 {compte.urgente} urgente{compte.urgente > 1 ? 's' : ''}</motion.span>
                )}
              </div>
              <p className="text-blue-100 text-sm">{compte.total} demande{compte.total > 1 ? 's' : ''} · Taux accept. {statsPerso.taux}%</p>
            </div>
            <button onClick={charger} disabled={loading} className="px-5 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all text-sm disabled:opacity-50">🔄 Actualiser</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Urgentes', val: compte.urgente, emoji: '🚨', color: 'from-red-400/30 to-orange-600/30' },
              { label: 'En attente', val: compte.en_attente, emoji: '⏳', color: 'from-amber-400/30 to-yellow-600/30' },
              { label: 'Acceptées', val: compte.pre_acceptee, emoji: '👍', color: 'from-blue-400/30 to-indigo-600/30' },
              { label: 'Validées', val: compte.acceptee, emoji: '✅', color: 'from-emerald-400/30 to-teal-600/30' },
              { label: 'Total', val: compte.total, emoji: '📊', color: 'from-purple-400/30 to-pink-600/30' },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className={`bg-gradient-to-br ${k.color} backdrop-blur-md rounded-2xl p-3 border border-white/30`}>
                <div className="text-[10px] font-black uppercase text-white/80 mb-1">{k.emoji} {k.label}</div>
                <div className="text-2xl font-black text-white">{k.val}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {succes && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
            <span className="text-2xl">🎉</span>
            <p className="text-emerald-800 text-sm font-bold flex-1">{succes}</p>
          </motion.div>
        )}
        {erreur && demandes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-700 text-sm font-medium flex-1">{erreur}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {([
          { val: 'urgentes', label: '🚨 Urgentes', count: compte.urgente, color: 'from-red-500 to-orange-600' },
          { val: 'en_attente', label: '⏳ En attente', count: compte.en_attente, color: 'from-amber-500 to-yellow-600' },
          { val: 'pre_acceptee', label: '👍 Acceptées', count: compte.pre_acceptee, color: 'from-blue-500 to-indigo-600' },
          { val: 'acceptee', label: '✅ Validées', count: compte.acceptee, color: 'from-emerald-500 to-teal-600' },
          { val: 'toutes', label: '📋 Toutes', count: compte.total, color: 'from-slate-700 to-slate-900' },
        ] as any[]).map((f) => (
          <button key={f.val} onClick={() => setFiltre(f.val)} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${filtre === f.val ? `bg-gradient-to-r ${f.color} text-white shadow-lg scale-105` : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher..." className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium" />
        </div>
        <select value={tri} onChange={(e) => setTri(e.target.value as Tri)} className="px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-bold focus:border-blue-500 outline-none cursor-pointer">
          <option value="urgentes">🚨 Urgentes</option>
          <option value="recent">📅 Récent</option>
          <option value="ancien">📅 Ancien</option>
          <option value="prix_eleve">💰 Prix ↑</option>
          <option value="prix_bas">💰 Prix ↓</option>
        </select>
      </div>

      <div className="text-sm text-slate-500"><span className="font-black text-slate-900">{demandesFiltrees.length}</span> résultat{demandesFiltrees.length > 1 ? 's' : ''}</div>

      {demandesFiltrees.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-12 border-2 border-dashed border-blue-300 text-center">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-7xl mb-4">📭</motion.div>
          <h3 className="font-black text-slate-900 text-2xl mb-2">{demandes.length === 0 ? 'Aucune demande' : 'Aucun résultat'}</h3>
          <p className="text-slate-500 text-sm mb-6">{demandes.length === 0 ? 'Vous n\'avez pas encore reçu de demandes.' : 'Essayez d\'autres filtres.'}</p>
          {filtre !== 'toutes' && demandes.length > 0 && (
            <button onClick={() => setFiltre('toutes')} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm">Voir toutes</button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {demandesFiltrees.map((d, i) => {
            const s = labelsStatut[d.statut] || labelsStatut.en_attente
            const urgent = estUrgente(d)
            const peutDecider = d.statut === 'en_attente'
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} whileHover={{ y: -3 }} className={`relative rounded-3xl p-5 border-2 transition-all overflow-hidden shadow-lg hover:shadow-2xl ${urgent ? 'bg-gradient-to-br from-red-50 via-orange-50 to-white border-red-300' : d.statut === 'acceptee' ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-300' : d.statut === 'pre_acceptee' ? 'bg-gradient-to-br from-blue-50 to-white border-blue-300' : 'bg-white border-slate-200'}`}>
                {urgent && (
                  <motion.div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                )}

                <div className="flex items-start gap-4 flex-wrap">
                  <motion.div whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl flex-shrink-0 ${urgent ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                    {urgent ? '🚨' : '👨‍👩‍👧'}
                  </motion.div>

                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${s.couleur}`}>{s.emoji} {s.label.toUpperCase()}</span>
                      {urgent && (
                        <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md">🚨 {tempsDepuisCreation(d)}</motion.span>
                      )}
                      {!urgent && <span className="text-[10px] text-slate-500">⏱️ {tempsDepuisCreation(d)}</span>}
                    </div>

                    <h3 className="font-black text-slate-900 text-lg mb-1">{d.parent_nom}</h3>
                    <div className="text-xs text-slate-500 space-y-0.5 mb-3">
                      {d.parent_quartier && <div>📍 {d.parent_quartier}</div>}
                      <div>📅 {formaterDate(d.created_at)}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200">
                        <div className="text-[9px] text-slate-500 font-black">👶 ENFANTS</div>
                        <div className="text-slate-900 font-black text-lg">{d.nombre_enfants}</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
                        <div className="text-[9px] text-amber-700 font-black">💰 PRIX</div>
                        <div className="text-slate-900 font-black text-base">{d.prix_souhaite ? formaterPrix(d.prix_souhaite) : '—'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
                        <div className="text-[9px] text-blue-700 font-black">📚 MATIÈRE</div>
                        <div className="text-slate-900 font-black text-xs truncate">{d.matiere ? labelsMatieres[d.matiere] || d.matiere : '—'}</div>
                      </div>
                    </div>

                    {d.niveaux_souhaites.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {d.niveaux_souhaites.slice(0, 4).map((n) => (
                          <span key={n} className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">{labelsNiveaux[n] || n}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDetail(d)} className="px-5 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 rounded-xl font-bold text-xs border border-slate-300 shadow-sm">👁️ Détails</motion.button>
                    {peutDecider && (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setConfirmation({ demande: d, action: 'pre_acceptee' })} disabled={action} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50">{action ? '⏳' : '👍 Accepter'}</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setConfirmation({ demande: d, action: 'pre_refusee' }); setMotifRefus('') }} disabled={action} className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50">👎 Refuser</motion.button>
                      </>
                    )}
                    {d.statut === 'pre_acceptee' && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => annulerPreDecision(d)} disabled={action} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50">↩️ Annuler</motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {demandes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 rounded-3xl p-6 border-2 border-blue-200 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">📊</div>
            <div><h3 className="font-black text-slate-900 text-lg">Mes performances</h3><p className="text-xs text-slate-600">Basé sur vos demandes traitées</p></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border-2 border-blue-200 shadow-md"><div className="text-[10px] font-black text-blue-700 uppercase">Traitées</div><div className="text-3xl font-black text-slate-900">{statsPerso.traitees}</div></div>
            <div className="bg-white rounded-2xl p-4 border-2 border-emerald-200 shadow-md"><div className="text-[10px] font-black text-emerald-700 uppercase">Acceptées</div><div className="text-3xl font-black text-slate-900">{statsPerso.acceptees}</div></div>
            <div className="bg-white rounded-2xl p-4 border-2 border-purple-200 shadow-md"><div className="text-[10px] font-black text-purple-700 uppercase">Taux</div><div className="text-3xl font-black text-slate-900">{statsPerso.taux}%</div></div>
          </div>
        </motion.div>
      )}

      {conseils.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 rounded-3xl p-6 border-2 border-purple-200 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-3xl shadow-lg">🤖</motion.div>
            <div><h3 className="font-black text-slate-900 text-lg">Coach IA</h3><p className="text-xs text-slate-600">Conseils personnalisés</p></div>
          </div>
          <div className="space-y-2">
            {conseils.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className={`rounded-xl p-3 border-2 flex items-start gap-3 shadow-sm ${c.priorite === 'haute' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' : c.priorite === 'moyenne' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' : 'bg-white border-purple-100'}`}>
                <span className="text-2xl flex-shrink-0">{c.emoji}</span>
                <p className="text-sm text-slate-800 font-medium flex-1">{c.texte}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setDetail(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(ev) => ev.stopPropagation()} className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl font-black text-white">📩 Détail</h2><p className="text-xs text-indigo-100 mt-1">⏱️ {tempsDepuisCreation(detail)}</p></div>
                  <button onClick={() => setDetail(null)} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                  <div className="text-xs font-black text-blue-700 mb-2">👨‍👩‍👧 PARENT</div>
                  <div className="text-slate-900 font-black text-lg">{detail.parent_nom}</div>
                  {detail.parent_quartier && <div className="text-xs text-slate-600 mt-1">📍 {detail.parent_quartier}</div>}
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border-2 border-slate-200">
                  <div className="text-xs font-black text-slate-700 mb-3">📋 DÉTAILS</div>
                  <div className="text-sm text-slate-700 space-y-2">
                    <div><strong>Enfants :</strong> {detail.nombre_enfants}</div>
                    <div><strong>Matière :</strong> {detail.matiere ? labelsMatieres[detail.matiere] || detail.matiere : '—'}</div>
                    <div><strong>Prix :</strong> {detail.prix_souhaite ? `${formaterPrix(detail.prix_souhaite)} DJF` : '—'}</div>
                  </div>
                </div>
                {detail.message && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                    <div className="text-xs font-black text-purple-700 mb-2">💬 MESSAGE</div>
                    <p className="text-sm text-slate-700 italic whitespace-pre-line">« {detail.message} »</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 flex-wrap">
                <button onClick={() => setDetail(null)} className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200">Fermer</button>
                {detail.statut === 'en_attente' && (
                  <>
                    <button onClick={() => { setConfirmation({ demande: detail, action: 'pre_refusee' }); setMotifRefus(''); setDetail(null) }} className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-600">👎 Refuser</button>
                    <button onClick={() => { setConfirmation({ demande: detail, action: 'pre_acceptee' }); setDetail(null) }} className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg">👍 Accepter</button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMATION */}
      <AnimatePresence>
        {confirmation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => { setConfirmation(null); setMotifRefus('') }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(ev) => ev.stopPropagation()} className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
              <div className={`p-6 ${confirmation.action === 'pre_acceptee' ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl font-black text-white">{confirmation.action === 'pre_acceptee' ? '👍 Accepter' : '👎 Refuser'}</h2><p className="text-xs text-white/80 mt-1">{confirmation.demande.parent_nom}</p></div>
                  <button onClick={() => { setConfirmation(null); setMotifRefus('') }} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className={`border-l-4 p-4 rounded-xl ${confirmation.action === 'pre_acceptee' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-500'}`}>
                  <p className={`text-xs font-medium ${confirmation.action === 'pre_acceptee' ? 'text-emerald-800' : 'text-red-800'}`}>
                    {confirmation.action === 'pre_acceptee' ? '✅ Votre pré-acceptation sera transmise à notre équipe.' : '⚠️ Le parent recevra un refus avec votre motif.'}
                  </p>
                </div>
                {confirmation.action === 'pre_refusee' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Motif <span className="text-red-500">*</span></label>
                    <textarea value={motifRefus} onChange={(e) => setMotifRefus(e.target.value)} rows={4} maxLength={300} placeholder="Ex : Tarif trop bas..." className="w-full px-4 py-3 bg-white border-2 border-red-300 rounded-xl text-slate-900 outline-none focus:border-red-500 resize-none text-sm" />
                    <p className="text-xs text-slate-500 mt-1">{motifRefus.length}/300</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setConfirmation(null); setMotifRefus('') }} disabled={action} className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 border-2 border-slate-200 disabled:opacity-50">Annuler</button>
                  <button onClick={preDecider} disabled={action || (confirmation.action === 'pre_refusee' && !motifRefus.trim())} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${confirmation.action === 'pre_acceptee' ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
                    {action ? '⏳' : '✓ Confirmer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}