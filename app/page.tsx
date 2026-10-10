'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type StatsGlobales = {
  profs: number
  parents: number
  eleves: number
  note_moyenne: number
  types: number
  langues: number
}

// ============================================================
// 10 GRANDS UNIVERS
// ============================================================

const UNIVERS = [
  {
    emoji: '🎒',
    titre: 'Soutien scolaire',
    desc: 'Primaire, collège, lycée — toutes matières',
    tags: ['Maths', 'Français', 'Arabe', 'Physique'],
    couleur: 'from-blue-500 to-blue-600',
    bg: 'from-blue-50 via-blue-100 to-white',
    count: 'Tous niveaux',
    populaire: true,
  },
  {
    emoji: '📖',
    titre: 'Coran & Tajwid',
    desc: 'Lecture, mémorisation, tajwid, tafsir',
    tags: ['Hifz', 'Tajwid', 'Lecture', 'Tafsir'],
    couleur: 'from-emerald-500 to-teal-600',
    bg: 'from-emerald-50 via-teal-100 to-white',
    count: 'Testé & vérifié',
    populaire: true,
    verifie: true,
  },
  {
    emoji: '🌍',
    titre: 'Langues du monde',
    desc: 'Arabe, Français, Anglais, Somali, Afar, Espagnol',
    tags: ['Arabe', 'Français', 'Anglais', 'Somali'],
    couleur: 'from-purple-500 to-purple-600',
    bg: 'from-purple-50 via-purple-100 to-white',
    count: 'Tous niveaux',
    populaire: true,
  },
  {
    emoji: '💻',
    titre: 'Informatique & Tech',
    desc: 'Bureautique, programmation, web, réseaux',
    tags: ['Python', 'Word', 'Excel', 'Web'],
    couleur: 'from-cyan-500 to-blue-600',
    bg: 'from-cyan-50 via-blue-100 to-white',
    count: 'Débutant+',
  },
  {
    emoji: '💼',
    titre: 'Formation professionnelle',
    desc: 'Comptabilité, gestion, marketing, entrepreneuriat',
    tags: ['Business', 'Gestion', 'Marketing'],
    couleur: 'from-indigo-500 to-purple-600',
    bg: 'from-indigo-50 via-purple-100 to-white',
    count: 'Adultes',
  },
  {
    emoji: '🎨',
    titre: 'Arts & Créativité',
    desc: 'Dessin, peinture, musique, théâtre, photographie',
    tags: ['Dessin', 'Musique', 'Photo'],
    couleur: 'from-pink-500 to-rose-600',
    bg: 'from-pink-50 via-rose-100 to-white',
    count: 'Tous âges',
  },
  {
    emoji: '⚽',
    titre: 'Sport & Bien-être',
    desc: 'Football, natation, fitness, yoga, arts martiaux',
    tags: ['Football', 'Yoga', 'Fitness'],
    couleur: 'from-orange-500 to-red-600',
    bg: 'from-orange-50 via-red-100 to-white',
    count: 'Tous âges',
  },
  {
    emoji: '📝',
    titre: 'Préparation concours',
    desc: 'Bac, examens officiels, concours grandes écoles',
    tags: ['Bac', 'Concours', 'Examens'],
    couleur: 'from-amber-500 to-orange-600',
    bg: 'from-amber-50 via-orange-100 to-white',
    count: 'Lycée+',
  },
  {
    emoji: '🧒',
    titre: 'Éveil & Maternelle',
    desc: 'Éveil, lecture, écriture, motricité (3-6 ans)',
    tags: ['3-6 ans', 'Éveil', 'Motricité'],
    couleur: 'from-yellow-500 to-amber-600',
    bg: 'from-yellow-50 via-amber-100 to-white',
    count: '3-6 ans',
  },
  {
    emoji: '🎯',
    titre: 'Cours sur mesure',
    desc: 'Toute demande personnalisée — dites-nous !',
    tags: ['Sur mesure', 'Flexible'],
    couleur: 'from-slate-500 to-slate-700',
    bg: 'from-slate-50 via-slate-100 to-white',
    count: 'Sur demande',
  },
]

// ============================================================
// 7 TYPES DE PROFESSEURS
// ============================================================

