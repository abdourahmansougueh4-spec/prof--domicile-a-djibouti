'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Categorie = 'primaire' | 'college' | 'lycee' | 'langues' | 'coran'

type Matiere = {
  val: string
  label: string
  emoji: string
  categorie: Categorie
  bacSRequis: boolean
  populaire?: boolean
}

type LangueParlee = {
  val: string
  label: string
  emoji: string
}

// ============================================================
// CATALOGUE MATIÈRES
// ============================================================

const MATIERES: Matiere[] = [
  // PRIMAIRE
  { val: 'primaire_fr', label: 'Primaire — Toutes matières FR', emoji: '🎒', categorie: 'primaire', bacSRequis: false, populaire: true },
  { val: 'primaire_ar', label: 'Primaire — Arabe', emoji: '📖', categorie: 'primaire', bacSRequis: false },

  // COLLÈGE
  { val: 'college_maths', label: 'Collège — Maths', emoji: '📐', categorie: 'college', bacSRequis: true, populaire: true },
  { val: 'college_physique', label: 'Collège — Physique-Chimie', emoji: '⚗️', categorie: 'college', bacSRequis: true },
  { val: 'college_svt', label: 'Collège — SVT', emoji: '🌱', categorie: 'college', bacSRequis: true },
  { val: 'college_francais', label: 'Collège — Français', emoji: '📚', categorie: 'college', bacSRequis: false, populaire: true },
  { val: 'college_anglais', label: 'Collège — Anglais', emoji: '🇬🇧', categorie: 'college', bacSRequis: false, populaire: true },
  { val: 'college_arabe', label: 'Collège — Arabe', emoji: '📖', categorie: 'college', bacSRequis: false },

  // LYCÉE
  { val: 'lycee_maths', label: 'Lycée — Maths', emoji: '🎓', categorie: 'lycee', bacSRequis: true },

  // LANGUES
  { val: 'francais', label: 'Français', emoji: '🇫🇷', categorie: 'langues', bacSRequis: false, populaire: true },
  { val: 'anglais', label: 'Anglais', emoji: '🇬🇧', categorie: 'langues', bacSRequis: false, populaire: true },
  { val: 'arabe', label: 'Arabe', emoji: '📖', categorie: 'langues', bacSRequis: false, populaire: true },

  // CORAN
  { val: 'coran', label: 'Coran', emoji: '🕌', categorie: 'coran', bacSRequis: false, populaire: true },
]

const LANGUES_PARLEES: LangueParlee[] = [
  { val: 'francais', label: 'Français', emoji: '🇫🇷' },
  { val: 'arabe', label: 'Arabe', emoji: '📖' },
  { val: 'somali', label: 'Somali', emoji: '🇸🇴' },
  { val: 'afar', label: 'Afar', emoji: '🌍' },
  { val: 'anglais', label: 'Anglais', emoji: '🇬🇧' },
]

// ============================================================
// CONFIG CATÉGORIES
// ============================================================

const CATEGORIES: { val: Categorie; label: string; emoji: string; couleur: string; description: string }[] = [
  { val: 'primaire', label: 'Primaire', emoji: '🎒', couleur: 'from-blue-500 to-blue-600', description: 'Maternelle et primaire' },
  { val: 'college', label: 'Collège', emoji: '📖', couleur: 'from-indigo-500 to-indigo-600', description: '6ème à 3ème' },
  { val: 'lycee', label: 'Lycée', emoji: '🎓', couleur: 'from-purple-500 to-purple-600', description: 'Seconde à Terminale' },
  { val: 'langues', label: 'Langues', emoji: '🌍', couleur: 'from-emerald-500 to-emerald-600', description: 'Langues étrangères' },
  { val: 'coran', label: 'Coran', emoji: '🕌', couleur: 'from-amber-500 to-orange-600', description: 'Enseignement religieux' },
]

// ============================================================
// HELPER : Coach IA
// ============================================================

