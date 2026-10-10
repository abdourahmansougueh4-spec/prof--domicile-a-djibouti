'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Demande = {
  id: string
  professeur_id: string
  prof_nom: string
  prof_photo: string | null
  prof_quartier: string | null
  matiere: string | null
  message: string | null
  statut: string
  motif_refus: string | null
  nombre_enfants: number
  prix_souhaite: number | null
  niveaux_souhaites: string[]
  creneaux_souhaites: string[]
  paiement_effectue: boolean
  montant_paye: number | null
  formule: string | null
  created_at: string
  updated_at: string
  date_decision: string | null
}

type Filtre = 'toutes' | 'en_attente' | 'acceptee' | 'refusee' | 'annulee'
type Tri = 'recent' | 'ancien' | 'prix_eleve' | 'prix_bas' | 'nom_az'

// ============================================================
// CONFIG STATUTS
// ============================================================

const LABELS_STATUT: {
  [k: string]: {
    label: string
    emoji: string
    couleur: string
    bgCard: string
    description: string
  }
} = {
  en_attente: {
    label: 'En attente',
    emoji: '⏳',
    couleur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    bgCard: 'from-amber-50 to-orange-50 border-amber-200',
    description: 'Notre équipe traite votre demande',
  },
  pre_acceptee: {
    label: 'Le prof est intéressé',
    emoji: '👍',
    couleur: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    bgCard: 'from-blue-50 to-indigo-50 border-blue-200',
    description: 'Le prof a accepté, en attente de validation finale',
  },
  acceptee: {
    label: 'Acceptée',
    emoji: '✅',
    couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    bgCard: 'from-emerald-50 to-teal-50 border-emerald-200',
    description: 'Félicitations, vous pouvez commencer !',
  },
  refusee: {
    label: 'Refusée',
    emoji: '❌',
    couleur: 'bg-red-500/20 text-red-300 border-red-500/30',
    bgCard: 'from-red-50 to-rose-50 border-red-200',
    description: 'Demande refusée par notre équipe',
  },
  annulee: {
    label: 'Annulée',
    emoji: '🚫',
    couleur: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    bgCard: 'from-slate-50 to-slate-100 border-slate-200',
    description: 'Demande annulée',
  },
}