const TYPES_PROFS = [
  {
    emoji: '🎓',
    titre: 'Étudiant universitaire',
    desc: 'Licence, Master, Doctorat',
    tags: ['Licence', 'Master', 'Doctorat'],
    couleur: 'from-blue-500 to-indigo-600',
    physiqueRequise: false,
    badge: '🎓',
  },
  {
    emoji: '📜',
    titre: 'Diplômé universitaire',
    desc: 'Diplôme reconnu par l\'État',
    tags: ['Licence', 'Master'],
    couleur: 'from-emerald-500 to-teal-600',
    physiqueRequise: false,
    badge: '📜',
  },
  {
    emoji: '🎓',
    titre: 'Bac Scientifique',
    desc: 'Spécialiste matières scientifiques',
    tags: ['Maths', 'Physique', 'SVT'],
    couleur: 'from-amber-500 to-orange-600',
    physiqueRequise: false,
    badge: '🔬',
  },
  {
    emoji: '👨‍🏫',
    titre: 'Enseignant officiel',
    desc: 'En activité dans les établissements',
    tags: ['École', 'Collège', 'Lycée'],
    couleur: 'from-purple-500 to-pink-600',
    physiqueRequise: true,
    badge: '🏫',
  },
  {
    emoji: '💼',
    titre: 'Professeur freelance',
    desc: 'Tuteur indépendant expérimenté',
    tags: ['Tous niveaux', 'Flexible'],
    couleur: 'from-cyan-500 to-blue-600',
    physiqueRequise: true,
    badge: '💼',
  },
  {
    emoji: '🏢',
    titre: 'Formateur spécialisé',
    desc: 'Informatique, langues, arts, métiers',
    tags: ['Tech', 'Langues', 'Métiers'],
    couleur: 'from-rose-500 to-pink-600',
    physiqueRequise: true,
    badge: '🏢',
  },
  {
    emoji: '📖',
    titre: 'Enseignant Coran',
    desc: 'Testé physiquement — lecture, tajwid, hifz',
    tags: ['Lecture', 'Tajwid', 'Hifz'],
    couleur: 'from-green-500 to-emerald-600',
    physiqueRequise: true,
    badge: '🕌',
  },
]

// ============================================================
// 6 AVANTAGES
// ============================================================

const AVANTAGES = [
  { emoji: '✅', titre: 'Profs vérifiés', desc: 'Documents contrôlés et profils validés par notre équipe.', couleur: 'from-emerald-500 to-emerald-600' },
  { emoji: '🌍', titre: '5 langues', desc: 'Français, Arabe, Somali, Afar, Anglais.', couleur: 'from-blue-500 to-blue-600' },
  { emoji: '🏠', titre: 'Chez vous', desc: 'Cours à domicile, chez le prof, ou en ligne.', couleur: 'from-purple-500 to-purple-600' },
  { emoji: '💰', titre: 'Prix libres', desc: 'Négociation directe. Pas de frais cachés.', couleur: 'from-amber-500 to-amber-600' },
  { emoji: '🏅', titre: 'Badges & étoiles', desc: 'Reconnaissance des meilleurs profs.', couleur: 'from-yellow-500 to-orange-600' },
  { emoji: '📱', titre: 'Support 7j/7', desc: 'Notre équipe est joignable sur WhatsApp.', couleur: 'from-green-500 to-emerald-600' },
]

// ============================================================
// 6 ÉTAPES (au lieu de 3)
// ============================================================

const ETAPES = [
  { num: 1, emoji: '📝', titre: 'Inscription', desc: 'Créez votre compte parent ou prof en 2 min.', couleur: 'from-blue-500 to-blue-600' },
  { num: 2, emoji: '✅', titre: 'Vérification', desc: 'Notre équipe vérifie chaque profil.', couleur: 'from-emerald-500 to-emerald-600' },
  { num: 3, emoji: '🔍', titre: 'Recherche', desc: 'Filtrez par matière, niveau, langue, quartier.', couleur: 'from-purple-500 to-purple-600' },
  { num: 4, emoji: '📞', titre: 'Contact', desc: 'On vous met en relation en 24h max.', couleur: 'from-pink-500 to-rose-600' },
  { num: 5, emoji: '📚', titre: '1er cours', desc: 'Rencontre, négociation, démarrage.', couleur: 'from-amber-500 to-orange-600' },
  { num: 6, emoji: '⭐', titre: 'Suivi', desc: 'Évaluation mensuelle et progression.', couleur: 'from-cyan-500 to-blue-600' },
]

