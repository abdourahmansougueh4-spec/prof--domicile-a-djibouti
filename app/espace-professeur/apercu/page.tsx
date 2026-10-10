'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfilComplet = {
  id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  bio: string | null
  telephone: string | null
  whatsapp: string | null
  approuve: boolean
  masque: boolean
  banni: boolean
}

type ProfInfo = {
  type_professeur: string | null
  specialite: string | null
  experience_annees: number
  zone_enseignement: string | null
  note_moyenne: number
  nombre_avis: number
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  a_bac_s: boolean
  est_etudiant: boolean
  universite: string | null
  niveau_etude: string | null
  domaine_etude: string | null
  prix_min: number | null
  prix_max: number | null
  verifie_physique: boolean
}

type Stats = {
  matieres: number
  langues: number
  creneaux: number
  documents: number
  documents_total: number
}

type Vue = 'mobile' | 'tablette' | 'desktop'

// ============================================================
// CONFIG TYPES
// ============================================================

const typesConfig: {
  [k: string]: { label: string; emoji: string; couleur: string }
} = {
  etudiant: { label: 'Étudiant', emoji: '🎓', couleur: 'from-blue-500 to-indigo-600' },
  diplome: { label: 'Diplômé', emoji: '📜', couleur: 'from-emerald-500 to-teal-600' },
  bac_s: { label: 'Bac S', emoji: '🎓', couleur: 'from-amber-500 to-orange-600' },
  enseignant: { label: 'Enseignant', emoji: '👨‍🏫', couleur: 'from-purple-500 to-pink-600' },
  freelance: { label: 'Freelance', emoji: '💼', couleur: 'from-cyan-500 to-blue-600' },
  formateur: { label: 'Formateur', emoji: '🏢', couleur: 'from-rose-500 to-pink-600' },
  coran: { label: 'Coran', emoji: '📖', couleur: 'from-green-500 to-emerald-600' },
}

const labelsMatieres: { [k: string]: string } = {
  primaire_fr: 'Primaire FR',
  primaire_ar: 'Primaire AR',
  college_maths: 'Collège Maths',
  college_physique: 'Collège Physique',
  college_svt: 'Collège SVT',
  college_francais: 'Collège Français',
  college_anglais: 'Collège Anglais',
  college_arabe: 'Collège Arabe',
  lycee_maths: 'Lycée Maths',
  arabe: 'Arabe',
  coran: 'Coran',
  francais: 'Français',
  anglais: 'Anglais',
}

const labelsZones: { [k: string]: string } = {
  chez_moi: '🏠 Chez le prof',
  chez_eleve: "🚶 Chez l'élève",
  les_deux: '🔄 Les deux',
}

// ============================================================
// HELPER : Calcul score de complétion
// ============================================================

const calculerScoreProfil = (
  profil: ProfilComplet,
  prof: ProfInfo,
  stats: Stats
): { score: number; criteres: { label: string; ok: boolean; poids: number }[] } => {
  const criteres = [
    { label: 'Nom complet', ok: profil.nom_complet.length >= 3, poids: 5 },
    { label: 'Photo de profil', ok: profil.photo_url !== null, poids: 15 },
    { label: 'Bio complète (50+ caractères)', ok: (profil.bio?.length || 0) >= 50, poids: 10 },
    { label: 'Téléphone renseigné', ok: (profil.telephone?.length || 0) >= 12, poids: 5 },
    { label: 'Quartier renseigné', ok: !!profil.quartier, poids: 5 },
    { label: 'Type de professeur', ok: prof.type_professeur !== null, poids: 10 },
    { label: 'Bac S (si scientifique)', ok: prof.a_bac_s || !prof.specialite?.toLowerCase().includes('math'), poids: 5 },
    { label: 'Expérience renseignée', ok: prof.experience_annees > 0, poids: 5 },
    { label: 'Zone d\'enseignement', ok: prof.zone_enseignement !== null, poids: 5 },
    { label: 'Prix définis', ok: prof.prix_min !== null && prof.prix_max !== null, poids: 10 },
    { label: 'Matières (2+)', ok: stats.matieres >= 2, poids: 10 },
    { label: 'Langues parlées (1+)', ok: stats.langues >= 1, poids: 5 },
    { label: 'Créneaux (6+)', ok: stats.creneaux >= 6, poids: 10 },
    { label: 'Documents complets', ok: stats.documents >= stats.documents_total, poids: 10 },
    { label: 'Approuvé par admin', ok: profil.approuve, poids: 10 },
    { label: 'Pas masqué/banni', ok: !profil.masque && !profil.banni, poids: 5 },
  ]

  const poidsTotal = criteres.reduce((acc, c) => acc + c.poids, 0)
  const poidsObtenus = criteres.filter((c) => c.ok).reduce((acc, c) => acc + c.poids, 0)
  const score = Math.round((poidsObtenus / poidsTotal) * 100)

  return { score, criteres }
}

