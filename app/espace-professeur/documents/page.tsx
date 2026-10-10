'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type TypeProf =
  | 'etudiant'
  | 'diplome'
  | 'bac_s'
  | 'enseignant'
  | 'freelance'
  | 'formateur'
  | 'coran'
  | null

type DocumentItem = {
  key: string
  label: string
  emoji: string
  champ: string
  accepte: string
  hint: string
  obligatoire: boolean
  conseil?: string
}

type DocumentsState = {
  bac_s_scan_url: string | null
  carte_identite_url: string | null
  carte_etudiante_url: string | null
  photo_profil_url: string | null
  diplome_url: string | null
  attestation_url: string | null
  cv_url: string | null
  portfolio_url: string | null
  attestation_employeur_url: string | null
  carte_professionnelle_url: string | null
  attestation_religieuse_url: string | null
}

type StatutVerification = {
  approuve: boolean
  verifie_physique: boolean
  date_verification_physique: string | null
  note_verification_admin: string | null
}

// ============================================================
// CONFIG PAR TYPE
// ============================================================

const typesProfConfig: {
  [k: string]: {
    label: string
    emoji: string
    couleur: string
    description: string
    physiqueRequise: boolean
  }
} = {
  etudiant: {
    label: 'Étudiant universitaire',
    emoji: '🎓',
    couleur: 'from-blue-500 to-indigo-600',
    description: 'En cours d\'études supérieures',
    physiqueRequise: false,
  },
  diplome: {
    label: 'Diplômé universitaire',
    emoji: '📜',
    couleur: 'from-emerald-500 to-teal-600',
    description: 'Titulaire d\'un diplôme universitaire',
    physiqueRequise: false,
  },
  bac_s: {
    label: 'Bac Scientifique',
    emoji: '🎓',
    couleur: 'from-amber-500 to-orange-600',
    description: 'Titulaire du Bac Scientifique',
    physiqueRequise: false,
  },
  enseignant: {
    label: 'Enseignant officiel',
    emoji: '👨‍🏫',
    couleur: 'from-purple-500 to-pink-600',
    description: 'Enseignant en établissement',
    physiqueRequise: true,
  },
  freelance: {
    label: 'Professeur freelance',
    emoji: '💼',
    couleur: 'from-cyan-500 to-blue-600',
    description: 'Tuteur indépendant expérimenté',
    physiqueRequise: true,
  },
  formateur: {
    label: 'Formateur',
    emoji: '🏢',
    couleur: 'from-rose-500 to-pink-600',
    description: 'Formateur spécialisé',
    physiqueRequise: true,
  },
  coran: {
    label: 'Enseignant Coran',
    emoji: '📖',
    couleur: 'from-green-500 to-emerald-600',
    description: 'Enseignant du Coran',
    physiqueRequise: true,
  },
}

// ============================================================
// DOCUMENTS PAR TYPE
// ============================================================

