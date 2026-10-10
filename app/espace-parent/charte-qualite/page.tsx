'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CharteQualite() {
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
        className="bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-800 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-3">
            <span>📜</span>
            <span>Document officiel</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Charte Qualité
          </h1>
          <p className="text-blue-100">
            Nos engagements pour vous garantir une expérience de qualité.
          </p>
        </div>
      </motion.div>

      {/* Section 1 : Formule Simple */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            💎
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              Formule Simple
            </h2>
            <p className="text-sm text-blue-700 font-bold">
              30% du salaire mensuel du prof en avance
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            'Contact du prof débloqué immédiatement',
            'Rencontre organisée par notre équipe',
            'Garantie de remplacement si le prof ne vous plaît pas',
            'Remplacement en cas de maladie ou d\'absence du prof',
            'Satisfaction garantie ou remboursement',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section 2 : Formule Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border-2 border-amber-300 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full">
          RECOMMANDÉ
        </div>

        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            🏆
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              Formule Premium
            </h2>
            <p className="text-sm text-amber-700 font-bold">
              30% du salaire + 5 000 DJF
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            'Tout ce que la Formule Simple offre',
            'Suivi pendant les 3 premiers mois',
            'Vérification des comportements du prof',
            'Contrôle de la pédagogie',
            'Suivi des cahiers de l\'élève',
            'Rapports mensuels détaillés',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">
                ★
              </span>
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section 3 : Droits du parent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            🛡️
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Vos droits en tant que parent
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              emoji: '🆔',
              titre: 'Connaître la vraie identité du prof',
              desc: 'Le prof doit fournir une copie de sa carte d\'identité et de ses diplômes pour enseigner vos enfants.',
            },
            {
              emoji: '🚨',
              titre: 'Signaler tout problème',
              desc: 'Vous devez signaler un prof avec un comportement malsain, en donnant un motif raisonnable et des preuves si possible.',
            },
            {
              emoji: '⭐',
              titre: 'Donner votre avis',
              desc: 'Si le prof est bon, laissez un avis positif. Cela booste son profil et récompense sa qualité.',
            },
            {
              emoji: '🤝',
              titre: 'Respecter le prof',
              desc: 'Traitez le prof avec respect pour qu\'il donne sa meilleure version.',
            },
            {
              emoji: '👨‍👩‍👧',
              titre: 'Aider votre enfant à respecter le prof',
              desc: 'Comme dans un établissement scolaire, votre enfant doit écouter et suivre les consignes du prof.',
            },
            {
              emoji: '📚',
              titre: 'Comprendre le vrai rôle du prof à domicile',
              desc: 'Le travail du prof à domicile ne doit pas être seulement de refaire ce qu\'il a fait à l\'école. C\'est beaucoup plus vaste : approfondir, consolider, personnaliser.',
            },
            {
              emoji: '📊',
              titre: 'Suivre la relation prof-enfant',
              desc: 'Savoir régulièrement si votre enfant apprend, mémorise ce qui est demandé, comprend, et si le prof fait son mieux pour l\'améliorer.',
            },
          ].map((droit, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl border border-blue-100"
            >
              <div className="text-2xl flex-shrink-0">{droit.emoji}</div>
              <div>
                <div className="font-bold text-slate-900 mb-1">
                  {droit.titre}
                </div>
                <div className="text-sm text-slate-700">{droit.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section 4 : Règles strictes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-red-50 to-amber-50 rounded-3xl p-6 md:p-8 border-2 border-red-200 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Règles strictes
          </h2>
        </div>

        <div className="space-y-3">
          {[
            'Tout prof signalé avec preuves sera EXCLU définitivement de la plateforme',
            'Tout comportement malsain entraîne un bannissement immédiat',
            'Le prof est OBLIGÉ de fournir ses documents pour enseigner',
            'Le prof doit respecter les enfants et les familles',
            'Les avis abusifs peuvent entraîner des sanctions',
          ].map((regle, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">
                !
              </span>
              <span className="text-sm text-slate-800 font-medium">
                {regle}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section 5 : Non-amélioration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            💡
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            En cas de non-amélioration
          </h2>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-xl">
          <p className="text-sm text-purple-900 leading-relaxed">
            La non-amélioration ne vient <strong>toujours pas de la part du
            professeur</strong>.
            <br />
            <br />
            <strong>Aidez votre enfant à respecter et suivre les consignes de
            son prof</strong> comme dans un établissement scolaire — si ce n'est
            pas plus. Cela va aider votre enfant à être bien à l'écoute et à
            progresser plus rapidement.
          </p>
        </div>
      </motion.div>

      {/* CTA WhatsApp */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white text-center"
      >
        <div className="text-4xl mb-3">💬</div>
        <h3 className="text-xl font-black mb-2">
          Des questions sur notre charte ?
        </h3>
        <p className="text-sm text-emerald-100 mb-4">
          Contactez-nous sur WhatsApp pour toute clarification.
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