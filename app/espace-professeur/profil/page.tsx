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

type ProfilComplet = {
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string
  bio: string
  photo_url: string | null
  experience_annees: number
  zone_enseignement: string
  max_eleves: number | null
  autres_matieres: string | null
  est_etudiant: boolean
  universite: string | null
  domaine_etude: string | null
  niveau_etude: string | null
  statut_universitaire: string | null
  approuve: boolean
  etoiles: number
  badge_admin: string | null
  pionnier: boolean

  // Nouveaux champs
  type_professeur: TypeProf
  specialite: string | null
  niveau_diplome: string | null
  annee_diplome: number | null
  diplome_url: string | null
  attestation_url: string | null
  cv_url: string | null
  portfolio_url: string | null
  attestation_employeur_url: string | null
  carte_professionnelle_url: string | null
  attestation_religieuse_url: string | null
  carte_etudiante_url: string | null
  carte_identite_url: string | null
  bac_s_scan_url: string | null
  verifie_physique: boolean
  date_verification_physique: string | null
  note_verification_admin: string | null
}

// ============================================================
// CONFIG TYPES DE PROFESSEURS
// ============================================================

const typesProfConfig: {
  [k: string]: {
    label: string
    emoji: string
    couleur: string
    description: string
    champsSpecifiques: string[]
    documentsRequis: string[]
    physiqueRequise: boolean
  }
} = {
  etudiant: {
    label: 'Étudiant universitaire',
    emoji: '🎓',
    couleur: 'from-blue-500 to-indigo-600',
    description: 'En cours d\'études supérieures (Licence, Master, Doctorat)',
    champsSpecifiques: ['niveau_etude', 'domaine_etude', 'universite'],
    documentsRequis: ['carte_etudiante', 'carte_identite'],
    physiqueRequise: false,
  },
  diplome: {
    label: 'Diplômé (Licence/Master)',
    emoji: '📜',
    couleur: 'from-emerald-500 to-teal-600',
    description: 'Titulaire d\'un diplôme universitaire',
    champsSpecifiques: ['niveau_diplome', 'annee_diplome', 'domaine_etude'],
    documentsRequis: ['diplome', 'attestation', 'carte_identite'],
    physiqueRequise: false,
  },
  bac_s: {
    label: 'Bac Scientifique',
    emoji: '🎓',
    couleur: 'from-amber-500 to-orange-600',
    description: 'Titulaire du Baccalauréat Scientifique',
    champsSpecifiques: ['annee_diplome'],
    documentsRequis: ['bac_s_scan', 'carte_identite'],
    physiqueRequise: false,
  },
  enseignant: {
    label: 'Enseignant officiel',
    emoji: '👨‍🏫',
    couleur: 'from-purple-500 to-pink-600',
    description: 'Enseignant dans une école publique ou privée',
    champsSpecifiques: ['specialite', 'universite'],
    documentsRequis: ['attestation_employeur', 'carte_professionnelle', 'carte_identite'],
    physiqueRequise: true,
  },
  freelance: {
    label: 'Professeur freelance',
    emoji: '💼',
    couleur: 'from-cyan-500 to-blue-600',
    description: 'Tuteur indépendant avec expérience',
    champsSpecifiques: ['specialite', 'experience_annees'],
    documentsRequis: ['cv', 'carte_identite'],
    physiqueRequise: true,
  },
  formateur: {
    label: 'Formateur',
    emoji: '🏢',
    couleur: 'from-rose-500 to-pink-600',
    description: 'Formateur spécialisé dans un domaine',
    champsSpecifiques: ['specialite'],
    documentsRequis: ['portfolio', 'carte_identite'],
    physiqueRequise: true,
  },
  coran: {
    label: 'Enseignant Coran',
    emoji: '📖',
    couleur: 'from-green-500 to-emerald-600',
    description: 'Enseignant du Coran et des sciences religieuses',
    champsSpecifiques: [],
    documentsRequis: [],
    physiqueRequise: true,
  },
}

// ============================================================
// HELPER : Formater téléphone Djibouti
// ============================================================

