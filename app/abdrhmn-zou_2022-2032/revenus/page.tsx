'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Paiement = {
  id: string
  parent_id: string | null
  professeur_id: string | null
  montant: number
  formule: string | null
  methode: string | null
  statut: string
  created_at: string
}

type MoisData = {
  cle: string          // '2026-10'
  label: string        // 'Oct 2026'
  total: number
  fraisProfs: number
  paiementsParents: number
  autres: number
  count: number
}

type Periode = 'mois' | 'trimestre' | 'semestre' | 'annee' | 'tout'
type Source = 'tous' | 'frais_profs' | 'parents'

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminRevenus() {
  const supabase = createClient()

  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [periode, setPeriode] = useState<Periode>('annee')
  const [source, setSource] = useState<Source>('tous')
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

      const { data, error } = await supabase
        .from('paiements')
        .select('id, parent_id, professeur_id, montant, formule, methode, statut, created_at')
        .eq('statut', 'valide')
        .order('created_at', { ascending: false })

      if (error) throw error

      const paiementsFormates: Paiement[] = (data || []).map((p) => ({
        id: p.id,
        parent_id: p.parent_id,
        professeur_id: p.professeur_id,
        montant: Number(p.montant) || 0,
        formule: p.formule || null,
        methode: p.methode || null,
        statut: p.statut || 'valide',
        created_at: p.created_at,
      }))

      setPaiements(paiementsFormates)
      setDerniereMaj(new Date())
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // FILTRE PAR PÉRIODE
  // ============================================================

  const paiementsFiltres = useMemo(() => {
    const now = new Date()
    let dateLimite: Date | null = null

    if (periode === 'mois') {
      dateLimite = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    } else if (periode === 'trimestre') {
      dateLimite = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    } else if (periode === 'semestre') {
      dateLimite = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    } else if (periode === 'annee') {
      dateLimite = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    }

    return paiements.filter((p) => {
      // Filtre source
      if (source === 'frais_profs' && !p.professeur_id) return false
      if (source === 'parents' && !p.parent_id) return false

      // Filtre période
      if (dateLimite && new Date(p.created_at) < dateLimite) return false

      return true
    })
  }, [paiements, periode, source])

  // ============================================================
  // STATS GLOBALES
  // ============================================================

  const statsGlobales = useMemo(() => {
    const total = paiementsFiltres.reduce((acc, p) => acc + p.montant, 0)

    // Mois en cours
    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1)
    const debutMoisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const finMoisPrecedent = new Date(now.getFullYear(), now.getMonth(), 0)

    const revenusMois = paiementsFiltres
      .filter((p) => new Date(p.created_at) >= debutMois)
      .reduce((acc, p) => acc + p.montant, 0)

    const revenusMoisPrecedent = paiementsFiltres
      .filter((p) => {
        const d = new Date(p.created_at)
        return d >= debutMoisPrecedent && d <= finMoisPrecedent
      })
      .reduce((acc, p) => acc + p.montant, 0)

    const evolution =
      revenusMoisPrecedent > 0
        ? Math.round(((revenusMois - revenusMoisPrecedent) / revenusMoisPrecedent) * 100)
        : 0

    // Moyenne mensuelle
    const moisUniques = new Set(
      paiementsFiltres.map((p) => {
        const d = new Date(p.created_at)
        return `${d.getFullYear()}-${d.getMonth()}`
      })
    )
    const moyenneMensuelle =
      moisUniques.size > 0 ? Math.round(total / moisUniques.size) : 0

    // Projection annuelle
    const projectionAnnuelle = moyenneMensuelle * 12

    return {
      total,
      revenusMois,
      revenusMoisPrecedent,
      evolution,
      moyenneMensuelle,
      projectionAnnuelle,
      count: paiementsFiltres.length,
    }
  }, [paiementsFiltres])

  // ============================================================
  // ÉVOLUTION MENSUELLE (12 derniers mois)
  // ============================================================

  const evolutionMensuelle = useMemo((): MoisData[] => {
    const moisData: { [k: string]: MoisData } = {}
    const now = new Date()

    // Initialiser les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      moisData[cle] = {
        cle,
        label,
        total: 0,
        fraisProfs: 0,
        paiementsParents: 0,
        autres: 0,
        count: 0,
      }
    }

    // Remplir avec les paiements
    paiements.forEach((p) => {
      const d = new Date(p.created_at)
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      if (moisData[cle]) {
        moisData[cle].total += p.montant
        moisData[cle].count++

        if (p.professeur_id && !p.parent_id) {
          moisData[cle].fraisProfs += p.montant
        } else if (p.parent_id) {
          moisData[cle].paiementsParents += p.montant
        } else {
          moisData[cle].autres += p.montant
        }
      }
    })

    return Object.values(moisData)
  }, [paiements])

  const maxMois = useMemo(
    () => Math.max(...evolutionMensuelle.map((m) => m.total), 1),
    [evolutionMensuelle]
  )

  // ============================================================
  // RÉPARTITION PAR SOURCE
  // ============================================================

  const repartition = useMemo(() => {
    let fraisProfs = 0
    let paiementsParents = 0
    let autres = 0

    paiementsFiltres.forEach((p) => {
      if (p.professeur_id && !p.parent_id) fraisProfs += p.montant
      else if (p.parent_id) paiementsParents += p.montant
      else autres += p.montant
    })

    const total = fraisProfs + paiementsParents + autres

    return {
      fraisProfs,
      paiementsParents,
      autres,
      total,
      partFraisProfs: total > 0 ? Math.round((fraisProfs / total) * 100) : 0,
      partParents: total > 0 ? Math.round((paiementsParents / total) * 100) : 0,
      partAutres: total > 0 ? Math.round((autres / total) * 100) : 0,
    }
  }, [paiementsFiltres])

  // ============================================================
  // TOP 10 PROFESSEURS
  // ============================================================

  const topProfs = useMemo(() => {
    const parProf: { [k: string]: { id: string; total: number; count: number } } = {}

    paiementsFiltres.forEach((p) => {
      if (!p.professeur_id) return
      if (!parProf[p.professeur_id]) {
        parProf[p.professeur_id] = { id: p.professeur_id, total: 0, count: 0 }
      }
      parProf[p.professeur_id].total += p.montant
      parProf[p.professeur_id].count++
    })

    return Object.values(parProf)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [paiementsFiltres])

  // ============================================================
  // TOP 10 MOIS
  // ============================================================

  const topMois = useMemo(() => {
    return [...evolutionMensuelle]
      .sort((a, b) => b.total - a.total)
      .filter((m) => m.total > 0)
      .slice(0, 10)
  }, [evolutionMensuelle])

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (paiementsFiltres.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = ['Date', 'Montant', 'Source', 'Formule', 'Méthode', 'Statut']
      const rows = paiementsFiltres.map((p) => [
        new Date(p.created_at).toLocaleDateString('fr-FR'),
        p.montant,
        p.professeur_id ? 'Frais prof' : p.parent_id ? 'Paiement parent' : 'Autre',
        p.formule || '',
        p.methode || '',
        p.statut,
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `revenus-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export revenus : ${paiementsFiltres.length} paiements`,
      })

      setSucces(`✅ ${paiementsFiltres.length} paiements exportés`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [paiementsFiltres, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterPrix = (n: number) => n.toLocaleString('fr-FR')

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
        className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black mb-2">📊 Revenus mensuels</h1>
              <p className="text-emerald-100 text-sm">
                {paiementsFiltres.length} paiement{paiementsFiltres.length > 1 ? 's' : ''} validé{paiementsFiltres.length > 1 ? 's' : ''} ·
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
                disabled={exportEnCours || paiementsFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Revenus du mois</div>
              <div className="text-2xl font-black">{formaterPrix(statsGlobales.revenusMois)}</div>
              <div className="text-[10px] text-emerald-200 mt-1">DJF</div>
              <div className={`text-[10px] font-black mt-1 ${
                statsGlobales.evolution >= 0 ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {statsGlobales.evolution >= 0 ? '📈' : '📉'} {statsGlobales.evolution >= 0 ? '+' : ''}
                {statsGlobales.evolution}% vs mois dernier
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Total période</div>
              <div className="text-2xl font-black">{formaterPrix(statsGlobales.total)}</div>
              <div className="text-[10px] text-emerald-200 mt-1">DJF</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Moyenne mensuelle</div>
              <div className="text-2xl font-black">{formaterPrix(statsGlobales.moyenneMensuelle)}</div>
              <div className="text-[10px] text-emerald-200 mt-1">DJF / mois</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Projection annuelle</div>
              <div className="text-2xl font-black">{formaterPrix(statsGlobales.projectionAnnuelle)}</div>
              <div className="text-[10px] text-emerald-200 mt-1">DJF / an</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MESSAGE SUCCÈS */}
      {succes && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <span className="text-xl">✅</span>
          <p className="text-emerald-200 text-sm font-bold">{succes}</p>
        </motion.div>
      )}

      {/* INFO */}
      <div className="bg-emerald-500/10 border-l-4 border-emerald-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-sm font-bold text-emerald-200 mb-1">
              Vue financière complète
            </p>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Tous les paiements <strong>validés</strong> apparaissent ici. Les frais profs (mensuels) et
              les paiements parents sont séparés pour analyser chaque source de revenus.
            </p>
          </div>
        </div>
      </div>

      {/* FILTRES PÉRIODE */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'mois', label: '📅 30 jours' },
          { val: 'trimestre', label: '📆 3 mois' },
          { val: 'semestre', label: '🗓️ 6 mois' },
          { val: 'annee', label: '📊 12 mois' },
          { val: 'tout', label: '🌍 Tout' },
        ].map((p) => (
          <button
            key={p.val}
            onClick={() => setPeriode(p.val as Periode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              periode === p.val
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* FILTRES SOURCE */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'tous', label: '💰 Toutes sources' },
          { val: 'frais_profs', label: '👨‍🏫 Frais profs' },
          { val: 'parents', label: '👨‍👩‍👧 Paiements parents' },
        ].map((s) => (
          <button
            key={s.val}
            onClick={() => setSource(s.val as Source)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              source === s.val
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* GRAPHIQUE ÉVOLUTION */}
      {!loading && evolutionMensuelle.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-lg font-black text-white">
              📈 Évolution mensuelle (12 derniers mois)
            </h2>
            <div className="flex gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-600" />
                <span className="text-slate-300">Total</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-1 h-48">
            {evolutionMensuelle.map((m, i) => (
              <div key={m.cle} className="flex-1 flex flex-col items-center group">
                <div
                  className="text-[9px] text-emerald-300 font-black mb-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`${formaterPrix(m.total)} DJF`}
                >
                  {m.total > 0 ? formaterPrix(m.total) : ''}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((m.total / maxMois) * 100, 2)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-500 rounded-t-lg hover:from-emerald-500 hover:to-teal-400 transition-all cursor-pointer relative"
                  title={`${m.label} : ${formaterPrix(m.total)} DJF (${m.count} paiements)`}
                />
                <div className="text-[9px] text-slate-400 mt-2 font-bold">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* RÉPARTITION PAR SOURCE */}
      {!loading && repartition.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-5">
            🥧 Répartition par source
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👨‍🏫</span>
                <span className="font-black text-emerald-300">Frais profs</span>
              </div>
              <div className="text-2xl font-black text-white">
                {formaterPrix(repartition.fraisProfs)}
              </div>
              <div className="text-xs text-emerald-200 mt-1">
                {repartition.partFraisProfs}% du total
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${repartition.partFraisProfs}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600"
                />
              </div>
            </div>

            <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👨‍👩‍👧</span>
                <span className="font-black text-blue-300">Paiements parents</span>
              </div>
              <div className="text-2xl font-black text-white">
                {formaterPrix(repartition.paiementsParents)}
              </div>
              <div className="text-xs text-blue-200 mt-1">
                {repartition.partParents}% du total
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${repartition.partParents}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                />
              </div>
            </div>

            <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💎</span>
                <span className="font-black text-purple-300">Autres</span>
              </div>
              <div className="text-2xl font-black text-white">
                {formaterPrix(repartition.autres)}
              </div>
              <div className="text-xs text-purple-200 mt-1">
                {repartition.partAutres}% du total
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${repartition.partAutres}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
                />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-4 border border-emerald-500/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm font-black text-emerald-200">💰 Total période</span>
              <span className="text-2xl font-black text-white">
                {formaterPrix(repartition.total)} DJF
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* TOP 10 PROFS */}
      {!loading && topProfs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-5">
            🏆 Top 10 profs contributeurs
          </h2>

          <div className="space-y-2">
            {topProfs.map((p, i) => {
              const pourcentage =
                statsGlobales.total > 0 ? (p.total / statsGlobales.total) * 100 : 0
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    i === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                      : i === 1
                      ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                      : i === 2
                      ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pourcentage}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {p.count} paiement{p.count > 1 ? 's' : ''} · {pourcentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">
                      {formaterPrix(p.total)}
                    </div>
                    <div className="text-[9px] text-slate-500">DJF</div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* TOP 10 MOIS */}
      {!loading && topMois.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-5">
            📅 Top 10 meilleurs mois
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {topMois.map((m, i) => (
              <div
                key={m.cle}
                className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-3"
              >
                <div className="text-2xl font-black text-slate-500">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-black text-white">{m.label}</div>
                  <div className="text-[10px] text-slate-400">
                    {m.count} paiement{m.count > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-emerald-300">
                    {formaterPrix(m.total)}
                  </div>
                  <div className="text-[9px] text-slate-500">DJF</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* MESSAGE VIDE */}
      {!loading && paiementsFiltres.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">💰</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucun revenu sur cette période
          </h3>
          <p className="text-slate-400 text-sm">
            Aucun paiement validé ne correspond à ces critères.
          </p>
        </motion.div>
      )}

      {/* INFO BAS */}
      {!loading && paiementsFiltres.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          Données basées sur {paiementsFiltres.length} paiement{paiementsFiltres.length > 1 ? 's' : ''} validé{paiementsFiltres.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}