const getDocumentsParType = (type: TypeProf): DocumentItem[] => {
  if (!type) return []

  const docsBase: DocumentItem[] = [
    {
      key: 'carte_identite',
      label: 'Carte d\'identité nationale',
      emoji: '🆔',
      champ: 'carte_identite_url',
      accepte: 'image/*,.pdf',
      hint: 'Recto/verso bien lisible',
      obligatoire: false,
      conseil: 'Fortement recommandée pour rassurer les parents.',
    },
    {
      key: 'photo_profil',
      label: 'Photo de profil professionnelle',
      emoji: '📸',
      champ: 'photo_profil_url',
      accepte: 'image/*',
      hint: 'Visage bien visible, éclairage correct',
      obligatoire: false,
      conseil: 'Les profs avec photo reçoivent 3× plus de demandes.',
    },
  ]

  switch (type) {
    case 'etudiant':
      return [
        {
          key: 'carte_etudiante',
          label: 'Carte étudiante (ou attestation d\'inscription)',
          emoji: '🎓',
          champ: 'carte_etudiante_url',
          accepte: 'image/*,.pdf',
          hint: 'Recto/verso bien lisible',
          obligatoire: true,
          conseil: 'Doit indiquer l\'année en cours.',
        },
        ...docsBase,
      ]

    case 'diplome':
      return [
        {
          key: 'diplome',
          label: 'Diplôme universitaire (Licence/Master)',
          emoji: '📜',
          champ: 'diplome_url',
          accepte: 'image/*,.pdf',
          hint: 'Scan ou photo nette du diplôme',
          obligatoire: true,
          conseil: 'Le document doit être lisible (nom + sceau).',
        },
        {
          key: 'attestation',
          label: 'Relevé de notes ou attestation de réussite',
          emoji: '📋',
          champ: 'attestation_url',
          accepte: 'image/*,.pdf',
          hint: 'Dernier relevé officiel',
          obligatoire: true,
          conseil: 'Sert à valider votre niveau académique.',
        },
        ...docsBase,
      ]

    case 'bac_s':
      return [
        {
          key: 'bac_s_scan',
          label: 'Diplôme du Bac S',
          emoji: '🎓',
          champ: 'bac_s_scan_url',
          accepte: 'image/*,.pdf',
          hint: 'Scan ou photo du diplôme officiel',
          obligatoire: true,
          conseil: 'Obligatoire pour enseigner les matières scientifiques.',
        },
        ...docsBase,
      ]

    case 'enseignant':
      return [
        {
          key: 'attestation_employeur',
          label: 'Attestation de votre établissement',
          emoji: '🏢',
          champ: 'attestation_employeur_url',
          accepte: 'image/*,.pdf',
          hint: 'Papier officiel de votre école',
          obligatoire: true,
          conseil: 'Doit porter le cachet et la signature du directeur.',
        },
        {
          key: 'carte_professionnelle',
          label: 'Carte professionnelle d\'enseignant',
          emoji: '💼',
          champ: 'carte_professionnelle_url',
          accepte: 'image/*,.pdf',
          hint: 'Carte d\'enseignant officielle',
          obligatoire: true,
          conseil: 'Preuve de votre statut d\'enseignant actif.',
        },
        ...docsBase,
      ]

    case 'freelance':
      return [
        {
          key: 'cv',
          label: 'CV détaillé',
          emoji: '📄',
          champ: 'cv_url',
          accepte: 'image/*,.pdf',
          hint: 'Parcours et expériences détaillés',
          obligatoire: true,
          conseil: 'Mettez en avant votre expérience d\'enseignement.',
        },
        {
          key: 'attestation',
          label: 'Attestations d\'expérience / Références',
          emoji: '📋',
          champ: 'attestation_url',
          accepte: 'image/*,.pdf',
          hint: 'Lettres de recommandation, attestations de clients',
          obligatoire: true,
          conseil: 'Des références solides rassurent les parents.',
        },
        ...docsBase,
      ]

    case 'formateur':
      return [
        {
          key: 'portfolio',
          label: 'Portfolio / Certifications',
          emoji: '🏆',
          champ: 'portfolio_url',
          accepte: 'image/*,.pdf',
          hint: 'Vos certifications et réalisations',
          obligatoire: true,
          conseil: 'Montrez vos formations et projets réussis.',
        },
        {
          key: 'cv',
          label: 'CV détaillé',
          emoji: '📄',
          champ: 'cv_url',
          accepte: 'image/*,.pdf',
          hint: 'Parcours complet',
          obligatoire: true,
          conseil: 'Détaillez vos formations professionnelles.',
        },
        ...docsBase,
      ]

    case 'coran':
      return [
        // Aucun document obligatoire
        {
          key: 'attestation_religieuse',
          label: 'Attestation d\'un centre religieux (optionnel)',
          emoji: '📖',
          champ: 'attestation_religieuse_url',
          accepte: 'image/*,.pdf',
          hint: 'Si vous avez une attestation officielle',
          obligatoire: false,
          conseil: 'Facultatif — votre profil sera vérifié physiquement.',
        },
        ...docsBase,
      ]

    default:
      return []
  }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function DocumentsProfesseur() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [typeProf, setTypeProf] = useState<TypeProf>(null)
  const [statut, setStatut] = useState<StatutVerification>({
    approuve: false,
    verifie_physique: false,
    date_verification_physique: null,
    note_verification_admin: null,
  })

  const [documents, setDocuments] = useState<DocumentsState>({
    bac_s_scan_url: null,
    carte_identite_url: null,
    carte_etudiante_url: null,
    photo_profil_url: null,
    diplome_url: null,
    attestation_url: null,
    cv_url: null,
    portfolio_url: null,
    attestation_employeur_url: null,
    carte_professionnelle_url: null,
    attestation_religieuse_url: null,
  })

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

    // Charger profil + professeur
    const [profileRes, profRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('approuve')
        .eq('id', user.id)
        .single(),
      supabase
        .from('professeurs')
        .select(
          'type_professeur, bac_s_scan_url, carte_identite_url, carte_etudiante_url, photo_profil_url, diplome_url, attestation_url, cv_url, portfolio_url, attestation_employeur_url, carte_professionnelle_url, attestation_religieuse_url, verifie_physique, date_verification_physique, note_verification_admin'
        )
        .eq('id', user.id)
        .single(),
    ])

    if (profileRes.data) {
      setStatut({
        approuve: profileRes.data.approuve === true,
        verifie_physique: profRes.data?.verifie_physique === true,
        date_verification_physique: profRes.data?.date_verification_physique || null,
        note_verification_admin: profRes.data?.note_verification_admin || null,
      })
    }

    if (profRes.data) {
      setTypeProf((profRes.data.type_professeur as TypeProf) || null)
      setDocuments({
        bac_s_scan_url: profRes.data.bac_s_scan_url || null,
        carte_identite_url: profRes.data.carte_identite_url || null,
        carte_etudiante_url: profRes.data.carte_etudiante_url || null,
        photo_profil_url: profRes.data.photo_profil_url || null,
        diplome_url: profRes.data.diplome_url || null,
        attestation_url: profRes.data.attestation_url || null,
        cv_url: profRes.data.cv_url || null,
        portfolio_url: profRes.data.portfolio_url || null,
        attestation_employeur_url: profRes.data.attestation_employeur_url || null,
        carte_professionnelle_url: profRes.data.carte_professionnelle_url || null,
        attestation_religieuse_url: profRes.data.attestation_religieuse_url || null,
      })
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // CALCULS
  // ============================================================

  const documentsRequis = typeProf ? getDocumentsParType(typeProf) : []
  const documentsObligatoires = documentsRequis.filter((d) => d.obligatoire)
  const documentsOptionnels = documentsRequis.filter((d) => !d.obligatoire)

  const docsObligatoiresFournis = documentsObligatoires.filter(
    (d) => documents[d.champ as keyof DocumentsState] !== null
  ).length

  const docsOptionnelsFournis = documentsOptionnels.filter(
    (d) => documents[d.champ as keyof DocumentsState] !== null
  ).length

  const totalDocsFournis = docsObligatoiresFournis + docsOptionnelsFournis
  const totalDocsRequis = documentsRequis.length

  const pourcentage = totalDocsRequis > 0
    ? Math.round((totalDocsFournis / totalDocsRequis) * 100)
    : 0

  const tousObligatoiresFournis =
    documentsObligatoires.length === 0 ||
    docsObligatoiresFournis === documentsObligatoires.length

  const typeConfig = typeProf ? typesProfConfig[typeProf] : null
  const physiqueRequise = typeConfig?.physiqueRequise || false

  // ============================================================
  // UPLOAD
  // ============================================================

  const uploaderDocument = async (champ: string, fichier: File) => {
    setErreur('')
    setSucces('')
    setUploading(champ)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée')
        setUploading(null)
        return
      }

      // Vérifier la taille (5 Mo max)
      if (fichier.size > 5 * 1024 * 1024) {
        setErreur('Le fichier ne doit pas dépasser 5 Mo')
        setUploading(null)
        return
      }

      const extension = fichier.name.split('.').pop()
      const nomFichier = `${user.id}/${champ}-${Date.now()}.${extension}`

      // Upload dans le bucket
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(nomFichier, fichier, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Erreur upload:', uploadError)
        setErreur(`Erreur upload : ${uploadError.message}`)
        setUploading(null)
        return
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(nomFichier)

      const urlPublique = urlData.publicUrl

      // Mettre à jour la table professeurs
      const { error: updateError } = await supabase
        .from('professeurs')
        .update({ [champ]: urlPublique })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erreur update:', updateError)
        setErreur(`Erreur sauvegarde : ${updateError.message}`)
        setUploading(null)
        return
      }

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'upload_document',
        details: `Document ${champ} uploadé`,
      })

      // Mise à jour locale
      setDocuments((prev) => ({ ...prev, [champ]: urlPublique }))
      setSucces('✅ Document uploadé avec succès !')
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(`Erreur : ${err.message || 'inconnue'}`)
    } finally {
      setUploading(null)
    }
  }

  const supprimerDocument = async (champ: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return

    setUploading(champ)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('professeurs')
        .update({ [champ]: null })
        .eq('id', user.id)

      if (error) throw error

      setDocuments((prev) => ({ ...prev, [champ]: null }))
      setSucces('✅ Document supprimé')
      setTimeout(() => setSucces(''), 3000)
    } catch (err: any) {
      setErreur(`Erreur : ${err.message}`)
    } finally {
      setUploading(null)
    }
  }

  const soumettreVerification = async () => {
    if (!tousObligatoiresFournis) {
      setErreur('Veuillez fournir tous les documents obligatoires')
      return
    }

    if (!typeProf) {
      setErreur('Veuillez d\'abord choisir votre type de professeur')
      return
    }

    setUploading('soumission')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Log la soumission
      await supabase.from('admin_logs').insert({
        action: 'soumission_verification',
        details: `Soumission de documents - Type: ${typeConfig?.label}`,
      })

      // Notifier l'admin
      await supabase.from('notifications').insert({
        destinataire_id: user.id,
        titre: '📤 Soumission envoyée',
        contenu: 'Vos documents ont été soumis à notre équipe. Vous recevrez une réponse sous 24h.',
        lu: false,
      })

      setSucces('🎉 Votre dossier a été soumis ! Réponse sous 24h.')
      setTimeout(() => setSucces(''), 6000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setUploading(null)
    }
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const getStatutDocument = (champ: string): 'manquant' | 'fourni' => {
    return documents[champ as keyof DocumentsState] ? 'fourni' : 'manquant'
  }

  const getStatutGlobal = (): {
    emoji: string
    label: string
    couleur: string
    description: string
  } => {
    if (statut.approuve && (!physiqueRequise || statut.verifie_physique)) {
      return {
        emoji: '✅',
        label: 'Profil vérifié',
        couleur: 'from-emerald-500 to-teal-600',
        description: 'Votre profil est approuvé et visible par les parents',
      }
    }
    if (statut.approuve && physiqueRequise && !statut.verifie_physique) {
      return {
        emoji: '🚶',
        label: 'Vérification physique en attente',
        couleur: 'from-amber-500 to-orange-600',
        description: 'Vos documents sont OK. Il reste la vérification physique.',
      }
    }
    if (!tousObligatoiresFournis) {
      return {
        emoji: '📎',
        label: 'Documents à compléter',
        couleur: 'from-red-500 to-rose-600',
        description: 'Fournissez vos documents obligatoires pour être vérifié',
      }
    }
    return {
      emoji: '⏳',
      label: 'En attente de validation',
      couleur: 'from-blue-500 to-indigo-600',
      description: 'Vos documents sont complets. Notre équipe vérifie sous 24h.',
    }
  }

  const statutGlobal = getStatutGlobal()

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
        <p className="text-slate-500 text-sm">Chargement de vos documents...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU — PAS DE TYPE CHOISI
  // ============================================================

  if (!typeProf) {
    return (
      <div className="space-y-6">
        <Link
          href="/espace-professeur"
          className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1"
        >
          ← Retour au tableau de bord
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border-2 border-amber-200 shadow-xl text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">
            Choisissez d'abord votre type de professeur
          </h1>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Pour savoir quels documents fournir, vous devez d'abord préciser
            votre type de professeur dans votre profil.
          </p>
          <Link
            href="/espace-professeur/profil"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
          >
            ✏️ Aller à mon profil
          </Link>
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
      {/* SECTION 1 : HEADER HERO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${typeConfig?.couleur || 'from-emerald-600 to-blue-700'} rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden`}
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
          <div className="flex items-start gap-4 flex-wrap mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl border-2 border-white/30 flex-shrink-0">
              {typeConfig?.emoji || '📎'}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">
                Type de professeur
              </div>
              <h1 className="text-2xl md:text-3xl font-black mb-2">
                {typeConfig?.label}
              </h1>
              <p className="text-sm opacity-90">{typeConfig?.description}</p>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-wider">
                📊 Complétion des documents
              </span>
              <span className="text-lg font-black">
                {totalDocsFournis}/{totalDocsRequis} — {pourcentage}%
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pourcentage}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={`h-full rounded-full ${
                  pourcentage === 100
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400'
                    : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-[10px] font-black uppercase opacity-90">
                  🔴 Obligatoires
                </div>
                <div className="text-xl font-black">
                  {docsObligatoiresFournis}/{documentsObligatoires.length}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-[10px] font-black uppercase opacity-90">
                  ⚪ Optionnels
                </div>
                <div className="text-xl font-black">
                  {docsOptionnelsFournis}/{documentsOptionnels.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 2 : STATUT GLOBAL */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`bg-gradient-to-r ${statutGlobal.couleur} rounded-3xl p-5 shadow-xl text-white flex items-center gap-4`}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-2 border-white/30 flex-shrink-0">
          {statutGlobal.emoji}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black mb-1">{statutGlobal.label}</h3>
          <p className="text-xs text-white/90">{statutGlobal.description}</p>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 3 : MESSAGES SUCCÈS / ERREUR */}
      {/* ============================================================ */}

      <AnimatePresence>
        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <span className="text-xl flex-shrink-0">✅</span>
            <p className="text-emerald-800 text-sm font-bold">{succes}</p>
          </motion.div>
        )}
        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-red-700 text-sm font-medium">{erreur}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* SECTION 4 : DOCUMENTS OBLIGATOIRES */}
      {/* ============================================================ */}

      {documentsObligatoires.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-2xl shadow-lg">
              🔴
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Documents obligatoires
              </h2>
              <p className="text-xs text-red-700 font-bold">
                Requis pour valider votre profil
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {documentsObligatoires.map((doc) => {
              const url = documents[doc.champ as keyof DocumentsState]
              const isUploading = uploading === doc.champ
              const fourni = url !== null

              return (
                <motion.div
                  key={doc.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-5 border-2 transition-all ${
                    fourni
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-red-50/50 border-red-300'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 ${
                        fourni
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                          : 'bg-gradient-to-br from-red-500 to-rose-600'
                      }`}
                    >
                      {doc.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">
                          {doc.label}
                        </span>
                        {fourni ? (
                          <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">
                            ✓ FOURNI
                          </span>
                        ) : (
                          <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                            ⚠️ REQUIS
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">{doc.hint}</p>
                    </div>
                  </div>

                  {doc.conseil && (
                    <div className="bg-white/70 rounded-lg p-2 mb-3 border border-slate-200">
                      <p className="text-[10px] text-slate-600 italic">
                        💡 {doc.conseil}
                      </p>
                    </div>
                  )}

                  {fourni ? (
                    <div className="flex gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2.5 bg-blue-500 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        👁️ Voir le document
                      </a>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept={doc.accepte}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) uploaderDocument(doc.champ, f)
                          }}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <span className="px-3 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition-colors flex items-center justify-center">
                          🔄
                        </span>
                      </label>
                      <button
                        onClick={() => supprimerDocument(doc.champ)}
                        disabled={isUploading}
                        className="px-3 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept={doc.accepte}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploaderDocument(doc.champ, f)
                        }}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <div
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                          isUploading
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-red-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"
                            />
                            <p className="text-sm font-bold text-emerald-700">
                              Upload en cours...
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-4xl mb-2">📎</div>
                            <p className="text-sm font-bold text-slate-700 mb-1">
                              Cliquez pour uploader
                            </p>
                            <p className="text-[10px] text-slate-500">
                              JPG, PNG, PDF (max 5 Mo)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION 5 : DOCUMENTS OPTIONNELS */}
      {/* ============================================================ */}

      {documentsOptionnels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-2xl shadow-lg">
              ⚪
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Documents recommandés
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                Renforce votre crédibilité (fortement recommandé)
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {documentsOptionnels.map((doc) => {
              const url = documents[doc.champ as keyof DocumentsState]
              const isUploading = uploading === doc.champ
              const fourni = url !== null

              return (
                <motion.div
                  key={doc.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-5 border-2 transition-all ${
                    fourni
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 ${
                        fourni
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                          : 'bg-gradient-to-br from-slate-300 to-slate-400'
                      }`}
                    >
                      {doc.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">
                          {doc.label}
                        </span>
                        {fourni ? (
                          <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">
                            ✓ FOURNI
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full font-black">
                            OPTIONNEL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">{doc.hint}</p>
                    </div>
                  </div>

                  {doc.conseil && (
                    <div className="bg-slate-50 rounded-lg p-2 mb-3 border border-slate-200">
                      <p className="text-[10px] text-slate-600 italic">
                        💡 {doc.conseil}
                      </p>
                    </div>
                  )}

                  {fourni ? (
                    <div className="flex gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2.5 bg-blue-500 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors"
                      >
                        👁️ Voir
                      </a>
                      <button
                        onClick={() => supprimerDocument(doc.champ)}
                        disabled={isUploading}
                        className="px-3 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept={doc.accepte}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploaderDocument(doc.champ, f)
                        }}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <div
                        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                          isUploading
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"
                            />
                            <p className="text-xs font-bold text-emerald-700">
                              Upload en cours...
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl mb-1">📎</div>
                            <p className="text-xs font-bold text-slate-700">
                              Ajouter ce document
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION 6 : VÉRIFICATION PHYSIQUE */}
      {/* ============================================================ */}

      {physiqueRequise && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-3xl p-6 md:p-8 shadow-xl border-2 ${
            statut.verifie_physique
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
              : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
          }`}
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg flex-shrink-0 ${
                statut.verifie_physique
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600'
              }`}
            >
              {statut.verifie_physique ? '✅' : '🚶'}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900">
                  Vérification physique
                </h3>
                {statut.verifie_physique ? (
                  <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-full font-black">
                    ✓ VALIDÉE
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500 text-white px-3 py-1 rounded-full font-black">
                    ⏳ EN ATTENTE
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                {statut.verifie_physique
                  ? 'Votre vérification physique a été effectuée avec succès par notre équipe.'
                  : `Votre type de professeur (${typeConfig?.label}) nécessite une vérification physique. Notre équipe va vous contacter pour organiser une rencontre ou une visite de votre établissement.`}
              </p>

              {statut.verifie_physique && statut.date_verification_physique && (
                <div className="bg-white rounded-xl p-3 border border-emerald-200 mb-3">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1">
                    📅 Date de vérification
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {new Date(statut.date_verification_physique).toLocaleDateString(
                      'fr-FR',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}
                  </div>
                </div>
              )}

              {statut.note_verification_admin && (
                <div
                  className={`rounded-xl p-3 border-2 ${
                    statut.verifie_physique
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase mb-1 ${
                      statut.verifie_physique ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    📝 Note de l'admin
                  </div>
                  <p
                    className={`text-xs ${
                      statut.verifie_physique ? 'text-emerald-900' : 'text-red-900'
                    }`}
                  >
                    {statut.note_verification_admin}
                  </p>
                </div>
              )}

              {!statut.verifie_physique && (
                <a
                  href="https://wa.me/25377741482?text=Bonjour%2C%20je%20souhaite%20organiser%20ma%20v%C3%A9rification%20physique"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                >
                  💬 Contacter l'équipe pour organiser
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION 7 : ACTION SOUMETTRE */}
      {/* ============================================================ */}

      {tousObligatoiresFournis && !statut.approuve && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
        >
          <motion.div
            className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10 text-center">
            <div className="text-5xl mb-3">📤</div>
            <h3 className="text-2xl font-black mb-2">
              Prêt à être vérifié !
            </h3>
            <p className="text-sm text-blue-100 mb-5 max-w-xl mx-auto">
              Tous vos documents obligatoires sont fournis. Soumettez votre dossier
              à notre équipe qui va le vérifier sous 24h.
            </p>
            <button
              onClick={soumettreVerification}
              disabled={uploading === 'soumission'}
              className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 flex items-center gap-3 mx-auto text-base"
            >
              {uploading === 'soumission' ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"
                  />
                  Envoi en cours...
                </>
              ) : (
                <>
                  📤 Soumettre à vérification
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION 8 : INFO SÉCURITÉ */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-6 border-2 border-emerald-200 shadow-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            🔒
          </div>
          <div>
            <h3 className="font-black text-slate-900 mb-2">
              Vos documents sont sécurisés
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Tous vos documents sont <strong>chiffrés</strong> et ne sont visibles que
              par notre équipe de vérification. Ils ne seront <strong>JAMAIS</strong>{' '}
              partagés sans votre accord.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}