// ============================================================
// 3 TÉMOIGNAGES
// ============================================================

const TEMOIGNAGES = [
  { emoji: '👨‍👩‍👧', nom: 'Ahmed H.', role: 'Parent · Héron', texte: 'J\'ai trouvé un excellent prof de maths pour ma fille en 3 jours. Le système de vérification m\'a rassuré.', note: 5, couleur: 'from-blue-500 to-indigo-600', matiere: 'Maths' },
  { emoji: '👩', nom: 'Fatima I.', role: 'Parent · Balbala', texte: 'Enfin une plateforme qui propose aussi des profs de Coran testés. Mes enfants progressent en lecture et mémorisation.', note: 5, couleur: 'from-emerald-500 to-teal-600', matiere: 'Coran' },
  { emoji: '👨‍🏫', nom: 'Mohamed A.', role: 'Professeur · Bac S', texte: 'Grâce à la plateforme, j\'ai pu doubler mes revenus. Le suivi est professionnel, je recommande à tous les profs.', note: 5, couleur: 'from-purple-500 to-pink-600', matiere: 'Sciences' },
]

// ============================================================
// 8 FAQ
// ============================================================

const FAQ_ITEMS = [
  { q: 'Comment sont vérifiés les professeurs ?', r: 'Tous les profs passent par une vérification : documents (diplômes, identité), entretien, et pour certains types (enseignant, freelance, formateur, Coran), une vérification physique. Les profs de Coran sont testés sur la lecture, tajwid et mémorisation.' },
  { q: 'Combien coûte l\'inscription ?', r: 'L\'inscription est 100% GRATUITE pour les parents. Pour les profs, une formule mensuelle (500 à 1500 DJF) permet d\'apparaître dans les recherches.' },
  { q: 'Comment se passe le paiement ?', r: 'Le paiement se fait directement entre parent et prof après la rencontre. Méthodes : Waafi, espèces, ou carte bancaire.' },
  { q: 'Puis-je choisir selon la langue maternelle ?', r: 'Oui ! Chaque prof indique les langues qu\'il parle (Français, Arabe, Somali, Afar, Anglais). Vous filtrez selon votre préférence.' },
  { q: 'Les profs de Coran sont-ils testés ?', r: 'Absolument. Nos enseignants de Coran passent un test physique de lecture, tajwid et mémorisation avant validation. Nous garantissons leur sérieux et leur maîtrise.' },
  { q: 'Où se passent les cours ?', r: 'Selon la préférence du prof : chez lui, chez vous, ou les deux. Ce choix est indiqué sur chaque profil.' },
  { q: 'Puis-je contacter un prof avant de m\'engager ?', r: 'Oui. Notre équipe vous met en contact après acceptation. Une rencontre préalable est recommandée.' },
  { q: 'Combien de temps pour trouver un prof ?', r: 'En moyenne 24 à 72h. Notre équipe traite les demandes en priorité et vous accompagne jusqu\'à la mise en relation.' },
]

// ============================================================
// STATS ULTIME
// ============================================================

const STATS_ULTIME = [
  { emoji: '👥', valeur: '7', label: 'Types de profs', desc: 'Étudiant, diplômé, enseignant, freelance...' },
  { emoji: '🌍', valeur: '5', label: 'Langues parlées', desc: 'Français, Arabe, Somali, Afar, Anglais' },
  { emoji: '🎯', valeur: '10', label: 'Grands univers', desc: 'Scolaire, Coran, tech, arts, sport, formation...' },
  { emoji: '✅', valeur: '100%', label: 'Vérifiés', desc: 'Chaque prof passe par notre équipe' },
]

// ============================================================
// COMPOSANT : Compteur animé
// ============================================================

function CompteurAnime({ valeur, duration = 2, suffix = '' }: { valeur: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const end = valeur
    const increment = end / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [valeur, duration])
  return <span>{count}{suffix}</span>
}