// ============================================================
// HELPER : Score d'attractivité
// ============================================================

const calculerAttractivite = (
  prof: ProfInfo,
  stats: Stats
): {
  score: number
  points: { emoji: string; label: string; ok: boolean }[]
} => {
  const points = [
    { emoji: '📸', label: 'Photo professionnelle', ok: stats.documents >= 1 },
    { emoji: '🎓', label: 'Diplôme vérifié', ok: prof.type_professeur !== null },
    { emoji: '⭐', label: 'Note > 4.5', ok: prof.note_moyenne >= 4.5 },
    { emoji: '🌟', label: '3 étoiles ou plus', ok: prof.etoiles >= 3 },
    { emoji: '👑', label: 'Badge obtenu', ok: prof.badge_admin !== null || prof.pionnier },
    { emoji: '📚', label: '3+ matières', ok: stats.matieres >= 3 },
    { emoji: '📅', label: 'Disponible 6+ créneaux', ok: stats.creneaux >= 6 },
    { emoji: '✅', label: 'Profil vérifié physiquement', ok: prof.verifie_physique },
  ]

  const total = points.filter((p) => p.ok).length
  const score = Math.round((total / points.length) * 100)

  return { score, points }
}

// ============================================================
// HELPER : Conseils d'amélioration
// ============================================================

