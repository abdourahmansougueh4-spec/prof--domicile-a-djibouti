'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const menu = [
  {
    href: '/espace-parent',
    label: 'Tableau de bord',
    emoji: '📊',
    description: 'Vue d\'ensemble',
  },
  {
    href: '/espace-parent/enfants',
    label: 'Mes enfants',
    emoji: '👨‍👩‍👧',
    description: 'Gérer les profils enfants',
  },
  {
    href: '/espace-parent/profs',
    label: 'Tous les profs',
    emoji: '🌐',
    description: 'Voir tous les professeurs',
  },
  {
    href: '/espace-parent/recherche',
    label: 'Recherche avancée',
    emoji: '🔍',
    description: 'Filtrer les professeurs',
  },
  {
    href: '/espace-parent/demandes',
    label: 'Mes demandes',
    emoji: '📤',
    description: 'Suivi des demandes envoyées',
  },
  {
    href: '/espace-parent/mes-profs',
    label: 'Mes profs',
    emoji: '👨‍🏫',
    description: 'Profs acceptés',
  },
  {
    href: '/espace-parent/avis',
    label: 'Mes avis',
    emoji: '⭐',
    description: 'Laisser un avis',
  },
  {
    href: '/espace-parent/signaler',
    label: 'Signaler un prof',
    emoji: '🚨',
    description: 'Signaler un problème',
  },
  {
    href: '/espace-parent/charte-qualite',
    label: 'Charte qualité',
    emoji: '📜',
    description: 'Nos engagements',
  },
  {
    href: '/espace-parent/regles',
    label: 'Règles',
    emoji: '📖',
    description: 'Règles à respecter',
  },
  {
    href: '/espace-parent/profil',
    label: 'Mon profil',
    emoji: '👤',
    description: 'Mes informations',
  },
]

export default function EspaceParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{
    nomComplet: string
    email: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false)

  useEffect(() => {
    const verifier = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, nom_complet, email')
        .eq('id', authUser.id)
        .single()

      if (!profile || profile.role !== 'parent') {
        router.push('/login')
        return
      }

      setUser({
        nomComplet: profile.nom_complet,
        email: profile.email || authUser.email || '',
      })
      setLoading(false)
    }

    verifier()
  }, [router, supabase])

  // Fermer menu mobile au changement de page
  useEffect(() => {
    setMenuMobileOuvert(false)
  }, [pathname])

  const deconnecter = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getInitiales = (nom: string) => {
    return nom
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Navbar */}
      <nav className="relative z-30 backdrop-blur-md bg-white/70 border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-xl">🇩🇯</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors hidden md:inline"
            >
              💬 Aide
            </a>
            <button
              onClick={deconnecter}
              className="text-xs md:text-sm font-bold text-red-600 hover:text-red-700 px-3 md:px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              🚪 Déconnexion
            </button>
            {/* Bouton menu mobile */}
            <button
              onClick={() => setMenuMobileOuvert(!menuMobileOuvert)}
              className="lg:hidden w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold"
            >
              {menuMobileOuvert ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 border border-white/80 shadow-xl shadow-blue-900/5 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* Profil user */}
              <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                    {user ? getInitiales(user.nomComplet) : '👤'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-sm truncate">
                      {user?.nomComplet}
                    </div>
                    <div className="text-[10px] text-blue-700 font-bold">
                      ✓ Parent vérifié
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <nav className="space-y-1">
                {menu.map((item) => {
                  const actif =
                    pathname === item.href ||
                    (item.href !== '/espace-parent' &&
                      pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                        actif
                          ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">
                        {item.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{item.label}</div>
                      </div>
                      {actif && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Info WhatsApp */}
              <div className="mt-4 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="text-xs text-green-800 font-bold mb-2">
                  💬 Besoin d'aide ?
                </div>
                <a
                  href="https://wa.me/25377741482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                >
                  Contacter l'admin
                </a>
              </div>
            </div>
          </aside>

          {/* Menu mobile */}
          <AnimatePresence>
            {menuMobileOuvert && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden fixed top-20 left-4 right-4 z-40 bg-white rounded-3xl shadow-2xl border-2 border-blue-200 overflow-hidden"
              >
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {user ? getInitiales(user.nomComplet) : '👤'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 text-sm truncate">
                          {user?.nomComplet}
                        </div>
                        <div className="text-[10px] text-blue-700 font-bold">
                          ✓ Parent
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="space-y-1">
                    {menu.map((item) => {
                      const actif =
                        pathname === item.href ||
                        (item.href !== '/espace-parent' &&
                          pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all ${
                            actif
                              ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-lg">{item.emoji}</span>
                          <div>
                            <div>{item.label}</div>
                            <div
                              className={`text-[10px] ${
                                actif ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}