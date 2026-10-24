'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

// ==========================================
// ANIMATIONS HYPER-PREMIUM
// ==========================================
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
}

// ==========================================
// DATA : LES RÈGLES D'OR
// ==========================================
const regles = [
  {
    num: '01',
    titre: 'Le Respect Mutuel',
    desc: 'Le professeur est un professionnel de l\'éducation, pas un domestique. Traitez-le avec la même déférence que vous exigez pour votre enfant.',
    consequence: 'Un professeur humilié ne donnera jamais le meilleur. Vous perdez un partenaire.',
    icon: '🤝',
    colSpan: 'md:col-span-2 lg:col-span-2',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    num: '02',
    titre: 'L\'Alliance Éducative',
    desc: 'Un cours à domicile n\'est pas une garderie. Vous devez vérifier que votre enfant a fait ses devoirs et maintenir la discipline à la maison.',
    consequence: 'Si vous ne faites pas votre part, le professeur se battra contre un mur.',
    icon: '👨‍👩‍👧',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-purple-500 to-fuchsia-500'
  },
  {
    num: '03',
    titre: 'Le Temps est un Trésor',
    desc: 'Le temps du professeur est facturé. Préavis minimum de 24 heures en cas d\'annulation (sauf urgence médicale).',
    consequence: 'Les retards ou annulations répétées de l\'élève détruisent la relation de confiance.',
    icon: '⏳',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    num: '04',
    titre: 'L\'Éthique Financière',
    desc: 'Le paiement de la séance doit être effectué AVANT le début du cours. Pas de paiement, pas de séance.',
    consequence: 'La précarité financière détruit la motivation des professeurs. Nous protégeons leur travail.',
    icon: '💳',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    num: '05',
    titre: 'La Loyauté du Système',
    desc: 'Toute communication doit passer par notre plateforme. Ne contournez jamais le système pour des arrangements privés.',
    consequence: 'En dehors de la plateforme, vous perdez toutes vos garanties de sécurité et de remplacement.',
    icon: '📱',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-slate-600 to-slate-800'
  },
  {
    num: '06',
    titre: 'Le Devoir de Signalement',
    desc: 'Si un professeur est en retard, ne prépare pas ses cours ou a un comportement inapproprié, signalez-le IMMÉDIATEMENT.',
    consequence: 'Un problème ignoré aujourd\'hui devient un échec scolaire demain. Nous agissons en 24h.',
    icon: '🚨',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-red-500 to-rose-600'
  },
  {
    num: '07',
    titre: 'L\'Évaluation Honnête',
    desc: 'À la fin de chaque mois, évaluez le professeur. Si le travail est excellent, donnez 5 étoiles. Si c\'est médiocre, dites-le.',
    consequence: 'Vos évaluations déterminent qui reste sur la plateforme. Aidez-nous à garder l\'élite.',
    icon: '⭐',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-yellow-400 to-amber-500'
  },
  {
    num: '08',
    titre: 'La Règle de la Porte Ouverte',
    desc: 'Un professeur ne doit JAMAIS se retrouver seul avec votre enfant dans une pièce fermée. Un adulte doit être présent dans la maison.',
    consequence: 'La confiance n\'exclut pas le contrôle. C\'est la base absolue de la sécurité.',
    icon: '🛡️',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-indigo-500 to-blue-700'
  },
  {
    num: '09',
    titre: 'L\'Objectif Pédagogique',
    desc: 'Le cours à domicile doit viser la maîtrise profonde et la progression. Ce n\'est pas juste "faire les devoirs" ou réviser.',
    consequence: 'Un élève qui ne fait que réciter stagne. Nous voulons qu\'il comprenne et réussisse.',
    icon: '🎯',
    colSpan: 'md:col-span-1 lg:col-span-1',
    gradient: 'from-teal-500 to-emerald-700'
  },
]

