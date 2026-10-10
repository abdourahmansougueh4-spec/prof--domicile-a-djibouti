'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ProfComplet = {
  id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  bio: string | null
  telephone: string | null
  whatsapp: string | null
  approuve: boolean
  a_bac_s: boolean
  est_etudiant: boolean
  universite: string | null
  domaine_etude: string | null
  niveau_etude: string | null
  statut_universitaire: string | null
  experience_annees: number
  zone_enseignement: string | null
  note_moyenne: number
  nombre_avis: number
  matieres: string[]
  langues: string[]
  langues_speciales: string[]
  disponibilites: { jour: string; creneau: string }[]
}

const labelsMatieres: { [key: string]: string } = {
  primaire_fr: 'Primaire — Toutes matières francophones',
  primaire_ar: 'Primaire — Arabe',
  college_maths: 'Collège — Maths',
  college_physique: 'Collège — Physique-Chimie',
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

const creneauxLabels: { [key: string]: string } = {
  matin: 'Matin (8h-12h)',
  apres_midi: 'Après-midi (12h-17h)',
  soir: 'Soir (17h-21h)',
}

const zonesLabels: { [key: string]: string } = {
  chez_moi: '🏠 Chez le prof',
  chez_eleve: '🚶 Chez l\'élève',
  les_deux: '🔄 Les deux possibles',
}

export default function ProfilProfPublic() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [prof, setProf] = useState<ProfComplet | null>(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (params?.id) {
      charger(params.id as string)
    }
  }, [params?.id])

  const charger = async (id: string) => {
    setLoading(true)
    try {
      const { data: profil, error: profilErr } = await supabase
        .from('profiles')
        .select(
          `
          id, nom_complet, photo_url, quartier, bio, telephone, whatsapp, approuve,
          professeurs:professeurs!inner (
            a_bac_s, est_etudiant, universite, domaine_etude, niveau_etude,
            statut_universitaire, experience_annees, zone_enseignement,
            note_moyenne, nombre_avis, photo_profil_url
          )
        `
        )
        .eq('id', id)
        .eq('role', 'professeur')
        .single()

      if (profilErr || !profil) {
        setErreur('Professeur introuvable')
        setLoading(false)
        return
      }

      const info = Array.isArray(profil.professeurs)
        ? profil.professeurs[0]
        : profil.professeurs

      const [matieresRes, languesRes, disposRes] = await Promise.all([
        supabase
          .from('matieres_par_prof')
          .select('matiere')
          .eq('professeur_id', id),
        supabase
          .from('langues_par_prof')
          .select('langue')
          .eq('professeur_id', id),
        supabase
          .from('disponibilites')
          .select('jour, creneau')
          .eq('professeur_id', id),
      ])

      setProf({
        id: profil.id,
        nom_complet: profil.nom_complet,
        photo_url: info?.photo_profil_url || profil.photo_url || null,
        quartier: profil.quartier,
        bio: profil.bio,
        telephone: null,
        whatsapp: null,
        approuve: profil.approuve,
        a_bac_s: info?.a_bac_s || false,
        est_etudiant: info?.est_etudiant || false,
        universite: info?.universite || null,
        domaine_etude: info?.domaine_etude || null,
        niveau_etude: info?.niveau_etude || null,
        statut_universitaire: info?.statut_universitaire || null,
        experience_annees: info?.experience_annees || 0,
        zone_enseignement: info?.zone_enseignement || null,
        note_moyenne: info?.note_moyenne || 0,
        nombre_avis: info?.nombre_avis || 0,
        matieres: (matieresRes.data || []).map((m) => m.matiere),
        langues: (languesRes.data || []).map((l) => l.langue),
        langues_speciales: [],
        disponibilites: disposRes.data || [],
      })
    } catch (err) {
      console.error(err)
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

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

  if (erreur || !prof) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/80 shadow-xl text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {erreur || 'Prof introuvable'}
        </h2>
        <Link
          href="/espace-parent/recherche"
          className="inline-block mt-4 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg"
        >
          🔍 Retour à la recherche
        </Link>
      </div>
    )
  }

  const joursOrdre = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ]

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
      >
        ← Retour
      </button>

      {/* Header profil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
          <div className="relative flex-shrink-0">
            {prof.photo_url ? (
              <img
                src={prof.photo_url}
                alt={prof.nom_complet}
                className="w-32 h-32 rounded-3xl object-cover shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-600 flex items-center justify-center text-white text-6xl shadow-2xl">
                👨‍🏫
              </div>
            )}
            {prof.approuve && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg border-4 border-white shadow-lg">
                ✓
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
              {prof.nom_complet}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-600 mb-4">
              <span className="flex items-center gap-1">
                ⭐{' '}
                <strong className="text-slate-900">
                  {prof.note_moyenne > 0 ? prof.note_moyenne.toFixed(1) : '—'}
                </strong>
                <span className="text-slate-400">({prof.nombre_avis} avis)</span>
              </span>
              {prof.quartier && (
                <>
                  <span>•</span>
                  <span>📍 {prof.quartier}</span>
                </>
              )}
              <span>•</span>
              <span>🎯 {prof.experience_annees} an{prof.experience_annees > 1 ? 's' : ''}</span>
            </div>

            {prof.bio && (
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                {prof.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {prof.approuve && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-black">
                  🏅 PROFIL VÉRIFIÉ
                </span>
              )}
              {prof.a_bac_s && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-black">
                  🎓 BAC S
                </span>
              )}
              {prof.est_etudiant && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-black">
                  🎓 ÉTUDIANT {prof.niveau_etude || ''}{' '}
                  {prof.domaine_etude ? `— ${prof.domaine_etude}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Matières */}
      {prof.matieres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <h2 className="text-lg font-black text-slate-900 mb-4">
            📚 Matières enseignées
          </h2>
          <div className="flex flex-wrap gap-2">
            {prof.matieres.map((m) => (
              <span
                key={m}
                className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 rounded-xl text-sm font-bold border border-emerald-200"
              >
                {labelsMatieres[m] || m}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Langues */}
      {prof.langues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <h2 className="text-lg font-black text-slate-900 mb-4">
            💬 Langues parlées
          </h2>
          <div className="flex flex-wrap gap-2">
            {prof.langues.map((l) => (
              <span
                key={l}
                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-xl text-sm font-bold capitalize border border-blue-200"
              >
                {l}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Zone */}
      {prof.zone_enseignement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <h2 className="text-lg font-black text-slate-900 mb-3">
            🏠 Zone d'enseignement
          </h2>
          <span className="inline-block px-4 py-2 bg-purple-50 text-purple-800 rounded-xl text-sm font-bold border border-purple-200">
            {zonesLabels[prof.zone_enseignement] || prof.zone_enseignement}
          </span>
        </motion.div>
      )}

      {/* Disponibilités */}
      {prof.disponibilites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <h2 className="text-lg font-black text-slate-900 mb-4">
            📅 Disponibilités
          </h2>
          <div className="space-y-2">
            {joursOrdre.map((jour) => {
              const dispos = prof.disponibilites.filter((d) => d.jour === jour)
              if (dispos.length === 0) return null
              return (
                <div
                  key={jour}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <span className="font-bold text-slate-700 w-24 flex-shrink-0 text-sm">
                    {jour}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {dispos.map((d) => (
                      <span
                        key={d.creneau}
                        className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold"
                      >
                        {creneauxLabels[d.creneau] || d.creneau}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-blue-700 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-2xl"
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="text-4xl">📩</div>
          <div className="flex-1 min-w-[250px]">
            <h3 className="text-xl font-black mb-2">
              Intéressé(e) par ce prof ?
            </h3>
            <p className="text-sm text-blue-100 mb-4">
              Envoyez une demande. Nous vous contacterons pour organiser la
              rencontre. Le prix est négociable.
            </p>
            <Link
              href="/espace-parent/recherche"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg"
            >
              🔍 Retour à la recherche pour faire une demande
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}