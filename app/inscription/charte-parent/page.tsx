'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// ==========================================
// ANIMATIONS
// ==========================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

// ==========================================
// DATA : 3 AVIS COURT & VARIÉS
// ==========================================
const avisParents = [
  {
    texte: "Je pensais que 'gratuit' rimait avec 'arnaque'. La transparence sur les 30% du prof m'a bluffée. Mon fils a enfin un vrai prof de maths, sans frais cachés.",
    auteur: "Mariam A.",
    contexte: "Maman de 2 enfants · Héron",
    initiales: "MA",
    tag: "Le Sceptique",
    couleurTag: "bg-slate-100 text-slate-600"
  },
  {
    texte: "L'option à 5000 DJF est mon meilleur investissement. L'inspecteur vérifie les cahiers de ma fille et m'envoie un rapport WhatsApp. Elle est passée de 9 à 14 de moyenne.",
    auteur: "Ahmed H.",
    contexte: "Papa d'une collégienne · Gabode",
    initiales: "AH",
    tag: "Le Résultat",
    couleurTag: "bg-amber-100 text-amber-700"
  },
  {
    texte: "Ce qui m'a rassuré, c'est la vérification du casier judiciaire et de la CIN. On ne confie pas son enfant à n'importe qui. Le prof de coran est excellent.",
    auteur: "Youssouf B.",
    contexte: "Papa de 2 enfants · Q1",
    initiales: "YB",
    tag: "Le Sécuritaire",
    couleurTag: "bg-emerald-100 text-emerald-700"
  }
]

const faqs = [
  {
    q: "Est-ce vraiment 0 DJF pour moi en tant que parent ?",
    a: "Oui. La recherche, la vérification, la mise en relation et la garantie de remplacement sont 100% gratuites. La plateforme se rémunère uniquement auprès du professeur via une commission de 30% prélevée sur son PREMIER salaire mensuel. Ensuite, il garde 100% de ses revenus."
  },
  {
    q: "Pourquoi le professeur paie 30% et pas moi ?",
    a: "Parce que nous avons inversé le modèle. Le professeur investit pour rejoindre notre réseau d'élite et accéder à des élèves motivés. Ce modèle nous permet de vous garantir un service de très haute qualité sans vous facturer le moindre centime."
  },
  {
    q: "Comment choisir le meilleur professeur parmi tous ?",
    a: "Notre système de badges et d'étoiles vous guide. Un professeur avec le badge 'Super Prof' ou 'Académique' a été audité sur le terrain et recommandé par ses anciens élèves. Les étoiles reflètent la qualité de sa pédagogie et de son suivi."
  },
  {
    q: "Que se passe-t-il si le professeur ne me plaît pas ?",
    a: "Vous nous contactez sous 48h. Nous suspendons immédiatement le professeur et nous vous proposons un nouveau profil vérifié qui correspond à vos critères. Vous ne perdez ni votre temps ni votre argent."
  },
  {
    q: "Comment vérifiez-vous concrètement les professeurs ?",
    a: "Nous exigeons une pièce d'identité nationale (CIN), un diplôme ou une preuve d'inscription. Pour les professeurs académiques, nous les visitons et enquêtons auprès de leurs élèves. Pour le Coran et les langues, nous organisons des tests en présentiel avec des experts."
  }
]

