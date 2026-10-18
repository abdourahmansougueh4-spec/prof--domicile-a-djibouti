'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ModalDemande from './ModalDemande'
import BadgeEtoiles from '@/components/BadgeEtoiles'

// ============================================================
// TYPES
// ============================================================

type Prof = {
  id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  approuve: boolean
  a_bac_s: boolean
  est_etudiant: boolean
  universite: string | null
  experience_annees: number
  zone_enseignement: string | null
  note_moyenne: number
  nombre_avis: number
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  matieres: string[]
  langues: string[]
  disponibilites: { jour: string; creneau: string }[]
}

// ============================================================
// LABELS
// ============================================================

const LABELS_MATIERES: { [key: string]: string } = {
  primaire_fr: 'Primaire — Français',
  primaire_ar: 'Primaire — Arabe',
  college_maths: 'Collège — Maths',
  college_physique: 'Collège — Physique',
  college_svt: 'Collège — SVT',
  college_francais: 'Collège — Français',
  college_anglais: 'Collège — Anglais',
  college_arabe: 'Collège — Arabe',
  lycee_maths: 'Lycée — Maths',
  arabe: 'Arabe',
  coran: 'Coran',
  francais: 'Français',
  anglais: 'Anglais',
}

const QUARTIERS = [
  'Héron',
  'Balbala',
  'Centre-ville',
  'Arhiba',
  'Gabode',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'Q5',
]

// ============================================================
// COMPOSANT
// ============================================================

