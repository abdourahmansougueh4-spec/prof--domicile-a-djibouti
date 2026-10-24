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
// VALIDATION HELPERS
// ============================================================

const emailValide = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(email) && email.length <= 254
}

const compterChiffres = (tel: string): number => tel.replace(/\D/g, '').length

const formaterTelephone = (valeur: string): string => {
  const chiffres = valeur.replace(/\D/g, '').slice(0, 8)
  const groupes: string[] = []
  for (let i = 0; i < chiffres.length; i += 2) {
    groupes.push(chiffres.slice(i, i + 2))
  }
  return groupes.join(' ')
}

// ============================================================
// COMPOSANT PRINCIPAL
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
    champ: 'classes' | 'languesComprises' | 'precisionsLangues',
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

  const toggleLangueSpeciale = (index: number, langue: string) => {
    const nouveaux = [...enfants]
    const enfant = { ...nouveaux[index] }

    if (enfant.languesSpeciales.includes(langue)) {
      enfant.languesSpeciales = enfant.languesSpeciales.filter((l) => l !== langue)
      enfant.precisionsLangues = enfant.precisionsLangues.filter(
        (p) => !p.startsWith(langue)
      )
    } else {
      enfant.languesSpeciales = [...enfant.languesSpeciales, langue]
    }

    nouveaux[index] = enfant
    setEnfants(nouveaux)
  }

  // ============================================================
  // DÉRIVÉS
  // ============================================================

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
      matieres.push('Toutes matières (français + arabe)')
    if (niveauxChoisis.includes('college'))
      matieres.push('Maths, Physique, SVT, Français, Anglais, Arabe')
    if (niveauxChoisis.includes('lycee'))
      matieres.push('Maths (autres matières bientôt)')
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

  const validerEtape1 = (): boolean => {
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
      setErreur('Le format de l\'adresse email est invalide (ex : nom@email.com)')
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
    if (parent.telephone && compterChiffres(parent.telephone) < 8) {
      setErreur('Le numéro de téléphone doit contenir 8 chiffres')
      return false
    }
    if (parent.whatsapp && compterChiffres(parent.whatsapp) < 8) {
      setErreur('Le numéro WhatsApp doit contenir 8 chiffres')
      return false
    }
    setErreur('')
    return true
  }

  const validerEtape2 = (): boolean => {
    for (let i = 0; i < enfants.length; i++) {
      const e = enfants[i]
      const num = i + 1

      if (e.niveaux.length === 0) {
        setErreur(`Enfant ${num} : cochez au moins un type de cours`)
        return false
      }

      const aNiveauxNormaux = e.niveaux.some((n) =>
        ['primaire', 'college', 'lycee'].includes(n)
      )
      if (aNiveauxNormaux && e.classes.length === 0) {
        setErreur(`Enfant ${num} : cochez au moins une classe`)
        return false
      }

      if (e.niveaux.includes('langue_speciale')) {
        if (e.languesSpeciales.length === 0) {
          setErreur(`Enfant ${num} : précisez quelle langue ou le Coran`)
          return false
        }
        if (e.precisionsLangues.length === 0) {
          setErreur(`Enfant ${num} : précisez le type d'apprentissage`)
          return false
        }
      }

      if (e.languesComprises.length === 0) {
        setErreur(`Enfant ${num} : cochez au moins une langue comprise`)
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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parent.email.trim().toLowerCase(),
        password: parent.motDePasse,
      })
      if (signInError) console.error('Erreur signIn:', JSON.stringify(signInError, null, 2))

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          telephone: parent.telephone ? `+253 ${parent.telephone.trim()}` : null,
          whatsapp: parent.whatsapp ? `+253 ${parent.whatsapp.trim()}` : null,
          quartier: parent.quartier.trim() || null,
        })
        .eq('id', userId)
      if (profileError) console.error('Erreur profil:', JSON.stringify(profileError, null, 2))

      const { error: parentError } = await supabase.from('parents').insert({
        id: userId,
        nombre_enfants: enfants.length,
        preference_organisation: preferences.unSeulProf
          ? 'un_seul_prof'
          : 'un_prof_par_matiere',
        cours_a_domicile: preferences.coursADomicile,
      })
      if (parentError) console.error('Erreur parent:', JSON.stringify(parentError, null, 2))

      const enfantsData = enfants.map((e) => ({
        parent_id: userId,
        prenom: e.prenom.trim() || 'Enfant',
        niveaux: e.niveaux,
        classes: e.classes,
        langues_comprises: e.languesComprises,
        langues_speciales: e.languesSpeciales,
        precisions_langues: e.precisionsLangues,
      }))

      const { error: enfantsError } = await supabase.from('enfants').insert(enfantsData)
      if (enfantsError) console.error('Erreur enfants:', JSON.stringify(enfantsError, null, 2))

      alert('🎉 Inscription réussie !\n\nBienvenue sur Prof À Domicile Djibouti. Votre espace parent est prêt.')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden">
      {/* Décor animé */}
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

      {/* Nav */}
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Inscription parent · Gratuite
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Trouvez le professeur idéal
            <br />
            <span className="bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              pour vos enfants à Djibouti
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Rejoignez des centaines de familles qui ont trouvé un prof vérifié en moins de 48h.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar progression */}
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
                          className={`w-0.5 h-10 my-1 transition-colors ${
                            etape > e.num ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-2 pb-4">
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
                  <span>Profs vérifiés</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">⚡</span>
                  <span>Réponse sous 48h</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">🇩🇯</span>
                  <span>100% djiboutien</span>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Formulaire */}
          <div>
            {/* Barre mobile */}
            <div className="lg:hidden mb-6 flex gap-1">
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

            {/* Erreur */}
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
                {/* ============================================================ */}
                {/* ÉTAPE 1 */}
                {/* ============================================================ */}
                {etape === 1 && (
                  <motion.div
                    key="etape1"
                    {...fadeUp}
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                        Étape 1 / 3
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos informations</h2>
                      <p className="text-slate-500 mt-2">
                        Ces informations resteront strictement confidentielles.
                      </p>
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
                        label="Adresse email"
                        required
                        type="email"
                        value={parent.email}
                        onChange={(v) => setParent({ ...parent, email: v })}
                        placeholder="exemple@email.com"
                        hint="Nous vous enverrons un email de confirmation."
                      />
                      <Field
                        label="Mot de passe"
                        required
                        type="password"
                        value={parent.motDePasse}
                        onChange={(v) => setParent({ ...parent, motDePasse: v })}
                        placeholder="Au moins 6 caractères"
                        hint="Utilisez un mélange de lettres et de chiffres."
                      />

                      <div className="grid md:grid-cols-2 gap-5">
                        <TelephoneField
                          label="Téléphone"
                          value={parent.telephone}
                          onChange={(v) => setParent({ ...parent, telephone: v })}
                        />
                        <TelephoneField
                          label="WhatsApp"
                          value={parent.whatsapp}
                          onChange={(v) => setParent({ ...parent, whatsapp: v })}
                        />
                      </div>

                      <Field
                        label="Quartier à Djibouti"
                        value={parent.quartier}
                        onChange={(v) => setParent({ ...parent, quartier: v })}
                        placeholder="Ex : Héron, Balbala, Centre-ville..."
                        hint="Facultatif, mais utile pour vous proposer des profs proches."
                      />

                      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-5 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🛡️</span>
                          <div>
                            <div className="text-sm font-bold text-slate-800 mb-1">
                              Vos données sont protégées
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Votre email et votre mot de passe sont chiffrés. Seuls les professeurs que vous contactez verront vos coordonnées.
                            </p>
                          </div>
                        </div>
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
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                        Étape 2 / 3
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos enfants</h2>
                      <p className="text-slate-500 mt-2">
                        Ajoutez autant d'enfants que nécessaire — c'est gratuit.
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
                            className="bg-slate-50/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-slate-200"
                          >
                            {/* Header enfant */}
                            <div className="flex justify-between items-center mb-5">
                              <div className="flex items-center gap-3">
                                <motion.div
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 0.5 }}
                                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-lg"
                                >
                                  {index + 1}
                                </motion.div>
                                <div>
                                  <div className="font-bold text-slate-800 text-sm">
                                    Enfant {index + 1}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {enfant.prenom || 'Prénom non renseigné'}
                                  </div>
                                </div>
                              </div>
                              {enfants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => supprimerEnfant(index)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg text-xs font-bold transition-colors"
                                >
                                  ✕ Supprimer
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

                              {/* Type de cours */}
                              <div className="bg-white rounded-2xl p-5 border-2 border-blue-100">
                                <div className="mb-4">
                                  <div className="font-bold text-slate-900 text-sm">
                                    🎯 Type de cours souhaité
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
                                        <motion.button
                                          key={n.val}
                                          type="button"
                                          whileHover={{ scale: 1.03 }}
                                          whileTap={{ scale: 0.97 }}
                                          onClick={() => toggleNiveau(index, n.val)}
                                          className={`relative py-3 rounded-xl font-bold text-sm transition-all ${
                                            actif
                                              ? 'bg-gradient-to-br from-blue-700 to-blue-600 text-white shadow-lg border-2 border-blue-800'
                                              : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300'
                                          }`}
                                        >
                                          {actif && (
                                            <motion.div
                                              initial={{ scale: 0, rotate: -180 }}
                                              animate={{ scale: 1, rotate: 0 }}
                                              className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-blue-700"
                                            >
                                              <svg className="w-2.5 h-2.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </motion.div>
                                          )}
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-xl">{n.emoji}</span>
                                            <span>{n.label}</span>
                                            <span className={`text-[10px] font-semibold ${actif ? 'text-blue-100' : 'text-slate-400'}`}>
                                              {n.sousTitre}
                                            </span>
                                          </div>
                                        </motion.button>
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
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => toggleNiveau(index, 'langue_speciale')}
                                    className={`relative w-full py-4 px-4 rounded-xl font-bold text-sm transition-all ${
                                      enfant.niveaux.includes('langue_speciale')
                                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg border-2 border-emerald-700'
                                        : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-emerald-300'
                                    }`}
                                  >
                                    {enfant.niveaux.includes('langue_speciale') && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-emerald-600"
                                      >
                                        <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </motion.div>
                                    )}
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
                                  </motion.button>
                                </div>

                                {matieres.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100"
                                  >
                                    <p className="text-xs font-bold text-blue-900 mb-1">
                                      📚 Matières disponibles
                                    </p>
                                    {matieres.map((m, i) => (
                                      <p key={i} className="text-xs text-blue-800">
                                        • {m}
                                      </p>
                                    ))}
                                  </motion.div>
                                )}
                              </div>

                              {/* Classes */}
                              <AnimatePresence>
                                {aNiveauxNormaux && classesDispo.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden bg-white rounded-2xl p-5 border-2 border-indigo-100"
                                  >
                                    <div className="mb-4">
                                      <div className="font-bold text-slate-900 text-sm">
                                        🏫 Classes précises
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        Cochez une ou plusieurs classes
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {classesDispo.map((c) => {
                                        const actif = enfant.classes.includes(c)
                                        return (
                                          <motion.button
                                            key={c}
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleItem(index, 'classes', c)}
                                            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                                              actif
                                                ? 'bg-gradient-to-br from-indigo-700 to-indigo-600 text-white shadow-md'
                                                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-300'
                                            }`}
                                          >
                                            {c}
                                          </motion.button>
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
                                    className="overflow-hidden bg-white rounded-2xl p-5 border-2 border-purple-100"
                                  >
                                    <div className="mb-4">
                                      <div className="font-bold text-slate-900 text-sm">
                                        📕 Quelle langue ou le Coran ?
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
                                          <motion.button
                                            key={l.val}
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleLangueSpeciale(index, l.val)}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all ${
                                              actif
                                                ? 'bg-gradient-to-br from-purple-700 to-purple-600 text-white shadow-md'
                                                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300'
                                            }`}
                                          >
                                            {l.label}
                                          </motion.button>
                                        )
                                      })}
                                    </div>

                                    {precisions.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="pt-4 border-t border-purple-100"
                                      >
                                        <div className="text-xs font-bold text-purple-700 mb-3">
                                          🎯 Précisez le type d'apprentissage
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {precisions.map((p) => {
                                            const actif = enfant.precisionsLangues.includes(p.val)
                                            return (
                                              <motion.button
                                                key={p.val}
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() =>
                                                  toggleItem(index, 'precisionsLangues', p.val)
                                                }
                                                className={`p-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                                                  actif
                                                    ? 'bg-purple-600 text-white shadow-md'
                                                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300'
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

                              {/* Langues comprises */}
                              <div className="bg-white rounded-2xl p-5 border-2 border-emerald-100">
                                <div className="mb-4">
                                  <div className="font-bold text-slate-900 text-sm">
                                    💬 Langues comprises par l'enfant
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Cochez les langues que votre enfant comprend bien. Cela nous aide à proposer les meilleurs profs.
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
                                      <motion.button
                                        key={l.val}
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() =>
                                          toggleItem(index, 'languesComprises', l.val)
                                        }
                                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                                          actif
                                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md'
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
                          </motion.div>
                        )
                      })}

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={ajouterEnfant}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 font-bold hover:bg-white hover:border-blue-400 hover:text-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="text-xl">+</span>
                        Ajouter un autre enfant
                      </motion.button>

                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Astuce :</strong> Plus vous précisez les besoins de vos enfants, plus nous pourrons vous proposer les professeurs les mieux adaptés.
                        </p>
                      </div>
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
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                        Étape 3 / 3
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos préférences</h2>
                      <p className="text-slate-500 mt-2">
                        Comment souhaitez-vous organiser les cours ?
                      </p>
                    </div>

                    <div className="space-y-4">
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
                          emoji: '🎯',
                        },
                      ].map((opt) => {
                        const actif = preferences[opt.id as 'unSeulProf' | 'unProfParMatiere']
                        return (
                          <motion.label
                            key={opt.id}
                            whileHover={{ scale: actif ? 1.01 : 1.02 }}
                            className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                              actif
                                ? 'border-blue-700 bg-blue-50 shadow-lg'
                                : 'border-slate-200 bg-white hover:border-blue-300'
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
                              className="mt-1 w-5 h-5 accent-blue-700"
                            />
                            <div className="flex-1 flex items-start gap-3">
                              <span className="text-2xl">{opt.emoji}</span>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">
                                  {opt.titre}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {opt.desc}
                                </div>
                              </div>
                            </div>
                          </motion.label>
                        )
                      })}

                      <motion.label
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                          preferences.coursADomicile
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-emerald-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.coursADomicile}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              coursADomicile: e.target.checked,
                            })
                          }
                          className="w-5 h-5 accent-emerald-700"
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xl">🏠</span>
                          <span className="text-sm font-bold text-slate-800">
                            Je préfère les cours à mon domicile
                          </span>
                        </div>
                      </motion.label>

                      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-5 rounded-2xl border border-emerald-100">
                        <div className="flex gap-3">
                          <span className="text-xl">✅</span>
                          <div>
                            <p className="text-sm font-semibold text-emerald-900 mb-1">
                              Prêt à trouver votre professeur !
                            </p>
                            <p className="text-sm text-emerald-800 leading-relaxed">
                              Après validation, vous pourrez parcourir les profils vérifiés, contacter les professeurs et organiser une première rencontre.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-200">
                        <p className="text-xs text-blue-800 leading-relaxed">
                          💡 <strong>Bon à savoir :</strong> Vous pourrez discuter des horaires précis et des prix directement avec le professeur après votre première rencontre.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="border-t border-slate-200/70 bg-white/60 backdrop-blur-sm p-6 md:p-8 flex gap-4">
                {etape > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
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
                    type="button"
                    onClick={suivant}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-700 to-emerald-600 shadow-lg shadow-blue-700/30 hover:shadow-xl transition-all"
                  >
                    Continuer →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    type="button"
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
                      '✓ Créer mon compte parent'
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

// ============================================================
// COMPOSANT FIELD
// ============================================================

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

// ============================================================
// COMPOSANT TELEPHONE FIELD (avec +253 fixe et formatage)
// ============================================================

function TelephoneField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden">
        <div className="px-4 py-3.5 bg-slate-100 border-r border-slate-200 font-bold text-slate-700 flex items-center gap-2 flex-shrink-0">
          <span>🇩🇯</span>
          <span>+253</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9 ]*"
          value={value}
          onChange={(e) => onChange(formaterTelephone(e.target.value))}
          placeholder="77 74 14 82"
          maxLength={11}
          className="flex-1 px-4 py-3.5 bg-transparent outline-none font-medium text-slate-800 placeholder:text-slate-400"
        />
      </div>
      <p className="text-xs text-slate-500 mt-1.5">
        Entrez 8 chiffres (uniquement des chiffres)
      </p>
    </div>
  )
}