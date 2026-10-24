'use client'

import { motion, Variants } from 'framer-motion'
import Link from 'next/link'

// ==========================================
// ANIMATIONS (FIX TYPESCRIPT)
// ==========================================
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
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

const regles = [
  { num: '01', titre: 'L\'Excellence Pédagogique', desc: 'La préparation est la clé. Arrivez toujours avec un plan de cours structuré. Ne vous contentez pas de réciter, apprenez à l\'enfant à réfléchir par lui-même.', consequence: 'Un professeur qui improvise est vite repéré. Vous perdrez vos élèves et votre statut d\'élite.', icon: '🎯', colSpan: 'md:col-span-2 lg:col-span-2', gradient: 'from-emerald-500 to-teal-500', border: 'border-emerald-200' },
  { num: '02', titre: 'Le Professionnalisme', desc: 'Soyez propre, structuré et discipliné dans votre approche. Le vêtement, la religion ou l\'apparence physique n\'ont aucune importance. Seule compte votre rigueur intellectuelle.', consequence: 'Un professeur désordonné perd la confiance des parents. La discipline est la base du respect.', icon: '👔', colSpan: 'md:col-span-1 lg:col-span-1', gradient: 'from-slate-500 to-slate-700', border: 'border-slate-300' },
  { num: '03', titre: 'La Ponctualité Absolue', desc: 'Le temps de la famille est sacré. Soyez à l\'heure. En cas d\'imprévu, prévenez au moins 3 heures à l\'avance.', consequence: 'Les retards répétés détruisent la confiance et entraînent un retrait de la plateforme.', icon: '⏰', colSpan: 'md:col-span-1 lg:col-span-1', gradient: 'from-blue-500 to-cyan-500', border: 'border-blue-200' },
  { num: '04', titre: 'La Transparence du Suivi', desc: 'Remplissez rigoureusement le rapport mensuel. Indiquez les progrès, les difficultés et les devoirs.', consequence: 'C\'est votre vitrine. Un bon suivi booste vos étoiles et vous garantit des recommandations.', icon: '📊', colSpan: 'md:col-span-1 lg:col-span-1', gradient: 'from-purple-500 to-fuchsia-500', border: 'border-purple-200' },
  { num: '05', titre: 'La Semaine de Vérité', desc: 'Les 7 premiers jours sont décisifs. Si le parent n\'est pas satisfait de votre prestation dès la première semaine, vous serez remplacé immédiatement, sans remboursement des frais d\'intégration.', consequence: 'Chaque professeur est suivi et évalué par notre groupe. La première impression est capitale.', icon: '⚖️', colSpan: 'md:col-span-1 lg:col-span-1', gradient: 'from-red-500 to-rose-600', border: 'border-red-200' },
  { num: '06', titre: 'La Confidentialité Absolue', desc: 'Ce qui se passe au domicile des familles reste confidentiel. Ne divulguez jamais d\'informations privées sur les élèves ou leur environnement.', consequence: 'La confiance des familles repose sur votre discrétion. Toute fuite d\'information entraîne une rupture de contrat.', icon: '🤫', colSpan: 'md:col-span-1 lg:col-span-1', gradient: 'from-teal-500 to-emerald-600', border: 'border-teal-200' },
  { num: '07', titre: 'L\'Évaluation par les Parents', desc: 'Nous demandons systématiquement l\'avis des parents sur votre travail. Chaque professeur est surveillé et suivi par notre groupe.', consequence: 'Les retours des parents déterminent votre badge et vos étoiles. Votre réputation se construit sur leur satisfaction.', icon: '⭐', colSpan: 'md:col-span-1 lg:col-span-1', gradient: 'from-amber-400 to-yellow-600', border: 'border-yellow-200' },
  { num: '08', titre: 'L\'Adaptabilité', desc: 'Chaque enfant est unique. Adaptez votre méthode à son niveau, son rythme et sa personnalité, sans le brusquer.', consequence: 'La rigidité ne fonctionne pas. Un enfant qui a peur n\'apprend pas.', icon: '🧩', colSpan: 'md:col-span-1 lg:col-span-1', gradient: 'from-indigo-500 to-blue-700', border: 'border-indigo-200' },
  { num: '09', titre: 'L\'Autonomie & le Suivi Premium', desc: 'Nous ne vous espionnons pas pendant vos cours. Vous êtes un professionnel libre. Toutefois, les professeurs dont le parent a souscrit à la Formule Premium sont suivis en continu (visites, audits, contrôles des cahiers) tant que cette formule est payée. Pour les autres, nous nous basons sur les retours parents et notre suivi global.', consequence: 'La Formule Premium est un contrat de confiance renforcé. Si vous acceptez un élève Premium, vous acceptez le suivi continu de l\'équipe.', icon: '🛡️', colSpan: 'md:col-span-3 lg:col-span-3', gradient: 'from-cyan-600 to-blue-800', border: 'border-cyan-300' },
]

