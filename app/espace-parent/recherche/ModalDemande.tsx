'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Prof = {
  id: string
  nom_complet: string
  photo_url: string | null
  matieres: string[]
  disponibilites: { jour: string; creneau: string }[]
}

type Enfant = {
  id: string
  prenom: string
  niveaux: string[]
  classes: string[]
}

type TypeMatiere = 'soutien' | 'coran' | 'langue' | 'autre'

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

const LABELS_NIVEAUX: { [key: string]: string } = {
  primaire: 'Primaire',
  college: 'Collège',
  lycee: 'Lycée',
}

const LABELS_CRENEAUX: { [key: string]: string } = {
  matin: 'Matin',
  apres_midi: 'Après-midi',
  soir: 'Soir',
}

const HORAIRES: { [key: string]: string } = {
  matin: '8h — 12h',
  apres_midi: '12h — 17h',
  soir: '17h — 21h',
}

const OPTIONS_CORAN = [
  { val: 'coran_lecture', label: 'Lecture', emoji: '📖', desc: 'Apprendre à lire le Coran' },
  { val: 'coran_tajwid', label: 'Tajwid', emoji: '🎵', desc: 'Règles de récitation' },
  { val: 'coran_memorisation', label: 'Mémorisation', emoji: '🧠', desc: 'Apprendre par cœur' },
]

const OPTIONS_LANGUE = [
  { val: 'debutant', label: 'Débutant', emoji: '🅰️', desc: 'Commencer de zéro' },
  { val: 'conversation', label: 'Conversation', emoji: '💬', desc: 'Parler couramment' },
  { val: 'grammaire', label: 'Grammaire', emoji: '📚', desc: 'Maîtriser les règles' },
  { val: 'perfectionnement', label: 'Perfectionnement', emoji: '⭐', desc: 'Niveau avancé' },
]

const CLASSES_PAR_NIVEAU: { [key: string]: string[] } = {
  primaire: ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année'],
  college: ['6ème', '7ème', '8ème', '9ème'],
  lycee: ['Seconde', 'Première', 'Terminale'],
}

const JOURS_ORDRE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const SUGGESTIONS_PRIX = [15000, 25000, 35000, 50000, 75000]

// ============================================================
// CLASSIFICATION
// ============================================================

const classifierMatiere = (m: string): TypeMatiere => {
  if (m === 'coran') return 'coran'
  if (['arabe', 'francais', 'anglais'].includes(m)) return 'langue'
  if (m.startsWith('primaire_') || m.startsWith('college_') || m.startsWith('lycee_'))
    return 'soutien'
  return 'autre'
}

// ============================================================
// COMPOSANT
// ============================================================

