'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
  note_moyenne: number
  nombre_avis: number
  matieres: string[]
  langues: string[]
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

export default function TousLesProfs() {
  const supabase = createClient()
  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreMatiere, setFiltreMatiere] = useState('')
  const [tri, setTri] = useState('pertinence')

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
            note_moyenne,
            nombre_avis,
            photo_profil_url
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

        const { data: matieresData } = await supabase
          .from('matieres_par_prof')
          .select('matiere')
          .eq('professeur_id', p.id)

        const { data: languesData } = await supabase
          .from('langues_par_prof')
          .select('langue')
          .eq('professeur_id', p.id)

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
          note_moyenne: info?.note_moyenne || 0,
          nombre_avis: info?.nombre_avis || 0,
          matieres: (matieresData || []).map((m) => m.matiere),
          langues: (languesData || []).map((l) => l.langue),
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
      return true
    })

    if (tri === 'note') resultat.sort((a, b) => b.note_moyenne - a.note_moyenne)
    if (tri === 'experience')
      resultat.sort((a, b) => b.experience_annees - a.experience_annees)
    if (tri === 'avis') resultat.sort((a, b) => b.nombre_avis - a.nombre_avis)

    return resultat
  }, [profs, recherche, filtreMatiere, tri])

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
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            🌐 Tous les professeurs
          </h1>
          <p className="text-blue-100 mb-6">
            {profsFiltres.length} prof{profsFiltres.length > 1 ? 's' : ''}{' '}
            disponible{profsFiltres.length > 1 ? 's' : ''} sur la plateforme
          </p>

          <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par nom ou matière..."
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border-2 border-white/20 focus:border-white outline-none font-medium text-slate-800"
              />
            </div>
            <select
              value={filtreMatiere}
              onChange={(e) => setFiltreMatiere(e.target.value)}
              className="px-4 py-3.5 bg-white rounded-2xl border-2 border-white/20 outline-none font-medium text-slate-800 min-w-[180px]"
            >
              <option value="">📚 Toutes matières</option>
              {Object.entries(labelsMatieres).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value)}
              className="px-4 py-3.5 bg-white rounded-2xl border-2 border-white/20 outline-none font-medium text-slate-800 min-w-[160px]"
            >
              <option value="pertinence">Trier : Pertinence</option>
              <option value="note">Meilleure note</option>
              <option value="experience">Plus expérimenté</option>
              <option value="avis">Plus d'avis</option>
            </select>
          </div>
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
            Aucun prof disponible
          </h2>
          <p className="text-slate-600">
            Aucun professeur n'est approuvé pour l'instant. Revenez plus tard.
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {profsFiltres.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-emerald-400 hover:shadow-2xl transition-all"
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
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-blue-700 flex items-center justify-center text-white text-3xl shadow-lg">
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
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.approuve && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black">
                    🏅 VÉRIFIÉ
                  </span>
                )}
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

              {/* Matières */}
              {p.matieres.length > 0 && (
                <div className="mb-3">
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
                  className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all text-center"
                >
                  👁️ Voir profil
                </Link>
                <Link
                  href={`/espace-parent/recherche?prof=${p.id}`}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-blue-700 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all text-center"
                >
                  📩 Faire demande
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}