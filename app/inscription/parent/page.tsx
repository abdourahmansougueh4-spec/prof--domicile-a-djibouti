'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Enfant = {
  prenom: string
  niveaux: string[]
  classes: string[]
  languesComprises: string[]
  languesSpeciales: string[]
  precisionsLangues: string[]
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function InscriptionParent() {
  const router = useRouter()
  const supabase = createClient()

  const [etape, setEtape] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  const [parent, setParent] = useState({
    nomComplet: '',
    email: '',
    motDePasse: '',
    telephone: '',
    whatsapp: '',
    quartier: '',
  })

  const [enfants, setEnfants] = useState<Enfant[]>([
    {
      prenom: '',
      niveaux: [],
      classes: [],
      languesComprises: [],
      languesSpeciales: [],
      precisionsLangues: [],
    },
  ])

  const [preferences, setPreferences] = useState({
    unSeulProf: false,
    unProfParMatiere: false,
    coursADomicile: true,
  })

  const ajouterEnfant = () => {
    setEnfants([
      ...enfants,
      {
        prenom: '',
        niveaux: [],
        classes: [],
        languesComprises: [],
        languesSpeciales: [],
        precisionsLangues: [],
      },
    ])
  }

  const supprimerEnfant = (index: number) => {
    if (enfants.length > 1) {
      setEnfants(enfants.filter((_, i) => i !== index))
    }
  }

  const modifierEnfant = (
    index: number,
    champ: keyof Enfant,
    valeur: string | string[]
  ) => {
    const nouveaux = [...enfants]
    nouveaux[index] = { ...nouveaux[index], [champ]: valeur }
    setEnfants(nouveaux)
  }

  const toggleItem = (
    index: number,
    champ: 'niveaux' | 'classes' | 'languesComprises' | 'languesSpeciales' | 'precisionsLangues',
    valeur: string
  ) => {
    const nouveaux = [...enfants]
    const enfant = { ...nouveaux[index] }
    const liste = enfant[champ]
    if (liste.includes(valeur)) {
      enfant[champ] = liste.filter((v) => v !== valeur)
    } else {
      enfant[champ] = [...liste, valeur]
    }
    nouveaux[index] = enfant
    setEnfants(nouveaux)
  }

  const toggleNiveau = (index: number, niveau: string) => {
    const nouveaux = [...enfants]
    const enfant = { ...nouveaux[index] }

    if (enfant.niveaux.includes(niveau)) {
      enfant.niveaux = enfant.niveaux.filter((n) => n !== niveau)
      if (niveau === 'langue_speciale') {
        enfant.languesSpeciales = []
        enfant.precisionsLangues = []
      }
    } else {
      enfant.niveaux = [...enfant.niveaux, niveau]
    }

    const classesValides: string[] = []
    if (enfant.niveaux.includes('primaire')) {
      classesValides.push('1ère année', '2ème année', '3ème année', '4ème année', '5ème année')
    }
    if (enfant.niveaux.includes('college')) {
      classesValides.push('6ème', '7ème', '8ème', '9ème')
    }
    if (enfant.niveaux.includes('lycee')) {
      classesValides.push('Seconde', 'Première', 'Terminale')
    }
    enfant.classes = enfant.classes.filter((c) => classesValides.includes(c))

    nouveaux[index] = enfant
    setEnfants(nouveaux)
  }

  const classesDisponibles = (niveauxChoisis: string[]) => {
    const classes: string[] = []
    if (niveauxChoisis.includes('primaire')) {
      classes.push('1ère année', '2ème année', '3ème année', '4ème année', '5ème année')
    }
    if (niveauxChoisis.includes('college')) {
      classes.push('6ème', '7ème', '8ème', '9ème')
    }
    if (niveauxChoisis.includes('lycee')) {
      classes.push('Seconde', 'Première', 'Terminale')
    }
    return classes
  }

  const matieresParNiveaux = (niveauxChoisis: string[]) => {
    const matieres: string[] = []
    if (niveauxChoisis.includes('primaire'))
      matieres.push('Primaire : toutes matières (français + arabe)')
    if (niveauxChoisis.includes('college'))
      matieres.push('Collège : Maths, Physique, SVT, Français, Anglais, Arabe')
    if (niveauxChoisis.includes('lycee'))
      matieres.push('Lycée : Maths (autres bientôt)')
    if (niveauxChoisis.includes('langue_speciale'))
      matieres.push('Langues / Coran : cours spéciaux')
    return matieres
  }

  const precisionsDisponibles = (langues: string[]) => {
    const precisions: { val: string; label: string; emoji: string }[] = []
    if (langues.includes('arabe')) {
      precisions.push(
        { val: 'arabe_debutant', label: 'Arabe — Débutant', emoji: '🅰️' },
        { val: 'arabe_conversation', label: 'Arabe — Conversation', emoji: '💬' },
        { val: 'arabe_grammaire', label: 'Arabe — Grammaire', emoji: '📚' },
        { val: 'arabe_perfectionnement', label: 'Arabe — Perfectionnement', emoji: '⭐' }
      )
    }
    if (langues.includes('coran')) {
      precisions.push(
        { val: 'coran_lecture', label: 'Coran — Lecture', emoji: '📖' },
        { val: 'coran_tajwid', label: 'Coran — Tajwid', emoji: '🎵' },
        { val: 'coran_memorisation', label: 'Coran — Mémorisation', emoji: '🧠' },
        { val: 'coran_tafsir', label: 'Coran — Tafsir', emoji: '📜' }
      )
    }
    if (langues.includes('francais')) {
      precisions.push(
        { val: 'francais_debutant', label: 'Français — Débutant', emoji: '🅰️' },
        { val: 'francais_conversation', label: 'Français — Conversation', emoji: '💬' },
        { val: 'francais_grammaire', label: 'Français — Grammaire', emoji: '📚' },
        { val: 'francais_perfectionnement', label: 'Français — Perfectionnement', emoji: '⭐' }
      )
    }
    if (langues.includes('anglais')) {
      precisions.push(
        { val: 'anglais_debutant', label: 'Anglais — Débutant', emoji: '🅰️' },
        { val: 'anglais_conversation', label: 'Anglais — Conversation', emoji: '💬' },
        { val: 'anglais_grammaire', label: 'Anglais — Grammaire', emoji: '📚' },
        { val: 'anglais_perfectionnement', label: 'Anglais — Perfectionnement', emoji: '⭐' }
      )
    }
    return precisions
  }

  const validerEtape1 = () => {
    if (!parent.nomComplet || !parent.email || !parent.motDePasse) {
      setErreur('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (parent.motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }
    setErreur('')
    return true
  }

  const validerEtape2 = () => {
    for (let i = 0; i < enfants.length; i++) {
      const e = enfants[i]
      if (e.niveaux.length === 0) {
        setErreur(`Veuillez cocher au moins un niveau pour l'enfant ${i + 1}`)
        return false
      }
      const aNiveauxNormaux = e.niveaux.some((n) =>
        ['primaire', 'college', 'lycee'].includes(n)
      )
      if (aNiveauxNormaux && e.classes.length === 0) {
        setErreur(`Veuillez cocher au moins une classe pour l'enfant ${i + 1}`)
        return false
      }
      if (e.niveaux.includes('langue_speciale')) {
        if (e.languesSpeciales.length === 0) {
          setErreur(`Veuillez cocher au moins une langue ou le Coran pour l'enfant ${i + 1}`)
          return false
        }
        if (e.precisionsLangues.length === 0) {
          setErreur(`Veuillez préciser le type d'apprentissage pour l'enfant ${i + 1}`)
          return false
        }
      }
      if (e.languesComprises.length === 0) {
        setErreur(`Veuillez cocher au moins une langue comprise par l'enfant ${i + 1}`)
        return false
      }
    }
    setErreur('')
    return true
  }

  const suivant = () => {
    if (etape === 1 && !validerEtape1()) return
    if (etape === 2 && !validerEtape2()) return
    setEtape(etape + 1)
  }

  const precedent = () => {
    setErreur('')
    setEtape(etape - 1)
  }
const soumettre = async () => {
  setLoading(true)
  setErreur('')

  try {
    // 1. Créer l'utilisateur via l'API (service_role, pas de confirmation email)
    const response = await fetch('/api/creer-utilisateur', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: parent.email,
        password: parent.motDePasse,
        nomComplet: parent.nomComplet,
        role: 'parent',
      }),
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      if (result.error?.includes('already')) {
        setErreur('Cet email est déjà utilisé. Connectez-vous plutôt.')
      } else {
        setErreur(`Erreur : ${result.error || 'inconnue'}`)
      }
      setLoading(false)
      return
    }

    const userId = result.userId

    // 2. Se connecter (l'utilisateur est déjà confirmé)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parent.email,
      password: parent.motDePasse,
    })

    if (signInError) {
      console.error('Erreur signIn:', JSON.stringify(signInError, null, 2))
    }

    // 3. Mettre à jour le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        telephone: parent.telephone,
        whatsapp: parent.whatsapp,
        quartier: parent.quartier,
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Erreur profil:', JSON.stringify(profileError, null, 2))
    }

    // 4. Créer l'entrée parent
    const { error: parentError } = await supabase.from('parents').insert({
      id: userId,
      nombre_enfants: enfants.length,
      preference_organisation: preferences.unSeulProf
        ? 'un_seul_prof'
        : 'un_prof_par_matiere',
      cours_a_domicile: preferences.coursADomicile,
    })

    if (parentError) {
      console.error('Erreur parent:', JSON.stringify(parentError, null, 2))
    }

    // 5. Créer les enfants
    const enfantsData = enfants.map((e) => ({
      parent_id: userId,
      prenom: e.prenom || 'Enfant',
      niveaux: e.niveaux,
      classes: e.classes,
      langues_comprises: e.languesComprises,
      langues_speciales: e.languesSpeciales,
      precisions_langues: e.precisionsLangues,
    }))

    const { error: enfantsError } = await supabase
      .from('enfants')
      .insert(enfantsData)

    if (enfantsError) {
      console.error('Erreur enfants:', JSON.stringify(enfantsError, null, 2))
    }

    alert('🎉 Inscription réussie !\n\nBienvenue sur Prof À Domicile Djibouti.')
    router.push('/espace-parent')
  } catch (err) {
    console.error('Erreur générale:', err)
    setErreur('Une erreur est survenue. Veuillez réessayer.')
  } finally {
    setLoading(false)
  }
}

  const etapes = [
    { num: 1, titre: 'Vos informations', desc: 'Nom, email, contact' },
    { num: 2, titre: 'Vos enfants', desc: 'Niveaux, classes, langues' },
    { num: 3, titre: 'Préférences', desc: 'Organisation des cours' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-emerald-300/30 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <nav className="relative z-10 backdrop-blur-md bg-white/70 border-b border-white/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-xl">🇩🇯</span>
          </Link>
          <a
            href="https://wa.me/25377741482"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
          >
            💬 Aide
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Inscription gratuite · 2 minutes
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Rejoignez la communauté
            <br />
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              éducative de Djibouti
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Trouvez le professeur idéal pour vos enfants. Vérifié, adapté à
            leurs langues, et disponible près de chez vous.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl shadow-blue-900/5 sticky top-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                Votre progression
              </h3>
              <div className="space-y-1">
                {etapes.map((e) => (
                  <div key={e.num} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{
                          scale: etape === e.num ? 1.1 : 1,
                          backgroundColor:
                            etape > e.num
                              ? '#059669'
                              : etape === e.num
                              ? '#1d4ed8'
                              : '#e2e8f0',
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                      >
                        {etape > e.num ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          e.num
                        )}
                      </motion.div>
                      {e.num < 3 && (
                        <div
                          className={`w-0.5 h-12 my-1 transition-colors ${
                            etape > e.num ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-2 pb-6">
                      <div
                        className={`font-bold text-sm transition-colors ${
                          etape >= e.num ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {e.titre}
                      </div>
                      <div className="text-xs text-slate-500">{e.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200/70 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">🔒</span>
                  <span>Données chiffrées</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">✅</span>
                  <span>Vérifié sous 24h</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">🇩🇯</span>
                  <span>100% djiboutien</span>
                </div>
              </div>
            </div>
          </motion.aside>

          <div className="lg:col-span-1">
            <div className="lg:hidden mb-6 flex gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    n <= etape
                      ? 'bg-gradient-to-r from-blue-700 to-emerald-600'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence>
              {erreur && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl p-4 flex items-start gap-3"
                >
                  <span className="text-xl">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{erreur}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl shadow-blue-900/10 overflow-hidden">
              <AnimatePresence mode="wait">
                {etape === 1 && (
                  <motion.div key="etape1" {...fadeUp} transition={{ duration: 0.4 }} className="p-8 md:p-10">
                    <div className="mb-8">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                        Étape 1 / 3
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos informations</h2>
                      <p className="text-slate-500 mt-2">Ces informations resteront confidentielles.</p>
                    </div>

                    <div className="space-y-5">
                      <Field
                        label="Nom complet"
                        required
                        value={parent.nomComplet}
                        onChange={(v) => setParent({ ...parent, nomComplet: v })}
                        placeholder="Ex : Ahmed Hassan"
                      />
                      <Field
                        label="Email"
                        required
                        type="email"
                        value={parent.email}
                        onChange={(v) => setParent({ ...parent, email: v })}
                        placeholder="exemple@email.com"
                      />
                      <Field
                        label="Mot de passe"
                        required
                        type="password"
                        value={parent.motDePasse}
                        onChange={(v) => setParent({ ...parent, motDePasse: v })}
                        placeholder="Au moins 6 caractères"
                        hint="Utilisez un mélange de lettres et de chiffres"
                      />
                      <div className="grid md:grid-cols-2 gap-5">
                        <Field
                          label="Téléphone"
                          type="tel"
                          value={parent.telephone}
                          onChange={(v) => setParent({ ...parent, telephone: v })}
                          placeholder="+253 ..."
                        />
                        <Field
                          label="WhatsApp"
                          type="tel"
                          value={parent.whatsapp}
                          onChange={(v) => setParent({ ...parent, whatsapp: v })}
                          placeholder="+253 ..."
                        />
                      </div>
                      <Field
                        label="Quartier à Djibouti"
                        value={parent.quartier}
                        onChange={(v) => setParent({ ...parent, quartier: v })}
                        placeholder="Ex : Héron, Balbala, Centre-ville..."
                      />
                    </div>
                  </motion.div>
                )}

                {etape === 2 && (
                  <motion.div key="etape2" {...fadeUp} transition={{ duration: 0.4 }} className="p-8 md:p-10">
                    <div className="mb-8">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                        Étape 2 / 3
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos enfants</h2>
                      <p className="text-slate-500 mt-2">Ajoutez autant d'enfants que nécessaire.</p>
                    </div>

                    <div className="space-y-6">
                      {enfants.map((enfant, index) => {
                        const classesDispo = classesDisponibles(enfant.niveaux)
                        const matieres = matieresParNiveaux(enfant.niveaux)
                        const precisions = precisionsDisponibles(enfant.languesSpeciales)
                        const aNiveauxNormaux = enfant.niveaux.some((n) =>
                          ['primaire', 'college', 'lycee'].includes(n)
                        )
                        const aLangueSpeciale = enfant.niveaux.includes('langue_speciale')

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-6 border border-slate-200/70"
                          >
                            <div className="flex justify-between items-center mb-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                  {index + 1}
                                </div>
                                <span className="font-bold text-slate-800">Enfant {index + 1}</span>
                              </div>
                              {enfants.length > 1 && (
                                <button
                                  onClick={() => supprimerEnfant(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg text-sm transition-colors"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>

                            <div className="space-y-5">
                              <Field
                                label="Prénom (optionnel)"
                                value={enfant.prenom}
                                onChange={(v) => modifierEnfant(index, 'prenom', v)}
                                placeholder="Ex : Fatima"
                              />

                              <div className="bg-white/70 rounded-2xl p-5 border border-blue-100">
                                <div className="flex items-start gap-3 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-base">🎓</span>
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">Niveaux de l'enfant</div>
                                    <div className="text-xs text-slate-500">Cochez un ou plusieurs niveaux</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {[
                                    { val: 'primaire', label: 'Primaire', emoji: '🎒', sousTitre: '1ère - 5ème' },
                                    { val: 'college', label: 'Collège', emoji: '📖', sousTitre: '6ème - 9ème' },
                                    { val: 'lycee', label: 'Lycée', emoji: '🎓', sousTitre: '2nde - Tle' },
                                    { val: 'langue_speciale', label: 'Langue / Coran', emoji: '📕', sousTitre: 'Cours spécial' },
                                  ].map((n) => {
                                    const actif = enfant.niveaux.includes(n.val)
                                    return (
                                      <motion.button
                                        key={n.val}
                                        type="button"
                                        whileHover={{ scale: actif ? 1.03 : 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleNiveau(index, n.val)}
                                        className={`relative py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                                          actif
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/40 border-4 border-blue-800 scale-105'
                                            : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-300'
                                        }`}
                                      >
                                        {actif && (
                                          <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-600"
                                          >
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </motion.div>
                                        )}
                                        <div className="flex flex-col items-center gap-1">
                                          <span className="text-2xl">{n.emoji}</span>
                                          <span>{n.label}</span>
                                          <span className={`text-[10px] font-semibold ${actif ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {n.sousTitre}
                                          </span>
                                        </div>
                                      </motion.button>
                                    )
                                  })}
                                </div>

                                {matieres.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100"
                                  >
                                    <p className="text-xs font-bold text-blue-900 mb-1">📚 Matières disponibles :</p>
                                    {matieres.map((m, i) => (
                                      <p key={i} className="text-xs text-blue-800">• {m}</p>
                                    ))}
                                  </motion.div>
                                )}
                              </div>

                              <AnimatePresence>
                                {aNiveauxNormaux && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white/70 rounded-2xl p-5 border border-indigo-100"
                                  >
                                    <div className="flex items-start gap-3 mb-4">
                                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-base">📚</span>
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 text-sm">Classes précises</div>
                                        <div className="text-xs text-slate-500">Cochez une ou plusieurs classes</div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {classesDispo.map((c) => {
                                        const actif = enfant.classes.includes(c)
                                        return (
                                          <motion.button
                                            key={c}
                                            type="button"
                                            whileHover={{ scale: actif ? 1.03 : 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleItem(index, 'classes', c)}
                                            className={`relative py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                                              actif
                                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/40 border-4 border-indigo-800 scale-105'
                                                : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-300'
                                            }`}
                                          >
                                            {actif && (
                                              <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-600"
                                              >
                                                <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                              </motion.div>
                                            )}
                                            {c}
                                          </motion.button>
                                        )
                                      })}
                                    </div>

                                    {enfant.classes.length > 0 && (
                                      <p className="text-xs text-indigo-700 font-bold mt-3">
                                        ✓ {enfant.classes.length} {enfant.classes.length === 1 ? 'classe sélectionnée' : 'classes sélectionnées'}
                                      </p>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <AnimatePresence>
                                {aLangueSpeciale && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white/70 rounded-2xl p-5 border border-purple-100"
                                  >
                                    <div className="flex items-start gap-3 mb-4">
                                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-base">📕</span>
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 text-sm">Quelle langue ou le Coran ?</div>
                                        <div className="text-xs text-slate-500">Cochez une ou plusieurs options</div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                      {[
                                        { val: 'arabe', label: 'Arabe' },
                                        { val: 'coran', label: 'Coran' },
                                        { val: 'francais', label: 'Français' },
                                        { val: 'anglais', label: 'Anglais' },
                                      ].map((l) => {
                                        const actif = enfant.languesSpeciales.includes(l.val)
                                        return (
                                          <motion.button
                                            key={l.val}
                                            type="button"
                                            whileHover={{ scale: actif ? 1.03 : 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                              const nouveaux = [...enfants]
                                              const enf = { ...nouveaux[index] }
                                              if (enf.languesSpeciales.includes(l.val)) {
                                                enf.languesSpeciales = enf.languesSpeciales.filter((v) => v !== l.val)
                                                enf.precisionsLangues = enf.precisionsLangues.filter((p) => !p.startsWith(l.val))
                                              } else {
                                                enf.languesSpeciales = [...enf.languesSpeciales, l.val]
                                              }
                                              nouveaux[index] = enf
                                              setEnfants(nouveaux)
                                            }}
                                            className={`relative py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                                              actif
                                                ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-xl shadow-purple-600/40 border-4 border-purple-800 scale-105'
                                                : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-purple-300'
                                            }`}
                                          >
                                            {actif && (
                                              <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-purple-600"
                                              >
                                                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                              </motion.div>
                                            )}
                                            {l.label}
                                          </motion.button>
                                        )
                                      })}
                                    </div>

                                    {precisions.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="pt-4 border-t border-purple-100"
                                      >
                                        <div className="text-xs font-bold text-purple-700 mb-3">
                                          🎯 Précisez le type d'apprentissage :
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {precisions.map((p) => {
                                            const actif = enfant.precisionsLangues.includes(p.val)
                                            return (
                                              <motion.button
                                                key={p.val}
                                                type="button"
                                                whileHover={{ scale: actif ? 1.02 : 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => toggleItem(index, 'precisionsLangues', p.val)}
                                                className={`p-3 rounded-xl font-bold text-xs border-2 transition-all flex items-center gap-2 ${
                                                  actif
                                                    ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                                                }`}
                                              >
                                                <span>{p.emoji}</span>
                                                <span>{p.label}</span>
                                              </motion.button>
                                            )
                                          })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="bg-white/70 rounded-2xl p-5 border border-emerald-100">
                                <div className="flex items-start gap-3 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-base">💬</span>
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">
                                      Langues comprises par l'enfant
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                      Le professeur communiquera dans la <strong>langue d'étude</strong>. Mais il est important de connaître les langues que votre enfant <strong>comprend bien</strong>, pour que la communication ne se coupe pas.
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                                  <p className="text-xs font-semibold text-emerald-800">
                                    ✅ Cochez toutes les langues que votre enfant comprend et parle
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    { val: 'francais', label: 'Français' },
                                    { val: 'arabe', label: 'Arabe' },
                                    { val: 'somali', label: 'Somali' },
                                    { val: 'afar', label: 'Afar' },
                                  ].map((l) => {
                                    const actif = enfant.languesComprises.includes(l.val)
                                    return (
                                      <motion.button
                                        key={l.val}
                                        type="button"
                                        whileHover={{ scale: actif ? 1.03 : 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleItem(index, 'languesComprises', l.val)}
                                        className={`relative py-4 rounded-2xl font-bold text-sm flex items-center justify-center transition-all duration-200 ${
                                          actif
                                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-xl shadow-emerald-600/40 border-4 border-emerald-800 scale-105'
                                            : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-300'
                                        }`}
                                      >
                                        {actif && (
                                          <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-600"
                                          >
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </motion.div>
                                        )}
                                        {l.label}
                                      </motion.button>
                                    )
                                  })}
                                </div>

                                {enfant.languesComprises.length > 0 && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-emerald-700 font-bold mt-3"
                                  >
                                    ✓ {enfant.languesComprises.length} {enfant.languesComprises.length === 1 ? 'langue sélectionnée' : 'langues sélectionnées'}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={ajouterEnfant}
                        className="w-full py-5 border-2 border-dashed border-blue-300 rounded-2xl text-blue-700 font-bold hover:bg-blue-50 hover:border-blue-500 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="text-xl">➕</span>
                        Ajouter un autre enfant
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {etape === 3 && (
                  <motion.div key="etape3" {...fadeUp} transition={{ duration: 0.4 }} className="p-8 md:p-10">
                    <div className="mb-8">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                        Étape 3 / 3
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos préférences</h2>
                      <p className="text-slate-500 mt-2">Comment souhaitez-vous organiser les cours ?</p>
                    </div>

                    <div className="space-y-5">
                      {[
                        {
                          id: 'unSeulProf',
                          titre: 'Un seul professeur pour tous mes enfants',
                          desc: 'Idéal si vos enfants ont des niveaux proches',
                          emoji: '👨‍🏫',
                        },
                        {
                          id: 'unProfParMatiere',
                          titre: 'Un professeur par matière',
                          desc: 'Idéal pour avoir des spécialistes par matière',
                          emoji: '📚',
                        },
                      ].map((opt) => {
                        const actif = preferences[opt.id as keyof typeof preferences] as boolean
                        return (
                          <motion.label
                            key={opt.id}
                            whileHover={{ scale: 1.01 }}
                            className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                              actif
                                ? 'border-blue-600 bg-blue-50/70 shadow-lg shadow-blue-600/10'
                                : 'border-slate-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            {actif && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-600"
                              >
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                            <input
                              type="radio"
                              name="organisation"
                              checked={actif}
                              onChange={() =>
                                setPreferences({
                                  ...preferences,
                                  unSeulProf: opt.id === 'unSeulProf',
                                  unProfParMatiere: opt.id === 'unProfParMatiere',
                                })
                              }
                              className="mt-1 w-5 h-5 accent-blue-700"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{opt.emoji}</span>
                                <span className="font-bold text-slate-900">{opt.titre}</span>
                              </div>
                              <div className="text-sm text-slate-500">{opt.desc}</div>
                            </div>
                          </motion.label>
                        )
                      })}

                      <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl hover:bg-slate-50 border border-slate-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={preferences.coursADomicile}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              coursADomicile: e.target.checked,
                            })
                          }
                          className="w-5 h-5 accent-blue-700"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          🏠 Je préfère les cours à mon domicile
                        </span>
                      </label>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
                        <div className="flex gap-3">
                          <span className="text-xl">ℹ️</span>
                          <div>
                            <p className="text-sm font-semibold text-blue-900 mb-1">Bon à savoir</p>
                            <p className="text-sm text-blue-800">
                              Vous pourrez discuter des horaires précis et des prix directement avec le professeur après votre première rencontre.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-slate-200/70 bg-white/60 backdrop-blur-sm p-6 md:p-8 flex gap-4">
                {etape > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={precedent}
                    disabled={loading}
                    className="px-6 py-4 rounded-2xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    ← Précédent
                  </motion.button>
                )}
                {etape < 3 ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={suivant}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
                  >
                    Continuer →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    onClick={soumettre}
                    disabled={loading}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Création du compte...
                      </>
                    ) : (
                      '✓ Créer mon compte'
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            <div className="text-center mt-6">
              <a
                href="https://wa.me/25377741482"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-2"
              >
                💬 Besoin d'aide ? Contactez-nous sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
      />
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )
}
