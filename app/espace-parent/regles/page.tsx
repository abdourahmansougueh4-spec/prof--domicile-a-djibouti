'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Regles() {
  const regles = [
    {
      emoji: '🤝',
      titre: 'Respect avant tout',
      desc: 'Traitez le prof avec respect, comme vous aimeriez qu\'on traite votre enfant. Un prof respecté donne sa meilleure version.',
      couleur: 'from-blue-500 to-blue-600',
    },
    {
      emoji: '👨‍👩‍👧',
      titre: 'Impliquez votre enfant',
      desc: 'Aidez votre enfant à suivre les consignes du prof. Un enfant discipliné progresse beaucoup plus vite.',
      couleur: 'from-emerald-500 to-emerald-600',
    },
    {
      emoji: '📅',
      titre: 'Ponctualité',
      desc: 'Prévenez le prof au moins 3h à l\'avance en cas d\'absence. Le temps du prof est précieux.',
      couleur: 'from-purple-500 to-purple-600',
    },
    {
      emoji: '💰',
      titre: 'Paiement en temps voulu',
      desc: 'Les paiements doivent être effectués avant le début des cours. Pas de paiement = pas de cours.',
      couleur: 'from-amber-500 to-amber-600',
    },
    {
      emoji: '📞',
      titre: 'Communication via la plateforme',
      desc: 'Toute la communication passe par la plateforme jusqu\'à la validation par l\'équipe.',
      couleur: 'from-pink-500 to-pink-600',
    },
    {
      emoji: '🚨',
      titre: 'Signaler les problèmes',
      desc: 'Si un problème survient, signalez-le immédiatement à l\'équipe avec preuves si possible.',
      couleur: 'from-red-500 to-red-600',
    },
    {
      emoji: '⭐',
      titre: 'Récompenser la qualité',
      desc: 'Si un prof est excellent, laissez un avis positif. C\'est gratuit et ça l\'encourage.',
      couleur: 'from-yellow-500 to-yellow-600',
    },
    {
      emoji: '🚫',
      titre: 'Pas de contournement',
      desc: 'Ne partagez pas vos coordonnées directes avec le prof avant validation. Cela protège tout le monde.',
      couleur: 'from-slate-500 to-slate-600',
    },
    {
      emoji: '🛡️',
      titre: 'Sécurité des enfants',
      desc: 'La sécurité de votre enfant est notre priorité. Ne laissez jamais un prof seul avec votre enfant sans surveillance.',
      couleur: 'from-indigo-500 to-indigo-600',
    },
    {
      emoji: '📚',
      titre: 'Objectif pédagogique',
      desc: 'Le cours à domicile ne doit pas être une simple révision. Il doit aider l\'enfant à progresser vraiment.',
      couleur: 'from-teal-500 to-teal-600',
    },
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-3">
            <span>📖</span>
            <span>À respecter</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Règles à respecter
          </h1>
          <p className="text-amber-100">
            Suivez ces règles pour une expérience optimale avec vos profs.
          </p>
        </div>
      </motion.div>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-2xl"
      >
        <p className="text-sm text-blue-900 leading-relaxed">
          💡 <strong>Notre philosophie :</strong> La réussite de votre enfant
          dépend d'une collaboration étroite entre vous, votre enfant, et le
          prof. Ensemble, nous créons les meilleures conditions
          d'apprentissage.
        </p>
      </motion.div>

      {/* Liste des règles */}
      <div className="grid md:grid-cols-2 gap-4">
        {regles.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${r.couleur} flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0`}
              >
                {r.emoji}
              </div>
              <div>
                <h3 className="font-black text-slate-900 mb-1">{r.titre}</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {r.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Message final */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-6 md:p-8 border-2 border-emerald-200 shadow-xl"
      >
        <div className="text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h3 className="text-xl font-black text-slate-900 mb-3">
            Notre engagement
          </h3>
          <p className="text-sm text-slate-700 max-w-2xl mx-auto mb-4">
            Nous nous engageons à vous fournir des profs <strong>vérifiés,
            qualifiés et respectueux</strong>. En retour, nous vous demandons de
            respecter ces règles pour que tout se passe bien.
          </p>
          <p className="text-sm text-emerald-800 font-bold">
            Ensemble, faisons réussir vos enfants ! 🇩🇯
          </p>
        </div>
      </motion.div>

      {/* CTA WhatsApp */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white text-center"
      >
        <div className="text-4xl mb-3">💬</div>
        <h3 className="text-xl font-black mb-2">
          Une question sur les règles ?
        </h3>
        <p className="text-sm text-emerald-100 mb-4">
          Notre équipe est disponible 7j/7 pour vous aider.
        </p>
        <a
          href="https://wa.me/25377741482"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-green-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors shadow-lg"
        >
          💬 Contacter l'équipe
        </a>
      </motion.div>
    </div>
  )
}