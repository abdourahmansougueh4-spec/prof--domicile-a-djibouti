'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Activite = {
  id: string
  type: string
  titre: string
  description: string
  user_id: string | null
  user_nom: string
  user_role: string
  lien: string | null
  created_at: string
  metadata?: any
}

type FiltreType = 'tous' | 'inscription' | 'demande' | 'paiement' | 'avis' | 'signalement' | 'connexion' | 'admin'

const typesConfig: {
  [k: string]: { label: string; emoji: string; couleur: string }
} = {
  inscription: { label: 'Inscription', emoji: '👤', couleur: 'from-emerald-500 to-teal-600' },
  demande: { label: 'Demande', emoji: '📥', couleur: 'from-blue-500 to-indigo-600' },
  paiement: { label: 'Paiement', emoji: '💰', couleur: 'from-amber-500 to-orange-600' },
  avis: { label: 'Avis', emoji: '⭐', couleur: 'from-yellow-500 to-amber-600' },
  signalement: { label: 'Signalement', emoji: '🚨', couleur: 'from-red-500 to-red-600' },
  connexion: { label: 'Connexion', emoji: '🔓', couleur: 'from-purple-500 to-pink-600' },
  admin: { label: 'Admin', emoji: '👑', couleur: 'from-cyan-500 to-blue-600' },
  autre: { label: 'Autre', emoji: '📌', couleur: 'from-slate-500 to-slate-600' },
}

