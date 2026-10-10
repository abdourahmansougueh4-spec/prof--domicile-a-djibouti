'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Profil = {
  nom_complet: string
  prenom: string
  email: string
  telephone: string | null
  quartier: string | null
  photo_url: string | null
  approuve: boolean
  banni: boolean
  masque: boolean
}

type Stats = {
  enfants: number
  demandes_total: number
  demandes_attente: number
  demandes_acceptees: number
  profs_actifs: number
  paiements_total: number
  paiements_attente: number
  avis_total: number
  notifications_non_lues: number
}

type Enfant = {
  id: string
  prenom: string
  niveaux: string[]
  classes: string[]
}

type ProfActif = {
  id: string
  nom_complet: string
  photo_url: string | null
  matiere: string | null
  depuis: string
  note_moyenne: number
  etoiles: number
}

type DemandeRecente = {
  id: string
  prof_nom: string
  prof_photo: string | null
  statut: string
  created_at: string
}

type Notification = {
  id: string
  titre: string
  contenu: string
  lu: boolean
  created_at: string
}

type ActiviteJour = {
  date: string
  label: string
  count: number
}

type ActionPrioritaire = {
  emoji: string
  titre: string
  desc: string
  href: string
  priorite: 'haute' | 'moyenne' | 'basse'
  couleur: string
}

// ============================================================
// CONFIG
// ============================================================

const LABELS_STATUT: { [k: string]: { label: string; emoji: string; bg: string } } = {
  en_attente: { label: 'En attente', emoji: '⏳', bg: 'bg-amber-100 text-amber-800' },
  acceptee: { label: 'Acceptée', emoji: '✅', bg: 'bg-emerald-100 text-emerald-800' },
  refusee: { label: 'Refusée', emoji: '❌', bg: 'bg-red-100 text-red-800' },
  pre_acceptee: { label: 'Intéressé', emoji: '👍', bg: 'bg-blue-100 text-blue-800' },
}

// ============================================================
// HELPER : Salutation
// ============================================================

const getSalutation = (): { texte: string; emoji: string } => {
  const h = new Date().getHours()
  if (h < 12) return { texte: 'Bonjour', emoji: '☀️' }
  if (h < 18) return { texte: 'Bon après-midi', emoji: '🌤️' }
  return { texte: 'Bonsoir', emoji: '🌙' }
}

// ============================================================
// HELPER : Format date relative
// ============================================================

const formaterDate = (date: string): string => {
  const d = new Date(date)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffJ = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'À l\'instant'
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH}h`
  if (diffJ < 7) return `Il y a ${diffJ}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ============================================================
// HELPER : Coach IA — Actions prioritaires
// ============================================================

