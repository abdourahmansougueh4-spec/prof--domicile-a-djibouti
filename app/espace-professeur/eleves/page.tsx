'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Eleve = {
  id: string
  demande_id: string
  parent_id: string
  parent_nom: string
  parent_quartier: string | null
  parent_telephone: string | null
  parent_whatsapp: string | null
  matiere: string | null
  nombre_enfants: number
  prix_souhaite: number | null
  niveaux_souhaites: string[]
  mois_avec_client: number
  created_at: string
  suiviActuel: {
    id: string
    mois: string
    note: number | null
    appreciation: string | null
    points_forts: string | null
    points_ameliorer: string | null
  } | null
  historique: {
    id: string
    mois: string
    note: number | null
    created_at: string
  }[]
}

type Filtre = 'tous' | 'suivi_a_faire' | 'suivi_ok' | 'long_terme' | 'recent'
type Tri = 'recent' | 'ancien' | 'mois_eleve' | 'mois_bas' | 'note_haute' | 'note_basse'

// ============================================================
// CONFIG
// ============================================================

const labelsNiveaux: { [k: string]: string } = {
  primaire: '🎒 Primaire',
  college: '📖 Collège',
  lycee: '🎓 Lycée',
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

// ============================================================
// HELPER : Mois actuel au format "Novembre 2026"
// ============================================================

const getMoisActuel = (): string => {
  const d = new Date()
  const mois = d.toLocaleDateString('fr-FR', { month: 'long' })
  const moisCapitalise = mois.charAt(0).toUpperCase() + mois.slice(1)
  return `${moisCapitalise} ${d.getFullYear()}`
}

// ============================================================
// HELPER : Note → couleur + label
// ============================================================

const getInfoNote = (note: number | null): {
  couleur: string
  bg: string
  label: string
  emoji: string
} => {
  if (note === null || note === 0) {
    return {
      couleur: 'text-slate-400',
      bg: 'bg-slate-100',
      label: 'Non évalué',
      emoji: '⏳',
    }
  }
  if (note >= 16) {
    return {
      couleur: 'text-emerald-600',
      bg: 'bg-emerald-50',
      label: 'Excellent',
      emoji: '🌟',
    }
  }
  if (note >= 12) {
    return {
      couleur: 'text-blue-600',
      bg: 'bg-blue-50',
      label: 'Bien',
      emoji: '✅',
    }
  }
  if (note >= 10) {
    return {
      couleur: 'text-amber-600',
      bg: 'bg-amber-50',
      label: 'Moyen',
      emoji: '📊',
    }
  }
  return {
    couleur: 'text-red-600',
    bg: 'bg-red-50',
    label: 'À améliorer',
    emoji: '⚠️',
  }
}

// ============================================================
// HELPER : Coach IA
// ============================================================

const genererConseils = (eleves: Eleve[]): {
  emoji: string
  texte: string
  priorite: 'haute' | 'moyenne' | 'basse'
}[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  const moisActuel = getMoisActuel()
  const sansSuivi = eleves.filter((e) => !e.suiviActuel || e.suiviActuel.mois !== moisActuel)

  if (sansSuivi.length > 0) {
    conseils.push({
      emoji: '🚨',
      texte: `${sansSuivi.length} élève(s) n'ont pas encore leur suivi de ${moisActuel}. Faites-le vite pour rassurer les parents.`,
      priorite: 'haute',
    })
  }

  if (eleves.length === 0) {
    conseils.push({
      emoji: '📢',
      texte: 'Vous n\'avez pas encore d\'élèves. Complétez votre profil et acceptez des demandes.',
      priorite: 'haute',
    })
    return conseils
  }

  // Note moyenne faible
  const avecNote = eleves.filter((e) => e.suiviActuel?.note)
  if (avecNote.length > 0) {
    const moyenne = avecNote.reduce((acc, e) => acc + (e.suiviActuel?.note || 0), 0) / avecNote.length
    if (moyenne < 12) {
      conseils.push({
        emoji: '📈',
        texte: 'Votre note moyenne de suivi est faible. Essayez d\'améliorer la qualité des cours.',
        priorite: 'moyenne',
      })
    }
  }

  // Long terme
  const longTerme = eleves.filter((e) => e.mois_avec_client >= 6)
  if (longTerme.length > 0) {
    conseils.push({
      emoji: '🎉',
      texte: `${longTerme.length} élève(s) vous font confiance depuis plus de 6 mois. Excellent travail !`,
      priorite: 'basse',
    })
  }

  // Élèves récents
  const recents = eleves.filter((e) => e.mois_avec_client < 2)
  if (recents.length > 0) {
    conseils.push({
      emoji: '🌱',
      texte: `${recents.length} élève(s) récents. Assurez-vous de faire bonne impression les premiers mois.`,
      priorite: 'moyenne',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function MesEleves() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [action, setAction] = useState(false)

  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')

  // Modal suivi
  const [eleveSuivi, setEleveSuivi] = useState<Eleve | null>(null)
  const [note, setNote] = useState('')
  const [appreciation, setAppreciation] = useState('')
  const [pointsForts, setPointsForts] = useState('')
  const [pointsAmeliorer, setPointsAmeliorer] = useState('')

  // Modal historique
  const [eleveHistorique, setEleveHistorique] = useState<Eleve | null>(null)

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

      // Charger les demandes acceptées
      const { data: demandes, error: demandesError } = await supabase
        .from('demandes')
        .select('*')
        .eq('professeur_id', user.id)
        .eq('statut', 'acceptee')
        .order('created_at', { ascending: false })

      if (demandesError) throw demandesError

      const moisActuel = getMoisActuel()
      const elevesComplets: Eleve[] = []

      for (const d of demandes || []) {
        // Charger parent
        const { data: parent } = await supabase
          .from('profiles')
          .select('nom_complet, quartier, telephone, whatsapp')
          .eq('id', d.parent_id)
          .single()

        // Charger suivi du mois actuel
        const { data: suiviActuel } = await supabase
          .from('suivi_mensuel')
          .select('id, mois, note, appreciation, points_forts, points_ameliorer')
          .eq('demande_id', d.id)
          .eq('mois', moisActuel)
          .maybeSingle()

        // Charger historique complet
        const { data: historique } = await supabase
          .from('suivi_mensuel')
          .select('id, mois, note, created_at')
          .eq('demande_id', d.id)
          .order('created_at', { ascending: false })
          .limit(12)

        // Calculer les mois
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
          parent_telephone: parent?.telephone || null,
          parent_whatsapp: parent?.whatsapp || null,
          matiere: d.matiere || null,
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          niveaux_souhaites: d.niveaux_souhaites || [],
          mois_avec_client: moisEcoules,
          created_at: d.created_at,
          suiviActuel: suiviActuel || null,
          historique: historique || [],
        })
      }

      setEleves(elevesComplets)
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

  const moisActuel = getMoisActuel()

  const stats = useMemo(() => {
    const total = eleves.length
    const revenusMensuels = eleves.reduce(
      (acc, e) => acc + (e.prix_souhaite || 0),
      0
    )
    const avecNote = eleves.filter((e) => e.suiviActuel?.note)
    const moyenneNotes =
      avecNote.length > 0
        ? avecNote.reduce((acc, e) => acc + (e.suiviActuel?.note || 0), 0) / avecNote.length
        : 0
    const suiviFait = eleves.filter(
      (e) => e.suiviActuel && e.suiviActuel.mois === moisActuel
    ).length
    const suiviAFaire = total - suiviFait

    return {
      total,
      revenusMensuels,
      moyenneNotes,
      suiviFait,
      suiviAFaire,
    }
  }, [eleves, moisActuel])

  const conseils = useMemo(() => genererConseils(eleves), [eleves])

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const elevesFiltres = useMemo(() => {
    let resultat = eleves.filter((e) => {
      // Filtre
      if (filtre === 'suivi_a_faire') {
        if (e.suiviActuel && e.suiviActuel.mois === moisActuel) return false
      }
      if (filtre === 'suivi_ok') {
        if (!e.suiviActuel || e.suiviActuel.mois !== moisActuel) return false
      }
      if (filtre === 'long_terme') {
        if (e.mois_avec_client < 6) return false
      }
      if (filtre === 'recent') {
        if (e.mois_avec_client >= 2) return false
      }

      // Recherche
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          e.parent_nom.toLowerCase().includes(r) ||
          e.parent_quartier?.toLowerCase().includes(r) ||
          e.matiere?.toLowerCase().includes(r)
        )
      }
      return true
    })

    // Tri
    if (tri === 'recent')
      resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien')
      resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'mois_eleve')
      resultat.sort((a, b) => b.mois_avec_client - a.mois_avec_client)
    if (tri === 'mois_bas')
      resultat.sort((a, b) => a.mois_avec_client - b.mois_avec_client)
    if (tri === 'note_haute')
      resultat.sort((a, b) => (b.suiviActuel?.note || 0) - (a.suiviActuel?.note || 0))
    if (tri === 'note_basse')
      resultat.sort((a, b) => (a.suiviActuel?.note || 0) - (b.suiviActuel?.note || 0))

    return resultat
  }, [eleves, filtre, recherche, tri, moisActuel])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useMemo(() => {
    return {
      tous: eleves.length,
      suivi_a_faire: eleves.filter(
        (e) => !e.suiviActuel || e.suiviActuel.mois !== moisActuel
      ).length,
      suivi_ok: eleves.filter(
        (e) => e.suiviActuel && e.suiviActuel.mois === moisActuel
      ).length,
      long_terme: eleves.filter((e) => e.mois_avec_client >= 6).length,
      recent: eleves.filter((e) => e.mois_avec_client < 2).length,
    }
  }, [eleves, moisActuel])

  // ============================================================
  // ACTIONS — SUIVI MENSUEL
  // ============================================================

  const ouvrirSuivi = (eleve: Eleve) => {
    setEleveSuivi(eleve)
    if (eleve.suiviActuel && eleve.suiviActuel.mois === moisActuel) {
      setNote(eleve.suiviActuel.note?.toString() || '')
      setAppreciation(eleve.suiviActuel.appreciation || '')
      setPointsForts(eleve.suiviActuel.points_forts || '')
      setPointsAmeliorer(eleve.suiviActuel.points_ameliorer || '')
    } else {
      setNote('')
      setAppreciation('')
      setPointsForts('')
      setPointsAmeliorer('')
    }
    setErreur('')
  }

  const enregistrerSuivi = async () => {
    if (!eleveSuivi) return

    const noteNum = Number(note)
    if (!note || isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
      setErreur('La note doit être un nombre entre 0 et 20')
      return
    }
    if (!appreciation.trim() || appreciation.trim().length < 20) {
      setErreur('L\'appréciation doit contenir au moins 20 caractères')
      return
    }

    setAction(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const existe = eleveSuivi.suiviActuel && eleveSuivi.suiviActuel.mois === moisActuel

      if (existe && eleveSuivi.suiviActuel) {
        // Modifier
        const { error } = await supabase
          .from('suivi_mensuel')
          .update({
            note: noteNum,
            appreciation: appreciation.trim(),
            points_forts: pointsForts.trim() || null,
            points_ameliorer: pointsAmeliorer.trim() || null,
          })
          .eq('id', eleveSuivi.suiviActuel.id)

        if (error) throw error
      } else {
        // Créer
        const { error } = await supabase.from('suivi_mensuel').insert({
          demande_id: eleveSuivi.demande_id,
          professeur_id: user.id,
          mois: moisActuel,
          note: noteNum,
          appreciation: appreciation.trim(),
          points_forts: pointsForts.trim() || null,
          points_ameliorer: pointsAmeliorer.trim() || null,
        })

        if (error) throw error
      }

      // Notifier le parent
      await supabase.from('notifications').insert({
        destinataire_id: eleveSuivi.parent_id,
        titre: `📊 Suivi de ${moisActuel}`,
        contenu: `Le suivi mensuel de votre enfant est disponible. Note : ${noteNum}/20`,
        lu: false,
      })

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'suivi_mensuel_prof',
        details: `${eleveSuivi.parent_nom} - ${moisActuel} - ${noteNum}/20`,
      })

      setSucces(`✅ Suivi de ${moisActuel} enregistré !`)
      setTimeout(() => setSucces(''), 4000)
      setEleveSuivi(null)
      await charger()
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur')
    } finally {
      setAction(false)
    }
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterPrix = (n: number) => n.toLocaleString('fr-FR')

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const getCouleurAvatar = (mois: number) => {
    if (mois >= 12) return 'from-amber-500 to-orange-600'
    if (mois >= 6) return 'from-emerald-500 to-teal-600'
    if (mois >= 3) return 'from-blue-500 to-indigo-600'
    return 'from-purple-500 to-pink-600'
  }

  const getBadgeFidelite = (mois: number) => {
    if (mois >= 12) return { emoji: '👑', label: 'Légende', couleur: 'from-amber-500 to-orange-600' }
    if (mois >= 6) return { emoji: '💎', label: 'Fidèle', couleur: 'from-emerald-500 to-teal-600' }
    if (mois >= 3) return { emoji: '⭐', label: 'Régulier', couleur: 'from-blue-500 to-indigo-600' }
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
          className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm">Chargement de vos élèves...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR
  // ============================================================

  if (erreur && eleves.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-red-700 text-sm mb-6">{erreur}</p>
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
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">👨‍🎓 Mes élèves</h1>
                {stats.suiviAFaire > 0 && (
                  <span className="flex items-center gap-1 bg-red-500/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black border border-red-300/50 animate-pulse">
                    ⚠️ {stats.suiviAFaire} suivi à faire
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-sm">
                {stats.total} élève{stats.total > 1 ? 's' : ''} actif
                {stats.total > 1 ? 's' : ''} · Suivi mensuel obligatoire
              </p>
            </div>
            <button
              onClick={charger}
              disabled={loading}
              className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm disabled:opacity-50"
            >
              🔄 Actualiser
            </button>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">👨‍🎓 Élèves</div>
              <div className="text-2xl font-black">{stats.total}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">💰 Revenus/mois</div>
              <div className="text-lg font-black">{formaterPrix(stats.revenusMensuels)}</div>
              <div className="text-[10px] opacity-80">DJF</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">📊 Note moy.</div>
              <div className="text-2xl font-black">
                {stats.moyenneNotes > 0 ? stats.moyenneNotes.toFixed(1) : '—'}
              </div>
              <div className="text-[10px] opacity-80">/ 20</div>
            </div>
            <div className={`backdrop-blur-sm rounded-xl p-3 border ${
              stats.suiviAFaire > 0
                ? 'bg-red-500/20 border-red-300/40'
                : 'bg-emerald-500/20 border-emerald-300/40'
            }`}>
              <div className="text-[10px] font-black uppercase text-white">📋 Suivi mois</div>
              <div className="text-2xl font-black">
                {stats.suiviFait}/{stats.total}
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
        {erreur && eleves.length > 0 && (
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
      {/* INFO SUIVI MENSUEL */}
      {/* ============================================================ */}

      {stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📊</span>
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1">
                Suivi mensuel — {moisActuel}
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Chaque mois, vous devez <strong>noter et évaluer chaque élève</strong>.
                Cela permet aux parents de suivre les progrès et renforce leur confiance
                envers vous.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* FILTRES */}
      {/* ============================================================ */}

      {stats.total > 0 && (
        <>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase mb-2 ml-1">
              Filtrer
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { val: 'tous', label: '👥 Tous', count: compte.tous },
                  { val: 'suivi_a_faire', label: '⚠️ Suivi à faire', count: compte.suivi_a_faire },
                  { val: 'suivi_ok', label: '✅ Suivi OK', count: compte.suivi_ok },
                  { val: 'long_terme', label: '💎 Long terme (6+ mois)', count: compte.long_terme },
                  { val: 'recent', label: '🌱 Récents', count: compte.recent },
                ] as { val: Filtre; label: string; count: number }[]
              ).map((f) => (
                <button
                  key={f.val}
                  onClick={() => setFiltre(f.val)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    filtre === f.val
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-700 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          {/* RECHERCHE + TRI */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par parent, quartier ou matière..."
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

            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="recent">📅 Plus récent</option>
              <option value="ancien">📅 Plus ancien</option>
              <option value="mois_eleve">⏰ Plus de mois</option>
              <option value="mois_bas">⏰ Moins de mois</option>
              <option value="note_haute">⭐ Meilleure note</option>
              <option value="note_basse">⚠️ Note basse</option>
            </select>
          </div>

          <div className="text-sm text-slate-400">
            <span className="font-bold text-white">{elevesFiltres.length}</span> résultat
            {elevesFiltres.length > 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* LISTE ÉLÈVES */}
      {/* ============================================================ */}

      {eleves.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">👨‍🎓</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun élève</h3>
          <p className="text-slate-400 text-sm mb-6">
            Vous n'avez pas encore d'élèves acceptés. Acceptez des demandes pour
            commencer.
          </p>
          <Link
            href="/espace-professeur/demandes"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
          >
            📥 Voir les demandes
          </Link>
        </motion.div>
      ) : elevesFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun résultat</h3>
          <p className="text-slate-400 text-sm mb-4">
            Aucun élève ne correspond à ce filtre.
          </p>
          <button
            onClick={() => {
              setFiltre('tous')
              setRecherche('')
            }}
            className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-sm border border-blue-500/30"
          >
            ✕ Voir tous
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {elevesFiltres.map((e, i) => {
            const infoNote = getInfoNote(e.suiviActuel?.note ?? null)
            const suiviFait = e.suiviActuel && e.suiviActuel.mois === moisActuel
            const badgeFidelite = getBadgeFidelite(e.mois_avec_client)

            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border-2 transition-all ${
                  !suiviFait
                    ? 'bg-amber-500/5 border-amber-500/40'
                    : 'bg-slate-800/70 border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getCouleurAvatar(
                        e.mois_avec_client
                      )} flex items-center justify-center text-white text-2xl shadow-lg`}
                    >
                      👨‍🎓
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br ${badgeFidelite.couleur} flex items-center justify-center text-white text-xs border-2 border-slate-900 shadow-lg`}
                      title={badgeFidelite.label}
                    >
                      {badgeFidelite.emoji}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <div className="font-black text-white text-base">{e.parent_nom}</div>
                      <span
                        className={`text-[10px] bg-gradient-to-r ${badgeFidelite.couleur} text-white px-2 py-0.5 rounded-full font-black`}
                      >
                        {badgeFidelite.emoji} {badgeFidelite.label.toUpperCase()}
                      </span>
                      {!suiviFait && (
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                          ⚠️ SUIVI À FAIRE
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                      {e.parent_quartier && <div>📍 {e.parent_quartier}</div>}
                      <div>
                        📅 Client depuis {e.mois_avec_client} mois · Inscrit le{' '}
                        {formaterDate(e.created_at)}
                      </div>
                    </div>

                    {/* Infos grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">👶 ENFANTS</div>
                        <div className="text-white font-bold">{e.nombre_enfants}</div>
                      </div>
                      <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                        <div className="text-[9px] text-amber-300 font-black">💰 PRIX</div>
                        <div className="text-white font-bold text-sm">
                          {e.prix_souhaite ? formaterPrix(e.prix_souhaite) : '—'}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">⏱️ MOIS</div>
                        <div className="text-white font-bold">{e.mois_avec_client}</div>
                      </div>
                      <div className={`${infoNote.bg} rounded-lg p-2 border border-slate-200`}>
                        <div className="text-[9px] text-slate-500 font-black">📊 NOTE</div>
                        <div className={`font-black text-sm ${infoNote.couleur}`}>
                          {e.suiviActuel?.note ? `${e.suiviActuel.note}/20` : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Niveaux */}
                    {e.niveaux_souhaites.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {e.niveaux_souhaites.slice(0, 4).map((n) => (
                          <span
                            key={n}
                            className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold"
                          >
                            {labelsNiveaux[n] || n}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Appréciation (si existe) */}
                    {suiviFait && e.suiviActuel?.appreciation && (
                      <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-[9px] text-slate-500 font-black uppercase mb-1">
                          📝 Dernière appréciation
                        </div>
                        <p className="text-xs text-slate-300 italic line-clamp-2">
                          « {e.suiviActuel.appreciation} »
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => ouvrirSuivi(e)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all ${
                        suiviFait
                          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      }`}
                    >
                      {suiviFait ? '✏️ Modifier suivi' : '📝 Faire suivi'}
                    </button>

                    {e.historique.length > 1 && (
                      <button
                        onClick={() => setEleveHistorique(e)}
                        className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl font-bold text-xs border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                      >
                        📊 Historique
                      </button>
                    )}

                    {e.parent_whatsapp && (
                      <a
                        href={`https://wa.me/${e.parent_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 transition-colors text-center"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* COACH IA */}
      {/* ============================================================ */}

      {conseils.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg">
              🤖
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">Coach IA</h3>
              <p className="text-xs text-slate-500">Conseils personnalisés</p>
            </div>
          </div>

          <div className="space-y-2">
            {conseils.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`rounded-xl p-3 border-2 flex items-start gap-3 ${
                  c.priorite === 'haute'
                    ? 'bg-red-50 border-red-200'
                    : c.priorite === 'moyenne'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-purple-100'
                }`}
              >
                <span className="text-xl flex-shrink-0">{c.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-800 font-medium">{c.texte}</p>
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
      {/* GRAPHIQUE ÉVOLUTION NOTES */}
      {/* ============================================================ */}

      {eleves.length > 0 && eleves.some((e) => e.historique.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
              📈
            </div>
            <div>
              <h3 className="font-black text-slate-900">Évolution des notes</h3>
              <p className="text-[10px] text-slate-500">
                Moyenne de tous vos élèves par mois
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-32">
            {(() => {
              // Regrouper les notes par mois
              const parMois: { [k: string]: number[] } = {}
              eleves.forEach((e) => {
                e.historique.forEach((h) => {
                  if (h.note !== null) {
                    if (!parMois[h.mois]) parMois[h.mois] = []
                    parMois[h.mois].push(h.note)
                  }
                })
              })

              const moisListe = Object.entries(parMois)
                .slice(-6)
                .map(([mois, notes]) => ({
                  mois: mois.split(' ')[0].slice(0, 3),
                  moyenne: notes.reduce((a, b) => a + b, 0) / notes.length,
                }))

              const maxNote = 20

              return moisListe.length > 0 ? (
                moisListe.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="text-[9px] text-slate-500 font-black mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.moyenne.toFixed(1)}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(m.moyenne / maxNote) * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t-md"
                      style={{ minHeight: '4px' }}
                    />
                    <div className="text-[9px] text-slate-400 font-bold mt-1">
                      {m.mois}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full text-center text-slate-500 text-sm italic">
                  Pas encore de données
                </div>
              )
            })()}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* MODAL SUIVI MENSUEL */}
      {/* ============================================================ */}

      <AnimatePresence>
        {eleveSuivi && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setEleveSuivi(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      📊 Suivi de {moisActuel}
                    </h2>
                    <p className="text-xs text-emerald-100 mt-1">
                      {eleveSuivi.parent_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => setEleveSuivi(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* NOTE */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📊 Note globale (sur 20) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex : 15"
                      className="flex-1 px-5 py-4 bg-white border-2 border-emerald-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-black text-slate-900 text-2xl text-center"
                      style={{ color: '#1e293b' }}
                    />
                    <div className="text-2xl font-black text-slate-400">/ 20</div>
                  </div>

                  {/* Feedback note */}
                  {note && Number(note) >= 0 && Number(note) <= 20 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`mt-3 text-center p-3 rounded-xl ${
                        getInfoNote(Number(note)).bg
                      }`}
                    >
                      <span className="text-2xl mr-2">
                        {getInfoNote(Number(note)).emoji}
                      </span>
                      <span className={`font-black ${getInfoNote(Number(note)).couleur}`}>
                        {getInfoNote(Number(note)).label}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* APPRÉCIATION */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    💬 Appréciation générale <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={appreciation}
                    onChange={(e) => setAppreciation(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Décrivez les progrès de l'élève, son attitude, sa participation..."
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none resize-none font-medium text-slate-900 text-sm"
                    style={{ color: '#1e293b' }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{appreciation.length}/500</span>
                    {appreciation.length < 20 && (
                      <span className="text-amber-700 font-bold">
                        Minimum 20 caractères
                      </span>
                    )}
                  </div>
                </div>

                {/* POINTS FORTS */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    ✅ Points forts (optionnel)
                  </label>
                  <textarea
                    value={pointsForts}
                    onChange={(e) => setPointsForts(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="Ex : Très bonne participation, progrès en calcul mental..."
                    className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none resize-none font-medium text-slate-900 text-sm"
                    style={{ color: '#1e293b' }}
                  />
                </div>

                {/* POINTS À AMÉLIORER */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    ⚠️ Points à améliorer (optionnel)
                  </label>
                  <textarea
                    value={pointsAmeliorer}
                    onChange={(e) => setPointsAmeliorer(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="Ex : Doit travailler la rédaction, plus de concentration..."
                    className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-200 focus:border-amber-500 outline-none resize-none font-medium text-slate-900 text-sm"
                    style={{ color: '#1e293b' }}
                  />
                </div>

                {/* Erreur */}
                {erreur && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <span>⚠️</span>
                    <p className="text-red-700 text-xs font-medium">{erreur}</p>
                  </div>
                )}

                {/* Info */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-xl">
                  <p className="text-[10px] text-blue-800">
                    📧 Le parent recevra une notification et pourra consulter ce suivi
                    dans son espace.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setEleveSuivi(null)}
                  disabled={action}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrerSuivi}
                  disabled={action}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                    <>💾 Enregistrer le suivi</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL HISTORIQUE */}
      {/* ============================================================ */}

      <AnimatePresence>
        {eleveHistorique && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setEleveHistorique(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-8"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      📊 Historique des suivis
                    </h2>
                    <p className="text-xs text-purple-100 mt-1">
                      {eleveHistorique.parent_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => setEleveHistorique(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                {eleveHistorique.historique.map((h, i) => {
                  const info = getInfoNote(h.note)
                  return (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-xl p-4 border-2 ${info.bg} border-slate-200 flex items-center gap-3`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                        {info.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-slate-900 text-sm">
                          {h.mois}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formaterDate(h.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-black ${info.couleur}`}>
                          {h.note !== null ? `${h.note}/20` : '—'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          {info.label}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {eleveHistorique.historique.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-slate-500 text-sm">
                      Aucun suivi enregistré pour cet élève.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200">
                <button
                  onClick={() => setEleveHistorique(null)}
                  className="w-full py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
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