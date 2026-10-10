'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfActif = {
  id: string
  professeur_id: string
  demande_id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  matiere: string | null
  note_moyenne: number
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  created_at: string
  mois_avec_client: number
  suivi_actuel: {
    id: string
    mois: string
    note: number | null
    appreciation: string | null
    points_forts: string | null
    points_ameliorer: string | null
  } | null
  historique_notes: { mois: string; note: number }[]
  deja_noté_par_parent: boolean
}

type Filtre = 'tous' | 'recents' | 'long_terme' | 'top_notes'
type Tri = 'recent' | 'ancien' | 'note_haute' | 'mois_eleve' | 'matiere'

// ============================================================
// CONFIG
// ============================================================

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

// ============================================================
// HELPER : Mois en cours
// ============================================================

const getMoisActuel = (): string => {
  const d = new Date()
  const mois = d.toLocaleDateString('fr-FR', { month: 'long' })
  return `${mois.charAt(0).toUpperCase() + mois.slice(1)} ${d.getFullYear()}`
}

// ============================================================
// HELPER : Fidélité prof
// ============================================================

const getFidelite = (mois: number): {
  emoji: string
  label: string
  couleur: string
} => {
  if (mois >= 12) return { emoji: '👑', label: 'Légende', couleur: 'from-amber-500 to-orange-600' }
  if (mois >= 6) return { emoji: '💎', label: 'Fidèle', couleur: 'from-emerald-500 to-teal-600' }
  if (mois >= 3) return { emoji: '⭐', label: 'Régulier', couleur: 'from-blue-500 to-indigo-600' }
  return { emoji: '🌱', label: 'Nouveau', couleur: 'from-purple-500 to-pink-600' }
}

// ============================================================
// HELPER : Couleur note
// ============================================================

const getCouleurNote = (note: number | null): {
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
    return { couleur: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent', emoji: '🌟' }
  }
  if (note >= 12) {
    return { couleur: 'text-blue-600', bg: 'bg-blue-50', label: 'Bien', emoji: '✅' }
  }
  if (note >= 10) {
    return { couleur: 'text-amber-600', bg: 'bg-amber-50', label: 'Moyen', emoji: '📊' }
  }
  return { couleur: 'text-red-600', bg: 'bg-red-50', label: 'À améliorer', emoji: '⚠️' }
}

// ============================================================
// HELPER : Coach IA
// ============================================================

