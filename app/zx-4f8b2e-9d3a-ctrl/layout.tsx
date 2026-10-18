'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MenuItem = {
  href: string
  label: string
  emoji: string
  description: string
  badgeKey?: string
}

const menu: MenuItem[] = [
  { href: '/zx-4f8b2e-9d3a-ctrl', label: 'Tableau de bord', emoji: '📊', description: 'Vue d\'ensemble' },
  { href: '/zx-4f8b2e-9d3a-ctrl/statistiques', label: 'Statistiques', emoji: '📈', description: 'Analyses détaillées' },
  { href: '/zx-4f8b2e-9d3a-ctrl/utilisateurs', label: 'Utilisateurs', emoji: '🇩🇯', description: 'tous les utilisateurs' },
  { href: '/zx-4f8b2e-9d3a-ctrl/profs-liste', label: 'Professeurs', emoji: '👨‍🏫', description: 'Tous les profs' },
  { href: '/zx-4f8b2e-9d3a-ctrl/parents-liste', label: 'Parents', emoji: '👨‍👩‍👧', description: 'Tous les parents' },
  { href: '/zx-4f8b2e-9d3a-ctrl/inscription-manuelle', label: 'Inscription manuelle', emoji: '➕', description: 'Créer prof/parent' },
  { href: '/zx-4f8b2e-9d3a-ctrl/bannis', label: 'Bannis / Suspendus', emoji: '🚫', description: 'Gérer les sanctions' },
  { href: '/zx-4f8b2e-9d3a-ctrl/profs', label: 'Validation Profs', emoji: '✅', description: 'Approuver / Refuser', badgeKey: 'en_attente' },
  { href: '/zx-4f8b2e-9d3a-ctrl/documents', label: 'Documents à vérifier', emoji: '📎', description: 'Docs reçus', badgeKey: 'documents' },
  { href: '/zx-4f8b2e-9d3a-ctrl/badges', label: 'Badges & Étoiles', emoji: '🏅', description: 'Donner / Retirer' },
  { href: '/zx-4f8b2e-9d3a-ctrl/demandes-amelioration', label: 'Demandes amélioration', emoji: '📩', description: 'Valider / Refuser', badgeKey: 'demandes_amelioration' },
  { href: '/zx-4f8b2e-9d3a-ctrl/demandes', label: 'Toutes les demandes', emoji: '📥', description: 'Vue globale' },
  { href: '/zx-4f8b2e-9d3a-ctrl/demandes/en-attente', label: 'Demandes en attente', emoji: '⏳', description: 'À traiter', badgeKey: 'demandes_attente' },
  { href: '/zx-4f8b2e-9d3a-ctrl/demandes/a-valider', label: 'Pré-acceptées (à valider)', emoji: '👍', description: 'Décision admin', badgeKey: 'demandes_pre_acceptees' },
  { href: '/zx-4f8b2e-9d3a-ctrl/demandes/historique', label: 'Historique demandes', emoji: '📜', description: 'Archive' },
  { href: '/zx-4f8b2e-9d3a-ctrl/paiements-parents', label: 'Paiements parents', emoji: '💰', description: 'Suivre + Valider', badgeKey: 'paiements_attente' },
  { href: '/zx-4f8b2e-9d3a-ctrl/paiements-profs', label: 'Paiements profs', emoji: '💵', description: 'Frais plateforme' },
  { href: '/zx-4f8b2e-9d3a-ctrl/revenus', label: 'Revenus mensuels', emoji: '📊', description: 'Chiffres' },
  { href: '/zx-4f8b2e-9d3a-ctrl/tarifs', label: 'Tarifs Profs', emoji: '💵', description: 'Prix privés' },
  { href: '/zx-4f8b2e-9d3a-ctrl/signalements', label: 'Signalements', emoji: '🚨', description: 'Traiter', badgeKey: 'signalements' },
  { href: '/zx-4f8b2e-9d3a-ctrl/avis', label: 'Modération avis', emoji: '⭐', description: 'Publier / Supprimer', badgeKey: 'avis_signales' },
  { href: '/zx-4f8b2e-9d3a-ctrl/messages', label: 'Messages signalés', emoji: '💬', description: 'Surveillance chat', badgeKey: 'messages_signales' },
  { href: '/zx-4f8b2e-9d3a-ctrl/notifications', label: 'Notifications globales', emoji: '📢', description: 'Notifier tous' },
  { href: '/zx-4f8b2e-9d3a-ctrl/annonces', label: 'Annonces du site', emoji: '📰', description: 'Bannières' },
  { href: '/zx-4f8b2e-9d3a-ctrl/top-profs', label: 'Top profs', emoji: '🏆', description: 'Classements' },
  { href: '/zx-4f8b2e-9d3a-ctrl/activite', label: 'Activité', emoji: '📉', description: 'En direct' },
  { href: '/zx-4f8b2e-9d3a-ctrl/export', label: 'Export CSV', emoji: '📤', description: 'Données' },
  { href: '/zx-4f8b2e-9d3a-ctrl/parametres', label: 'Paramètres généraux', emoji: '⚙️', description: 'Config du site' },
  { href: '/zx-4f8b2e-9d3a-ctrl/contenu', label: 'Contenu du site', emoji: '📝', description: 'Modifier textes' },
  { href: '/zx-4f8b2e-9d3a-ctrl/securite', label: 'Sécurité & Logs', emoji: '🔐', description: 'Traçabilité' },
  { href: '/zx-4f8b2e-9d3a-ctrl/logs', label: 'Journal d\'activité', emoji: '📋', description: 'Historique complet' },
]