export default function ReglesProfesseur() {
  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans selection:bg-emerald-900 selection:text-white">
      
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/20 rounded-full blur-[150px] -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-50/40 rounded-full blur-[120px] -z-10 -translate-x-1/2" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-8 relative z-50">
        <Link href="/inscription" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md">
          <span>←</span> Retour à l'inscription
        </Link>
      </motion.div>

      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-white text-xs font-black uppercase tracking-widest mb-10 shadow-xl">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              Le Serment du Professeur
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-10">
              Le Code d'Éthique <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-500">
                de l'Élite.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-4xl mx-auto mb-12">
              Enseigner n'est pas un petit boulot. C'est une mission. En rejoignant cette plateforme, vous devenez le guide d'un enfant. Ce document liste les 9 règles non négociables que tout professeur d'élite doit respecter.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="relative -mt-10 mb-24 z-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="bg-slate-950 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-400 to-teal-500" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 border border-white/10 shadow-inner">⚖️</div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Le Test de Réalité.</h3>
                <p className="text-slate-300 font-medium leading-relaxed text-lg">Vous allez faire face à des enfants fatigués, parfois indisciplinés, et à des parents stressés. Votre rôle n'est pas de juger, mais de <strong>tirer le meilleur de chaque élève</strong>. Si vous cherchez un travail facile où vous êtes juste payé à la fin de l'heure, cette plateforme n'est pas pour vous.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Les 9 Règles d'Or.</h2>
              <p className="text-lg text-slate-600 font-medium max-w-2xl">En validant votre inscription, vous prêtez serment de les respecter.</p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 px-5 py-3 rounded-xl border border-emerald-200 font-bold text-sm whitespace-nowrap hidden md:block">Lecture obligatoire</div>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regles.map((regle, i) => (
              <motion.div key={i} variants={fadeInUp} className={`group relative bg-white rounded-[2rem] p-8 border ${regle.border} shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden ${regle.colSpan}`}>
                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${regle.gradient} rounded-full blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${regle.gradient} flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>{regle.icon}</div>
                  <span className="text-5xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">{regle.num}</span>
                </div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight">{regle.titre}</h3>
                  <p className="text-slate-600 font-medium leading-relaxed mb-6">{regle.desc}</p>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 group-hover:border-slate-200 transition-colors">
                    <p className="text-sm text-slate-700 font-bold leading-relaxed">
                      <span className="uppercase tracking-widest text-[10px] text-slate-400 block mb-1">Clause de pénalité :</span>
                      <span className="text-red-600/90">{regle.consequence}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest mb-6">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Votre Raison d'Être
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">Vous ne Donnez pas <br className="hidden md:block" /> des Cours.</h2>
              <p className="text-lg text-slate-400 leading-relaxed font-medium mb-8">Vous changez des trajectoires. Vous donnez de la confiance. Un enfant qui réussit grâce à vous se souviendra de vous toute sa vie.</p>
              <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                <span className="text-3xl">🌟</span>
                <div className="text-left">
                  <div className="text-white font-bold">Soyez le professeur dont ils se souviendront.</div>
                  <div className="text-slate-400 text-xs">L'excellence est votre seul chemin.</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex-1 w-full grid grid-cols-2 gap-4">
              {[
                { val: '+50', label: 'Élèves accompagnés' },
                { val: '100%', label: 'Engagement' },
                { val: '24h', label: 'Délai de réponse' },
                { val: '0', label: 'Compromis sur la qualité' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center hover:bg-white/10 transition-colors">
                  <div className="text-3xl md:text-4xl font-black text-emerald-400 mb-1">{stat.val}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-200">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">🛡️</div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">Le Bouclier d'Intégrité</h3>
              <p className="text-slate-600 font-medium">Ce que la plateforme vous garantit et ce que vous garantissez aux parents.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Identité vérifiée par l\'administration', 'Documents audités en amont (pas à présenter au parent)', 'Respect de la vie privée des familles', 'Liberté totale de gestion financière après le 1er mois', 'Semaine d\'essai avec remplacement garanti', 'Suivi continu et audits pour la Formule Premium'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-emerald-500 font-black">✓</span>
                  <span className="text-sm font-bold text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Prêt à signer votre engagement ?</h2>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto font-medium">En rejoignant l'élite, vous acceptez de placer l'excellence au cœur de votre métier.</p>
            <Link href="/inscription/professeur" className="inline-flex items-center justify-center gap-4 w-full md:w-auto px-12 py-6 rounded-2xl font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_40px_rgba(52,211,153,0.3)] hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] transition-all hover:-translate-y-1 text-xl group">
              Je signe le Code d'Éthique
              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <p className="mt-6 text-xs text-slate-500 font-bold uppercase tracking-widest">Document contractuel · Prof À Domicile Djibouti</p>
          </motion.div>
        </div>
      </section>

    </div>
  )
}