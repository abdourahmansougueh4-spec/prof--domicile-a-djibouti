'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// VALIDATION
// ============================================================

const emailValide = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(email) && email.length <= 254
}

const telephoneValide = (tel: string): boolean => {
  const chiffres = tel.replace(/\D/g, '')
  return chiffres.length >= 8
}

// ============================================================
// COMPOSANT
// ============================================================

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
    unSeulProf: true,
    unProfParMatiere: false,
    coursADomicile: true,
  })

  // ============================================================
  // HELPERS ENFANTS
  // ============================================================

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

  // ✅ CORRIGÉ : Plus de Tafsir pour le Coran
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
        { val: 'coran_memorisation', label: 'Coran — Mémorisation', emoji: '🧠' }
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

  // ============================================================
  // VALIDATION ÉTAPES
  // ============================================================

  const validerEtape1 = () => {
    if (!parent.nomComplet.trim()) {
      setErreur('Veuillez saisir votre nom complet')
      return false
    }
    if (parent.nomComplet.trim().length < 3) {
      setErreur('Le nom doit contenir au moins 3 caractères')
      return false
    }
    if (!parent.email.trim()) {
      setErreur('Veuillez saisir votre adresse email')
      return false
    }
    if (!emailValide(parent.email.trim())) {
      setErreur('Le format de l\'adresse email est invalide')
      return false
    }
    if (!parent.motDePasse) {
      setErreur('Veuillez choisir un mot de passe')
      return false
    }
    if (parent.motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }
    if (parent.telephone && !telephoneValide(parent.telephone)) {
      setErreur('Le numéro de téléphone est invalide (8 chiffres minimum)')
      return false
    }
    if (parent.whatsapp && !telephoneValide(parent.whatsapp)) {
      setErreur('Le numéro WhatsApp est invalide (8 chiffres minimum)')
      return false
    }
    setErreur('')
    return true
  }

  // ✅ CORRIGÉ : Le Coran ne requiert PAS de niveau
  const validerEtape2 = () => {
    for (let i = 0; i < enfants.length; i++) {
      const e = enfants[i]

      if (e.niveaux.length === 0) {
        setErreur(`Veuillez cocher au moins un type de cours pour l'enfant ${i + 1}`)
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
          setErreur(`Veuillez préciser quelle langue ou le Coran pour l'enfant ${i + 1}`)
          return false
        }
        if (e.precisionsLangues.length === 0) {
          setErreur(`Veuillez préciser le type d'apprentissage (Lecture, Tajwid, Mémorisation) pour l'enfant ${i + 1}`)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const precedent = () => {
    setErreur('')
    setEtape(etape - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ============================================================
  // SOUMISSION
  // ============================================================

  const soumettre = async () => {
    setLoading(true)
    setErreur('')

    try {
      const response = await fetch('/api/creer-utilisateur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: parent.email.trim().toLowerCase(),
          password: parent.motDePasse,
          nomComplet: parent.nomComplet.trim(),
          role: 'parent',
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        const msg = (result.error || '').toLowerCase()
        if (msg.includes('already') || msg.includes('existe')) {
          setErreur('Cet email est déjà utilisé. Connectez-vous plutôt.')
        } else {
          setErreur('Impossible de créer votre compte. Réessayez.')
        }
        setLoading(false)
        return
      }

      const userId = result.userId

      await supabase.auth.signInWithPassword({
        email: parent.email.trim().toLowerCase(),
        password: parent.motDePasse,
      })

      await supabase
        .from('profiles')
        .update({
          telephone: parent.telephone,
          whatsapp: parent.whatsapp,
          quartier: parent.quartier,
        })
        .eq('id', userId)

      await supabase.from('parents').insert({
        id: userId,
        nombre_enfants: enfants.length,
        preference_organisation: preferences.unSeulProf
          ? 'un_seul_prof'
          : 'un_prof_par_matiere',
        cours_a_domicile: preferences.coursADomicile,
      })

      const enfantsData = enfants.map((e) => ({
        parent_id: userId,
        prenom: e.prenom || 'Enfant',
        niveaux: e.niveaux,
        classes: e.classes,
        langues_comprises: e.languesComprises,
        langues_speciales: e.languesSpeciales,
        precisions_langues: e.precisionsLangues,
      }))

      await supabase.from('enfants').insert(enfantsData)

      router.push('/espace-parent')
    } catch (err) {
      console.error('Erreur générale:', err)
      setErreur('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // CONFIG ÉTAPES
  // ============================================================

  const etapes = [
    { num: 1, titre: 'Vos informations', desc: 'Nom, email, contact' },
    { num: 2, titre: 'Vos enfants', desc: 'Niveaux, classes, langues' },
    { num: 3, titre: 'Préférences', desc: 'Organisation des cours' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Décor discret */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900">
              Prof À Domicile
            </span>
            <span className="text-lg">🇩🇯</span>
          </Link>
          <a
            href="https://wa.me/25377741482"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Aide
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Inscription parent
          </h1>
          <p className="text-base text-slate-500 max-w-xl mx-auto">
            Trouvez le professeur idéal pour vos enfants en quelques minutes.
          </p>
        </motion.div>

        {/* Layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar progression */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                Progression
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
                              ? '#0f172a'
                              : '#e2e8f0',
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
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
                      <div className="text-xs text-slate-500 mt-0.5">{e.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-base">🔒</span>
                  <span>Données sécurisées</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-base">✓</span>
                  <span>Vérification sous 24h</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-base">🇩🇯</span>
                  <span>100% djiboutien</span>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Formulaire */}
          <div>
            {/* Barre mobile */}
            <div className="lg:hidden mb-6 flex gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    n <= etape
                      ? 'bg-slate-900'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Erreur globale */}
            <AnimatePresence>
              {erreur && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3"
                >
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <p className="text-rose-700 text-sm font-medium flex-1">{erreur}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Carte formulaire */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <AnimatePresence mode="wait">
                {/* ============================================================ */}
                {/* ÉTAPE 1 */}
                {/* ============================================================ */}
                {etape === 1 && (
                  <motion.div
                    key="etape1"
                    {...fadeUp}
                    transition={{ duration: 0.3 }}
                    className="p-6 sm:p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Étape 1 / 3
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        Vos informations
                      </h2>
                      <p className="text-sm text-slate-500 mt-2">
                        Ces informations resteront strictement confidentielles.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Nom complet <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="nom"
                          autoComplete="name"
                          value={parent.nomComplet}
                          onChange={(e) =>
                            setParent({ ...parent, nomComplet: e.target.value })
                          }
                          placeholder="Ex : Ahmed Hassan"
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors placeholder:text-slate-400"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Adresse email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          autoComplete="email"
                          data-lpignore="true"
                          data-form-type="other"
                          value={parent.email}
                          onChange={(e) =>
                            setParent({ ...parent, email: e.target.value })
                          }
                          placeholder="exemple@email.com"
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          Nous vous enverrons un email de confirmation.
                        </p>
                      </div>

                      {/* Mot de passe */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Mot de passe <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          name="new-password"
                          id="new-password"
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-form-type="other"
                          value={parent.motDePasse}
                          onChange={(e) =>
                            setParent({ ...parent, motDePasse: e.target.value })
                          }
                          placeholder="Au moins 6 caractères"
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          Utilisez un mélange de lettres et de chiffres.
                        </p>
                      </div>

                      {/* Téléphone + WhatsApp */}
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            name="tel"
                            autoComplete="tel"
                            value={parent.telephone}
                            onChange={(e) =>
                              setParent({ ...parent, telephone: e.target.value })
                            }
                            placeholder="+253 77 00 00 00"
                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            WhatsApp
                          </label>
                          <input
                            type="tel"
                            value={parent.whatsapp}
                            onChange={(e) =>
                              setParent({ ...parent, whatsapp: e.target.value })
                            }
                            placeholder="+253 77 00 00 00"
                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      {/* Quartier */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Quartier à Djibouti
                        </label>
                        <input
                          type="text"
                          value={parent.quartier}
                          onChange={(e) =>
                            setParent({ ...parent, quartier: e.target.value })
                          }
                          placeholder="Ex : Héron, Balbala, Centre-ville..."
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ============================================================ */}
                {/* ÉTAPE 2 */}
                {/* ============================================================ */}
                {etape === 2 && (
                  <motion.div
                    key="etape2"
                    {...fadeUp}
                    transition={{ duration: 0.3 }}
                    className="p-6 sm:p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Étape 2 / 3
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        Vos enfants
                      </h2>
                      <p className="text-sm text-slate-500 mt-2">
                        Ajoutez autant d'enfants que nécessaire.
                      </p>
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200"
                          >
                            {/* Header enfant */}
                            <div className="flex justify-between items-center mb-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </div>
                                <span className="font-bold text-slate-800 text-sm">
                                  Enfant {index + 1}
                                </span>
                              </div>
                              {enfants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => supprimerEnfant(index)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg text-sm transition-colors"
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>

                            <div className="space-y-5">
                              {/* Prénom */}
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                  Prénom (optionnel)
                                </label>
                                <input
                                  type="text"
                                  value={enfant.prenom}
                                  onChange={(e) =>
                                    modifierEnfant(index, 'prenom', e.target.value)
                                  }
                                  placeholder="Ex : Fatima"
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 placeholder:text-slate-400 transition-colors"
                                />
                              </div>

                              {/* Type de cours */}
                              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                                <div className="mb-4">
                                  <div className="font-bold text-slate-900 text-sm">
                                    Type de cours souhaité
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    Cochez un ou plusieurs types
                                  </div>
                                </div>

                                {/* Soutien scolaire */}
                                <div className="mb-5">
                                  <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1 flex-wrap">
                                    🎒 Soutien scolaire
                                    <span className="text-slate-400 normal-case font-medium">
                                      (nécessite un niveau)
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { val: 'primaire', label: 'Primaire', emoji: '🎒', sousTitre: '1ère - 5ème' },
                                      { val: 'college', label: 'Collège', emoji: '📖', sousTitre: '6ème - 9ème' },
                                      { val: 'lycee', label: 'Lycée', emoji: '🎓', sousTitre: '2nde - Tle' },
                                    ].map((n) => {
                                      const actif = enfant.niveaux.includes(n.val)
                                      return (
                                        <button
                                          key={n.val}
                                          type="button"
                                          onClick={() => toggleNiveau(index, n.val)}
                                          className={`relative py-3 rounded-xl font-bold text-sm transition-all ${
                                            actif
                                              ? 'bg-slate-900 text-white shadow-md'
                                              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
                                          }`}
                                        >
                                          <div className="flex flex-col items-center gap-1">
                                            <span className="text-2xl">{n.emoji}</span>
                                            <span>{n.label}</span>
                                            <span className={`text-[10px] font-semibold ${actif ? 'text-slate-300' : 'text-slate-400'}`}>
                                              {n.sousTitre}
                                            </span>
                                          </div>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Coran / Langue */}
                                <div>
                                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1 flex-wrap">
                                    📕 Coran & Langue étrangère
                                    <span className="text-emerald-600 normal-case font-bold">
                                      (aucun niveau requis ✓)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleNiveau(index, 'langue_speciale')}
                                    className={`relative w-full py-4 px-4 rounded-xl font-bold text-sm transition-all ${
                                      enfant.niveaux.includes('langue_speciale')
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-3">
                                      <span className="text-2xl">📕</span>
                                      <div className="text-left">
                                        <div>Coran / Langue étrangère</div>
                                        <div
                                          className={`text-[10px] font-semibold ${
                                            enfant.niveaux.includes('langue_speciale')
                                              ? 'text-emerald-100'
                                              : 'text-slate-400'
                                          }`}
                                        >
                                          Cours spécial — aucun niveau scolaire
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </div>

                                {matieres.length > 0 && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs font-bold text-blue-900 mb-1">
                                      📚 Matières disponibles
                                    </p>
                                    {matieres.map((m, i) => (
                                      <p key={i} className="text-xs text-blue-800">
                                        • {m}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Classes */}
                              <AnimatePresence>
                                {aNiveauxNormaux && classesDispo.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden bg-white rounded-2xl p-5 border border-slate-200"
                                  >
                                    <div className="mb-4">
                                      <div className="font-bold text-slate-900 text-sm">
                                        Classes précises
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        Cochez une ou plusieurs classes
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {classesDispo.map((c) => {
                                        const actif = enfant.classes.includes(c)
                                        return (
                                          <button
                                            key={c}
                                            type="button"
                                            onClick={() => toggleItem(index, 'classes', c)}
                                            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                                              actif
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
                                            }`}
                                          >
                                            {c}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Langues / Coran spécifiques */}
                              <AnimatePresence>
                                {aLangueSpeciale && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden bg-white rounded-2xl p-5 border border-purple-200"
                                  >
                                    <div className="mb-4">
                                      <div className="font-bold text-slate-900 text-sm">
                                        Quelle langue ou le Coran ?
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        Cochez une ou plusieurs options
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                      {[
                                        { val: 'arabe', label: 'Arabe' },
                                        { val: 'coran', label: 'Coran' },
                                        { val: 'francais', label: 'Français' },
                                        { val: 'anglais', label: 'Anglais' },
                                      ].map((l) => {
                                        const actif = enfant.languesSpeciales.includes(l.val)
                                        return (
                                          <button
                                            key={l.val}
                                            type="button"
                                            onClick={() => {
                                              const nouveaux = [...enfants]
                                              const enf = { ...nouveaux[index] }
                                              if (enf.languesSpeciales.includes(l.val)) {
                                                enf.languesSpeciales = enf.languesSpeciales.filter(
                                                  (v) => v !== l.val
                                                )
                                                enf.precisionsLangues = enf.precisionsLangues.filter(
                                                  (p) => !p.startsWith(l.val)
                                                )
                                              } else {
                                                enf.languesSpeciales = [...enf.languesSpeciales, l.val]
                                              }
                                              nouveaux[index] = enf
                                              setEnfants(nouveaux)
                                            }}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all ${
                                              actif
                                                ? 'bg-purple-600 text-white shadow-md'
                                                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
                                            }`}
                                          >
                                            {l.label}
                                          </button>
                                        )
                                      })}
                                    </div>

                                    {precisions.length > 0 && (
                                      <div className="pt-4 border-t border-purple-100">
                                        <div className="text-xs font-bold text-purple-700 mb-3">
                                          Précisez le type d'apprentissage
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {precisions.map((p) => {
                                            const actif = enfant.precisionsLangues.includes(p.val)
                                            return (
                                              <button
                                                key={p.val}
                                                type="button"
                                                onClick={() =>
                                                  toggleItem(index, 'precisionsLangues', p.val)
                                                }
                                                className={`p-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                                                  actif
                                                    ? 'bg-purple-600 text-white shadow-md'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
                                                }`}
                                              >
                                                <span>{p.emoji}</span>
                                                <span>{p.label}</span>
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Langues comprises */}
                              <div className="bg-white rounded-2xl p-5 border border-emerald-200">
                                <div className="mb-4">
                                  <div className="font-bold text-slate-900 text-sm">
                                    Langues comprises par l'enfant
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Cochez les langues que votre enfant comprend bien.
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { val: 'francais', label: 'Français' },
                                    { val: 'arabe', label: 'Arabe' },
                                    { val: 'somali', label: 'Somali' },
                                    { val: 'afar', label: 'Afar' },
                                  ].map((l) => {
                                    const actif = enfant.languesComprises.includes(l.val)
                                    return (
                                      <button
                                        key={l.val}
                                        type="button"
                                        onClick={() =>
                                          toggleItem(index, 'languesComprises', l.val)
                                        }
                                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                                          actif
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                                        }`}
                                      >
                                        {l.label}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}

                      <button
                        type="button"
                        onClick={ajouterEnfant}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-500 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="text-xl">+</span>
                        Ajouter un autre enfant
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ============================================================ */}
                {/* ÉTAPE 3 */}
                {/* ============================================================ */}
                {etape === 3 && (
                  <motion.div
                    key="etape3"
                    {...fadeUp}
                    transition={{ duration: 0.3 }}
                    className="p-6 sm:p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Étape 3 / 3
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        Vos préférences
                      </h2>
                      <p className="text-sm text-slate-500 mt-2">
                        Comment souhaitez-vous organiser les cours ?
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        {
                          id: 'unSeulProf',
                          titre: 'Un seul professeur pour tous mes enfants',
                          desc: 'Idéal si vos enfants ont des niveaux proches',
                        },
                        {
                          id: 'unProfParMatiere',
                          titre: 'Un professeur par matière',
                          desc: 'Idéal pour avoir des spécialistes par matière',
                        },
                      ].map((opt) => {
                        const actif = preferences[opt.id as 'unSeulProf' | 'unProfParMatiere']
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                              actif
                                ? 'border-slate-900 bg-slate-50'
                                : 'border-slate-200 bg-white hover:border-slate-400'
                            }`}
                          >
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
                              className="mt-1 w-5 h-5 accent-slate-900"
                            />
                            <div className="flex-1">
                              <div className="font-bold text-slate-900 text-sm">
                                {opt.titre}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {opt.desc}
                              </div>
                            </div>
                          </label>
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
                          className="w-5 h-5 accent-slate-900"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Je préfère les cours à mon domicile
                        </span>
                      </label>

                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                        <p className="text-xs text-blue-800 leading-relaxed">
                          <strong>Bon à savoir</strong> : vous pourrez discuter
                          des horaires précis et des prix directement avec le
                          professeur après votre première rencontre.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="border-t border-slate-200 bg-slate-50/50 p-5 sm:p-6 flex gap-3">
                {etape > 1 && (
                  <button
                    type="button"
                    onClick={precedent}
                    disabled={loading}
                    className="px-5 py-3.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    ← Précédent
                  </button>
                )}
                {etape < 3 ? (
                  <button
                    type="button"
                    onClick={suivant}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition-all text-sm"
                  >
                    Continuer →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={soumettre}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Création du compte...
                      </>
                    ) : (
                      '✓ Créer mon compte'
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="text-center mt-6">
              <a
                href="https://wa.me/25377741482"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Besoin d'aide ? Contactez-nous sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}