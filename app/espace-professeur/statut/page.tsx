'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BadgeEtoiles from '@/components/BadgeEtoiles'

// ============================================================
// TYPES
// ============================================================

type StatutProf = {
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  mois_avec_client: number
  note_moyenne: number
  nombre_avis: number
  nombre_demandes: number
  experience_annees: number
  created_at: string
  date_derniere_etoile: string | null
  a_bac_s: boolean
  est_etudiant: boolean
}

type StatutCompte = {
  masque: boolean
  banni: boolean
  motif_masquage: string | null
  motif_bannissement: string | null
  date_masquage: string | null
  approuve: boolean
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string | null
  photo_url: string | null
}

type Avis = {
  id: string
  note: number
  commentaire: string | null
  created_at: string
}

type DemandeAmelioration = {
  id: string
  type: string
  motif: string
  statut: string
  created_at: string
}

type MoisEvolution = {
  label: string
  note: number
  count: number
}

// ============================================================
// CONFIGURATION NIVEAUX
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

// ============================================================
// CONFIGURATION BADGES
// ============================================================

const badgesConfig = [
  {
    key: 'recommande',
    emoji: '🏅',
    label: 'Recommandé',
    desc: 'Donné par l\'admin pour un prof exceptionnel',
    couleur: 'from-blue-500 to-blue-700',
    howToGet: 'Sois régulier, poli, et obtiens de bons avis.',
  },
  {
    key: 'super_pro',
    emoji: '👑',
    label: 'Super-Pro',
    desc: 'Réservé aux meilleurs profs de la plateforme',
    couleur: 'from-amber-500 to-orange-700',
    howToGet: 'Atteins le niveau 3 étoiles et maintiens une note > 4.7.',
  },
  {
    key: 'pionnier',
    emoji: '🏆',
    label: 'Pionnier',
    desc: 'Pour les 50 premiers inscrits',
    couleur: 'from-yellow-500 to-amber-700',
    howToGet: 'Fais partie des 50 premiers profs inscrits.',
  },
  {
    key: 'pionnier_illustre',
    emoji: '👑',
    label: 'Pionnier Illustre',
    desc: 'Badge VIP spécial de l\'admin',
    couleur: 'from-red-500 to-pink-700',
    howToGet: 'Badge d\'honneur donné manuellement par l\'admin.',
  },
]

// ============================================================
// OBJECTIFS / ACHIEVEMENTS
// ============================================================

const objectifsConfig = [
  {
    id: 'first_avis',
    emoji: '🌱',
    label: 'Premier avis',
    desc: 'Reçois ton premier avis',
    check: (s: StatutProf) => s.nombre_avis >= 1,
    recompense: '🎯 Tu débutes !',
  },
  {
    id: 'cinq_avis',
    emoji: '🌟',
    label: '5 avis reçus',
    desc: 'Obtiens 5 avis positifs',
    check: (s: StatutProf) => s.nombre_avis >= 5,
    recompense: '⭐ Niveau 1 accessible',
  },
  {
    id: 'dix_avis',
    emoji: '💎',
    label: '10 avis',
    desc: 'Atteins 10 avis',
    check: (s: StatutProf) => s.nombre_avis >= 10,
    recompense: '🏅 Éligible Recommandé',
  },
  {
    id: 'note_4_5',
    emoji: '✨',
    label: 'Note 4.5+',
    desc: 'Maintiens une note de 4.5+',
    check: (s: StatutProf) => s.note_moyenne >= 4.5,
    recompense: '🌟 Prof d\'exception',
  },
  {
    id: 'six_mois',
    emoji: '📅',
    label: '6 mois d\'activité',
    desc: 'Sois actif pendant 6 mois',
    check: (s: StatutProf) => s.mois_avec_client >= 6,
    recompense: '⏰ Fidélité récompensée',
  },
  {
    id: 'douze_mois',
    emoji: '👑',
    label: '12 mois',
    desc: 'Une année complète',
    check: (s: StatutProf) => s.mois_avec_client >= 12,
    recompense: '🏆 Niveau Expert accessible',
  },
]

// ============================================================
// HELPER : Calculateur live de progression
// ============================================================

