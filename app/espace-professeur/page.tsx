'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfilComplet = {
  nom_complet: string
  prenom: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string | null
  photo_url: string | null
  bio: string | null
  approuve: boolean
  masque: boolean
  banni: boolean
  motif_masquage: string | null
  motif_bannissement: string | null
  date_masquage: string | null
}

type ProfInfo = {
  etoiles: number
  note_moyenne: number
  nombre_avis: number
  nombre_demandes: number
  experience_annees: number
  mois_avec_client: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  a_bac_s: boolean
  est_etudiant: boolean
  prix_min: number | null
  prix_max: number | null
  zone_enseignement: string | null
}

type Stats = {
  demandes_total: number
  demandes_attente: number
  eleves_total: number
  creneaux: number
  matieres: number
  documents: number
  documents_total: number
}

type Notification = {
  id: string
  titre: string
  contenu: string
  lien: string | null
  lu: boolean
  created_at: string
}

type DemandeRecente = {
  id: string
  parent_nom: string
  matiere: string | null
  statut: string
  prix_souhaite: number | null
  created_at: string
}

type AvisRecent = {
  id: string
  note: number
  commentaire: string | null
  created_at: string
}

type ActiviteJour = {
  date: string
  label: string
  count: number
}

// ============================================================
// CONFIG NIVEAUX
// ============================================================

const niveauxConfig = {
  0: {
    label: 'Nouveau',
    emoji: '🆕',
    couleur: 'from-slate-500 to-slate-700',
    description: 'Bienvenue sur la plateforme !',
  },
  1: {
    label: 'Vérifié',
    emoji: '⭐',
    couleur: 'from-blue-500 to-blue-700',
    description: 'Documents vérifiés',
  },
  2: {
    label: 'Confirmé',
    emoji: '⭐⭐',
    couleur: 'from-emerald-500 to-teal-700',
    description: 'Prof confirmé par plusieurs clients',
  },
  3: {
    label: 'Expert',
    emoji: '⭐⭐⭐',
    couleur: 'from-amber-500 to-orange-700',
    description: 'Prof expert de la plateforme',
  },
}

const badgesConfig = {
  recommande: { label: 'Recommandé', emoji: '🏅', couleur: 'from-blue-500 to-blue-600' },
  super_pro: { label: 'Super-Pro', emoji: '👑', couleur: 'from-amber-500 to-orange-600' },
  pionnier: { label: 'Pionnier', emoji: '🏆', couleur: 'from-yellow-500 to-amber-600' },
  pionnier_illustre: { label: 'Pionnier Illustre', emoji: '👑', couleur: 'from-red-500 to-pink-600' },
}

// ============================================================
// HELPERS
// ============================================================

const getSalutation = (): { texte: string; emoji: string } => {
  const h = new Date().getHours()
  if (h < 12) return { texte: 'Bonjour', emoji: '☀️' }
  if (h < 18) return { texte: 'Bon après-midi', emoji: '🌤️' }
  return { texte: 'Bonsoir', emoji: '🌙' }
}

