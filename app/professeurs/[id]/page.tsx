'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfilComplet = {
  id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  bio: string | null
  telephone: string | null
  whatsapp: string | null
}

type ProfInfo = {
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
  specialite: string | null
  universite: string | null
  niveau_etude: string | null
  domaine_etude: string | null
  est_etudiant: boolean
  verifie_physique: boolean
  photo_profil_url: string | null
}

type Avis = {
  id: string
  note: number
  commentaire: string | null
  created_at: string
}

type Dispo = {
  jour: string
  creneau: string
}

// ============================================================
// CONFIG
// ============================================================

const TYPES_PROFS: { [k: string]: { label: string; emoji: string; couleur: string } } = {
  etudiant: { label: 'Étudiant universitaire', emoji: '🎓', couleur: 'from-blue-500 to-indigo-600' },
  diplome: { label: 'Diplômé universitaire', emoji: '📜', couleur: 'from-emerald-500 to-teal-600' },
  bac_s: { label: 'Bac Scientifique', emoji: '🎓', couleur: 'from-amber-500 to-orange-600' },
  enseignant: { label: 'Enseignant officiel', emoji: '👨‍🏫', couleur: 'from-purple-500 to-pink-600' },
  freelance: { label: 'Professeur freelance', emoji: '💼', couleur: 'from-cyan-500 to-blue-600' },
  formateur: { label: 'Formateur spécialisé', emoji: '🏢', couleur: 'from-rose-500 to-pink-600' },
  coran: { label: 'Enseignant Coran', emoji: '📖', couleur: 'from-green-500 to-emerald-600' },
}

