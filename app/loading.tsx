'use client'

import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#050B14] flex flex-col items-center justify-center z-[9999] overflow-hidden">
      
      {/* Halos lumineux d'arrière-plan (Effet Premium) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Conteneur central */}
      <div className="relative flex flex-col items-center z-10">
        
        {/* Le logo / Orbe animé */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center w-32 h-32 mb-8"
        >
          {/* Cercles concentriques lumineux */}
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-blue-500/30 border-t-blue-500"
          />
          <motion.div 
            animate={{ rotate: -360 }} 
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-emerald-500/20 border-b-emerald-400"
          />
          
          {/* Le cœur lumineux */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-full blur-md"
          />
          
          {/* Votre Emoji/Logo au centre */}
          <div className="absolute text-3xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            🎓
          </div>
        </motion.div>

        {/* Texte principal (Effet de fondu) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 mb-3 tracking-tight">
            Djib Superprof
          </h1>
          
          {/* Sous-titre avec animation de barre de chargement */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-400 font-medium text-sm tracking-wide">
              Préparation de l'excellence...
            </p>
            
            {/* Barre de chargement ultra-fine (Style Apple/Stripe) */}
            <div className="w-48 h-[2px] bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
              />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}