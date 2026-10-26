'use client'

import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// LOGO (identique à la page d'accueil)
// ============================================================
function Logo({ size = 'md', onDark = false }: { size?: 'sm' | 'md' | 'lg'; onDark?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-6 h-6', djib: 'text-[8px]', super: 'text-sm' },
    md: { box: 'w-10 h-10', icon: 'w-8 h-8', djib: 'text-[9px]', super: 'text-lg' },
    lg: { box: 'w-14 h-14', icon: 'w-11 h-11', djib: 'text-xs', super: 'text-2xl' },
  }
  const s = sizes[size]
  const bgId = `logoBg${uid}`
  const glowId = `logoGlow${uid}`

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0`}>
        <svg className={`${s.icon} w-full h-full`} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <radialGradient id={glowId} cx="30%" cy="20%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="120" height="120" rx="28" fill={`url(#${bgId})`} />
          <rect width="120" height="120" rx="28" fill={`url(#${glowId})`} />
          <g transform="translate(60, 68)">
            <path d="M0 -26 L36 -10 L0 8 L-36 -10 Z" fill="white" />
            <path d="M-24 -2 L-24 16 Q-24 26 -12 26 L12 26 Q24 26 24 16 L24 -2 L0 8 Z" fill="white" opacity="0.85" />
            <path d="M36 -10 Q43 -3 43 6" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="43" cy="9" r="3.5" fill="#fbbf24" />
          </g>
          <g transform="translate(93, 26)">
            <path d="M0 -9 L2.6 -2.9 L9.4 -2.9 L4 -1 L6.2 5.6 L0 1.8 L-6.2 5.6 L-4 -1 L-9.4 -2.9 L-2.6 -2.9 Z" fill="#dc2626" />
          </g>
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.djib} font-black tracking-[0.18em] uppercase text-slate-400`}>Djib</span>
        <span className={`${s.super} font-black tracking-tight -mt-0.5 ${onDark ? 'text-white' : 'text-slate-900'}`}>
          Superprof
        </span>
      </div>
    </div>
  )
}

// ============================================================
// ICÔNES SVG (premium, plus élégantes que les emojis)
// ============================================================
function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ============================================================
// TYPES & HELPERS
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

  const modifierEnfant = (index: number, champ: keyof Enfant, valeur: string | string[]) => {
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
      enfant.precisionsLangues = enfant.precisionsLangues.filter((p) => !p.startsWith(langue))
    } else {
      enfant.languesSpeciales = [...enfant.languesSpeciales, langue]
    }

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
    if (niveauxChoisis.includes('primaire')) matieres.push('Toutes matières (français + arabe)')
    if (niveauxChoisis.includes('college'))
      matieres.push('Maths, Physique, SVT, Français, Anglais, Arabe')
    if (niveauxChoisis.includes('lycee')) matieres.push('Maths (autres matières bientôt)')
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
      setErreur("Le format de l'adresse email est invalide (ex : nom@email.com)")
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

      const aNiveauxNormaux = e.niveaux.some((n) => ['primaire', 'college', 'lycee'].includes(n))
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
        preference_organisation: preferences.unSeulProf ? 'un_seul_prof' : 'un_prof_par_matiere',
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

      alert('🎉 Inscription réussie !\n\nBienvenue sur Djib Superprof. Votre espace parent est prêt.')
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
    <div className="min-h-screen relative overflow-hidden bg-[#fafbfc]">
      {/* Fond subtil — gradients très doux + grille masquée */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-300/[0.08] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-300/[0.08] rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-xs font-bold text-slate-500 hover:text-blue-700 transition-colors tracking-wide uppercase"
            >
              Déjà un compte ?
            </Link>
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors tracking-wide uppercase"
            >
              Aide
            </a>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
              Inscription parent · Gratuite
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-4 tracking-tight leading-[1.1]">
            Trouvez le professeur idéal
            <br />
            <span className="bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              sur Djib Superprof
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            Rejoignez les familles qui ont trouvé un prof vérifié en moins de 48h.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">
          {/* SIDEBAR PROGRESSION */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_40px_-15px_rgba(15,23,42,0.08)] sticky top-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">
                Votre progression
              </h3>
              <div className="space-y-1">
                {etapes.map((e) => (
                  <div key={e.num} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{
                          scale: etape === e.num ? 1.05 : 1,
                          backgroundColor:
                            etape > e.num ? '#059669' : etape === e.num ? '#1d4ed8' : '#f1f5f9',
                          color: etape >= e.num ? '#ffffff' : '#94a3b8',
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-sm"
                      >
                        {etape > e.num ? <IconCheck className="w-4 h-4" /> : e.num}
                      </motion.div>
                      {e.num < 3 && (
                        <div
                          className={`w-[2px] h-10 my-1 transition-colors ${
                            etape > e.num ? 'bg-emerald-500' : 'bg-slate-100'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-1.5 pb-4">
                      <div
                        className={`font-bold text-[13px] transition-colors leading-tight ${
                          etape >= e.num ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {e.titre}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{e.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                {[
                  { emoji: '🔒', text: 'Données chiffrées' },
                  { emoji: '✅', text: 'Profs vérifiés' },
                  { emoji: '⚡', text: 'Réponse sous 48h' },
                  { emoji: '🇩🇯', text: '100% djiboutien' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium">
                    <span className="text-sm">{item.emoji}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* FORMULAIRE */}
          <div className="min-w-0">
            {/* Barre mobile */}
            <div className="lg:hidden mb-5 flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    n <= etape ? 'bg-gradient-to-r from-blue-700 to-emerald-600' : 'bg-slate-200'
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
                  className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3"
                >
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <p className="text-red-700 text-[13px] font-semibold leading-relaxed">{erreur}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CARTE PRINCIPALE */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_20px_60px_-20px_rgba(15,23,42,0.12)] overflow-hidden">
              <AnimatePresence mode="wait">
                {/* ÉTAPE 1 */}
                {etape === 1 && (
                  <motion.div key="etape1" {...fadeUp} transition={{ duration: 0.35 }} className="p-6 sm:p-8 md:p-10">
                    <div className="mb-7">
                      <div className="text-[10px] font-black text-blue-700 uppercase tracking-[0.15em] mb-2">
                        Étape 1 sur 3
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Vos informations
                      </h2>
                      <p className="text-sm text-slate-500 mt-1.5">
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

                      <div className="grid sm:grid-cols-2 gap-4">
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

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                            🛡️
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-slate-900 mb-1">
                              Vos données sont protégées
                            </div>
                            <p className="text-[12px] text-slate-600 leading-relaxed">
                              Votre email et votre mot de passe sont chiffrés. Seuls les professeurs que vous contactez verront vos coordonnées.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 2 */}
                {etape === 2 && (
                  <motion.div key="etape2" {...fadeUp} transition={{ duration: 0.35 }} className="p-6 sm:p-8 md:p-10">
                    <div className="mb-7">
                      <div className="text-[10px] font-black text-blue-700 uppercase tracking-[0.15em] mb-2">
                        Étape 2 sur 3
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Vos enfants
                      </h2>
                      <p className="text-sm text-slate-500 mt-1.5">
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
                            className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 border border-slate-200/70"
                          >
                            {/* Header enfant */}
                            <div className="flex justify-between items-center mb-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-700 to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-[13px]">
                                    Enfant {index + 1}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {enfant.prenom || 'Prénom non renseigné'}
                                  </div>
                                </div>
                              </div>
                              {enfants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => supprimerEnfant(index)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                                >
                                  Supprimer
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
                              <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200">
                                <div className="mb-4">
                                  <div className="font-bold text-slate-900 text-[13px]">
                                    🎯 Type de cours souhaité
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Cochez un ou plusieurs types
                                  </div>
                                </div>

                                {/* Soutien scolaire */}
                                <div className="mb-5">
                                  <div className="text-[10px] font-black text-blue-700 uppercase tracking-[0.1em] mb-2.5">
                                    Soutien scolaire
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
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => toggleNiveau(index, n.val)}
                                          className={`relative py-3 rounded-lg font-bold text-[12px] transition-all ${
                                            actif
                                              ? 'bg-gradient-to-br from-blue-700 to-blue-600 text-white shadow-md'
                                              : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                                          }`}
                                        >
                                          {actif && (
                                            <motion.div
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-700"
                                            >
                                              <IconCheck className="w-2.5 h-2.5 text-blue-700" />
                                            </motion.div>
                                          )}
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-lg">{n.emoji}</span>
                                            <span>{n.label}</span>
                                            <span className={`text-[9px] font-semibold ${actif ? 'text-blue-100' : 'text-slate-400'}`}>
                                              {n.sousTitre}
                                            </span>
                                          </div>
                                        </motion.button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Langue spéciale */}
                                <div>
                                  <div className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.1em] mb-2.5 flex items-center gap-1.5 flex-wrap">
                                    Coran & Langue étrangère
                                    <span className="text-emerald-600 normal-case font-bold tracking-normal">
                                      · aucun niveau requis
                                    </span>
                                  </div>
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => toggleNiveau(index, 'langue_speciale')}
                                    className={`relative w-full py-3.5 px-4 rounded-lg font-bold text-[12px] transition-all ${
                                      enfant.niveaux.includes('langue_speciale')
                                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                                    }`}
                                  >
                                    {enfant.niveaux.includes('langue_speciale') && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-600"
                                      >
                                        <IconCheck className="w-2.5 h-2.5 text-emerald-600" />
                                      </motion.div>
                                    )}
                                    <div className="flex items-center justify-center gap-2.5">
                                      <span className="text-lg">📕</span>
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
                                    className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
                                  >
                                    <p className="text-[11px] font-bold text-blue-900 mb-1">
                                      Matières disponibles
                                    </p>
                                    {matieres.map((m, i) => (
                                      <p key={i} className="text-[11px] text-blue-800">
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
                                    className="overflow-hidden bg-white rounded-xl p-4 sm:p-5 border border-slate-200"
                                  >
                                    <div className="mb-3">
                                      <div className="font-bold text-slate-900 text-[13px]">
                                        🏫 Classes précises
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        Cochez une ou plusieurs classes
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {classesDispo.map((c) => {
                                        const actif = enfant.classes.includes(c)
                                        return (
                                          <motion.button
                                            key={c}
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleItem(index, 'classes', c)}
                                            className={`py-2.5 rounded-lg font-bold text-[12px] transition-all ${
                                              actif
                                                ? 'bg-gradient-to-br from-indigo-700 to-indigo-600 text-white shadow-sm'
                                                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
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
                                    className="overflow-hidden bg-white rounded-xl p-4 sm:p-5 border border-slate-200"
                                  >
                                    <div className="mb-3">
                                      <div className="font-bold text-slate-900 text-[13px]">
                                        📕 Quelle langue ou le Coran ?
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
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
                                            className={`py-2.5 rounded-lg font-bold text-[12px] transition-all ${
                                              actif
                                                ? 'bg-gradient-to-br from-purple-700 to-purple-600 text-white shadow-sm'
                                                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
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
                                        className="pt-4 border-t border-slate-100"
                                      >
                                        <div className="text-[11px] font-bold text-purple-700 mb-2.5">
                                          Précisez le type d'apprentissage
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
                                                onClick={() => toggleItem(index, 'precisionsLangues', p.val)}
                                                className={`p-2.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                                                  actif
                                                    ? 'bg-purple-600 text-white shadow-sm'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
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
                              <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200">
                                <div className="mb-3">
                                  <div className="font-bold text-slate-900 text-[13px]">
                                    💬 Langues comprises par l'enfant
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
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
                                      <motion.button
                                        key={l.val}
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleItem(index, 'languesComprises', l.val)}
                                        className={`py-2.5 rounded-lg font-bold text-[12px] transition-all ${
                                          actif
                                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-sm'
                                            : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
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
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                        onClick={ajouterEnfant}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-bold text-[13px] hover:bg-white hover:border-blue-400 hover:text-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">+</span>
                        Ajouter un autre enfant
                      </motion.button>

                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3.5 rounded-lg">
                        <p className="text-[12px] text-blue-800 leading-relaxed">
                          <strong>Astuce :</strong> Plus vous précisez les besoins de vos enfants, plus nous pourrons vous proposer les professeurs les mieux adaptés.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 3 */}
                {etape === 3 && (
                  <motion.div key="etape3" {...fadeUp} transition={{ duration: 0.35 }} className="p-6 sm:p-8 md:p-10">
                    <div className="mb-7">
                      <div className="text-[10px] font-black text-blue-700 uppercase tracking-[0.15em] mb-2">
                        Étape 3 sur 3
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Vos préférences
                      </h2>
                      <p className="text-sm text-slate-500 mt-1.5">
                        Comment souhaitez-vous organiser les cours ?
                      </p>
                    </div>

                    <div className="space-y-3">
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
                            whileHover={{ scale: actif ? 1 : 1.005 }}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              actif
                                ? 'border-blue-700 bg-blue-50/50'
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
                              className="mt-1 w-4 h-4 accent-blue-700"
                            />
                            <div className="flex-1 flex items-start gap-3">
                              <span className="text-xl">{opt.emoji}</span>
                              <div>
                                <div className="font-bold text-slate-900 text-[13px]">{opt.titre}</div>
                                <div className="text-[12px] text-slate-500 mt-0.5">{opt.desc}</div>
                              </div>
                            </div>
                          </motion.label>
                        )
                      })}

                      <motion.label
                        whileHover={{ scale: 1.005 }}
                        className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                          preferences.coursADomicile
                            ? 'border-emerald-600 bg-emerald-50/50'
                            : 'border-slate-200 bg-white hover:border-emerald-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.coursADomicile}
                          onChange={(e) =>
                            setPreferences({ ...preferences, coursADomicile: e.target.checked })
                          }
                          className="w-4 h-4 accent-emerald-700"
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-lg">🏠</span>
                          <span className="text-[13px] font-bold text-slate-800">
                            Je préfère les cours à mon domicile
                          </span>
                        </div>
                      </motion.label>

                      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-4 sm:p-5 rounded-xl border border-emerald-100">
                        <div className="flex gap-3">
                          <span className="text-lg">✅</span>
                          <div>
                            <p className="text-[13px] font-bold text-emerald-900 mb-1">
                              Prêt à trouver votre professeur !
                            </p>
                            <p className="text-[12px] text-emerald-800 leading-relaxed">
                              Après validation, vous pourrez parcourir les profils vérifiés et organiser une première rencontre.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          💡 <strong>Bon à savoir :</strong> Vous pourrez discuter des horaires précis et des prix directement avec le professeur.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* NAVIGATION */}
              <div className="border-t border-slate-200/70 bg-slate-50/50 p-4 sm:p-6 flex gap-3">
                {etape > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={precedent}
                    disabled={loading}
                    className="px-5 py-3.5 rounded-xl font-bold text-[13px] text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    ← Précédent
                  </motion.button>
                )}
                {etape < 3 ? (
                  <motion.button
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    type="button"
                    onClick={suivant}
                    className="flex-1 py-3.5 rounded-xl font-bold text-[13px] text-white bg-gradient-to-r from-blue-700 to-blue-600 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
                  >
                    Continuer →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.005 }}
                    whileTap={{ scale: loading ? 1 : 0.995 }}
                    type="button"
                    onClick={soumettre}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl font-bold text-[13px] text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                      <>
                        <IconCheck className="w-4 h-4" />
                        Créer mon compte
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Footer aide */}
            <div className="text-center mt-6">
              <a
                href="https://wa.me/25377741482"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 font-medium"
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
// COMPOSANT FIELD (raffiné)
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
      <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-[0.08em]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-900 text-[13px] transition-all placeholder:text-slate-400 placeholder:font-normal"
      />
      {hint && <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )
}

// ============================================================
// COMPOSANT TELEPHONE FIELD (raffiné)
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
      <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-[0.08em]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all overflow-hidden">
        <div className="px-3 py-3 bg-slate-50 border-r border-slate-200 font-bold text-slate-600 text-[12px] flex items-center gap-1.5 flex-shrink-0">
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
          className="flex-1 px-3 py-3 bg-transparent outline-none font-medium text-slate-900 text-[13px] placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5">8 chiffres</p>
    </div>
  )
}