// ============================================================
// COMPOSANT : Badge
// ============================================================

function Badge({ children, couleur = 'from-emerald-500 to-teal-600' }: { children: React.ReactNode; couleur?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 bg-gradient-to-r ${couleur} text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md`}>
      {children}
    </span>
  )
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function HomePage() {
  const supabase = createClient()
  const [stats, setStats] = useState<StatsGlobales>({ profs: 0, parents: 0, eleves: 0, note_moyenne: 0, types: 7, langues: 5 })
  const [loading, setLoading] = useState(true)
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0)
  const [menuMobile, setMenuMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const chargerStats = async () => {
      try {
        const [profsRes, parentsRes, elevesRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professeur').eq('approuve', true).eq('banni', false),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
          supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('statut', 'acceptee'),
        ])
        const { data: profsData } = await supabase.from('professeurs').select('note_moyenne').eq('approuve', true).gt('note_moyenne', 0)
        const noteMoy = profsData && profsData.length > 0 ? profsData.reduce((acc, p) => acc + Number(p.note_moyenne), 0) / profsData.length : 0
        setStats({
          profs: profsRes.count || 0,
          parents: parentsRes.count || 0,
          eleves: elevesRes.count || 0,
          note_moyenne: noteMoy,
          types: 7,
          langues: 5,
        })
      } catch (err) {
        console.error('Erreur stats:', err)
      } finally {
        setLoading(false)
      }
    }
    chargerStats()
  }, [supabase])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Blobs animés */}
      <motion.div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="fixed bottom-[-200px] right-[-200px] w-[700px] h-[700px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-300/10 rounded-full blur-3xl pointer-events-none" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />

      {/* NAVIGATION */}
      <motion.nav initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-white/80 border-b border-slate-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">Prof À Domicile</span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/professeurs" className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors">Trouver un prof</Link>
            <Link href="/apropos" className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors">À propos</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors">Contact</Link>
            <div className="flex items-center gap-2 ml-4">
              <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-blue-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">Connexion</Link>
              <Link href="/inscription" className="text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all">✨ S'inscrire</Link>
            </div>
          </div>
          <button onClick={() => setMenuMobile(!menuMobile)} className="md:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">{menuMobile ? '✕' : '☰'}</button>
        </div>
        <AnimatePresence>
          {menuMobile && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-slate-200">
              <div className="px-6 py-4 space-y-2">
                <Link href="/professeurs" className="block py-3 font-bold text-slate-700">👨‍🏫 Trouver un prof</Link>
                <Link href="/apropos" className="block py-3 font-bold text-slate-700">ℹ️ À propos</Link>
                <Link href="/contact" className="block py-3 font-bold text-slate-700">📞 Contact</Link>
                <div className="pt-3 border-t border-slate-200 flex gap-2">
                  <Link href="/login" className="flex-1 text-center py-3 rounded-xl font-bold text-slate-700 bg-slate-100">Connexion</Link>
                  <Link href="/inscription" className="flex-1 text-center py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600">S'inscrire</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HERO */}
      <section className="relative z-10 pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Inscription gratuite · 2 minutes</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                Le meilleur prof,
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">pour chaque besoin.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
                <strong className="text-slate-900">Soutien scolaire, Coran, langues, informatique, arts, sport, formation pro</strong> — des professeurs <strong className="text-slate-900">vérifiés</strong> et adaptés à votre enfant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/inscription/parent" className="group bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-7 py-4 rounded-2xl text-base font-bold shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform">👨‍👩‍👧</span><span>Je suis Parent</span>
                </Link>
                <Link href="/inscription/professeur" className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-7 py-4 rounded-2xl text-base font-bold shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform">👨‍🏫</span><span>Je suis Professeur</span>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span><span className="font-bold">100% gratuit</span></div>
                <div className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span><span className="font-bold">Profs vérifiés</span></div>
                <div className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span><span className="font-bold">Support 7j/7</span></div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="relative">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 max-w-md mx-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg">📖</div>
                    <div>
                      <div className="font-black text-slate-900">Hassan A.</div>
                      <div className="text-xs text-slate-500">Prof de Coran · Testé ✓</div>
                    </div>
                    <div className="ml-auto text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-black">✓ TESTÉ</div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-amber-400">⭐⭐⭐</span>
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
                    <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-full font-black">✓ VÉRIFIÉ PHYSIQUEMENT</span>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl">✅</div>
                  <div>
                    <div className="text-[10px] font-black text-slate-900">100% Vérifié</div>
                    <div className="text-[9px] text-slate-500">par notre équipe</div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl">⭐</div>
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

      {/* STATS LIVE */}
      <section className="relative z-10 py-12 px-4 md:px-6 border-y border-slate-200/70 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Professeurs vérifiés', valeur: stats.profs, emoji: '👨‍🏫', suffixe: '+' },
              { label: 'Parents inscrits', valeur: stats.parents, emoji: '👨‍👩‍👧', suffixe: '+' },
              { label: 'Élèves accompagnés', valeur: stats.eleves, emoji: '🎓', suffixe: '+' },
              { label: 'Note moyenne', valeur: Math.round(stats.note_moyenne * 10) / 10, emoji: '⭐', suffixe: '/5' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="text-center">
                <div className="text-3xl md:text-4xl mb-2">{s.emoji}</div>
                <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">
                  {loading ? <span className="inline-block w-16 h-8 bg-slate-200 animate-pulse rounded" /> : <CompteurAnime valeur={s.valeur} duration={1.5} suffix={s.suffixe} />}
                </div>
                <div className="text-xs md:text-sm text-slate-600 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 TYPES DE PROFESSEURS */}
      <section className="relative z-10 py-20 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge couleur="from-indigo-500 to-purple-600">👥 7 types de professeurs</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-4">
              Des profs pour chaque besoin
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Du soutien scolaire au Coran, en passant par les formateurs spécialisés
              et les profs d'arts. Tous vérifiés par notre équipe.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TYPES_PROFS.map((t, i) => (
              <motion.div key={t.titre} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }} whileHover={{ y: -5, scale: 1.02 }} className="bg-white rounded-2xl p-5 border-2 border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all relative">
                <div className="absolute top-3 right-3 text-2xl">{t.badge}</div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.couleur} flex items-center justify-center text-white text-2xl shadow-lg mb-3`}>{t.emoji}</div>
                <h3 className="text-sm font-black text-slate-900 mb-1">{t.titre}</h3>
                <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">{t.desc}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {t.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">{tag}</span>
                  ))}
                </div>
                {t.physiqueRequise && (
                  <div className="text-[9px] text-amber-700 font-black bg-amber-50 px-2 py-0.5 rounded-full inline-block">🚶 Vérif. physique</div>
                )}
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-10">
            <p className="text-sm text-slate-500 mb-3">💡 Un type de professeur pour chaque besoin</p>
            <Link href="/inscription/professeur" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-7 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
              🚀 Je veux devenir prof
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 6 ÉTAPES DU PROCESSUS */}
      <section className="relative z-10 py-20 px-4 md:px-6 bg-gradient-to-br from-slate-50 to-blue-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge>📖 6 étapes simples</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-4">Comment ça marche ?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">De l'inscription au premier cours, en 6 étapes claires.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5">
            {ETAPES.map((e, i) => (
              <motion.div key={e.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="relative text-center">
                <div className="relative inline-block mb-4">
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${e.couleur} flex items-center justify-center text-white text-3xl shadow-xl mx-auto`}>{e.emoji}</motion.div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-4 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-lg">{e.num}</div>
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-2">{e.titre}</h3>
                <p className="text-[10px] text-slate-600 leading-relaxed">{e.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 AVANTAGES */}
      <section className="relative z-10 py-20 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge couleur="from-blue-500 to-indigo-600">💎 Nos atouts</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-4">Pourquoi nous choisir ?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Une plateforme pensée pour les parents et les profs de Djibouti.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AVANTAGES.map((a, i) => (
              <motion.div key={a.titre} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} whileHover={{ y: -5 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg hover:shadow-2xl transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.couleur} flex items-center justify-center text-white text-2xl shadow-lg mb-4`}>{a.emoji}</div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{a.titre}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 UNIVERS */}
      <section className="relative z-10 py-20 px-4 md:px-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge couleur="from-purple-500 to-pink-600">📚 10 grands univers</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-4">
              Tout, absolument tout.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Du soutien scolaire au Coran, en passant par la tech, les arts, le sport
              et la formation professionnelle.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {UNIVERS.map((m, i) => (
              <motion.div
                key={m.titre}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className={`bg-gradient-to-br ${m.bg} rounded-3xl p-6 border-2 border-white shadow-lg hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden`}
              >
                {m.populaire && (
                  <div className="absolute top-3 left-3 text-[9px] bg-gradient-to-r from-amber-500 to-orange-600 text-white px-2 py-0.5 rounded-full font-black shadow">
                    🔥 POPULAIRE
                  </div>
                )}
                {m.verifie && (
                  <div className="absolute top-3 right-3 text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black shadow">
                    ✓ VÉRIFIÉ
                  </div>
                )}
                <div className="absolute bottom-3 right-3 text-[9px] bg-white/70 backdrop-blur-sm text-slate-700 px-2 py-0.5 rounded-full font-black">
                  {m.count}
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${m.couleur} flex items-center justify-center text-white text-3xl shadow-lg mb-4`}>
                  {m.emoji}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{m.titre}</h3>
                <p className="text-sm text-slate-700 leading-relaxed mb-3">{m.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-white/70 backdrop-blur-sm text-slate-700 px-2 py-1 rounded-full font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-10">
            <Link href="/professeurs" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-7 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
              🔍 Voir tous les professeurs
            </Link>
          </motion.div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="relative z-10 py-20 px-4 md:px-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge couleur="from-amber-500 to-orange-600">💬 Témoignages</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Plus de 200 familles nous font déjà confiance à Djibouti.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((t, i) => (
              <motion.div key={t.nom} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -5 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="text-5xl text-slate-100 absolute top-4 right-6 font-serif">"</div>
                <div className="absolute top-3 left-3 text-[9px] bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-0.5 rounded-full font-black">
                  {t.matiere}
                </div>
                <div className="flex items-center gap-3 mb-4 mt-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.couleur} flex items-center justify-center text-white text-2xl shadow-lg`}>{t.emoji}</div>
                  <div>
                    <div className="font-black text-slate-900 text-sm">{t.nom}</div>
                    <div className="text-[10px] text-slate-500">{t.role}</div>
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-1">
                  {[...Array(t.note)].map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">⭐</span>
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">« {t.texte} »</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVENIR PROF */}
      <section className="relative z-10 py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
            <motion.div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/10 rounded-full blur-3xl" animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge couleur="from-white/30 to-white/20">💰 Pour les professeurs</Badge>
                <h2 className="text-3xl md:text-4xl font-black mt-4 mb-4 leading-tight">
                  Vous êtes prof ?<br />
                  Gagnez de l'argent à Djibouti 💰
                </h2>
                <p className="text-base text-emerald-100 mb-6 leading-relaxed">
                  Rejoignez notre communauté et trouvez des élèves près de chez vous.
                  Fixez vos horaires, vos prix, et construisez votre réputation.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    '✅ Inscription 100% gratuite',
                    '✅ Vous choisissez vos horaires',
                    '✅ Vous fixez vos tarifs',
                    '✅ Vous recevez des demandes tous les jours',
                    '✅ Badges et étoiles récompensent vos efforts',
                    '✅ Accès à des élèves motivés partout à Djibouti',
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-center gap-2 text-sm font-medium">
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
                <Link href="/inscription/professeur" className="inline-flex items-center gap-2 bg-white text-emerald-700 px-7 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  <span>🚀</span>
                  <span>Devenir prof en 5 minutes</span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { emoji: '💵', label: 'Revenus doublés', desc: 'pour certains profs' },
                    { emoji: '📅', label: 'Horaires libres', desc: 'vous décidez' },
                    { emoji: '🏆', label: 'Badges & étoiles', desc: 'reconnaissance' },
                    { emoji: '🇩🇯', label: '100% Djibouti', desc: 'local' },
                  ].map((c, i) => (
                    <motion.div key={c.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl mb-2">{c.emoji}</div>
                      <div className="font-black text-sm">{c.label}</div>
                      <div className="text-[10px] text-emerald-100">{c.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-20 px-4 md:px-6 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge couleur="from-indigo-500 to-purple-600">❓ Questions fréquentes</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-4">
              Vous avez des questions ?
            </h2>
            <p className="text-lg text-slate-600">
              Trouvez les réponses aux questions les plus posées.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const ouverte = faqOuverte === i
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                    ouverte
                      ? 'border-emerald-300 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button onClick={() => setFaqOuverte(ouverte ? null : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                    <span className="font-bold text-slate-900 text-sm md:text-base pr-4">
                      {item.q}
                    </span>
                    <motion.div
                      animate={{ rotate: ouverte ? 45 : 0 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 transition-colors ${
                        ouverte ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      +
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {ouverte && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0">
                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {item.r}
                            </p>
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

      {/* STATS ULTIME */}
      <section className="relative z-10 py-20 px-4 md:px-6 bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge couleur="from-cyan-500 to-blue-600">📊 Notre force</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-4">
              Une plateforme complète
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour trouver le bon professeur.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS_ULTIME.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-6 border-2 border-white shadow-lg hover:shadow-2xl transition-all text-center"
              >
                <div className="text-5xl mb-3">{s.emoji}</div>
                <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-blue-700 bg-clip-text text-transparent mb-2">
                  {s.valeur}
                </div>
                <div className="font-black text-slate-900 text-sm mb-2">
                  {s.label}
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed">
                  {s.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-8 md:p-12 shadow-2xl text-white text-center relative overflow-hidden"
          >
            <motion.div className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl" animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl" animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="relative z-10">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
                Que vous soyez parent ou professeur, inscrivez-vous gratuitement et
                trouvez ce que vous cherchez.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/inscription/parent"
                  className="bg-white text-blue-700 px-7 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>👨‍👩‍👧</span>
                  <span>Je suis Parent</span>
                </Link>
                <Link
                  href="/inscription/professeur"
                  className="bg-emerald-500 text-white px-7 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>👨‍🏫</span>
                  <span>Je suis Professeur</span>
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-sm text-blue-100 mb-4">
                  Besoin d'aide ou d'une demande spéciale ?
                </p>
                <a
                  href="https://wa.me/25377741482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-colors"
                >
                  <span className="text-xl">💬</span>
                  <span>Nous contacter sur WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-slate-900 text-white pt-16 pb-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Prof À Domicile
                </span>
                <span className="text-xl">🇩🇯</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                La plateforme éducative de référence à Djibouti. Mise en relation
                parents et professeurs vérifiés.
              </p>
              <div className="flex gap-2">
                <a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-green-500 flex items-center justify-center transition-colors" title="WhatsApp">💬</a>
                <a href="mailto:contact@profadomicile.dj" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-blue-500 flex items-center justify-center transition-colors" title="Email">✉️</a>
              </div>
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider mb-4 text-slate-300">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-slate-400 hover:text-white transition-colors">🏠 Accueil</Link></li>
                <li><Link href="/professeurs" className="text-slate-400 hover:text-white transition-colors">👨‍🏫 Trouver un prof</Link></li>
                <li><Link href="/inscription" className="text-slate-400 hover:text-white transition-colors">📝 S'inscrire</Link></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors">🔐 Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider mb-4 text-slate-300">Informations</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/apropos" className="text-slate-400 hover:text-white transition-colors">ℹ️ À propos</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors">📞 Contact</Link></li>
                <li><a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">💬 WhatsApp</a></li>
                <li><a href="mailto:contact@profadomicile.dj" className="text-slate-400 hover:text-white transition-colors">✉️ Email</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider mb-4 text-slate-300">Contact</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-lg flex-shrink-0">📞</span><span>+253 77 74 14 82</span></li>
                <li className="flex items-start gap-2"><span className="text-lg flex-shrink-0">📍</span><span>Djibouti, République de Djibouti</span></li>
                <li className="flex items-start gap-2"><span className="text-lg flex-shrink-0">🕐</span><span>Support 7j/7 de 8h à 21h</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 text-center md:text-left">
              © 2026 Prof À Domicile Djibouti — Tous droits réservés
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span>🔒</span><span>Paiements sécurisés</span></span>
              <span className="flex items-center gap-1"><span>🇩🇯</span><span>100% Djibouti</span></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
