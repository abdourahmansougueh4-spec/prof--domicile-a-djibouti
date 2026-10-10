'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Professeur = {
  id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  bio: string | null
  experience_annees: number
  note_moyenne: number
  nombre_avis: number
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  a_bac_s: boolean
  type_professeur: string | null
  zone_enseignement: string | null
  prix_min: number | null
  prix_max: number | null
  specialite: string | null
  matieres: string[]
  langues: string[]
}

type Filtre = {
  recherche: string
  type: string
  matiere: string
  langue: string
  quartier: string
  note_min: number
  avec_badges: boolean
}

type Tri = 'pertinence' | 'note' | 'etoiles' | 'experience' | 'recent'

// ============================================================
// CONFIG
// ============================================================

const TYPES_PROFS: { [k: string]: { label: string; emoji: string } } = {
  etudiant: { label: 'Étudiant', emoji: '🎓' },
  diplome: { label: 'Diplômé', emoji: '📜' },
  bac_s: { label: 'Bac S', emoji: '🎓' },
  enseignant: { label: 'Enseignant', emoji: '👨‍🏫' },
  freelance: { label: 'Freelance', emoji: '💼' },
  formateur: { label: 'Formateur', emoji: '🏢' },
  coran: { label: 'Coran', emoji: '📖' },
}

const MATIERES_OPTIONS = [
  { val: 'primaire_fr', label: 'Primaire FR' },
  { val: 'primaire_ar', label: 'Primaire AR' },
  { val: 'college_maths', label: 'Collège Maths' },
  { val: 'college_physique', label: 'Collège Physique' },
  { val: 'college_svt', label: 'Collège SVT' },
  { val: 'college_francais', label: 'Collège Français' },
  { val: 'college_anglais', label: 'Collège Anglais' },
  { val: 'college_arabe', label: 'Collège Arabe' },
  { val: 'lycee_maths', label: 'Lycée Maths' },
  { val: 'arabe', label: 'Arabe' },
  { val: 'coran', label: 'Coran' },
  { val: 'francais', label: 'Français' },
  { val: 'anglais', label: 'Anglais' },
]

const LANGUES_OPTIONS = [
  { val: 'francais', label: 'Français', emoji: '🇫🇷' },
  { val: 'arabe', label: 'Arabe', emoji: '📖' },
  { val: 'somali', label: 'Somali', emoji: '🇸🇴' },
  { val: 'afar', label: 'Afar', emoji: '🌍' },
  { val: 'anglais', label: 'Anglais', emoji: '🇬🇧' },
]

const ZONES_LABELS: { [k: string]: string } = {
  chez_moi: '🏠 Chez le prof',
  chez_eleve: "🚶 Chez l'élève",
  les_deux: '🔄 Les deux',
}

// ============================================================
// HELPER : Score de pertinence
// ============================================================

