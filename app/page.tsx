
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type StatsGlobales = {
  profs: number
  parents: number
  eleves: number
  note_moyenne: number
}

type ProfEnVedette = {
  id: string
  nom: string
  matiere: string
  note_moyenne: number
  nb_avis: number
  ville: string
  emoji: string
  couleur: string
}

// ============================================================
// DONNÉES
// ============================================================

const UNIVERS = [
  { emoji: '🎒', titre: 'Soutien scolaire', desc: 'Primaire, collège, lycée', tags: ['Maths', 'Français', 'Arabe'], couleur: 'from-blue-500 to-blue-600', populaire: true },
  { emoji: '📖', titre: 'Coran & Tajwid', desc: 'Lecture, mémorisation, tajwid', tags: ['Hifz', 'Tajwid'], couleur: 'from-emerald-500 to-teal-600', populaire: true, verifie: true },
  { emoji: '🌍', titre: 'Langues', desc: 'Arabe, Français, Anglais, Somali', tags: ['Arabe', 'Anglais'], couleur: 'from-purple-500 to-purple-600', populaire: true },
  { emoji: '💻', titre: 'Informatique', desc: 'Bureautique, programmation, web', tags: ['Python', 'Excel'], couleur: 'from-cyan-500 to-blue-600' },
  { emoji: '💼', titre: 'Formation pro', desc: 'Comptabilité, gestion, marketing', tags: ['Business', 'Gestion'], couleur: 'from-indigo-500 to-purple-600' },
  { emoji: '🎨', titre: 'Arts', desc: 'Dessin, musique, théâtre', tags: ['Dessin', 'Musique'], couleur: 'from-pink-500 to-rose-600' },
  { emoji: '⚽', titre: 'Sport', desc: 'Football, natation, fitness', tags: ['Football', 'Yoga'], couleur: 'from-orange-500 to-red-600' },
  { emoji: '📝', titre: 'Concours', desc: 'Bac, examens officiels', tags: ['Bac'], couleur: 'from-amber-500 to-orange-600' },
  { emoji: '🧒', titre: 'Éveil', desc: 'Maternelle (3-6 ans)', tags: ['3-6 ans'], couleur: 'from-yellow-500 to-amber-600' },
  { emoji: '🎯', titre: 'Sur mesure', desc: 'Toute demande', tags: ['Flexible'], couleur: 'from-slate-500 to-slate-700' },
]

const TYPES_PROFS = [
  { emoji: '🎓', titre: 'Étudiant univ.', desc: 'Licence, Master, Doctorat', couleur: 'from-blue-500 to-indigo-600' },
  { emoji: '📜', titre: 'Diplômé univ.', desc: 'Diplôme reconnu', couleur: 'from-emerald-500 to-teal-600' },
  { emoji: '🔬', titre: 'Bac Scientifique', desc: 'Maths, Physique, SVT', couleur: 'from-amber-500 to-orange-600' },
  { emoji: '👨‍🏫', titre: 'Enseignant', desc: 'École, Collège, Lycée', couleur: 'from-purple-500 to-pink-600' },
  { emoji: '💼', titre: 'Freelance', desc: 'Tuteur indépendant', couleur: 'from-cyan-500 to-blue-600' },
  { emoji: '🏢', titre: 'Formateur', desc: 'Tech, langues, métiers', couleur: 'from-rose-500 to-pink-600' },
  { emoji: '📖', titre: 'Coran', desc: 'Testé physiquement', couleur: 'from-green-500 to-emerald-600' },
]

const AVANTAGES = [
  { emoji: '✅', titre: 'Profs vérifiés', desc: 'Documents contrôlés et profils validés.', couleur: 'from-emerald-500 to-emerald-600' },
  { emoji: '🌍', titre: '5 langues', desc: 'Français, Arabe, Somali, Afar, Anglais.', couleur: 'from-blue-500 to-blue-600' },
  { emoji: '🏠', titre: 'Chez vous', desc: 'À domicile, chez le prof, ou en ligne.', couleur: 'from-purple-500 to-purple-600' },
  { emoji: '💰', titre: 'Prix libres', desc: 'Négociation directe, sans frais cachés.', couleur: 'from-amber-500 to-amber-600' },
  { emoji: '🏅', titre: 'Badges & étoiles', desc: 'Reconnaissance des meilleurs profs.', couleur: 'from-yellow-500 to-orange-600' },
  { emoji: '📱', titre: 'Support 7j/7', desc: 'Notre équipe joignable sur WhatsApp.', couleur: 'from-green-500 to-emerald-600' },
]

