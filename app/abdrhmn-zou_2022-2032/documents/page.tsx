'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfComplet = {
  id: string
  nom_complet: string
  email: string
  telephone: string
  quartier: string | null
  photo_url: string | null
  approuve: boolean
  banni: boolean
  created_at: string

  // Professeurs
  type_professeur: string | null
  specialite: string | null
  experience_annees: number
  note_moyenne: number
  nombre_avis: number
  etoiles: number
  est_etudiant: boolean
  a_bac_s: boolean

  // Documents
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

  // Vérification
  verifie_physique: boolean
  date_verification_physique: string | null
  note_verification_admin: string | null
}

type FiltreType =
  | 'tous'
  | 'etudiant'
  | 'diplome'
  | 'bac_s'
  | 'enseignant'
  | 'freelance'
  | 'formateur'
  | 'coran'
  | 'sans_type'

type FiltreStatut =
  | 'tous'
  | 'a_verifier'
  | 'physique_attente'
  | 'verifies'
  | 'approuves'
  | 'incomplets'

// ============================================================
// CONFIG TYPES
// ============================================================

const typesConfig: {
  [k: string]: {
    label: string
    emoji: string
    couleur: string
    physiqueRequise: boolean
    documentsRequis: string[]
  }
} = {
  etudiant: {
    label: 'Étudiant',
    emoji: '🎓',
    couleur: 'from-blue-500 to-indigo-600',
    physiqueRequise: false,
    documentsRequis: ['carte_etudiante_url', 'carte_identite_url', 'photo_profil_url'],
  },
  diplome: {
    label: 'Diplômé',
    emoji: '📜',
    couleur: 'from-emerald-500 to-teal-600',
    physiqueRequise: false,
    documentsRequis: ['diplome_url', 'attestation_url', 'carte_identite_url', 'photo_profil_url'],
  },
  bac_s: {
    label: 'Bac S',
    emoji: '🎓',
    couleur: 'from-amber-500 to-orange-600',
    physiqueRequise: false,
    documentsRequis: ['bac_s_scan_url', 'carte_identite_url', 'photo_profil_url'],
  },
  enseignant: {
    label: 'Enseignant',
    emoji: '👨‍🏫',
    couleur: 'from-purple-500 to-pink-600',
    physiqueRequise: true,
    documentsRequis: [
      'attestation_employeur_url',
      'carte_professionnelle_url',
      'carte_identite_url',
      'photo_profil_url',
    ],
  },
  freelance: {
    label: 'Freelance',
    emoji: '💼',
    couleur: 'from-cyan-500 to-blue-600',
    physiqueRequise: true,
    documentsRequis: ['cv_url', 'attestation_url', 'carte_identite_url', 'photo_profil_url'],
  },
  formateur: {
    label: 'Formateur',
    emoji: '🏢',
    couleur: 'from-rose-500 to-pink-600',
    physiqueRequise: true,
    documentsRequis: ['portfolio_url', 'cv_url', 'carte_identite_url', 'photo_profil_url'],
  },
  coran: {
    label: 'Coran',
    emoji: '📖',
    couleur: 'from-green-500 to-emerald-600',
    physiqueRequise: true,
    documentsRequis: ['carte_identite_url', 'photo_profil_url'],
  },
}