const calculerProgression = (statut: StatutProf) => {
  const niveauActuel = statut.etoiles
  const prochainNiveau = niveauActuel + 1

  if (prochainNiveau === 1) {
    const docsRequis = 2 // Bac S + Carte identité
    let docsFournis = 0
    if (statut.a_bac_s) docsFournis++
    return {
      niveau: 1,
      progression: (docsFournis / docsRequis) * 100,
      critere: `${docsFournis}/${docsRequis} documents fournis`,
      ilManque: docsRequis - docsFournis > 0
        ? `Il te manque ${docsRequis - docsFournis} document(s)`
        : 'Prêt à passer niveau 1 !',
      prediction: 'Dès que tes documents sont validés',
    }
  }

  if (prochainNiveau === 2) {
    const moisRequis = 5
    const progression = Math.min((statut.mois_avec_client / moisRequis) * 100, 100)
    const manquant = Math.max(moisRequis - statut.mois_avec_client, 0)
    return {
      niveau: 2,
      progression,
      critere: `${statut.mois_avec_client}/${moisRequis} mois avec un client`,
      ilManque: manquant > 0
        ? `Il te manque ${manquant} mois d'activité`
        : 'Prêt à passer niveau 2 !',
      prediction: manquant > 0
        ? `Environ ${manquant} mois`
        : 'Bientôt !',
    }
  }

  if (prochainNiveau === 3) {
    const moisRequis = 12
    const noteRequise = 4.5
    const progressMois = Math.min((statut.mois_avec_client / moisRequis) * 100, 100)
    const progressNote = Math.min((statut.note_moyenne / noteRequise) * 100, 100)
    const progression = (progressMois + progressNote) / 2
    const moisManquant = Math.max(moisRequis - statut.mois_avec_client, 0)
    const noteManquante = Math.max(noteRequise - statut.note_moyenne, 0)

    let ilManque = ''
    if (moisManquant > 0 && noteManquante > 0) {
      ilManque = `${moisManquant} mois + note à ${noteRequise}`
    } else if (moisManquant > 0) {
      ilManque = `${moisManquant} mois d'activité`
    } else if (noteManquante > 0) {
      ilManque = `Note à ${noteRequise} (actuellement ${statut.note_moyenne.toFixed(1)})`
    } else {
      ilManque = 'Prêt à passer niveau 3 !'
    }

    return {
      niveau: 3,
      progression,
      critere: `${statut.mois_avec_client}/${moisRequis} mois · ${statut.note_moyenne.toFixed(1)}/${noteRequise}`,
      ilManque,
      prediction: moisManquant > 0 ? `Environ ${moisManquant} mois` : 'Bientôt !',
    }
  }

  return {
    niveau: 3,
    progression: 100,
    critere: 'Niveau maximum atteint',
    ilManque: 'Tu es au sommet ! 🏆',
    prediction: 'Félicitations !',
  }
}

// ============================================================
// HELPER : Conseils personnalisés (Coach IA)
// ============================================================

const genererConseils = (statut: StatutProf): string[] => {
  const conseils: string[] = []

  if (statut.nombre_avis === 0) {
    conseils.push('📢 Complète ton profil à 100% pour attirer les premiers parents')
    conseils.push('💬 Réponds rapidement aux demandes pour gagner la confiance')
  } else if (statut.nombre_avis < 5) {
    conseils.push(`⭐ Il te manque ${5 - statut.nombre_avis} avis pour atteindre le niveau 2`)
    conseils.push('🎯 Demande à tes élèves satisfaits de laisser un avis')
  }

  if (statut.note_moyenne > 0 && statut.note_moyenne < 4.5) {
    conseils.push('📈 Une note > 4.5 débloque le niveau Expert')
  }

  if (statut.mois_avec_client < 5) {
    conseils.push(`⏰ Continue avec tes élèves actuels : ${5 - statut.mois_avec_client} mois restants pour niveau 2`)
  }

  if (!statut.a_bac_s) {
    conseils.push('🎓 Ajoute ton Bac S pour débloquer les matières scientifiques')
  }

  if (!statut.est_etudiant && statut.experience_annees < 2) {
    conseils.push('💼 Ajoute ton expérience d\'enseignement pour rassurer les parents')
  }

  if (statut.mois_avec_client >= 12 && statut.note_moyenne >= 4.5) {
    conseils.push('🏆 Tu peux prétendre au badge Super-Pro !')
  }

  if (conseils.length === 0) {
    conseils.push('✨ Continue comme ça, tu es sur la bonne voie !')
  }

  return conseils.slice(0, 4)
}

// ============================================================
// HELPER : Calcul évolution mensuelle de la note
// ============================================================

const calculerEvolutionMensuelle = (avis: Avis[]): MoisEvolution[] => {
  if (avis.length === 0) return []

  const moisData: { [k: string]: { notes: number[] } } = {}
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    moisData[cle] = { notes: [] }
  }

  avis.forEach((a) => {
    const d = new Date(a.created_at)
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (moisData[cle]) {
      moisData[cle].notes.push(a.note)
    }
  })

  return Object.entries(moisData).map(([cle, data]) => {
    const [year, month] = cle.split('-')
    const d = new Date(parseInt(year), parseInt(month) - 1, 1)
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      note:
        data.notes.length > 0
          ? data.notes.reduce((a, b) => a + b, 0) / data.notes.length
          : 0,
      count: data.notes.length,
    }
  })
}