const genererConseils = (
  matieres: string[],
  langues: string[],
  aBacS: boolean,
  typeProf: string | null
): { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  if (matieres.length === 0) {
    conseils.push({
      emoji: '🚨',
      texte: 'Sélectionnez au moins 1 matière pour être visible auprès des parents.',
      priorite: 'haute',
    })
    return conseils
  }

  if (matieres.length === 1) {
    conseils.push({
      emoji: '📚',
      texte: 'Ajoutez d\'autres matières pour multiplier vos chances de recevoir des demandes.',
      priorite: 'moyenne',
    })
  }

  if (langues.length === 0) {
    conseils.push({
      emoji: '🌍',
      texte: 'Ajoutez les langues que vous parlez. Les parents cherchent souvent selon la langue maternelle.',
      priorite: 'moyenne',
    })
  }

  // Vérifier Bac S
  const aScientifique = matieres.some((m) => {
    const mat = MATIERES.find((x) => x.val === m)
    return mat?.bacSRequis
  })

  if (aScientifique && !aBacS) {
    conseils.push({
      emoji: '⚠️',
      texte: 'Vous avez sélectionné des matières scientifiques mais vous n\'avez pas le Bac S. Ajoutez-le dans vos documents.',
      priorite: 'haute',
    })
  }

  if (aBacS && !aScientifique) {
    conseils.push({
      emoji: '🎓',
      texte: 'Vous avez le Bac S ! N\'hésitez pas à ajouter des matières scientifiques (Maths, Physique, SVT).',
      priorite: 'moyenne',
    })
  }

  // Selon type prof
  if (typeProf === 'coran' && !matieres.includes('coran')) {
    conseils.push({
      emoji: '🕌',
      texte: 'En tant qu\'enseignant Coran, sélectionnez la matière "Coran".',
      priorite: 'haute',
    })
  }

  if (matieres.length >= 4) {
    conseils.push({
      emoji: '✨',
      texte: `Excellent ! Vous proposez ${matieres.length} matières. Vous êtes très polyvalent.`,
      priorite: 'basse',
    })
  }

  if (conseils.length === 0) {
    conseils.push({
      emoji: '✅',
      texte: 'Vos matières sont bien sélectionnées. Pensez à vérifier régulièrement les nouvelles demandes.',
      priorite: 'basse',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// HELPER : Stats par catégorie
// ============================================================

const calculerStatsCategories = (matieres: string[]) => {
  return CATEGORIES.map((cat) => {
    const total = MATIERES.filter((m) => m.categorie === cat.val).length
    const selectionnees = matieres.filter((m) => {
      const mat = MATIERES.find((x) => x.val === m)
      return mat?.categorie === cat.val
    }).length
    return {
      ...cat,
      selectionnees,
      total,
      pourcentage: total > 0 ? Math.round((selectionnees / total) * 100) : 0,
    }
  })
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function MatieresProfesseur() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [loading, setLoading] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [modifications, setModifications] = useState(false)

  const [aBacS, setABacS] = useState(false)
  const [typeProf, setTypeProf] = useState<string | null>(null)
  const [matieres, setMatieres] = useState<string[]>([])
  const [langues, setLangues] = useState<string[]>([])
  const [filtreCategorie, setFiltreCategorie] = useState<Categorie | 'toutes'>('toutes')
  const [recherche, setRecherche] = useState('')

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

      const [profRes, matieresRes, languesRes] = await Promise.all([
        supabase
          .from('professeurs')
          .select('a_bac_s, type_professeur')
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
      ])

      if (profRes.data) {
        setABacS(profRes.data.a_bac_s === true)
        setTypeProf(profRes.data.type_professeur || null)
      }

      setMatieres((matieresRes.data || []).map((m) => m.matiere))
      setLangues((languesRes.data || []).map((l) => l.langue))
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

  const toggleMatiere = (val: string) => {
    const mat = MATIERES.find((m) => m.val === val)
    if (!mat) return

    if (mat.bacSRequis && !aBacS) {
      setErreur('⚠️ Le Bac S est obligatoire pour cette matière')
      setTimeout(() => setErreur(''), 3000)
      return
    }

    setMatieres(
      matieres.includes(val)
        ? matieres.filter((m) => m !== val)
        : [...matieres, val]
    )
    setModifications(true)
  }

  const toggleLangue = (val: string) => {
    setLangues(
      langues.includes(val)
        ? langues.filter((l) => l !== val)
        : [...langues, val]
    )
    setModifications(true)
  }

  const toutSelectionnerCategorie = (categorie: Categorie) => {
    const matieresCategorie = MATIERES.filter((m) => m.categorie === categorie)
    const disponibles = matieresCategorie.filter((m) => !m.bacSRequis || aBacS).map((m) => m.val)

    const toutesSelectionnees = disponibles.every((m) => matieres.includes(m))

    if (toutesSelectionnees) {
      // Désélectionner
      setMatieres(matieres.filter((m) => !disponibles.includes(m)))
    } else {
      // Sélectionner
      const nouvelles = new Set([...matieres, ...disponibles])
      setMatieres(Array.from(nouvelles))
    }
    setModifications(true)
  }

  const enregistrer = async () => {
    if (matieres.length === 0) {
      setErreur('Sélectionnez au moins 1 matière')
      return
    }

    setSauvegarde(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Supprimer anciennes matières
      await supabase
        .from('matieres_par_prof')
        .delete()
        .eq('professeur_id', user.id)

      // Supprimer anciennes langues
      await supabase
        .from('langues_par_prof')
        .delete()
        .eq('professeur_id', user.id)

      // Insérer matières
      if (matieres.length > 0) {
        const data = matieres.map((m) => ({
          professeur_id: user.id,
          matiere: m,
        }))
        const { error } = await supabase
          .from('matieres_par_prof')
          .insert(data)
        if (error) throw error
      }

      // Insérer langues
      if (langues.length > 0) {
        const data = langues.map((l) => ({
          professeur_id: user.id,
          langue: l,
        }))
        const { error } = await supabase
          .from('langues_par_prof')
          .insert(data)
        if (error) throw error
      }

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'modifier_matieres',
        details: `${matieres.length} matières, ${langues.length} langues`,
      })

      setModifications(false)
      setSucces(`✅ ${matieres.length} matières et ${langues.length} langues enregistrées !`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSauvegarde(false)
    }
  }

  const annuler = () => {
    if (!confirm('⚠️ Annuler les modifications ?')) return
    charger()
    setModifications(false)
    setErreur('')
  }

  // ============================================================
  // CALCULS
  // ============================================================

  const matieresFiltrees = useMemo(() => {
    return MATIERES.filter((m) => {
      if (filtreCategorie !== 'toutes' && m.categorie !== filtreCategorie) return false
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return m.label.toLowerCase().includes(r)
      }
      return true
    })
  }, [filtreCategorie, recherche])

  const conseils = useMemo(
    () => genererConseils(matieres, langues, aBacS, typeProf),
    [matieres, langues, aBacS, typeProf]
  )

  const statsCategories = useMemo(() => calculerStatsCategories(matieres), [matieres])

  const compteMatieresParCategorie = useCallback(
    (categorie: Categorie) => {
      return MATIERES.filter(
        (m) => m.categorie === categorie && matieres.includes(m.val)
      ).length
    },
    [matieres]
  )

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
        <p className="text-slate-500 text-sm">Chargement de vos matières...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR INITIALE
  // ============================================================

  if (erreur && matieres.length === 0 && langues.length === 0) {
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
    <div className="space-y-6 pb-32">
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
        className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">📚 Mes matières</h1>
                {aBacS && (
                  <span className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 backdrop-blur-sm px-3 py-1 rounded-full font-black border border-white/30">
                    🎓 BAC S VALIDÉ
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-sm">
                {matieres.length} matière{matieres.length > 1 ? 's' : ''} ·{' '}
                {langues.length} langue{langues.length > 1 ? 's' : ''} parlée
                {langues.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={enregistrer}
              disabled={sauvegarde || !modifications || matieres.length === 0}
              className={`px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                modifications && matieres.length > 0
                  ? 'bg-white text-purple-700 hover:shadow-xl'
                  : 'bg-white/20 text-white/60 cursor-not-allowed'
              }`}
            >
              {sauvegarde ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"
                  />
                  Sauvegarde...
                </span>
              ) : modifications ? (
                '💾 Enregistrer'
              ) : (
                '✓ À jour'
              )}
            </button>
          </div>

          {/* KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">📚 Matières</div>
              <div className="text-2xl font-black">{matieres.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">🌍 Langues</div>
              <div className="text-2xl font-black">{langues.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">🎓 Bac S</div>
              <div className="text-2xl font-black">{aBacS ? '✓' : '—'}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">📊 Catégories</div>
              <div className="text-2xl font-black">
                {statsCategories.filter((c) => c.selectionnees > 0).length}
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
        {erreur && (matieres.length > 0 || langues.length > 0) && (
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
      {/* ALERTE BAC S */}
      {/* ============================================================ */}

      {!aBacS && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 mb-1">
                Sans Bac S, certaines matières sont bloquées
              </p>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                Les matières <strong>Maths, Physique-Chimie et SVT</strong> (niveaux
                Collège et Lycée) nécessitent le <strong>Bac S</strong>. Ajoutez-le
                dans vos documents pour débloquer ces matières.
              </p>
              <Link
                href="/espace-professeur/documents"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all"
              >
                🎓 Ajouter mon Bac S
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {aBacS && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎓</span>
            <div className="flex-1">
              <div className="font-black text-sm mb-1">
                Bravo ! Vous avez le Bac S
              </div>
              <div className="text-xs opacity-90">
                Vous avez accès à toutes les matières scientifiques (Maths, Physique, SVT).
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* FILTRES CATÉGORIES */}
      {/* ============================================================ */}

      <div>
        <div className="text-[10px] text-slate-400 font-black uppercase mb-2 ml-1">
          Filtrer par catégorie
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltreCategorie('toutes')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtreCategorie === 'toutes'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            🌍 Toutes ({matieres.length})
          </button>

          {CATEGORIES.map((cat) => {
            const count = compteMatieresParCategorie(cat.val)
            return (
              <button
                key={cat.val}
                onClick={() => setFiltreCategorie(cat.val)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  filtreCategorie === cat.val
                    ? `bg-gradient-to-r ${cat.couleur} text-white shadow-lg`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
                }`}
              >
                {cat.emoji} {cat.label} ({count})
              </button>
            )
          })}
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
          placeholder="Rechercher une matière..."
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

      {/* ============================================================ */}
      {/* LISTE MATIÈRES */}
      {/* ============================================================ */}

      {matieresFiltrees.length === 0 ? (
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun résultat</h3>
          <p className="text-slate-400 text-sm">
            Aucune matière ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Grouper par catégorie si "toutes" */}
          {(filtreCategorie === 'toutes' ? CATEGORIES : CATEGORIES.filter((c) => c.val === filtreCategorie)).map((cat) => {
            const matieresCat = matieresFiltrees.filter((m) => m.categorie === cat.val)
            if (matieresCat.length === 0) return null

            const toutesSelectionnees = matieresCat
              .filter((m) => !m.bacSRequis || aBacS)
              .every((m) => matieres.includes(m.val))

            return (
              <motion.div
                key={cat.val}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-lg"
              >
                {/* Header catégorie */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cat.couleur} flex items-center justify-center text-white text-xl shadow-lg`}
                    >
                      {cat.emoji}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-base">
                        {cat.label}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {cat.description} ·{' '}
                        {matieresCat.filter((m) => matieres.includes(m.val)).length}/
                        {matieresCat.length}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toutSelectionnerCategorie(cat.val)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                      toutesSelectionnees
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {toutesSelectionnees ? '✕ Tout décocher' : '✓ Tout sélectionner'}
                  </button>
                </div>

                {/* Grille de matières */}
                <div className="grid md:grid-cols-2 gap-2">
                  {matieresCat.map((mat) => {
                    const actif = matieres.includes(mat.val)
                    const bloque = mat.bacSRequis && !aBacS

                    return (
                      <motion.button
                        key={mat.val}
                        type="button"
                        whileHover={{ scale: bloque ? 1 : 1.02 }}
                        whileTap={{ scale: bloque ? 1 : 0.98 }}
                        onClick={() => !bloque && toggleMatiere(mat.val)}
                        disabled={bloque}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                          bloque
                            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                            : actif
                            ? `bg-gradient-to-r ${cat.couleur} text-white border-transparent shadow-lg`
                            : 'bg-white border-slate-200 hover:border-purple-300 cursor-pointer'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0 ${
                            bloque
                              ? 'bg-slate-200'
                              : actif
                              ? 'bg-white/20 backdrop-blur-sm'
                              : 'bg-slate-100'
                          }`}
                        >
                          {bloque ? '🔒' : mat.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-black text-sm truncate ${
                              bloque
                                ? 'text-slate-400'
                                : actif
                                ? 'text-white'
                                : 'text-slate-800'
                            }`}
                          >
                            {mat.label}
                          </div>
                          {mat.populaire && !actif && !bloque && (
                            <div className="text-[9px] text-amber-600 font-black">
                              🔥 Populaire
                            </div>
                          )}
                          {bloque && (
                            <div className="text-[9px] text-red-600 font-black">
                              🎓 Bac S requis
                            </div>
                          )}
                          {actif && (
                            <div className="text-[9px] text-white/90 font-black">
                              ✓ Sélectionnée
                            </div>
                          )}
                        </div>
                        {actif && !bloque && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={4}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* LANGUES PARLÉES */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg">
            💬
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Langues que je parle
            </h2>
            <p className="text-xs text-slate-500">
              Les parents cherchent souvent un prof qui parle la langue maternelle de leur enfant
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {LANGUES_PARLEES.map((l) => {
            const actif = langues.includes(l.val)
            return (
              <motion.button
                key={l.val}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleLangue(l.val)}
                className={`p-4 rounded-2xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-2 ${
                  actif
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-lg'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <span className="text-3xl">{l.emoji}</span>
                <span className="font-black">{l.label}</span>
                {actif && (
                  <span className="text-[9px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-black">
                    ✓
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* STATS PAR CATÉGORIE */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
            📊
          </div>
          <div>
            <h3 className="font-black text-slate-900">Mes matières par catégorie</h3>
            <p className="text-[10px] text-slate-500">Aperçu de votre polyvalence</p>
          </div>
        </div>

        <div className="space-y-3">
          {statsCategories.map((s) => (
            <div key={s.val} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.couleur} flex items-center justify-center text-white text-lg shadow-md flex-shrink-0`}
              >
                {s.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black text-slate-900">{s.label}</span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {s.selectionnees}/{s.total}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pourcentage}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full bg-gradient-to-r ${s.couleur}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

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
      {/* APERÇU PUBLIC */}
      {/* ============================================================ */}

      {matieres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">
              👁️
            </div>
            <div>
              <h3 className="font-black text-slate-900">Ce que voient les parents</h3>
              <p className="text-[10px] text-slate-500">Aperçu de vos matières publiques</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {matieres.map((m) => {
              const mat = MATIERES.find((x) => x.val === m)
              if (!mat) return null
              return (
                <span
                  key={m}
                  className={`text-xs bg-gradient-to-r ${CATEGORIES.find((c) => c.val === mat.categorie)?.couleur} text-white px-3 py-1.5 rounded-full font-black shadow`}
                >
                  {mat.emoji} {mat.label}
                </span>
              )
            })}
          </div>

          {langues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="text-xs font-black text-slate-600 mb-2">
                🌍 Langues parlées
              </div>
              <div className="flex flex-wrap gap-2">
                {langues.map((l) => {
                  const langue = LANGUES_PARLEES.find((x) => x.val === l)
                  if (!langue) return null
                  return (
                    <span
                      key={l}
                      className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-black"
                    >
                      {langue.emoji} {langue.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* BARRE STICKY */}
      {/* ============================================================ */}

      <AnimatePresence>
        {modifications && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-purple-500 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                <span className="font-bold text-slate-800 text-sm">
                  Modifications non enregistrées ({matieres.length} matières,{' '}
                  {langues.length} langues)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={annuler}
                  disabled={sauvegarde}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrer}
                  disabled={sauvegarde || matieres.length === 0}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
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