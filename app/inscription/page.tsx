'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ChoixInscription() {
  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden flex flex-col selection:bg-blue-200">
      {/* 🌟 Décor de fond premium animé */}
      <motion.div 
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" 
      />
      <motion.div 
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }} 
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" 
      />

      {/* 🧭 Navbar */}
      <nav className="relative z-20 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent tracking-tight group-hover:opacity-80 transition-opacity">
              Prof À Domicile
            </span>
            <span className="text-xl group-hover:scale-110 transition-transform">🇩🇯</span>
          </Link>
          <Link
            href="/connexion"
            className="text-sm font-bold text-slate-600 hover:text-blue-700 transition-colors bg-white/50 px-4 py-2 rounded-full border border-slate-200 hover:border-blue-300"
          >
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </nav>

      {/* 🚀 Contenu principal */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
        
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-white shadow-sm mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full relative" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
              Plateforme n°1 à Djibouti
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Rejoignez la communauté
            <br />
            <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Choisissez votre espace. Lisez nos documents officiels ci-dessous, puis inscrivez-vous en moins de 3 minutes.
          </p>
        </motion.div>

        {/* 🃏 Cartes de choix */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* ======================================= */}
          {/* CARTE PARENT (Thème Bleu/Cyan) */}
          {/* ======================================= */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative flex h-full"
          >
            {/* Halo lumineux au survol */}
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            
            <div className="relative w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-xl shadow-blue-900/5 group-hover:shadow-2xl group-hover:shadow-blue-900/10 group-hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden">
              {/* Barre de couleur en haut */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400" />
              
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner border border-blue-200/50">
                👨‍👩‍👧‍👦
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                Je suis Parent
              </h2>
              <p className="text-lg font-bold text-blue-600 mb-6 flex items-center gap-2">
                Trouvez le prof idéal <span className="text-xl">🎯</span>
              </p>
              
              <p className="text-slate-600 mb-8 flex-1 font-medium leading-relaxed">
                Accédez à des professeurs rigoureusement vérifiés pour accompagner vos enfants vers la réussite scolaire.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'Professeurs vérifiés et qualifiés',
                  'Cours à domicile adaptés à votre enfant',
                  'Suivi personnalisé et transparent',
                  'Service 100% gratuit pour les parents'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>

              {/* BOUTON PRINCIPAL PARENT */}
              <Link
                href="/inscription/parent"
                className="w-full py-5 rounded-2xl font-black text-white text-lg bg-gradient-to-r from-blue-700 to-blue-600 shadow-lg shadow-blue-600/30 group-hover:shadow-blue-600/50 group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden mb-6"
              >
                <span className="relative z-10">Créer un compte Parent</span>
                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                {/* Effet de brillance */}
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Link>

              {/* LIENS DOCUMENTS OFFICIELS (À LIRE AVANT DE S'INSCRIRE) */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-800 mb-3 uppercase tracking-wider flex items-center gap-1">
                  📖 À lire avant de s'inscrire :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/inscription/charte-parent"
                    className="py-2.5 rounded-xl font-bold text-xs text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    📜 Charte Qualité
                  </Link>
                  <Link
                    href="/inscription/regle-parent"
                    className="py-2.5 rounded-xl font-bold text-xs text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    📋 Règles
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ======================================= */}
          {/* CARTE PROFESSEUR (Thème Émeraude/Teal) */}
          {/* ======================================= */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative flex h-full"
          >
            {/* Halo lumineux au survol */}
            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            
            <div className="relative w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-xl shadow-emerald-900/5 group-hover:shadow-2xl group-hover:shadow-emerald-900/10 group-hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden">
              {/* Barre de couleur en haut */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 to-teal-400" />
              
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner border border-emerald-200/50">
                👨‍🏫
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                Je suis Professeur
              </h2>
              <p className="text-lg font-bold text-emerald-600 mb-6 flex items-center gap-2">
                Partagez votre savoir <span className="text-xl">🌟</span>
              </p>
              
              <p className="text-slate-600 mb-8 flex-1 font-medium leading-relaxed">
                Rejoignez notre réseau d'enseignants, trouvez des élèves près de chez vous et gérez vos horaires librement.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'Élèves motivés près de chez vous',
                  'Revenus flexibles selon vos horaires',
                  'Badge de vérification pour rassurer',
                  'Zéro frais d\'inscription initiaux'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>

              {/* BOUTON PRINCIPAL PROFESSEUR */}
              <Link
                href="/inscription/professeur"
                className="w-full py-5 rounded-2xl font-black text-white text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-600/30 group-hover:shadow-emerald-600/50 group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden mb-6"
              >
                <span className="relative z-10">Créer un compte Professeur</span>
                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                {/* Effet de brillance */}
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Link>

              {/* LIENS DOCUMENTS OFFICIELS (À LIRE AVANT DE S'INSCRIRE) */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-wider flex items-center gap-1">
                  📖 À lire avant de s'inscrire :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/inscription/charte-prof"
                    className="py-2.5 rounded-xl font-bold text-xs text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    📜 Charte Qualité
                  </Link>
                  <Link
                    href="/inscription/regle-prof"
                    className="py-2.5 rounded-xl font-bold text-xs text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    📋 Règles
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🛡️ Section de confiance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          <div className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
            <span className="text-2xl drop-shadow-sm">🔒</span>
            <span className="text-sm font-bold uppercase tracking-wider">Données sécurisées</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors">
            <span className="text-2xl drop-shadow-sm">✅</span>
            <span className="text-sm font-bold uppercase tracking-wider">Profils vérifiés</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 hover:text-amber-600 transition-colors">
            <span className="text-2xl drop-shadow-sm">⚡</span>
            <span className="text-sm font-bold uppercase tracking-wider">Support 7j/7</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8">
        <p className="text-sm text-slate-400 font-medium">
          © {new Date().getFullYear()} Prof À Domicile Djibouti. Fait avec ❤️ pour l'éducation.
        </p>
      </footer>
    </div>
  )
}