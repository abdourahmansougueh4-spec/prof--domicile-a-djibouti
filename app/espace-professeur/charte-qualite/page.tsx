'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CharteQualiteProf() {
  const engagements = [
    {
      emoji: '👨‍🏫',
      titre: 'Un enseignement de qualité',
      desc: 'Préparer chaque séance avec sérieux, s\'adapter au rythme de l\'élève, et viser la progression réelle.',
      couleur: 'from-emerald-500 to-emerald-600',
    },
    {
      emoji: '⏰',
      titre: 'Ponctualité et fiabilité',
      desc: 'Honorer les rendez-vous, prévenir en cas d\'imprévu, et respecter le temps de la famille.',
      couleur: 'from-blue-500 to-blue-600',
    },
    {
      emoji: '📊',
      titre: 'Un suivi transparent',
      desc: 'Renseigner chaque mois le progrès de l\'élève pour informer les parents et valoriser votre travail.',
      couleur: 'from-purple-500 to-purple-600',
    },
    {
      emoji: '🤝',
      titre: 'Le respect des familles',
      desc: 'Créer un climat de confiance, écouter les parents, et accompagner l\'enfant avec bienveillance.',
      couleur: 'from-amber-500 to-amber-600',
    },
    {
      emoji: '🎓',
      titre: 'Une identité vérifiée',
      desc: 'Fournir ses documents uniquement sur demande de l\'équipe ou d\'un parent, pour rassurer sans déranger.',
      couleur: 'from-pink-500 to-pink-600',
    },
    {
      emoji: '🌟',
      titre: 'Un professionnalisme constant',
      desc: 'Être un modèle pour l\'élève, représenter la plateforme avec fierté, et incarner l\'éducation.',
      couleur: 'from-indigo-500 to-indigo-600',
    },
  ]

  const droits = [
    {
      emoji: '💰',
      titre: 'Fixer ses propres tarifs',
      desc: 'Vous choisissez votre prix minimum et maximum. La négociation finale se fait avec le parent après la rencontre.',
    },
    {
      emoji: '📅',
      titre: 'Choisir ses horaires',
      desc: 'Vous définissez vos disponibilités et pouvez les modifier à tout moment depuis votre espace.',
    },
    {
      emoji: '🏅',
      titre: 'Gagner des étoiles et badges',
      desc: 'Vos efforts sont récompensés : plus vous êtes bon, plus vous montez en visibilité.',
    },
    {
      emoji: '🌍',
      titre: 'Accéder à de vraies opportunités',
      desc: 'Cette activité peut devenir votre métier principal, ou un complément. Toutes les trajectoires sont possibles.',
    },
    {
      emoji: '🛡️',
      titre: 'Être protégé',
      desc: 'L\'équipe vous accompagne, vous conseille et vous défend en cas de problème.',
    },
    {
      emoji: '📢',
      titre: 'Être valorisé',
      desc: 'Les bons profs sont mis en avant. Votre travail mérite d\'être vu.',
    },
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/espace-professeur"
        className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-80px] left-[-80px] w-56 h-56 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mb-4">
            <span>📜</span>
            <span>Document officiel</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Charte Qualité du Professeur
          </h1>
          <p className="text-purple-100 text-base leading-relaxed max-w-2xl">
            Nous croyons qu'un enseignant mérite un cadre clair, respectueux
            et valorisant. Cette charte est notre contrat moral avec vous.
          </p>
        </div>
      </motion.div>

      {/* Vos engagements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">
            ✍️
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Vos engagements
            </h2>
            <p className="text-xs text-slate-500">
              Ce que nous attendons de vous
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {engagements.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${e.couleur} flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0`}
                >
                  {e.emoji}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 mb-1">
                    {e.titre}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {e.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Vos droits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-3xl p-6 md:p-8 border-2 border-blue-200 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xl shadow-lg">
            🛡️
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Vos droits</h2>
            <p className="text-xs text-slate-500">
              Ce que nous vous garantissons
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {droits.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + i * 0.05 }}
              className="bg-white rounded-2xl p-5 border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{d.emoji}</div>
                <div>
                  <h3 className="font-black text-slate-900 mb-1">
                    {d.titre}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Engagement de la plateforme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0 border border-white/30">
              🤝
            </div>
            <div>
              <h2 className="text-2xl font-black mb-2">
                Notre engagement envers vous
              </h2>
              <p className="text-emerald-100 text-sm md:text-base leading-relaxed mb-4">
                Nous nous engageons à vous offrir un cadre professionnel,
                respectueux et valorisant. Nous croyons en votre travail et
                nous ferons tout pour le mettre en valeur.
              </p>

              <div className="space-y-3">
                {[
                  'Nous vous trouvons des élèves sérieux et motivés',
                  'Nous vous protégeons en cas de problème',
                  'Nous mettons en avant vos réussites',
                  'Nous vous accompagnons dans vos démarches',
                  'Nous vous récompensons pour votre excellence',
                  'Nous vous ouvrons des portes au-delà de Djibouti',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-black flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-sm font-medium leading-relaxed">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Citation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border-2 border-amber-200 shadow-xl"
      >
        <div className="text-center">
          <div className="text-5xl mb-3">💡</div>
          <p className="text-lg md:text-xl text-slate-800 italic font-medium leading-relaxed max-w-3xl mx-auto">
            « Un professeur à domicile n'est pas un simple répétiteur. C'est
            un guide qui aide l'élève à croire en lui, un exemple qui inspire
            la rigueur, un accompagnateur qui ouvre des portes. »
          </p>
          <div className="mt-4 text-sm font-black text-amber-700">
            — Notre vision
          </div>
        </div>
      </motion.div>

      {/* CTA WhatsApp */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white text-center"
      >
        <div className="text-4xl mb-3">💬</div>
        <h3 className="text-xl font-black mb-2">
          Des questions sur la charte ?
        </h3>
        <p className="text-sm text-emerald-100 mb-4">
          Notre équipe est disponible pour vous accompagner.
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