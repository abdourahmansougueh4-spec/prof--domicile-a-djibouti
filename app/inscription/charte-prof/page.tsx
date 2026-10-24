'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import Link from 'next/link'

// ==========================================
// ANIMATIONS (FIX TYPESCRIPT)
// ==========================================
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
}

const faqs = [
  {
    q: "Est-ce que je paie vraiment 30% chaque mois ?",
    a: "Non. C'est une erreur commune. Vous reversez 30% de votre PREMIER salaire mensuel à la plateforme pour votre intégration (recherche d'élèves, vérification, publicité). Dès le deuxième mois, vous gardez 100% de vos revenus. Nous ne prenons aucune commission perpétuelle sur votre travail."
  },
  {
    q: "En quoi consiste le test pratique si je suis étudiant ?",
    a: "Nous vérifions vos documents universitaires. Ensuite, nous vous demandons de faire une démonstration pédagogique (expliquer un concept simple). Nous nous assurons que vous savez transmettre votre savoir, pas seulement le réciter."
  },
  {
    q: "Comment se passe le test pour le Coran ou les Langues ?",
    a: "C'est un test en présentiel. Pour le Coran, notre administration et des savants vérifient votre lecture, votre mémorisation et votre Tajwid. Pour les langues, nous testons votre fluidité et votre capacité à enseigner."
  },
  {
    q: "Qu'est-ce que le Badge Académique ?",
    a: "C'est une distinction réservée aux professeurs exerçant en collège ou lycée. Nous visitons leur établissement et interrogeons leurs élèves pour vérifier leur réputation. C'est un gage de confiance absolu pour les parents."
  },
  {
    q: "Puis-je refuser un élève ?",
    a: "Oui. Vous êtes un professionnel indépendant. Si le courant ne passe pas ou si les conditions ne sont pas réunies, vous pouvez refuser la mission. Votre tranquillité d'esprit est essentielle."
  }
]

