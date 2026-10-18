'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Enfant = {
  id: string
  prenom: string
  niveaux: string[]
  classes: string[]
  languesComprises: string[]
  languesSpeciales: string[]
  precisionsLangues: string[]
}

type Eleve = {
  id: string
  demande_id: string
  parent_id: string
  parent_nom: string
  parent_quartier: string | null
  parent_whatsapp: string | null
  matiere: string | null
  nombre_enfants: number
  prix_souhaite: number | null
  niveaux_souhaites: string[]
  mois_avec_client: number
  created_at: string
  enfants: Enfant[]
  suiviActuel: {
    id: string
    mois: string
    note: number | null
    appreciation: string | null
    points_forts: string | null
    points_ameliorer: string | null
    enfant_id: string | null
    enfant_prenom: string | null
  } | null
  historique: {
    id: string
    mois: string
    note: number | null
    enfant_prenom: string | null
    created_at: string
  }[]
}

type Filtre = 'tous' | 'suivi_a_faire' | 'suivi_ok' | 'long_terme' | 'recent'
type Tri = 'recent' | 'ancien' | 'mois_eleve' | 'mois_bas' | 'note_haute' | 'note_basse'

// ============================================================
// LABELS
// ============================================================

const labelsNiveaux: { [k: string]: string } = {
  primaire: '🎒 Primaire',
  college: '📖 Collège',
  lycee: '🎓 Lycée',
  langue_speciale: '📕 Langue/Coran',
  coran_special: '📖 Coran',
  langue_special: '💬 Langue',
}

const labelsLangues: { [k: string]: string } = {
  francais: '🇫🇷 Français',
  arabe: '🇸🇦 Arabe',
  somali: '🇸🇴 Somali',
  afar: '🌍 Afar',
  anglais: '🇬🇧 Anglais',
}

const labelsPrecisions: { [k: string]: string } = {
  coran_lecture: '📖 Lecture',
  coran_tajwid: '🎵 Tajwid',
  coran_memorisation: '🧠 Mémorisation',
  arabe_debutant: '🅰️ Débutant',
  arabe_conversation: '💬 Conversation',
  arabe_grammaire: '📚 Grammaire',
  arabe_perfectionnement: '⭐ Perfectionnement',
  francais_debutant: '🅰️ Débutant',
  francais_conversation: '💬 Conversation',
  francais_grammaire: '📚 Grammaire',
  francais_perfectionnement: '⭐ Perfectionnement',
  anglais_debutant: '🅰️ Débutant',
  anglais_conversation: '💬 Conversation',
  anglais_grammaire: '📚 Grammaire',
  anglais_perfectionnement: '⭐ Perfectionnement',
}

// ============================================================
// HELPERS
// ============================================================

const getMoisActuel = (): string => {
  const d = new Date()
  const mois = d.toLocaleDateString('fr-FR', { month: 'long' })
  return `${mois.charAt(0).toUpperCase() + mois.slice(1)} ${d.getFullYear()}`
}

