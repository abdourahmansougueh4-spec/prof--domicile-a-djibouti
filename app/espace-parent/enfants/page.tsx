'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Enfant = {
  id: string
  prenom: string
  niveaux: string[]
  classes: string[]
  langues_comprises: string[]
  langues_speciales: string[]
  precisions_langues: string[]
}

const labelsNiveau: { [k: string]: string } = {
  primaire: '🎒 Primaire',
  college: '📖 Collège',
  lycee: '🎓 Lycée',
  langue_speciale: '📕 Langue / Coran',
}

const classesParNiveau = (niveaux: string[]) => {
  const classes: string[] = []
  if (niveaux.includes('primaire')) {
    classes.push(
      '1ère année',
      '2ème année',
      '3ème année',
      '4ème année',
      '5ème année'
    )
  }
  if (niveaux.includes('college')) {
    classes.push('6ème', '7ème', '8ème', '9ème')
  }
  if (niveaux.includes('lycee')) {
    classes.push('Seconde', 'Première', 'Terminale')
  }
  return classes
}

export default function EnfantsParent() {
  const supabase = createClient()

  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [loading, setLoading] = useState(true)
  const [parentId, setParentId] = useState<string>('')

  const [modalOuvert, setModalOuvert] = useState(false)
  const [formEnfant, setFormEnfant] = useState<Enfant>({
    id: '',
    prenom: '',
    niveaux: [],
    classes: [],
    langues_comprises: [],
    langues_speciales: [],
    precisions_langues: [],
  })
  const [modeEdition, setModeEdition] = useState(false)
  const [erreur, setErreur] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)

  useEffect(() => {
    chargerEnfants()
  }, [])

  const chargerEnfants = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setParentId(user.id)

    const { data, error } = await supabase
      .from('enfants')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur:', error)
    } else {
      setEnfants(data || [])
    }
    setLoading(false)
  }

  const ouvrirAjout = () => {
    setFormEnfant({
      id: '',
      prenom: '',
      niveaux: [],
      classes: [],
      langues_comprises: [],
      langues_speciales: [],
      precisions_langues: [],
    })
    setModeEdition(false)
    setErreur('')
    setModalOuvert(true)
  }

  const ouvrirModif = (e: Enfant) => {
    setFormEnfant({ ...e })
    setModeEdition(true)
    setErreur('')
    setModalOuvert(true)
  }

  const toggleTableau = (
    champ:
      | 'niveaux'
      | 'classes'
      | 'langues_comprises'
      | 'langues_speciales'
      | 'precisions_langues',
    valeur: string
  ) => {
    const liste = formEnfant[champ]
    const nouvelleListe = liste.includes(valeur)
      ? liste.filter((x) => x !== valeur)
      : [...liste, valeur]
    setFormEnfant({ ...formEnfant, [champ]: nouvelleListe })
  }

  const toggleNiveau = (niveau: string) => {
    const niveaux = formEnfant.niveaux.includes(niveau)
      ? formEnfant.niveaux.filter((n) => n !== niveau)
      : [...formEnfant.niveaux, niveau]

    let langues_speciales = formEnfant.langues_speciales
    let precisions_langues = formEnfant.precisions_langues
    if (niveau === 'langue_speciale' && !niveaux.includes('langue_speciale')) {
      langues_speciales = []
      precisions_langues = []
    }

    const classesValides = classesParNiveau(niveaux)
    const classes = formEnfant.classes.filter((c) =>
      classesValides.includes(c)
    )

    setFormEnfant({
      ...formEnfant,
      niveaux,
      classes,
      langues_speciales,
      precisions_langues,
    })
  }

  const precisionsDisponibles = () => {
    const p: { val: string; label: string; emoji: string }[] = []
    if (formEnfant.langues_speciales.includes('arabe')) {
      p.push(
        { val: 'arabe_debutant', label: 'Arabe — Débutant', emoji: '🅰️' },
        { val: 'arabe_conversation', label: 'Arabe — Conversation', emoji: '💬' },
        { val: 'arabe_grammaire', label: 'Arabe — Grammaire', emoji: '📚' },
        { val: 'arabe_perfectionnement', label: 'Arabe — Perfectionnement', emoji: '⭐' }
      )
    }
    if (formEnfant.langues_speciales.includes('coran')) {
      p.push(
        { val: 'coran_lecture', label: 'Coran — Lecture', emoji: '📖' },
        { val: 'coran_tajwid', label: 'Coran — Tajwid', emoji: '🎵' },
        { val: 'coran_memorisation', label: 'Coran — Mémorisation', emoji: '🧠' },
        { val: 'coran_tafsir', label: 'Coran — Tafsir', emoji: '📜' }
      )
    }
    if (formEnfant.langues_speciales.includes('francais')) {
      p.push(
        { val: 'francais_debutant', label: 'Français — Débutant', emoji: '🅰️' },
        { val: 'francais_conversation', label: 'Français — Conversation', emoji: '💬' },
        { val: 'francais_grammaire', label: 'Français — Grammaire', emoji: '📚' },
        { val: 'francais_perfectionnement', label: 'Français — Perfectionnement', emoji: '⭐' }
      )
    }
    if (formEnfant.langues_speciales.includes('anglais')) {
      p.push(
        { val: 'anglais_debutant', label: 'Anglais — Débutant', emoji: '🅰️' },
        { val: 'anglais_conversation', label: 'Anglais — Conversation', emoji: '💬' },
        { val: 'anglais_grammaire', label: 'Anglais — Grammaire', emoji: '📚' },
        { val: 'anglais_perfectionnement', label: 'Anglais — Perfectionnement', emoji: '⭐' }
      )
    }
    return p
  }

  const valider = () => {
    if (!formEnfant.prenom.trim()) {
      setErreur('Veuillez entrer le prénom')
      return false
    }
    if (formEnfant.niveaux.length === 0) {
      setErreur('Veuillez cocher au moins un niveau')
      return false
    }
    const aNormaux = formEnfant.niveaux.some((n) =>
      ['primaire', 'college', 'lycee'].includes(n)
    )
    if (aNormaux && formEnfant.classes.length === 0) {
      setErreur('Veuillez cocher au moins une classe')
      return false
    }
    if (formEnfant.niveaux.includes('langue_speciale')) {
      if (formEnfant.langues_speciales.length === 0) {
        setErreur('Veuillez cocher au moins une langue/Coran')
        return false
      }
      if (formEnfant.precisions_langues.length === 0) {
        setErreur("Veuillez préciser le type d'apprentissage")
        return false
      }
    }
    if (formEnfant.langues_comprises.length === 0) {
      setErreur('Veuillez cocher au moins une langue comprise')
      return false
    }
    setErreur('')
    return true
  }

  const enregistrer = async () => {
    if (!valider()) return

    setSauvegarde(true)

    try {
      if (modeEdition) {
        const { error } = await supabase
          .from('enfants')
          .update({
            prenom: formEnfant.prenom.trim(),
            niveaux: formEnfant.niveaux,
            classes: formEnfant.classes,
            langues_comprises: formEnfant.langues_comprises,
            langues_speciales: formEnfant.langues_speciales,
            precisions_langues: formEnfant.precisions_langues,
          })
          .eq('id', formEnfant.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('enfants').insert({
          parent_id: parentId,
          prenom: formEnfant.prenom.trim(),
          niveaux: formEnfant.niveaux,
          classes: formEnfant.classes,
          langues_comprises: formEnfant.langues_comprises,
          langues_speciales: formEnfant.langues_speciales,
          precisions_langues: formEnfant.precisions_langues,
        })

        if (error) throw error
      }

      await chargerEnfants()
      setModalOuvert(false)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setSauvegarde(false)
    }
  }

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer cet enfant ?')) return

    const { error } = await supabase.from('enfants').delete().eq('id', id)
    if (error) {
      alert('Erreur: ' + error.message)
      return
    }
    await chargerEnfants()
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

  return (
    <div className="space-y-6">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              👨‍👩‍👧 Mes enfants
            </h1>
            <p className="text-slate-600 text-sm">
              {enfants.length} enfant{enfants.length > 1 ? 's' : ''} enregistré
              {enfants.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={ouvrirAjout}
            className="px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            ➕ Ajouter un enfant
          </button>
        </div>

        {enfants.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <h3 className="font-black text-slate-900 text-xl mb-2">
              Aucun enfant enregistré
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Ajoutez vos enfants pour trouver les profs adaptés.
            </p>
            <button
              onClick={ouvrirAjout}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg"
            >
              ➕ Ajouter mon premier enfant
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {enfants.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-blue-300 transition-all"
              >
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                        👦
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-lg truncate">
                          {e.prenom}
                        </div>
                        <div className="text-xs text-slate-500">
                          {e.classes.join(', ') || 'Niveau non défini'}
                        </div>
                      </div>
                    </div>

                    {e.niveaux.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {e.niveaux.map((n) => (
                          <span
                            key={n}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200"
                          >
                            {labelsNiveau[n]}
                          </span>
                        ))}
                      </div>
                    )}

                    {e.langues_comprises.length > 0 && (
                      <>
                        <div className="text-xs text-slate-600 mb-2">
                          💬 Langues comprises :
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {e.langues_comprises.map((l) => (
                            <span
                              key={l}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold capitalize border border-emerald-200"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => ouvrirModif(e)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => supprimer(e.id)}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modalOuvert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-6 rounded-t-3xl sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    {modeEdition ? '✏️ Modifier' : '➕ Ajouter'} un enfant
                  </h2>
                  <button
                    onClick={() => setModalOuvert(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {erreur && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-red-700 text-sm font-medium">
                      {erreur}
                    </p>
                  </div>
                )}

                {/* Prénom */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEnfant.prenom}
                    onChange={(e) =>
                      setFormEnfant({
                        ...formEnfant,
                        prenom: e.target.value,
                      })
                    }
                    placeholder="Ex : Samira"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-800"
                  />
                </div>

                {/* Niveaux */}
                <div className="bg-blue-50/50 rounded-2xl p-4 border-2 border-blue-100">
                  <div className="font-bold text-slate-900 text-sm mb-3">
                    🎓 Niveaux <span className="text-red-500">*</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { val: 'primaire', label: 'Primaire', emoji: '🎒' },
                      { val: 'college', label: 'Collège', emoji: '📖' },
                      { val: 'lycee', label: 'Lycée', emoji: '🎓' },
                      {
                        val: 'langue_speciale',
                        label: 'Langue/Coran',
                        emoji: '📕',
                      },
                    ].map((n) => {
                      const actif = formEnfant.niveaux.includes(n.val)
                      return (
                        <motion.button
                          key={n.val}
                          type="button"
                          whileHover={{ scale: actif ? 1.03 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleNiveau(n.val)}
                          className={`relative py-3 rounded-xl font-bold text-xs transition-all ${
                            actif
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg border-4 border-blue-800'
                              : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {actif && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-600"
                            >
                              <svg
                                className="w-3 h-3 text-blue-600"
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
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xl">{n.emoji}</span>
                            <span>{n.label}</span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Classes */}
                {formEnfant.niveaux.some((n) =>
                  ['primaire', 'college', 'lycee'].includes(n)
                ) && (
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border-2 border-indigo-100">
                    <div className="font-bold text-slate-900 text-sm mb-3">
                      📚 Classes <span className="text-red-500">*</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {classesParNiveau(formEnfant.niveaux).map((c) => {
                        const actif = formEnfant.classes.includes(c)
                        return (
                          <motion.button
                            key={c}
                            type="button"
                            whileHover={{ scale: actif ? 1.03 : 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleTableau('classes', c)}
                            className={`relative py-2.5 rounded-xl font-bold text-sm transition-all ${
                              actif
                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg border-4 border-indigo-800'
                                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {c}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Langues spéciales */}
                {formEnfant.niveaux.includes('langue_speciale') && (
                  <div className="bg-pink-50/50 rounded-2xl p-4 border-2 border-pink-100">
                    <div className="font-bold text-slate-900 text-sm mb-3">
                      📕 Quelle langue ou le Coran ?{' '}
                      <span className="text-red-500">*</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { val: 'arabe', label: 'Arabe' },
                        { val: 'coran', label: 'Coran' },
                        { val: 'francais', label: 'Français' },
                        { val: 'anglais', label: 'Anglais' },
                      ].map((l) => {
                        const actif = formEnfant.langues_speciales.includes(
                          l.val
                        )
                        return (
                          <motion.button
                            key={l.val}
                            type="button"
                            whileHover={{ scale: actif ? 1.03 : 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const ls = formEnfant.langues_speciales
                              const pl = formEnfant.precisions_langues
                              const nouvellesLS = ls.includes(l.val)
                                ? ls.filter((x) => x !== l.val)
                                : [...ls, l.val]
                              const nouvellesPL = ls.includes(l.val)
                                ? pl.filter((p) => !p.startsWith(l.val))
                                : pl
                              setFormEnfant({
                                ...formEnfant,
                                langues_speciales: nouvellesLS,
                                precisions_langues: nouvellesPL,
                              })
                            }}
                            className={`py-3 rounded-xl font-bold text-sm transition-all ${
                              actif
                                ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-lg border-4 border-pink-800'
                                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-pink-300'
                            }`}
                          >
                            {l.label}
                          </motion.button>
                        )
                      })}
                    </div>

                    {precisionsDisponibles().length > 0 && (
                      <div className="pt-3 border-t border-pink-200">
                        <div className="text-xs font-bold text-pink-700 mb-2">
                          🎯 Précisez :
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {precisionsDisponibles().map((p) => {
                            const actif =
                              formEnfant.precisions_langues.includes(p.val)
                            return (
                              <motion.button
                                key={p.val}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  toggleTableau('precisions_langues', p.val)
                                }
                                className={`p-2.5 rounded-xl font-bold text-xs border-2 transition-all flex items-center gap-2 ${
                                  actif
                                    ? 'border-pink-600 bg-pink-600 text-white shadow-lg'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-pink-300'
                                }`}
                              >
                                <span>{p.emoji}</span>
                                <span>{p.label}</span>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Langues comprises */}
                <div className="bg-emerald-50/50 rounded-2xl p-4 border-2 border-emerald-100">
                  <div className="font-bold text-slate-900 text-sm mb-2">
                    💬 Langues comprises{' '}
                    <span className="text-red-500">*</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Langues que votre enfant comprend et parle
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'francais', label: 'Français' },
                      { val: 'arabe', label: 'Arabe' },
                      { val: 'somali', label: 'Somali' },
                      { val: 'afar', label: 'Afar' },
                    ].map((l) => {
                      const actif =
                        formEnfant.langues_comprises.includes(l.val)
                      return (
                        <motion.button
                          key={l.val}
                          type="button"
                          whileHover={{ scale: actif ? 1.03 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            toggleTableau('langues_comprises', l.val)
                          }
                          className={`py-3 rounded-xl font-bold text-sm transition-all ${
                            actif
                              ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg border-4 border-emerald-800'
                              : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {l.label}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex gap-3 sticky bottom-0">
                <button
                  onClick={() => setModalOuvert(false)}
                  disabled={sauvegarde}
                  className="flex-1 py-3.5 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrer}
                  disabled={sauvegarde}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sauvegarde ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Sauvegarde...
                    </>
                  ) : (
                    <>✓ {modeEdition ? 'Enregistrer' : 'Ajouter'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}