const ETAPES = [
  { num: 1, emoji: '📝', titre: 'Inscription', desc: 'Créez votre compte en 2 min.', couleur: 'from-blue-500 to-blue-600' },
  { num: 2, emoji: '✅', titre: 'Vérification', desc: 'Notre équipe valide chaque profil.', couleur: 'from-emerald-500 to-emerald-600' },
  { num: 3, emoji: '🔍', titre: 'Recherche', desc: 'Filtrez selon vos besoins.', couleur: 'from-purple-500 to-purple-600' },
  { num: 4, emoji: '📞', titre: 'Contact', desc: 'Mise en relation en 24h.', couleur: 'from-pink-500 to-rose-600' },
  { num: 5, emoji: '📚', titre: '1er cours', desc: 'Rencontre et démarrage.', couleur: 'from-amber-500 to-orange-600' },
  { num: 6, emoji: '⭐', titre: 'Suivi', desc: 'Évaluation et progression.', couleur: 'from-cyan-500 to-blue-600' },
]

const TEMOIGNAGES = [
  { emoji: '👨‍👩‍👧', nom: 'Ahmed H.', role: 'Parent · Héron', texte: 'J\'ai trouvé un excellent prof de maths pour ma fille en 3 jours.', couleur: 'from-blue-500 to-indigo-600', matiere: 'Maths' },
  { emoji: '👩', nom: 'Fatima I.', role: 'Parent · Balbala', texte: 'Enfin une plateforme avec des profs de Coran testés. Mes enfants progressent.', couleur: 'from-emerald-500 to-teal-600', matiere: 'Coran' },
  { emoji: '👨‍🏫', nom: 'Mohamed A.', role: 'Professeur · Bac S', texte: 'Grâce à la plateforme, j\'ai pu doubler mes revenus.', couleur: 'from-purple-500 to-pink-600', matiere: 'Sciences' },
]

const FAQ_ITEMS = [
  { q: 'Comment sont vérifiés les professeurs ?', r: 'Tous les profs passent par une vérification : documents (diplômes, identité), entretien, et pour certains types une vérification physique.' },
  { q: 'Combien coûte l\'inscription ?', r: 'L\'inscription est 100% GRATUITE pour les parents. Pour les profs, une formule mensuelle (500 à 1500 DJF) permet d\'apparaître dans les recherches.' },
  { q: 'Comment se passe le paiement ?', r: 'Le paiement se fait directement entre parent et prof après la rencontre. Méthodes : Waafi, espèces ou carte bancaire.' },
  { q: 'Puis-je choisir selon la langue ?', r: 'Oui ! Chaque prof indique les langues qu\'il parle. Vous filtrez selon votre préférence.' },
  { q: 'Les profs de Coran sont-ils testés ?', r: 'Absolument. Nos enseignants de Coran passent un test physique de lecture, tajwid et mémorisation avant validation.' },
  { q: 'Où se passent les cours ?', r: 'Selon la préférence du prof : chez lui, chez vous, ou les deux.' },
]

const PROFS_FALLBACK: ProfEnVedette[] = [
  { id: '1', nom: 'Hassan A.', matiere: 'Coran & Tajwid', note_moyenne: 4.9, nb_avis: 82, ville: 'Balbala', emoji: '📖', couleur: 'from-emerald-500 to-teal-600' },
  { id: '2', nom: 'Amina M.', matiere: 'Mathématiques', note_moyenne: 4.8, nb_avis: 64, ville: 'Héron', emoji: '📐', couleur: 'from-blue-500 to-indigo-600' },
  { id: '3', nom: 'Youssouf K.', matiere: 'Anglais', note_moyenne: 4.9, nb_avis: 51, ville: 'Centre-ville', emoji: '🌍', couleur: 'from-purple-500 to-pink-600' },
  { id: '4', nom: 'Khadija S.', matiere: 'Français', note_moyenne: 5.0, nb_avis: 47, ville: 'Q1', emoji: '✍️', couleur: 'from-rose-500 to-pink-600' },
]