const LABELS_MATIERES: { [k: string]: string } = {
  primaire_fr: 'Primaire — Français',
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

const LABELS_LANGUES: { [k: string]: { label: string; emoji: string } } = {
  francais: { label: 'Français', emoji: '🇫🇷' },
  arabe: { label: 'Arabe', emoji: '📖' },
  somali: { label: 'Somali', emoji: '🇸🇴' },
  afar: { label: 'Afar', emoji: '🌍' },
  anglais: { label: 'Anglais', emoji: '🇬🇧' },
}

const LABELS_ZONES: { [k: string]: string } = {
  chez_moi: '🏠 Chez le prof',
  chez_eleve: "🚶 Chez l'élève",
  les_deux: '🔄 Les deux possibles',
}

const JOURS_ORDRE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const CRENEAUX_LABELS: { [k: string]: { label: string; horaire: string; emoji: string; couleur: string } } = {
  matin: { label: 'Matin', horaire: '8h-12h', emoji: '🌅', couleur: 'from-amber-400 to-yellow-500' },
  apres_midi: { label: 'Après-midi', horaire: '12h-17h', emoji: '☀️', couleur: 'from-orange-400 to-red-500' },
  soir: { label: 'Soir', horaire: '17h-21h', emoji: '🌙', couleur: 'from-indigo-400 to-purple-600' },
}

// ============================================================
// HELPER : Format date
// ============================================================

const formaterDate = (date: string) => {
  const d = new Date(date)
  const diffMs = Date.now() - d.getTime()
  const diffJ = Math.floor(diffMs / 86400000)
  if (diffJ < 1) return 'Aujourd\'hui'
  if (diffJ < 7) return `Il y a ${diffJ}j`
  if (diffJ < 30) return `Il y a ${Math.floor(diffJ / 7)} sem.`
  if (diffJ < 365) return `Il y a ${Math.floor(diffJ / 30)} mois`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ProfilProf() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const profId = params?.id as string

  // ---- ÉTATS ----
  const [profil, setProfil] = useState<ProfilComplet | null>(null)
  const [prof, setProf] = useState<ProfInfo | null>(null)
  const [matieres, setMatieres] = useState<string[]>([])
  const [langues, setLangues] = useState<string[]>([])
  const [dispos, setDispos] = useState<Dispo[]>([])
  const [avis, setAvis] = useState<Avis[]>([])
  const [profsSimilaires, setProfsSimilaires] = useState<{ id: string; nom_complet: string; photo_url: string | null; note_moyenne: number; etoiles: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    if (!profId) return
    setLoading(true)
    setErreur('')

    try {
      // 1. Charger le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, nom_complet, photo_url, quartier, bio, telephone, whatsapp, approuve, banni, masque')
        .eq('id', profId)
        .eq('role', 'professeur')
        .single()

      if (profileError || !profileData) {
        setErreur('Professeur introuvable')
        setLoading(false)
        return
      }

      // Vérifier que le prof est bien visible
      if (!profileData.approuve || profileData.banni || profileData.masque) {
        setErreur('Ce profil n\'est pas disponible')
        setLoading(false)
        return
      }

      setProfil({
        id: profileData.id,
        nom_complet: profileData.nom_complet || '',
        photo_url: profileData.photo_url,
        quartier: profileData.quartier,
        bio: profileData.bio,
        telephone: profileData.telephone,
        whatsapp: profileData.whatsapp,
      })

      // 2. Charger les infos prof + matieres + langues + dispos + avis en parallèle
      const [profRes, matieresRes, languesRes, disposRes, avisRes] = await Promise.all([
        supabase
          .from('professeurs')
          .select('experience_annees, note_moyenne, nombre_avis, etoiles, badge_admin, pionnier, pionnier_illustre, a_bac_s, type_professeur, zone_enseignement, specialite, universite, niveau_etude, domaine_etude, est_etudiant, verifie_physique, photo_profil_url')
          .eq('id', profId)
          .single(),
        supabase.from('matieres_par_prof').select('matiere').eq('professeur_id', profId),
        supabase.from('langues_par_prof').select('langue').eq('professeur_id', profId),
        supabase.from('disponibilites').select('jour, creneau').eq('professeur_id', profId),
        supabase
          .from('avis')
          .select('id, note, commentaire, created_at')
          .eq('professeur_id', profId)
          .eq('publie', true)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (profRes.data) {
        setProf({
          experience_annees: profRes.data.experience_annees || 0,
          note_moyenne: Number(profRes.data.note_moyenne) || 0,
          nombre_avis: profRes.data.nombre_avis || 0,
          etoiles: profRes.data.etoiles || 0,
          badge_admin: profRes.data.badge_admin,
          pionnier: profRes.data.pionnier === true,
          pionnier_illustre: profRes.data.pionnier_illustre === true,
          a_bac_s: profRes.data.a_bac_s === true,
          type_professeur: profRes.data.type_professeur,
          zone_enseignement: profRes.data.zone_enseignement,
          specialite: profRes.data.specialite,
          universite: profRes.data.universite,
          niveau_etude: profRes.data.niveau_etude,
          domaine_etude: profRes.data.domaine_etude,
          est_etudiant: profRes.data.est_etudiant === true,
          verifie_physique: profRes.data.verifie_physique === true,
          photo_profil_url: profRes.data.photo_profil_url,
        })
      }

      const matList = (matieresRes.data || []).map((m) => m.matiere)
      const langList = (languesRes.data || []).map((l) => l.langue)

      setMatieres(matList)
      setLangues(langList)
      setDispos(disposRes.data || [])
      setAvis(avisRes.data || [])

      // 3. Charger les profs similaires (même type ou matières communes)
      if (matList.length > 0) {
        const { data: similairesData } = await supabase
          .from('profiles')
          .select(`
            id, nom_complet, photo_url,
            professeurs:professeurs!inner (
              note_moyenne, etoiles, approuve, banni, masque, photo_profil_url
            )
          `)
          .eq('role', 'professeur')
          .eq('approuve', true)
          .eq('banni', false)
          .eq('masque', false)
          .neq('id', profId)
          .limit(3)

        const similaires = (similairesData || []).map((p) => {
          const info = Array.isArray(p.professeurs) ? p.professeurs[0] : p.professeurs
          return {
            id: p.id,
            nom_complet: p.nom_complet || 'Prof',
            photo_url: info?.photo_profil_url || p.photo_url || null,
            note_moyenne: Number(info?.note_moyenne) || 0,
            etoiles: info?.etoiles || 0,
          }
        })

        setProfsSimilaires(similaires)
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase, profId])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const getTypeInfo = () => {
    if (!prof?.type_professeur) return null
    return TYPES_PROFS[prof.type_professeur] || null
  }

  const getDisposParJour = (jour: string) => {
    return dispos.filter((d) => d.jour === jour)
  }

  const getRepartitionNotes = () => {
    const repartition: { [k: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    avis.forEach((a) => {
      if (a.note >= 1 && a.note <= 5) {
        repartition[a.note]++
      }
    })
    return repartition
  }

  const getMoyenneCalculee = () => {
    if (avis.length === 0) return 0
    return avis.reduce((acc, a) => acc + a.note, 0) / avis.length
  }

  const getColorEtoiles = (etoiles: number) => {
    if (etoiles >= 3) return 'from-amber-500 to-orange-600'
    if (etoiles >= 2) return 'from-emerald-500 to-teal-600'
    if (etoiles >= 1) return 'from-blue-500 to-indigo-600'
    return 'from-slate-500 to-slate-700'
  }

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-32 h-32 rounded-3xl bg-slate-200 animate-pulse" />
              <div className="flex-1">
                <div className="w-48 h-8 bg-slate-200 rounded animate-pulse mb-3" />
                <div className="w-32 h-4 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="w-40 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-full h-4 bg-slate-200 rounded animate-pulse" />
              <div className="w-3/4 h-4 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR
  // ============================================================

  if (erreur || !profil || !prof) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Profil indisponible</h2>
          <p className="text-red-700 text-sm mb-6">{erreur || 'Ce profil n\'existe pas'}</p>
          <Link
            href="/professeurs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg"
          >
            ← Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  const typeInfo = getTypeInfo()
  const repartition = getRepartitionNotes()
  const moyenneCalculee = getMoyenneCalculee()

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Blobs animés */}
      <motion.div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />

      {/* NAVBAR */}
      <nav className="relative z-40 backdrop-blur-md bg-white/80 border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">Prof À Domicile</span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/professeurs" className="text-sm font-medium text-slate-600 hover:text-emerald-600 px-3 py-2">
              ← Tous les profs
            </Link>
            <Link href="/inscription" className="text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-2.5 rounded-xl shadow-lg">
              ✨ S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* HEADER PROFIL */}
      <section className="relative z-10 pt-8 pb-6 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Photo */}
              <div className="relative flex-shrink-0 mx-auto md:mx-0">
                {profil.photo_url || prof.photo_profil_url ? (
                  <img
                    src={prof.photo_profil_url || profil.photo_url || ''}
                    alt={profil.nom_complet}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover border-4 border-white shadow-2xl"
                  />
                ) : (
                  <div className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br ${getColorEtoiles(prof.etoiles)} flex items-center justify-center text-white text-6xl shadow-2xl`}>
                    👨‍🏫
                  </div>
                )}
                {prof.verifie_physique && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl border-4 border-white shadow-lg" title="Vérifié physiquement">
                    ✓
                  </motion.div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap mb-3">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                    {profil.nom_complet}
                  </h1>
                  {prof.pionnier_illustre && (
                    <span className="text-[10px] bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1 rounded-full font-black shadow-md">👑 PIONNIER ILLUSTRE</span>
                  )}
                  {prof.badge_admin === 'super_pro' && !prof.pionnier_illustre && (
                    <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full font-black shadow-md">👑 SUPER-PRO</span>
                  )}
                  {prof.badge_admin === 'recommande' && !prof.pionnier_illustre && (
                    <span className="text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full font-black shadow-md">🏅 RECOMMANDÉ</span>
                  )}
                  {prof.pionnier && !prof.pionnier_illustre && (
                    <span className="text-[10px] bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full font-black shadow-md">🏆 PIONNIER</span>
                  )}
                </div>

                {typeInfo && (
                  <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${typeInfo.couleur} text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md mb-3`}>
                    <span>{typeInfo.emoji}</span>
                    <span>{typeInfo.label}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg">
                      {prof.etoiles > 0 ? '⭐'.repeat(prof.etoiles) : '⭐⭐⭐'}
                    </span>
                    {prof.nombre_avis > 0 ? (
                      <>
                        <span className="text-lg font-black text-slate-900">{prof.note_moyenne.toFixed(1)}</span>
                        <span className="text-xs text-slate-500">({prof.nombre_avis} avis)</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">🆕 Nouveau</span>
                    )}
                  </div>
                  {profil.quartier && (
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      📍 {profil.quartier}
                    </span>
                  )}
                  <span className="text-sm text-slate-600 flex items-center gap-1">
                    🎯 {prof.experience_annees} an{prof.experience_annees > 1 ? 's' : ''} d'expérience
                  </span>
                </div>

                {prof.zone_enseignement && (
                  <div className="inline-block bg-purple-50 text-purple-800 px-4 py-2 rounded-xl font-bold text-sm border border-purple-200 mb-4">
                    {LABELS_ZONES[prof.zone_enseignement]}
                  </div>
                )}

                {/* CTA */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Link
                    href={`/espace-parent/demandes?prof=${profId}`}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                  >
                    📩 Demander ce prof
                  </Link>
                  <a
                    href="https://wa.me/25377741482"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:border-emerald-500 transition-all flex items-center gap-2"
                  >
                    💬 Infos
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BIO */}
      {profil.bio && (
        <section className="relative z-10 px-4 md:px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-6 md:p-8 border-2 border-emerald-100 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">📝</div>
                <h2 className="text-xl font-black text-slate-900">À propos</h2>
              </div>
              <p className="text-base md:text-lg text-slate-800 leading-relaxed italic">« {profil.bio} »</p>
            </motion.div>
          </div>
        </section>
      )}

      {/* STATS DÉTAILLÉES */}
      <section className="relative z-10 px-4 md:px-6 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: '🎯', valeur: `${prof.experience_annees} an${prof.experience_annees > 1 ? 's' : ''}`, label: 'Expérience', couleur: 'from-blue-500 to-blue-600' },
              { emoji: '⭐', valeur: prof.note_moyenne > 0 ? prof.note_moyenne.toFixed(1) : '—', label: 'Note moyenne', couleur: 'from-amber-500 to-orange-600' },
              { emoji: '💬', valeur: prof.nombre_avis, label: 'Avis reçus', couleur: 'from-emerald-500 to-teal-600' },
              { emoji: '📚', valeur: matieres.length, label: 'Matières', couleur: 'from-purple-500 to-purple-600' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${s.couleur} flex items-center justify-center text-white text-2xl shadow-lg`}>{s.emoji}</div>
                <div className="text-2xl font-black text-slate-900 mb-1">{s.valeur}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MATIÈRES */}
      {matieres.length > 0 && (
        <section className="relative z-10 px-4 md:px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">📚</div>
                <h2 className="text-xl font-black text-slate-900">Matières enseignées</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {matieres.map((m) => (
                  <span key={m} className="text-sm bg-gradient-to-r from-purple-50 to-blue-50 text-purple-900 px-4 py-2 rounded-xl font-bold border border-purple-200 shadow-sm">
                    {LABELS_MATIERES[m] || m}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* LANGUES */}
      {langues.length > 0 && (
        <section className="relative z-10 px-4 md:px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">💬</div>
                <h2 className="text-xl font-black text-slate-900">Langues parlées</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {langues.map((l) => (
                  <div key={l} className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                    <span className="text-2xl">{LABELS_LANGUES[l]?.emoji || '🌍'}</span>
                    <span className="text-sm font-bold text-blue-900 capitalize">{LABELS_LANGUES[l]?.label || l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* DISPONIBILITÉS */}
      {dispos.length > 0 && (
        <section className="relative z-10 px-4 md:px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">📅</div>
                <h2 className="text-xl font-black text-slate-900">Disponibilités</h2>
              </div>
              <div className="space-y-3">
                {JOURS_ORDRE.map((jour) => {
                  const disposJour = getDisposParJour(jour)
                  if (disposJour.length === 0) return null
                  return (
                    <div key={jour} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <span className="font-black text-slate-700 text-sm w-24 flex-shrink-0">{jour}</span>
                      <div className="flex flex-wrap gap-2">
                        {disposJour.map((d) => {
                          const c = CRENEAUX_LABELS[d.creneau]
                          if (!c) return null
                          return (
                            <span key={d.creneau} className={`text-xs bg-gradient-to-r ${c.couleur} text-white px-3 py-1.5 rounded-full font-bold shadow-md`}>
                              {c.emoji} {c.horaire}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* AVIS */}
      {avis.length > 0 && (
        <section className="relative z-10 px-4 md:px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl shadow-lg">⭐</div>
                  <h2 className="text-xl font-black text-slate-900">Avis des parents</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900">{moyenneCalculee.toFixed(1)}</div>
                  <div className="text-xs text-slate-500">sur {avis.length} avis</div>
                </div>
              </div>

              {/* Répartition */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const count = repartition[n] || 0
                    const pct = avis.length > 0 ? (count / avis.length) * 100 : 0
                    return (
                      <div key={n} className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-500 w-6">{n}⭐</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-amber-500 to-orange-500" />
                        </div>
                        <span className="text-xs font-black text-slate-500 w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Liste avis */}
              <div className="space-y-3">
                {avis.slice(0, 5).map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="text-amber-400 text-sm">{'⭐'.repeat(a.note)}</span>
                      <span className="text-[10px] text-slate-500">{formaterDate(a.created_at)}</span>
                    </div>
                    {a.commentaire && (
                      <p className="text-sm text-slate-700 leading-relaxed italic">« {a.commentaire} »</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA DEMANDE */}
      <section className="relative z-10 px-4 md:px-6 pb-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden">
            <motion.div className="absolute top-[-60px] right-[-60px] w-64 h-64 bg-white/10 rounded-full blur-3xl" animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="relative z-10 text-center">
              <div className="text-5xl mb-3">📩</div>
              <h2 className="text-2xl font-black mb-3">Intéressé par ce prof ?</h2>
              <p className="text-blue-100 mb-6 max-w-xl mx-auto">Notre équipe vous met en contact directement. Réponse garantie en 24h.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/espace-parent/demandes?prof=${profId}`} className="bg-white text-blue-700 px-7 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2">
                  📩 Demander ce prof
                </Link>
                <a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-7 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2">
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROFS SIMILAIRES */}
      {profsSimilaires.length > 0 && (
        <section className="relative z-10 px-4 md:px-6 pb-16">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span>Autres profs recommandés</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {profsSimilaires.map((p) => (
                  <Link key={p.id} href={`/professeurs/${p.id}`} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md hover:shadow-xl transition-all flex items-center gap-3">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.nom_complet} className="w-14 h-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl">👨‍🏫</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm truncate">{p.nom_complet}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {p.etoiles > 0 && <span className="text-amber-400 text-xs">{'⭐'.repeat(p.etoiles)}</span>}
                        {p.note_moyenne > 0 && (
                          <span className="text-xs font-bold text-slate-600">{p.note_moyenne.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-400">→</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* INFO SÉCURITÉ */}
      <section className="relative z-10 px-4 md:px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🔒</span>
              <div>
                <p className="text-sm font-bold text-blue-900 mb-1">Protection des données</p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Pour la sécurité de nos professeurs et de nos parents, les coordonnées personnelles (téléphone, WhatsApp) ne sont <strong>JAMAIS affichées publiquement</strong>. Toute mise en relation passe par notre équipe qui valide chaque demande.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER MINI */}
      <footer className="relative z-10 bg-slate-900 text-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Prof À Domicile</span>
            <span>🇩🇯</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 Prof À Domicile Djibouti — Tous droits réservés</p>
          <div className="flex gap-3 text-sm">
            <a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">💬</a>
            <Link href="/" className="text-slate-400 hover:text-white">🏠</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}