const LABELS_MATIERES: { [k: string]: string } = {
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

const LABELS_NIVEAUX: { [k: string]: string } = {
  primaire: '🎒 Primaire',
  college: '📖 Collège',
  lycee: '🎓 Lycée',
  langue_speciale: '📕 Langue/Coran',
}

const LABELS_CRENEAUX: { [k: string]: string } = {
  matin: '🌅 Matin',
  apres_midi: '☀️ Après-midi',
  soir: '🌙 Soir',
}

// ============================================================
// HELPER : Format date
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
  if (diffJ < 30) return `Il y a ${Math.floor(diffJ / 7)} sem.`
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ============================================================
// HELPER : Coach IA
// ============================================================

const genererConseils = (demandes: Demande[]): {
  emoji: string
  texte: string
  priorite: 'haute' | 'moyenne' | 'basse'
}[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  if (demandes.length === 0) {
    conseils.push({
      emoji: '🔍',
      texte: 'Vous n\'avez pas encore envoyé de demande. Cherchez un prof pour commencer.',
      priorite: 'haute',
    })
    return conseils
  }

  const enAttente = demandes.filter((d) => d.statut === 'en_attente')
  const urgentes = demandes.filter(
    (d) =>
      d.statut === 'en_attente' &&
      Date.now() - new Date(d.created_at).getTime() > 24 * 3600000
  )

  if (urgentes.length > 0) {
    conseils.push({
      emoji: '⏰',
      texte: `${urgentes.length} demande${urgentes.length > 1 ? 's' : ''} en attente depuis plus de 24h. Contactez-nous sur WhatsApp.`,
      priorite: 'haute',
    })
  }

  if (enAttente.length > 0) {
    conseils.push({
      emoji: '⏳',
      texte: `${enAttente.length} demande${enAttente.length > 1 ? 's' : ''} en cours de traitement. Notre équipe s'active !`,
      priorite: 'moyenne',
    })
  }

  const acceptees = demandes.filter((d) => d.statut === 'acceptee' && !d.paiement_effectue)
  if (acceptees.length > 0) {
    conseils.push({
      emoji: '💳',
      texte: `${acceptees.length} demande${acceptees.length > 1 ? 's' : ''} acceptée${acceptees.length > 1 ? 's' : ''} — n'oubliez pas de régler le paiement.`,
      priorite: 'haute',
    })
  }

  const refusees = demandes.filter((d) => d.statut === 'refusee')
  if (refusees.length > 0) {
    conseils.push({
      emoji: '🔍',
      texte: `${refusees.length} demande${refusees.length > 1 ? 's' : ''} refusée${refusees.length > 1 ? 's' : ''}. Essayez un autre prof ou matière.`,
      priorite: 'basse',
    })
  }

  if (conseils.length === 0) {
    conseils.push({
      emoji: '✨',
      texte: 'Tout va bien ! Vos demandes sont à jour.',
      priorite: 'basse',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// HELPER : Étapes de timeline
// ============================================================

const getEtapeDemande = (statut: string): number => {
  // 1 = envoyée, 2 = vue par prof, 3 = validée admin, 4 = acceptée ou refusée
  if (statut === 'en_attente') return 1
  if (statut === 'pre_acceptee') return 2
  if (statut === 'acceptee' || statut === 'refusee' || statut === 'annulee') return 3
  return 1
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function MesDemandes() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('toutes')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [detail, setDetail] = useState<Demande | null>(null)

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

      const { data, error } = await supabase
        .from('demandes')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Demande[] = []

      for (const d of data || []) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('nom_complet, photo_url, quartier')
          .eq('id', d.professeur_id)
          .single()

        const { data: profInfo } = await supabase
          .from('professeurs')
          .select('photo_profil_url')
          .eq('id', d.professeur_id)
          .single()

        complets.push({
          id: d.id,
          professeur_id: d.professeur_id,
          prof_nom: prof?.nom_complet || 'Prof',
          prof_photo: profInfo?.photo_profil_url || prof?.photo_url || null,
          prof_quartier: prof?.quartier || null,
          matiere: d.matiere || null,
          message: d.message || null,
          statut: d.statut || 'en_attente',
          motif_refus: d.motif_refus || null,
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          niveaux_souhaites: d.niveaux_souhaites || [],
          creneaux_souhaites: d.creneaux_souhaites || [],
          paiement_effectue: d.paiement_effectue === true,
          montant_paye: d.montant_paye ? Number(d.montant_paye) : null,
          formule: d.formule || null,
          created_at: d.created_at,
          updated_at: d.updated_at || d.created_at,
          date_decision: d.motif_refus ? d.updated_at || null : null,
        })
      }

      setDemandes(complets)
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
  // FILTRES + TRI
  // ============================================================

  const demandesFiltrees = useMemo(() => {
    let resultat = demandes.filter((d) => {
      // Filtre
      if (filtre === 'en_attente' && d.statut !== 'en_attente') return false
      if (filtre === 'acceptee' && d.statut !== 'acceptee') return false
      if (filtre === 'refusee' && d.statut !== 'refusee') return false
      if (filtre === 'annulee' && d.statut !== 'annulee') return false

      // Recherche
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          d.prof_nom.toLowerCase().includes(r) ||
          d.prof_quartier?.toLowerCase().includes(r) ||
          d.matiere?.toLowerCase().includes(r) ||
          d.message?.toLowerCase().includes(r)
        )
      }
      return true
    })

    // Tri
    if (tri === 'recent')
      resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien')
      resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'prix_eleve')
      resultat.sort((a, b) => (b.prix_souhaite || 0) - (a.prix_souhaite || 0))
    if (tri === 'prix_bas')
      resultat.sort((a, b) => (a.prix_souhaite || 0) - (b.prix_souhaite || 0))
    if (tri === 'nom_az')
      resultat.sort((a, b) => a.prof_nom.localeCompare(b.prof_nom))

    return resultat
  }, [demandes, filtre, tri, recherche])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useMemo(() => {
    return {
      toutes: demandes.length,
      en_attente: demandes.filter((d) => d.statut === 'en_attente').length,
      acceptee: demandes.filter((d) => d.statut === 'acceptee').length,
      refusee: demandes.filter((d) => d.statut === 'refusee').length,
      annulee: demandes.filter((d) => d.statut === 'annulee').length,
    }
  }, [demandes])

  const stats = useMemo(() => {
    const total = demandes.length
    const acceptees = demandes.filter((d) => d.statut === 'acceptee').length
    const tauxAcceptation = total > 0 ? Math.round((acceptees / total) * 100) : 0
    const montantTotal = demandes
      .filter((d) => d.statut === 'acceptee')
      .reduce((acc, d) => acc + (d.prix_souhaite || 0), 0)

    return { total, acceptees, tauxAcceptation, montantTotal }
  }, [demandes])

  const conseils = useMemo(() => genererConseils(demandes), [demandes])

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm">Chargement de vos demandes...</p>
      </div>
    )
  }

  if (erreur) {
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
        href="/espace-parent"
        className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

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
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-2 border-white/30 flex-shrink-0">
              📤
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                Suivi de mes demandes
              </div>
              <h1 className="text-3xl md:text-4xl font-black">
                Mes demandes
              </h1>
            </div>
          </div>
          <p className="text-blue-100 text-sm mb-5">
            {stats.total} demande{stats.total > 1 ? 's' : ''} envoyée{stats.total > 1 ? 's' : ''} · Taux d'acceptation : {stats.tauxAcceptation}%
          </p>

          {/* 4 KPI dans le header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                📊 Total
              </div>
              <div className="text-2xl font-black">{stats.total}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                ⏳ En attente
              </div>
              <div className="text-2xl font-black">{compte.en_attente}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                ✅ Acceptées
              </div>
              <div className="text-2xl font-black">{compte.acceptee}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                💰 Budget total
              </div>
              <div className="text-sm font-black">
                {stats.montantTotal.toLocaleString()} DJF
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* EMPTY STATE */}
      {/* ============================================================ */}

      {stats.total === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/80 shadow-xl text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Aucune demande envoyée
          </h2>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Vous n'avez pas encore envoyé de demande. Trouvez un prof qui
            correspond à vos besoins et envoyez votre première demande.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/espace-parent/recherche"
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              🔍 Trouver un prof
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* FILTRES */}
          {/* ============================================================ */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            {(
              [
                { val: 'toutes', label: '📋 Toutes', count: compte.toutes },
                { val: 'en_attente', label: '⏳ En attente', count: compte.en_attente },
                { val: 'acceptee', label: '✅ Acceptées', count: compte.acceptee },
                { val: 'refusee', label: '❌ Refusées', count: compte.refusee },
                { val: 'annulee', label: '🚫 Annulées', count: compte.annulee },
              ] as { val: Filtre; label: string; count: number }[]
            ).map((f) => (
              <button
                key={f.val}
                onClick={() => setFiltre(f.val)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  filtre === f.val
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </motion.div>

          {/* ============================================================ */}
          {/* RECHERCHE + TRI */}
          {/* ============================================================ */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            <div className="relative flex-1 min-w-[250px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par prof, matière ou quartier..."
                className="w-full pl-12 pr-4 py-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
              />
              {recherche && (
                <button
                  onClick={() => setRecherche('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="px-4 py-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-bold outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="recent">📅 Plus récent</option>
              <option value="ancien">📅 Plus ancien</option>
              <option value="prix_eleve">💰 Prix élevé</option>
              <option value="prix_bas">💰 Prix bas</option>
              <option value="nom_az">🔤 Nom A→Z</option>
            </select>
          </motion.div>

          {/* Compteur résultats */}
          {(recherche || filtre !== 'toutes') && (
            <div className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{demandesFiltrees.length}</span>{' '}
              résultat{demandesFiltrees.length > 1 ? 's' : ''}
            </div>
          )}

          {/* ============================================================ */}
          {/* COACH IA */}
          {/* ============================================================ */}

          {conseils.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg">
                  🤖
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Coach IA</h3>
                  <p className="text-xs text-slate-500">
                    Conseils pour vos demandes
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {conseils.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className={`rounded-xl p-3 border-2 flex items-start gap-3 ${
                      c.priorite === 'haute'
                        ? 'bg-red-50 border-red-200'
                        : c.priorite === 'moyenne'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-purple-100'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{c.emoji}</span>
                    <p className="text-sm text-slate-800 font-medium flex-1">
                      {c.texte}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* LISTE DES DEMANDES */}
          {/* ============================================================ */}

          {demandesFiltrees.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/80 shadow-xl text-center"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-black text-slate-900 text-xl mb-2">
                Aucun résultat
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Aucune demande ne correspond à ces critères.
              </p>
              <button
                onClick={() => {
                  setRecherche('')
                  setFiltre('toutes')
                }}
                className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                ✕ Réinitialiser
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {demandesFiltrees.map((d, i) => {
                const statut = LABELS_STATUT[d.statut] || LABELS_STATUT.en_attente
                const etape = getEtapeDemande(d.statut)

                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
                    whileHover={{ y: -3 }}
                    className={`bg-gradient-to-br ${statut.bgCard} rounded-3xl p-6 border-2 shadow-lg hover:shadow-xl transition-all`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 flex-wrap mb-4">
                      {d.prof_photo ? (
                        <img
                          src={d.prof_photo}
                          alt={d.prof_nom}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg flex-shrink-0">
                          👨‍🏫
                        </div>
                      )}

                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-black text-slate-900 text-lg">
                            {d.prof_nom}
                          </h3>
                          <span
                            className={`text-[10px] bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full font-black border ${statut.couleur}`}
                          >
                            {statut.emoji} {statut.label.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2">
                          {d.prof_quartier && (
                            <>
                              <span>📍 {d.prof_quartier}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>📅 {formaterDate(d.created_at)}</span>
                        </div>

                        <p className="text-xs text-slate-600 italic">
                          {statut.description}
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/80">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {[
                          { num: 1, label: 'Envoyée', emoji: '📤' },
                          { num: 2, label: 'Vue par prof', emoji: '👁️' },
                          { num: 3, label: 'Traitée', emoji: '✅' },
                        ].map((s, idx) => (
                          <div key={s.num} className="flex items-center gap-2 flex-1 min-w-[80px]">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md flex-shrink-0 ${
                                etape >= s.num
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {etape > s.num ? '✓' : s.emoji}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                etape >= s.num ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {s.label}
                            </span>
                            {idx < 2 && (
                              <div
                                className={`flex-1 h-0.5 ${
                                  etape > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-white/80">
                        <div className="text-[9px] text-slate-500 font-black uppercase">
                          👶 Enfants
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          {d.nombre_enfants}
                        </div>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-white/80">
                        <div className="text-[9px] text-slate-500 font-black uppercase">
                          💰 Prix
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          {d.prix_souhaite
                            ? `${d.prix_souhaite.toLocaleString()} DJF`
                            : '—'}
                        </div>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-white/80">
                        <div className="text-[9px] text-slate-500 font-black uppercase">
                          💳 Paiement
                        </div>
                        <div
                          className={`text-xs font-black ${
                            d.paiement_effectue ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {d.paiement_effectue ? '✓ Payé' : 'En attente'}
                        </div>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-white/80">
                        <div className="text-[9px] text-slate-500 font-black uppercase">
                          🎓 Niveaux
                        </div>
                        <div className="text-xs font-black text-slate-900 truncate">
                          {d.niveaux_souhaites.length > 0
                            ? d.niveaux_souhaites
                                .map((n) => LABELS_NIVEAUX[n] || n)
                                .join(', ')
                            : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Matières */}
                    {d.matiere && (
                      <div className="mb-4">
                        <div className="text-[10px] text-slate-500 font-black uppercase mb-2">
                          📚 Matières demandées
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {d.matiere.split(', ').slice(0, 5).map((m) => (
                            <span
                              key={m}
                              className="text-[10px] bg-emerald-500/20 text-emerald-800 px-2 py-1 rounded-full font-bold border border-emerald-300"
                            >
                              {LABELS_MATIERES[m.trim()] || m.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Motif refus */}
                    {d.motif_refus && d.statut === 'refusee' && (
                      <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-xl mb-4">
                        <div className="text-[10px] text-red-700 font-black uppercase mb-1">
                          ❌ Motif du refus
                        </div>
                        <p className="text-xs text-red-800">{d.motif_refus}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setDetail(d)}
                        className="px-4 py-2.5 bg-white/80 text-slate-700 rounded-xl font-bold text-xs border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-1"
                      >
                        👁️ Détails
                      </button>

                      {d.statut === 'acceptee' && (
                        <a
                          href={`https://wa.me/25377741482?text=${encodeURIComponent(`Bonjour, je souhaite avoir les coordonnées de ${d.prof_nom}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1"
                        >
                          💬 Contacter via l'équipe
                        </a>
                      )}

                      {d.statut === 'refusee' && (
                        <Link
                          href="/espace-parent/recherche"
                          className="px-4 py-2.5 bg-blue-500/20 text-blue-700 rounded-xl font-bold text-xs border border-blue-300 hover:bg-blue-500/30 transition-all flex items-center justify-center gap-1"
                        >
                          🔍 Chercher un autre prof
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* CTA NOUVELLE DEMANDE */}
      {/* ============================================================ */}

      {stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white text-center relative overflow-hidden"
        >
          <motion.div
            className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10">
            <div className="text-5xl mb-3">➕</div>
            <h2 className="text-xl md:text-2xl font-black mb-3">
              Besoin d'un autre prof ?
            </h2>
            <p className="text-sm text-blue-100 mb-5 max-w-lg mx-auto">
              Vous cherchez un prof pour une nouvelle matière ou un autre niveau ?
              Envoyez une nouvelle demande.
            </p>
            <Link
              href="/espace-parent/recherche"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              🔍 Nouvelle demande
            </Link>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SUPPORT WHATSAPP */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
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
              Une question sur vos demandes ?
            </h3>
            <p className="text-xs text-emerald-100 mb-3">
              Notre équipe est disponible 7j/7 pour vous aider à traiter vos
              demandes plus rapidement.
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

      {/* ============================================================ */}
      {/* MODAL DÉTAIL DEMANDE */}
      {/* ============================================================ */}

      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden"
            >
              {/* Header */}
              <div className={`p-6 bg-gradient-to-r ${
                detail.statut === 'acceptee'
                  ? 'from-emerald-600 to-teal-700'
                  : detail.statut === 'refusee'
                  ? 'from-red-600 to-rose-700'
                  : detail.statut === 'annulee'
                  ? 'from-slate-600 to-slate-700'
                  : 'from-blue-700 to-indigo-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {detail.prof_photo ? (
                      <img
                        src={detail.prof_photo}
                        alt={detail.prof_nom}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                        👨‍🏫
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-white">
                        📩 Détail de la demande
                      </h2>
                      <p className="text-xs text-white/80 mt-1">
                        {detail.prof_nom}
                      </p>
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

              {/* Contenu */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Statut */}
                <div className={`${LABELS_STATUT[detail.statut]?.bgCard || LABELS_STATUT.en_attente.bgCard} rounded-2xl p-4 border-2`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">
                      {LABELS_STATUT[detail.statut]?.emoji || '⏳'}
                    </span>
                    <div>
                      <div className="font-black text-slate-900 text-base">
                        {LABELS_STATUT[detail.statut]?.label || 'Statut'}
                      </div>
                      <div className="text-xs text-slate-600">
                        {LABELS_STATUT[detail.statut]?.description || ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prof */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <div className="text-xs font-black text-blue-700 uppercase mb-3">
                    👨‍🏫 Professeur
                  </div>
                  <div className="text-slate-900 font-bold mb-1">
                    {detail.prof_nom}
                  </div>
                  {detail.prof_quartier && (
                    <div className="text-xs text-slate-600">📍 {detail.prof_quartier}</div>
                  )}
                </div>

                {/* Détails de la demande */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs font-black text-slate-600 uppercase mb-3">
                    📋 Détails
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <strong className="text-slate-500">👶 Enfants :</strong>
                      <div className="text-slate-900 font-bold">
                        {detail.nombre_enfants}
                      </div>
                    </div>
                    <div>
                      <strong className="text-slate-500">💰 Prix souhaité :</strong>
                      <div className="text-slate-900 font-bold">
                        {detail.prix_souhaite
                          ? `${detail.prix_souhaite.toLocaleString()} DJF`
                          : '—'}
                      </div>
                    </div>
                    {detail.niveaux_souhaites.length > 0 && (
                      <div className="col-span-2">
                        <strong className="text-slate-500">🎓 Niveaux :</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detail.niveaux_souhaites.map((n) => (
                            <span
                              key={n}
                              className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold"
                            >
                              {LABELS_NIVEAUX[n] || n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {detail.creneaux_souhaites.length > 0 && (
                      <div className="col-span-2">
                        <strong className="text-slate-500">📅 Créneaux :</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detail.creneaux_souhaites.map((c) => (
                            <span
                              key={c}
                              className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold"
                            >
                              {LABELS_CRENEAUX[c] || c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <strong className="text-slate-500">📅 Envoyée :</strong>
                      <div className="text-slate-900 font-bold">
                        {formaterDate(detail.created_at)}
                      </div>
                    </div>
                    <div>
                      <strong className="text-slate-500">💳 Paiement :</strong>
                      <div
                        className={`font-bold ${
                          detail.paiement_effectue ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {detail.paiement_effectue ? '✓ Effectué' : '⏳ En attente'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matières */}
                {detail.matiere && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                    <div className="text-xs font-black text-emerald-700 uppercase mb-2">
                      📚 Matières demandées
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.matiere.split(', ').map((m) => (
                        <span
                          key={m}
                          className="text-[10px] bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full font-bold"
                        >
                          {LABELS_MATIERES[m.trim()] || m.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                {detail.message && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="text-xs font-black text-slate-600 uppercase mb-2">
                      💬 Message envoyé
                    </div>
                    <p className="text-xs text-slate-700 italic whitespace-pre-line leading-relaxed">
                      « {detail.message} »
                    </p>
                  </div>
                )}

                {/* Motif refus */}
                {detail.motif_refus && detail.statut === 'refusee' && (
                  <div className="bg-red-50 rounded-2xl p-4 border-l-4 border-red-500">
                    <div className="text-xs font-black text-red-700 uppercase mb-2">
                      ❌ Motif du refus
                    </div>
                    <p className="text-xs text-red-800 whitespace-pre-line">
                      {detail.motif_refus}
                    </p>
                  </div>
                )}

                {/* Info confidentialité */}
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-3">
                  <p className="text-[10px] text-amber-800">
                    🔒 Pour la sécurité de tous, les coordonnées directes des
                    profs ne sont <strong>pas visibles</strong>. Toute mise en
                    relation passe par notre équipe.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 flex-wrap sticky bottom-0">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Fermer
                </button>
                {detail.statut === 'acceptee' && (
                  <a
                    href={`https://wa.me/25377741482?text=${encodeURIComponent(`Bonjour, je souhaite avoir les coordonnées de ${detail.prof_nom} pour ma demande acceptée.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg text-center"
                  >
                    💬 Contacter l'équipe
                  </a>
                )}
                {detail.statut === 'refusee' && (
                  <Link
                    href="/espace-parent/recherche"
                    className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg text-center"
                  >
                    🔍 Chercher un autre prof
                  </Link>
                )}
                {detail.statut === 'en_attente' && (
                  <a
                    href={`https://wa.me/25377741482?text=${encodeURIComponent(`Bonjour, je souhaite avoir des nouvelles de ma demande pour ${detail.prof_nom} envoyée le ${new Date(detail.created_at).toLocaleDateString('fr-FR')}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg text-center"
                  >
                    💬 Demander des nouvelles
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}