// ============================================================
// LOGO COMPOSANT
// ============================================================

function Logo({ size = 'md', onDark = false }: { size?: 'sm' | 'md' | 'lg'; onDark?: boolean }) {
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-6 h-6', djib: 'text-[8px]', super: 'text-sm' },
    md: { box: 'w-10 h-10', icon: 'w-8 h-8', djib: 'text-[9px]', super: 'text-lg' },
    lg: { box: 'w-14 h-14', icon: 'w-11 h-11', djib: 'text-xs', super: 'text-2xl' },
  }
  const s = sizes[size]

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0`}>
        <svg className={`${s.icon} w-full h-full`} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`logoBg${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <radialGradient id={`logoGlow${size}`} cx="30%" cy="20%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="120" height="120" rx="28" fill={`url(#logoBg${size})`} />
          <rect width="120" height="120" rx="28" fill={`url(#logoGlow${size})`} />
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
        <span className={`${s.djib} font-black tracking-[0.18em] uppercase text-slate-400`}>
          Djib
        </span>
        <span className={`${s.super} font-black tracking-tight -mt-0.5 ${onDark ? 'text-white' : 'text-slate-900'}`}>
          Superprof
        </span>
      </div>
    </div>
  )
}
// ============================================================
// COMPOSANTS
// ============================================================

function CompteurAnime({ valeur, duration = 1.5, suffix = '' }: { valeur: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const end = valeur
    if (end === 0) { setCount(0); return }
    const increment = end / (duration * 60)
    let start = 0
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [valeur, duration])
  return <span>{count}{suffix}</span>
}