// ============================================================
// HELPER : Rang du prof
// ============================================================

const calculerRang = (
  statut: StatutProf,
  tousProfs: { etoiles: number; note_moyenne: number; nombre_avis: number }[]
): { rang: number; total: number; top: number } => {
  if (tousProfs.length === 0) return { rang: 0, total: 0, top: 0 }

  const score = statut.note_moyenne * 20 + statut.etoiles * 15 + Math.min(statut.nombre_avis, 50)

  const scores = tousProfs.map((p) => ({
    score: p.note_moyenne * 20 + p.etoiles * 15 + Math.min(p.nombre_avis, 50),
  }))

  const rang = scores.filter((s) => s.score > score).length + 1
  const top = Math.round((1 - (rang - 1) / tousProfs.length) * 100)

  return { rang, total: tousProfs.length, top }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function MonStatut() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [statut, setStatut] = useState<StatutProf | null>(null)
  const [compte, setCompte] = useState<StatutCompte | null>(null)
  const [avis, setAvis] = useState<Avis[]>([])
  const [demandes, setDemandes] = useState<DemandeAmelioration[]>([])
  const [tousProfs, setTousProfs] = useState<
    { etoiles: number; note_moyenne: number; nombre_avis: number }[]
  >([])
  const [loading, setLoading] = useState(true)

  // ---- ÉTATS UI ----
  const [modalOuvert, setModalOuvert] = useState(false)
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')
  const [etoileOuverte, setEtoileOuverte] = useState<number | null>(null)
  const [badgeOuvert, setBadgeOuvert] = useState<string | null>(null)
  const [objectifOuvert, setObjectifOuvert] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const [banniereMasque, setBanniereMasque] = useState(true)
  const [activeTab, setActiveTab] = useState<'progression' | 'avis' | 'demandes'>('progression')

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [statutRes, compteRes, avisRes, demandesRes, tousProfsRes] = await Promise.all([
      supabase
        .from('professeurs')
        .select(
          'etoiles, badge_admin, pionnier, pionnier_illustre, mois_avec_client, note_moyenne, nombre_avis, nombre_demandes, experience_annees, created_at, date_derniere_etoile, a_bac_s, est_etudiant'
        )
        .eq('id', user.id)
        .single(),
      supabase
        .from('profiles')
        .select(
          'masque, banni, motif_masquage, motif_bannissement, date_masquage, approuve, nom_complet, email, telephone, whatsapp, quartier, photo_url'
        )
        .eq('id', user.id)
        .single(),
      supabase
        .from('avis')
        .select('id, note, commentaire, created_at')
        .eq('professeur_id', user.id)
        .eq('publie', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('demandes_amelioration')
        .select('id, type, motif, statut, created_at')
        .eq('professeur_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('professeurs')
        .select('etoiles, note_moyenne, nombre_avis')
        .eq('banni', false)
        .limit(500),
    ])

    if (statutRes.data) {
      setStatut({
        etoiles: statutRes.data.etoiles || 0,
        badge_admin: statutRes.data.badge_admin,
        pionnier: statutRes.data.pionnier || false,
        pionnier_illustre: statutRes.data.pionnier_illustre || false,
        mois_avec_client: statutRes.data.mois_avec_client || 0,
        note_moyenne: statutRes.data.note_moyenne || 0,
        nombre_avis: statutRes.data.nombre_avis || 0,
        nombre_demandes: statutRes.data.nombre_demandes || 0,
        experience_annees: statutRes.data.experience_annees || 0,
        created_at: statutRes.data.created_at || '',
        date_derniere_etoile: statutRes.data.date_derniere_etoile || null,
        a_bac_s: statutRes.data.a_bac_s === true,
        est_etudiant: statutRes.data.est_etudiant === true,
      })
    }

    if (compteRes.data) {
      setCompte({
        masque: compteRes.data.masque === true,
        banni: compteRes.data.banni === true,
        motif_masquage: compteRes.data.motif_masquage || null,
        motif_bannissement: compteRes.data.motif_bannissement || null,
        date_masquage: compteRes.data.date_masquage || null,
        approuve: compteRes.data.approuve === true,
        nom_complet: compteRes.data.nom_complet || '',
        email: compteRes.data.email || '',
        telephone: compteRes.data.telephone || '',
        whatsapp: compteRes.data.whatsapp || '',
        quartier: compteRes.data.quartier || null,
        photo_url: compteRes.data.photo_url || null,
      })
    }

    setAvis(avisRes.data || [])
    setDemandes(demandesRes.data || [])
    setTousProfs(tousProfsRes.data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // CALCULS
  // ============================================================

  const progression = useMemo(() => {
    if (!statut) return null
    return calculerProgression(statut)
  }, [statut])

  const evolutionMensuelle = useMemo(() => {
    return calculerEvolutionMensuelle(avis)
  }, [avis])

  const rang = useMemo(() => {
    if (!statut) return null
    return calculerRang(statut, tousProfs)
  }, [statut, tousProfs])

  const conseils = useMemo(() => {
    if (!statut) return []
    return genererConseils(statut)
  }, [statut])

  const moyenneGenerale = useMemo(() => {
    if (tousProfs.length === 0) return 0
    const avec = tousProfs.filter((p) => p.nombre_avis > 0)
    if (avec.length === 0) return 0
    return avec.reduce((acc, p) => acc + p.note_moyenne, 0) / avec.length
  }, [tousProfs])

  const repartitionNotes = useMemo(() => {
    const repartition = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
    avis.forEach((a) => {
      if (a.note >= 1 && a.note <= 5) {
        repartition[a.note] = (repartition[a.note] || 0) + 1
      }
    })
    return repartition
  }, [avis])

  const joursInscription = useMemo(() => {
    if (!statut?.created_at) return 0
    const diff = Date.now() - new Date(statut.created_at).getTime()
    return Math.floor(diff / 86400000)
  }, [statut])

  // ============================================================
  // ACTIONS
  // ============================================================

  const envoyerDemande = async () => {
    if (motif.trim().length < 20) {
      setErreur('Le motif doit contenir au moins 20 caractères')
      return
    }

    setEnvoi(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('demandes_amelioration').insert({
        professeur_id: user.id,
        type: 'etoile',
        motif: motif.trim(),
        statut: 'en_attente',
      })

      if (error) throw error

      setSucces(true)
      setMotif('')
      await charger()
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setEnvoi(false)
    }
  }

  const contacterAdmin = (type: 'masque' | 'banni' | 'amelioration') => {
    const nom = compte?.nom_complet || 'Prof'
    const messages: Record<string, string> = {
      masque: `Bonjour Admin,\n\nJe suis ${nom} et je vois que mon profil a été masqué.\n\nMotif : ${compte?.motif_masquage || 'non précisé'}\n\nQue dois-je faire pour être réactivé ?\n\nMerci`,
      banni: `Bonjour Admin,\n\nJe suis ${nom} et mon compte a été banni.\n\nMotif : ${compte?.motif_bannissement || 'non précisé'}\n\nPuis-je avoir plus d'informations ?\n\nMerci`,
      amelioration: `Bonjour Admin,\n\nJe suis ${nom} et je souhaite discuter de mon statut sur la plateforme.\n\nMerci`,
    }
    window.open(
      `https://wa.me/25377741482?text=${encodeURIComponent(messages[type])}`,
      '_blank'
    )
  }

  const copierLien = () => {
    const lien = `${window.location.origin}/professeurs/${statut?.created_at || 'profil'}`
    navigator.clipboard.writeText(lien)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  const partagerWhatsApp = () => {
    const message = `Découvrez mon profil de professeur sur Prof À Domicile Djibouti !`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  // ============================================================
  // CHARGEMENT / ERREUR
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!statut || !compte) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/80 shadow-xl text-center">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-slate-600">Statut introuvable</p>
      </div>
    )
  }

  const niveauActuel = niveauxConfig[statut.etoiles as keyof typeof niveauxConfig]
  const badgeActuel = badgesConfig.filter((b) => {
    if (b.key === 'recommande') return statut.badge_admin === 'recommande'
    if (b.key === 'super_pro') return statut.badge_admin === 'super_pro'
    if (b.key === 'pionnier') return statut.pionnier
    if (b.key === 'pionnier_illustre') return statut.pionnier_illustre
    return false
  })
  const badgesObtenus = badgeActuel.length
  const objectifsAtteints = objectifsConfig.filter((o) => o.check(statut)).length 
  return (
    <div className="space-y-6">
      <Link
        href="/espace-professeur"
        className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* ============================================================ */}
      {/* SECTION 1 : STATUT COMPTE (MASQUÉ / BANNI / VISIBLE) */}
      {/* ============================================================ */}

      {compte.banni && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-500 via-red-600 to-rose-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
        >
          <motion.div
            className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl border-2 border-white/30">
                🚫
              </div>
              <div>
                <div className="text-xs font-bold text-red-100 uppercase tracking-wider mb-1">
                  Statut du compte
                </div>
                <h2 className="text-3xl font-black">COMPTE SUSPENDU</h2>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
              <div className="text-xs font-bold text-red-100 uppercase tracking-wider mb-2">
                Motif du bannissement
              </div>
              <p className="text-white font-medium leading-relaxed whitespace-pre-line">
                {compte.motif_bannissement || 'Aucun motif précisé'}
              </p>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-300/40 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-black mb-1">Votre compte est suspendu</div>
                  <p className="text-sm text-red-100">
                    Vous ne pouvez plus recevoir de nouvelles demandes ni apparaître dans les
                    recherches. Contactez l'administrateur pour plus d'informations.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => contacterAdmin('banni')}
              className="w-full bg-white text-red-700 px-6 py-4 rounded-2xl font-black shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-3 text-lg"
            >
              <span className="text-2xl">📲</span>
              <span>Contacter l'administrateur sur WhatsApp</span>
            </button>
          </div>
        </motion.div>
      )}

      {compte.masque && !compte.banni && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
        >
          <motion.div
            className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl border-2 border-white/30">
                👻
              </div>
              <div>
                <div className="text-xs font-bold text-purple-100 uppercase tracking-wider mb-1">
                  Statut du profil
                </div>
                <h2 className="text-3xl font-black">PROFIL MASQUÉ</h2>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
              <div className="text-xs font-bold text-purple-100 uppercase tracking-wider mb-2">
                Motif du masquage
              </div>
              <p className="text-white font-medium leading-relaxed whitespace-pre-line">
                {compte.motif_masquage || 'Aucun motif précisé'}
              </p>
              {compte.date_masquage && (
                <div className="text-xs text-purple-200 mt-3">
                  📅 Masqué le{' '}
                  {new Date(compte.date_masquage).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-black mb-2">Que se passe-t-il ?</div>
                  <ul className="text-sm text-purple-100 space-y-1.5 list-disc list-inside">
                    <li>Vous pouvez toujours vous connecter à votre espace</li>
                    <li>Votre profil n'apparaît plus dans les recherches des parents</li>
                    <li>Vous ne recevez plus de nouvelles demandes</li>
                    <li>Vous conservez vos élèves actuels</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => contacterAdmin('masque')}
              className="w-full bg-white text-purple-700 px-6 py-4 rounded-2xl font-black shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-3 text-lg"
            >
              <span className="text-2xl">📲</span>
              <span>Demander la réactivation</span>
            </button>
          </div>
        </motion.div>
      )}

      {!compte.masque && !compte.banni && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-5 border-2 border-emerald-400 shadow-xl flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-2 border-white/30 flex-shrink-0">
            ✅
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-white mb-1">
              Profil actif et visible
            </h3>
            <p className="text-xs text-emerald-100">
              Vous apparaissez dans les recherches et pouvez recevoir des demandes.
            </p>
          </div>
          <div className="hidden md:flex flex-col gap-1">
            <span className="text-[10px] bg-white/20 text-white px-3 py-1 rounded-full font-black">
              🟢 EN LIGNE
            </span>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2 : HEADER HERO avec jauge */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${niveauActuel.couleur} rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden`}
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-white/5 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">
              Mon statut actuel
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">
              <span>{niveauActuel.emoji}</span>
              <span>{niveauActuel.label}</span>
            </h1>
            <p className="text-sm opacity-90 mb-4">{niveauActuel.description}</p>

            <div className="flex flex-wrap gap-2">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black">
                📅 {joursInscription} jours
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black">
                💬 {statut.nombre_avis} avis
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black">
                ⭐ {statut.note_moyenne.toFixed(1)}/5
              </span>
              {rang && rang.rang > 0 && (
                <span className="bg-yellow-400/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black border border-yellow-300/50">
                  🏆 #{rang.rang} sur {rang.total}
                </span>
              )}
            </div>

            <div className="mt-5">
              <BadgeEtoiles
                etoiles={statut.etoiles}
                badgeAdmin={statut.badge_admin}
                pionnier={statut.pionnier}
                pionnierIllustre={statut.pionnier_illustre}
                taille="lg"
              />
            </div>
          </div>

          {/* Jauge circulaire */}
          <div className="relative w-40 h-40 mx-auto md:mx-0">
            <svg className="transform -rotate-90" width="160" height="160">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="10"
                fill="none"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke="white"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 70}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 70 * (1 - (progression?.progression || 0) / 100),
                }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-black">
                {Math.round(progression?.progression || 0)}%
              </div>
              <div className="text-[10px] font-black opacity-90">
                VERS NIVEAU {progression?.niveau}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 3 : PROGRESSION + CALCULATEUR LIVE */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span>Ma progression</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
            <div className="text-xs font-black text-blue-700 uppercase mb-2">
              Critère actuel
            </div>
            <div className="text-lg font-black text-slate-900 mb-2">
              {progression?.critere}
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progression?.progression || 0}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
            <div className="text-xs font-black text-amber-700 uppercase mb-2">
              Il te manque
            </div>
            <div className="text-lg font-black text-slate-900 mb-2">
              {progression?.ilManque}
            </div>
            <div className="text-xs text-slate-600">
              🔮 {progression?.prediction}
            </div>
          </div>
        </div>

        {/* Coach IA */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🤖</div>
            <div>
              <div className="font-black text-slate-900">Coach IA</div>
              <div className="text-xs text-slate-500">Conseils personnalisés</div>
            </div>
          </div>
          <div className="space-y-2">
            {conseils.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="bg-white rounded-xl p-3 border border-purple-100 flex items-start gap-2"
              >
                <span className="text-xs text-purple-600 font-black">💡</span>
                <p className="text-xs text-slate-700 font-medium">{c}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 4 : ÉTOILES (TIMELINE + CONFETTI) */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <span>Mes étoiles</span>
        </h2>

        <div className="space-y-4">
          {[
            {
              niveau: 1,
              label: 'Vérifié',
              desc: 'Documents fournis et vérifiés',
              critere: 'Fournir tous les documents obligatoires',
              atteint: statut.etoiles >= 1,
              emoji: '⭐',
              couleur: 'from-blue-500 to-blue-700',
            },
            {
              niveau: 2,
              label: 'Confirmé',
              desc: 'Plus de 5 mois avec un client',
              critere: `${statut.mois_avec_client}/5 mois avec un client`,
              atteint: statut.etoiles >= 2,
              emoji: '⭐⭐',
              couleur: 'from-emerald-500 to-teal-700',
            },
            {
              niveau: 3,
              label: 'Expert',
              desc: '12+ mois + note > 4.5',
              critere: `${statut.mois_avec_client}/12 mois · ${statut.note_moyenne.toFixed(1)}/4.5`,
              atteint: statut.etoiles >= 3,
              emoji: '⭐⭐⭐',
              couleur: 'from-amber-500 to-orange-700',
            },
          ].map((e, i) => {
            const ouverte = etoileOuverte === e.niveau
            return (
              <motion.div
                key={e.niveau}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  e.atteint
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <button
                  onClick={() => setEtoileOuverte(ouverte ? null : e.niveau)}
                  className="w-full p-5 flex items-center gap-4 text-left"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0 transition-all ${
                      e.atteint
                        ? `bg-gradient-to-br ${e.couleur}`
                        : 'bg-slate-200'
                    }`}
                  >
                    {e.atteint ? e.emoji : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-black text-slate-900 text-base">
                        Niveau {e.niveau} — {e.label}
                      </span>
                      {e.atteint && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black"
                        >
                          ✓ ATTEINT
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{e.desc}</p>
                  </div>
                  <span className="text-slate-400 text-lg">
                    {ouverte ? '▼' : '▶'}
                  </span>
                </button>

                <AnimatePresence>
                  {ouverte && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-slate-200 pt-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-100">
                          <div className="text-xs font-black text-slate-500 uppercase mb-2">
                            📊 Progression
                          </div>
                          <p
                            className={`text-sm font-bold ${
                              e.atteint ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {e.critere}
                          </p>
                          {!e.atteint && (
                            <div className="mt-3">
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width:
                                      e.niveau === 1
                                        ? statut.a_bac_s
                                          ? '50%'
                                          : '25%'
                                        : e.niveau === 2
                                        ? `${Math.min((statut.mois_avec_client / 5) * 100, 100)}%`
                                        : `${Math.min((statut.note_moyenne / 4.5) * 100, 100)}%`,
                                  }}
                                  transition={{ duration: 0.8 }}
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 5 : BADGES */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-2xl">🏅</span>
            <span>Mes badges</span>
          </h2>
          <span className="text-xs font-black text-slate-500">
            {badgesObtenus}/{badgesConfig.length} obtenus
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {badgesConfig.map((b, i) => {
            const actif =
              (b.key === 'recommande' && statut.badge_admin === 'recommande') ||
              (b.key === 'super_pro' && statut.badge_admin === 'super_pro') ||
              (b.key === 'pionnier' && statut.pionnier) ||
              (b.key === 'pionnier_illustre' && statut.pionnier_illustre)

            const ouvert = badgeOuvert === b.key

            return (
              <motion.div
                key={b.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  actif
                    ? `bg-gradient-to-br ${b.couleur} text-white border-transparent shadow-lg relative`
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {actif && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                      background: [
                        'linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                        'linear-gradient(120deg, transparent 60%, rgba(255,255,255,0.3) 70%, transparent 80%)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                <button
                  onClick={() => setBadgeOuvert(ouvert ? null : b.key)}
                  className="w-full p-4 text-left relative"
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="text-3xl"
                      animate={actif ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {b.emoji}
                    </motion.div>
                    <div className="flex-1">
                      <div
                        className={`font-black mb-1 ${
                          actif ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {b.label}
                      </div>
                      <p
                        className={`text-xs ${
                          actif ? 'text-white/90' : 'text-slate-500'
                        }`}
                      >
                        {b.desc}
                      </p>
                      {actif && (
                        <div className="mt-2 text-[10px] font-black bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full inline-block">
                          ✓ OBTENU
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-lg ${actif ? 'text-white/70' : 'text-slate-400'}`}
                    >
                      {ouvert ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {ouvert && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`px-4 pb-4 pt-2 border-t ${
                          actif ? 'border-white/20' : 'border-slate-200'
                        }`}
                      >
                        <div
                          className={`text-xs font-black uppercase mb-1 ${
                            actif ? 'text-white/80' : 'text-slate-500'
                          }`}
                        >
                          🎯 Comment l'obtenir ?
                        </div>
                        <p
                          className={`text-xs font-medium ${
                            actif ? 'text-white/90' : 'text-slate-600'
                          }`}
                        >
                          {b.howToGet}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 6 : STATS & COMPARAISON */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span>Mes statistiques</span>
        </h2>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
            <div className="text-[10px] font-black text-amber-700 uppercase">Note</div>
            <div className="text-2xl font-black text-slate-900">
              {statut.note_moyenne.toFixed(1)}
            </div>
            <div className="text-[10px] text-amber-600">/ 5</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="text-[10px] font-black text-blue-700 uppercase">Avis</div>
            <div className="text-2xl font-black text-slate-900">{statut.nombre_avis}</div>
            <div className="text-[10px] text-blue-600">reçus</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-200">
            <div className="text-[10px] font-black text-emerald-700 uppercase">
              Demandes
            </div>
            <div className="text-2xl font-black text-slate-900">{statut.nombre_demandes}</div>
            <div className="text-[10px] text-emerald-600">reçues</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
            <div className="text-[10px] font-black text-purple-700 uppercase">Mois</div>
            <div className="text-2xl font-black text-slate-900">{statut.mois_avec_client}</div>
            <div className="text-[10px] text-purple-600">avec clients</div>
          </div>
        </div>

        {/* Graphique évolution note */}
        {evolutionMensuelle.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-5">
            <div className="text-xs font-black text-slate-600 uppercase mb-3">
              📈 Évolution de ma note (6 mois)
            </div>
            <div className="flex items-end justify-between gap-2 h-24">
              {evolutionMensuelle.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-[9px] text-slate-500 font-black mb-1">
                    {m.note > 0 ? m.note.toFixed(1) : '—'}
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.note / 5) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-md"
                    style={{ minHeight: '4px' }}
                  />
                  <div className="text-[9px] text-slate-400 font-bold mt-1">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparaison */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="text-xs font-black text-blue-700 uppercase mb-2">
              🎯 Ma note vs moyenne
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-black text-slate-900">
                {statut.note_moyenne.toFixed(1)}
              </div>
              <div className="text-sm text-slate-500 font-bold">
                vs {moyenneGenerale.toFixed(1)} moyenne
              </div>
            </div>
            {statut.note_moyenne >= moyenneGenerale ? (
              <div className="text-xs font-black text-emerald-600 mt-2">
                🎉 +{(statut.note_moyenne - moyenneGenerale).toFixed(1)} au-dessus !
              </div>
            ) : (
              <div className="text-xs font-black text-amber-600 mt-2">
                📈 Tu peux faire mieux !
              </div>
            )}
          </div>

          {rang && rang.rang > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border-2 border-amber-200">
              <div className="text-xs font-black text-amber-700 uppercase mb-2">
                🏆 Mon rang
              </div>
              <div className="text-3xl font-black text-slate-900">
                #{rang.rang}
              </div>
              <div className="text-xs text-amber-600 font-bold">
                Top {rang.top}% de {rang.total} profs
              </div>
            </div>
          )}
        </div>

        {/* Répartition notes */}
        {statut.nombre_avis > 0 && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mt-4">
            <div className="text-xs font-black text-slate-600 uppercase mb-3">
              ⭐ Répartition des notes
            </div>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = repartitionNotes[n] || 0
                const pct = statut.nombre_avis > 0 ? (count / statut.nombre_avis) * 100 : 0
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-500 w-8">
                      {n}⭐
                    </span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                      />
                    </div>
                    <span className="text-xs font-black text-slate-500 w-8 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 7 : OBJECTIFS & ACHIEVEMENTS */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span>Objectifs</span>
          </h2>
          <span className="text-xs font-black text-slate-500">
            {objectifsAtteints}/{objectifsConfig.length} atteints
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {objectifsConfig.map((o, i) => {
            const atteint = o.check(statut)
            const ouvert = objectifOuvert === o.id
            return (
              <motion.button
                key={o.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.03 }}
                onClick={() => setObjectifOuvert(ouvert ? null : o.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  atteint
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{o.emoji}</div>
                  {atteint ? (
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-300 text-slate-600 px-2 py-0.5 rounded-full font-black">
                      🔒
                    </span>
                  )}
                </div>
                <div
                  className={`font-black text-sm mb-1 ${
                    atteint ? 'text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {o.label}
                </div>
                <div className="text-[10px] text-slate-500 mb-2">{o.desc}</div>
                {ouvert && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-black text-amber-600 bg-amber-50 rounded-lg p-2 border border-amber-200"
                  >
                    🎁 {o.recompense}
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 8 : HISTORIQUE DEMANDES */}
      {/* ============================================================ */}

      {demandes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
        >
          <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <span>Mes demandes d'amélioration</span>
          </h2>

          <div className="space-y-2">
            {demandes.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.03 }}
                className={`p-4 rounded-xl border-2 ${
                  d.statut === 'acceptee'
                    ? 'bg-emerald-50 border-emerald-200'
                    : d.statut === 'refusee'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {d.statut === 'acceptee'
                      ? '✅'
                      : d.statut === 'refusee'
                      ? '❌'
                      : '⏳'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-black uppercase text-slate-600">
                        {d.type}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(d.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {d.motif}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION 9 : PARTAGER & EXPORTER */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
          <span className="text-2xl">📤</span>
          <span>Partager mon profil</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-3">
          <button
            onClick={partagerWhatsApp}
            className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <span className="text-2xl">💬</span>
            <div className="text-left">
              <div className="font-black text-sm">WhatsApp</div>
              <div className="text-[10px] opacity-90">Partager mon profil</div>
            </div>
          </button>

          <button
            onClick={copierLien}
            className={`p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 ${
              copie
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
            }`}
          >
            <span className="text-2xl">{copie ? '✓' : '🔗'}</span>
            <div className="text-left">
              <div className="font-black text-sm">
                {copie ? 'Copié !' : 'Copier le lien'}
              </div>
              <div className="text-[10px] opacity-90">Lien de mon profil</div>
            </div>
          </button>

          <button
            onClick={() => window.print()}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <span className="text-2xl">📥</span>
            <div className="text-left">
              <div className="font-black text-sm">Export PDF</div>
              <div className="text-[10px] opacity-90">Imprimer mon profil</div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 10 : DEMANDER AMÉLIORATION */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-3xl p-6 md:p-8 border-2 border-blue-200 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">💬</div>
          <div className="flex-1">
            <h3 className="font-black text-slate-900 mb-1 text-lg">
              Demander une amélioration
            </h3>
            <p className="text-sm text-slate-700 mb-3">
              Vous pensez mériter plus d'étoiles ou un badge ? Envoyez-nous votre demande avec un
              motif clair.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setModalOuvert(true)}
                className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
              >
                📩 Faire une demande
              </button>
              <button
                onClick={() => contacterAdmin('amelioration')}
                className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-blue-200 hover:border-blue-400 transition-all"
              >
                💬 WhatsApp admin
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* MODAL DEMANDE AMÉLIORATION */}
      {/* ============================================================ */}

      <AnimatePresence>
        {modalOuvert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">
                    📩 Demande d'amélioration
                  </h2>
                  <button
                    onClick={() => setModalOuvert(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {succes ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      Demande envoyée
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Nous allons examiner votre demande et vous répondrons rapidement.
                    </p>
                    <button
                      onClick={() => {
                        setModalOuvert(false)
                        setSucces(false)
                      }}
                      className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-xl mb-4">
                      <p className="text-xs text-blue-800">
                        💡 Votre demande sera examinée par l'admin. Soyez précis et convaincant !
                      </p>
                    </div>

                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Motif de votre demande <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      rows={5}
                      maxLength={500}
                      placeholder="Ex : Je pense mériter le badge Recommandé car j'ai 30 avis positifs et 8 mois avec mes élèves..."
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {motif.length}/500 caractères (minimum 20)
                    </p>

                    {erreur && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                        <span>⚠️</span>
                        <p className="text-red-700 text-xs font-medium">{erreur}</p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => setModalOuvert(false)}
                        disabled={envoi}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={envoyerDemande}
                        disabled={envoi}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg disabled:opacity-50"
                      >
                        {envoi ? '⏳...' : '📩 Envoyer'}
                      </button>
                    </div>
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