const genererConseils = (
  profil: ProfilComplet,
  prof: ProfInfo,
  stats: Stats
): { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  if (!profil.approuve) {
    conseils.push({ emoji: '⏳', texte: 'Votre profil est en attente d\'approbation.', priorite: 'haute' })
  }
  if (stats.documents < stats.documents_total) {
    conseils.push({ emoji: '📎', texte: `Ajoutez vos documents manquants (${stats.documents}/${stats.documents_total})`, priorite: 'haute' })
  }
  if (!profil.bio || profil.bio.length < 50) {
    conseils.push({ emoji: '📝', texte: 'Écrivez une bio de 50+ caractères pour attirer les parents', priorite: 'haute' })
  }
  if (!profil.photo_url) {
    conseils.push({ emoji: '📸', texte: 'Ajoutez une photo de profil professionnelle', priorite: 'haute' })
  }
  if (stats.creneaux < 6) {
    conseils.push({ emoji: '📅', texte: `Ajoutez plus de créneaux (${stats.creneaux} actuellement, 6 recommandés)`, priorite: 'moyenne' })
  }
  if (stats.matieres < 2) {
    conseils.push({ emoji: '📚', texte: 'Ajoutez plus de matières pour toucher plus de parents', priorite: 'moyenne' })
  }
  if (!prof.prix_min || !prof.prix_max) {
    conseils.push({ emoji: '💰', texte: 'Définissez vos tarifs (privés) pour valider votre dossier', priorite: 'moyenne' })
  }
  if (prof.nombre_avis < 5 && stats.eleves_total > 0) {
    conseils.push({ emoji: '⭐', texte: 'Demandez à vos élèves satisfaits de laisser un avis', priorite: 'basse' })
  }
  if (prof.etoiles < 3 && prof.mois_avec_client < 12) {
    conseils.push({ emoji: '🎯', texte: `Continuez avec vos élèves : ${12 - prof.mois_avec_client} mois pour Expert`, priorite: 'basse' })
  }
  if (conseils.length === 0) {
    conseils.push({ emoji: '✨', texte: 'Votre profil est complet et optimisé. Bravo !', priorite: 'basse' })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 5)
}

const calculerCompletion = (profil: ProfilComplet, prof: ProfInfo, stats: Stats): number => {
  const criteres = [
    profil.nom_complet.length >= 3,
    profil.telephone.length >= 12,
    profil.quartier !== null && profil.quartier.length > 0,
    profil.bio !== null && profil.bio.length > 50,
    profil.photo_url !== null,
    prof.experience_annees > 0,
    prof.zone_enseignement !== null,
    stats.matieres >= 1,
    stats.creneaux >= 1,
    prof.prix_min !== null && prof.prix_max !== null,
    stats.documents >= stats.documents_total - 1,
  ]
  const remplis = criteres.filter(Boolean).length
  return Math.round((remplis / criteres.length) * 100)
}