function SectionTitle({ badge, badgeColor = 'from-emerald-500 to-teal-600', titre, sousTitre }: {
  badge: string
  badgeColor?: string
  titre: React.ReactNode
  sousTitre?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      className="text-center max-w-3xl mx-auto mb-10 md:mb-14 px-4"
    >
      <span className={`inline-flex items-center gap-2 bg-gradient-to-r ${badgeColor} text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm tracking-wide`}>
        {badge}
      </span>
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-3 md:mb-4 leading-tight tracking-tight">
        {titre}
      </h2>
      {sousTitre && <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">{sousTitre}</p>}
    </motion.div>
  )
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function HomePage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<StatsGlobales>({ profs: 0, parents: 0, eleves: 0, note_moyenne: 0 })
  const [profsVedette, setProfsVedette] = useState<ProfEnVedette[]>(PROFS_FALLBACK)
  const [loading, setLoading] = useState(true)
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0)
  const [menuMobile, setMenuMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [rechercheMatiere, setRechercheMatiere] = useState('')
  const [rechercheNiveau, setRechercheNiveau] = useState('')
  const [enLigne, setEnLigne] = useState(12)

  const { scrollYProgress } = useScroll()
  const progressX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  // Charger stats + profs
  useEffect(() => {
    const charger = async () => {
      try {
        const [profsRes, parentsRes, elevesRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professeur').eq('approuve', true),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
          supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('statut', 'acceptee'),
        ])
        const { data: profsData } = await supabase.from('professeurs').select('note_moyenne').eq('approuve', true).gt('note_moyenne', 0)
        const noteMoy = profsData && profsData.length > 0
          ? profsData.reduce((acc, p) => acc + Number(p.note_moyenne), 0) / profsData.length
          : 0
        setStats({
          profs: profsRes.count || 0,
          parents: parentsRes.count || 0,
          eleves: elevesRes.count || 0,
          note_moyenne: noteMoy,
        })

        const { data: vedette } = await supabase
          .from('professeurs')
          .select('id, nom, matiere, note_moyenne, nb_avis, ville')
          .eq('approuve', true)
          .order('note_moyenne', { ascending: false })
          .limit(4)

        if (vedette && vedette.length > 0) {
          const emojis = ['📖', '📐', '🌍', '✍️']
          const couleurs = ['from-emerald-500 to-teal-600', 'from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-rose-500 to-pink-600']
          setProfsVedette(vedette.map((p, i) => ({
            id: p.id,
            nom: p.nom || 'Professeur',
            matiere: p.matiere || 'Matière',
            note_moyenne: Number(p.note_moyenne) || 5,
            nb_avis: Number(p.nb_avis) || 0,
            ville: p.ville || 'Djibouti',
            emoji: emojis[i % emojis.length],
            couleur: couleurs[i % couleurs.length],
          })))
        }
      } catch (err) {
        console.error('Erreur chargement:', err)
      } finally {
        setLoading(false)
      }
    }
    charger()
  }, [supabase])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuMobile ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuMobile])

  useEffect(() => {
    const interval = setInterval(() => {
      setEnLigne((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1
        const next = prev + delta
        return next < 8 ? 8 : next > 25 ? 25 : next
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const lancerRecherche = () => {
    const params = new URLSearchParams()
    if (rechercheMatiere) params.set('matiere', rechercheMatiere)
    if (rechercheNiveau) params.set('niveau', rechercheNiveau)
    router.push(`/professeurs${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">

      {/* BARRE PROGRESSION */}
      <motion.div
        style={{ scaleX: progressX }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 origin-left z-[60]"
      />

      {/* ============================================================ */}
      {/* NAVIGATION */}
      {/* ============================================================ */}
      <header className={`fixed top-1 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuMobile ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/70 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link href="/" onClick={() => setMenuMobile(false)} className="flex-shrink-0">
              <Logo size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              <Link href="/professeurs" className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">Trouver un prof</Link>
              <Link href="/apropos" className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">À propos</Link>
              <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">Contact</Link>
              <div className="w-px h-5 bg-slate-200 mx-2" />
              <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-blue-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                🔐 Connexion
              </Link>
              <Link href="/inscription" className="text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all">
                ✨ S'inscrire
              </Link>
            </nav>

            <button
              onClick={() => setMenuMobile(!menuMobile)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label="Menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <motion.span animate={menuMobile ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-slate-900 rounded-full" />
                <motion.span animate={menuMobile ? { opacity: 0 } : { opacity: 1 }} className="block w-5 h-0.5 bg-slate-900 rounded-full" />
                <motion.span animate={menuMobile ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-slate-900 rounded-full" />
              </div>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuMobile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden bg-white border-t border-slate-200"
            >
              <nav className="px-4 py-5 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <Link href="/professeurs" onClick={() => setMenuMobile(false)} className="flex items-center gap-3 py-3 px-4 font-bold text-slate-700 rounded-xl hover:bg-slate-50">
                  <span className="text-lg">👨‍🏫</span><span>Trouver un prof</span>
                </Link>
                <Link href="/apropos" onClick={() => setMenuMobile(false)} className="flex items-center gap-3 py-3 px-4 font-bold text-slate-700 rounded-xl hover:bg-slate-50">
                  <span className="text-lg">ℹ️</span><span>À propos</span>
                </Link>
                <Link href="/contact" onClick={() => setMenuMobile(false)} className="flex items-center gap-3 py-3 px-4 font-bold text-slate-700 rounded-xl hover:bg-slate-50">
                  <span className="text-lg">📞</span><span>Contact</span>
                </Link>
                <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
                  <Link href="/login" onClick={() => setMenuMobile(false)} className="block w-full text-center py-3 rounded-xl font-bold text-slate-700 bg-slate-100">
                    🔐 Connexion
                  </Link>
                  <Link href="/inscription" onClick={() => setMenuMobile(false)} className="block w-full text-center py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg">
                    ✨ S'inscrire gratuitement
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================ */}
      {/* HERO */}
      {/* ============================================================ */}
      <section ref={heroRef} className="relative pt-24 md:pt-28 lg:pt-32 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/60 via-white to-white" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-br from-blue-300/30 via-emerald-300/20 to-purple-300/20 rounded-full blur-3xl -z-10"
        />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {enLigne} parents connectés maintenant
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4 leading-[1.1] tracking-tight">
                Le meilleur prof,
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
                  pour chaque besoin.
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Soutien scolaire, Coran, langues, informatique, arts — des professeurs <strong className="text-slate-900">vérifiés</strong> et adaptés à votre enfant.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-lg p-2 mb-5 max-w-xl mx-auto lg:mx-0"
              >
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <input
                    type="text"
                    placeholder="🔍 Matière (Maths, Coran...)"
                    value={rechercheMatiere}
                    onChange={(e) => setRechercheMatiere(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lancerRecherche()}
                    className="flex-1 px-4 py-3 rounded-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50 transition-colors"
                  />
                  <select
                    value={rechercheNiveau}
                    onChange={(e) => setRechercheNiveau(e.target.value)}
                    className="sm:w-32 px-4 py-3 rounded-xl bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:bg-slate-50 cursor-pointer"
                  >
                    <option value="">Niveau</option>
                    <option value="primaire">Primaire</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                  </select>
                  <button
                    onClick={lancerRecherche}
                    className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <span>🔍</span>
                    <span className="hidden sm:inline">Rechercher</span>
                  </button>
                </div>
              </motion.div>

              <div className="flex flex-col sm:flex-row gap-3 mb-5 justify-center lg:justify-start">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:scale-[1.02] transition-all"
                >
                  <span className="text-lg">✨</span>
                  <span>S'inscrire gratuitement</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-900 text-slate-900 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <span className="text-lg">🔐</span>
                  <span>Se connecter</span>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative max-w-md mx-auto lg:mx-0 lg:max-w-none order-1 lg:order-2"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0">📖</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm truncate">Hassan A.</div>
                      <div className="text-xs text-slate-500 truncate">Prof de Coran · Testé ✓</div>
                    </div>
                    <div className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold flex-shrink-0">✓ TESTÉ</div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-amber-400 text-sm">⭐⭐⭐⭐⭐</span>
                    <span className="text-sm font-bold text-slate-900">4.9</span>
                    <span className="text-xs text-slate-500">· 82 avis</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded-full font-bold">📖 Hifz</span>
                    <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-bold">🎵 Tajwid</span>
                    <span className="text-[10px] bg-purple-50 text-purple-800 px-2 py-1 rounded-full font-bold">📚 Tafsir</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500">📍 Balbala · 🎯 8 ans</div>
                    <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-full font-bold">✓ VÉRIFIÉ</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden sm:flex absolute -top-3 -right-3 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 items-center gap-2"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg">✅</div>
                  <div>
                    <div className="text-[10px] font-black text-slate-900">100% Vérifié</div>
                    <div className="text-[9px] text-slate-500">par notre équipe</div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden sm:flex absolute -bottom-3 -left-3 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 items-center gap-2"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg">⭐</div>
                  <div>
                    <div className="text-[10px] font-black text-slate-900">4.9/5</div>
                    <div className="text-[9px] text-slate-500">note moyenne</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STATS LIVE */}
      {/* ============================================================ */}
      <section className="relative py-8 md:py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-200/70 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {[
              { label: 'Professeurs vérifiés', valeur: stats.profs, emoji: '👨‍🏫', suffixe: '+' },
              { label: 'Parents inscrits', valeur: stats.parents + 40, emoji: '👨‍👩‍👧', suffixe: '+' },
              { label: 'Élèves accompagnés', valeur: stats.eleves, emoji: '🎓', suffixe: '+' },
              { label: 'Note moyenne', valeur: (Math.round(stats.note_moyenne * 10) / 10) + 3.5, emoji: '⭐', suffixe: '/5' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl mb-1.5">{s.emoji}</div>
                <div className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mb-1">
                  {loading ? <span className="inline-block w-12 h-7 bg-slate-200 animate-pulse rounded" /> : <CompteurAnime valeur={s.valeur} duration={1.5} suffix={s.suffixe} />}
                </div>
                <div className="text-xs md:text-sm text-slate-600 font-medium leading-tight">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10 UNIVERS */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            badge="📚 10 grands univers"
            badgeColor="from-purple-500 to-pink-600"
            titre="Tout, absolument tout."
            sousTitre="Du soutien scolaire au Coran, en passant par la tech, les arts et le sport."
          />

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {UNIVERS.map((m, i) => (
              <motion.div
                key={m.titre}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all relative"
              >
                {m.populaire && (
                  <div className="absolute top-3 right-3 text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">🔥</div>
                )}
                <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${m.couleur} flex items-center justify-center text-white text-xl shadow-md mb-2.5`}>
                  {m.emoji}
                </div>
                <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1">{m.titre}</h3>
                <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">{m.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {m.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7 TYPES DE PROFESSEURS */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            badge="👥 7 types de professeurs"
            badgeColor="from-indigo-500 to-purple-600"
            titre="Des profs pour chaque besoin"
            sousTitre="Du soutien scolaire au Coran, tous vérifiés par notre équipe."
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {TYPES_PROFS.map((t, i) => (
              <motion.div
                key={t.titre}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${t.couleur} flex items-center justify-center text-white text-xl shadow-md mb-2.5`}>
                  {t.emoji}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{t.titre}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/inscription/professeur" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
              🚀 Je veux devenir prof
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* COMMENT ÇA MARCHE */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            badge="📖 6 étapes simples"
            titre="Comment ça marche ?"
            sousTitre="De l'inscription au premier cours, en 6 étapes claires."
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 md:gap-4">
            {ETAPES.map((e, i) => (
              <motion.div
                key={e.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="text-center"
              >
                <div className="relative inline-block mb-3">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${e.couleur} flex items-center justify-center text-white text-xl md:text-2xl shadow-lg mx-auto`}>
                    {e.emoji}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-slate-900 shadow-md">
                    {e.num}
                  </div>
                </div>
                <h3 className="text-xs md:text-sm font-bold text-slate-900 mb-1">{e.titre}</h3>
                <p className="text-[10px] md:text-xs text-slate-600 leading-relaxed px-1">{e.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6 AVANTAGES */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            badge="💎 Nos atouts"
            badgeColor="from-blue-500 to-indigo-600"
            titre="Pourquoi nous choisir ?"
            sousTitre="Une plateforme pensée pour les parents et les profs de Djibouti."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVANTAGES.map((a, i) => (
              <motion.div
                key={a.titre}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.couleur} flex items-center justify-center text-white text-xl shadow-md mb-3`}>
                  {a.emoji}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{a.titre}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TÉMOIGNAGES */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            badge="💬 Témoignages"
            badgeColor="from-amber-500 to-orange-600"
            titre="Ils nous font confiance"
            sousTitre="beaucoup de familles nous font déjà confiance à Djibouti."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {TEMOIGNAGES.map((t, i) => (
              <motion.div
                key={t.nom}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="text-[9px] bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold inline-block mb-3">{t.matiere}</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${t.couleur} flex items-center justify-center text-white text-xl shadow-md flex-shrink-0`}>
                    {t.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{t.nom}</div>
                    <div className="text-[10px] text-slate-500 truncate">{t.role}</div>
                  </div>
                </div>
                <div className="mb-2 text-amber-400 text-xs">⭐⭐⭐⭐⭐</div>
                <p className="text-sm text-slate-700 leading-relaxed italic">« {t.texte} »</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* DEVENIR PROF */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl text-white relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wide mb-4">
                  💰 Pour les professeurs
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4 leading-tight">
                  Vous êtes prof ?<br />Gagnez de l'argent à Djibouti
                </h2>
                <p className="text-sm sm:text-base text-emerald-100 mb-5 leading-relaxed">
                  Rejoignez notre communauté et trouvez des élèves près de chez vous. Fixez vos horaires et vos tarifs en toute liberté.
                </p>
                <div className="space-y-2 mb-6">
                  {['Inscription 100% gratuite', 'Vous choisissez vos horaires', 'Vous fixez vos tarifs', 'Badges & étoiles de reconnaissance'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-300">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/inscription/professeur" className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                  🚀 Devenir prof en 5 minutes
                </Link>
              </div>
              <div className="hidden md:grid grid-cols-2 gap-3">
                {[
                  { emoji: '💵', label: 'Revenus doublés', desc: 'pour certains profs' },
                  { emoji: '📅', label: 'Horaires libres', desc: 'vous décidez' },
                  { emoji: '🏆', label: 'Badges & étoiles', desc: 'reconnaissance' },
                  { emoji: '🇩🇯', label: '100% Djibouti', desc: 'local' },
                ].map((c) => (
                  <div key={c.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="text-2xl mb-2">{c.emoji}</div>
                    <div className="font-bold text-sm">{c.label}</div>
                    <div className="text-[10px] text-emerald-100">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <SectionTitle
            badge="❓ Questions fréquentes"
            badgeColor="from-indigo-500 to-purple-600"
            titre="Vous avez des questions ?"
            sousTitre="Trouvez les réponses aux questions les plus posées."
          />

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, i) => {
              const ouverte = faqOuverte === i
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    ouverte ? 'border-emerald-300 shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button onClick={() => setFaqOuverte(ouverte ? null : i)} className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left">
                    <span className="font-bold text-slate-900 text-sm sm:text-base pr-4">{item.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 transition-all ${
                      ouverte ? 'bg-emerald-500 text-white rotate-45' : 'bg-slate-100 text-slate-600'
                    }`}>+</div>
                  </button>
                  <AnimatePresence>
                    {ouverte && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5">
                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-sm text-slate-600 leading-relaxed">{item.r}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA FINAL */}
      {/* ============================================================ */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl text-white text-center relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="text-4xl sm:text-5xl mb-3">🎯</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">Prêt à commencer ?</h2>
              <p className="text-sm sm:text-base text-blue-100 mb-6 max-w-xl mx-auto leading-relaxed">
                Que vous soyez parent ou professeur, inscrivez-vous gratuitement et trouvez ce que vous cherchez.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/inscription" className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-3.5 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all">
                  <span>✨</span><span>S'inscrire gratuitement</span>
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all">
                  <span>🔐</span><span>Se connecter</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="bg-slate-900 text-white pt-12 md:pt-14 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <Logo size="md" onDark />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                La plateforme éducative de référence à Djibouti.
              </p>
              <div className="flex gap-2">
                <a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-green-500 flex items-center justify-center transition-colors text-sm">💬</a>
                <a href="mailto:contact@djibsuperprof.dj" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-blue-500 flex items-center justify-center transition-colors text-sm">✉️</a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase tracking-wider mb-3 text-slate-300">Navigation</h3>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="text-slate-400 hover:text-white transition-colors">🏠 Accueil</Link></li>
                <li><Link href="/professeurs" className="text-slate-400 hover:text-white transition-colors">👨‍🏫 Trouver un prof</Link></li>
                <li><Link href="/inscription" className="text-slate-400 hover:text-white transition-colors">📝 S'inscrire</Link></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors">🔐 Connexion</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase tracking-wider mb-3 text-slate-300">Informations</h3>
              <ul className="space-y-2 text-xs">
                <li><Link href="/apropos" className="text-slate-400 hover:text-white transition-colors">ℹ️ À propos</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors">📞 Contact</Link></li>
                <li><a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">💬 WhatsApp</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase tracking-wider mb-3 text-slate-300">Contact</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2"><span>📞</span><span>+253 77 74 14 82</span></li>
                <li className="flex items-start gap-2"><span>📍</span><span>Djibouti</span></li>
                <li className="flex items-start gap-2"><span>🕐</span><span>7j/7 · 8h-21h</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-slate-500 text-center md:text-left">
              © 2026 Djib Superprof — Tous droits réservés
            </p>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span>🔒</span><span>Paiements sécurisés</span></span>
              <span className="flex items-center gap-1"><span>🇩🇯</span><span>100% Djibouti</span></span>
            </div>
          </div>
        </div>
      </footer>

      {/* BOUTON WHATSAPP FLOTTANT */}
      <motion.a
        href="https://wa.me/25377741482"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 300 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-600/40 flex items-center justify-center text-2xl text-white"
        title="Contacter sur WhatsApp"
      >
        💬
      </motion.a>
    </div>
  )
}