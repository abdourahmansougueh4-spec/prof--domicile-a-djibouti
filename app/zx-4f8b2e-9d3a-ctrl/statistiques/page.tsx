'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type UserBase = {
  id: string
  role: string
  quartier: string | null
  created_at: string
  banni: boolean
  approuve: boolean
}

type ProfInfo = {
  id: string
  note_moyenne: number
  nombre_avis: number
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
}

type DemandeBase = {
  id: string
  statut: string
  matiere: string | null
  created_at: string
}

type PaiementBase = {
  id: string
  montant: number
  statut: string
  created_at: string
}

type MoisEvolution = {
  cle: string
  label: string
  parents: number
  profs: number
  demandes: number
  revenus: number
}

type Periode = 'mois' | 'trimestre' | 'semestre' | 'annee' | 'tout'

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminStatistiques() {
  const supabase = createClient()

  const [users, setUsers] = useState<UserBase[]>([])
  const [profs, setProfs] = useState<ProfInfo[]>([])
  const [demandes, setDemandes] = useState<DemandeBase[]>([])
  const [paiements, setPaiements] = useState<PaiementBase[]>([])
  const [matieres, setMatieres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [periode, setPeriode] = useState<Periode>('annee')
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

      // Chargement parallèle de toutes les données
      const [
        usersRes,
        profsRes,
        demandesRes,
        paiementsRes,
        matieresRes,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, role, quartier, created_at, banni, approuve')
          .order('created_at', { ascending: false }),
        supabase
          .from('professeurs')
          .select('id, note_moyenne, nombre_avis, etoiles, badge_admin, pionnier'),
        supabase
          .from('demandes')
          .select('id, statut, matiere, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('paiements')
          .select('id, montant, statut, created_at')
          .eq('statut', 'valide'),
        supabase.from('matieres_par_prof').select('matiere'),
      ])

      setUsers(
        (usersRes.data || []).map((u) => ({
          id: u.id,
          role: u.role || 'parent',
          quartier: u.quartier || null,
          created_at: u.created_at,
          banni: u.banni === true,
          approuve: u.approuve === true,
        }))
      )

      setProfs(
        (profsRes.data || []).map((p) => ({
          id: p.id,
          note_moyenne: Number(p.note_moyenne) || 0,
          nombre_avis: p.nombre_avis || 0,
          etoiles: p.etoiles || 0,
          badge_admin: p.badge_admin || null,
          pionnier: p.pionnier === true,
        }))
      )

      setDemandes(
        (demandesRes.data || []).map((d) => ({
          id: d.id,
          statut: d.statut || 'en_attente',
          matiere: d.matiere || null,
          created_at: d.created_at,
        }))
      )

      setPaiements(
        (paiementsRes.data || []).map((p) => ({
          id: p.id,
          montant: Number(p.montant) || 0,
          statut: p.statut || 'valide',
          created_at: p.created_at,
        }))
      )

      setMatieres((matieresRes.data || []).map((m) => m.matiere))

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

  const getDateLimite = (): Date | null => {
    const now = new Date()
    if (periode === 'mois') return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    if (periode === 'trimestre') return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    if (periode === 'semestre') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    if (periode === 'annee') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    return null
  }

  const dateLimite = useMemo(() => getDateLimite(), [periode])

  // ============================================================
  // STATS GLOBALES
  // ============================================================

  const stats = useMemo(() => {
    const usersFiltres = dateLimite
      ? users.filter((u) => new Date(u.created_at) >= dateLimite)
      : users

    const demandesFiltres = dateLimite
      ? demandes.filter((d) => new Date(d.created_at) >= dateLimite)
      : demandes

    const paiementsFiltres = dateLimite
      ? paiements.filter((p) => new Date(p.created_at) >= dateLimite)
      : paiements

    // Utilisateurs
    const totalParents = usersFiltres.filter((u) => u.role === 'parent' && !u.banni).length
    const totalProfs = usersFiltres.filter((u) => u.role === 'professeur' && !u.banni).length
    const profsApprouves = usersFiltres.filter(
      (u) => u.role === 'professeur' && u.approuve && !u.banni
    ).length
    const profsEnAttente = usersFiltres.filter(
      (u) => u.role === 'professeur' && !u.approuve && !u.banni
    ).length
    const totalBannis = users.filter((u) => u.banni).length

    // Demandes
    const totalDemandes = demandesFiltres.length
    const demandesAcceptees = demandesFiltres.filter((d) => d.statut === 'acceptee').length
    const demandesRefusees = demandesFiltres.filter((d) => d.statut === 'refusee').length
    const demandesEnAttente = demandesFiltres.filter((d) => d.statut === 'en_attente').length
    const demandesPreAcceptees = demandesFiltres.filter((d) => d.statut === 'pre_acceptee').length
    const tauxAcceptation =
      totalDemandes > 0 ? Math.round((demandesAcceptees / totalDemandes) * 100) : 0

    // Revenus
    const totalRevenus = paiementsFiltres.reduce((acc, p) => acc + p.montant, 0)
    const revenusMoyen =
      paiementsFiltres.length > 0 ? totalRevenus / paiementsFiltres.length : 0

    // Notes
    const profsAvecNote = profs.filter((p) => p.nombre_avis > 0)
    const noteMoyenne =
      profsAvecNote.length > 0
        ? profsAvecNote.reduce((acc, p) => acc + p.note_moyenne, 0) / profsAvecNote.length
        : 0
    const totalAvis = profs.reduce((acc, p) => acc + p.nombre_avis, 0)
    const totalEtoiles = profs.reduce((acc, p) => acc + p.etoiles, 0)
    const profsPionniers = profs.filter((p) => p.pionnier).length
    const profsBadges = profs.filter((p) => p.badge_admin).length

    return {
      totalParents,
      totalProfs,
      profsApprouves,
      profsEnAttente,
      totalBannis,
      totalDemandes,
      demandesAcceptees,
      demandesRefusees,
      demandesEnAttente,
      demandesPreAcceptees,
      tauxAcceptation,
      totalRevenus,
      revenusMoyen,
      noteMoyenne,
      totalAvis,
      totalEtoiles,
      profsPionniers,
      profsBadges,
    }
  }, [users, profs, demandes, paiements, dateLimite])

  // ============================================================
  // COMPARAISON PÉRIODE PRÉCÉDENTE
  // ============================================================

  const comparaison = useMemo(() => {
    if (!dateLimite) return null

    const now = new Date()
    const diffMs = now.getTime() - dateLimite.getTime()
    const dateDebutPrecedente = new Date(dateLimite.getTime() - diffMs)

    const usersPrecedents = users.filter((u) => {
      const d = new Date(u.created_at)
      return d >= dateDebutPrecedente && d < dateLimite
    })
    const demandesPrecedentes = demandes.filter((d) => {
      const dt = new Date(d.created_at)
      return dt >= dateDebutPrecedente && dt < dateLimite
    })
    const paiementsPrecedents = paiements.filter((p) => {
      const dt = new Date(p.created_at)
      return dt >= dateDebutPrecedente && dt < dateLimite
    })

    const parentsPrecedents = usersPrecedents.filter((u) => u.role === 'parent' && !u.banni).length
    const profsPrecedents = usersPrecedents.filter((u) => u.role === 'professeur' && !u.banni).length
    const demandesPrecedentesCount = demandesPrecedentes.length
    const revenusPrecedents = paiementsPrecedents.reduce((acc, p) => acc + p.montant, 0)

    const evolution = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    return {
      parents: evolution(stats.totalParents, parentsPrecedents),
      profs: evolution(stats.totalProfs, profsPrecedents),
      demandes: evolution(stats.totalDemandes, demandesPrecedentesCount),
      revenus: evolution(stats.totalRevenus, revenusPrecedents),
    }
  }, [dateLimite, users, demandes, paiements, stats])

  // ============================================================
  // ÉVOLUTION MENSUELLE (12 derniers mois)
  // ============================================================

  const evolutionMensuelle = useMemo((): MoisEvolution[] => {
    const moisData: { [k: string]: MoisEvolution } = {}
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('fr-FR', { month: 'short' })
      moisData[cle] = { cle, label, parents: 0, profs: 0, demandes: 0, revenus: 0 }
    }

    users.forEach((u) => {
      const d = new Date(u.created_at)
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (moisData[cle]) {
        if (u.role === 'parent' && !u.banni) moisData[cle].parents++
        if (u.role === 'professeur' && !u.banni) moisData[cle].profs++
      }
    })

    demandes.forEach((dm) => {
      const d = new Date(dm.created_at)
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (moisData[cle]) moisData[cle].demandes++
    })

    paiements.forEach((p) => {
      const d = new Date(p.created_at)
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (moisData[cle]) moisData[cle].revenus += p.montant
    })

    return Object.values(moisData)
  }, [users, demandes, paiements])

  const maxEvolution = useMemo(() => {
    return Math.max(
      ...evolutionMensuelle.map((m) => Math.max(m.parents, m.profs, m.demandes)),
      1
    )
  }, [evolutionMensuelle])

  const maxRevenus = useMemo(
    () => Math.max(...evolutionMensuelle.map((m) => m.revenus), 1),
    [evolutionMensuelle]
  )

  // ============================================================
  // TOP 10 QUARTIERS
  // ============================================================

  const topQuartiers = useMemo(() => {
    const parQuartier: { [k: string]: { total: number; parents: number; profs: number } } = {}

    users
      .filter((u) => !u.banni && u.quartier)
      .forEach((u) => {
        const q = u.quartier!.trim()
        if (!parQuartier[q]) parQuartier[q] = { total: 0, parents: 0, profs: 0 }
        parQuartier[q].total++
        if (u.role === 'parent') parQuartier[q].parents++
        if (u.role === 'professeur') parQuartier[q].profs++
      })

    return Object.entries(parQuartier)
      .map(([quartier, data]) => ({ quartier, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [users])

  // ============================================================
  // MATIÈRES POPULAIRES
  // ============================================================

  const topMatieres = useMemo(() => {
    const compteur: { [k: string]: number } = {}
    matieres.forEach((m) => {
      compteur[m] = (compteur[m] || 0) + 1
    })

    return Object.entries(compteur)
      .map(([matiere, count]) => ({ matiere, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [matieres])

  // ============================================================
  // TOP 10 PROFS
  // ============================================================

  const topProfs = useMemo(() => {
    return [...profs]
      .filter((p) => p.nombre_avis > 0)
      .sort((a, b) => {
        const scoreA = a.note_moyenne * 20 + a.etoiles * 15 + Math.min(a.nombre_avis, 30)
        const scoreB = b.note_moyenne * 20 + b.etoiles * 15 + Math.min(b.nombre_avis, 30)
        return scoreB - scoreA
      })
      .slice(0, 10)
  }, [profs])

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    setExportEnCours(true)
    try {
      const lines: string[] = []
      lines.push('=== STATISTIQUES GLOBALES ===')
      lines.push(`Période,${periode}`)
      lines.push(`Date export,${new Date().toLocaleString('fr-FR')}`)
      lines.push('')
      lines.push('Métrique,Valeur')
      lines.push(`Parents,${stats.totalParents}`)
      lines.push(`Professeurs,${stats.totalProfs}`)
      lines.push(`Profs approuvés,${stats.profsApprouves}`)
      lines.push(`Profs en attente,${stats.profsEnAttente}`)
      lines.push(`Bannis,${stats.totalBannis}`)
      lines.push(`Total demandes,${stats.totalDemandes}`)
      lines.push(`Demandes acceptées,${stats.demandesAcceptees}`)
      lines.push(`Demandes refusées,${stats.demandesRefusees}`)
      lines.push(`Taux acceptation,${stats.tauxAcceptation}%`)
      lines.push(`Total revenus,${stats.totalRevenus} DJF`)
      lines.push(`Note moyenne,${stats.noteMoyenne.toFixed(2)}/5`)
      lines.push(`Total avis,${stats.totalAvis}`)
      lines.push(`Total étoiles,${stats.totalEtoiles}`)
      lines.push('')
      lines.push('=== ÉVOLUTION MENSUELLE ===')
      lines.push('Mois,Parents,Profs,Demandes,Revenus')
      evolutionMensuelle.forEach((m) => {
        lines.push(`${m.label},${m.parents},${m.profs},${m.demandes},${m.revenus}`)
      })
      lines.push('')
      lines.push('=== TOP QUARTIERS ===')
      lines.push('Quartier,Total,Parents,Profs')
      topQuartiers.forEach((q) => {
        lines.push(`"${q.quartier}",${q.total},${q.parents},${q.profs}`)
      })
      lines.push('')
      lines.push('=== MATIÈRES POPULAIRES ===')
      lines.push('Matière,Nombre de profs')
      topMatieres.forEach((m) => {
        lines.push(`"${m.matiere}",${m.count}`)
      })

      const csv = lines.join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `statistiques-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export statistiques (${periode})`,
      })

      setSucces('✅ Statistiques exportées')
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [stats, evolutionMensuelle, topQuartiers, topMatieres, periode, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterPrix = (n: number) => n.toLocaleString('fr-FR')

  const afficherEvolution = (valeur: number | undefined) => {
    if (valeur === undefined || valeur === null) return null
    const positif = valeur >= 0
    return (
      <span className={`text-[10px] font-black ${positif ? 'text-emerald-400' : 'text-red-400'}`}>
        {positif ? '📈 +' : '📉 '}
        {valeur}%
      </span>
    )
  }

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
        className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black mb-2">📈 Statistiques globales</h1>
              <p className="text-pink-100 text-sm">
                Vue analytique complète · {users.length} utilisateurs · {demandes.length} demandes ·
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
                disabled={exportEnCours}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Parents</div>
              <div className="text-2xl font-black">{stats.totalParents}</div>
              {afficherEvolution(comparaison?.parents)}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Professeurs</div>
              <div className="text-2xl font-black">{stats.totalProfs}</div>
              {afficherEvolution(comparaison?.profs)}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Demandes</div>
              <div className="text-2xl font-black">{stats.totalDemandes}</div>
              {afficherEvolution(comparaison?.demandes)}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Revenus</div>
              <div className="text-lg font-black">{formaterPrix(stats.totalRevenus)}</div>
              <div className="text-[10px] text-pink-200">DJF</div>
              {afficherEvolution(comparaison?.revenus)}
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
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI SECONDAIRES */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] text-slate-400 font-black uppercase">✓ Approuvés</div>
            <div className="text-xl font-black text-emerald-300">{stats.profsApprouves}</div>
          </div>
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] text-slate-400 font-black uppercase">⏳ En attente</div>
            <div className="text-xl font-black text-amber-300">{stats.profsEnAttente}</div>
          </div>
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] text-slate-400 font-black uppercase">📊 Taux accept.</div>
            <div className="text-xl font-black text-white">{stats.tauxAcceptation}%</div>
          </div>
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] text-slate-400 font-black uppercase">⭐ Note moy.</div>
            <div className="text-xl font-black text-amber-300">{stats.noteMoyenne.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] text-slate-400 font-black uppercase">💬 Avis totaux</div>
            <div className="text-xl font-black text-white">{stats.totalAvis}</div>
          </div>
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] text-slate-400 font-black uppercase">🌟 Étoiles</div>
            <div className="text-xl font-black text-white">{stats.totalEtoiles}</div>
          </div>
        </div>
      )}

      {/* GRAPHIQUE ÉVOLUTION UTILISATEURS */}
      {!loading && evolutionMensuelle.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-lg font-black text-white">
              👥 Nouveaux utilisateurs par mois
            </h2>
            <div className="flex gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-blue-600" />
                <span className="text-slate-300">Parents</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-600" />
                <span className="text-slate-300">Profs</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-purple-500 to-pink-600" />
                <span className="text-slate-300">Demandes</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-1 h-48">
            {evolutionMensuelle.map((m, i) => (
              <div key={m.cle} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5 justify-center h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((m.parents / maxEvolution) * 100, 2)}%` }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="w-1/3 bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-sm"
                    title={`${m.parents} parents`}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((m.profs / maxEvolution) * 100, 2)}%` }}
                    transition={{ delay: i * 0.03 + 0.05, duration: 0.4 }}
                    className="w-1/3 bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-sm"
                    title={`${m.profs} profs`}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((m.demandes / maxEvolution) * 100, 2)}%` }}
                    transition={{ delay: i * 0.03 + 0.1, duration: 0.4 }}
                    className="w-1/3 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-sm"
                    title={`${m.demandes} demandes`}
                  />
                </div>
                <div className="text-[9px] text-slate-400 font-bold">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* GRAPHIQUE REVENUS */}
      {!loading && evolutionMensuelle.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-5">
            💰 Revenus par mois (DJF)
          </h2>
          <div className="flex items-end justify-between gap-1 h-40">
            {evolutionMensuelle.map((m, i) => (
              <div key={m.cle} className="flex-1 flex flex-col items-center group">
                <div className="text-[9px] text-emerald-300 font-black mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.revenus > 0 ? formaterPrix(m.revenus) : ''}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((m.revenus / maxRevenus) * 100, 2)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-lg"
                  title={`${m.label} : ${formaterPrix(m.revenus)} DJF`}
                />
                <div className="text-[9px] text-slate-400 mt-2 font-bold">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* RÉPARTITION DEMANDES */}
      {!loading && stats.totalDemandes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-5">
            📊 Répartition des demandes
          </h2>

          <div className="grid md:grid-cols-4 gap-3">
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <span className="font-black text-emerald-300 text-xs">Acceptées</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.demandesAcceptees}</div>
              <div className="text-[10px] text-emerald-200 mt-1">
                {stats.totalDemandes > 0
                  ? Math.round((stats.demandesAcceptees / stats.totalDemandes) * 100)
                  : 0}
                %
              </div>
            </div>

            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⏳</span>
                <span className="font-black text-amber-300 text-xs">En attente</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.demandesEnAttente}</div>
              <div className="text-[10px] text-amber-200 mt-1">
                {stats.totalDemandes > 0
                  ? Math.round((stats.demandesEnAttente / stats.totalDemandes) * 100)
                  : 0}
                %
              </div>
            </div>

            <div className="bg-teal-500/10 rounded-xl p-4 border border-teal-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👍</span>
                <span className="font-black text-teal-300 text-xs">Pré-acceptées</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.demandesPreAcceptees}</div>
              <div className="text-[10px] text-teal-200 mt-1">
                {stats.totalDemandes > 0
                  ? Math.round((stats.demandesPreAcceptees / stats.totalDemandes) * 100)
                  : 0}
                %
              </div>
            </div>

            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">❌</span>
                <span className="font-black text-red-300 text-xs">Refusées</span>
              </div>
              <div className="text-2xl font-black text-white">{stats.demandesRefusees}</div>
              <div className="text-[10px] text-red-200 mt-1">
                {stats.totalDemandes > 0
                  ? Math.round((stats.demandesRefusees / stats.totalDemandes) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TOP 10 QUARTIERS */}
      {!loading && topQuartiers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-5">
            📍 Top 10 quartiers
          </h2>

          <div className="space-y-2">
            {topQuartiers.map((q, i) => {
              const pourcentage =
                users.length > 0 ? (q.total / users.length) * 100 : 0
              return (
                <div key={q.quartier} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    i === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                      : i === 1
                      ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                      : i === 2
                      ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm truncate">
                        📍 {q.quartier}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {q.total} utilisateur{q.total > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pourcentage}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
                      />
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">
                      👨‍👩‍👧 {q.parents} parents · 👨‍🏫 {q.profs} profs
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* MATIÈRES POPULAIRES */}
      {!loading && topMatieres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-5">
            📚 Matières les plus enseignées
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {topMatieres.map((m, i) => {
              const maxCount = topMatieres[0].count
              const pourcentage = maxCount > 0 ? (m.count / maxCount) * 100 : 0
              return (
                <div key={m.matiere} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-white">📚 {m.matiere}</span>
                    <span className="text-[10px] text-purple-300 font-black">
                      {m.count} prof{m.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pourcentage}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
                    />
                  </div>
                </div>
              )
            })}
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
            🏆 Top 10 profs (score global)
          </h2>

          <div className="space-y-2">
            {topProfs.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
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
                  <div className="text-xs font-bold text-white">
                    Prof #{i + 1}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {p.nombre_avis} avis · {p.etoiles}/3 étoiles
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-300">
                    {p.note_moyenne.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-500">/ 5</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* INFO BAS */}
      {!loading && (
        <div className="text-center text-xs text-slate-500 pt-4">
          Statistiques basées sur {users.length} utilisateurs · {demandes.length} demandes · {paiements.length} paiements validés
        </div>
      )}
    </div>
  )
}