export default function AdminActivite() {
  const supabase = createClient()

  const [activites, setActivites] = useState<Activite[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreType, setFiltreType] = useState<FiltreType>('tous')
  const [recherche, setRecherche] = useState('')
  const [enPause, setEnPause] = useState(false)
  const [derniereMaj, setDerniereMaj] = useState(new Date())
  const [nouvellesActivites, setNouvellesActivites] = useState<string[]>([])

  const dernierIdRef = useRef<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    charger()
  }, [])

  // Auto-refresh toutes les 15 secondes
  useEffect(() => {
    if (enPause) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      charger(true) // Mode silencieux
    }, 15000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enPause])

  const charger = async (silencieux = false) => {
    if (!silencieux) setLoading(true)

    try {
      // Récupérer les admin logs
      const { data: logs, error: logsError } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      const activitesListe: Activite[] = []

      if (!logsError && logs) {
        for (const log of logs) {
          const { data: user } = log.action?.includes('utilisateur') || log.action?.includes('demande')
            ? { data: null }
            : await Promise.resolve({ data: null })

          activitesListe.push({
            id: log.id,
            type: detecterType(log.action || ''),
            titre: formaterTitre(log.action || ''),
            description: log.details || '',
            user_id: null,
            user_nom: 'Admin',
            user_role: 'admin',
            lien: null,
            created_at: log.created_at,
            metadata: log,
          })
        }
      }

      // Récupérer les dernières inscriptions
      const { data: inscriptions } = await supabase
        .from('profiles')
        .select('id, nom_complet, role, created_at, email')
        .order('created_at', { ascending: false })
        .limit(20)

      for (const inscrit of inscriptions || []) {
        activitesListe.push({
          id: `inscription-${inscrit.id}`,
          type: 'inscription',
          titre:
            inscrit.role === 'professeur'
              ? `👨‍🏫 Nouveau professeur`
              : inscrit.role === 'parent'
              ? `👨‍👩‍👧 Nouveau parent`
              : `👑 Nouvel admin`,
          description: `${inscrit.nom_complet} (${inscrit.email})`,
          user_id: inscrit.id,
          user_nom: inscrit.nom_complet,
          user_role: inscrit.role,
          lien: null,
          created_at: inscrit.created_at,
        })
      }

      // Récupérer les dernières demandes
      const { data: demandes } = await supabase
        .from('demandes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      for (const d of demandes || []) {
        const [parent, prof] = await Promise.all([
          supabase.from('profiles').select('nom_complet').eq('id', d.parent_id).single(),
          supabase.from('profiles').select('nom_complet').eq('id', d.professeur_id).single(),
        ])

        activitesListe.push({
          id: `demande-${d.id}`,
          type: 'demande',
          titre: '📥 Nouvelle demande',
          description: `${parent.data?.nom_complet || 'Parent'} → ${prof.data?.nom_complet || 'Prof'}`,
          user_id: d.parent_id,
          user_nom: parent.data?.nom_complet || 'Parent',
          user_role: 'parent',
          lien: '/abdrhmn-zou_2022-2032/demandes',
          created_at: d.created_at,
        })
      }

      // Récupérer les derniers paiements
      const { data: paiements } = await supabase
        .from('paiements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      for (const p of paiements || []) {
        activitesListe.push({
          id: `paiement-${p.id}`,
          type: 'paiement',
          titre: '💰 Nouveau paiement',
          description: `${Number(p.montant || 0).toLocaleString()} DJF · Statut: ${p.statut}`,
          user_id: p.parent_id,
          user_nom: '',
          user_role: 'parent',
          lien: '/abdrhmn-zou_2022-2032/paiements-parents',
          created_at: p.created_at,
        })
      }

      // Récupérer les derniers avis
      const { data: avis } = await supabase
        .from('avis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      for (const a of avis || []) {
        activitesListe.push({
          id: `avis-${a.id}`,
          type: 'avis',
          titre: `⭐ Nouvel avis (${a.note}/5)`,
          description: a.commentaire?.substring(0, 80) || 'Sans commentaire',
          user_id: a.parent_id,
          user_nom: '',
          user_role: 'parent',
          lien: '/abdrhmn-zou_2022-2032/avis',
          created_at: a.created_at,
        })
      }

      // Récupérer les derniers signalements
      const { data: signalements } = await supabase
        .from('signalements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      for (const s of signalements || []) {
        activitesListe.push({
          id: `signalement-${s.id}`,
          type: 'signalement',
          titre: '🚨 Nouveau signalement',
          description: s.motif?.substring(0, 80) || 'Sans motif',
          user_id: s.signale_par,
          user_nom: '',
          user_role: 'parent',
          lien: '/abdrhmn-zou_2022-2032/signalements',
          created_at: s.created_at,
        })
      }

      // Trier par date
      activitesListe.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Détecter les nouvelles activités
      if (silencieux && dernierIdRef.current && activitesListe.length > 0) {
        const indexDernier = activitesListe.findIndex(
          (a) => a.id === dernierIdRef.current
        )
        if (indexDernier > 0) {
          const nouvelles = activitesListe.slice(0, indexDernier)
          setNouvellesActivites(nouvelles.map((n) => n.id))
          setTimeout(() => setNouvellesActivites([]), 5000)
        }
      }

      if (activitesListe.length > 0) {
        dernierIdRef.current = activitesListe[0].id
      }

      setActivites(activitesListe)
      setDerniereMaj(new Date())
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      if (!silencieux) setLoading(false)
    }
  }

  const detecterType = (action: string): string => {
    if (action.includes('inscription') || action.includes('creer_utilisateur')) return 'inscription'
    if (action.includes('demande') || action.includes('valider') || action.includes('refuser')) return 'demande'
    if (action.includes('paiement') || action.includes('rembourser')) return 'paiement'
    if (action.includes('avis')) return 'avis'
    if (action.includes('signalement')) return 'signalement'
    if (action.includes('connexion')) return 'connexion'
    if (action.includes('admin')) return 'admin'
    return 'autre'
  }

  const formaterTitre = (action: string): string => {
    const actions: { [k: string]: string } = {
      creer_utilisateur: '👤 Création utilisateur',
      valider_demande: '✅ Demande validée',
      refuser_demande: '❌ Demande refusée',
      valider_paiement: '💰 Paiement validé',
      refuser_paiement: '❌ Paiement refusé',
      rembourser_paiement: '💸 Remboursement',
      modifier_utilisateur: '✏️ Modification utilisateur',
      bannir_utilisateur: '🚫 Bannissement',
      debannir_utilisateur: '🔓 Débannissement',
      supprimer_utilisateur: '🗑️ Suppression',
      modifier_etoiles: '⭐ Modification étoiles',
      modifier_badge: '🏅 Modification badge',
      connexion_admin: '🔓 Connexion admin',
      creer_annonce: '📰 Nouvelle annonce',
      envoyer_notification: '📢 Notification envoyée',
    }
    return actions[action] || `🔹 ${action.replace(/_/g, ' ')}`
  }

  const activitesFiltrees = useMemo(() => {
    return activites.filter((a) => {
      if (filtreType !== 'tous' && a.type !== filtreType) return false
      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          a.titre.toLowerCase().includes(r) ||
          a.description.toLowerCase().includes(r) ||
          a.user_nom.toLowerCase().includes(r)
        )
      }
      return true
    })
  }, [activites, filtreType, recherche])

  const compteParType = (type: string) =>
    activites.filter((a) => a.type === type).length

  // Stats par heure (24 dernières heures)
  const statsParHeure = useMemo(() => {
    const heures: { heure: number; count: number }[] = []
    const now = new Date()

    for (let i = 23; i >= 0; i--) {
      const heure = new Date(now.getTime() - i * 60 * 60 * 1000)
      const h = heure.getHours()
      const count = activites.filter((a) => {
        const dateA = new Date(a.created_at)
        return (
          dateA.getHours() === h &&
          dateA.toDateString() === heure.toDateString()
        )
      }).length
      heures.push({ heure: h, count })
    }

    return heures
  }, [activites])

  const maxHeure = Math.max(...statsParHeure.map((s) => s.count), 1)

  // Top utilisateurs actifs
  const topUsers = useMemo(() => {
    const compteur: { [k: string]: { nom: string; role: string; count: number } } = {}
    activites.forEach((a) => {
      if (a.user_id && a.user_nom) {
        if (!compteur[a.user_id]) {
          compteur[a.user_id] = { nom: a.user_nom, role: a.user_role, count: 0 }
        }
        compteur[a.user_id].count++
      }
    })
    return Object.entries(compteur)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [activites])

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
    return d.toLocaleDateString('fr-FR')
  }

  const formaterHeure = (date: string) =>
    new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const exporterCSV = () => {
    const headers = ['Date', 'Type', 'Titre', 'Description', 'Utilisateur', 'Rôle']
    const rows = activitesFiltrees.map((a) => [
      a.created_at, a.type, a.titre, a.description, a.user_nom, a.user_role,
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `activite-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">
                  🔴 Activité en direct
                </h1>
                {!enPause && (
                  <span className="flex items-center gap-2 bg-red-500/30 backdrop-blur-sm px-3 py-1 rounded-full border border-red-400/50">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black">LIVE</span>
                  </span>
                )}
                {enPause && (
                  <span className="bg-slate-500/30 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-400/50 text-xs font-black">
                    ⏸️ PAUSE
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-sm">
                {activites.length} activités · Mise à jour : {formaterHeure(derniereMaj.toISOString())}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setEnPause(!enPause)}
                className={`px-4 py-3 rounded-xl font-bold text-white backdrop-blur-sm border transition-all text-sm ${
                  enPause
                    ? 'bg-emerald-500/30 hover:bg-emerald-500/40 border-emerald-400/50'
                    : 'bg-white/10 hover:bg-white/20 border-white/30'
                }`}
              >
                {enPause ? '▶️ Reprendre' : '⏸️ Pause'}
              </button>
              <button
                onClick={() => charger()}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all text-sm"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={exporterCSV}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all text-sm"
              >
                📤 Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Total
              </div>
              <div className="text-2xl font-black">{activites.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Inscriptions
              </div>
              <div className="text-2xl font-black">
                {compteParType('inscription')}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Demandes
              </div>
              <div className="text-2xl font-black">
                {compteParType('demande')}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">
                Signalements
              </div>
              <div className="text-2xl font-black text-red-300">
                {compteParType('signalement')}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Graphique 24h */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
      >
        <h2 className="text-lg font-black text-white mb-4">
          📊 Activité 24 dernières heures
        </h2>
        <div className="flex items-end justify-between gap-1 h-32">
          {statsParHeure.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full text-[8px] text-slate-400 font-bold text-center mb-1"
                style={{ opacity: s.count > 0 ? 1 : 0 }}
              >
                {s.count}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: `${Math.max((s.count / maxHeure) * 100, 4)}%`,
                }}
                transition={{ delay: i * 0.02 }}
                className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-sm"
                title={`${s.heure}h - ${s.count} activité(s)`}
              />
              <div className="text-[8px] text-slate-500 mt-1 font-bold">
                {s.heure}h
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top utilisateurs actifs */}
      {topUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-4">
            🔥 Top utilisateurs actifs
          </h2>
          <div className="grid md:grid-cols-5 gap-3">
            {topUsers.map((u, i) => (
              <div
                key={u.id}
                className="bg-white/5 rounded-xl p-3 border border-white/10 text-center"
              >
                <div className="text-2xl mb-1">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {u.nom}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {u.role}
                </div>
                <div className="text-sm font-black text-cyan-300 mt-1">
                  {u.count} actions
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'tous', label: '📋 Tous', count: activites.length },
          { val: 'inscription', label: '👤 Inscriptions', count: compteParType('inscription') },
          { val: 'demande', label: '📥 Demandes', count: compteParType('demande') },
          { val: 'paiement', label: '💰 Paiements', count: compteParType('paiement') },
          { val: 'avis', label: '⭐ Avis', count: compteParType('avis') },
          { val: 'signalement', label: '🚨 Signalements', count: compteParType('signalement') },
          { val: 'admin', label: '👑 Admin', count: compteParType('admin') },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltreType(f.val as FiltreType)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtreType === f.val
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          🔍
        </span>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une activité..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none"
        />
      </div>

      {/* Flux */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
          />
        </div>
      ) : activitesFiltrees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucune activité
          </h3>
          <p className="text-slate-400 text-sm">
            Aucune activité dans cette catégorie.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {activitesFiltrees.map((a, i) => {
            const typeInfo = typesConfig[a.type] || typesConfig.autre
            const estNouveau = nouvellesActivites.includes(a.id)

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01 }}
                className={`backdrop-blur-xl rounded-xl p-4 border transition-all ${
                  estNouveau
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/70 border-white/10 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeInfo.couleur} flex items-center justify-center text-white text-lg flex-shrink-0 shadow-lg`}
                  >
                    {typeInfo.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="font-bold text-white text-sm">
                        {a.titre}
                      </div>
                      {estNouveau && (
                        <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                          🆕 NOUVEAU
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {formaterDate(a.created_at)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 truncate">
                      {a.description}
                    </div>
                    {a.user_nom && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        👤 {a.user_nom}{' '}
                        <span className="capitalize">({a.user_role})</span>
                      </div>
                    )}
                  </div>

                  {a.lien && (
                    <Link
                      href={a.lien}
                      className="px-3 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 flex-shrink-0"
                    >
                      👁️
                    </Link>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}