export default function CharteQualiteParent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
          SECTION 1 : HERO PSYCHOLOGIQUE (AUTORITÉ)
      ========================================== */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-black uppercase tracking-widest mb-10 shadow-sm">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
              Document Exécutoire · Édition 2024
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-10">
              L'Exigence est <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500">
                Notre Seule Promesse.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-4xl mx-auto mb-12">
              Nous n'avons pas créé une simple plateforme de mise en relation. Nous avons bâti un écosystème éducatif d'élite. Ce document est notre contrat moral. Lisez-le attentivement.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/inscription/parent" className="px-10 py-5 bg-slate-950 text-white font-black rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-2xl w-full sm:w-auto text-center text-lg">
                J'accepte les termes
              </Link>
              <a href="#modele" className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all w-full sm:w-auto text-center text-lg">
                Comprendre le modèle ↓
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2 : MODÈLE ÉCONOMIQUE (HONNÊTETÉ)
      ========================================== */}
      <section id="modele" className="py-24 bg-white border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Le Modèle Économique.</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
              Nous croyons en la transparence radicale. Voici exactement comment nous nous rémunérons. Pas de frais cachés, pas de commissions perpétuelles.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* FORMULE STANDARD */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative group flex">
              <div className="relative w-full bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-sm group-hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🛡️</div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Mise en Relation</h3>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-wider mt-1">Gratuit pour le parent</p>
                  </div>
                </div>
                
                <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-black text-slate-900">0 DJF</span>
                    <span className="text-sm font-bold text-slate-500">/ parent</span>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      <strong className="text-blue-800">La vérité :</strong> Le professeur reverse <strong className="bg-blue-200 text-blue-900 px-1 rounded">30% de son tout premier salaire</strong> pour rejoindre le réseau. Ensuite, il garde 100% de ses revenus. <strong>Vous ne payez pas un centime.</strong>
                    </p>
                  </div>
                </div>

                <ul className="space-y-5 flex-1 mb-8">
                  {[
                    'Accès illimité aux profils vérifiés.',
                    'Contact direct du professeur débloqué.',
                    'Organisation de la première rencontre.',
                    'Remplacement sous 48h si insatisfaction.',
                    'Assistance de base en cas de litige.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">✓</span>
                      <span className="text-sm text-slate-700 font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* FORMULE EXCELLENCE */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative group flex">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-500" />
              <div className="relative w-full bg-slate-950 rounded-[2.5rem] p-8 md:p-12 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute top-6 right-6 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  L'Élite
                </div>
                
                <div className="relative z-10 flex items-center gap-4 mb-8 mt-4 md:mt-0">
                  <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-amber-500/30">🏆</div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Surveillance & Contrôle</h3>
                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider mt-1">Option Premium</p>
                  </div>
                </div>
                
                <div className="relative z-10 mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-black text-white">5 000</span>
                    <span className="text-sm font-bold text-slate-400">DJF / mois</span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">
                    Vous engagez un <strong>inspecteur pédagogique privé</strong>. Nous auditons le professeur, vérifions les cahiers de l'élève et mesurons son évolution réelle. 
                  </p>
                </div>

                <ul className="relative z-10 space-y-5 flex-1 mb-8">
                  {[
                    'TOUT ce que la formule Standard inclut.',
                    'Audit strict du comportement du professeur.',
                    'Vérification physique et mensuelle des cahiers.',
                    'Évaluation de la progression réelle (notes, compréhension).',
                    'Rapports de suivi détaillés envoyés aux parents.',
                    'Ligne directe prioritaire avec un conseiller dédié.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">★</span>
                      <span className="text-sm text-slate-200 font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3 : L'EFFET PRATFALL (HONNÊTETÉ)
      ========================================== */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Notre Serment de Transparence.</h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
              L'honnêteté est un luxe. Voici les 3 vérités que les autres plateformes n'osent pas vous dire.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: '🛑', 
                title: "Nous ne sommes pas des magiciens.", 
                desc: "Si votre enfant est indiscipliné ou ne fait pas ses devoirs, aucun professeur ne le sauvera. Nous exigeons votre implication parentale.",
                color: "border-red-200 bg-red-50"
              },
              { 
                icon: '🚫', 
                title: "Nous ne sommes pas des pirates.", 
                desc: "Nous ne prenons pas 30% chaque mois. C'est 30% UNE SEULE FOIS, sur le premier salaire du prof. Ensuite, la relation financière vous appartient.",
                color: "border-amber-200 bg-amber-50"
              },
              { 
                icon: '🛡️', 
                title: "Nous ne fermons pas les yeux.", 
                desc: "Un prof incompétent ou irrespectueux est définitivement exclu. Nous préférons perdre un professeur que perdre votre confiance.",
                color: "border-blue-200 bg-blue-50"
              }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className={`p-8 rounded-3xl border ${item.color} shadow-sm`}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h4 className="font-black text-slate-900 text-xl mb-3">{item.title}</h4>
                <p className="text-slate-700 font-medium leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4 : LE PROTOCOLE DE VÉRIFICATION (MIS À JOUR AVEC VISITES)
      ========================================== */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Le Protocole de Vérification.</h2>
            <p className="text-lg text-slate-600 font-medium">Chaque professeur passe par un processus d'audit strict. Nous testons leurs compétences réelles avant de vous les recommander.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Audit d\'Identité', desc: 'Vérification de la carte d\'identité nationale (CIN) et du casier judiciaire pour garantir la sécurité.', icon: '🆔' },
              { step: '02', title: 'Visite & Enquête', desc: 'Pour les profs académiques (collèges/lycées) et expérimentés : visite sur leur lieu d\'exercice et enquête auprès de leurs élèves pour vérifier leur réputation.', icon: '🏫' },
              { step: '03', title: 'Test Pratique (Coran & Langues)', desc: 'Pour le Coran : test en présentiel sur la lecture, la mémorisation et le Tajwid par notre administration et des savants. Idem pour les langues étrangères.', icon: '🎙️' },
              { step: '04', title: 'Test Académique', desc: 'Pour les étudiants universitaires : vérification des documents et test d\'explication pour s\'assurer qu\'ils savent transmettre leur savoir.', icon: '🎓' }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform">{item.step}</div>
                <div className="text-4xl mb-6 mt-4">{item.icon}</div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{item.title}</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ENCART SPÉCIAL : LE PONT LINGUISTIQUE */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mt-12 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl flex-shrink-0 border border-white/20">
                🗣️
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black mb-3">Le Pont Linguistique.</h3>
                <p className="text-blue-100 text-base md:text-lg leading-relaxed font-medium mb-4">
                  Vous hésitez sur la langue de communication ? Sachez que chaque professeur a explicitement indiqué les langues qu'il maîtrise (Français, Arabe, Somali, Afar).
                </p>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-sm text-white font-medium">
                    💡 <strong>Notre conseil d'expert :</strong> Bien que le cours se déroule dans la langue d'étude (ex: Maths en Français), il est <strong>crucial</strong> de choisir un professeur qui peut communiquer dans la langue maternelle de l'enfant (ex: Somali, Afar). Cela facilite énormément les explications et évite que l'enfant se bloque face à une incompréhension.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 5 : LE SYSTÈME DE DISTINCTION (BADGES)
      ========================================== */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Le Système de Distinction.</h2>
            <p className="text-lg text-slate-400 font-medium">Pour vous aider à choisir l'excellence en un coup d'œil, nous avons créé un système de badges et d'étoiles exclusif.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: '🏅', 
                title: 'Badge Pionnier', 
                desc: 'Décerné aux premiers professeurs qui ont rejoint l\'aventure. Ils ont fait leurs preuves depuis le premier jour.',
                color: 'from-amber-400 to-amber-600',
                textColor: 'text-amber-400'
              },
              { 
                icon: '🏫', 
                title: 'Badge Académique', 
                desc: 'Réservé aux professeurs exerçant en collège ou lycée. Leur pédagogie a été validée sur le terrain et par leurs élèves.',
                color: 'from-blue-400 to-blue-600',
                textColor: 'text-blue-400'
              },
              { 
                icon: '🌟', 
                title: 'Badge Super Prof', 
                desc: 'L\'élite absolue. Attribué aux professeurs ayant les meilleurs retours, une ponctualité irréprochable et des résultats prouvés.',
                color: 'from-emerald-400 to-emerald-600',
                textColor: 'text-emerald-400'
              }
            ].map((badge, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-4xl shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                  {badge.icon}
                </div>
                <h4 className={`text-xl font-black mb-3 ${badge.textColor}`}>{badge.title}</h4>
                <p className="text-slate-300 font-medium leading-relaxed text-sm">{badge.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* SYSTÈME D'ÉTOILES */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mt-12 bg-white/5 rounded-3xl p-8 border border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h4 className="text-2xl font-black text-white mb-2">Le Barème des Étoiles</h4>
                <p className="text-slate-400 font-medium text-sm">Chaque étoile est le fruit de l'évaluation stricte de nos inspecteurs et des parents.</p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                {[
                  { star: '★', label: 'Ponctualité', color: 'text-amber-400' },
                  { star: '★★', label: 'Pédagogie', color: 'text-amber-400' },
                  { star: '★★★', label: 'Progression', color: 'text-amber-400' },
                  { star: '★★★★', label: 'Comportement', color: 'text-amber-400' },
                  { star: '★★★★★', label: 'Excellence', color: 'text-amber-400' }
                ].map((item, i) => (
                  <div key={i} className="text-center bg-slate-800/50 p-3 rounded-xl border border-white/5 min-w-[100px]">
                    <div className="text-lg mb-1">{item.star}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 6 : LE MUR DE LA CONFIANCE (3 AVIS)
      ========================================== */}
      <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-widest mb-4">
              <span>✓</span> 100% Avis Vérifiés
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Le Mur de la Confiance.</h2>
            <p className="text-lg text-slate-600 font-medium">Des retours honnêtes, de vraies familles djiboutiennes.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {avisParents.map((avis, i) => (
              <motion.div 
                key={i} 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }} 
                variants={fadeInUp} 
                className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1 text-amber-400 text-lg">★★★★★</div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${avis.couleurTag}`}>
                      {avis.tag}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed mb-8 text-sm italic">« {avis.texte} »</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-inner">
                    {avis.initiales}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 leading-tight">{avis.auteur}</div>
                    <div className="text-[11px] font-bold text-slate-500">{avis.contexte}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 7 : LE BOUCLIER D'INTÉGRITÉ (SÉCURITÉ PREMIUM)
      ========================================== */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Protocole de Sécurité Niveau 1
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
                Le Bouclier <br className="hidden md:block" /> d'Intégrité.
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed font-medium mb-8">
                Nous avons bâti un rempart technologique et humain pour garantir la sécurité physique et morale de votre enfant. Chaque professeur est traqué, audité et évalué.
              </p>
              <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                <span className="text-3xl">🔒</span>
                <div className="text-left">
                  <div className="text-white font-bold">Chiffrement des données</div>
                  <div className="text-slate-400 text-xs">Vos informations sont inviolables.</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex-1 w-full space-y-3">
              {[
                { t: 'Exclusion & Signalement', d: 'Tout comportement malsain entraîne une exclusion définitive et un signalement aux autorités.' },
                { t: 'Règle de la Porte Ouverte', d: 'Interdiction stricte pour le prof de s\'isoler avec l\'élève dans une pièce fermée.' },
                { t: 'Casier Judiciaire', d: 'Vérification systématique du casier pour tous les profs travaillant avec des mineurs.' },
                { t: 'Zéro Discrimination', d: 'Aucune tolérance pour le racisme, le harcèlement ou la violence verbale.' }
              ].map((item, i) => (
                <div key={i} className="group flex gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0 font-black">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{item.t}</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 8 : VOS DROITS (EMPOWERMENT)
      ========================================== */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">La Déclaration de vos Droits.</h2>
            <p className="text-lg text-slate-600 font-medium">En tant que parent sur notre plateforme, la loi et notre charte sont de votre côté.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '👁️', title: 'Transparence Totale', desc: 'Vous exigez et obtenez la preuve d\'identité et les diplômes de votre professeur. Zéro faux profil.' },
              { icon: '🚫', title: 'Droit de Veto', desc: 'Un signalement de comportement suspect entraîne une suspension immédiate du prof et une enquête interne.' },
              { icon: '🔄', title: 'Remplacement Garanti', desc: 'Si le professeur ne répond pas à vos standards, nous vous en trouvons un autre sous 48h. Sans frais.' },
              { icon: '📊', title: 'Droit de Contrôle', desc: 'Avec l\'option Surveillance, accédez aux rapports détaillés sur la mémorisation et la progression.' },
              { icon: '⚖️', title: 'Médiation Neutre', desc: 'En cas de litige, notre équipe intervient comme arbitre impartial pour protéger vos intérêts.' },
              { icon: '🛡️', title: 'Sécurité Absolue', desc: 'Notre politique de tolérance zéro garantit que tout comportement inapproprié est puni par une exclusion.' }
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

      {/* ==========================================
          SECTION 9 : LA LOI DE L'AMÉLIORATION
      ========================================== */}
      <section className="py-24 bg-slate-50 relative border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-10 md:p-16 rounded-[3rem] border border-indigo-100 shadow-xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <div className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm">
                💡
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight">La Loi de l'Amélioration Continue</h2>
              
              <div className="text-left bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white">
                <p className="text-lg md:text-xl text-slate-800 leading-relaxed font-medium mb-6">
                  <strong className="text-indigo-700">Un principe fondamental :</strong> La non-amélioration d'un élève ne vient <u>toujours pas</u> de la part du professeur.
                </p>
                <p className="text-lg md:text-xl text-slate-800 leading-relaxed font-medium">
                  Nous demandons aux parents d'aider leur enfant à respecter et suivre les consignes de son professeur, exactement comme dans un établissement scolaire d'élite. Un enfant discipliné et encadré est un enfant qui réussit. <strong>Ensemble, créons les conditions de la réussite.</strong>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 10 : FAQ INTERACTIVE
      ========================================== */}
      <section className="py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Questions Fréquentes.</h2>
            <p className="text-lg text-slate-600 font-medium">Nous répondons à toutes vos objections avec honnêteté.</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }} 
                variants={fadeInUp}
                className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none hover:bg-slate-100 transition-colors"
                >
                  <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
                  <span className={`text-slate-400 transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-slate-600 font-medium leading-relaxed border-t border-slate-200 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 11 : CTA FINAL
      ========================================== */}
      <section className="py-24 bg-slate-50 relative border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Prêt à sceller ce pacte ?</h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium">
              Rejoignez l'élite des parents qui exigent le meilleur pour leurs enfants. Votre inscription est sécurisée et sans engagement.
            </p>
            <Link 
              href="/inscription/parent" 
              className="inline-flex items-center justify-center gap-4 w-full md:w-auto px-12 py-6 rounded-2xl font-black text-white bg-slate-950 hover:bg-slate-800 shadow-2xl transition-all hover:-translate-y-1 text-xl group"
            >
              J'accepte et je crée mon compte Parent
              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <p className="mt-6 text-sm text-slate-500 font-bold">
              🔒 Connexion sécurisée · Aucun paiement requis à cette étape
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  )
}