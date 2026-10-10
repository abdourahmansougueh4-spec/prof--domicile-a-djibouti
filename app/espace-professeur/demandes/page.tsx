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
  parent_id: string
  parent_nom: string
  parent_quartier: string | null
  matiere: string | null
  message: string | null
  statut: string
  nombre_enfants: number
  prix_souhaite: number | null
  niveaux_souhaites: string[]
  creneaux_souhaites: string[]
  jours_souhaites: string[]
  pre_decision: string | null
  created_at: string
  updated_at: string
}

type Filtre = 'urgentes' | 'en_attente' | 'pre_acceptee' | 'acceptee' | 'toutes'
type Tri = 'recent' | 'ancien' | 'prix_eleve' | 'prix_bas' | 'urgentes'

// ============================================================
// CONFIG STATUTS
// ============================================================

const labelsStatut: {
  [k: string]: { label: string; couleur: string; emoji: string; bgCard: string }
} = {
  en_attente: {
    label: 'En attente',
    couleur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    emoji: '⏳',
    bgCard: 'from-amber-500/5 to-orange-500/5',
  },
  pre_acceptee: {
    label: 'Vous avez accepté',
    couleur: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    emoji: '👍',
    bgCard: 'from-blue-500/5 to-indigo-500/5',
  },
  pre_refusee: {
    label: 'Vous avez refusé',
    couleur: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    emoji: '👎',
    bgCard: 'from-orange-500/5 to-red-500/5',
  },
  acceptee: {
    label: 'Acceptée par admin',
    couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    emoji: '✅',
    bgCard: 'from-emerald-500/5 to-teal-500/5',
  },
  refusee: {
    label: 'Refusée par admin',
    couleur: 'bg-red-500/20 text-red-300 border-red-500/30',
    emoji: '❌',
    bgCard: 'from-red-500/5 to-rose-500/5',
  },
}

// ============================================================
// CONFIG MATIÈRES
// ============================================================

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

const labelsNiveaux: { [k: string]: string } = {
  primaire: '🎒 Primaire',
  college: '📖 Collège',
  lycee: '🎓 Lycée',
}

const labelsCreneaux: { [k: string]: string } = {
  matin: '🌅 Matin',
  apres_midi: '☀️ Après-midi',
  soir: '🌙 Soir',
}

// ============================================================
// HELPER : Détecter l'urgence
// ============================================================

const estUrgente = (d: Demande): boolean => {
  if (d.statut !== 'en_attente' && d.statut !== 'pre_acceptee') return false
  const diffH = (Date.now() - new Date(d.created_at).getTime()) / 3600000
  return diffH > 24
}

const tempsDepuisCreation = (d: Demande): string => {
  const diffH = (Date.now() - new Date(d.created_at).getTime()) / 3600000
  if (diffH < 1) return 'À l\'instant'
  if (diffH < 24) return `Il y a ${Math.floor(diffH)}h`
  const diffJ = Math.floor(diffH / 24)
  return `Il y a ${diffJ}j`
}

// ============================================================
// HELPER : Conseils Coach IA
// ============================================================