const genererActions = (
  profil: Profil | null,
  stats: Stats,
  profs: ProfActif[]
): ActionPrioritaire[] => {
  const actions: ActionPrioritaire[] = []

  // Profil incomplet
  if (!profil?.telephone || profil.telephone.length < 10) {
    actions.push({
      emoji: '📞',
      titre: 'Ajoutez votre téléphone',
      desc: 'Pour que notre équipe puisse vous contacter rapidement.',
      href: '/espace-parent/profil',
      priorite: 'haute',
      couleur: 'from-red-500 to-orange-600',
    })
  }

  // Pas d'enfants
  if (stats.enfants === 0) {
    actions.push({
      emoji: '👨‍👩‍👧',
      titre: 'Ajoutez vos enfants',
      desc: 'Indispensable pour trouver le prof adapté à chaque niveau.',
      href: '/espace-parent/enfants',
      priorite: 'haute',
      couleur: 'from-blue-500 to-indigo-600',
    })
  }

  // Pas de demande
  if (stats.demandes_total === 0 && stats.enfants > 0) {
    actions.push({
      emoji: '🔍',
      titre: 'Trouvez votre premier prof',
      desc: 'Parcourez les profs vérifiés et envoyez votre première demande.',
      href: '/espace-parent/recherche',
      priorite: 'haute',
      couleur: 'from-emerald-500 to-teal-600',
    })
  }

  // Demandes en attente
  if (stats.demandes_attente > 0) {
    actions.push({
      emoji: '⏳',
      titre: `${stats.demandes_attente} demande${stats.demandes_attente > 1 ? 's' : ''} en attente`,
      desc: 'Notre équipe traite activement votre dossier.',
      href: '/espace-parent/demandes',
      priorite: 'moyenne',
      couleur: 'from-amber-500 to-orange-600',
    })
  }

  // Paiements en attente
  if (stats.paiements_attente > 0) {
    actions.push({
      emoji: '💳',
      titre: `${stats.paiements_attente} paiement${stats.paiements_attente > 1 ? 's' : ''} à valider`,
      desc: 'Un paiement attend notre validation.',
      href: '/espace-parent/demandes',
      priorite: 'moyenne',
      couleur: 'from-pink-500 to-rose-600',
    })
  }

  // Avis à laisser
  if (stats.profs_actifs > 0 && stats.avis_total < stats.profs_actifs) {
    const manquants = stats.profs_actifs - stats.avis_total
    actions.push({
      emoji: '⭐',
      titre: `Notez ${manquants} prof${manquants > 1 ? 's' : ''}`,
      desc: 'Votre avis aide les autres parents.',
      href: '/espace-parent/avis',
      priorite: 'moyenne',
      couleur: 'from-yellow-500 to-amber-600',
    })
  }

  // Profs sans suivi récent
  if (profs.length > 0) {
    actions.push({
      emoji: '📊',
      titre: 'Consultez les suivis de vos profs',
      desc: 'Voir la progression de vos enfants ce mois-ci.',
      href: '/espace-parent/mes-profs',
      priorite: 'basse',
      couleur: 'from-cyan-500 to-blue-600',
    })
  }

  if (actions.length === 0) {
    actions.push({
      emoji: '✨',
      titre: 'Tout est parfait !',
      desc: 'Votre espace est complet. Continuez comme ça.',
      href: '/espace-parent',
      priorite: 'basse',
      couleur: 'from-emerald-500 to-teal-600',
    })
  }

  return actions.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// HELPER : Calculer activité 7 jours
// ============================================================

const calculerActivite = (
  demandesDates: string[]
): ActiviteJour[] => {
  const jours: ActiviteJour[] = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const count = demandesDates.filter((d) => {
      const dd = new Date(d)
      return dd >= date && dd < nextDay
    }).length

    jours.push({
      date: date.toISOString(),
      label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      count,
    })
  }

  return jours
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function DashboardParent() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [profil, setProfil] = useState<Profil | null>(null)
  const [stats, setStats] = useState<Stats>({
    enfants: 0,
    demandes_total: 0,
    demandes_attente: 0,
    demandes_acceptees: 0,
    profs_actifs: 0,
    paiements_total: 0,
    paiements_attente: 0,
    avis_total: 0,
    notifications_non_lues: 0,
  })
  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [profsActifs, setProfsActifs] = useState<ProfActif[]>([])
  const [demandesRecentes, setDemandesRecentes] = useState<DemandeRecente[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activite, setActivite] = useState<ActiviteJour[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  const salutation = useMemo(() => getSalutation(), [])

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

      // 1. Profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nom_complet, email, telephone, quartier, photo_url, approuve, banni, masque, role')
        .eq('id', user.id)
        .single()

      if (!profileData || profileData.role !== 'parent') {
        setErreur('Accès refusé.')
        setLoading(false)
        return
      }

      setProfil({
        nom_complet: profileData.nom_complet || '',
        prenom: (profileData.nom_complet || '').split(' ')[0] || 'Parent',
        email: profileData.email || user.email || '',
        telephone: profileData.telephone,
        quartier: profileData.quartier,
        photo_url: profileData.photo_url,
        approuve: profileData.approuve === true,
        banni: profileData.banni === true,
        masque: profileData.masque === true,
      })

      // 2. Toutes les stats en parallèle
      const [
        enfantsRes,
        demandesRes,
        paiementsRes,
        avisRes,
        notifsRes,
      ] = await Promise.all([
        supabase.from('enfants').select('id, prenom, niveaux, classes').eq('parent_id', user.id).order('created_at', { ascending: true }),
        supabase.from('demandes').select('*').eq('parent_id', user.id).order('created_at', { ascending: false }),
        supabase.from('paiements').select('*').eq('parent_id', user.id),
        supabase.from('avis').select('*').eq('parent_id', user.id),
        supabase.from('notifications').select('id, titre, contenu, lu, created_at').eq('destinataire_id', user.id).order('created_at', { ascending: false }).limit(20),
      ])

      const demandes = demandesRes.data || []
      const paiements = paiementsRes.data || []
      const avis = avisRes.data || []
      const notifs = notifsRes.data || []

      // Enfants
      setEnfants(enfantsRes.data || [])

      // Demandes acceptées = profs actifs
      const acceptees = demandes.filter((d) => d.statut === 'acceptee')

      // Charger infos profs actifs
      const profsList: ProfActif[] = []
      for (const d of acceptees) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('nom_complet, photo_url')
          .eq('id', d.professeur_id)
          .single()

        const { data: profInfo } = await supabase
          .from('professeurs')
          .select('note_moyenne, etoiles, photo_profil_url')
          .eq('id', d.professeur_id)
          .single()

        profsList.push({
          id: d.professeur_id,
          nom_complet: prof?.nom_complet || 'Prof',
          photo_url: profInfo?.photo_profil_url || prof?.photo_url || null,
          matiere: d.matiere,
          depuis: d.created_at,
          note_moyenne: Number(profInfo?.note_moyenne) || 0,
          etoiles: profInfo?.etoiles || 0,
        })
      }
      setProfsActifs(profsList)

      // Demandes récentes (5)
      const recents: DemandeRecente[] = []
      for (const d of demandes.slice(0, 5)) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('nom_complet, photo_url')
          .eq('id', d.professeur_id)
          .single()

        recents.push({
          id: d.id,
          prof_nom: prof?.nom_complet || 'Prof',
          prof_photo: prof?.photo_url || null,
          statut: d.statut,
          created_at: d.created_at,
        })
      }
      setDemandesRecentes(recents)

      // Notifications non lues
      setNotifications(notifs.filter((n) => !n.lu).slice(0, 3))

      // Activité 7 jours
      setActivite(calculerActivite(demandes.map((d) => d.created_at)))

      // Stats finales
      setStats({
        enfants: enfantsRes.data?.length || 0,
        demandes_total: demandes.length,
        demandes_attente: demandes.filter((d) => d.statut === 'en_attente').length,
        demandes_acceptees: acceptees.length,
        profs_actifs: acceptees.length,
        paiements_total: paiements.length,
        paiements_attente: paiements.filter((p) => p.statut === 'en_attente').length,
        avis_total: avis.length,
        notifications_non_lues: notifs.filter((n) => !n.lu).length,
      })
    } catch (err: any) {
      console.error('Erreur chargement dashboard:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // CALCULS DÉRIVÉS
  // ============================================================

  const actions = useMemo(
    () => genererActions(profil, stats, profsActifs),
    [profil, stats, profsActifs]
  )

  const maxActivite = useMemo(
    () => Math.max(...activite.map((a) => a.count), 1),
    [activite]
  )

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const getInitiales = (nom: string) => {
    return nom
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const getCouleurAvatar = (etoiles: number) => {
    if (etoiles >= 3) return 'from-amber-500 to-orange-600'
    if (etoiles >= 2) return 'from-emerald-500 to-teal-600'
    if (etoiles >= 1) return 'from-blue-500 to-indigo-600'
    return 'from-slate-500 to-slate-700'
  }

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 border-4 border-blue-700 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm font-medium">Chargement de votre espace...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR
  // ============================================================

  if (erreur || !profil) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-red-700 text-sm mb-6">{erreur || 'Impossible de charger vos données'}</p>
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

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="space-y-6 pb-10">
      {/* ============================================================ */}
      {/* HEADER HERO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-60px] left-[-60px] w-56 h-56 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-4 flex-wrap mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-2 border-white/30 flex-shrink-0">
              {profil.photo_url ? (
                <img
                  src={profil.photo_url}
                  alt={profil.nom_complet}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="font-black">{getInitiales(profil.nom_complet)}</span>
              )}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">
                {salutation.emoji} Espace parent
              </div>
              <h1 className="text-2xl md:text-3xl font-black">
                {salutation.texte}, {profil.prenom} !
              </h1>
              {profil.quartier && (
                <p className="text-xs text-blue-100 mt-1">📍 {profil.quartier}</p>
              )}
            </div>
          </div>

          {stats.notifications_non_lues > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/20 backdrop-blur-sm border-2 border-amber-300/40 rounded-2xl p-3 mb-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">🔔</span>
                <div>
                  <div className="font-black text-sm">
                    {stats.notifications_non_lues} nouvelle{stats.notifications_non_lues > 1 ? 's' : ''} notification{stats.notifications_non_lues > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-amber-100">Consultez vos notifications</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions rapides dans le hero */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/espace-parent/recherche"
              className="bg-white text-blue-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              🔍 Trouver un prof
            </Link>
            <Link
              href="/espace-parent/enfants"
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-bold text-sm border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2"
            >
              👨‍👩‍👧 Mes enfants
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* 6 KPI ANIMÉS */}
      {/* ============================================================ */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Enfants',
            valeur: stats.enfants,
            emoji: '👨‍👩‍👧',
            couleur: 'from-blue-500 to-blue-600',
            href: '/espace-parent/enfants',
            alerte: stats.enfants === 0 ? 'À ajouter' : null,
          },
          {
            label: 'Demandes',
            valeur: stats.demandes_total,
            emoji: '📤',
            couleur: 'from-indigo-500 to-indigo-600',
            href: '/espace-parent/demandes',
            alerte: stats.demandes_attente > 0 ? `${stats.demandes_attente} en attente` : null,
          },
          {
            label: 'Profs actifs',
            valeur: stats.profs_actifs,
            emoji: '👨‍🏫',
            couleur: 'from-emerald-500 to-teal-600',
            href: '/espace-parent/mes-profs',
            alerte: null,
          },
          {
            label: 'Paiements',
            valeur: stats.paiements_total,
            emoji: '💳',
            couleur: 'from-amber-500 to-orange-600',
            href: '/espace-parent/demandes',
            alerte: stats.paiements_attente > 0 ? `${stats.paiements_attente} en attente` : null,
          },
          {
            label: 'Avis laissés',
            valeur: stats.avis_total,
            emoji: '⭐',
            couleur: 'from-yellow-500 to-amber-600',
            href: '/espace-parent/avis',
            alerte: stats.profs_actifs > stats.avis_total ? 'À noter' : null,
          },
          {
            label: 'Notifs',
            valeur: stats.notifications_non_lues,
            emoji: '🔔',
            couleur: 'from-pink-500 to-rose-600',
            href: '/espace-parent',
            alerte: stats.notifications_non_lues > 0 ? 'Nouveau' : null,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          >
            <Link href={s.href}>
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.couleur} flex items-center justify-center text-white text-lg shadow-lg mb-2`}
                >
                  {s.emoji}
                </div>
                <div className="text-2xl font-black text-slate-900 mb-1">{s.valeur}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">
                  {s.label}
                </div>
                {s.alerte && (
                  <div className="absolute top-2 right-2 text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black">
                    {s.alerte}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* COACH IA — ACTIONS PRIORITAIRES */}
      {/* ============================================================ */}

      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg">
              🤖
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">Coach IA</h3>
              <p className="text-xs text-slate-500">
                Actions recommandées pour progresser
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {actions.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
              >
                <Link href={a.href}>
                  <div
                    className={`rounded-2xl p-4 border-2 flex items-start gap-3 transition-all hover:-translate-y-1 ${
                      a.priorite === 'haute'
                        ? 'bg-red-50 border-red-200 hover:border-red-400'
                        : a.priorite === 'moyenne'
                        ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                        : 'bg-white border-purple-100 hover:border-purple-300'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.couleur} flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0`}
                    >
                      {a.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm mb-1">
                        {a.titre}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {a.desc}
                      </div>
                    </div>
                    <span className="text-slate-400 flex-shrink-0">→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* PROFILS DES PROFS ACTIFS */}
      {/* ============================================================ */}

      {profsActifs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl shadow-lg">
                👨‍🏫
              </div>
              <div>
                <h3 className="font-black text-slate-900">
                  Mes profs actifs ({profsActifs.length})
                </h3>
                <p className="text-[10px] text-slate-500">
                  Vos professeurs en cours
                </p>
              </div>
            </div>
            <Link
              href="/espace-parent/mes-profs"
              className="text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              Voir tout →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profsActifs.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/espace-parent/profils/${p.id}`}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border-2 border-slate-100 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.nom_complet}
                        className="w-12 h-12 rounded-2xl object-cover shadow-md"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getCouleurAvatar(p.etoiles)} flex items-center justify-center text-white text-xl shadow-md`}
                      >
                        👨‍🏫
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm truncate">
                        {p.nom_complet}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {p.etoiles > 0 && (
                          <span className="text-amber-500">{'⭐'.repeat(p.etoiles)}</span>
                        )}
                        {p.note_moyenne > 0 && (
                          <span className="font-bold text-slate-700">
                            {p.note_moyenne.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    📚 {p.matiere || 'Plusieurs matières'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">
                    ✓ Depuis {new Date(p.depuis).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* DEMANDES RÉCENTES */}
      {/* ============================================================ */}

      {demandesRecentes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
                📤
              </div>
              <div>
                <h3 className="font-black text-slate-900">Demandes récentes</h3>
                <p className="text-[10px] text-slate-500">Vos 5 dernières demandes</p>
              </div>
            </div>
            <Link
              href="/espace-parent/demandes"
              className="text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              Voir tout →
            </Link>
          </div>

          <div className="space-y-2">
            {demandesRecentes.map((d, i) => {
              const statut = LABELS_STATUT[d.statut] || LABELS_STATUT.en_attente
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3 flex-wrap"
                >
                  {d.prof_photo ? (
                    <img
                      src={d.prof_photo}
                      alt={d.prof_nom}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                      👨‍🏫
                    </div>
                  )}
                  <div className="flex-1 min-w-[150px]">
                    <div className="font-bold text-slate-900 text-sm">{d.prof_nom}</div>
                    <div className="text-[10px] text-slate-500">{formaterDate(d.created_at)}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-black ${statut.bg}`}
                  >
                    {statut.emoji} {statut.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* MES ENFANTS */}
      {/* ============================================================ */}

      {enfants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xl shadow-lg">
                👨‍👩‍👧
              </div>
              <div>
                <h3 className="font-black text-slate-900">Mes enfants</h3>
                <p className="text-[10px] text-slate-500">
                  {enfants.length} enfant{enfants.length > 1 ? 's' : ''} enregistré{enfants.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link
              href="/espace-parent/enfants"
              className="text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              Gérer →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {enfants.map((e) => (
              <motion.div
                key={e.id}
                whileHover={{ y: -3 }}
                className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
                  👦
                </div>
                <div className="font-black text-slate-900 text-sm truncate mb-1">
                  {e.prenom}
                </div>
                <div className="text-[10px] text-slate-500">
                  {e.classes.length > 0
                    ? e.classes.slice(0, 2).join(', ')
                    : e.niveaux.length > 0
                    ? e.niveaux.slice(0, 2).join(', ')
                    : 'Niveau non défini'}
                </div>
              </motion.div>
            ))}
          </div>

          {enfants.length === 0 && (
            <Link href="/espace-parent/enfants">
              <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center hover:bg-blue-100 transition-all">
                <div className="text-4xl mb-2">➕</div>
                <div className="font-black text-blue-900 text-sm mb-1">
                  Ajouter mon premier enfant
                </div>
                <div className="text-[10px] text-blue-700">
                  Pour trouver les profs adaptés
                </div>
              </div>
            </Link>
          )}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* GRAPHIQUE ACTIVITÉ 7 JOURS */}
      {/* ============================================================ */}

      {stats.demandes_total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
              📊
            </div>
            <div>
              <h3 className="font-black text-slate-900">Activité (7 derniers jours)</h3>
              <p className="text-[10px] text-slate-500">
                Demandes envoyées par jour
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-32">
            {activite.map((a, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="text-[9px] text-slate-500 font-black mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {a.count}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: `${Math.max((a.count / maxActivite) * 100, 4)}%`,
                  }}
                  transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
                  className={`w-full rounded-t-md ${
                    a.count > 0
                      ? 'bg-gradient-to-t from-cyan-500 to-blue-400'
                      : 'bg-slate-200'
                  }`}
                  title={`${a.count} demande(s)`}
                />
                <div className="text-[9px] text-slate-400 font-bold mt-1 capitalize">
                  {a.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* NOTIFICATIONS RÉCENTES */}
      {/* ============================================================ */}

      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl shadow-lg">
              🔔
            </div>
            <div>
              <h3 className="font-black text-slate-900">Notifications récentes</h3>
              <p className="text-[10px] text-slate-500">
                {notifications.length} non lue{notifications.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="bg-white rounded-xl p-3 border border-amber-200 flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {n.titre}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {n.contenu}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {formaterDate(n.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* ACTIONS RAPIDES */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">
            ⚡
          </div>
          <div>
            <h3 className="font-black text-slate-900">Actions rapides</h3>
            <p className="text-[10px] text-slate-500">Accès direct aux fonctions clés</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/espace-parent/recherche', label: 'Trouver un prof', emoji: '🔍', couleur: 'from-blue-500 to-blue-600' },
            { href: '/espace-parent/enfants', label: 'Mes enfants', emoji: '👨‍👩‍👧', couleur: 'from-pink-500 to-rose-600' },
            { href: '/espace-parent/demandes', label: 'Mes demandes', emoji: '📤', couleur: 'from-indigo-500 to-purple-600' },
            { href: '/espace-parent/mes-profs', label: 'Mes profs', emoji: '👨‍🏫', couleur: 'from-emerald-500 to-teal-600' },
            { href: '/espace-parent/avis', label: 'Laisser un avis', emoji: '⭐', couleur: 'from-amber-500 to-orange-600' },
            { href: '/espace-parent/signaler', label: 'Signaler', emoji: '🚨', couleur: 'from-red-500 to-rose-600' },
            { href: '/espace-parent/profil', label: 'Mon profil', emoji: '👤', couleur: 'from-cyan-500 to-blue-600' },
            { href: '/espace-parent/charte-qualite', label: 'Charte qualité', emoji: '📜', couleur: 'from-slate-500 to-slate-700' },
          ].map((a, i) => (
            <motion.div
              key={a.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.03 }}
            >
              <Link href={a.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all text-center">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.couleur} flex items-center justify-center text-white text-2xl shadow-md`}
                  >
                    {a.emoji}
                  </div>
                  <span className="font-bold text-slate-700 text-xs">
                    {a.label}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* INFO SATISFACTION GARANTIE */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-60px] right-[-60px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10 flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border border-white/30 flex-shrink-0">
            🛡️
          </div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-black mb-2">
              Satisfaction garantie
            </h3>
            <p className="text-sm text-blue-100 mb-4 leading-relaxed">
              Si le prof ne vous plaît pas, nous le remplaçons gratuitement.
              Consultez notre charte qualité complète pour connaître tous vos droits.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/espace-parent/charte-qualite"
                className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                📜 Voir la charte
              </Link>
              <Link
                href="/espace-parent/regles"
                className="bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2"
              >
                📖 Voir les règles
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SUPPORT WHATSAPP */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10 flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border border-white/30 flex-shrink-0">
            💬
          </div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-black mb-1">
              Besoin d'aide ?
            </h3>
            <p className="text-xs text-emerald-100 mb-3">
              Notre équipe est disponible 7j/7 de 8h à 21h pour vous accompagner.
            </p>
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors shadow-lg"
            >
              💬 Contacter le support
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}