export default function RechercheProf() {
  const supabase = createClient()

  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreMatiere, setFiltreMatiere] = useState('')
  const [filtreNiveau, setFiltreNiveau] = useState('')
  const [filtreQuartier, setFiltreQuartier] = useState('')
  const [filtreBacS, setFiltreBacS] = useState(false)
  const [tri, setTri] = useState('pertinence')
  const [profSelectionne, setProfSelectionne] = useState<Prof | null>(null)
  const [filtresOuverts, setFiltresOuverts] = useState(false)

  // ============================================================
  // CHARGEMENT
  // ============================================================

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data: profils } = await supabase
        .from('profiles')
        .select(
          `
          id,
          nom_complet,
          photo_url,
          quartier,
          approuve,
          professeurs:professeurs!inner (
            a_bac_s,
            est_etudiant,
            universite,
            experience_annees,
            zone_enseignement,
            note_moyenne,
            nombre_avis,
            photo_profil_url,
            etoiles,
            badge_admin,
            pionnier,
            pionnier_illustre
          )
        `
        )
        .eq('role', 'professeur')
        .eq('approuve', true)
        .eq('banni', false)

      const profsComplets: Prof[] = []

      for (const p of profils || []) {
        const info = Array.isArray(p.professeurs)
          ? p.professeurs[0]
          : p.professeurs

        const [matieresRes, languesRes, disposRes] = await Promise.all([
          supabase
            .from('matieres_par_prof')
            .select('matiere')
            .eq('professeur_id', p.id),
          supabase
            .from('langues_par_prof')
            .select('langue')
            .eq('professeur_id', p.id),
          supabase
            .from('disponibilites')
            .select('jour, creneau')
            .eq('professeur_id', p.id),
        ])

        profsComplets.push({
          id: p.id,
          nom_complet: p.nom_complet,
          photo_url: info?.photo_profil_url || p.photo_url || null,
          quartier: p.quartier,
          approuve: p.approuve,
          a_bac_s: info?.a_bac_s || false,
          est_etudiant: info?.est_etudiant || false,
          universite: info?.universite || null,
          experience_annees: info?.experience_annees || 0,
          zone_enseignement: info?.zone_enseignement || null,
          note_moyenne: info?.note_moyenne || 0,
          nombre_avis: info?.nombre_avis || 0,
          etoiles: info?.etoiles || 0,
          badge_admin: info?.badge_admin || null,
          pionnier: info?.pionnier || false,
          pionnier_illustre: info?.pionnier_illustre || false,
          matieres: (matieresRes.data || []).map((m) => m.matiere),
          langues: (languesRes.data || []).map((l) => l.langue),
          disponibilites: disposRes.data || [],
        })
      }

      setProfs(profsComplets)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // FILTRES
  // ============================================================

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      if (
        recherche &&
        !p.nom_complet.toLowerCase().includes(recherche.toLowerCase()) &&
        !p.matieres.some((m) =>
          m.toLowerCase().includes(recherche.toLowerCase())
        )
      )
        return false

      if (filtreMatiere && !p.matieres.includes(filtreMatiere)) return false
      if (filtreNiveau && !p.matieres.some((m) => m.startsWith(filtreNiveau)))
        return false
      if (filtreQuartier && p.quartier !== filtreQuartier) return false
      if (filtreBacS && !p.a_bac_s) return false
      return true
    })

    if (tri === 'note') resultat.sort((a, b) => b.note_moyenne - a.note_moyenne)
    if (tri === 'experience')
      resultat.sort((a, b) => b.experience_annees - a.experience_annees)
    if (tri === 'avis') resultat.sort((a, b) => b.nombre_avis - a.nombre_avis)

    return resultat
  }, [profs, recherche, filtreMatiere, filtreNiveau, filtreQuartier, filtreBacS, tri])

  const reinitialiser = () => {
    setRecherche('')
    setFiltreMatiere('')
    setFiltreNiveau('')
    setFiltreQuartier('')
    setFiltreBacS(false)
    setTri('pertinence')
  }

  const nbFiltres =
    (filtreMatiere ? 1 : 0) +
    (filtreNiveau ? 1 : 0) +
    (filtreQuartier ? 1 : 0) +
    (filtreBacS ? 1 : 0)

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-slate-900 border-t-transparent rounded-full"
        />
        <p className="text-slate-400 text-sm font-medium">
          Chargement des professeurs...
        </p>
      </div>
    )
  }

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-400 hover:text-slate-700 inline-flex items-center gap-1.5 transition-colors"
      >
        ← Retour
      </Link>

      {/* HEADER */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Trouver un professeur
        </h1>
        <p className="text-slate-500 text-sm">
          {profsFiltres.length} professeur{profsFiltres.length > 1 ? 's' : ''} disponible{profsFiltres.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
          🔍
        </span>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom ou matière..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-slate-400 transition-colors font-medium text-slate-900 placeholder:text-slate-400"
        />
        {recherche && (
          <button
            onClick={() => setRecherche('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* BOUTON FILTRES MOBILE */}
      <button
        onClick={() => setFiltresOuverts(!filtresOuverts)}
        className="lg:hidden w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          🎛️ Filtres
          {nbFiltres > 0 && (
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-black">
              {nbFiltres}
            </span>
          )}
        </span>
        <span>{filtresOuverts ? '▲' : '▼'}</span>
      </button>

      {/* FILTRES */}
      <AnimatePresence>
        {(filtresOuverts || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden lg:!h-auto"
          >
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  🎛️ Filtres
                  {nbFiltres > 0 && (
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-black">
                      {nbFiltres}
                    </span>
                  )}
                </h3>
                {nbFiltres > 0 && (
                  <button
                    onClick={reinitialiser}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <select
                  value={filtreMatiere}
                  onChange={(e) => setFiltreMatiere(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <option value="">Matière</option>
                  {Object.entries(LABELS_MATIERES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>

                <select
                  value={filtreNiveau}
                  onChange={(e) => setFiltreNiveau(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <option value="">Niveau</option>
                  <option value="primaire">Primaire</option>
                  <option value="college">Collège</option>
                  <option value="lycee">Lycée</option>
                </select>

                <select
                  value={filtreQuartier}
                  onChange={(e) => setFiltreQuartier(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <option value="">Quartier</option>
                  {QUARTIERS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>

                <select
                  value={tri}
                  onChange={(e) => setTri(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <option value="pertinence">Trier : Pertinence</option>
                  <option value="note">Meilleure note</option>
                  <option value="experience">Plus expérimenté</option>
                  <option value="avis">Plus d'avis</option>
                </select>
              </div>

              <button
                onClick={() => setFiltreBacS(!filtreBacS)}
                className={`mt-3 px-4 py-2 rounded-xl font-bold text-xs border transition-all ${
                  filtreBacS
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                🎓 Bac Scientifique uniquement
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTRES MOBILE */}
      <AnimatePresence>
        {filtresOuverts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <select
                value={filtreMatiere}
                onChange={(e) => setFiltreMatiere(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-800"
              >
                <option value="">Matière</option>
                {Object.entries(LABELS_MATIERES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              <select
                value={filtreNiveau}
                onChange={(e) => setFiltreNiveau(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-800"
              >
                <option value="">Niveau</option>
                <option value="primaire">Primaire</option>
                <option value="college">Collège</option>
                <option value="lycee">Lycée</option>
              </select>

              <select
                value={filtreQuartier}
                onChange={(e) => setFiltreQuartier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-800"
              >
                <option value="">Quartier</option>
                {QUARTIERS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>

              <select
                value={tri}
                onChange={(e) => setTri(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-800"
              >
                <option value="pertinence">Trier : Pertinence</option>
                <option value="note">Meilleure note</option>
                <option value="experience">Plus expérimenté</option>
                <option value="avis">Plus d'avis</option>
              </select>

              <button
                onClick={() => setFiltreBacS(!filtreBacS)}
                className={`w-full px-4 py-3 rounded-xl font-bold text-xs border transition-all ${
                  filtreBacS
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                🎓 Bac Scientifique uniquement
              </button>

              {nbFiltres > 0 && (
                <button
                  onClick={reinitialiser}
                  className="w-full text-xs text-rose-600 font-bold py-2"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RÉSULTATS */}
      {profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl border border-slate-200 p-12 md:p-16 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl">
            🔍
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">
            Aucun professeur trouvé
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Essayez d'élargir vos critères de recherche ou revenez plus tard.
          </p>
          {nbFiltres > 0 && (
            <button
              onClick={reinitialiser}
              className="px-6 py-3 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {profsFiltres.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.nom_complet}
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl">
                        👨‍🏫
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">
                        {p.nom_complet}
                      </h3>
                      {p.approuve && (
                        <svg
                          className="w-4 h-4 text-blue-600 flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        <strong className="text-slate-800">
                          {p.note_moyenne > 0 ? p.note_moyenne.toFixed(1) : '—'}
                        </strong>
                        <span className="text-slate-400">
                          ({p.nombre_avis})
                        </span>
                      </span>
                      {p.quartier && (
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          <span>{p.quartier}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span>🎯</span>
                        <span>
                          {p.experience_annees} an{p.experience_annees > 1 ? 's' : ''}
                        </span>
                      </span>
                    </div>

                    <BadgeEtoiles
                      etoiles={p.etoiles}
                      badgeAdmin={p.badge_admin}
                      pionnier={p.pionnier}
                      pionnierIllustre={p.pionnier_illustre}
                      taille="sm"
                    />
                  </div>
                </div>

                {/* Badges */}
                {(p.a_bac_s || p.est_etudiant) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.a_bac_s && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                        🎓 Bac S
                      </span>
                    )}
                    {p.est_etudiant && (
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-bold border border-purple-200">
                        🎓 Étudiant
                      </span>
                    )}
                  </div>
                )}

                {/* Matières */}
                {p.matieres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.matieres.slice(0, 3).map((m) => (
                      <span
                        key={m}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold"
                      >
                        {LABELS_MATIERES[m] || m}
                      </span>
                    ))}
                    {p.matieres.length > 3 && (
                      <span className="text-[11px] text-slate-400 font-bold px-1">
                        +{p.matieres.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Link
                    href={`/espace-parent/profils/${p.id}`}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors text-center"
                  >
                    Voir le profil
                  </Link>
                  <button
                    onClick={() => setProfSelectionne(p)}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    Faire une demande
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL DEMANDE */}
      <AnimatePresence>
        {profSelectionne && (
          <ModalDemande
            prof={profSelectionne}
            onClose={() => setProfSelectionne(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}