const formaterTelephone = (valeur: string) => {
  let v = valeur.replace(/[^\d+]/g, '')
  if (!v.startsWith('+253')) {
    v = '+253 ' + v.replace(/^\+?253\s*/, '')
  }
  const apres = v.replace('+253', '').trim()
  const chiffres = apres.replace(/\D/g, '').slice(0, 8)
  const groupes: string[] = []
  for (let i = 0; i < chiffres.length; i += 2) {
    groupes.push(chiffres.slice(i, i + 2))
  }
  return '+253 ' + groupes.join(' ')
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ProfilProfesseur() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [loading, setLoading] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [modeEdition, setModeEdition] = useState(false)
  const [modifications, setModifications] = useState(false)
  const [voirApercu, setVoirApercu] = useState(false)

  const [profil, setProfil] = useState<ProfilComplet>({
    nom_complet: '',
    email: '',
    telephone: '+253 ',
    whatsapp: '+253 ',
    quartier: '',
    bio: '',
    photo_url: null,
    experience_annees: 0,
    zone_enseignement: '',
    max_eleves: null,
    autres_matieres: null,
    est_etudiant: false,
    universite: null,
    domaine_etude: null,
    niveau_etude: null,
    statut_universitaire: null,
    approuve: false,
    etoiles: 0,
    badge_admin: null,
    pionnier: false,

    // Nouveaux
    type_professeur: null,
    specialite: null,
    niveau_diplome: null,
    annee_diplome: null,
    diplome_url: null,
    attestation_url: null,
    cv_url: null,
    portfolio_url: null,
    attestation_employeur_url: null,
    carte_professionnelle_url: null,
    attestation_religieuse_url: null,
    carte_etudiante_url: null,
    carte_identite_url: null,
    bac_s_scan_url: null,
    verifie_physique: false,
    date_verification_physique: null,
    note_verification_admin: null,
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('nom_complet, email, telephone, whatsapp, quartier, bio, photo_url, approuve')
      .eq('id', user.id)
      .single()

    const { data: prof } = await supabase
      .from('professeurs')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setProfil((prev) => ({
        ...prev,
        nom_complet: profile.nom_complet || '',
        email: profile.email || user.email || '',
        telephone: profile.telephone || '+253 ',
        whatsapp: profile.whatsapp || '+253 ',
        quartier: profile.quartier || '',
        bio: profile.bio || '',
        photo_url: profile.photo_url || null,
        approuve: profile.approuve || false,

        experience_annees: prof?.experience_annees || 0,
        zone_enseignement: prof?.zone_enseignement || '',
        max_eleves: prof?.max_eleves || null,
        autres_matieres: prof?.autres_matieres || null,
        est_etudiant: prof?.est_etudiant || false,
        universite: prof?.universite || null,
        domaine_etude: prof?.domaine_etude || null,
        niveau_etude: prof?.niveau_etude || null,
        statut_universitaire: prof?.statut_universitaire || null,
        etoiles: prof?.etoiles || 0,
        badge_admin: prof?.badge_admin || null,
        pionnier: prof?.pionnier || false,

        type_professeur: (prof?.type_professeur as TypeProf) || null,
        specialite: prof?.specialite || null,
        niveau_diplome: prof?.niveau_diplome || null,
        annee_diplome: prof?.annee_diplome || null,
        diplome_url: prof?.diplome_url || null,
        attestation_url: prof?.attestation_url || null,
        cv_url: prof?.cv_url || null,
        portfolio_url: prof?.portfolio_url || null,
        attestation_employeur_url: prof?.attestation_employeur_url || null,
        carte_professionnelle_url: prof?.carte_professionnelle_url || null,
        attestation_religieuse_url: prof?.attestation_religieuse_url || null,
        carte_etudiante_url: prof?.carte_etudiante_url || null,
        carte_identite_url: prof?.carte_identite_url || null,
        bac_s_scan_url: prof?.bac_s_scan_url || null,
        verifie_physique: prof?.verifie_physique || false,
        date_verification_physique: prof?.date_verification_physique || null,
        note_verification_admin: prof?.note_verification_admin || null,
      }))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // ACTIONS
  // ============================================================

  const modifierChamp = (champ: keyof ProfilComplet, valeur: any) => {
    setProfil({ ...profil, [champ]: valeur })
    setModifications(true)
  }

  const changerType = async (type: TypeProf) => {
    if (!type) return
    if (profil.type_professeur && profil.type_professeur !== type) {
      if (
        !confirm(
          `⚠️ Changer votre type de professeur ?\n\nLe passage à "${typesProfConfig[type].label}" nécessitera une nouvelle vérification par notre équipe.`
        )
      ) {
        return
      }
    }
    modifierChamp('type_professeur', type)
  }

  const enregistrer = async () => {
    // Validations
    if (!profil.nom_complet.trim() || profil.nom_complet.trim().length < 3) {
      setErreur('Le nom doit contenir au moins 3 caractères')
      return
    }
    if (!profil.type_professeur) {
      setErreur('Veuillez choisir votre type de professeur')
      return
    }
    if (profil.bio.length > 500) {
      setErreur('La bio ne doit pas dépasser 500 caractères')
      return
    }

    setSauvegarde(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mise à jour profiles
      const { error: errProfile } = await supabase
        .from('profiles')
        .update({
          nom_complet: profil.nom_complet.trim(),
          telephone: profil.telephone.trim(),
          whatsapp: profil.whatsapp.trim(),
          quartier: profil.quartier.trim(),
          bio: profil.bio.trim(),
        })
        .eq('id', user.id)

      if (errProfile) throw errProfile

      // Mise à jour professeurs
      const { error: errProf } = await supabase
        .from('professeurs')
        .update({
          type_professeur: profil.type_professeur,
          specialite: profil.specialite?.trim() || null,
          niveau_diplome: profil.niveau_diplome || null,
          annee_diplome: profil.annee_diplome || null,
          experience_annees: Number(profil.experience_annees) || 0,
          zone_enseignement: profil.zone_enseignement,
          max_eleves: profil.max_eleves ? Number(profil.max_eleves) : null,
          autres_matieres: profil.autres_matieres?.trim() || null,
          est_etudiant: profil.type_professeur === 'etudiant',
          universite: profil.universite?.trim() || null,
          domaine_etude: profil.domaine_etude?.trim() || null,
          niveau_etude: profil.niveau_etude?.trim() || null,
        })
        .eq('id', user.id)

      if (errProf) throw errProf

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'modifier_profil_prof',
        details: `${profil.nom_complet} - Type: ${typesProfConfig[profil.type_professeur].label}`,
      })

      setSucces('✅ Profil enregistré avec succès !')
      setTimeout(() => setSucces(''), 4000)
      setModifications(false)
      setModeEdition(false)
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSauvegarde(false)
    }
  }

  const annulerModifications = () => {
    charger()
    setModeEdition(false)
    setModifications(false)
    setErreur('')
  }

  // ============================================================
  // UPLOAD PHOTO
  // ============================================================

  const uploaderPhoto = async (fichier: File) => {
    setErreur('')
    setUploading('photo')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const extension = fichier.name.split('.').pop()
      const nomFichier = `${user.id}/photo-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(nomFichier, fichier, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(nomFichier)

      const url = urlData.publicUrl

      await Promise.all([
        supabase.from('profiles').update({ photo_url: url }).eq('id', user.id),
        supabase
          .from('professeurs')
          .update({ photo_profil_url: url })
          .eq('id', user.id),
      ])

      setProfil({ ...profil, photo_url: url })
      setSucces('✅ Photo mise à jour !')
      setTimeout(() => setSucces(''), 3000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur upload')
    } finally {
      setUploading(null)
    }
  }

  // ============================================================
  // UPLOAD DOCUMENTS DYNAMIQUES
  // ============================================================

  const uploaderDocument = async (
    champ: keyof ProfilComplet,
    fichier: File
  ) => {
    setErreur('')
    setUploading(champ as string)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const extension = fichier.name.split('.').pop()
      const nomFichier = `${user.id}/${champ}-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(nomFichier, fichier, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(nomFichier)

      const url = urlData.publicUrl

      // Update dans professeurs
      const update: any = { [champ]: url }

      // Si c'est bac_s_scan_url, cocher a_bac_s
      if (champ === 'attestation_religieuse_url') {
        // rien de spécial
      }

      const { error: updateError } = await supabase
        .from('professeurs')
        .update(update)
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfil({ ...profil, [champ]: url })
      setSucces(`✅ Document uploadé avec succès !`)
      setTimeout(() => setSucces(''), 3000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur upload')
    } finally {
      setUploading(null)
    }
  }

  const supprimerDocument = async (champ: keyof ProfilComplet) => {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return

    setUploading(champ as string)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('professeurs')
        .update({ [champ]: null })
        .eq('id', user.id)

      if (error) throw error

      setProfil({ ...profil, [champ]: null })
      setSucces('✅ Document supprimé')
      setTimeout(() => setSucces(''), 3000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur suppression')
    } finally {
      setUploading(null)
    }
  }

  // ============================================================
  // CALCUL COMPLÉTION
  // ============================================================

  const calculerCompletion = () => {
    const criteres = [
      profil.nom_complet.length >= 3,
      profil.telephone.length >= 12,
      profil.quartier.length > 0,
      profil.bio.length > 20,
      profil.photo_url !== null,
      profil.type_professeur !== null,
      profil.experience_annees > 0,
      profil.zone_enseignement.length > 0,
    ]
    const remplis = criteres.filter(Boolean).length
    return Math.round((remplis / criteres.length) * 100)
  }

  const completion = calculerCompletion()
  const typeConfig = profil.type_professeur
    ? typesProfConfig[profil.type_professeur]
    : null

  // ============================================================
  // RENDU — CHARGEMENT
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
  
  // ============================================================
  // RENDU — APERÇU PUBLIC
  // ============================================================

  if (voirApercu) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setVoirApercu(false)}
          className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1"
        >
          ← Retour à l'édition
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-2xl"
        >
          <p className="text-sm text-amber-800">
            👁️ <strong>Aperçu public</strong> — Voici ce que les parents voient quand ils
            consultent votre profil.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6 pb-6 border-b-2 border-slate-100">
            {profil.photo_url ? (
              <img
                src={profil.photo_url}
                alt={profil.nom_complet}
                className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-4 border-emerald-100"
              />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-600 to-blue-700 flex items-center justify-center text-white text-6xl shadow-2xl">
                👨‍🏫
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                  {profil.nom_complet}
                </h1>
                {profil.approuve && (
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm border-2 border-white shadow-lg">
                    ✓
                  </div>
                )}
              </div>

              {/* Type de prof */}
              {typeConfig && (
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${typeConfig.couleur} text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md mb-3`}>
                  <span>{typeConfig.emoji}</span>
                  <span>{typeConfig.label}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-600 mb-3">
                {profil.quartier && <span>📍 {profil.quartier}</span>}
                <span>
                  🎯 {profil.experience_annees} an
                  {profil.experience_annees > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {profil.badge_admin === 'super_pro' && (
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full text-xs font-black shadow">
                    👑 SUPER-PRO
                  </span>
                )}
                {profil.badge_admin === 'recommande' && (
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-black shadow">
                    🏅 RECOMMANDÉ
                  </span>
                )}
                {profil.pionnier && (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-full text-xs font-black shadow">
                    🏆 PIONNIER
                  </span>
                )}
                {profil.etoiles > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">
                    {'⭐'.repeat(profil.etoiles)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profil.bio && (
            <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border-l-4 border-emerald-500">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                📝 À propos
              </div>
              <p className="text-base md:text-lg text-slate-800 leading-relaxed italic">
                « {profil.bio} »
              </p>
            </div>
          )}

          {profil.zone_enseignement && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-600 mb-2">
                🏠 ZONE D'ENSEIGNEMENT
              </div>
              <span className="inline-block px-4 py-2 bg-purple-50 text-purple-800 rounded-xl font-bold border border-purple-200">
                {profil.zone_enseignement === 'chez_moi'
                  ? '🏠 Chez le prof'
                  : profil.zone_enseignement === 'chez_eleve'
                  ? "🚶 Chez l'élève"
                  : '🔄 Les deux possibles'}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // ============================================================
  // RENDU — VUE ÉDITION PRINCIPALE
  // ============================================================

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/espace-professeur"
          className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1"
        >
          ← Retour au tableau de bord
        </Link>
        <button
          onClick={() => setVoirApercu(true)}
          className="text-sm font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
        >
          👁️ Voir mon profil public
        </button>
      </div>

      {/* ============================================================ */}
      {/* HEADER HERO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 shadow-2xl"
      >
        <motion.div
          className="absolute top-[-100px] right-[-100px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative flex-shrink-0">
              {profil.photo_url ? (
                <img
                  src={profil.photo_url}
                  alt={profil.nom_complet}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover shadow-2xl border-4 border-white/30"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-6xl shadow-2xl border-4 border-white/30">
                  👨‍🏫
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploaderPhoto(f)
                  }}
                  className="hidden"
                  disabled={uploading === 'photo'}
                />
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center text-xl cursor-pointer border-2 border-emerald-100"
                  title="Changer la photo"
                >
                  {uploading === 'photo' ? '⏳' : '📸'}
                </motion.div>
              </label>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  {profil.nom_complet || 'Votre nom'}
                </h1>
                {profil.approuve && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm border-2 border-white shadow-lg"
                    title="Profil vérifié"
                  >
                    ✓
                  </motion.div>
                )}
              </div>

              {typeConfig && (
                <div className={`inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-black border border-white/30 mb-3`}>
                  <span>{typeConfig.emoji}</span>
                  <span>{typeConfig.label}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-white/80 mb-4">
                {profil.quartier && (
                  <span className="flex items-center gap-1">📍 {profil.quartier}</span>
                )}
                <span className="flex items-center gap-1">
                  🎯 {profil.experience_annees} an
                  {profil.experience_annees > 1 ? 's' : ''} d'expérience
                </span>
              </div>

              <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                {!modeEdition ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModeEdition(true)}
                    className="bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    ✏️ Modifier mon profil
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={annulerModifications}
                      disabled={sauvegarde}
                      className="bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/30 hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={enregistrer}
                      disabled={sauvegarde || !modifications}
                      className="bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {sauvegarde ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full"
                          />
                          Sauvegarde...
                        </>
                      ) : (
                        <>💾 Enregistrer</>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                📊 Complétion du profil
              </span>
              <span className="text-lg font-black text-white">{completion}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* MESSAGES SUCCÈS / ERREUR */}
      {/* ============================================================ */}

      <AnimatePresence>
        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl flex-shrink-0">
              ✓
            </div>
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
            <span className="text-xl">⚠️</span>
            <p className="text-red-700 text-sm font-medium">{erreur}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* SECTION TYPE DE PROFESSEUR */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 md:p-8 border-2 border-blue-200 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">
            🎯
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Mon type de professeur
            </h2>
            <p className="text-xs text-blue-700 font-bold">
              ⭐ Étape obligatoire pour être vérifié
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(typesProfConfig) as Array<keyof typeof typesProfConfig>).map(
            (key) => {
              const t = typesProfConfig[key]
              const actif = profil.type_professeur === key
              return (
                <motion.button
                  key={key}
                  type="button"
                  whileHover={{ scale: modeEdition ? 1.02 : 1 }}
                  whileTap={{ scale: modeEdition ? 0.98 : 1 }}
                  onClick={() => modeEdition && changerType(key as TypeProf)}
                  disabled={!modeEdition}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                    actif
                      ? `bg-gradient-to-br ${t.couleur} text-white border-transparent shadow-lg`
                      : modeEdition
                      ? 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 cursor-pointer'
                      : 'bg-white text-slate-800 border-slate-200 opacity-70 cursor-not-allowed'
                  }`}
                >
                  {actif && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center text-emerald-600 text-sm font-black shadow">
                      ✓
                    </div>
                  )}
                  <div className="text-3xl mb-2">{t.emoji}</div>
                  <div className="font-black text-sm mb-1">{t.label}</div>
                  <div
                    className={`text-[10px] ${
                      actif ? 'text-white/90' : 'text-slate-500'
                    }`}
                  >
                    {t.description}
                  </div>
                  {t.physiqueRequise && (
                    <div
                      className={`mt-2 text-[9px] px-2 py-0.5 rounded-full font-black inline-block ${
                        actif
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      🚶 Vérification physique requise
                    </div>
                  )}
                </motion.button>
              )
            }
          )}
        </div>

        {!modeEdition && profil.type_professeur && (
          <div className="mt-4 text-xs text-slate-600 italic">
            💡 Cliquez sur "✏️ Modifier mon profil" pour changer votre type.
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION CHAMPS SPÉCIFIQUES AU TYPE */}
      {/* ============================================================ */}

      {profil.type_professeur && typeConfig && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${typeConfig.couleur} flex items-center justify-center text-white text-xl shadow-lg`}
            >
              {typeConfig.emoji}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Informations spécifiques
              </h2>
              <p className="text-xs text-slate-500">
                Champs obligatoires pour : {typeConfig.label}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* ÉTUDIANT */}
            {profil.type_professeur === 'etudiant' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    🎓 Niveau d'études
                  </label>
                  {modeEdition ? (
                    <select
                      value={profil.niveau_etude || ''}
                      onChange={(e) => modifierChamp('niveau_etude', e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium text-slate-900"
                      style={{ color: '#1e293b' }}
                    >
                      <option value="">-- Choisir --</option>
                      <option value="L1">L1 (1ère année Licence)</option>
                      <option value="L2">L2 (2ème année Licence)</option>
                      <option value="L3">L3 (3ème année Licence)</option>
                      <option value="M1">M1 (1ère année Master)</option>
                      <option value="M2">M2 (2ème année Master)</option>
                      <option value="Doctorat">Doctorat</option>
                    </select>
                  ) : (
                    <div className="px-5 py-4 bg-slate-50 rounded-xl font-bold text-slate-900">
                      {profil.niveau_etude || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📚 Domaine d'études
                  </label>
                  {modeEdition ? (
                    <input
                      type="text"
                      value={profil.domaine_etude || ''}
                      onChange={(e) => modifierChamp('domaine_etude', e.target.value)}
                      placeholder="Ex : Mathématiques, Informatique..."
                      className="w-full px-4 py-3.5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium text-slate-900"
                      style={{ color: '#1e293b' }}
                    />
                  ) : (
                    <div className="px-5 py-4 bg-slate-50 rounded-xl font-bold text-slate-900">
                      {profil.domaine_etude || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    🏛️ Université
                  </label>
                  {modeEdition ? (
                    <input
                      type="text"
                      value={profil.universite || ''}
                      onChange={(e) => modifierChamp('universite', e.target.value)}
                      placeholder="Ex : Université de Djibouti"
                      className="w-full px-4 py-3.5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium text-slate-900"
                      style={{ color: '#1e293b' }}
                    />
                  ) : (
                    <div className="px-5 py-4 bg-slate-50 rounded-xl font-bold text-slate-900">
                      {profil.universite || '—'}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* DIPLÔMÉ / BAC S */}
            {(profil.type_professeur === 'diplome' ||
              profil.type_professeur === 'bac_s') && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📜 Niveau du diplôme
                  </label>
                  {modeEdition ? (
                    <select
                      value={profil.niveau_diplome || ''}
                      onChange={(e) => modifierChamp('niveau_diplome', e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border-2 border-emerald-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-medium text-slate-900"
                      style={{ color: '#1e293b' }}
                    >
                      <option value="">-- Choisir --</option>
                      <option value="bac">Baccalauréat</option>
                      <option value="licence">Licence</option>
                      <option value="master">Master</option>
                      <option value="doctorat">Doctorat</option>
                      <option value="autre">Autre</option>
                    </select>
                  ) : (
                    <div className="px-5 py-4 bg-slate-50 rounded-xl font-bold text-slate-900 capitalize">
                      {profil.niveau_diplome || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📅 Année d'obtention
                  </label>
                  {modeEdition ? (
                    <input
                      type="number"
                      value={profil.annee_diplome || ''}
                      onChange={(e) =>
                        modifierChamp('annee_diplome', e.target.value ? Number(e.target.value) : null)
                      }
                      min="1990"
                      max={new Date().getFullYear()}
                      placeholder="Ex : 2020"
                      className="w-full px-4 py-3.5 bg-white border-2 border-emerald-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-medium text-slate-900"
                      style={{ color: '#1e293b' }}
                    />
                  ) : (
                    <div className="px-5 py-4 bg-slate-50 rounded-xl font-bold text-slate-900">
                      {profil.annee_diplome || '—'}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ENSEIGNANT / FREELANCE / FORMATEUR */}
            {(profil.type_professeur === 'enseignant' ||
              profil.type_professeur === 'freelance' ||
              profil.type_professeur === 'formateur') && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  🎯 Ma spécialité / Ce que j'enseigne
                </label>
                {modeEdition ? (
                  <input
                    type="text"
                    value={profil.specialite || ''}
                    onChange={(e) => modifierChamp('specialite', e.target.value)}
                    placeholder="Ex : Maths avancées, Anglais des affaires, Informatique..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-purple-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none font-medium text-slate-900"
                    style={{ color: '#1e293b' }}
                  />
                ) : (
                  <div className="px-5 py-4 bg-slate-50 rounded-xl font-bold text-slate-900">
                    {profil.specialite || '—'}
                  </div>
                )}
              </div>
            )}

            {/* CORAN */}
            {profil.type_professeur === 'coran' && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📖</span>
                  <div>
                    <p className="text-sm font-bold text-green-900 mb-1">
                      Aucun document obligatoire en ligne
                    </p>
                    <p className="text-xs text-green-800 leading-relaxed">
                      Votre profil sera vérifié <strong>physiquement</strong> par notre
                      équipe. Vous serez convoqué pour un entretien et un test de
                      récitation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION DOCUMENTS REQUIS */}
      {/* ============================================================ */}

      {profil.type_professeur && typeConfig && typeConfig.documentsRequis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xl shadow-lg">
              📎
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Documents à fournir
              </h2>
              <p className="text-xs text-slate-500">
                Requis pour valider votre profil {typeConfig.label}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {typeConfig.documentsRequis.map((docKey) => {
              const docInfo: {
                [k: string]: { label: string; emoji: string; champ: keyof ProfilComplet; accepte: string; hint: string }
              } = {
                carte_etudiante: {
                  label: 'Carte étudiante',
                  emoji: '🎓',
                  champ: 'carte_etudiante_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Recto/verso bien lisible',
                },
                carte_identite: {
                  label: 'Carte d\'identité (recommandée)',
                  emoji: '🆔',
                  champ: 'carte_identite_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Recto/verso bien lisible',
                },
                diplome: {
                  label: 'Diplôme universitaire',
                  emoji: '📜',
                  champ: 'diplome_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Scan ou photo nette du diplôme',
                },
                attestation: {
                  label: 'Relevé de notes',
                  emoji: '📋',
                  champ: 'attestation_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Dernier relevé de notes officiel',
                },
                bac_s_scan: {
                  label: 'Scan du Bac S',
                  emoji: '🎓',
                  champ: 'bac_s_scan_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Diplôme du Baccalauréat Scientifique',
                },
                attestation_employeur: {
                  label: 'Attestation employeur',
                  emoji: '🏢',
                  champ: 'attestation_employeur_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Attestation de votre établissement',
                },
                carte_professionnelle: {
                  label: 'Carte professionnelle',
                  emoji: '💼',
                  champ: 'carte_professionnelle_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Carte d\'enseignant officielle',
                },
                cv: {
                  label: 'CV détaillé',
                  emoji: '📄',
                  champ: 'cv_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Parcours et expériences',
                },
                portfolio: {
                  label: 'Portfolio / Certifications',
                  emoji: '🏆',
                  champ: 'portfolio_url',
                  accepte: 'image/*,.pdf',
                  hint: 'Vos formations et réalisations',
                },
              }

              const info = docInfo[docKey]
              if (!info) return null

              const url = profil[info.champ] as string | null
              const isUploading = uploading === info.champ

              return (
                <div
                  key={docKey}
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    url
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${
                        url
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                          : 'bg-slate-200'
                      }`}
                    >
                      {info.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">
                          {info.label}
                        </span>
                        {url ? (
                          <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">
                            ✓ FOURNI
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black">
                            ⚠️ REQUIS
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">{info.hint}</p>
                    </div>
                  </div>

                  {url ? (
                    <div className="flex gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                      >
                        👁️ Voir
                      </a>
                      <button
                        onClick={() => supprimerDocument(info.champ)}
                        disabled={isUploading}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept={info.accepte}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploaderDocument(info.champ, f)
                        }}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <div
                        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                          isUploading
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-300 hover:border-pink-400 hover:bg-pink-50'
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
                              Cliquer pour uploader
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              )
            })}
          </div>

          {/* Info vérification physique */}
          {typeConfig.physiqueRequise && (
            <div className="mt-5 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚶</span>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">
                    Vérification physique obligatoire
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Après avoir uploadé vos documents, notre équipe vous contactera
                    pour une <strong>rencontre physique</strong> ou une visite de votre
                    établissement afin de valider définitivement votre profil.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SECTION BIO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-6 md:p-8 border-2 border-emerald-200 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">
            📝
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Ma bio</h2>
            <p className="text-xs text-emerald-700 font-bold">
              ⭐ Ce texte est ce que les parents voient en premier
            </p>
          </div>
        </div>

        {modeEdition ? (
          <>
            <textarea
              value={profil.bio}
              onChange={(e) => modifierChamp('bio', e.target.value)}
              rows={6}
              maxLength={500}
              placeholder="Décrivez votre parcours, votre pédagogie, votre approche avec les enfants..."
              className="w-full px-5 py-4 bg-white border-2 border-emerald-300 rounded-2xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none resize-none font-medium text-slate-900 text-base leading-relaxed"
              style={{ color: '#1e293b' }}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-600 font-medium">
                {profil.bio.length}/500 caractères
              </p>
              {profil.bio.length < 100 && (
                <p className="text-xs text-amber-700 font-bold">
                  💡 Écrivez au moins 100 caractères
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-200 shadow-inner">
            {profil.bio ? (
              <p className="text-base md:text-lg text-slate-800 leading-relaxed italic font-medium">
                « {profil.bio} »
              </p>
            ) : (
              <p className="text-slate-500 italic text-center py-4">
                Aucune bio pour l'instant.
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION CONTACT */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
            👤
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Informations personnelles
            </h2>
            <p className="text-xs text-slate-500">Vos coordonnées</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nom complet
            </label>
            {modeEdition ? (
              <input
                type="text"
                value={profil.nom_complet}
                onChange={(e) => modifierChamp('nom_complet', e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium text-slate-900 text-base"
                style={{ color: '#1e293b' }}
              />
            ) : (
              <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-base">
                {profil.nom_complet || '—'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Email (non modifiable)
            </label>
            <div className="px-5 py-4 bg-slate-100 border-2 border-slate-200 rounded-xl font-medium text-slate-700 flex items-center gap-2 text-base">
              <span>🔒</span>
              {profil.email}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                📞 Téléphone
              </label>
              {modeEdition ? (
                <input
                  type="tel"
                  value={profil.telephone}
                  onChange={(e) =>
                    modifierChamp('telephone', formaterTelephone(e.target.value))
                  }
                  placeholder="+253 77 41 14 82"
                  className="w-full px-4 py-3.5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium text-slate-900 text-base"
                  style={{ color: '#1e293b' }}
                />
              ) : (
                <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-base">
                  {profil.telephone || '—'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                💬 WhatsApp
              </label>
              {modeEdition ? (
                <input
                  type="tel"
                  value={profil.whatsapp}
                  onChange={(e) =>
                    modifierChamp('whatsapp', formaterTelephone(e.target.value))
                  }
                  placeholder="+253 77 41 14 82"
                  className="w-full px-4 py-3.5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium text-slate-900 text-base"
                  style={{ color: '#1e293b' }}
                />
              ) : (
                <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-base">
                  {profil.whatsapp || '—'}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              📍 Quartier
            </label>
            {modeEdition ? (
              <input
                type="text"
                value={profil.quartier}
                onChange={(e) => modifierChamp('quartier', e.target.value)}
                placeholder="Ex : Héron, Balbala..."
                className="w-full px-4 py-3.5 bg-white border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none font-medium text-slate-900 text-base"
                style={{ color: '#1e293b' }}
              />
            ) : (
              <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-base">
                {profil.quartier || '—'}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION ENSEIGNEMENT */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">
            🎯
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Enseignement</h2>
            <p className="text-xs text-slate-500">Vos préférences</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              🎯 Années d'expérience
            </label>
            {modeEdition ? (
              <input
                type="number"
                value={profil.experience_annees}
                onChange={(e) =>
                  modifierChamp('experience_annees', Number(e.target.value))
                }
                min="0"
                max="50"
                className="w-full px-4 py-3.5 bg-white border-2 border-emerald-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-bold text-slate-900 text-base"
                style={{ color: '#1e293b' }}
              />
            ) : (
              <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-base">
                {profil.experience_annees} an
                {profil.experience_annees > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              🏠 Zone d'enseignement
            </label>
            {modeEdition ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { val: 'chez_moi', label: '🏠 Chez moi' },
                  { val: 'chez_eleve', label: "🚶 Chez l'élève" },
                  { val: 'les_deux', label: '🔄 Les deux' },
                ].map((z) => {
                  const actif = profil.zone_enseignement === z.val
                  return (
                    <button
                      key={z.val}
                      type="button"
                      onClick={() => modifierChamp('zone_enseignement', z.val)}
                      className={`p-4 rounded-xl font-bold text-sm border-2 transition-all ${
                        actif
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {z.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-base">
                {profil.zone_enseignement === 'chez_moi'
                  ? '🏠 Chez moi'
                  : profil.zone_enseignement === 'chez_eleve'
                  ? "🚶 Chez l'élève"
                  : profil.zone_enseignement === 'les_deux'
                  ? '🔄 Les deux'
                  : '—'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              👥 Nombre max d'élèves simultanés
            </label>
            {modeEdition ? (
              <input
                type="number"
                value={profil.max_eleves || ''}
                onChange={(e) =>
                  modifierChamp(
                    'max_eleves',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                min="1"
                max="20"
                placeholder="Ex : 3"
                className="w-full px-4 py-3.5 bg-white border-2 border-emerald-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-bold text-slate-900 text-base"
                style={{ color: '#1e293b' }}
              />
            ) : (
              <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-base">
                {profil.max_eleves || '—'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ✏️ Autres matières (optionnel)
            </label>
            {modeEdition ? (
              <textarea
                value={profil.autres_matieres || ''}
                onChange={(e) => modifierChamp('autres_matieres', e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Ex : Informatique, Soutien scolaire..."
                className="w-full px-4 py-3 bg-white border-2 border-emerald-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none resize-none font-medium text-slate-900 text-base"
                style={{ color: '#1e293b' }}
              />
            ) : (
              <div className="px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-slate-900 text-base">
                {profil.autres_matieres || '—'}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* BARRE STICKY SAUVEGARDE */}
      {/* ============================================================ */}

      <AnimatePresence>
        {modeEdition && modifications && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-emerald-500 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-bold text-slate-800 text-sm">
                  Modifications non enregistrées
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={annulerModifications}
                  disabled={sauvegarde}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrer}
                  disabled={sauvegarde}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {sauvegarde ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Sauvegarde...
                    </>
                  ) : (
                    <>💾 Enregistrer</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}