export default function ModalDemande({
  prof,
  onClose,
}: {
  prof: Prof
  onClose: () => void
}) {
  const supabase = createClient()

  const [enfantsParent, setEnfantsParent] = useState<Enfant[]>([])
  const [enfantsChoisis, setEnfantsChoisis] = useState<string[]>([])
  const [loadingEnfants, setLoadingEnfants] = useState(true)

  const [matieresChoisies, setMatieresChoisies] = useState<string[]>([])
  const [niveauxChoisis, setNiveauxChoisis] = useState<string[]>([])
  const [classesChoisies, setClassesChoisies] = useState<string[]>([])
  const [optionsCoran, setOptionsCoran] = useState<string[]>([])
  const [optionsLangues, setOptionsLangues] = useState<string[]>([])
  const [prix, setPrix] = useState('')
  const [creneauxChoisis, setCreneauxChoisis] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  // ============================================================
  // CHARGER LES ENFANTS DU PARENT
  // ============================================================

  useEffect(() => {
    const chargerEnfants = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setLoadingEnfants(false)
          return
        }

        const { data } = await supabase
          .from('enfants')
          .select('id, prenom, niveaux, classes')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: true })

        const liste = (data || []).map((e: any) => ({
          id: e.id,
          prenom: e.prenom || 'Enfant',
          niveaux: e.niveaux || [],
          classes: e.classes || [],
        }))

        setEnfantsParent(liste)

        // Auto-sélectionner si 1 seul enfant
        if (liste.length === 1) {
          setEnfantsChoisis([liste[0].id])
        }
      } catch (err) {
        console.error('Erreur chargement enfants:', err)
      } finally {
        setLoadingEnfants(false)
      }
    }
    chargerEnfants()
  }, [supabase])

  // ============================================================
  // ANALYSE
  // ============================================================

  const analyse = useMemo(() => {
    const types = matieresChoisies.map(classifierMatiere)
    return {
      aSoutien: types.includes('soutien'),
      aCoran: types.includes('coran'),
      aLangue: types.includes('langue'),
    }
  }, [matieresChoisies])

  const niveauxDisponibles = useMemo(() => {
    const set = new Set<string>()
    matieresChoisies.forEach((m) => {
      if (m.startsWith('primaire_')) set.add('primaire')
      if (m.startsWith('college_')) set.add('college')
      if (m.startsWith('lycee_')) set.add('lycee')
    })
    return Array.from(set)
  }, [matieresChoisies])

  const classesDisponibles = useMemo(() => {
    const classes: string[] = []
    niveauxChoisis.forEach((n) => {
      if (CLASSES_PAR_NIVEAU[n]) classes.push(...CLASSES_PAR_NIVEAU[n])
    })
    return classes
  }, [niveauxChoisis])

  // ============================================================
  // TOGGLES
  // ============================================================

  const toggleEnfant = (id: string) => {
    setEnfantsChoisis(
      enfantsChoisis.includes(id)
        ? enfantsChoisis.filter((x) => x !== id)
        : [...enfantsChoisis, id]
    )
  }

  const toggleMatiere = (m: string) => {
    const estActif = matieresChoisies.includes(m)
    const nouvelles = estActif
      ? matieresChoisies.filter((x) => x !== m)
      : [...matieresChoisies, m]
    setMatieresChoisies(nouvelles)

    if (estActif) {
      const typesRestants = nouvelles.map(classifierMatiere)
      if (!typesRestants.includes('soutien')) {
        setNiveauxChoisis([])
        setClassesChoisies([])
      }
      if (!typesRestants.includes('coran')) setOptionsCoran([])
      if (!typesRestants.includes('langue')) setOptionsLangues([])
    }
  }

  const toggleNiveau = (n: string) => {
    const estActif = niveauxChoisis.includes(n)
    if (estActif) {
      setNiveauxChoisis(niveauxChoisis.filter((x) => x !== n))
      const classesANettoyer = CLASSES_PAR_NIVEAU[n] || []
      setClassesChoisies((prev) => prev.filter((c) => !classesANettoyer.includes(c)))
    } else {
      setNiveauxChoisis([...niveauxChoisis, n])
    }
  }

  const toggleItem = (
    liste: string[],
    setListe: (l: string[]) => void,
    val: string
  ) => {
    setListe(
      liste.includes(val) ? liste.filter((x) => x !== val) : [...liste, val]
    )
  }

  const toggleCreneau = (jour: string, creneau: string) => {
    const cle = `${jour}|${creneau}`
    setCreneauxChoisis(
      creneauxChoisis.includes(cle)
        ? creneauxChoisis.filter((x) => x !== cle)
        : [...creneauxChoisis, cle]
    )
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  const valider = () => {
    if (enfantsChoisis.length === 0) {
      setErreur('Veuillez sélectionner au moins un enfant')
      return false
    }
    if (matieresChoisies.length === 0) {
      setErreur('Veuillez sélectionner au moins une matière')
      return false
    }
    if (analyse.aSoutien && niveauxChoisis.length === 0) {
      setErreur('Veuillez sélectionner au moins un niveau')
      return false
    }
    if (analyse.aSoutien && classesChoisies.length === 0) {
      setErreur('Veuillez sélectionner au moins une classe')
      return false
    }
    if (analyse.aCoran && optionsCoran.length === 0) {
      setErreur('Veuillez préciser le type de cours de Coran')
      return false
    }
    if (analyse.aLangue && optionsLangues.length === 0) {
      setErreur('Veuillez préciser le type de cours de langue')
      return false
    }
    if (!prix || Number(prix) <= 0) {
      setErreur('Veuillez indiquer un budget mensuel')
      return false
    }
    if (creneauxChoisis.length === 0) {
      setErreur('Veuillez sélectionner au moins un créneau')
      return false
    }
    setErreur('')
    return true
  }

  // ============================================================
  // ENVOI
  // ============================================================

  const envoyer = async () => {
    if (!valider()) return
    setLoading(true)
    setErreur('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée')
        setLoading(false)
        return
      }

      const nomsEnfants = enfantsParent
        .filter((e) => enfantsChoisis.includes(e.id))
        .map((e) => e.prenom)

      const lignes: string[] = []
      lignes.push(`Enfants : ${nomsEnfants.join(', ')}`)
      lignes.push(
        `Matières : ${matieresChoisies.map((m) => LABELS_MATIERES[m] || m).join(', ')}`
      )

      if (analyse.aSoutien && niveauxChoisis.length > 0) {
        lignes.push(
          `Niveaux : ${niveauxChoisis.map((n) => LABELS_NIVEAUX[n] || n).join(', ')}`
        )
      }
      if (analyse.aSoutien && classesChoisies.length > 0) {
        lignes.push(`Classes : ${classesChoisies.join(', ')}`)
      }
      if (analyse.aCoran && optionsCoran.length > 0) {
        lignes.push(
          `Coran : ${optionsCoran
            .map((o) => OPTIONS_CORAN.find((x) => x.val === o)?.label || o)
            .join(', ')}`
        )
      }
      if (analyse.aLangue && optionsLangues.length > 0) {
        lignes.push(
          `Langues : ${optionsLangues
            .map((o) => OPTIONS_LANGUE.find((x) => x.val === o)?.label || o)
            .join(', ')}`
        )
      }
      lignes.push(`Budget : ${Number(prix).toLocaleString()} DJF/mois`)
      lignes.push(
        `Créneaux : ${creneauxChoisis
          .map((c) => {
            const [j, cr] = c.split('|')
            return `${j} ${LABELS_CRENEAUX[cr] || cr}`
          })
          .join(', ')}`
      )
      if (message.trim()) lignes.push(`\nMessage : ${message.trim()}`)

      const messageComplet = lignes.join('\n')

      const niveauxPourBase = [
        ...niveauxChoisis,
        ...(analyse.aCoran ? ['coran_special'] : []),
        ...(analyse.aLangue ? ['langue_special'] : []),
      ]

      const response = await fetch('/api/creer-demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: user.id,
          professeurId: prof.id,
          nombreEnfants: enfantsChoisis.length,
          enfantsIds: enfantsChoisis,
          matiere: matieresChoisies.join(', '),
          prixSouhaite: Number(prix),
          niveauxSouhaites: niveauxPourBase,
          classesSouhaitees: classesChoisies,
          creneauxSouhaites: creneauxChoisis,
          optionsCoran: optionsCoran,
          optionsLangues: optionsLangues,
          message: messageComplet,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setErreur(result.error || 'Erreur inconnue')
        setLoading(false)
        return
      }

      setSucces(true)
      setTimeout(() => onClose(), 3000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const prixFormate = prix ? Number(prix).toLocaleString('fr-FR') : ''

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white sm:rounded-3xl rounded-t-3xl w-full sm:max-w-2xl shadow-2xl my-0 sm:my-8 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {prof.photo_url ? (
            <img
              src={prof.photo_url}
              alt={prof.nom_complet}
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              👨‍🏫
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              Nouvelle demande
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 truncate">
              {prof.nom_complet}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* CONTENU */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {succes ? (
              <motion.div
                key="succes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-50 flex items-center justify-center"
                >
                  <svg
                    className="w-10 h-10 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Demande envoyée
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  L'équipe vous contactera très prochainement sur WhatsApp.
                </p>
                <a
                  href="https://wa.me/25377741482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  💬 Contacter l'équipe
                </a>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 sm:space-y-7"
              >
                {/* ============================================================ */}
                {/* ENFANTS */}
                {/* ============================================================ */}
                <section>
                  <SectionLabel emoji="👶" titre="Enfants concernés" required />
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    Sélectionnez les enfants pour qui vous cherchez ce professeur.
                  </p>

                  {loadingEnfants ? (
                    <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-500">
                      Chargement...
                    </div>
                  ) : enfantsParent.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="text-xs font-bold text-amber-900 mb-1">
                            Aucun enfant enregistré
                          </p>
                          <p className="text-[11px] text-amber-800">
                            Ajoutez d'abord vos enfants dans votre profil.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {enfantsParent.map((enf) => {
                        const actif = enfantsChoisis.includes(enf.id)
                        return (
                          <button
                            key={enf.id}
                            type="button"
                            onClick={() => toggleEnfant(enf.id)}
                            className={`text-left p-3 rounded-xl border transition-all ${
                              actif
                                ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                                : 'border-slate-200 bg-white hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                  actif ? 'bg-white/20' : 'bg-slate-100'
                                }`}
                              >
                                {actif ? '✓' : '👶'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm truncate">
                                  {enf.prenom}
                                </div>
                                {enf.niveaux.length > 0 && (
                                  <div
                                    className={`text-[10px] truncate ${
                                      actif ? 'text-slate-300' : 'text-slate-500'
                                    }`}
                                  >
                                    {enf.niveaux
                                      .map((n) => LABELS_NIVEAUX[n] || n)
                                      .join(' · ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {enfantsChoisis.length > 0 && (
                    <div className="mt-2 text-xs text-emerald-700 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {enfantsChoisis.length} enfant
                      {enfantsChoisis.length > 1 ? 's' : ''} sélectionné
                      {enfantsChoisis.length > 1 ? 's' : ''}
                    </div>
                  )}
                </section>

                {/* ============================================================ */}
                {/* MATIÈRES */}
                {/* ============================================================ */}
                <section>
                  <SectionLabel emoji="📚" titre="Matières enseignées par  ce professeur" required />
                  <div className="space-y-2 mt-3">
                    {prof.matieres.map((m) => {
                      const actif = matieresChoisies.includes(m)
                      const type = classifierMatiere(m)
                      const tag =
                        type === 'coran'
                          ? 'Coran'
                          : type === 'langue'
                          ? 'Langue'
                          : 'Soutien'
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => toggleMatiere(m)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                            actif
                              ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              actif ? 'bg-white border-white' : 'border-slate-300'
                            }`}
                          >
                            {actif && (
                              <svg
                                className="w-3 h-3 text-slate-900"
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
                            )}
                          </div>
                          <span className="text-sm font-semibold flex-1">
                            {LABELS_MATIERES[m] || m}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                              actif
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {tag}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* ============================================================ */}
                {/* NIVEAUX (soutien) */}
                {/* ============================================================ */}
                <AnimatePresence>
                  {analyse.aSoutien && niveauxDisponibles.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <SectionLabel emoji="🎓" titre="Niveaux scolaires" required />
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {niveauxDisponibles.map((n) => {
                          const actif = niveauxChoisis.includes(n)
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => toggleNiveau(n)}
                              className={`py-3.5 rounded-2xl font-bold text-sm transition-all ${
                                actif
                                  ? 'bg-slate-900 text-white shadow-md'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {LABELS_NIVEAUX[n] || n}
                            </button>
                          )
                        })}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* ============================================================ */}
                {/* CLASSES */}
                {/* ============================================================ */}
                <AnimatePresence>
                  {analyse.aSoutien && classesDisponibles.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <SectionLabel emoji="📖" titre="Classes précises" required />
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                        {classesDisponibles.map((c) => {
                          const actif = classesChoisies.includes(c)
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                toggleItem(classesChoisies, setClassesChoisies, c)
                              }
                              className={`py-2.5 rounded-xl font-semibold text-xs transition-all ${
                                actif
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {c}
                            </button>
                          )
                        })}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* ============================================================ */}
                {/* CORAN */}
                {/* ============================================================ */}
                <AnimatePresence>
                  {analyse.aCoran && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                        <SectionLabel emoji="📖" titre="Type de cours de Coran" required />
                        <p className="text-[11px] text-emerald-700 mb-4 font-medium mt-1">
                          Aucun niveau scolaire requis pour le Coran
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {OPTIONS_CORAN.map((o) => {
                            const actif = optionsCoran.includes(o.val)
                            return (
                              <button
                                key={o.val}
                                type="button"
                                onClick={() =>
                                  toggleItem(optionsCoran, setOptionsCoran, o.val)
                                }
                                className={`p-3 rounded-2xl text-center transition-all ${
                                  actif
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="text-2xl mb-1">{o.emoji}</div>
                                <div className="font-bold text-xs">{o.label}</div>
                                <div
                                  className={`text-[9px] mt-0.5 ${
                                    actif ? 'text-emerald-100' : 'text-slate-400'
                                  }`}
                                >
                                  {o.desc}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* ============================================================ */}
                {/* LANGUES */}
                {/* ============================================================ */}
                <AnimatePresence>
                  {analyse.aLangue && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-violet-50/60 border border-violet-200 rounded-2xl p-4">
                        <SectionLabel emoji="💬" titre="Type de cours de langue" required />
                        <p className="text-[11px] text-violet-700 mb-4 font-medium mt-1">
                          Sélectionnez le niveau de langue souhaité
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {OPTIONS_LANGUE.map((o) => {
                            const actif = optionsLangues.includes(o.val)
                            return (
                              <button
                                key={o.val}
                                type="button"
                                onClick={() =>
                                  toggleItem(optionsLangues, setOptionsLangues, o.val)
                                }
                                className={`p-3 rounded-2xl transition-all flex items-center gap-3 ${
                                  actif
                                    ? 'bg-violet-600 text-white shadow-md'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-violet-300'
                                }`}
                              >
                                <span className="text-xl">{o.emoji}</span>
                                <div className="text-left flex-1">
                                  <div className="font-bold text-xs">{o.label}</div>
                                  <div
                                    className={`text-[9px] ${
                                      actif ? 'text-violet-100' : 'text-slate-400'
                                    }`}
                                  >
                                    {o.desc}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* ============================================================ */}
                {/* BUDGET */}
                {/* ============================================================ */}
                <section>
                  <SectionLabel emoji="💰" titre="Budget mensuel" required />
                  <div className="mt-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-2xl focus-within:border-slate-900 transition-colors overflow-hidden">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={prix}
                        onChange={(e) => setPrix(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex : 25000"
                        className="flex-1 px-4 py-3.5 bg-transparent outline-none font-bold text-lg text-slate-900 placeholder:text-slate-300 placeholder:font-medium placeholder:text-base"
                      />
                      <div className="px-4 py-3.5 bg-slate-50 border-l border-slate-200 font-bold text-slate-600 flex-shrink-0 text-sm">
                        DJF / mois
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {SUGGESTIONS_PRIX.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPrix(String(p))}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                            prix === String(p)
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {prixFormate && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-xs text-emerald-800 font-bold">
                          {prixFormate} DJF / mois
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* ============================================================ */}
                {/* CRÉNEAUX */}
                {/* ============================================================ */}
                <section>
                  <SectionLabel emoji="📅" titre="Créneaux souhaités" required />
                  <div className="space-y-2 mt-3">
                    {JOURS_ORDRE.map((jour) => {
                      const disposJour = (prof.disponibilites || []).filter(
                        (d) => d.jour === jour
                      )
                      if (disposJour.length === 0) return null
                      return (
                        <div
                          key={jour}
                          className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center gap-3 flex-wrap"
                        >
                          <div className="font-bold text-slate-800 text-sm w-20 flex-shrink-0">
                            {jour}
                          </div>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {disposJour.map((d) => {
                              const cle = `${jour}|${d.creneau}`
                              const actif = creneauxChoisis.includes(cle)
                              return (
                                <button
                                  key={cle}
                                  type="button"
                                  onClick={() => toggleCreneau(jour, d.creneau)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition-all ${
                                    actif
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="text-left">
                                    <div>{LABELS_CRENEAUX[d.creneau]}</div>
                                    <div
                                      className={`text-[9px] ${
                                        actif ? 'text-slate-300' : 'text-slate-400'
                                      }`}
                                    >
                                      {HORAIRES[d.creneau]}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {creneauxChoisis.length > 0 && (
                    <div className="mt-3 text-xs text-slate-500 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {creneauxChoisis.length} créneau
                      {creneauxChoisis.length > 1 ? 'x' : ''} sélectionné
                      {creneauxChoisis.length > 1 ? 's' : ''}
                    </div>
                  )}
                </section>

                {/* ============================================================ */}
                {/* MESSAGE */}
                {/* ============================================================ */}
                <section>
                  <SectionLabel emoji="💬" titre="Message complémentaire" optionnel />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Précisez vos besoins si nécessaire..."
                    className="w-full mt-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-slate-900 outline-none font-medium text-slate-800 resize-none text-sm transition-colors placeholder:text-slate-400"
                  />
                  <div className="flex justify-end text-[10px] text-slate-400 mt-1 font-medium">
                    {message.length}/500
                  </div>
                </section>

                {/* ERREUR */}
                <AnimatePresence>
                  {erreur && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2"
                    >
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <p className="text-rose-700 text-xs font-semibold flex-1">
                        {erreur}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        {!succes && (
          <div className="border-t border-slate-100 bg-white p-4 sm:p-5 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3.5 rounded-2xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={envoyer}
              disabled={loading || enfantsChoisis.length === 0}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Envoi...
                </>
              ) : (
                'Envoyer la demande'
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ============================================================
// SOUS-COMPOSANT
// ============================================================

function SectionLabel({
  emoji,
  titre,
  required,
  optionnel,
}: {
  emoji: string
  titre: string
  required?: boolean
  optionnel?: boolean
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-base">{emoji}</span>
      <h3 className="font-bold text-slate-900 text-sm">{titre}</h3>
      {required && <span className="text-rose-500 font-black">*</span>}
      {optionnel && (
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
          facultatif
        </span>
      )}
    </div>
  )
}