const getInfoNote = (note: number | null) => {
  if (note === null || note === 0)
    return { couleur: 'text-slate-400', bg: 'bg-slate-100', label: 'Non évalué', emoji: '⏳' }
  if (note >= 16)
    return { couleur: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent', emoji: '🌟' }
  if (note >= 12)
    return { couleur: 'text-blue-600', bg: 'bg-blue-50', label: 'Bien', emoji: '✅' }
  if (note >= 10)
    return { couleur: 'text-amber-600', bg: 'bg-amber-50', label: 'Moyen', emoji: '📊' }
  return { couleur: 'text-red-600', bg: 'bg-red-50', label: 'À améliorer', emoji: '⚠️' }
}

const genererConseils = (eleves: Eleve[]) => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []
  const moisActuel = getMoisActuel()
  const sansSuivi = eleves.filter(
    (e) => !e.suiviActuel || e.suiviActuel.mois !== moisActuel
  )
  if (sansSuivi.length > 0)
    conseils.push({
      emoji: '🚨',
      texte: `${sansSuivi.length} élève(s) n'ont pas encore leur suivi de ${moisActuel}.`,
      priorite: 'haute',
    })
  if (eleves.length === 0) {
    conseils.push({
      emoji: '📢',
      texte: 'Vous n\'avez pas encore d\'élèves. Complétez votre profil.',
      priorite: 'haute',
    })
    return conseils
  }
  const avecNote = eleves.filter((e) => e.suiviActuel?.note)
  if (avecNote.length > 0) {
    const moyenne =
      avecNote.reduce((acc, e) => acc + (e.suiviActuel?.note || 0), 0) / avecNote.length
    if (moyenne < 12)
      conseils.push({
        emoji: '📈',
        texte: 'Votre note moyenne est faible. Améliorez la qualité.',
        priorite: 'moyenne',
      })
  }
  const longTerme = eleves.filter((e) => e.mois_avec_client >= 6)
  if (longTerme.length > 0)
    conseils.push({
      emoji: '🎉',
      texte: `${longTerme.length} élève(s) vous font confiance depuis 6+ mois !`,
      priorite: 'basse',
    })
  const recents = eleves.filter((e) => e.mois_avec_client < 2)
  if (recents.length > 0)
    conseils.push({
      emoji: '🌱',
      texte: `${recents.length} élève(s) récents. Faites bonne impression !`,
      priorite: 'moyenne',
    })
  return conseils
    .sort((a, b) => {
      const ordre = { haute: 0, moyenne: 1, basse: 2 }
      return ordre[a.priorite] - ordre[b.priorite]
    })
    .slice(0, 4)
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function MesEleves() {
  const supabase = createClient()

  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [action, setAction] = useState(false)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [eleveSuivi, setEleveSuivi] = useState<Eleve | null>(null)

  const [enfantId, setEnfantId] = useState('')
  const [note, setNote] = useState('')
  const [appreciation, setAppreciation] = useState('')
  const [pointsForts, setPointsForts] = useState('')
  const [pointsAmeliorer, setPointsAmeliorer] = useState('')

  const [eleveHistorique, setEleveHistorique] = useState<Eleve | null>(null)

  const moisActuel = getMoisActuel()

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée.')
        setLoading(false)
        return
      }

      const { data: demandes, error: demandesError } = await supabase
        .from('demandes')
        .select('*')
        .eq('professeur_id', user.id)
        .eq('statut', 'acceptee')
        .order('created_at', { ascending: false })

      if (demandesError) {
        console.error('Erreur demandes:', JSON.stringify(demandesError, null, 2))
        setErreur('Impossible de charger. Réessayez.')
        setLoading(false)
        return
      }

      const elevesComplets: Eleve[] = []

      for (const d of demandes || []) {
        // Parent
        let parent: any = null
        try {
          const { data } = await supabase
            .from('profiles')
            .select('nom_complet, quartier, whatsapp')
            .eq('id', d.parent_id)
            .single()
          parent = data
        } catch (e) {
          console.error('Parent:', e)
        }

        // ✅ Enfants CONCERNÉS uniquement avec TOUTES les infos
        let enfantsDuParent: Enfant[] = []
        try {
          const enfantsIds: string[] = d.enfants_ids || []
          if (enfantsIds.length > 0) {
            const { data } = await supabase
              .from('enfants')
              .select('id, prenom, niveaux, classes, langues_comprises, langues_speciales, precisions_langues')
              .in('id', enfantsIds)
            enfantsDuParent = (data || []).map((e: any) => ({
              id: e.id,
              prenom: e.prenom || 'Enfant',
              niveaux: e.niveaux || [],
              classes: e.classes || [],
              languesComprises: e.langues_comprises || [],
              languesSpeciales: e.langues_speciales || [],
              precisionsLangues: e.precisions_langues || [],
            }))
          }
        } catch (e) {
          console.error('Enfants:', e)
        }

        // Suivi actuel
        let suiviActuel: any = null
        try {
          const { data } = await supabase
            .from('suivi_mensuel')
            .select('id, mois, note, appreciation, points_forts, points_ameliorer, enfant_id, enfant_prenom')
            .eq('demande_id', d.id)
            .eq('mois', moisActuel)
            .maybeSingle()
          suiviActuel = data
        } catch (e) {
          console.error('Suivi actuel:', e)
        }

        // Historique
        let historique: any[] = []
        try {
          const { data } = await supabase
            .from('suivi_mensuel')
            .select('id, mois, note, enfant_prenom, created_at')
            .eq('demande_id', d.id)
            .order('created_at', { ascending: false })
            .limit(12)
          historique = data || []
        } catch (e) {
          console.error('Historique:', e)
        }

        const dateDebut = new Date(d.created_at)
        const maintenant = new Date()
        const moisEcoules =
          (maintenant.getFullYear() - dateDebut.getFullYear()) * 12 +
          (maintenant.getMonth() - dateDebut.getMonth())

        elevesComplets.push({
          id: d.id,
          demande_id: d.id,
          parent_id: d.parent_id,
          parent_nom: parent?.nom_complet || 'Parent',
          parent_quartier: parent?.quartier || null,
          parent_whatsapp: parent?.whatsapp || null,
          matiere: d.matiere || null,
          nombre_enfants: enfantsDuParent.length,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          niveaux_souhaites: d.niveaux_souhaites || [],
          mois_avec_client: moisEcoules,
          created_at: d.created_at,
          enfants: enfantsDuParent,
          suiviActuel: suiviActuel || null,
          historique: historique || [],
        })
      }
      setEleves(elevesComplets)
    } catch (err: any) {
      console.error('Erreur charger:', err)
      setErreur('Impossible de charger. Réessayez.')
    } finally {
      setLoading(false)
    }
  }, [supabase, moisActuel])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const total = eleves.length
    const revenusMensuels = eleves.reduce((acc, e) => acc + (e.prix_souhaite || 0), 0)
    const avecNote = eleves.filter((e) => e.suiviActuel?.note)
    const moyenneNotes =
      avecNote.length > 0
        ? avecNote.reduce((acc, e) => acc + (e.suiviActuel?.note || 0), 0) / avecNote.length
        : 0
    const suiviFait = eleves.filter(
      (e) => e.suiviActuel && e.suiviActuel.mois === moisActuel
    ).length
    return {
      total,
      revenusMensuels,
      moyenneNotes,
      suiviFait,
      suiviAFaire: total - suiviFait,
    }
  }, [eleves, moisActuel])

  const conseils = useMemo(() => genererConseils(eleves), [eleves])

  // ============================================================
  // FILTRES
  // ============================================================

  const elevesFiltres = useMemo(() => {
    let r = eleves.filter((e) => {
      if (filtre === 'suivi_a_faire' && e.suiviActuel && e.suiviActuel.mois === moisActuel)
        return false
      if (filtre === 'suivi_ok' && (!e.suiviActuel || e.suiviActuel.mois !== moisActuel))
        return false
      if (filtre === 'long_terme' && e.mois_avec_client < 6) return false
      if (filtre === 'recent' && e.mois_avec_client >= 2) return false
      if (recherche.trim()) {
        const s = recherche.toLowerCase().trim()
        return (
          e.parent_nom.toLowerCase().includes(s) ||
          e.parent_quartier?.toLowerCase().includes(s) ||
          e.matiere?.toLowerCase().includes(s) ||
          e.enfants.some((enf) => enf.prenom.toLowerCase().includes(s))
        )
      }
      return true
    })
    if (tri === 'recent')
      r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien')
      r.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'mois_eleve') r.sort((a, b) => b.mois_avec_client - a.mois_avec_client)
    if (tri === 'mois_bas') r.sort((a, b) => a.mois_avec_client - b.mois_avec_client)
    if (tri === 'note_haute')
      r.sort((a, b) => (b.suiviActuel?.note || 0) - (a.suiviActuel?.note || 0))
    if (tri === 'note_basse')
      r.sort((a, b) => (a.suiviActuel?.note || 0) - (b.suiviActuel?.note || 0))
    return r
  }, [eleves, filtre, recherche, tri, moisActuel])

  const compte = useMemo(
    () => ({
      tous: eleves.length,
      suivi_a_faire: eleves.filter(
        (e) => !e.suiviActuel || e.suiviActuel.mois !== moisActuel
      ).length,
      suivi_ok: eleves.filter(
        (e) => e.suiviActuel && e.suiviActuel.mois === moisActuel
      ).length,
      long_terme: eleves.filter((e) => e.mois_avec_client >= 6).length,
      recent: eleves.filter((e) => e.mois_avec_client < 2).length,
    }),
    [eleves, moisActuel]
  )

  // ============================================================
  // ACTIONS
  // ============================================================

  const ouvrirSuivi = (eleve: Eleve) => {
    setEleveSuivi(eleve)
    if (eleve.suiviActuel && eleve.suiviActuel.mois === moisActuel) {
      setEnfantId(eleve.suiviActuel.enfant_id || '')
      setNote(eleve.suiviActuel.note?.toString() || '')
      setAppreciation(eleve.suiviActuel.appreciation || '')
      setPointsForts(eleve.suiviActuel.points_forts || '')
      setPointsAmeliorer(eleve.suiviActuel.points_ameliorer || '')
    } else {
      setEnfantId(eleve.enfants.length === 1 ? eleve.enfants[0].id : '')
      setNote('')
      setAppreciation('')
      setPointsForts('')
      setPointsAmeliorer('')
    }
    setErreur('')
  }

  const enregistrerSuivi = async () => {
    if (!eleveSuivi) return

    if (!enfantId) {
      setErreur('Veuillez sélectionner l\'enfant concerné')
      return
    }
    const noteNum = Number(note)
    if (!note || isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
      setErreur('Note entre 0 et 20')
      return
    }
    if (!appreciation.trim() || appreciation.trim().length < 20) {
      setErreur('Appréciation min 20 caractères')
      return
    }

    const enfantChoisi = eleveSuivi.enfants.find((e) => e.id === enfantId)
    const enfantPrenom = enfantChoisi?.prenom || 'Enfant'

    setAction(true)
    setErreur('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée')
        setAction(false)
        return
      }

      const existe =
        eleveSuivi.suiviActuel && eleveSuivi.suiviActuel.mois === moisActuel

      if (existe && eleveSuivi.suiviActuel) {
        const { error } = await supabase
          .from('suivi_mensuel')
          .update({
            enfant_id: enfantId,
            enfant_prenom: enfantPrenom,
            note: noteNum,
            appreciation: appreciation.trim(),
            points_forts: pointsForts.trim() || null,
            points_ameliorer: pointsAmeliorer.trim() || null,
          })
          .eq('id', eleveSuivi.suiviActuel.id)

        if (error) {
          console.error('Erreur update:', JSON.stringify(error, null, 2))
          setErreur(`Erreur: ${error.message || 'Refusé par Supabase'}`)
          setAction(false)
          return
        }
      } else {
        const { error } = await supabase.from('suivi_mensuel').insert({
          demande_id: eleveSuivi.demande_id,
          professeur_id: user.id,
          parent_id: eleveSuivi.parent_id,
          enfant_id: enfantId,
          enfant_prenom: enfantPrenom,
          mois: moisActuel,
          note: noteNum,
          appreciation: appreciation.trim(),
          points_forts: pointsForts.trim() || null,
          points_ameliorer: pointsAmeliorer.trim() || null,
        })

        if (error) {
          console.error('Erreur insert:', JSON.stringify(error, null, 2))
          setErreur(`Erreur: ${error.message || 'Refusé par Supabase'}`)
          setAction(false)
          return
        }
      }

      try {
        await supabase.from('notifications').insert({
          destinataire_id: eleveSuivi.parent_id,
          titre: `📊 Suivi de ${enfantPrenom} — ${moisActuel}`,
          contenu: `Le professeur a publié le suivi mensuel de ${enfantPrenom}. Note : ${noteNum}/20.`,
          lien: '/espace-parent/mes-profs',
          lu: false,
        })
      } catch (e) {
        console.error('Notif:', e)
      }

      setSucces(`✅ Suivi de ${enfantPrenom} pour ${moisActuel} enregistré !`)
      setTimeout(() => setSucces(''), 4000)
      setEleveSuivi(null)
      await charger()
    } catch (err: any) {
      console.error('Erreur globale:', err)
      setErreur('Erreur. Réessayez.')
    } finally {
      setAction(false)
    }
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterPrix = (n: number) => n.toLocaleString('fr-FR')
  const formaterDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const getCouleurAvatar = (m: number) => {
    if (m >= 12) return 'from-amber-500 via-orange-500 to-red-500'
    if (m >= 6) return 'from-emerald-500 via-teal-500 to-cyan-500'
    if (m >= 3) return 'from-blue-500 via-indigo-500 to-purple-500'
    return 'from-purple-500 via-pink-500 to-rose-500'
  }

  const getBadgeFidelite = (m: number) => {
    if (m >= 12)
      return { emoji: '👑', label: 'Légende', couleur: 'from-amber-500 to-orange-600' }
    if (m >= 6)
      return { emoji: '💎', label: 'Fidèle', couleur: 'from-emerald-500 to-teal-600' }
    if (m >= 3)
      return { emoji: '⭐', label: 'Régulier', couleur: 'from-blue-500 to-indigo-600' }
    return { emoji: '🌱', label: 'Nouveau', couleur: 'from-purple-500 to-pink-600' }
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
          className="w-12 h-12 border-3 border-slate-900 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm">Chargement...</p>
      </div>
    )
  }

  if (erreur && eleves.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-rose-200 rounded-2xl p-6 sm:p-8 max-w-md text-center"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-rose-700 text-sm mb-6">{erreur}</p>
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
      <Link
        href="/espace-professeur"
        className="text-sm text-slate-400 hover:text-slate-700 inline-flex items-center gap-1.5 transition-colors"
      >
        ← Retour
      </Link>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700" />

        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4 sm:mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30 mb-2">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                Espace Professeur
              </div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white">
                  👨‍🎓 Mes élèves
                </h1>
                {stats.suiviAFaire > 0 && (
                  <span className="flex items-center gap-1 bg-red-500 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white shadow-md">
                    ⚠️ {stats.suiviAFaire} à faire
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm">
                {stats.total} élève{stats.total > 1 ? 's' : ''} · {moisActuel}
              </p>
            </div>
            <button
              onClick={charger}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-colors text-xs sm:text-sm disabled:opacity-50"
            >
              🔄 Actualiser
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Élèves', val: stats.total, emoji: '👨‍🎓', color: 'from-blue-400/30 to-blue-600/30' },
              { label: 'Revenus', val: `${formaterPrix(stats.revenusMensuels)}`, sub: 'DJF/mois', emoji: '💰', color: 'from-amber-400/30 to-orange-600/30' },
              { label: 'Note moy.', val: stats.moyenneNotes > 0 ? stats.moyenneNotes.toFixed(1) : '—', sub: '/20', emoji: '⭐', color: 'from-yellow-400/30 to-amber-600/30' },
              { label: 'Suivi mois', val: `${stats.suiviFait}/${stats.total}`, emoji: '📊', color: stats.suiviAFaire > 0 ? 'from-red-400/30 to-rose-600/30' : 'from-emerald-400/30 to-teal-600/30' },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`bg-gradient-to-br ${k.color} backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/30`}
              >
                <div className="text-[9px] sm:text-[10px] font-bold uppercase text-white/80 mb-1">
                  {k.emoji} {k.label}
                </div>
                <div className="text-lg sm:text-2xl font-black text-white truncate">{k.val}</div>
                {k.sub && <div className="text-[9px] text-white/70">{k.sub}</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-4 flex items-start gap-3"
          >
            <span className="text-xl sm:text-2xl">🎉</span>
            <p className="text-emerald-800 text-xs sm:text-sm font-bold flex-1">{succes}</p>
          </motion.div>
        )}
        {erreur && eleves.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border border-rose-200 rounded-2xl p-3 sm:p-4 flex items-start gap-3"
          >
            <span className="text-xl sm:text-2xl">⚠️</span>
            <p className="text-rose-700 text-xs sm:text-sm font-medium flex-1">{erreur}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtres */}
      {stats.total > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {(
              [
                { val: 'tous', label: '👥 Tous', count: compte.tous, color: 'from-slate-700 to-slate-900' },
                { val: 'suivi_a_faire', label: '⚠️ À faire', count: compte.suivi_a_faire, color: 'from-red-500 to-orange-600' },
                { val: 'suivi_ok', label: '✅ OK', count: compte.suivi_ok, color: 'from-emerald-500 to-teal-600' },
                { val: 'long_terme', label: '💎 6+ mois', count: compte.long_terme, color: 'from-blue-500 to-indigo-600' },
                { val: 'recent', label: '🌱 Récents', count: compte.recent, color: 'from-purple-500 to-pink-600' },
              ] as any[]
            ).map((f) => (
              <button
                key={f.val}
                onClick={() => setFiltre(f.val)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  filtre === f.val
                    ? `bg-gradient-to-r ${f.color} text-white shadow-md`
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 sm:pl-11 pr-3 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 outline-none font-medium transition-colors"
              />
            </div>
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:border-slate-400 outline-none cursor-pointer"
            >
              <option value="recent">📅 Récent</option>
              <option value="ancien">📅 Ancien</option>
              <option value="mois_eleve">⏰ Plus mois</option>
              <option value="mois_bas">⏰ Moins mois</option>
              <option value="note_haute">⭐ Note ↑</option>
              <option value="note_basse">⚠️ Note ↓</option>
            </select>
          </div>
        </>
      )}

      {/* Liste */}
      {eleves.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 text-center"
        >
          <div className="text-5xl sm:text-7xl mb-4">👨‍🎓</div>
          <h3 className="font-black text-slate-900 text-lg sm:text-2xl mb-2">
            Aucun élève pour l'instant
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-md mx-auto">
            Acceptez des demandes pour commencer à enseigner.
          </p>
          <Link
            href="/espace-professeur/demandes"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm"
          >
            📥 Voir les demandes
          </Link>
        </motion.div>
      ) : elevesFiltres.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 text-center">
          <div className="text-5xl sm:text-6xl mb-4">🔍</div>
          <h3 className="font-black text-slate-900 text-base sm:text-xl mb-2">Aucun résultat</h3>
          <button
            onClick={() => {
              setFiltre('tous')
              setRecherche('')
            }}
            className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm"
          >
            Réinitialiser
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {elevesFiltres.map((e, i) => {
            const info = getInfoNote(e.suiviActuel?.note ?? null)
            const suiviFait = e.suiviActuel && e.suiviActuel.mois === moisActuel
            const badge = getBadgeFidelite(e.mois_avec_client)

            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all overflow-hidden ${
                  !suiviFait ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                }`}
              >
                {!suiviFait && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
                )}

                <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4">
                  {/* Avatar + Infos */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${getCouleurAvatar(
                          e.mois_avec_client
                        )} flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg`}
                      >
                        👨‍🎓
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${badge.couleur} flex items-center justify-center text-white text-[10px] sm:text-sm border-2 border-white shadow-md`}
                        title={badge.label}
                      >
                        {badge.emoji}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                          {e.parent_nom}
                        </h3>
                        <span
                          className={`text-[9px] sm:text-[10px] bg-gradient-to-r ${badge.couleur} text-white px-2 py-0.5 rounded-full font-bold`}
                        >
                          {badge.emoji} {badge.label.toUpperCase()}
                        </span>
                        {!suiviFait && (
                          <span className="text-[9px] sm:text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                            ⚠️ SUIVI À FAIRE
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] sm:text-xs text-slate-500 space-y-0.5 mb-3">
                        {e.parent_quartier && <div>📍 {e.parent_quartier}</div>}
                        <div>
                          📅 Depuis {e.mois_avec_client} mois · Inscrit le{' '}
                          {formaterDate(e.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-1.5 sm:gap-2 w-full md:w-auto">
                    <button
                      onClick={() => ouvrirSuivi(e)}
                      className={`flex-1 md:flex-none md:min-w-[140px] px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                        suiviFait
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {suiviFait ? '✏️ Modifier' : '📝 Faire suivi'}
                    </button>
                    {e.historique.length > 1 && (
                      <button
                        onClick={() => setEleveHistorique(e)}
                        className="flex-1 md:flex-none md:min-w-[140px] px-3 sm:px-5 py-2.5 bg-purple-500 text-white rounded-xl font-bold text-xs hover:bg-purple-600"
                      >
                        📊 Historique
                      </button>
                    )}
                    {e.parent_whatsapp && (
                      <a
                        href={`https://wa.me/${e.parent_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none md:min-w-[140px] px-3 sm:px-5 py-2.5 bg-green-500 text-white rounded-xl font-bold text-xs text-center hover:bg-green-600"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* ENFANTS */}
                {e.enfants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">
                      👶 Enfants ({e.enfants.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {e.enfants.map((enf) => (
                        <div
                          key={enf.id}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5"
                        >
                          <div className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5">
                            {enf.prenom}
                          </div>

                          {/* Niveaux + Classes */}
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {enf.niveaux.length > 0 ? (
                              enf.niveaux.map((n) => (
                                <span
                                  key={n}
                                  className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold"
                                >
                                  {labelsNiveaux[n] || n}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">
                                Aucun niveau
                              </span>
                            )}
                          </div>
                          {enf.classes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {enf.classes.map((c) => (
                                <span
                                  key={c}
                                  className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* ✅ LANGUES COMPRISES (communication) */}
                          {enf.languesComprises.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">
                                💬 Comprend
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {enf.languesComprises.map((l) => (
                                  <span
                                    key={l}
                                    className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold"
                                  >
                                    {labelsLangues[l] || l}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ✅ LANGUES À APPRENDRE (ce que le prof enseigne) */}
                          {enf.languesSpeciales.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">
                                🎯 À apprendre
                              </div>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {enf.languesSpeciales.map((l) => (
                                  <span
                                    key={l}
                                    className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold"
                                  >
                                    {labelsLangues[l] || l}
                                  </span>
                                ))}
                              </div>
                              {enf.precisionsLangues.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {enf.precisionsLangues.map((p) => (
                                    <span
                                      key={p}
                                      className="text-[9px] bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded font-semibold"
                                    >
                                      {labelsPrecisions[p] || p}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                    <div className="text-[9px] text-slate-500 font-bold">👶 ENFANTS</div>
                    <div className="text-slate-900 font-bold text-sm sm:text-base">
                      {e.nombre_enfants}
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                    <div className="text-[9px] text-amber-700 font-bold">💰 PRIX</div>
                    <div className="text-slate-900 font-bold text-xs sm:text-sm truncate">
                      {e.prix_souhaite ? formaterPrix(e.prix_souhaite) : '—'}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-200">
                    <div className="text-[9px] text-blue-700 font-bold">⏱️ MOIS</div>
                    <div className="text-slate-900 font-bold text-sm sm:text-base">
                      {e.mois_avec_client}
                    </div>
                  </div>
                  <div className={`${info.bg} rounded-xl p-2.5 border border-slate-200`}>
                    <div className="text-[9px] text-slate-500 font-bold">📊 NOTE</div>
                    <div className={`font-bold text-sm sm:text-base ${info.couleur}`}>
                      {e.suiviActuel?.note ? `${e.suiviActuel.note}/20` : '—'}
                    </div>
                  </div>
                </div>

                {/* Appréciation publiée */}
                {suiviFait && e.suiviActuel?.appreciation && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 mt-3">
                    <div className="text-[10px] text-emerald-700 font-bold mb-1 flex items-center gap-1">
                      📝 DERNIÈRE APPRÉCIATION
                      {e.suiviActuel.enfant_prenom && (
                        <span className="text-slate-500">
                          · {e.suiviActuel.enfant_prenom}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 italic line-clamp-2">
                      « {e.suiviActuel.appreciation} »
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Coach IA */}
      {conseils.length > 0 && (
        <div className="bg-purple-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white text-xl sm:text-2xl">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Coach IA</h3>
              <p className="text-[11px] text-slate-500">Conseils</p>
            </div>
          </div>
          <div className="space-y-2">
            {conseils.map((c, i) => (
              <div
                key={i}
                className={`rounded-xl p-2.5 sm:p-3 border flex items-start gap-2 sm:gap-3 ${
                  c.priorite === 'haute'
                    ? 'bg-rose-50 border-rose-200'
                    : c.priorite === 'moyenne'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-purple-100'
                }`}
              >
                <span className="text-lg sm:text-xl flex-shrink-0">{c.emoji}</span>
                <p className="text-[12px] sm:text-sm text-slate-800 font-medium flex-1">
                  {c.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL SUIVI */}
      <AnimatePresence>
        {eleveSuivi && (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            onClick={() => setEleveSuivi(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(ev) => ev.stopPropagation()}
              className="bg-white sm:rounded-2xl rounded-t-2xl w-full sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            >
              <div className="relative bg-gradient-to-r from-emerald-600 to-blue-700 p-4 sm:p-6 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-bold text-white truncate">
                      📊 Suivi de {moisActuel}
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100 mt-0.5 truncate">
                      👨‍👩‍👧 {eleveSuivi.parent_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => setEleveSuivi(null)}
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                {/* Enfant */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    👶 Enfant concerné <span className="text-rose-500">*</span>
                  </label>
                  {eleveSuivi.enfants.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                      ⚠️ Aucun enfant trouvé pour cette demande.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {eleveSuivi.enfants.map((enf) => {
                        const actif = enfantId === enf.id
                        return (
                          <button
                            key={enf.id}
                            type="button"
                            onClick={() => setEnfantId(enf.id)}
                            className={`text-left p-3 rounded-xl border transition-all ${
                              actif
                                ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                                : 'border-slate-200 bg-white hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                  actif ? 'bg-white/20' : 'bg-slate-100'
                                }`}
                              >
                                👶
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm truncate">{enf.prenom}</div>
                                {enf.niveaux.length > 0 && (
                                  <div
                                    className={`text-[10px] ${
                                      actif ? 'text-slate-300' : 'text-slate-500'
                                    }`}
                                  >
                                    {enf.niveaux.map((n) => labelsNiveaux[n] || n).join(' · ')}
                                  </div>
                                )}
                              </div>
                              {actif && <span className="text-xs">✓</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📊 Note sur 20 <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="15"
                      className="flex-1 px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-bold text-slate-900 text-2xl text-center transition-colors"
                    />
                    <div className="text-xl font-bold text-slate-400">/20</div>
                  </div>
                  {note && Number(note) >= 0 && Number(note) <= 20 && (
                    <div
                      className={`mt-2 text-center p-2.5 rounded-xl ${
                        getInfoNote(Number(note)).bg
                      } border border-slate-200`}
                    >
                      <span className="text-lg mr-1.5">
                        {getInfoNote(Number(note)).emoji}
                      </span>
                      <span
                        className={`font-bold text-sm ${getInfoNote(Number(note)).couleur}`}
                      >
                        {getInfoNote(Number(note)).label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Appréciation */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    💬 Appréciation <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={appreciation}
                    onChange={(e) => setAppreciation(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Décrivez les progrès de l'enfant..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none resize-none font-medium text-slate-900 text-sm transition-colors"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>{appreciation.length}/500</span>
                    {appreciation.length < 20 && (
                      <span className="text-amber-700 font-bold">Min 20 caractères</span>
                    )}
                  </div>
                </div>

                {/* Points forts + à améliorer */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 mb-2">
                      ✅ Points forts
                    </label>
                    <textarea
                      value={pointsForts}
                      onChange={(e) => setPointsForts(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Ex : Bonne participation..."
                      className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl outline-none resize-none font-medium text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-700 mb-2">
                      ⚠️ À améliorer
                    </label>
                    <textarea
                      value={pointsAmeliorer}
                      onChange={(e) => setPointsAmeliorer(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Ex : Concentration..."
                      className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl outline-none resize-none font-medium text-slate-900 text-sm"
                    />
                  </div>
                </div>

                {erreur && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-base">⚠️</span>
                    <p className="text-rose-700 text-xs font-semibold flex-1">{erreur}</p>
                  </div>
                )}

                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-xl">
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    📧 Le parent recevra une notification avec le nom de l'enfant.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={() => setEleveSuivi(null)}
                  disabled={action}
                  className="px-4 sm:px-6 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrerSuivi}
                  disabled={action || !enfantId}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {action ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Enregistrement...
                    </>
                  ) : (
                    '💾 Enregistrer'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL HISTORIQUE */}
      <AnimatePresence>
        {eleveHistorique && (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setEleveHistorique(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(ev) => ev.stopPropagation()}
              className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">📊 Historique</h2>
                    <p className="text-xs text-purple-100 mt-0.5">
                      {eleveHistorique.parent_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => setEleveHistorique(null)}
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
                {eleveHistorique.historique.map((h, i) => {
                  const info = getInfoNote(h.note)
                  return (
                    <div
                      key={h.id}
                      className={`rounded-xl p-3.5 border ${info.bg} border-slate-200 flex items-center gap-3`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                        {info.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {h.mois}
                          {h.enfant_prenom && (
                            <span className="text-slate-500 font-medium">
                              {' '}· {h.enfant_prenom}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formaterDate(h.created_at)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-2xl font-bold ${info.couleur}`}>
                          {h.note !== null ? `${h.note}/20` : '—'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          {info.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {eleveHistorique.historique.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-slate-500 text-sm">Aucun suivi enregistré.</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setEleveHistorique(null)}
                  className="w-full py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-sm"
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