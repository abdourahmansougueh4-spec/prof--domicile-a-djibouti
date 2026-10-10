'use client'

import { motion } from 'framer-motion'

type Props = {
  etoiles: number
  badgeAdmin: string | null
  pionnier?: boolean
  pionnierIllustre?: boolean
  taille?: 'sm' | 'md' | 'lg'
  afficherEtoiles?: boolean
}

const badgesConfig: {
  [key: string]: { label: string; couleur: string; emoji: string }
} = {
  recommande: {
    label: 'Recommandé',
    couleur: 'from-blue-500 to-blue-600',
    emoji: '🏅',
  },
  super_pro: {
    label: 'Super-Pro',
    couleur: 'from-amber-500 to-orange-600',
    emoji: '👑',
  },
  pionnier: {
    label: 'Pionnier',
    couleur: 'from-yellow-500 to-amber-600',
    emoji: '🏆',
  },
  pionnier_illustre: {
    label: 'Pionnier Illustre',
    couleur: 'from-red-500 to-pink-600',
    emoji: '👑',
  },
}

export default function BadgeEtoiles({
  etoiles,
  badgeAdmin,
  pionnier,
  pionnierIllustre,
  taille = 'md',
  afficherEtoiles = true,
}: Props) {
  const tailles = {
    sm: { badge: 'text-[10px] px-2 py-0.5', etoile: 'text-xs' },
    md: { badge: 'text-xs px-3 py-1', etoile: 'text-sm' },
    lg: { badge: 'text-sm px-4 py-1.5', etoile: 'text-base' },
  }

  const t = tailles[taille]

  // Déterminer le badge à afficher (ordre de priorité)
  let badgeActif: string | null = null

  if (pionnierIllustre) {
    badgeActif = 'pionnier_illustre'
  } else if (badgeAdmin === 'super_pro') {
    badgeActif = 'super_pro'
  } else if (badgeAdmin === 'recommande') {
    badgeActif = 'recommande'
  } else if (pionnier || badgeAdmin === 'pionnier') {
    badgeActif = 'pionnier'
  }

  const config = badgeActif ? badgesConfig[badgeActif] : null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Badge Admin d'abord */}
      {config && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex items-center gap-1 bg-gradient-to-r ${config.couleur} text-white ${t.badge} rounded-full font-black shadow-md`}
        >
          <span>{config.emoji}</span>
          <span>{config.label}</span>
        </motion.span>
      )}

      {/* Étoiles ensuite */}
      {afficherEtoiles && etoiles > 0 && (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: n <= etoiles ? 1 : 0.2,
                scale: n <= etoiles ? 1 : 0.8,
              }}
              transition={{ delay: n * 0.1 }}
              className={`${t.etoile} ${
                n <= etoiles ? 'text-amber-500 drop-shadow-sm' : 'text-slate-300'
              }`}
            >
              ⭐
            </motion.span>
          ))}
        </div>
      )}
    </div>
  )
}