'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type LogAdmin = {
  id: string
  action: string
  details: string | null
  ip: string | null
  created_at: string
}

type Periode = 'jour' | 'semaine' | 'mois' | 'tout'
type Tri = 'recent' | 'ancien' | 'action_az' | 'action_za'

// ============================================================
// CONFIG ACTIONS
// ============================================================

const actionsConfig: {
  [k: string]: { label: string; emoji: string; couleur: string; categorie: string }
} = {
  connexion_admin: { label: 'Connexion admin', emoji: '🔓', couleur: 'from-emerald-500 to-teal-600', categorie: 'connexion' },
  modifier_utilisateur: { label: 'Modification utilisateur', emoji: '✏️', couleur: 'from-blue-500 to-indigo-600', categorie: 'modification' },
  bannir_utilisateur: { label: 'Bannissement', emoji: '🚫', couleur: 'from-red-500 to-red-600', categorie: 'bannissement' },
  debannir_utilisateur: { label: 'Débannissement', emoji: '🔓', couleur: 'from-emerald-500 to-green-600', categorie: 'bannissement' },
  supprimer_utilisateur: { label: 'Suppression utilisateur', emoji: '🗑️', couleur: 'from-red-600 to-rose-700', categorie: 'suppression' },
  valider_demande: { label: 'Demande validée', emoji: '✅', couleur: 'from-emerald-500 to-teal-600', categorie: 'validation' },
  refuser_demande: { label: 'Demande refusée', emoji: '❌', couleur: 'from-red-500 to-orange-600', categorie: 'refus' },
  valider_paiement: { label: 'Paiement validé', emoji: '💰', couleur: 'from-amber-500 to-orange-600', categorie: 'validation' },
  refuser_paiement: { label: 'Paiement refusé', emoji: '❌', couleur: 'from-red-500 to-red-600', categorie: 'refus' },
  rembourser_paiement: { label: 'Remboursement', emoji: '💸', couleur: 'from-purple-500 to-pink-600', categorie: 'modification' },
  modifier_parametres: { label: 'Paramètres modifiés', emoji: '⚙️', couleur: 'from-purple-500 to-pink-600', categorie: 'modification' },
  modifier_contenu: { label: 'Contenu modifié', emoji: '📝', couleur: 'from-blue-500 to-purple-600', categorie: 'modification' },
  envoyer_notification: { label: 'Notification envoyée', emoji: '📢', couleur: 'from-pink-500 to-rose-600', categorie: 'communication' },
  export_donnees: { label: 'Export de données', emoji: '📤', couleur: 'from-cyan-500 to-blue-600', categorie: 'export' },
  export_profs_liste: { label: 'Export profs', emoji: '📤', couleur: 'from-cyan-500 to-blue-600', categorie: 'export' },
  creer_utilisateur: { label: 'Création utilisateur', emoji: '👤', couleur: 'from-emerald-500 to-teal-600', categorie: 'creation' },
  creer_annonce: { label: 'Annonce créée', emoji: '📰', couleur: 'from-purple-500 to-indigo-600', categorie: 'creation' },
  modifier_annonce: { label: 'Annonce modifiée', emoji: '✏️', couleur: 'from-blue-500 to-indigo-600', categorie: 'modification' },
  supprimer_annonce: { label: 'Annonce supprimée', emoji: '🗑️', couleur: 'from-red-500 to-rose-600', categorie: 'suppression' },
  supprimer_avis: { label: 'Avis supprimé', emoji: '🗑️', couleur: 'from-red-500 to-rose-600', categorie: 'suppression' },
  publier_avis: { label: 'Avis publié', emoji: '✅', couleur: 'from-emerald-500 to-teal-600', categorie: 'validation' },
  masquer_avis: { label: 'Avis masqué', emoji: '🙈', couleur: 'from-slate-500 to-slate-600', categorie: 'modification' },
  modifier_etoiles: { label: 'Étoiles modifiées', emoji: '⭐', couleur: 'from-yellow-500 to-amber-600', categorie: 'modification' },
  modifier_badge: { label: 'Badge modifié', emoji: '🏅', couleur: 'from-amber-500 to-orange-600', categorie: 'modification' },
  modifier_pionnier: { label: 'Pionnier modifié', emoji: '🏆', couleur: 'from-yellow-500 to-orange-600', categorie: 'modification' },
  modifier_tarifs: { label: 'Tarifs modifiés', emoji: '💵', couleur: 'from-emerald-500 to-teal-600', categorie: 'modification' },
  valider_demandes_masse: { label: 'Validation en masse', emoji: '✅', couleur: 'from-emerald-500 to-teal-600', categorie: 'validation' },
  accepter_amelioration: { label: 'Amélioration acceptée', emoji: '✅', couleur: 'from-emerald-500 to-teal-600', categorie: 'validation' },
  refuser_amelioration: { label: 'Amélioration refusée', emoji: '❌', couleur: 'from-red-500 to-orange-600', categorie: 'refus' },
  signalement_bannir: { label: 'Signalement → Bannissement', emoji: '🚫', couleur: 'from-red-500 to-red-600', categorie: 'bannissement' },
  signalement_avertir: { label: 'Signalement → Avertissement', emoji: '⚠️', couleur: 'from-amber-500 to-orange-600', categorie: 'modification' },
  signalement_ignorer: { label: 'Signalement ignoré', emoji: '⚪', couleur: 'from-slate-500 to-slate-600', categorie: 'modification' },
  signalement_resolu: { label: 'Signalement résolu', emoji: '✅', couleur: 'from-emerald-500 to-teal-600', categorie: 'validation' },
}

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminLogs() {
  const supabase = createClient()

  const [logs, setLogs] = useState<LogAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [periode, setPeriode] = useState<Periode>('semaine')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous')
  const [filtreActionPrecise, setFiltreActionPrecise] = useState<string>('toutes')
  const [detail, setDetail] = useState<LogAdmin | null>(null)
  const [exportEnCours, setExportEnCours] = useState(false)
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
        setErreur('Session expirée. Reconnecte-toi.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, est_admin, banni')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin' || !profile.est_admin) {
        setErreur('Accès refusé. Tu n\'es pas administrateur.')
        setLoading(false)
        return
      }

      let query = supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      const dateLimite = getDateLimite()
      if (dateLimite) {
        query = query.gte('created_at', dateLimite)
      }

      const { data, error } = await query
      if (error) throw error

      const logsFormates: LogAdmin[] = (data || []).map((l) => ({
        id: l.id,
        action: l.action || 'action_inconnue',
        details: l.details || null,
        ip: l.ip || null,
        created_at: l.created_at,
      }))

      setLogs(logsFormates)
      setDerniereMaj(new Date())
    } catch (err: any) {
      console.error('Erreur chargement logs:', err)
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
    if (periode === 'jour') {
      now.setHours(0, 0, 0, 0)
      return now.toISOString()
    }
    if (periode === 'semaine') {
      now.setDate(now.getDate() - 7)
      return now.toISOString()
    }
    if (periode === 'mois') {
      now.setMonth(now.getMonth() - 1)
      return now.toISOString()
    }
    return null
  }

  const formaterDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffJ = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'À l\'instant'
    if (diffMin < 60) return `Il y a ${diffMin} min`
    if (diffH < 24) return `Il y a ${diffH}h`
    if (diffJ < 7) return `Il y a ${diffJ}j`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formaterDateComplete = (date: string) =>
    new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const getConfig = (action: string) => {
    return (
      actionsConfig[action] || {
        label: action.replace(/_/g, ' '),
        emoji: '🔹',
        couleur: 'from-slate-500 to-slate-600',
        categorie: 'autre',
      }
    )
  }

  // ============================================================
  // LISTE DES ACTIONS UNIQUES
  // ============================================================

  const actionsUniques = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => set.add(l.action))
    return Array.from(set).sort()
  }, [logs])

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const logsFiltres = useMemo(() => {
    let resultat = logs.filter((l) => {
      // Filtre catégorie
      if (filtreCategorie !== 'tous') {
        const config = getConfig(l.action)
        if (config.categorie !== filtreCategorie) return false
      }

      // Filtre action précise
      if (filtreActionPrecise !== 'toutes' && l.action !== filtreActionPrecise) {
        return false
      }

      // Recherche
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          l.action.toLowerCase().includes(r) ||
          l.details?.toLowerCase().includes(r) ||
          l.ip?.toLowerCase().includes(r)
        )
      }
      return true
    })

    // Tri
    if (tri === 'recent') resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'action_az') resultat.sort((a, b) => a.action.localeCompare(b.action))
    if (tri === 'action_za') resultat.sort((a, b) => b.action.localeCompare(a.action))

    return resultat
  }, [logs, filtreCategorie, filtreActionPrecise, recherche, tri])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)

    const logsAujourdhui = logs.filter((l) => new Date(l.created_at) >= aujourdhui)
    const categories: { [k: string]: number } = {}
    logs.forEach((l) => {
      const config = getConfig(l.action)
      categories[config.categorie] = (categories[config.categorie] || 0) + 1
    })

    const actionPlusFrequente = Object.entries(
      logs.reduce((acc: { [k: string]: number }, l) => {
        acc[l.action] = (acc[l.action] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]

    return {
      totalLogs: logs.length,
      logsAujourdhui: logsAujourdhui.length,
      categories,
      actionPlusFrequente,
    }
  }, [logs])

  // ============================================================
  // COMPTEURS CATÉGORIES
  // ============================================================

  const compteCategorie = useCallback(
    (cat: string) => {
      if (cat === 'tous') return logs.length
      return logs.filter((l) => getConfig(l.action).categorie === cat).length
    },
    [logs]
  )

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (logsFiltres.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = ['Date', 'Action', 'Libellé', 'Catégorie', 'Détails', 'IP']
      const rows = logsFiltres.map((l) => {
        const config = getConfig(l.action)
        return [
          formaterDateComplete(l.created_at),
          l.action,
          config.label,
          config.categorie,
          l.details || '',
          l.ip || '',
        ]
      })

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `logs-complets-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export logs complets : ${logsFiltres.length} entrées`,
      })
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [logsFiltres, supabase])

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
        className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black mb-2">📋 Journal d'activité</h1>
              <p className="text-blue-100 text-sm">
                {logs.length} entrée{logs.length > 1 ? 's' : ''} · Maj :{' '}
                {derniereMaj.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={charger}
                disabled={loading}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={exporterCSV}
                disabled={exportEnCours || logsFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Total logs
              </div>
              <div className="text-2xl font-black">{stats.totalLogs}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Aujourd'hui
              </div>
              <div className="text-2xl font-black">{stats.logsAujourdhui}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Actions uniques
              </div>
              <div className="text-2xl font-black">{actionsUniques.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Action + fréquente
              </div>
              <div className="text-xs font-black truncate">
                {stats.actionPlusFrequente
                  ? `${getConfig(stats.actionPlusFrequente[0]).emoji} ${stats.actionPlusFrequente[1]}x`
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* INFO */}
      <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <p className="text-sm font-bold text-blue-200 mb-1">
              Journal complet d'activité
            </p>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Ce journal contient <strong>toutes les actions</strong> effectuées par les administrateurs.
              Il est conservé pour la traçabilité complète et l'audit.
            </p>
          </div>
        </div>
      </div>

      {/* FILTRES PÉRIODE */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'jour', label: '📅 Aujourd\'hui' },
          { val: 'semaine', label: '📆 7 jours' },
          { val: 'mois', label: '🗓️ 30 jours' },
          { val: 'tout', label: '🌍 Tout' },
        ].map((p) => (
          <button
            key={p.val}
            onClick={() => setPeriode(p.val as Periode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              periode === p.val
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* FILTRES CATÉGORIE */}
      <div className="flex flex-wrap gap-2">
        {[
          'tous',
          'connexion',
          'creation',
          'modification',
          'suppression',
          'bannissement',
          'validation',
          'refus',
          'communication',
          'export',
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltreCategorie(cat)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtreCategorie === cat
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {cat === 'tous' ? '📋 Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)} ({compteCategorie(cat)})
          </button>
        ))}
      </div>

      {/* RECHERCHE + TRI + FILTRE ACTION */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher dans les logs..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none"
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
          value={filtreActionPrecise}
          onChange={(e) => setFiltreActionPrecise(e.target.value)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer max-w-[250px]"
        >
          <option value="toutes">🎯 Toutes les actions</option>
          {actionsUniques.map((a) => (
            <option key={a} value={a}>
              {getConfig(a).emoji} {getConfig(a).label}
            </option>
          ))}
        </select>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        >
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="action_az">🔤 Action A→Z</option>
          <option value="action_za">🔤 Action Z→A</option>
        </select>
      </div>

      {/* COMPTEUR RÉSULTATS */}
      {(recherche || filtreCategorie !== 'tous' || filtreActionPrecise !== 'toutes') && (
        <div className="text-sm text-slate-400">
          <span className="font-bold text-white">{logsFiltres.length}</span> résultat{logsFiltres.length > 1 ? 's' : ''}
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement des logs...</p>
        </div>
      ) : logsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun log trouvé</h3>
          <p className="text-slate-400 text-sm mb-4">
            {recherche ? `Aucun résultat pour "${recherche}"` : 'Aucune activité dans cette catégorie.'}
          </p>
          {(recherche || filtreCategorie !== 'tous' || filtreActionPrecise !== 'toutes') && (
            <button
              onClick={() => {
                setRecherche('')
                setFiltreCategorie('tous')
                setFiltreActionPrecise('toutes')
              }}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-xl font-bold text-sm border border-cyan-500/30"
            >
              ✕ Réinitialiser les filtres
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {logsFiltres.map((l, i) => {
            const config = getConfig(l.action)
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.005, 0.3) }}
                className="backdrop-blur-xl rounded-xl p-4 border transition-all bg-slate-800/70 border-white/10 hover:border-cyan-500/30 cursor-pointer"
                onClick={() => setDetail(l)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.couleur} flex items-center justify-center text-white text-lg flex-shrink-0 shadow-lg`}>
                    {config.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="font-bold text-white text-sm">{config.label}</div>
                      <span className="text-[9px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-black uppercase">
                        {config.categorie}
                      </span>
                      <span className="text-[10px] text-slate-500">{formaterDate(l.created_at)}</span>
                      {l.ip && (
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                          🌐 {l.ip}
                        </span>
                      )}
                    </div>
                    {l.details && (
                      <div className="text-xs text-slate-400 truncate">{l.details}</div>
                    )}
                    <div className="text-[9px] text-slate-600 font-mono mt-0.5">{l.action}</div>
                  </div>

                  <span className="text-slate-500 text-xs">→</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* INFO BAS */}
      {!loading && logsFiltres.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          Affichage de {logsFiltres.length} log{logsFiltres.length > 1 ? 's' : ''} sur {logs.length}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getConfig(detail.action).emoji}</span>
                    <div>
                      <h2 className="text-lg font-black text-white">Détail du log</h2>
                      <p className="text-xs text-blue-100 mt-0.5">{getConfig(detail.action).label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-[10px] text-slate-500 font-black uppercase mb-1">📅 Date & heure</div>
                  <div className="text-sm text-white font-mono">{formaterDateComplete(detail.created_at)}</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-[10px] text-slate-500 font-black uppercase mb-1">🔧 Action</div>
                  <div className="text-sm text-white font-mono">{detail.action}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Catégorie : {getConfig(detail.action).categorie}</div>
                </div>

                {detail.details && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-[10px] text-slate-500 font-black uppercase mb-1">📝 Détails</div>
                    <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{detail.details}</p>
                  </div>
                )}

                {detail.ip && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-[10px] text-slate-500 font-black uppercase mb-1">🌐 Adresse IP</div>
                    <div className="text-sm text-white font-mono">{detail.ip}</div>
                  </div>
                )}

                <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-3">
                  <p className="text-[10px] text-amber-200">
                    ⚠️ Ce log est immuable et ne peut pas être modifié ou supprimé.
                  </p>
                </div>
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