const labelsDocuments: { [k: string]: { label: string; emoji: string } } = {
  bac_s_scan_url: { label: 'Bac S', emoji: '🎓' },
  carte_identite_url: { label: 'Carte identité', emoji: '🆔' },
  carte_etudiante_url: { label: 'Carte étudiante', emoji: '🎓' },
  photo_profil_url: { label: 'Photo profil', emoji: '📸' },
  diplome_url: { label: 'Diplôme', emoji: '📜' },
  attestation_url: { label: 'Attestation', emoji: '📋' },
  cv_url: { label: 'CV', emoji: '📄' },
  portfolio_url: { label: 'Portfolio', emoji: '🏆' },
  attestation_employeur_url: { label: 'Attestation employeur', emoji: '🏢' },
  carte_professionnelle_url: { label: 'Carte pro', emoji: '💼' },
  attestation_religieuse_url: { label: 'Attestation religieuse', emoji: '📖' },
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function AdminDocuments() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [profs, setProfs] = useState<ProfComplet[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')

  const [filtreType, setFiltreType] = useState<FiltreType>('tous')
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous')
  const [recherche, setRecherche] = useState('')

  const [docZoom, setDocZoom] = useState<{
    url: string
    label: string
    emoji: string
    prof: ProfComplet
  } | null>(null)

  const [modalVerif, setModalVerif] = useState<ProfComplet | null>(null)
  const [noteVerif, setNoteVerif] = useState('')
  const [action, setAction] = useState(false)

  const [detail, setDetail] = useState<ProfComplet | null>(null)
  const [exportEnCours, setExportEnCours] = useState(false)

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
        .from('profiles')
        .select(
          `
          id, nom_complet, email, telephone, quartier, photo_url,
          approuve, banni, created_at,
          professeurs:professeurs!inner (
            type_professeur, specialite, experience_annees, note_moyenne, nombre_avis,
            etoiles, est_etudiant, a_bac_s,
            bac_s_scan_url, carte_identite_url, carte_etudiante_url, photo_profil_url,
            diplome_url, attestation_url, cv_url, portfolio_url,
            attestation_employeur_url, carte_professionnelle_url, attestation_religieuse_url,
            verifie_physique, date_verification_physique, note_verification_admin
          )
        `
        )
        .eq('role', 'professeur')
        .eq('banni', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: ProfComplet[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.professeurs) ? p.professeurs[0] : p.professeurs

        complets.push({
          id: p.id,
          nom_complet: p.nom_complet || 'Sans nom',
          email: p.email || '—',
          telephone: p.telephone || '—',
          quartier: p.quartier,
          photo_url: info?.photo_profil_url || p.photo_url || null,
          approuve: p.approuve === true,
          banni: p.banni === true,
          created_at: p.created_at,

          type_professeur: info?.type_professeur || null,
          specialite: info?.specialite || null,
          experience_annees: info?.experience_annees || 0,
          note_moyenne: Number(info?.note_moyenne) || 0,
          nombre_avis: info?.nombre_avis || 0,
          etoiles: info?.etoiles || 0,
          est_etudiant: info?.est_etudiant === true,
          a_bac_s: info?.a_bac_s === true,

          bac_s_scan_url: info?.bac_s_scan_url || null,
          carte_identite_url: info?.carte_identite_url || null,
          carte_etudiante_url: info?.carte_etudiante_url || null,
          photo_profil_url: info?.photo_profil_url || null,
          diplome_url: info?.diplome_url || null,
          attestation_url: info?.attestation_url || null,
          cv_url: info?.cv_url || null,
          portfolio_url: info?.portfolio_url || null,
          attestation_employeur_url: info?.attestation_employeur_url || null,
          carte_professionnelle_url: info?.carte_professionnelle_url || null,
          attestation_religieuse_url: info?.attestation_religieuse_url || null,

          verifie_physique: info?.verifie_physique === true,
          date_verification_physique: info?.date_verification_physique || null,
          note_verification_admin: info?.note_verification_admin || null,
        })
      }

      setProfs(complets)
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
  // HELPERS
  // ============================================================

  const getDocUrl = (prof: ProfComplet, champ: string): string | null => {
    return (prof as any)[champ] || null
  }

  const getDocsRequis = (type: string | null): string[] => {
    if (!type) return []
    return typesConfig[type]?.documentsRequis || []
  }

  const getDocsFournis = (prof: ProfComplet): number => {
    if (!prof.type_professeur) return 0
    const requis = getDocsRequis(prof.type_professeur)
    return requis.filter((champ) => getDocUrl(prof, champ) !== null).length
  }

  const getDocsManquants = (prof: ProfComplet): number => {
    if (!prof.type_professeur) return 0
    const requis = getDocsRequis(prof.type_professeur)
    return requis.length - getDocsFournis(prof)
  }

  const estComplet = (prof: ProfComplet): boolean => {
    return getDocsManquants(prof) === 0
  }

  const physiqueRequise = (prof: ProfComplet): boolean => {
    if (!prof.type_professeur) return false
    return typesConfig[prof.type_professeur]?.physiqueRequise || false
  }

  const getStatut = (
    prof: ProfComplet
  ): {
    label: string
    emoji: string
    couleur: string
    priorite: number
  } => {
    if (!prof.type_professeur) {
      return {
        label: 'Type non choisi',
        emoji: '❓',
        couleur: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        priorite: 5,
      }
    }

    if (prof.approuve && physiqueRequise(prof) && !prof.verifie_physique) {
      return {
        label: 'Vérif. physique en attente',
        emoji: '🚶',
        couleur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        priorite: 2,
      }
    }

    if (prof.approuve) {
      return {
        label: 'Approuvé',
        emoji: '✅',
        couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        priorite: 4,
      }
    }

    if (!estComplet(prof)) {
      return {
        label: 'Documents incomplets',
        emoji: '📎',
        couleur: 'bg-red-500/20 text-red-300 border-red-500/30',
        priorite: 1,
      }
    }

    return {
      label: 'À vérifier',
      emoji: '⏳',
      couleur: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      priorite: 2,
    }
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  const marquerPhysique = async () => {
    if (!modalVerif) return

    setAction(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('professeurs')
        .update({
          verifie_physique: true,
          date_verification_physique: new Date().toISOString(),
          note_verification_admin: noteVerif.trim() || null,
          verifie_par_admin_id: user.id,
        })
        .eq('id', modalVerif.id)

      if (error) throw error

      // Notifier le prof
      await supabase.from('notifications').insert({
        destinataire_id: modalVerif.id,
        titre: '✅ Vérification physique validée',
        contenu: `Votre vérification physique a été validée par notre équipe.${noteVerif ? ` Note : ${noteVerif}` : ''}`,
        lu: false,
      })

      await supabase.from('admin_logs').insert({
        action: 'verifier_physique',
        details: `${modalVerif.nom_complet} - ${noteVerif || 'Validée'}`,
      })

      setSucces(`✅ Vérification physique validée pour ${modalVerif.nom_complet}`)
      setTimeout(() => setSucces(''), 4000)
      setModalVerif(null)
      setNoteVerif('')
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const annulerVerifPhysique = async (prof: ProfComplet) => {
    if (!confirm(`⚠️ Annuler la vérification physique de ${prof.nom_complet} ?`)) return

    setAction(true)
    try {
      const { error } = await supabase
        .from('professeurs')
        .update({
          verifie_physique: false,
          date_verification_physique: null,
          note_verification_admin: null,
          verifie_par_admin_id: null,
        })
        .eq('id', prof.id)

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'annuler_verification_physique',
        details: prof.nom_complet,
      })

      setSucces(`⚠️ Vérification annulée pour ${prof.nom_complet}`)
      setTimeout(() => setSucces(''), 4000)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const approuver = async (prof: ProfComplet) => {
    if (!estComplet(prof)) {
      alert('⚠️ Ce prof n\'a pas fourni tous les documents obligatoires.')
      return
    }
    if (physiqueRequise(prof) && !prof.verifie_physique) {
      alert('⚠️ La vérification physique est obligatoire pour ce type de professeur.')
      return
    }

    if (!confirm(`✅ Approuver le profil de ${prof.nom_complet} ?`)) return

    setAction(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approuve: true })
        .eq('id', prof.id)

      if (error) throw error

      await supabase.from('notifications').insert({
        destinataire_id: prof.id,
        titre: '🎉 Profil approuvé !',
        contenu: 'Félicitations ! Votre profil est maintenant vérifié et visible par les parents.',
        lu: false,
      })

      await supabase.from('admin_logs').insert({
        action: 'approuver_prof',
        details: prof.nom_complet,
      })

      setSucces(`✅ ${prof.nom_complet} approuvé !`)
      setTimeout(() => setSucces(''), 4000)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const refuser = async (prof: ProfComplet) => {
    const motif = prompt(`❌ Motif du refus pour ${prof.nom_complet} :`)
    if (!motif) return

    setAction(true)
    try {
      await supabase
        .from('profiles')
        .update({
          approuve: false,
          motif_bannissement: `REFUS VÉRIFICATION : ${motif}`,
        })
        .eq('id', prof.id)

      await supabase.from('notifications').insert({
        destinataire_id: prof.id,
        titre: '❌ Dossier refusé',
        contenu: `Votre dossier n'a pas été accepté. Motif : ${motif}`,
        lu: false,
      })

      await supabase.from('admin_logs').insert({
        action: 'refuser_prof',
        details: `${prof.nom_complet} - ${motif}`,
      })

      setSucces(`❌ ${prof.nom_complet} refusé`)
      setTimeout(() => setSucces(''), 4000)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  // ============================================================
  // FILTRES
  // ============================================================

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      // Filtre type
      if (filtreType === 'sans_type' && p.type_professeur !== null) return false
      if (filtreType !== 'tous' && filtreType !== 'sans_type' && p.type_professeur !== filtreType) {
        return false
      }

      // Filtre statut
      if (filtreStatut === 'a_verifier') {
        if (p.approuve || !estComplet(p)) return false
      }
      if (filtreStatut === 'physique_attente') {
        if (!physiqueRequise(p) || p.verifie_physique) return false
      }
      if (filtreStatut === 'verifies') {
        if (!p.verifie_physique) return false
      }
      if (filtreStatut === 'approuves') {
        if (!p.approuve) return false
      }
      if (filtreStatut === 'incomplets') {
        if (estComplet(p)) return false
      }

      // Recherche
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.email.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r) ||
          p.telephone.includes(r)
        )
      }

      return true
    })

    // Tri : priorité par statut
    resultat.sort((a, b) => {
      const pa = getStatut(a).priorite
      const pb = getStatut(b).priorite
      if (pa !== pb) return pa - pb

      // Puis par docs manquants
      const ma = getDocsManquants(a)
      const mb = getDocsManquants(b)
      if (ma !== mb) return mb - ma

      // Puis par date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return resultat
  }, [profs, filtreType, filtreStatut, recherche])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useMemo(() => {
    return {
      tous: profs.length,
      etudiant: profs.filter((p) => p.type_professeur === 'etudiant').length,
      diplome: profs.filter((p) => p.type_professeur === 'diplome').length,
      bac_s: profs.filter((p) => p.type_professeur === 'bac_s').length,
      enseignant: profs.filter((p) => p.type_professeur === 'enseignant').length,
      freelance: profs.filter((p) => p.type_professeur === 'freelance').length,
      formateur: profs.filter((p) => p.type_professeur === 'formateur').length,
      coran: profs.filter((p) => p.type_professeur === 'coran').length,
      sans_type: profs.filter((p) => p.type_professeur === null).length,
      a_verifier: profs.filter((p) => !p.approuve && estComplet(p)).length,
      physique_attente: profs.filter((p) => physiqueRequise(p) && !p.verifie_physique).length,
      verifies: profs.filter((p) => p.verifie_physique).length,
      approuves: profs.filter((p) => p.approuve).length,
      incomplets: profs.filter((p) => !estComplet(p)).length,
    }
  }, [profs])

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (profsFiltres.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = [
        'Nom', 'Email', 'Téléphone', 'Quartier', 'Type',
        'Docs fournis', 'Docs requis', 'Docs manquants',
        'Vérif physique', 'Approuvé', 'Inscrit le',
      ]

      const rows = profsFiltres.map((p) => [
        p.nom_complet,
        p.email,
        p.telephone,
        p.quartier || '',
        p.type_professeur ? typesConfig[p.type_professeur]?.label || p.type_professeur : 'Non choisi',
        getDocsFournis(p),
        p.type_professeur ? getDocsRequis(p.type_professeur).length : 0,
        getDocsManquants(p),
        p.verifie_physique ? 'Oui' : 'Non',
        p.approuve ? 'Oui' : 'Non',
        new Date(p.created_at).toLocaleDateString('fr-FR'),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `documents-profs-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export documents : ${profsFiltres.length} profs`,
      })

      setSucces(`✅ ${profsFiltres.length} profs exportés`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [profsFiltres, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const getTypeConfig = (type: string | null) => {
    if (!type) return null
    return typesConfig[type] || null
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
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <p className="text-slate-400 text-sm">Chargement des documents...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR
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

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="space-y-6 pb-10">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">📎 Vérification des professeurs</h1>
                {compte.a_verifier > 0 && (
                  <span className="flex items-center gap-1 bg-red-500/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black border border-red-300/50 animate-pulse">
                    🔥 {compte.a_verifier} à traiter
                  </span>
                )}
              </div>
              <p className="text-purple-100 text-sm">
                {profs.length} prof{profs.length > 1 ? 's' : ''} · Documents + Vérification physique
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
                disabled={exportEnCours || profsFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-purple-200">Total</div>
              <div className="text-2xl font-black">{profs.length}</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-300/40">
              <div className="text-[10px] font-black uppercase text-red-100">Incomplets</div>
              <div className="text-2xl font-black">{compte.incomplets}</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 border border-blue-300/40">
              <div className="text-[10px] font-black uppercase text-blue-100">À vérifier</div>
              <div className="text-2xl font-black">{compte.a_verifier}</div>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-3 border border-amber-300/40">
              <div className="text-[10px] font-black uppercase text-amber-100">Vérif. physique</div>
              <div className="text-2xl font-black">{compte.physique_attente}</div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-300/40">
              <div className="text-[10px] font-black uppercase text-emerald-100">Approuvés</div>
              <div className="text-2xl font-black">{compte.approuves}</div>
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
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-xl">✅</span>
            <p className="text-emerald-200 text-sm font-bold">{succes}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* FILTRES PAR TYPE */}
      {/* ============================================================ */}

      <div>
        <div className="text-[10px] text-slate-400 font-black uppercase mb-2 ml-1">
          Filtrer par type
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltreType('tous')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtreType === 'tous'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            👥 Tous ({compte.tous})
          </button>

          {Object.entries(typesConfig).map(([key, config]) => {
            const count = compte[key as keyof typeof compte] || 0
            return (
              <button
                key={key}
                onClick={() => setFiltreType(key as FiltreType)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  filtreType === key
                    ? `bg-gradient-to-r ${config.couleur} text-white shadow-lg`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
                }`}
              >
                {config.emoji} {config.label} ({count})
              </button>
            )
          })}

          {compte.sans_type > 0 && (
            <button
              onClick={() => setFiltreType('sans_type')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                filtreType === 'sans_type'
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              ❓ Sans type ({compte.sans_type})
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTRES PAR STATUT */}
      {/* ============================================================ */}

      <div>
        <div className="text-[10px] text-slate-400 font-black uppercase mb-2 ml-1">
          Filtrer par statut
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { val: 'tous', label: '📋 Tous', count: compte.tous },
            { val: 'incomplets', label: '📎 Incomplets', count: compte.incomplets },
            { val: 'a_verifier', label: '⏳ À vérifier', count: compte.a_verifier },
            {
              val: 'physique_attente',
              label: '🚶 Vérif. physique',
              count: compte.physique_attente,
            },
            { val: 'approuves', label: '✅ Approuvés', count: compte.approuves },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFiltreStatut(f.val as FiltreStatut)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                filtreStatut === f.val
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RECHERCHE */}
      {/* ============================================================ */}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, email, téléphone ou quartier..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
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

      {/* Compteur */}
      <div className="text-sm text-slate-400">
        <span className="font-bold text-white">{profsFiltres.length}</span> résultat
        {profsFiltres.length > 1 ? 's' : ''}
      </div>

      {/* ============================================================ */}
      {/* LISTE */}
      {/* ============================================================ */}

      {profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun prof</h3>
          <p className="text-slate-400 text-sm">
            {profs.length === 0
              ? 'Aucun professeur inscrit.'
              : 'Aucun prof ne correspond à ces critères.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {profsFiltres.map((p, i) => {
            const statut = getStatut(p)
            const config = getTypeConfig(p.type_professeur)
            const docsFournis = getDocsFournis(p)
            const docsRequis = p.type_professeur ? getDocsRequis(p.type_professeur).length : 0
            const docsManquants = getDocsManquants(p)
            const complet = estComplet(p)
            const physique = physiqueRequise(p)
            const pourcentage = docsRequis > 0 ? Math.round((docsFournis / docsRequis) * 100) : 0

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  statut.priorite === 1
                    ? 'bg-red-500/5 border-red-500/30'
                    : statut.priorite === 2
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : p.approuve
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-800/70 border-white/10'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Avatar */}
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.nom_complet}
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0 ${
                        config
                          ? `bg-gradient-to-br ${config.couleur}`
                          : 'bg-gradient-to-br from-slate-500 to-slate-700'
                      }`}
                    >
                      {config?.emoji || '👨‍🏫'}
                    </div>
                  )}

                  {/* Infos */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <div className="font-black text-white text-base">{p.nom_complet}</div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statut.couleur}`}
                      >
                        {statut.emoji} {statut.label.toUpperCase()}
                      </span>
                      {config && (
                        <span
                          className={`text-[10px] bg-gradient-to-r ${config.couleur} text-white px-2 py-0.5 rounded-full font-black`}
                        >
                          {config.emoji} {config.label}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                      <div>📧 {p.email}</div>
                      <div>📞 {p.telephone}</div>
                      {p.quartier && <div>📍 {p.quartier}</div>}
                      <div>📅 Inscrit le {formaterDate(p.created_at)}</div>
                    </div>

                    {/* Barre de progression */}
                    {p.type_professeur && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex items-center justify-between text-[10px] font-black mb-1 flex-wrap">
                          <span className="text-slate-400">Documents fournis</span>
                          <span className={complet ? 'text-emerald-300' : 'text-red-300'}>
                            {docsFournis}/{docsRequis} — {pourcentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pourcentage}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${
                              complet
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                : 'bg-gradient-to-r from-red-500 to-orange-600'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statut physique + docs */}
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {physique && (
                      <div
                        className={`rounded-xl p-3 border-2 ${
                          p.verifie_physique
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">
                          🚶 Vérification physique
                        </div>
                        <div
                          className={`text-xs font-black ${
                            p.verifie_physique ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {p.verifie_physique ? '✓ Validée' : '⏳ En attente'}
                        </div>
                      </div>
                    )}

                    {docsManquants > 0 && (
                      <div className="bg-red-500/10 rounded-xl p-3 border-2 border-red-500/30">
                        <div className="text-[9px] font-black uppercase text-red-300 mb-1">
                          📎 Manquants
                        </div>
                        <div className="text-xs font-black text-red-300">
                          {docsManquants} document{docsManquants > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(p)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      👁️ Détails
                    </button>

                    {physique && !p.verifie_physique && (
                      <button
                        onClick={() => {
                          setModalVerif(p)
                          setNoteVerif('')
                        }}
                        disabled={action}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        {action ? '⏳...' : '🚶 Marquer vu'}
                      </button>
                    )}

                    {complet && !p.approuve && (!physique || p.verifie_physique) && (
                      <button
                        onClick={() => approuver(p)}
                        disabled={action}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        {action ? '⏳...' : '✅ Approuver'}
                      </button>
                    )}

                    {p.approuve && (
                      <div className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl font-bold text-xs border border-emerald-500/30 text-center">
                        ✓ Approuvé
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DÉTAIL */}
      {/* ============================================================ */}

      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl border border-white/10 my-8"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    {detail.photo_url ? (
                      <img
                        src={detail.photo_url}
                        alt={detail.nom_complet}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                        👨‍🏫
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-black text-white">{detail.nom_complet}</h2>
                      <p className="text-xs text-purple-200">{detail.email}</p>
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

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Type + statut */}
                <div className="flex flex-wrap gap-2">
                  {detail.type_professeur && typesConfig[detail.type_professeur] && (
                    <span
                      className={`text-xs bg-gradient-to-r ${typesConfig[detail.type_professeur].couleur} text-white px-3 py-1.5 rounded-full font-black`}
                    >
                      {typesConfig[detail.type_professeur].emoji}{' '}
                      {typesConfig[detail.type_professeur].label}
                    </span>
                  )}
                  <span className={`text-xs px-3 py-1.5 rounded-full font-black border ${getStatut(detail).couleur}`}>
                    {getStatut(detail).emoji} {getStatut(detail).label}
                  </span>
                  {detail.verifie_physique && (
                    <span className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-full font-black">
                      ✓ Vérifié physiquement
                    </span>
                  )}
                </div>

                {/* Infos */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">📋 Informations</div>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <strong className="text-white">Email :</strong> {detail.email}
                    </div>
                    <div>
                      <strong className="text-white">Téléphone :</strong> {detail.telephone}
                    </div>
                    <div>
                      <strong className="text-white">Quartier :</strong>{' '}
                      {detail.quartier || '—'}
                    </div>
                    <div>
                      <strong className="text-white">Expérience :</strong>{' '}
                      {detail.experience_annees} an
                      {detail.experience_annees > 1 ? 's' : ''}
                    </div>
                    <div>
                      <strong className="text-white">Note :</strong>{' '}
                      {detail.note_moyenne > 0 ? detail.note_moyenne.toFixed(1) : '—'}/
                      5
                    </div>
                    <div>
                      <strong className="text-white">Avis :</strong> {detail.nombre_avis}
                    </div>
                    {detail.specialite && (
                      <div className="md:col-span-2">
                        <strong className="text-white">Spécialité :</strong>{' '}
                        {detail.specialite}
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">
                    📎 Documents ({detail.type_professeur
                      ? getDocsFournis(detail)
                      : 0}/{detail.type_professeur
                      ? getDocsRequis(detail.type_professeur).length
                      : 0})
                  </div>

                  {detail.type_professeur ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getDocsRequis(detail.type_professeur).map((champ) => {
                        const url = getDocUrl(detail, champ)
                        const label = labelsDocuments[champ] || { label: champ, emoji: '📄' }
                        return (
                          <div
                            key={champ}
                            className={`rounded-xl p-3 border-2 transition-all ${
                              url
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{label.emoji}</span>
                              <span className="text-xs font-bold text-white">
                                {label.label}
                              </span>
                            </div>
                            {url ? (
                              <button
                                onClick={() =>
                                  setDocZoom({
                                    url,
                                    label: label.label,
                                    emoji: label.emoji,
                                    prof: detail,
                                  })
                                }
                                className="w-full py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                              >
                                👁️ Voir
                              </button>
                            ) : (
                              <div className="text-[10px] text-red-300 italic text-center py-2">
                                ❌ Non fourni
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic text-center py-4">
                      ⚠️ Ce prof n'a pas encore choisi son type
                    </div>
                  )}
                </div>

                {/* Note admin */}
                {detail.note_verification_admin && (
                  <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
                    <div className="text-xs font-black text-amber-300 mb-2">
                      📝 Note de vérification
                    </div>
                    <p className="text-sm text-amber-100">{detail.note_verification_admin}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3 flex-wrap">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => refuser(detail)}
                  disabled={action}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  ❌ Refuser
                </button>
                {detail.type_professeur &&
                  physiqueRequise(detail) &&
                  !detail.verifie_physique && (
                    <button
                      onClick={() => {
                        setModalVerif(detail)
                        setNoteVerif('')
                        setDetail(null)
                      }}
                      disabled={action}
                      className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg disabled:opacity-50"
                    >
                      🚶 Marquer vu physiquement
                    </button>
                  )}
                {estComplet(detail) &&
                  !detail.approuve &&
                  (!physiqueRequise(detail) || detail.verifie_physique) && (
                    <button
                      onClick={() => approuver(detail)}
                      disabled={action}
                      className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-50"
                    >
                      ✅ Approuver
                    </button>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL ZOOM DOCUMENT */}
      {/* ============================================================ */}

      <AnimatePresence>
        {docZoom && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            onClick={() => setDocZoom(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{docZoom.emoji}</span>
                  <div>
                    <h2 className="text-base font-black text-white">{docZoom.label}</h2>
                    <p className="text-xs text-purple-100">{docZoom.prof.nom_complet}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={docZoom.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold text-xs"
                  >
                    🔗 Ouvrir
                  </a>
                  <button
                    onClick={() => setDocZoom(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div
                className="p-6 flex items-center justify-center bg-slate-900"
                style={{ minHeight: '400px', maxHeight: '75vh' }}
              >
                <img
                  src={docZoom.url}
                  alt={docZoom.label}
                  className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `
                      <div class="text-center">
                        <div class="text-6xl mb-4">📄</div>
                        <p class="text-slate-400 text-sm">Impossible d'afficher l'aperçu</p>
                        <a href="${docZoom.url}" target="_blank" class="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm">
                          Ouvrir le document
                        </a>
                      </div>
                    `
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL VÉRIFICATION PHYSIQUE */}
      {/* ============================================================ */}

      <AnimatePresence>
        {modalVerif && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setModalVerif(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      🚶 Vérification physique
                    </h2>
                    <p className="text-xs text-amber-100 mt-1">
                      {modalVerif.nom_complet} — {modalVerif.type_professeur ? typesConfig[modalVerif.type_professeur]?.label : 'Type non choisi'}
                    </p>
                  </div>
                  <button
                    onClick={() => setModalVerif(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-xl">
                  <p className="text-xs text-amber-200">
                    ⚠️ Confirmez que vous avez <strong>physiquement rencontré</strong> ce
                    professeur ou <strong>visité son établissement</strong>. Il recevra une
                    notification automatique.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    📝 Note (optionnel)
                  </label>
                  <textarea
                    value={noteVerif}
                    onChange={(e) => setNoteVerif(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Ex : Rencontre au bureau, documents vérifiés en présentiel, récitation testée..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-amber-500/30 rounded-xl text-white outline-none focus:border-amber-500 resize-none text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">{noteVerif.length}/500</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalVerif(null)}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={marquerPhysique}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {action ? '⏳...' : '✓ Confirmer vérification'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}