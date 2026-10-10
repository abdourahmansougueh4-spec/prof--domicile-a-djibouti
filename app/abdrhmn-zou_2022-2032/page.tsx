'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Stats = {
  totalParents: number
  totalProfs: number
  profsEnAttente: number
  profsApprouves: number
  totalDemandes: number
  demandesEnAttente: number
  demandesPreAcceptees: number
  totalPaiements: number
  paiementsEnAttente: number
  signalements: number
  avisSignales: number
  revenusMois: number
}

type Activite = {
  id: string
  type: string
  titre: string
  description: string
  date: string
  emoji: string
  couleur: string
}

export default function AdminDashboard() {
  const supabase = createClient()

  const [stats, setStats] = useState<Stats>({
    totalParents: 0,
    totalProfs: 0,
    profsEnAttente: 0,
    profsApprouves: 0,
    totalDemandes: 0,
    demandesEnAttente: 0,
    demandesPreAcceptees: 0,
    totalPaiements: 0,
    paiementsEnAttente: 0,
    signalements: 0,
    avisSignales: 0,
    revenusMois: 0,
  })
  const [activites, setActivites] = useState<Activite[]>([])
  const [loading, setLoading] = useState(true)
  const [dateJour, setDateJour] = useState('')

  useEffect(() => {
    // Date du jour formatée
    setDateJour(
      new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    )
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const [
        parentsRes,
        profsRes,
        profsEnAttenteRes,
        profsApprouvesRes,
        demandesRes,
        demandesEnAttenteRes,
        demandesPreAccepteesRes,
        paiementsRes,
        paiementsEnAttenteRes,
        signalementsRes,
        avisRes,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'parent')
          .eq('banni', false),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'professeur')
          .eq('banni', false),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'professeur')
          .eq('approuve', false)
          .eq('banni', false),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'professeur')
          .eq('approuve', true)
          .eq('banni', false),
        supabase.from('demandes').select('*', { count: 'exact', head: true }),
        supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente'),
        supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'pre_acceptee'),
        supabase.from('paiements').select('*', { count: 'exact', head: true }),
        supabase
          .from('paiements')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente'),
        supabase
          .from('signalements')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'nouveau'),
        supabase
          .from('avis')
          .select('*', { count: 'exact', head: true })
          .eq('signale', true),
      ])

      // Calcul revenus du mois
      const debutMois = new Date()
      debutMois.setDate(1)
      debutMois.setHours(0, 0, 0, 0)

      const { data: paiementsValides } = await supabase
        .from('paiements')
        .select('montant')
        .eq('statut', 'valide')
        .gte('created_at', debutMois.toISOString())

      const revenusMois = (paiementsValides || []).reduce(
        (acc, p) => acc + (Number(p.montant) || 0),
        0
      )

      setStats({
        totalParents: parentsRes.count || 0,
        totalProfs: profsRes.count || 0,
        profsEnAttente: profsEnAttenteRes.count || 0,
        profsApprouves: profsApprouvesRes.count || 0,
        totalDemandes: demandesRes.count || 0,
        demandesEnAttente: demandesEnAttenteRes.count || 0,
        demandesPreAcceptees: demandesPreAccepteesRes.count || 0,
        totalPaiements: paiementsRes.count || 0,
        paiementsEnAttente: paiementsEnAttenteRes.count || 0,
        signalements: signalementsRes.count || 0,
        avisSignales: avisRes.count || 0,
        revenusMois,
      })

      // Charger les activités récentes (5 dernières demandes)
      const { data: demandesRecentes } = await supabase
        .from('demandes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      const activitesFormatees: Activite[] = []

      for (const d of demandesRecentes || []) {
        const { data: parent } = await supabase
          .from('profiles')
          .select('nom_complet')
          .eq('id', d.parent_id)
          .single()

        const { data: prof } = await supabase
          .from('profiles')
          .select('nom_complet')
          .eq('id', d.professeur_id)
          .single()

        activitesFormatees.push({
          id: d.id,
          type: 'demande',
          titre: `Nouvelle demande : ${parent?.nom_complet || 'Parent'}`,
          description: `Vers ${prof?.nom_complet || 'Prof'}`,
          date: d.created_at,
          emoji: '📥',
          couleur: 'from-blue-500 to-indigo-600',
        })
      }

      setActivites(activitesFormatees)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const formaterDate = (date: string) => {
    const d = new Date(date)
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffJ = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'À l\'instant'
    if (diffMin < 60) return `Il y a ${diffMin} min`
    if (diffH < 24) return `Il y a ${diffH}h`
    if (diffJ < 7) return `Il y a ${diffJ}j`
    return d.toLocaleDateString('fr-FR')
  }

  const statsPrincipales = [
    {
      label: 'Parents inscrits',
      valeur: stats.totalParents,
      emoji: '👨‍👩‍👧',
      couleur: 'from-blue-500 to-blue-600',
      href: '/abdrhmn-zou_2022-2032/parents-liste',
    },
    {
      label: 'Professeurs',
      valeur: stats.totalProfs,
      emoji: '👨‍🏫',
      couleur: 'from-emerald-500 to-emerald-600',
      href: '/abdrhmn-zou_2022-2032/profs-liste',
    },
    {
      label: 'Demandes totales',
      valeur: stats.totalDemandes,
      emoji: '📥',
      couleur: 'from-purple-500 to-purple-600',
      href: '/abdrhmn-zou_2022-2032/demandes',
    },
    {
      label: 'Revenus du mois',
      valeur: `${stats.revenusMois.toLocaleString()} DJF`,
      emoji: '💰',
      couleur: 'from-amber-500 to-orange-600',
      href: '/abdrhmn-zou_2022-2032/revenus',
    },
  ]

  const statsSecondaires = [
    {
      label: 'Profs en attente',
      valeur: stats.profsEnAttente,
      emoji: '⏳',
      couleur: 'from-amber-500 to-orange-600',
      href: '/abdrhmn-zou_2022-2032/profs',
      urgent: stats.profsEnAttente > 0,
    },
    {
      label: 'Demandes en attente',
      valeur: stats.demandesEnAttente,
      emoji: '📥',
      couleur: 'from-blue-500 to-indigo-600',
      href: '/abdrhmn-zou_2022-2032/demandes/en-attente',
      urgent: stats.demandesEnAttente > 0,
    },
    {
      label: 'Pré-acceptées à valider',
      valeur: stats.demandesPreAcceptees,
      emoji: '👍',
      couleur: 'from-teal-500 to-emerald-600',
      href: '/abdrhmn-zou_2022-2032/demandes/a-valider',
      urgent: stats.demandesPreAcceptees > 0,
    },
    {
      label: 'Paiements en attente',
      valeur: stats.paiementsEnAttente,
      emoji: '💳',
      couleur: 'from-pink-500 to-rose-600',
      href: '/abdrhmn-zou_2022-2032/paiements-parents',
      urgent: stats.paiementsEnAttente > 0,
    },
    {
      label: 'Signalements',
      valeur: stats.signalements,
      emoji: '🚨',
      couleur: 'from-red-500 to-red-600',
      href: '/abdrhmn-zou_2022-2032/signalements',
      urgent: stats.signalements > 0,
    },
    {
      label: 'Avis signalés',
      valeur: stats.avisSignales,
      emoji: '⚠️',
      couleur: 'from-orange-500 to-red-600',
      href: '/abdrhmn-zou_2022-2032/avis',
      urgent: stats.avisSignales > 0,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const totalUrgences =
    stats.profsEnAttente +
    stats.demandesEnAttente +
    stats.demandesPreAcceptees +
    stats.paiementsEnAttente +
    stats.signalements +
    stats.avisSignales

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mb-3">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>En direct</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Tableau de bord 👑
          </h1>
          <p className="text-purple-100 text-sm capitalize">
            {dateJour}
          </p>

          {totalUrgences > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 bg-red-500/20 backdrop-blur-sm border-2 border-red-400/40 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">🚨</span>
                <div>
                  <div className="font-black text-lg">
                    {totalUrgences} action{totalUrgences > 1 ? 's' : ''} requise
                    {totalUrgences > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-red-100">
                    Des éléments attendent votre validation
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsPrincipales.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
          >
            <Link href={s.href}>
              <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/10 hover:border-purple-500/50 hover:-translate-y-1 transition-all shadow-lg">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${s.couleur} flex items-center justify-center text-white text-xl md:text-2xl shadow-lg mb-3`}
                >
                  {s.emoji}
                </div>
                <div className="text-xl md:text-2xl font-black text-white mb-1">
                  {s.valeur}
                </div>
                <div className="text-[10px] md:text-xs text-slate-400 font-medium">
                  {s.label}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Actions urgentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">⚡</span>
          <h2 className="text-xl font-black text-white">
            Actions prioritaires
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsSecondaires.map((s) => (
            <Link key={s.label} href={s.href}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                  s.urgent
                    ? 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {s.urgent && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
                <div className="text-2xl mb-2">{s.emoji}</div>
                <div
                  className={`text-2xl font-black mb-1 ${
                    s.urgent ? 'text-red-300' : 'text-white'
                  }`}
                >
                  {s.valeur}
                </div>
                <div className="text-[10px] text-slate-400 font-bold leading-tight">
                  {s.label}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">🚀</span>
          <h2 className="text-xl font-black text-white">Actions rapides</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              href: '/abdrhmn-zou_2022-2032/profs',
              label: 'Valider un prof',
              emoji: '✅',
              couleur: 'from-emerald-500 to-teal-600',
            },
            {
              href: '/abdrhmn-zou_2022-2032/inscription-manuelle',
              label: 'Créer un compte',
              emoji: '➕',
              couleur: 'from-blue-500 to-indigo-600',
            },
            {
              href: '/abdrhmn-zou_2022-2032/demandes/a-valider',
              label: 'Valider une demande',
              emoji: '📥',
              couleur: 'from-purple-500 to-pink-600',
            },
            {
              href: '/abdrhmn-zou_2022-2032/notifications',
              label: 'Envoyer une notif',
              emoji: '📢',
              couleur: 'from-amber-500 to-orange-600',
            },
            {
              href: '/abdrhmn-zou_2022-2032/badges',
              label: 'Donner un badge',
              emoji: '🏅',
              couleur: 'from-yellow-500 to-amber-600',
            },
            {
              href: '/abdrhmn-zou_2022-2032/paiements-parents',
              label: 'Valider paiement',
              emoji: '💰',
              couleur: 'from-pink-500 to-rose-600',
            },
            {
              href: '/abdrhmn-zou_2022-2032/signalements',
              label: 'Voir signalements',
              emoji: '🚨',
              couleur: 'from-red-500 to-red-600',
            },
            {
              href: '/abdrhmn-zou_2022-2032/statistiques',
              label: 'Voir statistiques',
              emoji: '📈',
              couleur: 'from-cyan-500 to-blue-600',
            },
          ].map((a, i) => (
            <Link key={a.href} href={a.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.04 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border-2 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.couleur} flex items-center justify-center text-white text-lg shadow-lg flex-shrink-0`}
                >
                  {a.emoji}
                </div>
                <span className="font-bold text-white text-xs">
                  {a.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Activités récentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <h2 className="text-xl font-black text-white">
              Activité récente
            </h2>
          </div>
          <Link
            href="/abdrhmn-zou_2022-2032/activite"
            className="text-xs font-bold text-purple-400 hover:text-purple-300"
          >
            Voir tout →
          </Link>
        </div>

        {activites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">
              Aucune activité pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activites.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.couleur} flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0`}
                >
                  {a.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">
                    {a.titre}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {a.description}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold flex-shrink-0">
                  {formaterDate(a.date)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Info sécurité */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-red-500/10 border-l-4 border-red-500 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-bold text-red-200 mb-1">
              Sécurité & Confidentialité
            </p>
            <p className="text-xs text-red-100/80 leading-relaxed">
              Toutes vos actions dans ce panel sont enregistrées dans le
              journal d'activité. Les données des utilisateurs sont
              protégées par chiffrement SSL.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}