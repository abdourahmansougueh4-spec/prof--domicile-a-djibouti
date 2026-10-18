'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Demande = {
  id: string
  parent_id: string
  parent_nom: string
  parent_email: string
  parent_telephone: string
  parent_whatsapp: string
  professeur_id: string
  prof_nom: string
  prof_email: string
  prof_telephone: string
  prof_whatsapp: string
  enfant_prenom: string | null
  matiere: string | null
  statut: string
  motif_refus: string | null
  nombre_enfants: number
  prix_souhaite: number | null
  prix_propose: number | null
  created_at: string
  updated_at: string
}

type FiltreStatut = 'toutes' | 'acceptees' | 'refusees'
type Periode = 'semaine' | 'mois' | 'trimestre' | 'tout'
type Tri = 'recent' | 'ancien' | 'prix_eleve' | 'prix_bas'

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminDemandesHistorique() {
  const supabase = createClient()

  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('toutes')
  const [periode, setPeriode] = useState<Periode>('tout')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [detail, setDetail] = useState<Demande | null>(null)
  const [exportEnCours, setExportEnCours] = useState(false)
  const [succes, setSucces] = useState('')
  const [derniereMaj, setDerniereMaj] = useState<Date>(new Date())

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, est_admin, banni')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin' || !profile.est_admin) {
        setErreur('Accès refusé.')
        setLoading(false)
        return
      }

      let query = supabase
        .from('demandes')
        .select('*')
        .in('statut', ['acceptee', 'refusee'])
        .order('created_at', { ascending: false })
        .limit(1000)

      const dateLimite = getDateLimite()
      if (dateLimite) {
        query = query.gte('created_at', dateLimite)
      }

      const { data, error } = await query
      if (error) throw error

      const complets: Demande[] = []

      for (const d of data || []) {
        const [parentRes, profRes, enfantRes] = await Promise.all([
          supabase.from('profiles').select('nom_complet, email, telephone, whatsapp').eq('id', d.parent_id).single(),
          supabase.from('profiles').select('nom_complet, email, telephone, whatsapp').eq('id', d.professeur_id).single(),
          d.enfant_id
            ? supabase.from('enfants').select('prenom').eq('id', d.enfant_id).single()
            : Promise.resolve({ data: null }),
        ])

        complets.push({
          id: d.id,
          parent_id: d.parent_id,
          parent_nom: parentRes.data?.nom_complet || 'Parent',
          parent_email: parentRes.data?.email || '—',
          parent_telephone: parentRes.data?.telephone || '—',
          parent_whatsapp: parentRes.data?.whatsapp || '—',
          professeur_id: d.professeur_id,
          prof_nom: profRes.data?.nom_complet || 'Prof',
          prof_email: profRes.data?.email || '—',
          prof_telephone: profRes.data?.telephone || '—',
          prof_whatsapp: profRes.data?.whatsapp || '—',
          enfant_prenom: enfantRes.data?.prenom || null,
          matiere: d.matiere || null,
          statut: d.statut,
          motif_refus: d.motif_refus || null,
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          prix_propose: d.prix_propose ? Number(d.prix_propose) : null,
          created_at: d.created_at,
          updated_at: d.updated_at || d.created_at,
        })
      }

      setDemandes(complets)
      setDerniereMaj(new Date())
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase, periode])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const getDateLimite = (): string | null => {
    const now = new Date()
    if (periode === 'semaine') {
      now.setDate(now.getDate() - 7)
      return now.toISOString()
    }
    if (periode === 'mois') {
      now.setMonth(now.getMonth() - 1)
      return now.toISOString()
    }
    if (periode === 'trimestre') {
      now.setMonth(now.getMonth() - 3)
      return now.toISOString()
    }
    return null
  }

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const demandesFiltrees = useMemo(() => {
    let resultat = demandes.filter((d) => {
      if (filtreStatut === 'acceptees' && d.statut !== 'acceptee') return false
      if (filtreStatut === 'refusees' && d.statut !== 'refusee') return false

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          d.parent_nom.toLowerCase().includes(r) ||
          d.prof_nom.toLowerCase().includes(r) ||
          d.parent_email.toLowerCase().includes(r) ||
          d.prof_email.toLowerCase().includes(r) ||
          d.matiere?.toLowerCase().includes(r) ||
          d.motif_refus?.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'recent') resultat.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    if (tri === 'prix_eleve') resultat.sort((a, b) => (b.prix_propose || b.prix_souhaite || 0) - (a.prix_propose || a.prix_souhaite || 0))
    if (tri === 'prix_bas') resultat.sort((a, b) => (a.prix_propose || a.prix_souhaite || 0) - (b.prix_propose || b.prix_souhaite || 0))

    return resultat
  }, [demandes, filtreStatut, recherche, tri])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const acceptees = demandes.filter((d) => d.statut === 'acceptee')
    const refusees = demandes.filter((d) => d.statut === 'refusee')
    const tauxAcceptation = demandes.length > 0
      ? Math.round((acceptees.length / demandes.length) * 100)
      : 0
    const montantTotal = acceptees.reduce((acc, d) => acc + (d.prix_propose || d.prix_souhaite || 0), 0)
    const prixMoyen = acceptees.length > 0 ? montantTotal / acceptees.length : 0

    return {
      total: demandes.length,
      acceptees: acceptees.length,
      refusees: refusees.length,
      tauxAcceptation,
      montantTotal,
      prixMoyen,
    }
  }, [demandes])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useCallback(
    (f: FiltreStatut) => {
      if (f === 'toutes') return demandes.length
      if (f === 'acceptees') return demandes.filter((d) => d.statut === 'acceptee').length
      if (f === 'refusees') return demandes.filter((d) => d.statut === 'refusee').length
      return 0
    },
    [demandes]
  )

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (demandesFiltrees.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = [
        'Date création', 'Date décision', 'Statut', 'Parent', 'Email Parent', 'Tel Parent',
        'Prof', 'Email Prof', 'Tel Prof', 'Enfant', 'Matière', 'Enfants',
        'Prix souhaité', 'Prix proposé', 'Motif refus',
      ]
      const rows = demandesFiltrees.map((d) => [
        new Date(d.created_at).toLocaleDateString('fr-FR'),
        new Date(d.updated_at).toLocaleDateString('fr-FR'),
        d.statut === 'acceptee' ? 'Acceptée' : 'Refusée',
        d.parent_nom, d.parent_email, d.parent_telephone,
        d.prof_nom, d.prof_email, d.prof_telephone,
        d.enfant_prenom || '', d.matiere || '', d.nombre_enfants,
        d.prix_souhaite || '', d.prix_propose || '',
        d.motif_refus || '',
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `historique-demandes-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export historique demandes : ${demandesFiltrees.length}`,
      })

      setSucces(`✅ ${demandesFiltrees.length} demandes exportées`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [demandesFiltrees, supabase])

  // ============================================================
  // RENDU
  // ============================================================

  if (erreur) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-white mb-2">Erreur d'accès</h2>
          <p className="text-red-200 text-sm mb-6">{erreur}</p>
          <button
            onClick={charger}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-sm shadow-lg"
          >
            🔄 Réessayer
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black mb-2">📜 Historique des demandes</h1>
              <p className="text-slate-200 text-sm">
                {demandes.length} demande{demandes.length > 1 ? 's' : ''} archivée{demandes.length > 1 ? 's' : ''} ·
                Maj : {derniereMaj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={charger}
                disabled={loading}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={exporterCSV}
                disabled={exportEnCours || demandesFiltrees.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-slate-300">Total</div>
              <div className="text-2xl font-black">{stats.total}</div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/40">
              <div className="text-[10px] font-black uppercase text-emerald-100">Acceptées</div>
              <div className="text-2xl font-black">{stats.acceptees}</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-400/40">
              <div className="text-[10px] font-black uppercase text-red-100">Refusées</div>
              <div className="text-2xl font-black">{stats.refusees}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-slate-300">Taux accept.</div>
              <div className="text-2xl font-black">{stats.tauxAcceptation}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-slate-300">Montant total</div>
              <div className="text-lg font-black">{stats.montantTotal.toLocaleString()} DJF</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MESSAGE SUCCÈS */}
      <AnimatePresence>
        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-xl">✅</span>
            <p className="text-emerald-200 text-sm font-bold">{succes}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRAPHIQUE RÉPARTITION */}
      {demandes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-5 border border-white/10"
        >
          <h3 className="text-sm font-black text-white mb-3">📊 Répartition</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-6 rounded-full overflow-hidden bg-slate-900 flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.tauxAcceptation}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-black text-white"
                >
                  {stats.tauxAcceptation > 10 && `${stats.tauxAcceptation}%`}
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - stats.tauxAcceptation}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-[10px] font-black text-white"
                >
                  {100 - stats.tauxAcceptation > 10 && `${100 - stats.tauxAcceptation}%`}
                </motion.div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-black">
                <span className="text-emerald-300">✅ Acceptées ({stats.acceptees})</span>
                <span className="text-red-300">❌ Refusées ({stats.refusees})</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* FILTRES PÉRIODE */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'semaine', label: '📅 7 jours' },
          { val: 'mois', label: '📆 30 jours' },
          { val: 'trimestre', label: '🗓️ 3 mois' },
          { val: 'tout', label: '🌍 Tout' },
        ].map((p) => (
          <button
            key={p.val}
            onClick={() => setPeriode(p.val as Periode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              periode === p.val
                ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* FILTRES STATUT */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { val: 'toutes', label: '📋 Toutes' },
            { val: 'acceptees', label: '✅ Acceptées' },
            { val: 'refusees', label: '❌ Refusées' },
          ] as { val: FiltreStatut; label: string }[]
        ).map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltreStatut(f.val)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtreStatut === f.val
                ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {f.label} ({compte(f.val)})
          </button>
        ))}
      </div>

      {/* RECHERCHE + TRI */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par parent, prof, matière ou motif..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 outline-none"
          />
          {recherche && (
            <button
              onClick={() => setRecherche('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
        >
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="prix_eleve">💰 Prix élevé</option>
          <option value="prix_bas">💰 Prix bas</option>
        </select>
      </div>

      {/* COMPTEUR */}
      {(recherche || filtreStatut !== 'toutes') && (
        <div className="text-sm text-slate-400">
          <span className="font-bold text-white">{demandesFiltrees.length}</span> résultat{demandesFiltrees.length > 1 ? 's' : ''}
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement de l'historique...</p>
        </div>
      ) : demandesFiltrees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📜</div>
          <h3 className="font-black text-white text-xl mb-2">
            {demandes.length === 0 ? 'Aucune demande archivée' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm">
            {demandes.length === 0 ? 'L\'historique se remplit au fur et à mesure.' : 'Aucune demande ne correspond à ces critères.'}
          </p>
          {(recherche || filtreStatut !== 'toutes') && (
            <button
              onClick={() => { setRecherche(''); setFiltreStatut('toutes') }}
              className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-xl font-bold text-sm"
            >
              ✕ Réinitialiser
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {demandesFiltrees.map((d, i) => {
            const acceptee = d.statut === 'acceptee'
            const prixFinal = d.prix_propose || d.prix_souhaite
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.3) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  acceptee
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                    : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0 ${
                    acceptee
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-red-500 to-rose-600'
                  }`}>
                    {acceptee ? '✅' : '❌'}
                  </div>

                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${
                        acceptee
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {acceptee ? '✅ ACCEPTÉE' : '❌ REFUSÉE'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formaterDate(d.updated_at)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="text-[10px] text-blue-300 font-black uppercase mb-1">👨‍👩‍👧 Parent</div>
                        <div className="font-bold text-white text-sm">{d.parent_nom}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">📧 {d.parent_email}</div>
                        <div className="text-[10px] text-slate-400">📞 {d.parent_telephone}</div>
                      </div>

                      <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-300 font-black uppercase mb-1">👨‍🏫 Prof</div>
                        <div className="font-bold text-white text-sm">{d.prof_nom}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">📧 {d.prof_email}</div>
                        <div className="text-[10px] text-slate-400">📞 {d.prof_telephone}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">👶 ENFANTS</div>
                        <div className="text-white font-bold">{d.nombre_enfants}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">💰 PRIX</div>
                        <div className="text-white font-bold text-sm">
                          {prixFinal ? `${Number(prixFinal).toLocaleString()}` : '—'}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">📚 MATIÈRE</div>
                        <div className="text-white font-bold text-xs truncate">{d.matiere || '—'}</div>
                      </div>
                    </div>

                    {d.motif_refus && !acceptee && (
                      <div className="bg-red-500/10 border-l-4 border-red-500 rounded-lg p-2">
                        <div className="text-[9px] text-red-300 font-black uppercase mb-0.5">Motif du refus</div>
                        <p className="text-xs text-red-100 italic">{d.motif_refus}</p>
                      </div>
                    )}

                    {d.enfant_prenom && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                        👶 {d.enfant_prenom}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(d)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      👁️ Détails
                    </button>
                    {d.parent_whatsapp && d.parent_whatsapp !== '—' && (
                      <a
                        href={`https://wa.me/${d.parent_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 transition-colors text-center"
                      >
                        💬 Parent
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* INFO BAS */}
      {!loading && demandesFiltrees.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? 's' : ''} affichée{demandesFiltrees.length > 1 ? 's' : ''}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-white/10 my-8"
            >
              <div className={`p-6 rounded-t-3xl ${
                detail.statut === 'acceptee'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-r from-red-600 to-rose-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {detail.statut === 'acceptee' ? '✅ Demande acceptée' : '❌ Demande refusée'}
                    </h2>
                    <p className="text-xs text-white/80 mt-1">
                      Décision prise le {formaterDate(detail.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-xs font-black text-blue-300 mb-2">👨‍👩‍👧 PARENT</div>
                  <div className="text-white font-bold mb-1">{detail.parent_nom}</div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.parent_email}</div>
                    <div>📞 {detail.parent_telephone}</div>
                    <div>💬 {detail.parent_whatsapp}</div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
                  <div className="text-xs font-black text-emerald-300 mb-2">👨‍🏫 PROFESSEUR</div>
                  <div className="text-white font-bold mb-1">{detail.prof_nom}</div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.prof_email}</div>
                    <div>📞 {detail.prof_telephone}</div>
                    <div>💬 {detail.prof_whatsapp}</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">📋 DÉTAILS</div>
                  <div className="text-xs text-slate-300 space-y-2">
                    <div><strong className="text-white">Créée le :</strong> {formaterDate(detail.created_at)}</div>
                    <div><strong className="text-white">Décidée le :</strong> {formaterDate(detail.updated_at)}</div>
                    <div><strong className="text-white">Enfant :</strong> {detail.enfant_prenom || '—'}</div>
                    <div><strong className="text-white">Enfants :</strong> {detail.nombre_enfants}</div>
                    <div><strong className="text-white">Matière :</strong> {detail.matiere || '—'}</div>
                    {detail.prix_souhaite && (
                      <div><strong className="text-white">Prix souhaité :</strong> {Number(detail.prix_souhaite).toLocaleString()} DJF</div>
                    )}
                    {detail.prix_propose && (
                      <div><strong className="text-amber-300">Prix proposé :</strong> {Number(detail.prix_propose).toLocaleString()} DJF</div>
                    )}
                  </div>
                </div>

                {detail.motif_refus && (
                  <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30">
                    <div className="text-xs font-black text-red-300 mb-2">❌ Motif du refus</div>
                    <p className="text-sm text-red-100 italic whitespace-pre-line">
                      {detail.motif_refus}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10">
                <button
                  onClick={() => setDetail(null)}
                  className="w-full py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}