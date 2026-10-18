'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// MENU COMPLET
// ============================================================

const menu = [
  { href: '/espace-professeur', label: 'Tableau de bord', emoji: '📊' },
  { href: '/espace-professeur/statut', label: 'Mon statut', emoji: '🏅' },
  { href: '/espace-professeur/profil', label: 'Mon profil', emoji: '👤' },
  { href: '/espace-professeur/documents', label: 'Mes documents', emoji: '📎' },
  { href: '/espace-professeur/disponibilites', label: 'Disponibilités', emoji: '📅' },
  { href: '/espace-professeur/matieres', label: 'Mes matières', emoji: '📚' },
  { href: '/espace-professeur/tarifs', label: 'Mes tarifs', emoji: '💰' },
  { href: '/espace-professeur/demandes', label: 'Demandes reçues', emoji: '📥' },
  { href: '/espace-professeur/eleves', label: 'Mes élèves', emoji: '👨‍🎓' },
  { href: '/espace-professeur/apercu', label: 'Aperçu public', emoji: '👁️' },
  { href: '/espace-professeur/regles', label: 'Règles', emoji: '📖' },
  { href: '/espace-professeur/charte-qualite', label: 'Charte qualité', emoji: '📜' },
]

// ============================================================
// MENU RAPIDE MOBILE (bottom bar)
// ============================================================

const menuRapide = [
  { href: '/espace-professeur', label: 'Accueil', emoji: '🏠' },
  { href: '/espace-professeur/demandes', label: 'Demandes', emoji: '📥' },
  { href: '/espace-professeur/documents', label: 'Docs', emoji: '📎' },
  { href: '/espace-professeur/profil', label: 'Profil', emoji: '👤' },
]

// ============================================================
// LOGO
// ============================================================

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${compact ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl shadow-md shadow-blue-600/20 flex-shrink-0`}>
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="lprof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect width="120" height="120" rx="28" fill="url(#lprof)" />
          <g transform="translate(60, 68)">
            <path d="M0 -26 L36 -10 L0 8 L-36 -10 Z" fill="white" />
            <path d="M-24 -2 L-24 16 Q-24 26 -12 26 L12 26 Q24 26 24 16 L24 -2 L0 8 Z" fill="white" opacity="0.85" />
            <path d="M36 -10 Q43 -3 43 6" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="43" cy="9" r="3.5" fill="#fbbf24" />
          </g>
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-black tracking-[0.18em] uppercase text-slate-400">
            Djib
          </span>
          <span className="text-base font-black tracking-tight text-slate-900 -mt-0.5">
            Superprof
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// LAYOUT
// ============================================================

export default function EspaceProfesseurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{
    nomComplet: string
    approuve: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOuvert, setDrawerOuvert] = useState(false)

  useEffect(() => {
    const verifier = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, nom_complet, approuve')
        .eq('id', authUser.id)
        .single()

      if (!profile || profile.role !== 'professeur') {
        router.push('/login')
        return
      }

      setUser({
        nomComplet: profile.nom_complet,
        approuve: profile.approuve || false,
      })
      setLoading(false)
    }

    verifier()
  }, [router, supabase])

  useEffect(() => {
    setDrawerOuvert(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOuvert ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOuvert])

  const deconnecter = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* ============================================================ */}
      {/* HEADER STICKY */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link href="/" className="flex-shrink-0">
              <div className="hidden sm:block">
                <Logo />
              </div>
              <div className="sm:hidden">
                <Logo compact />
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/25377741482"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <span>💬</span>
                <span>Aide</span>
              </a>

              <button
                onClick={deconnecter}
                className="hidden md:flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <span>🚪</span>
                <span>Déconnexion</span>
              </button>

              <button
                onClick={() => setDrawerOuvert(true)}
                className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                aria-label="Menu"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className="block w-5 h-0.5 bg-slate-900 rounded-full" />
                  <span className="block w-5 h-0.5 bg-slate-900 rounded-full" />
                  <span className="block w-5 h-0.5 bg-slate-900 rounded-full" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* CONTENU */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-24 lg:pb-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-4 md:gap-6">
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-20">
              <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-lg flex-shrink-0">
                    👨‍🏫
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {user?.nomComplet}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        user?.approuve ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {user?.approuve ? '✓ Approuvé' : '⏳ En attente'}
                    </div>
                  </div>
                </div>
              </div>

              <nav className="space-y-0.5">
                {menu.map((item) => {
                  const actif =
                    pathname === item.href ||
                    (item.href !== '/espace-professeur' &&
                      pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                        actif
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DRAWER MOBILE */}
      {/* ============================================================ */}
      <AnimatePresence>
        {drawerOuvert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOuvert(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <Logo />
                <button
                  onClick={() => setDrawerOuvert(false)}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-xl flex-shrink-0">
                    👨‍🏫
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {user?.nomComplet}
                    </div>
                    <div
                      className={`text-[11px] font-bold ${
                        user?.approuve ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {user?.approuve ? '✓ Profil approuvé' : '⏳ En attente'}
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {menu.map((item) => {
                  const actif =
                    pathname === item.href ||
                    (item.href !== '/espace-professeur' &&
                      pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                        actif
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span>{item.label}</span>
                      {actif && <span className="ml-auto text-xs">●</span>}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-3 border-t border-slate-200 space-y-1">
                <a
                  href="https://wa.me/25377741482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <span className="text-lg">💬</span>
                  <span>Contacter le support</span>
                </a>
                <button
                  onClick={deconnecter}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <span className="text-lg">🚪</span>
                  <span>Déconnexion</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* BOTTOM NAVIGATION (mobile) */}
      {/* ============================================================ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-30">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {menuRapide.map((item) => {
            const actif =
              pathname === item.href ||
              (item.href !== '/espace-professeur' &&
                pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
                  actif ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {actif && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full bg-slate-900"
                  />
                )}
                <span className="text-xl">{item.emoji}</span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}