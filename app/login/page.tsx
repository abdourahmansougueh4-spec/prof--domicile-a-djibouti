'use client'

import { useState, Suspense, useId, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
// FORMULAIRE
// ============================================================
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)
  const [success, setSuccess] = useState(false)

  const redirectUrl = searchParams.get('redirect') || ''

  const valider = () => {
    if (!email || !motDePasse) {
      setErreur('Veuillez remplir votre email et votre mot de passe')
      return false
    }
    if (!email.includes('@')) {
      setErreur('Veuillez entrer un email valide')
      return false
    }
    setErreur('')
    return true
  }

  const seConnecter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valider()) return

    setLoading(true)
    setErreur('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: motDePasse,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setErreur('Email ou mot de passe incorrect.')
        } else if (authError.message.includes('Email not confirmed')) {
          setErreur("Votre email n'a pas été confirmé. Contactez-nous sur WhatsApp.")
        } else {
          setErreur(`Erreur : ${authError.message}`)
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setErreur('Erreur de connexion. Veuillez réessayer.')
        setLoading(false)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, nom_complet')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profileData) {
        setErreur('Profil introuvable. Contactez-nous.')
        setLoading(false)
        return
      }

      const role = profileData.role
      setSuccess(true)
      await new Promise((r) => setTimeout(r, 700))

      if (redirectUrl) {
        router.push(redirectUrl)
      } else if (role === 'parent') {
        router.push('/espace-parent')
      } else if (role === 'professeur') {
        router.push('/espace-professeur')
      } else if (role === 'admin') {
        router.push('/zx-4f8b2e-9d3a-ctrl')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setErreur('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex flex-col">
      {/* Halos d'arrière-plan très subtils */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Header minimal */}
      <header className="relative z-20 flex items-center justify-between px-5 sm:px-8 pt-6">
        <Link
          href="/"
          className="text-sm font-bold text-slate-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span className="hidden sm:inline">Retour à l'accueil</span>
          <span className="sm:hidden">Retour</span>
        </Link>
        <a
          href="https://wa.me/25377741482"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5"
        >
          <span>💬</span>
          <span className="hidden sm:inline">Besoin d'aide ?</span>
          <span className="sm:hidden">Aide</span>
        </a>
      </header>

      {/* Contenu central */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Logo + titre */}
          <div className="text-center mb-8 sm:mb-10">
            <Link href="/" className="inline-flex justify-center mb-6">
              <Logo size="lg" />
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              Bon retour
            </h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base">
              Connectez-vous à votre espace personnel
            </p>
          </div>

          {/* Carte formulaire */}
          <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/[0.06] border border-slate-200/70 p-6 sm:p-8 overflow-hidden">
            {/* Accent haut : ligne de "qualité" */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-emerald-500 to-blue-700" />

            {/* Erreur */}
            <AnimatePresence>
              {erreur && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <p className="text-red-700 text-sm font-semibold leading-relaxed">{erreur}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={seConnecter} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors text-sm pointer-events-none">
                    ✉️
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal text-sm"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  <Link
                    href="/mot-de-passe-oublie"
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Oublié ?
                  </Link>
                </div>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors text-sm pointer-events-none">
                    🔒
                  </span>
                  <input
                    id="password"
                    type={voirMotDePasse ? 'text' : 'password'}
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setVoirMotDePasse(!voirMotDePasse)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors text-sm p-1"
                    aria-label={voirMotDePasse ? 'Cacher le mot de passe' : 'Voir le mot de passe'}
                  >
                    {voirMotDePasse ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading || success}
                className={`w-full py-3.5 rounded-xl font-black text-white transition-all flex items-center justify-center gap-2 text-sm shadow-lg disabled:cursor-not-allowed relative overflow-hidden group ${
                  success
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60'
                }`}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Connexion...
                  </>
                ) : success ? (
                  <>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      ✓
                    </motion.span>
                    Connexion réussie
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white px-3 text-slate-400 font-black uppercase tracking-widest">
                  Nouveau ici ?
                </span>
              </div>
            </div>

            {/* Inscription */}
            <Link
              href={`/inscription${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="block w-full py-3 rounded-xl font-black text-center text-blue-700 bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all text-sm"
            >
              ✨ Créer un compte gratuit
            </Link>
          </div>

          {/* Signaux de confiance (qualitatifs uniquement) */}
          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-5 flex-wrap text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span>🔒</span>
              <span>Connexion sécurisée</span>
            </div>
            <span className="text-slate-200">·</span>
            <div className="flex items-center gap-1.5">
              <span>🇩🇯</span>
              <span>100% Djibouti</span>
            </div>
            <span className="text-slate-200">·</span>
            <div className="flex items-center gap-1.5">
              <span>💬</span>
              <span>Support 7j/7</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-[11px] text-slate-400 font-medium">
          © {new Date().getFullYear()} Djib Superprof · Fait avec ❤️ à Djibouti
        </p>
      </footer>
    </div>
  )
}

// ============================================================
// WRAPPER
// ============================================================
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
          />
          <p className="text-slate-500 font-bold text-sm">Chargement...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}