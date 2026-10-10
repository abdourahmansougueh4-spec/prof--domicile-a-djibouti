'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ModalDemande from './ModalDemande'
import BadgeEtoiles from '@/components/BadgeEtoiles'

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

const labelsMatieres: { [key: string]: string } = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-white"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            🔍 Recherche avancée
          </h1>
          <p className="text-blue-100 mb-6">
            {profsFiltres.length} prof{profsFiltres.length > 1 ? 's' : ''}{' '}
            correspond{profsFiltres.length > 1 ? 'ent' : ''} à vos critères
          </p>

          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom ou matière..."
              className="w-full pl-14 pr-4 py-4 bg-white rounded-2xl border-2 border-white/20 focus:border-white outline-none font-medium text-slate-800 shadow-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900">🎛️ Filtres avancés</h3>
          {nbFiltres > 0 && (
            <button
              onClick={reinitialiser}
              className="text-xs text-red-600 hover:text-red-700 font-bold"
            >
              ✕ Réinitialiser ({nbFiltres})
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={filtreMatiere}
            onChange={(e) => setFiltreMatiere(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          >
            <option value="">📚 Toutes matières</option>
            {Object.entries(labelsMatieres).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={filtreNiveau}
            onChange={(e) => setFiltreNiveau(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          >
            <option value="">🎓 Tous niveaux</option>
            <option value="primaire">🎒 Primaire</option>
            <option value="college">📖 Collège</option>
            <option value="lycee">🎓 Lycée</option>
          </select>

          <select
            value={filtreQuartier}
            onChange={(e) => setFiltreQuartier(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          >
            <option value="">📍 Tous quartiers</option>
            {[
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
            ].map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>

          <select
            value={tri}
            onChange={(e) => setTri(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          >
            <option value="pertinence">Trier : Pertinence</option>
            <option value="note">Meilleure note</option>
            <option value="experience">Plus expérimenté</option>
            <option value="avis">Plus d'avis</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setFiltreBacS(!filtreBacS)}
            className={`px-4 py-2 rounded-xl font-bold text-xs border-2 transition-all ${
              filtreBacS
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
            }`}
          >
            🎓 Bac S uniquement
          </button>
        </div>
      </motion.div>

      {/* Résultats */}
      {profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/80 shadow-xl text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Aucun prof trouvé
          </h2>
          <p className="text-slate-600 mb-6">
            Essayez d'élargir vos critères ou revenez plus tard.
          </p>
          {nbFiltres > 0 && (
            <button
              onClick={reinitialiser}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg"
            >
              🔄 Réinitialiser
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
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.nom_complet}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg">
                      👨‍🏫
                    </div>
                  )}
                  {p.approuve && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white shadow-md">
                      ✓
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-base md:text-lg mb-1 truncate">
                    {p.nom_complet}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      ⭐{' '}
                      <strong className="text-slate-900">
                        {p.note_moyenne > 0
                          ? p.note_moyenne.toFixed(1)
                          : '—'}
                      </strong>
                      <span className="text-slate-400">
                        ({p.nombre_avis})
                      </span>
                    </span>
                    {p.quartier && (
                      <>
                        <span>•</span>
                        <span>📍 {p.quartier}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      🎯 {p.experience_annees} an
                      {p.experience_annees > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

                    <div className="mb-3">
                <BadgeEtoiles
                  etoiles={p.etoiles}
                  badgeAdmin={p.badge_admin}
                  pionnier={p.pionnier}
                  pionnierIllustre={p.pionnier_illustre}
                  taille="sm"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.a_bac_s && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                    🎓 BAC S
                  </span>
                )}
                {p.est_etudiant && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black">
                    🎓 ÉTUDIANT
                  </span>
                )}
              </div>

              {p.matieres.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {p.matieres.slice(0, 3).map((m) => (
                      <span
                        key={m}
                        className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200"
                      >
                        {labelsMatieres[m] || m}
                      </span>
                    ))}
                    {p.matieres.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5">
                        +{p.matieres.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/espace-parent/profils/${p.id}`}
                  className="flex-1 py-2.5 bg-white text-slate-700 rounded-xl font-bold text-xs border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                >
                  👁️ Voir profil
                </Link>
                <button
                  onClick={() => setProfSelectionne(p)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all"
                >
                  📩 Faire demande
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Demande */}
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