export default function AdminLayout({
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
  const [recherche, setRecherche] = useState('')
  const [compteurs, setCompteurs] = useState<{ [k: string]: number }>({})
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifOuvertes, setNotifOuvertes] = useState(false)

  const isLoginPage = pathname?.includes('/login')

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    const verifier = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/zx-4f8b2e-9d3a-ctrl/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, est_admin, nom_complet, email')
        .eq('id', authUser.id)
        .single()

      if (!profile || profile.role !== 'admin' || !profile.est_admin) {
        await supabase.auth.signOut()
        router.push('/zx-4f8b2e-9d3a-ctrl/login')
        return
      }

      setUser({
        nomComplet: profile.nom_complet || 'Admin',
        email: profile.email || authUser.email || '',
      })

      // Charger les compteurs
      await chargerCompteurs()

      // Charger les notifications
      await chargerNotifications(authUser.id)

      setLoading(false)
    }

    verifier()
  }, [router, supabase, isLoginPage])

  const chargerCompteurs = async () => {
    try {
      const [
        profsEnAttente,
        docsRecus,
        signalements,
        demandesAmelioration,
        demandesAttente,
        demandesPreAcceptees,
        paiementsAttente,
        avisSignales,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'professeur')
          .eq('approuve', false)
          .eq('banni', false),
        supabase
          .from('professeurs')
          .select('*', { count: 'exact', head: true })
          .not('bac_s_scan_url', 'is', null),
        supabase
          .from('signalements')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'nouveau'),
        supabase
          .from('demandes_amelioration')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente'),
        supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente'),
        supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'pre_acceptee'),
        supabase
          .from('paiements')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente'),
        supabase
          .from('avis')
          .select('*', { count: 'exact', head: true })
          .eq('signale', true),
      ])

      setCompteurs({
        en_attente: profsEnAttente.count || 0,
        documents: docsRecus.count || 0,
        signalements: signalements.count || 0,
        demandes_amelioration: demandesAmelioration.count || 0,
        demandes_attente: demandesAttente.count || 0,
        demandes_pre_acceptees: demandesPreAcceptees.count || 0,
        paiements_attente: paiementsAttente.count || 0,
        avis_signales: avisSignales.count || 0,
      })
    } catch (err) {
      console.error('Erreur compteurs:', err)
    }
  }

  const chargerNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('destinataire_id', userId)
      .eq('lu', false)
      .order('created_at', { ascending: false })
      .limit(10)

    setNotifications(data || [])
  }

  const marquerToutLu = async () => {
    if (!user) return
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('destinataire_id', authUser.id)
      .eq('lu', false)

    setNotifications([])
    setNotifOuvertes(false)
  }

  useEffect(() => {
    setMenuMobileOuvert(false)
    setNotifOuvertes(false)
  }, [pathname])

  const deconnecter = async () => {
    await supabase.auth.signOut()
    router.push('/zx-4f8b2e-9d3a-ctrl/login')
  }

  const getInitiales = (nom: string) => {
    return nom
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const menuFiltre = recherche
    ? menu.filter(
        (m) =>
          m.label.toLowerCase().includes(recherche.toLowerCase()) ||
          m.description.toLowerCase().includes(recherche.toLowerCase())
      )
    : menu

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Navbar */}
      <nav className="relative z-30 backdrop-blur-md bg-slate-900/70 border-b border-white/10 sticky top-0">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link
            href="/zx-4f8b2e-9d3a-ctrl"
            className="flex items-center gap-2"
          >
            <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              ⚡ Admin Panel
            </span>
            <span className="text-xl">🇩🇯</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full font-bold border border-purple-500/30 hidden md:inline">
              🔒 Espace privé
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOuvertes(!notifOuvertes)}
                className="relative w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors border border-white/10"
              >
                🔔
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOuvertes && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <div className="font-black text-white text-sm">
                        🔔 Notifications
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={marquerToutLu}
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                        >
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          Aucune notification
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.lien || '#'}
                            className="block p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <div className="font-bold text-white text-xs mb-1">
                              {n.titre}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {n.contenu}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={deconnecter}
              className="text-xs md:text-sm font-bold text-red-400 hover:text-red-300 px-3 md:px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              🚪
            </button>
            <button
              onClick={() => setMenuMobileOuvert(!menuMobileOuvert)}
              className="lg:hidden w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold"
            >
              {menuMobileOuvert ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1700px] mx-auto px-4 md:px-6 py-6">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block">
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
              {/* Profil admin */}
              <div className="p-4 border-b border-white/10">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 border-2 border-white/20">
                      {user ? getInitiales(user.nomComplet) : '👑'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-sm truncate">
                        {user?.nomComplet}
                      </div>
                      <div className="text-[10px] text-purple-300 font-bold">
                        ⚡ Accès total
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher un menu..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Menu plat */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {menuFiltre.map((item) => {
                  const actif =
                    pathname === item.href ||
                    (item.href !== '/zx-4f8b2e-9d3a-ctrl' &&
                      pathname?.startsWith(item.href))
                  const badge = item.badgeKey ? compteurs[item.badgeKey] : 0

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                        actif
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">
                        {item.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold">
                          {item.label}
                        </div>
                        <div
                          className={`truncate text-[9px] ${
                            actif ? 'text-purple-200' : 'text-slate-500'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                      {badge > 0 && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            actif
                              ? 'bg-white text-purple-600'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
                {menuFiltre.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Aucun menu trouvé
                  </div>
                )}
              </nav>

              {/* Info sécurité */}
              <div className="p-3 border-t border-white/10">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <div className="text-[10px] text-red-300 font-bold uppercase mb-1">
                    🔒 Sécurité
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Toutes vos actions sont enregistrées.
                  </p>
                </div>
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
                className="lg:hidden fixed top-20 left-4 right-4 z-40 bg-slate-800 rounded-3xl shadow-2xl border-2 border-purple-500/30 overflow-hidden"
              >
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                  <div className="mb-3 p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {user ? getInitiales(user.nomComplet) : '👑'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">
                          {user?.nomComplet}
                        </div>
                        <div className="text-[10px] text-purple-300 font-bold">
                          ⚡ Accès total
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="space-y-0.5">
                    {menu.map((item) => {
                      const actif =
                        pathname === item.href ||
                        (item.href !== '/zx-4f8b2e-9d3a-ctrl' &&
                          pathname?.startsWith(item.href))
                      const badge = item.badgeKey ? compteurs[item.badgeKey] : 0

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm ${
                            actif
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <span className="text-lg">{item.emoji}</span>
                          <div className="flex-1">
                            <div className="text-xs font-bold">
                              {item.label}
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {item.description}
                            </div>
                          </div>
                          {badge > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                              {badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="min-w-0 text-white">{children}</main>
        </div>
      </div>
    </div>
  )
}