const calculerScore = (p: Professeur): number => {
  return (
    p.note_moyenne * 20 +
    p.etoiles * 15 +
    Math.min(p.nombre_avis, 30) +
    (p.badge_admin ? 20 : 0) +
    (p.pionnier_illustre ? 30 : p.pionnier ? 15 : 0) +
    Math.min(p.experience_annees * 2, 20)
  )
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ListeProfesseurs() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [profs, setProfs] = useState<Professeur[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const [vue, setVue] = useState<'grille' | 'liste'>('grille')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)

  const [filtres, setFiltres] = useState<Filtre>({
    recherche: '',
    type: '',
    matiere: '',
    langue: '',
    quartier: '',
    note_min: 0,
    avec_badges: false,
  })

  const [tri, setTri] = useState<Tri>('pertinence')

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      // Charger tous les profs approuvés (pas masqués, pas bannis)
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, nom_complet, photo_url, quartier, bio,
          professeurs:professeurs!inner (
            experience_annees, note_moyenne, nombre_avis, etoiles,
            badge_admin, pionnier, pionnier_illustre, a_bac_s,
            type_professeur, zone_enseignement, prix_min, prix_max,
            specialite, photo_profil_url
          )
        `)
        .eq('role', 'professeur')
        .eq('approuve', true)
        .eq('banni', false)
        .eq('masque', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Professeur[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.professeurs) ? p.professeurs[0] : p.professeurs
        if (!info) continue

        // Charger matières et langues
        const [matieresRes, languesRes] = await Promise.all([
          supabase.from('matieres_par_prof').select('matiere').eq('professeur_id', p.id),
          supabase.from('langues_par_prof').select('langue').eq('professeur_id', p.id),
        ])

        complets.push({
          id: p.id,
          nom_complet: p.nom_complet || 'Sans nom',
          photo_url: info.photo_profil_url || p.photo_url || null,
          quartier: p.quartier,
          bio: p.bio,
          experience_annees: info.experience_annees || 0,
          note_moyenne: Number(info.note_moyenne) || 0,
          nombre_avis: info.nombre_avis || 0,
          etoiles: info.etoiles || 0,
          badge_admin: info.badge_admin || null,
          pionnier: info.pionnier === true,
          pionnier_illustre: info.pionnier_illustre === true,
          a_bac_s: info.a_bac_s === true,
          type_professeur: info.type_professeur || null,
          zone_enseignement: info.zone_enseignement || null,
          prix_min: info.prix_min ? Number(info.prix_min) : null,
          prix_max: info.prix_max ? Number(info.prix_max) : null,
          specialite: info.specialite || null,
          matieres: (matieresRes.data || []).map((m) => m.matiere),
          langues: (languesRes.data || []).map((l) => l.langue),
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
  // FILTRES + TRI
  // ============================================================

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      // Recherche texte
      if (filtres.recherche.trim()) {
        const r = filtres.recherche.toLowerCase().trim()
        const match =
          p.nom_complet.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r) ||
          p.bio?.toLowerCase().includes(r) ||
          p.specialite?.toLowerCase().includes(r) ||
          p.matieres.some((m) => m.toLowerCase().includes(r))
        if (!match) return false
      }

      // Type
      if (filtres.type && p.type_professeur !== filtres.type) return false

      // Matière
      if (filtres.matiere && !p.matieres.includes(filtres.matiere)) return false

      // Langue
      if (filtres.langue && !p.langues.includes(filtres.langue)) return false

      // Quartier
      if (filtres.quartier.trim()) {
        const q = filtres.quartier.toLowerCase().trim()
        if (!p.quartier?.toLowerCase().includes(q)) return false
      }

      // Note minimum
      if (filtres.note_min > 0 && p.note_moyenne < filtres.note_min) return false

      // Badges
      if (filtres.avec_badges) {
        const aBadge = p.badge_admin || p.pionnier || p.pionnier_illustre
        if (!aBadge) return false
      }

      return true
    })

    // Tri
    if (tri === 'pertinence') {
      resultat.sort((a, b) => calculerScore(b) - calculerScore(a))
    }
    if (tri === 'note') {
      resultat.sort((a, b) => b.note_moyenne - a.note_moyenne)
    }
    if (tri === 'etoiles') {
      resultat.sort((a, b) => b.etoiles - a.etoiles)
    }
    if (tri === 'experience') {
      resultat.sort((a, b) => b.experience_annees - a.experience_annees)
    }
    if (tri === 'recent') {
      resultat.sort((a, b) => b.id.localeCompare(a.id))
    }

    return resultat
  }, [profs, filtres, tri])

  // ============================================================
  // PAGINATION
  // ============================================================

  const profsPage = useMemo(() => {
    return profsFiltres.slice(0, page * pageSize)
  }, [profsFiltres, page, pageSize])

  const aPlus = profsFiltres.length > page * pageSize

  const chargerPlus = () => {
    setPage(page + 1)
  }

  // Revenir à la page 1 si les filtres changent
  useEffect(() => {
    setPage(1)
  }, [filtres, tri])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const nombreFiltresActifs = useMemo(() => {
    let count = 0
    if (filtres.type) count++
    if (filtres.matiere) count++
    if (filtres.langue) count++
    if (filtres.quartier) count++
    if (filtres.note_min > 0) count++
    if (filtres.avec_badges) count++
    return count
  }, [filtres])

  const reinitialiser = () => {
    setFiltres({
      recherche: '',
      type: '',
      matiere: '',
      langue: '',
      quartier: '',
      note_min: 0,
      avec_badges: false,
    })
    setTri('pertinence')
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const getTypeInfo = (type: string | null) => {
    if (!type) return null
    return TYPES_PROFS[type] || null
  }

  const getBadgeColor = (p: Professeur) => {
    if (p.pionnier_illustre) return 'from-red-500 to-pink-600'
    if (p.badge_admin === 'super_pro') return 'from-amber-500 to-orange-600'
    if (p.badge_admin === 'recommande') return 'from-blue-500 to-blue-600'
    if (p.pionnier) return 'from-yellow-500 to-amber-600'
    return null
  }

  const getBadgeLabel = (p: Professeur) => {
    if (p.pionnier_illustre) return '👑 Pionnier Illustre'
    if (p.badge_admin === 'super_pro') return '👑 Super-Pro'
    if (p.badge_admin === 'recommande') return '🏅 Recommandé'
    if (p.pionnier) return '🏆 Pionnier'
    return null
  }

  const getCouleurAvatar = (p: Professeur) => {
    if (p.etoiles >= 3) return 'from-amber-500 to-orange-600'
    if (p.etoiles >= 2) return 'from-emerald-500 to-teal-600'
    if (p.etoiles >= 1) return 'from-blue-500 to-indigo-600'
    return 'from-slate-500 to-slate-700'
  }

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="text-center mb-12">
            <div className="inline-block w-48 h-8 bg-slate-200 rounded-full animate-pulse mb-4" />
            <div className="inline-block w-64 h-12 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg">
                <div className="w-20 h-20 rounded-2xl bg-slate-200 animate-pulse mb-4" />
                <div className="w-32 h-5 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="flex gap-2 mb-4">
                  <div className="w-16 h-6 bg-slate-200 rounded-full animate-pulse" />
                  <div className="w-16 h-6 bg-slate-200 rounded-full animate-pulse" />
                </div>
                <div className="w-full h-10 bg-slate-200 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR
  // ============================================================

  if (erreur) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-red-700 text-sm mb-6">{erreur}</p>
          <button
            onClick={charger}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-sm shadow-lg"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Blobs animés */}
      <motion.div
        className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* NAVBAR */}
      <nav className="relative z-40 backdrop-blur-md bg-white/80 border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 px-3 py-2">
              ← Accueil
            </Link>
            <Link
              href="/inscription"
              className="text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-2.5 rounded-xl shadow-lg"
            >
              ✨ S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <section className="relative z-10 pt-12 pb-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {profs.length} prof{profs.length > 1 ? 's' : ''} disponible{profs.length > 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Trouvez votre{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
                professeur idéal
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Des professeurs vérifiés à Djibouti — pour chaque matière, chaque niveau, chaque besoin.
            </p>
          </motion.div>

          {/* BARRE DE RECHERCHE */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-3 md:p-4 shadow-xl border border-slate-100 max-w-4xl mx-auto">
            <div className="flex gap-2 flex-col md:flex-row">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  value={filtres.recherche}
                  onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })}
                  placeholder="Nom, matière, quartier..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white font-medium transition-all"
                />
              </div>
              <button
                onClick={() => setFiltresOuverts(!filtresOuverts)}
                className={`px-5 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${
                  filtresOuverts || nombreFiltresActifs > 0
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>⚙️ Filtres</span>
                {nombreFiltresActifs > 0 && (
                  <span className="w-5 h-5 bg-white text-emerald-600 rounded-full text-[10px] font-black flex items-center justify-center">
                    {nombreFiltresActifs}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FILTRES AVANCÉS */}
      <AnimatePresence>
        {filtresOuverts && (
          <motion.section
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 overflow-hidden px-4 md:px-6 pb-6"
          >
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-slate-900">🎯 Filtres avancés</h3>
                  {nombreFiltresActifs > 0 && (
                    <button
                      onClick={reinitialiser}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      ✕ Réinitialiser
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      Type de prof
                    </label>
                    <select
                      value={filtres.type}
                      onChange={(e) => setFiltres({ ...filtres, type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-sm text-slate-900"
                    >
                      <option value="">Tous les types</option>
                      {Object.entries(TYPES_PROFS).map(([key, t]) => (
                        <option key={key} value={key}>
                          {t.emoji} {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Matière */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      Matière
                    </label>
                    <select
                      value={filtres.matiere}
                      onChange={(e) => setFiltres({ ...filtres, matiere: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-sm text-slate-900"
                    >
                      <option value="">Toutes les matières</option>
                      {MATIERES_OPTIONS.map((m) => (
                        <option key={m.val} value={m.val}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Langue */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      Langue parlée
                    </label>
                    <select
                      value={filtres.langue}
                      onChange={(e) => setFiltres({ ...filtres, langue: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-sm text-slate-900"
                    >
                      <option value="">Toutes les langues</option>
                      {LANGUES_OPTIONS.map((l) => (
                        <option key={l.val} value={l.val}>
                          {l.emoji} {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quartier */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      Quartier
                    </label>
                    <input
                      type="text"
                      value={filtres.quartier}
                      onChange={(e) => setFiltres({ ...filtres, quartier: e.target.value })}
                      placeholder="Ex : Héron, Balbala..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-sm text-slate-900"
                    />
                  </div>

                  {/* Note min */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      Note minimum : {filtres.note_min > 0 ? `${filtres.note_min}/5` : 'Toutes'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filtres.note_min}
                      onChange={(e) => setFiltres({ ...filtres, note_min: Number(e.target.value) })}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  {/* Badges */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      Badges
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={filtres.avec_badges}
                        onChange={(e) => setFiltres({ ...filtres, avec_badges: e.target.checked })}
                        className="w-5 h-5 accent-emerald-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        🏅 Avec badges seulement
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* TRI + VUE */}
      <section className="relative z-10 px-4 md:px-6 pb-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            <span className="font-black text-slate-900">{profsFiltres.length}</span> résultat{profsFiltres.length > 1 ? 's' : ''}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-xs text-slate-900"
            >
              <option value="pertinence">⭐ Pertinence</option>
              <option value="note">📊 Meilleure note</option>
              <option value="etoiles">🌟 Plus d'étoiles</option>
              <option value="experience">🎯 Plus expérimenté</option>
              <option value="recent">🆕 Plus récent</option>
            </select>

            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setVue('grille')}
                className={`px-3 py-2.5 text-sm font-bold transition-colors ${
                  vue === 'grille' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="Vue grille"
              >
                🔲
              </button>
              <button
                onClick={() => setVue('liste')}
                className={`px-3 py-2.5 text-sm font-bold transition-colors ${
                  vue === 'liste' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="Vue liste"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LISTE DES PROFS */}
      <section className="relative z-10 px-4 md:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {profsFiltres.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-12 border border-slate-100 shadow-lg text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-black text-slate-900 text-xl mb-2">Aucun prof trouvé</h3>
              <p className="text-slate-600 text-sm mb-6">
                Essayez d'élargir vos critères ou de réinitialiser les filtres.
              </p>
              <button
                onClick={reinitialiser}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-700 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
              >
                ✕ Réinitialiser les filtres
              </button>
            </motion.div>
          ) : vue === 'grille' ? (
            /* ---------- VUE GRILLE ---------- */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {profsPage.map((p, i) => {
                const typeInfo = getTypeInfo(p.type_professeur)
                const badgeColor = getBadgeColor(p)
                const badgeLabel = getBadgeLabel(p)

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg hover:shadow-2xl transition-all group"
                  >
                    {/* Header avec photo */}
                    <div className={`relative h-32 bg-gradient-to-br ${getCouleurAvatar(p)}`}>
                      <div className="absolute inset-0 bg-black/10" />
                      {badgeLabel && badgeColor && (
                        <div className={`absolute top-3 right-3 text-[10px] bg-gradient-to-r ${badgeColor} text-white px-2 py-1 rounded-full font-black shadow-lg`}>
                          {badgeLabel}
                        </div>
                      )}
                      <div className="absolute -bottom-12 left-6">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt={p.nom_complet}
                            className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-4xl border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                            👨‍🏫
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="pt-16 px-6 pb-6">
                      <div className="mb-3">
                        <h3 className="font-black text-slate-900 text-lg mb-1 truncate">
                          {p.nom_complet}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {typeInfo && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                              {typeInfo.emoji} {typeInfo.label}
                            </span>
                          )}
                          {p.a_bac_s && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                              🎓 Bac S
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Note + avis */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {p.etoiles > 0 ? (
                            <span className="text-amber-400 text-sm">{'⭐'.repeat(p.etoiles)}</span>
                          ) : (
                            <span className="text-slate-300 text-sm">⭐⭐⭐</span>
                          )}
                        </div>
                        {p.nombre_avis > 0 ? (
                          <>
                            <span className="text-sm font-black text-slate-900">
                              {p.note_moyenne.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({p.nombre_avis} avis)
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">
                            🆕 Nouveau
                          </span>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="space-y-1.5 mb-4 text-xs text-slate-600">
                        {p.quartier && (
                          <div className="flex items-center gap-1.5">
                            <span>📍</span>
                            <span>{p.quartier}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span>🎯</span>
                          <span>{p.experience_annees} an{p.experience_annees > 1 ? 's' : ''} d'expérience</span>
                        </div>
                        {p.zone_enseignement && (
                          <div className="flex items-center gap-1.5">
                            <span>{ZONES_LABELS[p.zone_enseignement]}</span>
                          </div>
                        )}
                      </div>

                      {/* Matières */}
                      {p.matieres.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {p.matieres.slice(0, 3).map((m) => {
                            const mat = MATIERES_OPTIONS.find((x) => x.val === m)
                            return (
                              <span key={m} className="text-[10px] bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-bold">
                                {mat?.label || m}
                              </span>
                            )
                          })}
                          {p.matieres.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-bold">
                              +{p.matieres.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Langues */}
                      {p.langues.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {p.langues.slice(0, 4).map((l) => {
                            const langue = LANGUES_OPTIONS.find((x) => x.val === l)
                            return (
                              <span key={l} className="text-[10px] text-slate-500">
                                {langue?.emoji || '🌍'}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* CTA */}
                      <Link
                        href={`/professeurs/${p.id}`}
                        className="block w-full text-center bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                      >
                        👁️ Voir le profil
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            /* ---------- VUE LISTE ---------- */
            <div className="space-y-4">
              {profsPage.map((p, i) => {
                const typeInfo = getTypeInfo(p.type_professeur)
                const badgeColor = getBadgeColor(p)
                const badgeLabel = getBadgeLabel(p)

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3) }}
                    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-lg hover:shadow-2xl transition-all"
                  >
                    <div className="flex items-start gap-5 flex-wrap">
                      {/* Photo */}
                      <div className="relative flex-shrink-0">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt={p.nom_complet}
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow"
                          />
                        ) : (
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getCouleurAvatar(p)} flex items-center justify-center text-white text-3xl shadow`}>
                            👨‍🏫
                          </div>
                        )}
                        {badgeLabel && (
                          <div className={`absolute -bottom-1 -right-1 text-[8px] bg-gradient-to-r ${badgeColor} text-white px-1.5 py-0.5 rounded-full font-black`}>
                            {badgeLabel.split(' ')[0]}
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-[250px]">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-black text-slate-900 text-lg">
                            {p.nom_complet}
                          </h3>
                          {typeInfo && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                              {typeInfo.emoji} {typeInfo.label}
                            </span>
                          )}
                          {p.a_bac_s && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                              🎓 Bac S
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            {p.etoiles > 0 ? (
                              <span className="text-amber-400 text-sm">{'⭐'.repeat(p.etoiles)}</span>
                            ) : (
                              <span className="text-slate-300 text-sm">⭐⭐⭐</span>
                            )}
                          </div>
                          {p.nombre_avis > 0 ? (
                            <>
                              <span className="text-sm font-black text-slate-900">
                                {p.note_moyenne.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({p.nombre_avis} avis)
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">🆕 Nouveau</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-2">
                          {p.quartier && <span>📍 {p.quartier}</span>}
                          <span>🎯 {p.experience_annees} an{p.experience_annees > 1 ? 's' : ''}</span>
                          {p.zone_enseignement && <span>{ZONES_LABELS[p.zone_enseignement]}</span>}
                        </div>

                        {p.matieres.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {p.matieres.slice(0, 5).map((m) => {
                              const mat = MATIERES_OPTIONS.find((x) => x.val === m)
                              return (
                                <span key={m} className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                  {mat?.label || m}
                                </span>
                              )
                            })}
                            {p.matieres.length > 5 && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                +{p.matieres.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/professeurs/${p.id}`}
                          className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all text-center whitespace-nowrap"
                        >
                          👁️ Voir le profil
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* CHARGER PLUS */}
          {aPlus && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-10">
              <button
                onClick={chargerPlus}
                className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-emerald-500 text-slate-900 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                ⬇️ Charger plus de profs
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA PROF */}
      <section className="relative z-10 px-4 md:px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-8 md:p-10 shadow-2xl text-white text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute top-[-60px] right-[-60px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative z-10">
              <div className="text-5xl mb-3">👨‍🏫</div>
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                Vous êtes professeur ?
              </h2>
              <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
                Inscrivez-vous gratuitement et recevez des demandes de parents près de chez vous.
              </p>
              <Link
                href="/inscription/professeur"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 px-7 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                🚀 Devenir prof
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER MINI */}
      <footer className="relative z-10 bg-slate-900 text-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span>🇩🇯</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 Prof À Domicile Djibouti — Tous droits réservés
          </p>
          <div className="flex gap-3 text-sm">
            <a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
              💬
            </a>
            <Link href="/" className="text-slate-400 hover:text-white">
              🏠
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}