const genererConseils = (profs: ProfActif[]): {
  emoji: string
  texte: string
  priorite: 'haute' | 'moyenne' | 'basse'
}[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  if (profs.length === 0) {
    conseils.push({
      emoji: '🔍',
      texte: 'Vous n\'avez pas encore de prof actif. Commencez par envoyer une demande.',
      priorite: 'haute',
    })
    return conseils
  }

  const moisActuel = getMoisActuel()
  const sansSuivi = profs.filter((p) => !p.suivi_actuel || p.suivi_actuel.mois !== moisActuel)

  if (sansSuivi.length > 0) {
    conseils.push({
      emoji: '📊',
      texte: `${sansSuivi.length} prof${sansSuivi.length > 1 ? 's' : ''} n'ont pas encore publié le suivi de ${moisActuel}. Contactez-les.`,
      priorite: 'haute',
    })
  }

  const aNoter = profs.filter((p) => !p.deja_noté_par_parent)
  if (aNoter.length > 0) {
    conseils.push({
      emoji: '⭐',
      texte: `Vous pouvez laisser un avis sur ${aNoter.length} prof${aNoter.length > 1 ? 's' : ''}. Cela les aide beaucoup !`,
      priorite: 'moyenne',
    })
  }

  const fideles = profs.filter((p) => p.mois_avec_client >= 6)
  if (fideles.length > 0) {
    conseils.push({
      emoji: '💎',
      texte: `${fideles.length} prof${fideles.length > 1 ? 's' : ''} vous accompagne${fideles.length > 1 ? 'nt' : ''} depuis plus de 6 mois. Excellent travail !`,
      priorite: 'basse',
    })
  }

  const avecNote = profs.filter((p) => p.suivi_actuel?.note && p.suivi_actuel.note >= 16)
  if (avecNote.length > 0) {
    conseils.push({
      emoji: '🎉',
      texte: `${avecNote.length} prof${avecNote.length > 1 ? 's' : ''} excellent${avecNote.length > 1 ? 's' : ''} ce mois-ci. Continuez la collaboration !`,
      priorite: 'basse',
    })
  }

  if (conseils.length === 0) {
    conseils.push({
      emoji: '✨',
      texte: 'Tout va bien avec vos profs ! Continuez comme ça.',
      priorite: 'basse',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// COMPOSANT
// ============================================================

export default function MesProfs() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [profs, setProfs] = useState<ProfActif[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [historiqueModal, setHistoriqueModal] = useState<ProfActif | null>(null)

  const moisActuel = getMoisActuel()

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

      // 1. Charger les demandes acceptées
      const { data: demandes, error: demandesErr } = await supabase
        .from('demandes')
        .select('*')
        .eq('parent_id', user.id)
        .eq('statut', 'acceptee')
        .order('created_at', { ascending: false })

      if (demandesErr) throw demandesErr

      const profsComplets: ProfActif[] = []

      for (const d of demandes || []) {
        // 2. Infos prof
        const [profRes, profInfoRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nom_complet, photo_url, quartier')
            .eq('id', d.professeur_id)
            .single(),
          supabase
            .from('professeurs')
            .select('note_moyenne, etoiles, badge_admin, pionnier, pionnier_illustre, photo_profil_url')
            .eq('id', d.professeur_id)
            .single(),
        ])

        // 3. Suivi du mois actuel
        const { data: suiviActuel } = await supabase
          .from('suivi_mensuel')
          .select('id, mois, note, appreciation, points_forts, points_ameliorer')
          .eq('demande_id', d.id)
          .eq('mois', moisActuel)
          .maybeSingle()

        // 4. Historique des notes
        const { data: historique } = await supabase
          .from('suivi_mensuel')
          .select('mois, note')
          .eq('demande_id', d.id)
          .not('note', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6)

        // 5. Vérifier si parent a déjà noté ce prof
        const { data: avisExistant } = await supabase
          .from('avis')
          .select('id')
          .eq('parent_id', user.id)
          .eq('professeur_id', d.professeur_id)
          .maybeSingle()

        // 6. Calculer les mois
        const dateDebut = new Date(d.created_at)
        const maintenant = new Date()
        const moisEcoules =
          (maintenant.getFullYear() - dateDebut.getFullYear()) * 12 +
          (maintenant.getMonth() - dateDebut.getMonth())

        profsComplets.push({
          id: d.id,
          professeur_id: d.professeur_id,
          demande_id: d.id,
          nom_complet: profRes.data?.nom_complet || 'Prof',
          photo_url: profInfoRes.data?.photo_profil_url || profRes.data?.photo_url || null,
          quartier: profRes.data?.quartier || null,
          matiere: d.matiere,
          note_moyenne: Number(profInfoRes.data?.note_moyenne) || 0,
          etoiles: profInfoRes.data?.etoiles || 0,
          badge_admin: profInfoRes.data?.badge_admin || null,
          pionnier: profInfoRes.data?.pionnier === true,
          pionnier_illustre: profInfoRes.data?.pionnier_illustre === true,
          created_at: d.created_at,
          mois_avec_client: moisEcoules,
          suivi_actuel: suiviActuel || null,
          historique_notes: (historique || []).map((h) => ({
            mois: h.mois,
            note: Number(h.note),
          })),
          deja_noté_par_parent: !!avisExistant,
        })
      }

      setProfs(profsComplets)
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase, moisActuel])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      // Filtre
      if (filtre === 'recents' && p.mois_avec_client >= 3) return false
      if (filtre === 'long_terme' && p.mois_avec_client < 6) return false
      if (filtre === 'top_notes' && p.note_moyenne < 4.5) return false

      // Recherche
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r) ||
          p.matiere?.toLowerCase().includes(r)
        )
      }
      return true
    })

    // Tri
    if (tri === 'recent')
      resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien')
      resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'note_haute') resultat.sort((a, b) => b.note_moyenne - a.note_moyenne)
    if (tri === 'mois_eleve') resultat.sort((a, b) => b.mois_avec_client - a.mois_avec_client)
    if (tri === 'matiere') resultat.sort((a, b) => (a.matiere || '').localeCompare(b.matiere || ''))

    return resultat
  }, [profs, filtre, tri, recherche])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const total = profs.length
    const moyenneNotes =
      profs.filter((p) => p.note_moyenne > 0).length > 0
        ? profs.filter((p) => p.note_moyenne > 0).reduce((acc, p) => acc + p.note_moyenne, 0) /
          profs.filter((p) => p.note_moyenne > 0).length
        : 0
    const moisCumules = profs.reduce((acc, p) => acc + p.mois_avec_client, 0)
    const suiviAJour = profs.filter((p) => p.suivi_actuel && p.suivi_actuel.mois === moisActuel).length

    return { total, moyenneNotes, moisCumules, suiviAJour }
  }, [profs, moisActuel])

  const compte = useMemo(() => {
    return {
      tous: profs.length,
      recents: profs.filter((p) => p.mois_avec_client < 3).length,
      long_terme: profs.filter((p) => p.mois_avec_client >= 6).length,
      top_notes: profs.filter((p) => p.note_moyenne >= 4.5).length,
    }
  }, [profs])

  const conseils = useMemo(() => genererConseils(profs), [profs])

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
        <p className="text-slate-500 text-sm">Chargement de vos profs...</p>
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
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-2 border-white/30 flex-shrink-0">
              👨‍🏫
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                Mon équipe éducative
              </div>
              <h1 className="text-3xl md:text-4xl font-black">
                Mes professeurs
              </h1>
            </div>
          </div>
          <p className="text-emerald-100 text-sm mb-5">
            {stats.total} prof{stats.total > 1 ? 's' : ''} actif{stats.total > 1 ? 's' : ''} qui accompagne{stats.total > 1 ? 'nt' : ''} vos enfants
          </p>

          {/* 4 KPI dans le header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                👥 Total profs
              </div>
              <div className="text-2xl font-black">{stats.total}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                ⭐ Note moy.
              </div>
              <div className="text-2xl font-black">
                {stats.moyenneNotes > 0 ? stats.moyenneNotes.toFixed(1) : '—'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                📅 Mois cumulés
              </div>
              <div className="text-2xl font-black">{stats.moisCumules}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                ✅ Suivi à jour
              </div>
              <div className="text-2xl font-black">
                {stats.suiviAJour}/{stats.total}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* MESSAGE ALERTE SUIVI */}
      {/* ============================================================ */}

      {stats.total > 0 && stats.suiviAJour < stats.total && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-4 flex items-start gap-3"
        >
          <span className="text-2xl flex-shrink-0">⏳</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 mb-1">
              {stats.total - stats.suiviAJour} suivi{stats.total - stats.suiviAJour > 1 ? 's' : ''} en attente pour {moisActuel}
            </p>
            <p className="text-xs text-amber-800">
              Vos profs n'ont pas encore publié le suivi de ce mois. Ils le feront bientôt.
            </p>
          </div>
        </motion.div>
      )}

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
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Aucun prof actif
          </h2>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Vous n'avez pas encore de professeur accepté. Envoyez votre première demande pour commencer.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/espace-parent/recherche"
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              🔍 Trouver un prof
            </Link>
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors inline-flex items-center gap-2"
            >
              💬 Demander conseil
            </a>
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
                { val: 'tous', label: '👥 Tous', count: compte.tous },
                { val: 'recents', label: '🌱 Récents (-3 mois)', count: compte.recents },
                { val: 'long_terme', label: '💎 Long terme (6+)', count: compte.long_terme },
                { val: 'top_notes', label: '⭐ Top notes (4.5+)', count: compte.top_notes },
              ] as { val: Filtre; label: string; count: number }[]
            ).map((f) => (
              <button
                key={f.val}
                onClick={() => setFiltre(f.val)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  filtre === f.val
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-700 text-white shadow-lg'
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
                placeholder="Rechercher par nom, matière ou quartier..."
                className="w-full pl-12 pr-4 py-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white font-medium transition-all"
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
              className="px-4 py-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-bold outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="recent">📅 Plus récent</option>
              <option value="ancien">📅 Plus ancien</option>
              <option value="note_haute">⭐ Meilleure note</option>
              <option value="mois_eleve">⏰ Plus de mois</option>
              <option value="matiere">📚 Par matière</option>
            </select>
          </motion.div>

          {/* Compteur résultats */}
          {(recherche || filtre !== 'tous') && (
            <div className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{profsFiltres.length}</span>{' '}
              résultat{profsFiltres.length > 1 ? 's' : ''}
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
                    Conseils personnalisés
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
        </>
      )}

      {/* ============================================================ */}
      {/* LISTE DES PROFS */}
      {/* ============================================================ */}

      {stats.total > 0 && profsFiltres.length === 0 && (
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
            Aucun prof ne correspond à vos critères.
          </p>
          <button
            onClick={() => {
              setRecherche('')
              setFiltre('tous')
            }}
            className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            ✕ Réinitialiser les filtres
          </button>
        </motion.div>
      )}

      {profsFiltres.length > 0 && (
        <div className="space-y-4">
          {profsFiltres.map((p, i) => {
            const fidelite = getFidelite(p.mois_avec_client)
            const infoNote = getCouleurNote(p.suivi_actuel?.note || null)
            const suiviAJour = p.suivi_actuel && p.suivi_actuel.mois === moisActuel

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
                whileHover={{ y: -3 }}
                className={`bg-white/90 backdrop-blur-xl rounded-3xl p-6 border-2 transition-all ${
                  suiviAJour
                    ? 'border-slate-200 hover:border-emerald-400'
                    : 'border-amber-200 hover:border-amber-400'
                }`}
              >
                {/* Header prof */}
                <div className="flex items-start gap-4 flex-wrap mb-4">
                  <div className="relative flex-shrink-0">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.nom_complet}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl shadow-lg">
                        👨‍🏫
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${fidelite.couleur} flex items-center justify-center text-white text-sm border-2 border-white shadow-lg`}
                      title={fidelite.label}
                    >
                      {fidelite.emoji}
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-black text-slate-900 text-lg">
                        {p.nom_complet}
                      </h3>
                      <span
                        className={`text-[10px] bg-gradient-to-r ${fidelite.couleur} text-white px-2 py-0.5 rounded-full font-black`}
                      >
                        {fidelite.emoji} {fidelite.label.toUpperCase()}
                      </span>
                      {p.pionnier_illustre && (
                        <span className="text-[10px] bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-0.5 rounded-full font-black">
                          👑 ILLUSTRE
                        </span>
                      )}
                      {p.badge_admin === 'super_pro' && !p.pionnier_illustre && (
                        <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-600 text-white px-2 py-0.5 rounded-full font-black">
                          👑 SUPER-PRO
                        </span>
                      )}
                      {p.badge_admin === 'recommande' && !p.pionnier_illustre && (
                        <span className="text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded-full font-black">
                          🏅 RECOMMANDÉ
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2">
                      {p.etoiles > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-amber-400">{'⭐'.repeat(p.etoiles)}</span>
                          {p.note_moyenne > 0 && (
                            <span className="font-black text-slate-900">
                              {p.note_moyenne.toFixed(1)}
                            </span>
                          )}
                        </span>
                      )}
                      {p.quartier && (
                        <>
                          <span>•</span>
                          <span>📍 {p.quartier}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>📅 {p.mois_avec_client} mois ensemble</span>
                    </div>

                    {p.matiere && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {p.matiere.split(', ').slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold border border-blue-200"
                          >
                            📚 {LABELS_MATIERES[m.trim()] || m.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500">
                      ✓ Depuis {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Suivi du mois */}
                <div className={`rounded-2xl p-4 border-2 mb-4 ${suiviAJour ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="text-xs font-black text-slate-700 uppercase">
                      📊 Suivi de {moisActuel}
                    </div>
                    {suiviAJour ? (
                      <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">
                        ✓ PUBLIÉ
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                        ⏳ EN ATTENTE
                      </span>
                    )}
                  </div>

                  {suiviAJour && p.suivi_actuel ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`${infoNote.bg} rounded-xl px-4 py-2 border border-slate-200`}>
                          <div className="text-[9px] text-slate-500 font-black uppercase">
                            Note du mois
                          </div>
                          <div className={`text-2xl font-black ${infoNote.couleur}`}>
                            {p.suivi_actuel.note || '—'}/20
                          </div>
                        </div>
                        <div className={`${infoNote.bg} rounded-xl px-4 py-2 border border-slate-200 flex-1`}>
                          <div className="text-[9px] text-slate-500 font-black uppercase">
                            Appréciation
                          </div>
                          <div className={`text-sm font-bold ${infoNote.couleur}`}>
                            {infoNote.emoji} {infoNote.label}
                          </div>
                        </div>
                      </div>

                      {p.suivi_actuel.appreciation && (
                        <div className="bg-white rounded-xl p-3 border border-slate-200">
                          <div className="text-[10px] text-slate-500 font-black mb-1 uppercase">
                            💬 Commentaire du prof
                          </div>
                          <p className="text-xs text-slate-700 italic leading-relaxed">
                            « {p.suivi_actuel.appreciation} »
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-600 italic">
                      Le prof n'a pas encore publié le suivi de ce mois. Contactez-le pour avoir des nouvelles.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <a
                    href={`https://wa.me/25377741482?text=${encodeURIComponent(`Bonjour, je suis le parent de ${p.nom_complet}, pouvez-vous me donner des nouvelles sur la progression de mon enfant ?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1"
                  >
                    💬 WhatsApp
                  </a>
                  <Link
                    href={`/espace-parent/profils/${p.professeur_id}`}
                    className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  >
                    👁️ Voir profil
                  </Link>
                  {p.historique_notes.length > 0 && (
                    <button
                      onClick={() => setHistoriqueModal(p)}
                      className="px-4 py-2.5 bg-purple-50 text-purple-700 rounded-xl font-bold text-xs border border-purple-200 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                    >
                      📊 Historique
                    </button>
                  )}
                  <Link
                    href="/espace-parent/avis"
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center gap-1 ${
                      p.deja_noté_par_parent
                        ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {p.deja_noté_par_parent ? '✓ Avis envoyé' : '⭐ Laisser avis'}
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* CTA TROUVER PLUS DE PROFS */}
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
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="text-xl md:text-2xl font-black mb-3">
              Besoin d'un autre prof ?
            </h2>
            <p className="text-sm text-blue-100 mb-5 max-w-lg mx-auto">
              Vous cherchez un prof pour une autre matière ou un autre niveau ?
              Trouvez-le en quelques clics.
            </p>
            <Link
              href="/espace-parent/recherche"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              🔍 Voir tous les profs
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
              Une question sur vos profs ?
            </h3>
            <p className="text-xs text-emerald-100 mb-3">
              Notre équipe est disponible 7j/7 pour vous accompagner et gérer
              toute situation.
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
      {/* MODAL HISTORIQUE DES NOTES */}
      {/* ============================================================ */}

      <AnimatePresence>
        {historiqueModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setHistoriqueModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {historiqueModal.photo_url ? (
                      <img
                        src={historiqueModal.photo_url}
                        alt={historiqueModal.nom_complet}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                        👨‍🏫
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-white">
                        📊 Historique des notes
                      </h2>
                      <p className="text-xs text-purple-100 mt-1">
                        {historiqueModal.nom_complet}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHistoriqueModal(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Graphique en barres */}
                {historiqueModal.historique_notes.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
                    <div className="text-xs font-black text-slate-600 uppercase mb-4">
                      📈 Évolution sur les derniers mois
                    </div>
                    <div className="flex items-end justify-between gap-2 h-32">
                      {[...historiqueModal.historique_notes].reverse().map((h, i) => {
                        const info = getCouleurNote(h.note)
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center group"
                          >
                            <div className="text-[10px] font-black text-slate-600 mb-1 opacity-70">
                              {h.note}
                            </div>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${Math.max((h.note / 20) * 100, 4)}%`,
                              }}
                              transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                              className={`w-full bg-gradient-to-t ${
                                h.note >= 16
                                  ? 'from-emerald-600 to-emerald-400'
                                  : h.note >= 12
                                  ? 'from-blue-600 to-blue-400'
                                  : h.note >= 10
                                  ? 'from-amber-600 to-amber-400'
                                  : 'from-red-600 to-red-400'
                              } rounded-t-md`}
                            />
                            <div className="text-[9px] text-slate-500 font-bold mt-1 text-center truncate w-full">
                              {h.mois.split(' ')[0].slice(0, 3)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Liste détaillée */}
                <div>
                  <div className="text-xs font-black text-slate-600 uppercase mb-3">
                    📅 Détail mois par mois
                  </div>
                  <div className="space-y-2">
                    {historiqueModal.historique_notes.map((h, i) => {
                      const info = getCouleurNote(h.note)
                      return (
                        <div
                          key={i}
                          className={`${info.bg} rounded-xl p-3 border border-slate-200 flex items-center gap-3`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                            {info.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-900 text-sm">
                              {h.mois}
                            </div>
                            <div className={`text-[10px] font-bold ${info.couleur}`}>
                              {info.label}
                            </div>
                          </div>
                          <div className={`text-2xl font-black ${info.couleur}`}>
                            {h.note}/20
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Moyenne */}
                {historiqueModal.historique_notes.length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white text-center">
                    <div className="text-xs font-black uppercase opacity-90 mb-1">
                      🎯 Moyenne globale
                    </div>
                    <div className="text-3xl font-black">
                      {(
                        historiqueModal.historique_notes.reduce(
                          (acc, h) => acc + h.note,
                          0
                        ) / historiqueModal.historique_notes.length
                      ).toFixed(1)}
                      /20
                    </div>
                    <div className="text-[10px] opacity-90 mt-1">
                      Sur {historiqueModal.historique_notes.length} mois
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setHistoriqueModal(null)}
                  className="w-full py-3 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 transition-colors"
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