export default function CharteQualiteProf() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-hidden font-sans selection:bg-emerald-900 selection:text-white">
      
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-emerald-50/60 to-transparent -z-10" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/30 rounded-full blur-[150px] -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-50/50 rounded-full blur-[120px] -z-10 -translate-x-1/2" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-8 relative z-50">
        <Link href="/inscription" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md">
          <span>←</span> Retour à l'inscription
        </Link>
      </motion.div>

      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-widest mb-10 shadow-sm">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse" />
              Document Exécutoire · Édition 2024
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-10">
              L'Excellence <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-500">
                Mérite le Respect.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-4xl mx-auto mb-12">
              Nous ne recrutons pas des répétiteurs. Nous sélectionnons l'élite des professeurs à domicile à Djibouti. Ce document est notre engagement mutuel pour protéger votre carrière et garantir votre succès.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/inscription/professeur" className="px-10 py-5 bg-slate-950 text-white font-black rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-2xl w-full sm:w-auto text-center text-lg">
                J'accepte le pacte
              </Link>
              <a href="#modele" className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all w-full sm:w-auto text-center text-lg">
                Voir ma rémunération ↓
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="modele" className="py-24 bg-white border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Votre Rémunération.</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">Nous détestons les plateformes qui prennent une commission à vie. Voici notre modèle : un investissement unique pour rejoindre l'élite, puis 100% pour vous.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative group flex">
              <div className="relative w-full bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-sm group-hover:shadow-xl transition-all duration-300 flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl shadow-inner mb-6">🤝</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Frais d'Intégration</h3>
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-6">Une seule fois</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-black text-slate-900">30%</span>
                  <span className="text-sm font-bold text-slate-500">du 1er salaire</span>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">Ce montant couvre la vérification de vos documents, vos tests pratiques, la création de votre profil, la publicité pour vous trouver des élèves et la garantie de paiement.</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative group flex">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-500" />
              <div className="relative w-full bg-slate-950 rounded-[2.5rem] p-8 md:p-12 border border-slate-800 shadow-2xl flex flex-col justify-center items-center text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute top-6 right-6 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Votre Carrière</div>
                <div className="relative z-10 w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl shadow-inner border border-emerald-500/30 mb-6">💎</div>
                <h3 className="relative z-10 text-2xl font-black text-white mb-2">Revenus Mensuels</h3>
                <p className="relative z-10 text-xs font-black text-emerald-400 uppercase tracking-wider mb-6">À partir du 2ème mois</p>
                <div className="relative z-10 flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-black text-white">100%</span>
                  <span className="text-sm font-bold text-slate-400">pour vous</span>
                </div>
                <p className="relative z-10 text-sm text-slate-300 font-medium leading-relaxed">Zéro commission cachée. La relation financière vous appartient totalement. Vous négociez vos tarifs en direct avec les parents et vous encaissez l'intégralité de votre salaire.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Le Protocole de Sélection.</h2>
            <p className="text-lg text-slate-600 font-medium">Pour mériter la confiance des parents, vous devez passer nos tests. C'est ce qui fait notre valeur.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Audit d\'Identité', desc: 'Vérification de la carte d\'identité nationale (CIN) et du casier judiciaire.', icon: '🆔' },
              { step: '02', title: 'Test Académique', desc: 'Pour les étudiants : vérification des documents et test pratique pour évaluer votre pédagogie.', icon: '🎓' },
              { step: '03', title: 'Test Pratique', desc: 'Pour le Coran : test en présentiel (lecture, mémorisation, Tajwid) par des savants. Idem pour les langues.', icon: '🎙️' },
              { step: '04', title: 'Enquête de Terrain', desc: 'Pour les profs académiques : visite de votre lieu d\'exercice et enquête auprès de vos élèves.', icon: '🏫' }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform">{item.step}</div>
                <div className="text-4xl mb-6 mt-4">{item.icon}</div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{item.title}</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Vos Badges d'Excellence.</h2>
            <p className="text-lg text-slate-400 font-medium">Votre travail mérite d'être reconnu. Plus vous êtes bon, plus vous brillez aux yeux des parents.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏅', title: 'Badge Pionnier', desc: 'Décerné aux premiers professeurs qui ont rejoint l\'aventure. Vous faites partie des fondateurs de l\'élite.', color: 'from-amber-400 to-amber-600', textColor: 'text-amber-400' },
              { icon: '🏫', title: 'Badge Académique', desc: 'Réservé aux professeurs exerçant en collège ou lycée. Votre réputation a été validée sur le terrain.', color: 'from-blue-400 to-blue-600', textColor: 'text-blue-400' },
              { icon: '🌟', title: 'Badge Super Prof', desc: 'L\'élite absolue. Attribué aux professeurs ayant les meilleurs retours, une ponctualité irréprochable et des résultats.', color: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-400' }
            ].map((badge, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-4xl shadow-lg mb-6 group-hover:scale-110 transition-transform`}>{badge.icon}</div>
                <h4 className={`text-xl font-black mb-3 ${badge.textColor}`}>{badge.title}</h4>
                <p className="text-slate-300 font-medium leading-relaxed text-sm">{badge.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">La Déclaration de vos Droits.</h2>
            <p className="text-lg text-slate-600 font-medium">Vous n'êtes pas nos employés, vous êtes nos partenaires. Voici ce que nous vous garantissons.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '💰', title: 'Liberté Tarifaire', desc: 'Vous fixez vos propres prix. Nous ne nous mêlons pas de votre négociation avec le parent.' },
              { icon: '📅', title: 'Maître du Temps', desc: 'Vous choisissez vos horaires et modifiez vos disponibilités à tout moment depuis votre espace.' },
              { icon: '🛡️', title: 'Protection Légale', desc: 'En cas de conflit avec un parent, notre équipe intervient comme médiateur impartial.' },
              { icon: '📢', title: 'Valorisation', desc: 'Nous mettons en avant vos réussites. Les meilleurs professeurs sont proposés en priorité aux parents.' },
              { icon: '🚫', title: 'Droit de Refus', desc: 'Si un élève ou un parent ne vous convient pas, vous pouvez refuser la mission sans justification.' },
              { icon: '🔒', title: 'Paiement Sécurisé', desc: 'Nous vous conseillons et vous accompagnons pour garantir que vous serez toujours payé à temps.' }
            ].map((droit, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-6 bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">{droit.icon}</div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{droit.title}</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{droit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 relative border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Questions Fréquentes.</h2>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
                  <span className={`text-slate-400 transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>▼</span>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="px-6 pb-6 text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Prêt à rejoindre l'élite ?</h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium">Ne laissez plus votre talent au hasard. Rejoignez le réseau des professeurs d'élite de Djibouti.</p>
            <Link href="/inscription/professeur" className="inline-flex items-center justify-center gap-4 w-full md:w-auto px-12 py-6 rounded-2xl font-black text-white bg-slate-950 hover:bg-slate-800 shadow-2xl transition-all hover:-translate-y-1 text-xl group">
              J'accepte le Pacte et je postule
              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  )
}