const genererConseils = (demandes: Demande[]): { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  const enAttente = demandes.filter((d) => d.statut === 'en_attente')
  const urgentes = demandes.filter(estUrgente)

  if (urgentes.length > 0) {
    conseils.push({
      emoji: '🚨',
      texte: `${urgentes.length} demande(s) en attente depuis plus de 24h. Répondez vite pour ne pas perdre le client.`,
      priorite: 'haute',
    })
  }

  if (enAttente.length > 0 && enAttente.length <= 3) {
    conseils.push({
      emoji: '📥',
      texte: `Vous avez ${enAttente.length} demande(s) en attente. Un délai de réponse rapide augmente vos chances de 70%.`,
      priorite: 'moyenne',
    })
  }

  if (enAttente.length === 0 && demandes.length > 0) {
    conseils.push({
      emoji: '✨',
      texte: 'Bravo ! Vous avez traité toutes vos demandes. Continuez comme ça !',
      priorite: 'basse',
    })
  }

  // Compter par quartier
  const quartiers: { [k: string]: number } = {}
  demandes.forEach((d) => {
    if (d.parent_quartier) {
      quartiers[d.parent_quartier] = (quartiers[d.parent_quartier] || 0) + 1
    }
  })

  const topQuartier = Object.entries(quartiers)
    .sort((a, b) => b[1] - a[1])[0]

  if (topQuartier && topQuartier[1] >= 3) {
    conseils.push({
      emoji: '📍',
      texte: `Beaucoup de demandes viennent de ${topQuartier[0]}. Assurez-vous d'être disponible dans ce quartier.`,
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

export default function DemandesProfesseur() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [action, setAction] = useState(false)

  const [filtre, setFiltre] = useState<Filtre>('urgentes')
  const [tri, setTri] = useState<Tri>('urgentes')
  const [recherche, setRecherche] = useState('')

  const [detail, setDetail] = useState<Demande | null>(null)
  const [confirmation, setConfirmation] = useState<{
    demande: Demande
    action: 'pre_acceptee' | 'pre_refusee'
  } | null>(null)
  const [motifRefus, setMotifRefus] = useState('')

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
        .eq('professeur_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Demande[] = []

      for (const d of data || []) {
        // Charger info parent
        const { data: parent } = await supabase
          .from('profiles')
          .select('nom_complet, quartier')
          .eq('id', d.parent_id)
          .single()

        complets.push({
          id: d.id,
          parent_id: d.parent_id,
          parent_nom: parent?.nom_complet || 'Parent',
          parent_quartier: parent?.quartier || null,
          matiere: d.matiere || null,
          message: d.message || null,
          statut: d.statut || 'en_attente',
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          niveaux_souhaites: d.niveaux_souhaites || [],
          creneaux_souhaites: d.creneaux_souhaites || [],
          jours_souhaites: d.jours_souhaites || [],
          pre_decision: d.pre_decision || null,
          created_at: d.created_at,
          updated_at: d.updated_at || d.created_at,
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
  // ACTIONS
  // ============================================================

  const preDecider = async () => {
    if (!confirmation) return

    if (confirmation.action === 'pre_refusee' && !motifRefus.trim()) {
      alert('Veuillez indiquer un motif de refus')
      return
    }

    setAction(true)
    try {
      const update: any = {
        pre_decision: confirmation.action,
        statut: confirmation.action,
        updated_at: new Date().toISOString(),
      }

      if (confirmation.action === 'pre_refusee' && motifRefus.trim()) {
        update.motif_refus = motifRefus.trim()
      }

      const { error } = await supabase
        .from('demandes')
        .update(update)
        .eq('id', confirmation.demande.id)

      if (error) throw error

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'pre_decision_prof',
        details: `${confirmation.demande.parent_nom} → ${
          confirmation.action === 'pre_acceptee' ? 'Pré-acceptée' : 'Pré-refusée'
        }${motifRefus ? ` - Motif: ${motifRefus}` : ''}`,
      })

      setSucces(
        confirmation.action === 'pre_acceptee'
          ? '✅ Vous avez accepté cette demande !'
          : '✅ Refus enregistré'
      )
      setTimeout(() => setSucces(''), 4000)

      setConfirmation(null)
      setMotifRefus('')
      setDetail(null)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const annulerPreDecision = async (d: Demande) => {
    if (!confirm('⚠️ Annuler votre pré-décision ? La demande redeviendra "En attente".')) return

    setAction(true)
    try {
      const { error } = await supabase
        .from('demandes')
        .update({
          pre_decision: null,
          statut: 'en_attente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', d.id)

      if (error) throw error

      setSucces('✅ Pré-décision annulée')
      setTimeout(() => setSucces(''), 3000)
      setDetail(null)
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

  const demandesFiltrees = useMemo(() => {
    let resultat = demandes.filter((d) => {
      // Filtre principal
      if (filtre === 'urgentes' && !estUrgente(d)) return false
      if (filtre === 'en_attente' && d.statut !== 'en_attente') return false
      if (filtre === 'pre_acceptee' && d.statut !== 'pre_acceptee') return false
      if (filtre === 'acceptee' && d.statut !== 'acceptee') return false

      // Recherche
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          d.parent_nom.toLowerCase().includes(r) ||
          d.parent_quartier?.toLowerCase().includes(r) ||
          d.matiere?.toLowerCase().includes(r) ||
          d.message?.toLowerCase().includes(r)
        )
      }
      return true
    })

    // Tri
    if (tri === 'urgentes') {
      resultat.sort((a, b) => {
        const ua = estUrgente(a) ? 1 : 0
        const ub = estUrgente(b) ? 1 : 0
        if (ua !== ub) return ub - ua
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
    }
    if (tri === 'recent') resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'prix_eleve') resultat.sort((a, b) => (b.prix_souhaite || 0) - (a.prix_souhaite || 0))
    if (tri === 'prix_bas') resultat.sort((a, b) => (a.prix_souhaite || 0) - (b.prix_souhaite || 0))

    return resultat
  }, [demandes, filtre, tri, recherche])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useMemo(() => {
    return {
      urgente: demandes.filter(estUrgente).length,
      en_attente: demandes.filter((d) => d.statut === 'en_attente').length,
      pre_acceptee: demandes.filter((d) => d.statut === 'pre_acceptee').length,
      acceptee: demandes.filter((d) => d.statut === 'acceptee').length,
      refusee: demandes.filter((d) => d.statut === 'refusee').length,
      total: demandes.length,
    }
  }, [demandes])

  // ============================================================
  // STATS PERSONNELLES
  // ============================================================

  const statsPerso = useMemo(() => {
    const traitees = demandes.filter((d) => d.statut !== 'en_attente')
    const acceptees = demandes.filter((d) => d.statut === 'acceptee' || d.statut === 'pre_acceptee')
    const tauxAcceptation = traitees.length > 0
      ? Math.round((acceptees.length / traitees.length) * 100)
      : 0

    return {
      traitees: traitees.length,
      acceptees: acceptees.length,
      tauxAcceptation,
    }
  }, [demandes])

  const conseils = useMemo(() => genererConseils(demandes), [demandes])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formaterPrix = (n: number) => n.toLocaleString('fr-FR')

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
        <p className="text-slate-500 text-sm">Chargement de vos demandes...</p>
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
        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">📥 Demandes reçues</h1>
                {compte.urgente > 0 && (
                  <span className="flex items-center gap-1 bg-red-500/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black border border-red-300/50 animate-pulse">
                    🚨 {compte.urgente} urgente{compte.urgente > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-sm">
                {compte.total} demande{compte.total > 1 ? 's' : ''} au total ·
                Taux d'acceptation : {statsPerso.tauxAcceptation}%
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-300/40">
              <div className="text-[10px] font-black uppercase text-red-100">🚨 Urgentes</div>
              <div className="text-2xl font-black">{compte.urgente}</div>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-3 border border-amber-300/40">
              <div className="text-[10px] font-black uppercase text-amber-100">⏳ En attente</div>
              <div className="text-2xl font-black">{compte.en_attente}</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 border border-blue-300/40">
              <div className="text-[10px] font-black uppercase text-blue-100">👍 Acceptées</div>
              <div className="text-2xl font-black">{compte.pre_acceptee}</div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-300/40">
              <div className="text-[10px] font-black uppercase text-emerald-100">✅ Validées</div>
              <div className="text-2xl font-black">{compte.acceptee}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">📊 Total</div>
              <div className="text-2xl font-black">{compte.total}</div>
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
      {/* INFO PRÉ-DÉCISION */}
      {/* ============================================================ */}

      {compte.en_attente > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1">
                Comment ça marche ?
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Vous pouvez <strong>pré-accepter</strong> ou <strong>pré-refuser</strong> une
                demande. <strong>Notre équipe valide définitivement</strong> et contactera
                le parent. Le parent n'est notifié qu'après notre validation.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* FILTRES */}
      {/* ============================================================ */}

      <div>
        <div className="text-[10px] text-slate-400 font-black uppercase mb-2 ml-1">
          Filtrer
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { val: 'urgentes', label: '🚨 Urgentes', count: compte.urgente },
              { val: 'en_attente', label: '⏳ En attente', count: compte.en_attente },
              { val: 'pre_acceptee', label: '👍 Mes acceptations', count: compte.pre_acceptee },
              { val: 'acceptee', label: '✅ Validées', count: compte.acceptee },
              { val: 'toutes', label: '📋 Toutes', count: compte.total },
            ] as { val: Filtre; label: string; count: number }[]
          ).map((f) => (
            <button
              key={f.val}
              onClick={() => setFiltre(f.val)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                filtre === f.val
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RECHERCHE + TRI */}
      {/* ============================================================ */}

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
          <option value="urgentes">🚨 Urgentes d'abord</option>
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="prix_eleve">💰 Prix élevé</option>
          <option value="prix_bas">💰 Prix bas</option>
        </select>
      </div>

      {/* Compteur */}
      <div className="text-sm text-slate-400">
        <span className="font-bold text-white">{demandesFiltrees.length}</span> résultat
        {demandesFiltrees.length > 1 ? 's' : ''}
      </div>

      {/* ============================================================ */}
      {/* LISTE */}
      {/* ============================================================ */}

      {demandesFiltrees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">
            {demandes.length === 0 ? 'Aucune demande' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm">
            {demandes.length === 0
              ? 'Vous n\'avez pas encore reçu de demandes.'
              : 'Aucune demande ne correspond à ce filtre.'}
          </p>
          {filtre !== 'toutes' && demandes.length > 0 && (
            <button
              onClick={() => setFiltre('toutes')}
              className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-sm border border-blue-500/30"
            >
              Voir toutes les demandes
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {demandesFiltrees.map((d, i) => {
            const statut = labelsStatut[d.statut] || labelsStatut.en_attente
            const urgent = estUrgente(d)
            const peutDecider = d.statut === 'en_attente'

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  urgent
                    ? 'bg-red-500/10 border-red-500/40'
                    : d.statut === 'acceptee'
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : d.statut === 'pre_acceptee'
                    ? 'bg-blue-500/5 border-blue-500/30'
                    : 'bg-slate-800/70 border-white/10 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Avatar parent */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg ${
                        urgent
                          ? 'bg-gradient-to-br from-red-500 to-orange-600 animate-pulse'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}
                    >
                      {urgent ? '🚨' : '👨‍👩‍👧'}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statut.couleur}`}
                      >
                        {statut.emoji} {statut.label.toUpperCase()}
                      </span>
                      {urgent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-500 text-white animate-pulse">
                          🚨 URGENT — {tempsDepuisCreation(d)}
                        </span>
                      )}
                      {!urgent && (
                        <span className="text-[10px] text-slate-500">
                          {tempsDepuisCreation(d)}
                        </span>
                      )}
                    </div>

                    <div className="font-black text-white text-base mb-1">
                      {d.parent_nom}
                    </div>
                    <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                      {d.parent_quartier && <div>📍 {d.parent_quartier}</div>}
                      <div>📅 {formaterDate(d.created_at)}</div>
                    </div>

                    {/* Grille infos */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">👶 ENFANTS</div>
                        <div className="text-white font-bold">{d.nombre_enfants}</div>
                      </div>
                      <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                        <div className="text-[9px] text-amber-300 font-black">💰 PRIX</div>
                        <div className="text-white font-bold text-sm">
                          {d.prix_souhaite ? `${formaterPrix(d.prix_souhaite)}` : '—'}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">📚 MATIÈRE</div>
                        <div className="text-white font-bold text-xs truncate">
                          {d.matiere ? labelsMatieres[d.matiere] || d.matiere : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Niveaux */}
                    {d.niveaux_souhaites.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {d.niveaux_souhaites.slice(0, 4).map((n) => (
                          <span
                            key={n}
                            className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold"
                          >
                            {labelsNiveaux[n] || n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(d)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      👁️ Détails
                    </button>

                    {peutDecider && (
                      <>
                        <button
                          onClick={() =>
                            setConfirmation({ demande: d, action: 'pre_acceptee' })
                          }
                          disabled={action}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                          {action ? '⏳...' : '👍 Accepter'}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmation({ demande: d, action: 'pre_refusee' })
                            setMotifRefus('')
                          }}
                          disabled={action}
                          className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl font-bold text-xs border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                        >
                          👎 Refuser
                        </button>
                      </>
                    )}

                    {d.statut === 'pre_acceptee' && (
                      <button
                        onClick={() => annulerPreDecision(d)}
                        disabled={action}
                        className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-xl font-bold text-xs border border-orange-500/30 hover:bg-orange-500/30 disabled:opacity-50"
                      >
                        ↩️ Annuler
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* STATS PERSONNELLES */}
      {/* ============================================================ */}

      {demandes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
              📊
            </div>
            <div>
              <h3 className="font-black text-slate-900">Mes performances</h3>
              <p className="text-[10px] text-slate-500">Basé sur vos demandes traitées</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
              <div className="text-[10px] font-black text-blue-700 uppercase">Traitées</div>
              <div className="text-2xl font-black text-slate-900">{statsPerso.traitees}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200">
              <div className="text-[10px] font-black text-emerald-700 uppercase">Acceptées</div>
              <div className="text-2xl font-black text-slate-900">{statsPerso.acceptees}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
              <div className="text-[10px] font-black text-purple-700 uppercase">Taux accept.</div>
              <div className="text-2xl font-black text-slate-900">{statsPerso.tauxAcceptation}%</div>
            </div>
          </div>
        </motion.div>
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
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-white/10 my-8"
            >
              <div className={`p-6 rounded-t-3xl bg-gradient-to-r ${
                detail.statut === 'acceptee'
                  ? 'from-emerald-600 to-teal-700'
                  : detail.statut === 'pre_acceptee'
                  ? 'from-blue-600 to-indigo-700'
                  : estUrgente(detail)
                  ? 'from-red-600 to-orange-700'
                  : 'from-indigo-600 to-purple-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">📩 Détail de la demande</h2>
                    <p className="text-xs text-white/80 mt-1">
                      {tempsDepuisCreation(detail)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Parent */}
                <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-xs font-black text-blue-300 mb-2">👨‍👩‍👧 PARENT</div>
                  <div className="text-white font-bold mb-1">{detail.parent_nom}</div>
                  {detail.parent_quartier && (
                    <div className="text-xs text-slate-300">📍 {detail.parent_quartier}</div>
                  )}
                </div>

                {/* Détails */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">📋 DÉTAILS</div>
                  <div className="text-xs text-slate-300 space-y-2">
                    <div>
                      <strong className="text-white">Enfants :</strong> {detail.nombre_enfants}
                    </div>
                    <div>
                      <strong className="text-white">Matière :</strong>{' '}
                      {detail.matiere ? labelsMatieres[detail.matiere] || detail.matiere : '—'}
                    </div>
                    <div>
                      <strong className="text-white">Prix souhaité :</strong>{' '}
                      {detail.prix_souhaite ? `${formaterPrix(detail.prix_souhaite)} DJF` : '—'}
                    </div>
                    {detail.niveaux_souhaites.length > 0 && (
                      <div>
                        <strong className="text-white">Niveaux :</strong>{' '}
                        {detail.niveaux_souhaites.map((n) => labelsNiveaux[n] || n).join(', ')}
                      </div>
                    )}
                    {detail.creneaux_souhaites.length > 0 && (
                      <div>
                        <strong className="text-white">Créneaux :</strong>{' '}
                        {detail.creneaux_souhaites
                          .map((c) => labelsCreneaux[c] || c)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                {detail.message && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-xs font-black text-white mb-2">💬 MESSAGE DU PARENT</div>
                    <p className="text-sm text-slate-200 italic whitespace-pre-line leading-relaxed">
                      « {detail.message} »
                    </p>
                  </div>
                )}

                {/* Note confidentialité */}
                <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-3">
                  <p className="text-[10px] text-amber-200">
                    🔒 Le téléphone et l'adresse exacte du parent ne sont pas visibles.
                    Notre équipe vous les communiquera après validation.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-white/10 flex gap-3 flex-wrap">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Fermer
                </button>
                {detail.statut === 'en_attente' && (
                  <>
                    <button
                      onClick={() => {
                        setConfirmation({ demande: detail, action: 'pre_refusee' })
                        setMotifRefus('')
                        setDetail(null)
                      }}
                      className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      👎 Refuser
                    </button>
                    <button
                      onClick={() => {
                        setConfirmation({ demande: detail, action: 'pre_acceptee' })
                        setDetail(null)
                      }}
                      className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg"
                    >
                      👍 Accepter
                    </button>
                  </>
                )}
                {detail.statut === 'pre_acceptee' && (
                  <button
                    onClick={() => annulerPreDecision(detail)}
                    disabled={action}
                    className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    ↩️ Annuler ma pré-décision
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL CONFIRMATION */}
      {/* ============================================================ */}

      <AnimatePresence>
        {confirmation && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setConfirmation(null)
              setMotifRefus('')
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div
                className={`p-6 ${
                  confirmation.action === 'pre_acceptee'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                    : 'bg-gradient-to-r from-red-600 to-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {confirmation.action === 'pre_acceptee'
                        ? '👍 Accepter la demande'
                        : '👎 Refuser la demande'}
                    </h2>
                    <p className="text-xs text-white/80 mt-1">
                      {confirmation.demande.parent_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmation(null)
                      setMotifRefus('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div
                  className={`border-l-4 p-4 rounded-xl ${
                    confirmation.action === 'pre_acceptee'
                      ? 'bg-emerald-500/10 border-emerald-500'
                      : 'bg-red-500/10 border-red-500'
                  }`}
                >
                  <p
                    className={`text-xs ${
                      confirmation.action === 'pre_acceptee'
                        ? 'text-emerald-200'
                        : 'text-red-200'
                    }`}
                  >
                    {confirmation.action === 'pre_acceptee'
                      ? '✅ Votre pré-acceptation sera transmise à notre équipe qui validera définitivement et contactera le parent.'
                      : '⚠️ Le parent recevra un refus avec votre motif. Notre équipe en sera notifiée.'}
                  </p>
                </div>

                {confirmation.action === 'pre_refusee' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      Motif du refus <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={motifRefus}
                      onChange={(e) => setMotifRefus(e.target.value)}
                      rows={4}
                      maxLength={300}
                      placeholder="Ex : Tarif trop bas, zone trop éloignée, indisponible..."
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-red-500/30 rounded-xl text-white outline-none focus:border-red-500 resize-none text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">{motifRefus.length}/300</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setConfirmation(null)
                      setMotifRefus('')
                    }}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={preDecider}
                    disabled={action || (confirmation.action === 'pre_refusee' && !motifRefus.trim())}
                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${
                      confirmation.action === 'pre_acceptee'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                        : 'bg-gradient-to-r from-red-600 to-red-700'
                    }`}
                  >
                    {action ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Envoi...
                      </span>
                    ) : confirmation.action === 'pre_acceptee' ? (
                      '✓ Confirmer acceptation'
                    ) : (
                      '✓ Confirmer refus'
                    )}
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