const getStatutCompte = (profil: ProfilComplet): 'banni' | 'masque' | 'en_attente' | 'actif' => {
  if (profil.banni) return 'banni'
  if (profil.masque) return 'masque'
  if (!profil.approuve) return 'en_attente'
  return 'actif'
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function DashboardProfesseur() {
  const supabase = createClient()

  const [profil, setProfil] = useState<ProfilComplet | null>(null)
  const [prof, setProf] = useState<ProfInfo | null>(null)
  const [stats, setStats] = useState<Stats>({
    demandes_total: 0,
    demandes_attente: 0,
    eleves_total: 0,
    creneaux: 0,
    matieres: 0,
    documents: 0,
    documents_total: 4,
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [demandesRecentes, setDemandesRecentes] = useState<DemandeRecente[]>([])
  const [avisRecents, setAvisRecents] = useState<AvisRecent[]>([])
  const [activite7j, setActivite7j] = useState<ActiviteJour[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [banniereMasque, setBanniereMasque] = useState(true)
  const [notifsOuvertes, setNotifsOuvertes] = useState(false)

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nom_complet, email, telephone, whatsapp, quartier, photo_url, bio, approuve, masque, banni, motif_masquage, motif_bannissement, date_masquage, role')
        .eq('id', user.id)
        .single()

      if (!profileData || profileData.role !== 'professeur') {
        setErreur('Accès refusé.')
        setLoading(false)
        return
      }

      setProfil({
        nom_complet: profileData.nom_complet || '',
        prenom: (profileData.nom_complet || '').split(' ')[0] || 'Prof',
        email: profileData.email || user.email || '',
        telephone: profileData.telephone || '',
        whatsapp: profileData.whatsapp || '',
        quartier: profileData.quartier || null,
        photo_url: profileData.photo_url || null,
        bio: profileData.bio || null,
        approuve: profileData.approuve === true,
        masque: profileData.masque === true,
        banni: profileData.banni === true,
        motif_masquage: profileData.motif_masquage || null,
        motif_bannissement: profileData.motif_bannissement || null,
        date_masquage: profileData.date_masquage || null,
      })

      const [
        profRes,
        demandesCount,
        demandesAttenteCount,
        elevesCount,
        creneauxCount,
        matieresCount,
        docsRes,
        notifsRes,
        demandesRecentesRes,
        avisRes,
      ] = await Promise.all([
        supabase.from('professeurs').select('etoiles, note_moyenne, nombre_avis, nombre_demandes, experience_annees, mois_avec_client, badge_admin, pionnier, pionnier_illustre, a_bac_s, est_etudiant, prix_min, prix_max, zone_enseignement, bac_s_scan_url, carte_identite_url, carte_etudiante_url, photo_profil_url').eq('id', user.id).single(),
        supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('professeur_id', user.id),
        supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('professeur_id', user.id).eq('statut', 'en_attente'),
        supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('professeur_id', user.id).eq('statut', 'acceptee'),
        supabase.from('disponibilites').select('*', { count: 'exact', head: true }).eq('professeur_id', user.id),
        supabase.from('matieres_par_prof').select('*', { count: 'exact', head: true }).eq('professeur_id', user.id),
        supabase.from('professeurs').select('bac_s_scan_url, carte_identite_url, carte_etudiante_url, photo_profil_url, a_bac_s, est_etudiant').eq('id', user.id).single(),
        supabase.from('notifications').select('id, titre, contenu, lien, lu, created_at').eq('destinataire_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('demandes').select('id, parent_id, matiere, statut, prix_souhaite, created_at').eq('professeur_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('avis').select('id, note, commentaire, created_at').eq('professeur_id', user.id).eq('publie', true).order('created_at', { ascending: false }).limit(3),
      ])

      if (profRes.data) {
        setProf({
          etoiles: profRes.data.etoiles || 0,
          note_moyenne: Number(profRes.data.note_moyenne) || 0,
          nombre_avis: profRes.data.nombre_avis || 0,
          nombre_demandes: profRes.data.nombre_demandes || 0,
          experience_annees: profRes.data.experience_annees || 0,
          mois_avec_client: profRes.data.mois_avec_client || 0,
          badge_admin: profRes.data.badge_admin || null,
          pionnier: profRes.data.pionnier === true,
          pionnier_illustre: profRes.data.pionnier_illustre === true,
          a_bac_s: profRes.data.a_bac_s === true,
          est_etudiant: profRes.data.est_etudiant === true,
          prix_min: profRes.data.prix_min ? Number(profRes.data.prix_min) : null,
          prix_max: profRes.data.prix_max ? Number(profRes.data.prix_max) : null,
          zone_enseignement: profRes.data.zone_enseignement || null,
        })
      }

      let docsFournis = 0
      let docsTotal = 2
      if (docsRes.data) {
        if (docsRes.data.bac_s_scan_url) docsFournis++
        if (docsRes.data.carte_identite_url) docsFournis++
        if (docsRes.data.photo_profil_url) docsFournis++
        if (docsRes.data.est_etudiant) {
          docsTotal++
          if (docsRes.data.carte_etudiante_url) docsFournis++
        }
      }

      setStats({
        demandes_total: demandesCount.count || 0,
        demandes_attente: demandesAttenteCount.count || 0,
        eleves_total: elevesCount.count || 0,
        creneaux: creneauxCount.count || 0,
        matieres: matieresCount.count || 0,
        documents: docsFournis,
        documents_total: docsTotal,
      })

      setNotifications(notifsRes.data || [])
      setAvisRecents(avisRes.data || [])

      const demandesFormatees: DemandeRecente[] = []
      for (const d of demandesRecentesRes.data || []) {
        const { data: parent } = await supabase.from('profiles').select('nom_complet').eq('id', d.parent_id).single()
        demandesFormatees.push({
          id: d.id,
          parent_nom: parent?.nom_complet || 'Parent',
          matiere: d.matiere,
          statut: d.statut,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          created_at: d.created_at,
        })
      }
      setDemandesRecentes(demandesFormatees)

      const maintenant = new Date()
      const activite: ActiviteJour[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(maintenant)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        const { count } = await supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('professeur_id', user.id).gte('created_at', date.toISOString()).lt('created_at', nextDay.toISOString())

        activite.push({
          date: date.toISOString(),
          label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          count: count || 0,
        })
      }
      setActivite7j(activite)
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

  const statutCompte = useMemo(() => profil ? getStatutCompte(profil) : ('actif' as const), [profil])
  const completion = useMemo(() => (profil && prof) ? calculerCompletion(profil, prof, stats) : 0, [profil, prof, stats])
  const conseils = useMemo(() => (profil && prof) ? genererConseils(profil, prof, stats) : [], [profil, prof, stats])
  const notifsNonLues = useMemo(() => notifications.filter((n) => !n.lu).length, [notifications])
  const niveauActuel = useMemo(() => prof ? (niveauxConfig[prof.etoiles as keyof typeof niveauxConfig] || niveauxConfig[0]) : niveauxConfig[0], [prof])
  const maxActivite = useMemo(() => Math.max(...activite7j.map((a) => a.count), 1), [activite7j])
  const salutation = useMemo(() => getSalutation(), [])

  const marquerToutesLues = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('notifications').update({ lu: true }).eq('destinataire_id', user.id).eq('lu', false)
      setNotifications(notifications.map((n) => ({ ...n, lu: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const contacterAdmin = (type: 'masque' | 'banni') => {
    const nom = profil?.nom_complet || 'Prof'
    const messages: Record<string, string> = {
      masque: `Bonjour Admin,\n\nJe suis ${nom} et mon profil a été masqué.\n\nMotif : ${profil?.motif_masquage || 'non précisé'}\n\nQue dois-je faire ?\n\nMerci`,
      banni: `Bonjour Admin,\n\nJe suis ${nom} et mon compte a été banni.\n\nMotif : ${profil?.motif_bannissement || 'non précisé'}\n\nMerci`,
    }
    window.open(`https://wa.me/25377741482?text=${encodeURIComponent(messages[type])}`, '_blank')
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
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const couleurStatutDemande = (statut: string) => {
    if (statut === 'acceptee') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (statut === 'refusee') return 'bg-red-100 text-red-800 border-red-200'
    if (statut === 'pre_acceptee') return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }

  const labelStatutDemande = (statut: string) => {
    if (statut === 'acceptee') return '✅ Acceptée'
    if (statut === 'refusee') return '❌ Refusée'
    if (statut === 'pre_acceptee') return '👍 Intéressé'
    if (statut === 'pre_refusee') return '👎 Non dispo'
    return '⏳ En attente'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-slate-900 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm font-medium">Chargement de votre espace...</p>
      </div>
    )
  }

  if (erreur || !profil || !prof) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 max-w-md text-center"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-rose-700 text-sm mb-6">{erreur || 'Impossible de charger'}</p>
          <button
            onClick={charger}
            className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
          >
            Réessayer
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 pb-10">

      {/* BANNIÈRES */}
      <AnimatePresence>
        {statutCompte === 'banni' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-4 sm:p-6 shadow-xl text-white"
          >
            <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                🚫
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-90">
                  Statut du compte
                </div>
                <h2 className="text-lg sm:text-xl font-black mb-2">COMPTE SUSPENDU</h2>
                <p className="text-xs sm:text-sm text-rose-100 mb-3">
                  Motif : {profil.motif_bannissement || 'Non précisé'}
                </p>
                <button
                  onClick={() => contacterAdmin('banni')}
                  className="bg-white text-rose-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm"
                >
                  📲 Contacter l'admin
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {statutCompte === 'masque' && banniereMasque && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-500 to-pink-700 rounded-2xl p-4 sm:p-6 shadow-xl text-white relative"
          >
            <button
              onClick={() => setBanniereMasque(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs"
            >
              ✕
            </button>
            <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                👻
              </div>
              <div className="flex-1 min-w-[180px]">
                <h2 className="text-lg sm:text-xl font-black mb-2">PROFIL MASQUÉ</h2>
                <p className="text-xs sm:text-sm text-purple-100 mb-3">
                  Motif : {profil.motif_masquage || 'Non précisé'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => contacterAdmin('masque')}
                    className="bg-white text-purple-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm"
                  >
                    📲 Demander réactivation
                  </button>
                  <Link
                    href="/espace-professeur/statut"
                    className="bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-white/30"
                  >
                    👁️ Détails
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {statutCompte === 'en_attente' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 shadow-xl"
          >
            <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                ⏳
              </div>
              <div className="flex-1 min-w-[180px]">
                <h3 className="text-base sm:text-lg font-black text-white mb-1">
                  Profil en attente d'approbation
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-100">
                  Notre équipe vérifie vos documents. Généralement moins de 24h.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER HERO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${niveauActuel.couleur} rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl text-white relative overflow-hidden`}
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6">
            {/* Avatar */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 flex-shrink-0 mx-auto sm:mx-0">
              {profil.photo_url ? (
                <img
                  src={profil.photo_url}
                  alt={profil.nom_complet}
                  className="w-full h-full rounded-2xl sm:rounded-3xl object-cover shadow-xl border-4 border-white/30"
                />
              ) : (
                <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-white/20 flex items-center justify-center text-white text-3xl sm:text-5xl border-4 border-white/30">
                  👨‍🏫
                </div>
              )}
              {profil.approuve && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-9 sm:h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-base border-3 border-white shadow-lg">
                  ✓
                </div>
              )}
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <span className="text-xl sm:text-2xl">{salutation.emoji}</span>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black leading-tight truncate">
                  {salutation.texte}, {profil.prenom} !
                </h1>
              </div>
              <p className="text-[11px] sm:text-sm opacity-90 mb-3">
                {niveauActuel.emoji} Niveau {niveauActuel.label}
              </p>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                {prof.badge_admin && badgesConfig[prof.badge_admin as keyof typeof badgesConfig] && (
                  <span className={`bg-gradient-to-r ${badgesConfig[prof.badge_admin as keyof typeof badgesConfig].couleur} px-2.5 py-1 rounded-full text-[10px] font-black shadow`}>
                    {badgesConfig[prof.badge_admin as keyof typeof badgesConfig].emoji} {badgesConfig[prof.badge_admin as keyof typeof badgesConfig].label}
                  </span>
                )}
                {prof.pionnier_illustre && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-600 px-2.5 py-1 rounded-full text-[10px] font-black shadow">
                    👑 Pionnier Illustre
                  </span>
                )}
                {prof.pionnier && !prof.pionnier_illustre && (
                  <span className="bg-gradient-to-r from-yellow-500 to-amber-600 px-2.5 py-1 rounded-full text-[10px] font-black shadow">
                    🏆 Pionnier
                  </span>
                )}
                {prof.a_bac_s && (
                  <span className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-black">
                    🎓 Bac S
                  </span>
                )}
                {prof.est_etudiant && (
                  <span className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-black">
                    🎓 Étudiant
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            <Link
              href="/espace-professeur/demandes"
              className="bg-white text-slate-900 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-transform"
            >
              📥 Voir les demandes
            </Link>
            <Link
              href="/espace-professeur/statut"
              className="bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-white/30 active:scale-95 transition-transform"
            >
              🏅 Mon statut
            </Link>
          </div>

          {/* Barre complétion */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                📊 Complétion
              </span>
              <span className="text-base sm:text-lg font-black">{completion}%</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* NOTIFICATIONS */}
      {notifsNonLues > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🔔</span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {notifsNonLues} nouvelle{notifsNonLues > 1 ? 's' : ''}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setNotifsOuvertes(!notifsOuvertes)}
                className="text-[11px] sm:text-xs font-bold text-blue-700"
              >
                {notifsOuvertes ? 'Masquer' : 'Voir'}
              </button>
              <button
                onClick={marquerToutesLues}
                className="text-[11px] sm:text-xs font-bold text-emerald-700"
              >
                Marquer lu
              </button>
            </div>
          </div>

          <AnimatePresence>
            {notifsOuvertes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.filter((n) => !n.lu).map((n) => (
                    <Link
                      key={n.id}
                      href={n.lien || '#'}
                      className="block bg-blue-50 rounded-xl p-3 border border-blue-100 active:bg-blue-100"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {n.titre}
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-600 line-clamp-2">
                            {n.contenu}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {formaterDate(n.created_at)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 5 KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Demandes', valeur: stats.demandes_total, emoji: '📥', couleur: 'from-blue-500 to-blue-600', href: '/espace-professeur/demandes', alerte: stats.demandes_attente > 0 ? stats.demandes_attente : null },
          { label: 'Élèves', valeur: stats.eleves_total, emoji: '👨‍🎓', couleur: 'from-emerald-500 to-emerald-600', href: '/espace-professeur/eleves', alerte: null },
          { label: 'Créneaux', valeur: stats.creneaux, emoji: '📅', couleur: 'from-purple-500 to-purple-600', href: '/espace-professeur/disponibilites', alerte: stats.creneaux < 6 ? '+' : null },
          { label: 'Note', valeur: prof.note_moyenne > 0 ? prof.note_moyenne.toFixed(1) : '—', emoji: '⭐', couleur: 'from-amber-500 to-amber-600', href: '/espace-professeur/statut', alerte: null },
          { label: 'Étoiles', valeur: `${prof.etoiles}/3`, emoji: '🌟', couleur: 'from-yellow-500 to-orange-600', href: '/espace-professeur/statut', alerte: null },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          >
            <Link href={s.href}>
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm active:scale-95 transition-transform relative">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${s.couleur} flex items-center justify-center text-white text-lg sm:text-xl shadow-md mb-2`}>
                  {s.emoji}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mb-0.5">
                  {s.valeur}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">
                  {s.label}
                </div>
                {s.alerte && (
                  <div className="absolute top-2 right-2 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-black">
                    {s.alerte}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* GRAPHIQUE 7 JOURS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg sm:text-xl shadow-md">
            📊
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Activité (7 jours)</h3>
            <p className="text-[10px] text-slate-500">Demandes reçues</p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-1 h-24 sm:h-32">
          {activite7j.map((a, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div className="text-[9px] text-slate-500 font-black mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {a.count}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((a.count / maxActivite) * 100, 4)}%` }}
                transition={{ delay: 0.35 + i * 0.05, duration: 0.5 }}
                className={`w-full rounded-t-md ${
                  a.count > 0 ? 'bg-gradient-to-t from-cyan-500 to-blue-400' : 'bg-slate-200'
                }`}
              />
              <div className="text-[9px] text-slate-400 font-bold mt-1 capitalize">
                {a.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* COACH IA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-purple-200 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl sm:text-2xl shadow-md">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Coach IA</h3>
            <p className="text-[11px] text-slate-500">Actions pour progresser</p>
          </div>
        </div>

        <div className="space-y-2">
          {conseils.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className={`rounded-xl p-2.5 sm:p-3 border flex items-start gap-2 sm:gap-3 ${
                c.priorite === 'haute' ? 'bg-rose-50 border-rose-200' :
                c.priorite === 'moyenne' ? 'bg-amber-50 border-amber-200' :
                'bg-white border-purple-100'
              }`}
            >
              <span className="text-lg sm:text-xl flex-shrink-0">{c.emoji}</span>
              <p className="text-[12px] sm:text-sm text-slate-800 font-medium flex-1 leading-snug">
                {c.texte}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* DERNIÈRES DEMANDES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl shadow-md">
              📥
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Dernières demandes</h3>
              <p className="text-[10px] text-slate-500">Les 3 plus récentes</p>
            </div>
          </div>
          <Link
            href="/espace-professeur/demandes"
            className="text-[11px] sm:text-xs font-bold text-blue-700"
          >
            Voir tout →
          </Link>
        </div>

        {demandesRecentes.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-slate-500 text-xs sm:text-sm">Aucune demande pour le moment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {demandesRecentes.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base sm:text-lg flex-shrink-0">
                  👨‍👩‍👧
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {d.parent_nom}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {d.matiere || 'Non spécifié'} · {formaterDate(d.created_at)}
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded-full font-bold border flex-shrink-0 ${couleurStatutDemande(d.statut)}`}>
                  {labelStatutDemande(d.statut)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* DERNIERS AVIS */}
      {avisRecents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg sm:text-xl shadow-md">
                ⭐
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Derniers avis</h3>
                <p className="text-[10px] text-slate-500">Ce que disent vos élèves</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {avisRecents.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="bg-amber-50 rounded-xl p-3 border border-amber-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs sm:text-sm">{'⭐'.repeat(a.note)}</span>
                  <span className="text-[10px] text-slate-500">
                    {formaterDate(a.created_at)}
                  </span>
                </div>
                {a.commentaire && (
                  <p className="text-[11px] sm:text-xs text-slate-700 italic line-clamp-2">
                    « {a.commentaire} »
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ACTIONS RAPIDES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm"
      >
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
          <span className="text-lg sm:text-xl">🚀</span>
          <span>Actions rapides</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {[
            { href: '/espace-professeur/profil', label: 'Profil', emoji: '👤', couleur: 'from-blue-500 to-blue-600' },
            { href: '/espace-professeur/disponibilites', label: 'Horaires', emoji: '📅', couleur: 'from-purple-500 to-purple-600' },
            { href: '/espace-professeur/matieres', label: 'Matières', emoji: '📚', couleur: 'from-emerald-500 to-emerald-600' },
            { href: '/espace-professeur/tarifs', label: 'Tarifs', emoji: '💰', couleur: 'from-amber-500 to-amber-600' },
            { href: '/espace-professeur/documents', label: 'Documents', emoji: '📎', couleur: 'from-pink-500 to-pink-600' },
            { href: '/espace-professeur/demandes', label: 'Demandes', emoji: '📥', couleur: 'from-cyan-500 to-blue-600' },
            { href: '/espace-professeur/eleves', label: 'Élèves', emoji: '👨‍🎓', couleur: 'from-indigo-500 to-indigo-600' },
            { href: '/espace-professeur/apercu', label: 'Aperçu', emoji: '👁️', couleur: 'from-rose-500 to-pink-600' },
          ].map((a, i) => (
            <motion.div
              key={a.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.03 }}
            >
              <Link href={a.href}>
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 active:scale-95 transition-transform text-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${a.couleur} flex items-center justify-center text-white text-lg sm:text-xl shadow-md`}>
                    {a.emoji}
                  </div>
                  <span className="font-bold text-slate-700 text-[10px] sm:text-xs">
                    {a.label}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* SUPPORT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl text-white"
      >
        <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
            💬
          </div>
          <div className="flex-1 min-w-[180px]">
            <h3 className="text-base sm:text-lg font-black mb-1">
              Besoin d'aide ?
            </h3>
            <p className="text-[11px] sm:text-xs text-emerald-100 mb-3">
              Disponible 7j/7 pour vous accompagner.
            </p>
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-transform"
            >
              💬 Contacter le support
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}