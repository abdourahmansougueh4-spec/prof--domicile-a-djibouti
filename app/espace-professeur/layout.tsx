'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const menu = [
  { href: '/espace-professeur', label: 'Tableau de bord', emoji: '📊' },
  { href: '/espace-professeur/statut', label: 'Mon statut', emoji: '🏅' },
  { href: '/espace-professeur/profil', label: 'Mon profil', emoji: '👤' },
  { href: '/espace-professeur/documents', label: 'Mes documents', emoji: '📎' },
  {
    href: '/espace-professeur/disponibilites',
    label: 'Mes disponibilités',
    emoji: '📅',
  },
  { href: '/espace-professeur/matieres', label: 'Mes matières', emoji: '📚' },
  { href: '/espace-professeur/tarifs', label: 'Mes tarifs', emoji: '💰' },
  { href: '/espace-professeur/demandes', label: 'Demandes reçues', emoji: '📥' },
  { href: '/espace-professeur/eleves', label: 'Mes élèves', emoji: '👨‍🎓' },
  { href: '/espace-professeur/apercu', label: 'Aperçu public', emoji: '👁️' },
  { href: '/espace-professeur/regles', label: 'Règles', emoji: '📖' },
  {
    href: '/espace-professeur/charte-qualite',
    label: 'Charte qualité',
    emoji: '📜',
  },
]
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

  useEffect(() => {
    const verifier = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

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

  const deconnecter = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 relative overflow-hidden">
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <nav className="relative z-20 backdrop-blur-md bg-white/70 border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-xl">🇩🇯</span>
          </Link>
          <div className="flex items-center gap-3">
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
              className="text-sm font-bold text-red-600 hover:text-red-700 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <aside className="hidden lg:block">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 border border-white/80 shadow-xl shadow-blue-900/5 sticky top-24">
              <div className="mb-4 p-3 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                    👨‍🏫
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-sm truncate">
                      {user?.nomComplet}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        user?.approuve
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {user?.approuve ? '✓ Approuvé' : '⏳ En attente'}
                    </div>
                  </div>
                </div>
              </div>

              <nav className="space-y-1">
                {menu.map((item) => {
                  const actif =
                    pathname === item.href ||
                    (item.href !== '/espace-professeur' &&
                      pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        actif
                          ? 'bg-gradient-to-r from-emerald-600 to-blue-700 text-white shadow-lg shadow-emerald-600/20'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