export default function ReglesParent() {
  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-hidden font-sans selection:bg-blue-900 selection:text-white">
      
      {/* DÉCOR DE FOND PREMIUM */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[150px] -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -z-10 -translate-x-1/2" />

      {/* NAVIGATION RETOUR */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-8 relative z-50">
        <Link href="/inscription" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-700 transition-colors bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md">
          <span>←</span> Retour à l'inscription
        </Link>
      </motion.div>

      {/* ==========================================
          SECTION 1 : HERO PSYCHOLOGIQUE (L'ENGAGEMENT)
      ========================================== */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-white text-xs font-black uppercase tracking-widest mb-10 shadow-xl">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              Le Contrat Moral
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-10">
              Le Code d'Honneur <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500">
                du Parent d'Élite.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-4xl mx-auto mb-12">
              La réussite de votre enfant n'est pas une formule magique. C'est une équation à trois inconnues : votre implication, l'assiduité de votre enfant et l'excellence de notre professeur.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2 : LA VÉRITÉ BRUTALE (EFFET PRATFALL)
      ========================================== */}
      <section className="relative -mt-10 mb-24 z-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="bg-slate-950 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 to-orange-500" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 border border-white/10 shadow-inner">
                ⚠️
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">La Vérité que Personne ne Vous Dit</h3>
                <p className="text-slate-300 font-medium leading-relaxed text-lg">
                  Un professeur à domicile n'est pas un sauveur. C'est un catalyseur. Si votre enfant est indiscipliné, fatigué, ou s'il ne fait pas ses devoirs, <strong>aucun professeur au monde ne pourra le faire réussir</strong>. Nous vous demandons de lire ces règles avec une humilité totale.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3 : GRILLE BENTO DES 9 RÈGLES (MASSIVE)
      ========================================== */}
      <section className="relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Les 9 Règles d'Or.</h2>
            <p className="text-lg text-slate-600 font-medium">En validant votre inscription, vous vous engagez formellement à les respecter.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {regles.map((regle, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp} 
                className={`group relative bg-white rounded-[2rem] p-8 border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden ${regle.colSpan}`}
              >
                {/* Lueur colorée au survol */}
                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${regle.gradient} rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${regle.gradient} flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    {regle.icon}
                  </div>
                  <span className="text-5xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">
                    {regle.num}
                  </span>
                </div>
                
                <div className="relative z-10 flex-1">
                  <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight">{regle.titre}</h3>
                  <p className="text-slate-600 font-medium leading-relaxed mb-6">
                    {regle.desc}
                  </p>
                  
                  {/* La Conséquence */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 group-hover:border-slate-200 transition-colors">
                    <p className="text-sm text-slate-700 font-bold leading-relaxed">
                      <span className="uppercase tracking-widest text-[10px] text-slate-400 block mb-1">La conséquence :</span>
                      <span className="text-red-600/90">{regle.consequence}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4 : LE PONT LINGUISTIQUE (LA RÈGLE 10 - MISE EN AVANT)
      ========================================== */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                Règle N°10
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
                Le Pont <br className="hidden md:block" /> Linguistique.
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed font-medium mb-8">
                Vous hésitez sur la langue de communication ? Sachez que chaque professeur a explicitement indiqué les langues qu'il maîtrise (Français, Arabe, Somali, Afar).
              </p>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex-1 w-full bg-white/5 p-8 md:p-10 rounded-[2rem] border border-white/10 backdrop-blur-sm relative">
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-black text-white mb-4">Notre Conseil d'Expert</h3>
              <p className="text-slate-300 leading-relaxed font-medium mb-6">
                Bien que le cours se déroule dans la langue d'étude (ex: Maths en Français), il est <strong>crucial</strong> de choisir un professeur qui peut communiquer dans la langue maternelle de l'enfant (ex: Somali, Afar).
              </p>
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <p className="text-sm text-blue-300 font-bold">
                  💡 Cela facilite énormément les explications et évite que l'enfant se bloque face à une incompréhension.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 5 : NOTRE ENGAGEMENT EN RETOUR
      ========================================== */}
      <section className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[3rem] p-8 md:p-16 border border-indigo-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="text-center mb-12">
              <div className="text-5xl mb-6">🤝</div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Notre Engagement en Retour.</h2>
              <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                Nous vous demandons une implication totale. En échange, nous déployons des moyens exceptionnels pour garantir la qualité.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Visites & Enquêtes', desc: 'Nous visitons les professeurs académiques et interrogeons leurs anciens élèves pour vérifier leur réputation.', icon: '🏫' },
                { title: 'Badges & Étoiles', desc: 'Un système de distinction strict (Super Prof, Pionnier, Académique) pour choisir le meilleur.', icon: '🏅' },
                { title: 'Remplacement 48h', desc: 'Si le professeur ne répond pas à nos standards d\'élite, nous vous en trouvons un autre sous 48h.', icon: '🔄' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-white shadow-sm flex flex-col items-center text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h4 className="font-black text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 6 : CTA FINAL
      ========================================== */}
      <section className="py-24 bg-slate-50 relative border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">
              En cliquant ci-dessous, vous certifiez avoir lu et accepté ces 10 règles d'or.
            </p>
            <Link 
              href="/inscription/parent" 
              className="inline-flex items-center justify-center gap-4 w-full md:w-auto px-12 py-6 rounded-2xl font-black text-white bg-slate-950 hover:bg-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 text-xl group"
            >
              J'accepte le Code d'Honneur
              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  )
}