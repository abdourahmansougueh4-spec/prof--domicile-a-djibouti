'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ReglesProfesseur() {
  const valeurs = [
    {
      emoji: '🎯',
      titre: 'Excellence pédagogique',
      desc: 'Préparez chaque séance avec soin. Votre objectif : que chaque élève progresse, comprenne et gagne en confiance.',
      couleur: 'from-emerald-500 to-emerald-600',
    },
    {
      emoji: '⏰',
      titre: 'Ponctualité et fiabilité',
      desc: 'Vous êtes un repère pour l\'élève et sa famille. Honorez vos engagements et prévenez en cas d\'imprévu.',
      couleur: 'from-blue-500 to-blue-600',
    },
    {
      emoji: '🤝',
      titre: 'Respect et bienveillance',
      desc: 'Créez un climat de confiance avec l\'élève et sa famille. Le respect mutuel est la base d\'un bon apprentissage.',
      couleur: 'from-purple-500 to-purple-600',
    },
    {
      emoji: '📊',
      titre: 'Suivi et communication',
      desc: 'Renseignez le suivi mensuel de chaque élève. C\'est ce qui permet aux parents de voir les progrès et à vous de valoriser votre travail.',
      couleur: 'from-amber-500 to-amber-600',
    },
    {
      emoji: '📎',
      titre: 'Transparence',
      desc: 'Fournissez vos documents (diplômes, identité) uniquement lorsqu\'ils vous sont demandés par l\'équipe ou par un parent.',
      couleur: 'from-pink-500 to-pink-600',
    },
    {
      emoji: '🌟',
      titre: 'Professionnalisme',
      desc: 'Adoptez une posture professionnelle à chaque instant. Vous représentez la plateforme et surtout, vous représentez l\'éducation.',
      couleur: 'from-indigo-500 to-indigo-600',
    },
  ]

  const engagements = [
    'Offrir un enseignement de qualité, adapté au rythme de chaque élève',
    'Respecter l\'élève, sa famille et les valeurs de la plateforme',
    'Effectuer le suivi mensuel pour chaque élève',
    'Communiquer avec l\'équipe en cas de difficulté ou de question',
    'Prévenir en cas d\'absence ou de retard',
    'Représenter avec fierté la communauté Prof À Domicile Djibouti',
  ]

  const temoignages = [
    {
      emoji: '🌍',
      texte: 'Certains professeurs ont découvert cette activité et en ont fait leur métier principal.',
      auteur: 'Ils ont changé de vie',
      couleur: 'from-blue-500 to-indigo-600',
    },
    {
      emoji: '🏆',
      texte: 'Un bon professeur à domicile peut gagner plus qu\'un emploi classique, avec plus de liberté.',
      auteur: 'Vos horaires, votre rythme',
      couleur: 'from-amber-500 to-orange-600',
    },
    {
      emoji: '🚀',
      texte: 'Cette activité ouvre des portes, même en dehors de Djibouti. Vos compétences sont précieuses partout.',
      auteur: 'Un avenir sans frontières',
      couleur: 'from-emerald-500 to-teal-600',
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
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
            <span>✨</span>
            <span>Notre philosophie</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Les valeurs qui nous rassemblent
          </h1>
          <p className="text-emerald-100 text-base leading-relaxed max-w-2xl">
            Nous croyons qu'un professeur à domicile n'est pas seulement un
            répétiteur. C'est un guide, un modèle, un accompagnateur qui aide
            chaque enfant à révéler son potentiel.
          </p>
        </div>
      </motion.div>

      {/* Valeurs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
            🌟
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Nos 6 valeurs fondamentales
            </h2>
            <p className="text-xs text-slate-500">
              Ce qui fait la différence sur Prof À Domicile Djibouti
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {valeurs.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${v.couleur} flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0`}
                >
                  {v.emoji}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 mb-1">
                    {v.titre}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ⭐ NOUVELLE SECTION : ACCOMPAGNEMENT & OPPORTUNITÉS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0 border border-white/30">
              🚀
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                <span>💫</span>
                <span>Opportunité</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">
                Un accompagnement qui peut changer votre vie
              </h2>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed max-w-3xl">
                Être professeur à domicile sur notre plateforme, c'est bien
                plus qu'un simple travail. C'est une opportunité de
                construire quelque chose de grand, à votre rythme, avec des
                portes qui s'ouvrent bien au-delà de ce que vous imaginez.
              </p>
            </div>
          </div>

          {/* Témoignages inspirants */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {temoignages.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className="text-4xl mb-3">{t.emoji}</div>
                <p className="text-sm text-white leading-relaxed mb-3 italic">
                  « {t.texte} »
                </p>
                <div
                  className={`inline-block px-3 py-1 bg-gradient-to-r ${t.couleur} rounded-full text-[10px] font-black`}
                >
                  {t.auteur}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Message fort */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">💎</div>
              <div>
                <h3 className="font-black text-lg mb-2">
                  Vous êtes libre de choisir votre rythme
                </h3>
                <p className="text-sm text-indigo-100 leading-relaxed mb-3">
                  Vous pouvez exercer cette activité{' '}
                  <strong className="text-white">à temps plein</strong>,{' '}
                  <strong className="text-white">à temps partiel</strong>, ou
                  même en{' '}
                  <strong className="text-white">complément</strong> d'un
                  autre emploi. C'est vous qui décidez de la place que cette
                  activité prend dans votre vie.
                </p>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Certains professeurs ont découvert cette voie et en ont fait
                  leur métier principal. D'autres l'ont utilisée pour
                  financer leurs études, préparer un projet, ou simplement
                  gagner en liberté. <strong className="text-white">Toutes les
                  trajectoires sont possibles.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Citation inspirante */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-3xl p-6 md:p-8 border-2 border-blue-200 shadow-xl"
      >
        <div className="text-center">
          <div className="text-5xl mb-3">💡</div>
          <p className="text-lg md:text-xl text-slate-800 italic font-medium leading-relaxed max-w-3xl mx-auto">
            « Un bon professeur ne se contente pas d'enseigner. Il inspire,
            il écoute, il révèle. Il fait grandir l'élève et, souvent, il
            grandit lui-même en retour. »
          </p>
          <div className="mt-4 text-sm font-black text-emerald-700">
            — Équipe Prof À Domicile Djibouti 🇩🇯
          </div>
        </div>
      </motion.div>

      {/* Frais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border-2 border-amber-200 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            💰
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-1">
              Frais de plateforme
            </h2>
            <p className="text-sm text-slate-600">
              Pour maintenir votre profil visible et recevoir des demandes
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 border-2 border-emerald-200 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">
              OFFERT
            </div>
            <div className="text-[10px] text-emerald-700 font-black uppercase mb-1">
              🏆 Pionnier
            </div>
            <div className="text-2xl font-black text-emerald-600">
              GRATUIT
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Pour les 50 premiers inscrits
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-amber-200">
            <div className="text-[10px] text-amber-700 font-black uppercase mb-1">
              👨‍🏫 Enseignant
            </div>
            <div className="text-2xl font-black text-slate-900">
              1 500 DJF
            </div>
            <div className="text-xs text-slate-600 mt-1">par mois</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border-2 border-purple-200">
            <div className="text-[10px] text-purple-700 font-black uppercase mb-1">
              🎓 Étudiant
            </div>
            <div className="text-2xl font-black text-slate-900">500 DJF</div>
            <div className="text-xs text-slate-600 mt-1">par mois</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">📱</span>
            <div>
              <div className="text-xs text-slate-600 font-bold uppercase mb-1">
                Paiement via Waafi
              </div>
              <div className="font-black text-slate-900 text-xl">
                +253 77 74 14 82
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Envoyez le montant correspondant à votre formule, accompagné
            d'une capture d'écran, à l'équipe sur WhatsApp. Votre profil
            sera immédiatement mis à jour.
          </p>
        </div>
      </motion.div>

      {/* Engagement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-6 md:p-8 border-2 border-emerald-200 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            ✍️
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Notre engagement mutuel
            </h2>
            <p className="text-sm text-slate-600">
              En rejoignant Prof À Domicile Djibouti, vous vous engagez à :
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {engagements.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.05 }}
              className="flex items-start gap-3 bg-white rounded-xl p-4 border border-emerald-100"
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                ✓
              </span>
              <span className="text-sm text-slate-800 font-medium leading-relaxed">
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA WhatsApp */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white text-center"
      >
        <div className="text-4xl mb-3">💬</div>
        <h3 className="text-xl font-black mb-2">
          Prêt à écrire votre propre histoire ?
        </h3>
        <p className="text-sm text-emerald-100 mb-4">
          Notre équipe est disponible pour vous accompagner à chaque étape de
          votre parcours.
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