const genererConseils = (
  profil: ProfilComplet,
  prof: ProfInfo,
  stats: Stats
): { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse'; action?: string }[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse'; action?: string }[] = []

  if (!profil.photo_url) {
    conseils.push({
      emoji: '📸',
      texte: 'Ajoutez une photo professionnelle. Les profs avec photo reçoivent 3× plus de demandes.',
      priorite: 'haute',
      action: '/espace-professeur/profil',
    })
  }

  if (!profil.bio || profil.bio.length < 50) {
    conseils.push({
      emoji: '📝',
      texte: 'Rédigez une bio convaincante (50+ caractères). C\'est ce que les parents lisent en premier.',
      priorite: 'haute',
      action: '/espace-professeur/profil',
    })
  }

  if (stats.creneaux < 6) {
    conseils.push({
      emoji: '📅',
      texte: `Ajoutez plus de créneaux (${stats.creneaux}/6 minimum).`,
      priorite: 'haute',
      action: '/espace-professeur/disponibilites',
    })
  }

  if (stats.matieres < 2) {
    conseils.push({
      emoji: '📚',
      texte: 'Ajoutez plus de matières pour toucher plus de parents.',
      priorite: 'moyenne',
      action: '/espace-professeur/matieres',
    })
  }

  if (stats.langues === 0) {
    conseils.push({
      emoji: '🌍',
      texte: 'Indiquez les langues que vous parlez.',
      priorite: 'moyenne',
      action: '/espace-professeur/matieres',
    })
  }

  if (!prof.prix_min || !prof.prix_max) {
    conseils.push({
      emoji: '💰',
      texte: 'Définissez vos tarifs pour valider votre dossier.',
      priorite: 'moyenne',
      action: '/espace-professeur/tarifs',
    })
  }

  if (stats.documents < stats.documents_total) {
    conseils.push({
      emoji: '📎',
      texte: `Complétez vos documents (${stats.documents}/${stats.documents_total}).`,
      priorite: 'haute',
      action: '/espace-professeur/documents',
    })
  }

  if (prof.note_moyenne < 4.5 && prof.nombre_avis >= 3) {
    conseils.push({
      emoji: '⭐',
      texte: 'Visez une note de 4.5+ pour débloquer le niveau Expert.',
      priorite: 'basse',
    })
  }

  if (conseils.length === 0) {
    conseils.push({
      emoji: '✨',
      texte: 'Votre profil est parfait ! Vous êtes prêt à recevoir des demandes.',
      priorite: 'basse',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 5)
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ApercuPublic() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [vue, setVue] = useState<Vue>('desktop')
  const [copie, setCopie] = useState(false)

  const [profil, setProfil] = useState<ProfilComplet | null>(null)
  const [prof, setProf] = useState<ProfInfo | null>(null)
  const [stats, setStats] = useState<Stats>({
    matieres: 0,
    langues: 0,
    creneaux: 0,
    documents: 0,
    documents_total: 4,
  })
  const [matieresListe, setMatieresListe] = useState<string[]>([])
  const [languesListe, setLanguesListe] = useState<string[]>([])

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée')
        setLoading(false)
        return
      }

      // Charge profil + prof + matieres + langues + dispos en parallèle
      const [profileRes, profRes, matieresRes, languesRes, disposRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nom_complet, photo_url, quartier, bio, telephone, whatsapp, approuve, masque, banni')
          .eq('id', user.id)
          .single(),
        supabase
          .from('professeurs')
          .select(
            'type_professeur, specialite, experience_annees, zone_enseignement, note_moyenne, nombre_avis, etoiles, badge_admin, pionnier, pionnier_illustre, a_bac_s, est_etudiant, universite, niveau_etude, domaine_etude, prix_min, prix_max, verifie_physique, bac_s_scan_url, carte_identite_url, carte_etudiante_url, photo_profil_url, diplome_url, attestation_url, cv_url, portfolio_url, attestation_employeur_url, carte_professionnelle_url, attestation_religieuse_url'
          )
          .eq('id', user.id)
          .single(),
        supabase
          .from('matieres_par_prof')
          .select('matiere')
          .eq('professeur_id', user.id),
        supabase
          .from('langues_par_prof')
          .select('langue')
          .eq('professeur_id', user.id),
        supabase
          .from('disponibilites')
          .select('*', { count: 'exact', head: true })
          .eq('professeur_id', user.id),
      ])

      if (profileRes.data) {
        setProfil({
          id: profileRes.data.id,
          nom_complet: profileRes.data.nom_complet || '',
          photo_url: profileRes.data.photo_url || null,
          quartier: profileRes.data.quartier || null,
          bio: profileRes.data.bio || null,
          telephone: profileRes.data.telephone || null,
          whatsapp: profileRes.data.whatsapp || null,
          approuve: profileRes.data.approuve === true,
          masque: profileRes.data.masque === true,
          banni: profileRes.data.banni === true,
        })
      }

      if (profRes.data) {
        setProf({
          type_professeur: profRes.data.type_professeur || null,
          specialite: profRes.data.specialite || null,
          experience_annees: profRes.data.experience_annees || 0,
          zone_enseignement: profRes.data.zone_enseignement || null,
          note_moyenne: Number(profRes.data.note_moyenne) || 0,
          nombre_avis: profRes.data.nombre_avis || 0,
          etoiles: profRes.data.etoiles || 0,
          badge_admin: profRes.data.badge_admin || null,
          pionnier: profRes.data.pionnier === true,
          pionnier_illustre: profRes.data.pionnier_illustre === true,
          a_bac_s: profRes.data.a_bac_s === true,
          est_etudiant: profRes.data.est_etudiant === true,
          universite: profRes.data.universite || null,
          niveau_etude: profRes.data.niveau_etude || null,
          domaine_etude: profRes.data.domaine_etude || null,
          prix_min: profRes.data.prix_min ? Number(profRes.data.prix_min) : null,
          prix_max: profRes.data.prix_max ? Number(profRes.data.prix_max) : null,
          verifie_physique: profRes.data.verifie_physique === true,
        })

        // Compter les documents
        let docsFournis = 0
        let docsTotal = 2
        if (profRes.data.bac_s_scan_url) docsFournis++
        if (profRes.data.carte_identite_url) docsFournis++
        if (profRes.data.photo_profil_url) docsFournis++
        if (profRes.data.est_etudiant) {
          docsTotal++
          if (profRes.data.carte_etudiante_url) docsFournis++
        }

        setStats((prev) => ({
          ...prev,
          documents: docsFournis,
          documents_total: docsTotal,
        }))
      }

      const matList = (matieresRes.data || []).map((m) => m.matiere)
      const langList = (languesRes.data || []).map((l) => l.langue)

      setMatieresListe(matList)
      setLanguesListe(langList)
      setStats((prev) => ({
        ...prev,
        matieres: matList.length,
        langues: langList.length,
        creneaux: disposRes.count || 0,
      }))
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
  // CALCULS
  // ============================================================

  const scoreProfil = useMemo(() => {
    if (!profil || !prof) return { score: 0, criteres: [] }
    return calculerScoreProfil(profil, prof, stats)
  }, [profil, prof, stats])

  const attractivite = useMemo(() => {
    if (!prof) return { score: 0, points: [] }
    return calculerAttractivite(prof, stats)
  }, [prof, stats])

  const conseils = useMemo(() => {
    if (!profil || !prof) return []
    return genererConseils(profil, prof, stats)
  }, [profil, prof, stats])

  const typeConfig = prof?.type_professeur
    ? typesConfig[prof.type_professeur] || null
    : null

  // ============================================================
  // ACTIONS
  // ============================================================

  const copierLien = () => {
    const lien = `${window.location.origin}/professeurs/${profil?.id || 'profil'}`
    navigator.clipboard.writeText(lien)
    setCopie(true)
    setSucces('🔗 Lien copié !')
    setTimeout(() => {
      setCopie(false)
      setSucces('')
    }, 2000)
  }

  const partagerWhatsApp = () => {
    const message = `Découvrez mon profil de professeur sur Prof À Domicile Djibouti : ${window.location.origin}/professeurs/${profil?.id || 'profil'}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const getScoreCouleur = (score: number) => {
    if (score >= 80) return { gradient: 'from-emerald-500 to-teal-600', label: 'Excellent', emoji: '🏆' }
    if (score >= 60) return { gradient: 'from-blue-500 to-indigo-600', label: 'Bon', emoji: '👍' }
    if (score >= 40) return { gradient: 'from-amber-500 to-orange-600', label: 'À améliorer', emoji: '⚠️' }
    return { gradient: 'from-red-500 to-rose-600', label: 'Incomplet', emoji: '🚨' }
  }

  const couleurScore = getScoreCouleur(scoreProfil.score)
  const couleurAttractivite = getScoreCouleur(attractivite.score)

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm">Chargement de votre aperçu...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR
  // ============================================================

  if (erreur || !profil || !prof) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-red-700 text-sm mb-6">{erreur || 'Données introuvables'}</p>
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
      <Link
        href="/espace-professeur"
        className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* ============================================================ */}
      {/* HEADER HERO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${couleurScore.gradient} rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden`}
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
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-black">👁️ Aperçu public</h1>
                {profil.approuve && !profil.masque && !profil.banni && (
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black border border-white/30">
                    🟢 VISIBLE
                  </span>
                )}
                {profil.masque && (
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black border border-white/30">
                    👻 MASQUÉ
                  </span>
                )}
                {profil.banni && (
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black border border-white/30">
                    🚫 BANNI
                  </span>
                )}
              </div>
              <p className="text-white/90 text-sm">
                Voici exactement ce que les parents voient de votre profil
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={partagerWhatsApp}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={copierLien}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm"
              >
                {copie ? '✓ Copié' : '🔗 Copier lien'}
              </button>
            </div>
          </div>

          {/* SCORE PROFIL */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
              {/* Jauge circulaire */}
              <div className="relative w-32 h-32 mx-auto md:mx-0">
                <svg className="transform -rotate-90" width="128" height="128">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="10"
                    fill="none"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 56 * (1 - scoreProfil.score / 100),
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-black">{scoreProfil.score}%</div>
                  <div className="text-[9px] font-black opacity-90">PROFIL</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-wider mb-2 opacity-90">
                  {couleurScore.emoji} Profil {couleurScore.label}
                </div>
                <div className="text-2xl font-black mb-3">
                  {scoreProfil.criteres.filter((c) => c.ok).length}/
                  {scoreProfil.criteres.length} critères validés
                </div>
                <div className="text-xs opacity-90 mb-2">
                  💡 Un profil à 100% attire 3× plus de parents
                </div>
                <div className="flex gap-2 flex-wrap">
                  {attractivite.score >= 60 && (
                    <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-black">
                      ⭐ Attractivité : {attractivite.score}%
                    </span>
                  )}
                  {prof.verifie_physique && (
                    <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-black">
                      ✓ Vérifié physiquement
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* MESSAGES */}
      {/* ============================================================ */}

      <AnimatePresence>
        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <span className="text-xl">✅</span>
            <p className="text-emerald-800 text-sm font-bold">{succes}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* SÉLECTEUR DE VUE */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-lg"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-black text-slate-500 uppercase">
            👁️ Tester en :
          </div>
          <div className="flex gap-2">
            {(['mobile', 'tablette', 'desktop'] as Vue[]).map((v) => (
              <button
                key={v}
                onClick={() => setVue(v)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  vue === v
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-700 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {v === 'mobile' ? '📱 Mobile' : v === 'tablette' ? '📱 Tablette' : '💻 Desktop'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* APERÇU RESPONSIVE */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div
          className={`transition-all duration-500 ${
            vue === 'mobile'
              ? 'max-w-sm w-full'
              : vue === 'tablette'
              ? 'max-w-2xl w-full'
              : 'max-w-5xl w-full'
          }`}
        >
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden">
            {/* Faux navigateur */}
            <div className="bg-slate-100 border-b-2 border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block bg-white border border-slate-200 rounded-lg px-3 py-1 text-[10px] text-slate-500 font-mono">
                  profadomicile.dj/professeurs/{profil.id.slice(0, 8)}
                </div>
              </div>
            </div>

            {/* Contenu de la page publique */}
            <div className="p-4 md:p-6 max-h-[600px] overflow-y-auto bg-white">
              {/* Header profil */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-6 pb-6 border-b-2 border-slate-100">
                {profil.photo_url ? (
                  <img
                    src={profil.photo_url}
                    alt={profil.nom_complet}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover shadow-xl border-4 border-emerald-100"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-emerald-600 to-blue-700 flex items-center justify-center text-white text-5xl shadow-xl">
                    👨‍🏫
                  </div>
                )}

                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900">
                      {profil.nom_complet}
                    </h2>
                    {profil.approuve && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs border-2 border-white shadow">
                        ✓
                      </div>
                    )}
                  </div>

                  {typeConfig && (
                    <div
                      className={`inline-flex items-center gap-2 bg-gradient-to-r ${typeConfig.couleur} text-white px-3 py-1 rounded-full text-xs font-black shadow mb-3`}
                    >
                      <span>{typeConfig.emoji}</span>
                      <span>{typeConfig.label}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-600 mb-3">
                    {prof.note_moyenne > 0 && (
                      <span className="flex items-center gap-1">
                        ⭐{' '}
                        <strong className="text-slate-900">
                          {prof.note_moyenne.toFixed(1)}
                        </strong>
                        <span className="text-slate-400">({prof.nombre_avis} avis)</span>
                      </span>
                    )}
                    {profil.quartier && (
                      <>
                        <span>•</span>
                        <span>📍 {profil.quartier}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      🎯 {prof.experience_annees} an
                      {prof.experience_annees > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {prof.pionnier_illustre && (
                      <span className="text-[10px] bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-1 rounded-full font-black">
                        👑 PIONNIER ILLUSTRE
                      </span>
                    )}
                    {prof.badge_admin === 'super_pro' && (
                      <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-600 text-white px-2 py-1 rounded-full font-black">
                        👑 SUPER-PRO
                      </span>
                    )}
                    {prof.badge_admin === 'recommande' && (
                      <span className="text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full font-black">
                        🏅 RECOMMANDÉ
                      </span>
                    )}
                    {prof.pionnier && !prof.pionnier_illustre && (
                      <span className="text-[10px] bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-2 py-1 rounded-full font-black">
                        🏆 PIONNIER
                      </span>
                    )}
                    {prof.etoiles > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-black">
                        {'⭐'.repeat(prof.etoiles)}
                      </span>
                    )}
                    {prof.verifie_physique && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-black">
                        ✓ VÉRIFIÉ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profil.bio ? (
                <div className="mb-5 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border-l-4 border-emerald-500">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                    📝 À propos
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed italic">
                    « {profil.bio} »
                  </p>
                </div>
              ) : (
                <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs text-amber-800 italic text-center">
                    ⚠️ Bio manquante — Ajoutez une description pour rassurer les parents
                  </p>
                </div>
              )}

              {/* Matières */}
              {matieresListe.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-black text-slate-700 mb-2">
                    📚 Matières enseignées
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matieresListe.map((m) => (
                      <span
                        key={m}
                        className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded-full font-bold border border-emerald-200"
                      >
                        {labelsMatieres[m] || m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Langues */}
              {languesListe.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-black text-slate-700 mb-2">
                    💬 Langues parlées
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {languesListe.map((l) => (
                      <span
                        key={l}
                        className="text-[10px] bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-bold capitalize border border-blue-200"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Zone */}
              {prof.zone_enseignement && (
                <div className="mb-5">
                  <div className="text-xs font-black text-slate-700 mb-2">
                    🏠 Zone d'enseignement
                  </div>
                  <span className="text-xs bg-purple-50 text-purple-800 px-3 py-1.5 rounded-xl font-bold border border-purple-200">
                    {labelsZones[prof.zone_enseignement] || prof.zone_enseignement}
                  </span>
                </div>
              )}

              {/* Infos privées masquées */}
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🔒</span>
                  <div>
                    <p className="text-xs font-black text-red-900 mb-2">
                      INFORMATIONS PRIVÉES (non visibles par les parents)
                    </p>
                    <div className="text-[10px] text-red-800 space-y-0.5">
                      <div>
                        📞 Téléphone :{' '}
                        {profil.telephone ? '•••••••••' : 'Non renseigné'}
                      </div>
                      <div>
                        💬 WhatsApp : {profil.whatsapp ? '•••••••••' : 'Non renseigné'}
                      </div>
                      <div>
                        💰 Prix : {prof.prix_min ? '•••••••••' : 'Non défini'}
                      </div>
                      <div>📎 Documents : Tous sécurisés</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SCORE D'ATTRACTIVITÉ DÉTAILLÉ */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${couleurAttractivite.gradient} flex items-center justify-center text-white text-2xl shadow-lg`}
          >
            {couleurAttractivite.emoji}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-slate-900 text-lg">
              Score d'attractivité : {attractivite.score}%
            </h3>
            <p className="text-xs text-slate-500">
              Basé sur votre profil et vos performances
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {attractivite.points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.03 }}
              className={`rounded-xl p-3 border-2 ${
                p.ok
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-2xl mb-1">{p.emoji}</div>
              <div
                className={`text-[10px] font-black ${
                  p.ok ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {p.ok ? '✓ ' : '○ '}
                {p.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* CRITÈRES DU PROFIL */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
            📋
          </div>
          <div>
            <h3 className="font-black text-slate-900">Détail de vos critères</h3>
            <p className="text-[10px] text-slate-500">
              {scoreProfil.criteres.filter((c) => c.ok).length}/{scoreProfil.criteres.length}{' '}
              validés
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          {scoreProfil.criteres.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.02 }}
              className={`rounded-xl p-3 border-2 flex items-center gap-3 ${
                c.ok
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  c.ok
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                {c.ok ? '✓' : '○'}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs font-bold truncate ${
                    c.ok ? 'text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  {c.label}
                </div>
              </div>
              <div
                className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  c.ok
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                +{c.poids}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* COACH IA — CONSEILS */}
      {/* ============================================================ */}

      {conseils.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg">
              🤖
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">Coach IA</h3>
              <p className="text-xs text-slate-500">
                Actions concrètes pour améliorer votre profil
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {conseils.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`rounded-xl p-3 border-2 flex items-start gap-3 ${
                  c.priorite === 'haute'
                    ? 'bg-red-50 border-red-200'
                    : c.priorite === 'moyenne'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-purple-100'
                }`}
              >
                <span className="text-xl flex-shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium mb-2">
                    {c.texte}
                  </p>
                  {c.action && (
                    <Link
                      href={c.action}
                      className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 hover:text-purple-800 bg-white px-2 py-1 rounded-lg border border-purple-200"
                    >
                      Agir maintenant →
                    </Link>
                  )}
                </div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase flex-shrink-0 ${
                    c.priorite === 'haute'
                      ? 'bg-red-500 text-white'
                      : c.priorite === 'moyenne'
                      ? 'bg-amber-500 text-white'
                      : 'bg-purple-200 text-purple-700'
                  }`}
                >
                  {c.priorite}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* PARTAGE */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl shadow-lg">
            📤
          </div>
          <div>
            <h3 className="font-black text-slate-900">Partager mon profil</h3>
            <p className="text-[10px] text-slate-500">
              Faites connaître votre profil à vos contacts
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <button
            onClick={partagerWhatsApp}
            className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <span className="text-2xl">💬</span>
            <div className="text-left">
              <div className="font-black text-sm">WhatsApp</div>
              <div className="text-[10px] opacity-90">Partager à mes contacts</div>
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
                {copie ? 'Lien copié !' : 'Copier le lien'}
              </div>
              <div className="text-[10px] opacity-90">Lien direct du profil</div>
            </div>
          </button>

          <Link
            href="/espace-professeur/profil"
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <span className="text-2xl">✏️</span>
            <div className="text-left">
              <div className="font-black text-sm">Améliorer</div>
              <div className="text-[10px] opacity-90">Modifier mon profil</div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* INFO SÉCURITÉ */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">
              Confidentialité garantie
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Votre <strong>téléphone</strong>, votre <strong>WhatsApp</strong>, vos{' '}
              <strong>documents</strong> et vos <strong>tarifs</strong> ne sont{' '}
              <strong>JAMAIS visibles</strong> par les parents. Ils passent toujours
              par notre équipe pour vous contacter.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}