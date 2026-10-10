'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfilInfo = {
  experience_annees: number
  a_bac_s: boolean
  est_etudiant: boolean
  note_moyenne: number
  nombre_avis: number
  etoiles: number
  badge_admin: string | null
  type_professeur: string | null
}

type PrixMarche = {
  min: number
  max: number
  moyenne: number
  count: number
}

// ============================================================
// CONSTANTES
// ============================================================

const PRIX_PLANCHER = 5000
const PRIX_PLAFOND = 100000
const PRIX_RECOMMANDE_MIN = 15000
const PRIX_RECOMMANDE_MAX = 35000

// ============================================================
// HELPER : Formater prix
// ============================================================

const formaterPrix = (n: number) => {
  return n.toLocaleString('fr-FR')
}

// ============================================================
// HELPER : Catégorie de prix
// ============================================================

const getCategoriePrix = (min: number): {
  label: string
  emoji: string
  couleur: string
  description: string
} => {
  if (min < 10000) {
    return {
      label: 'Économique',
      emoji: '💰',
      couleur: 'from-emerald-500 to-teal-600',
      description: 'Prix attractifs pour débuter',
    }
  }
  if (min < 25000) {
    return {
      label: 'Standard',
      emoji: '💎',
      couleur: 'from-blue-500 to-indigo-600',
      description: 'Prix moyen du marché',
    }
  }
  if (min < 40000) {
    return {
      label: 'Premium',
      emoji: '👑',
      couleur: 'from-purple-500 to-pink-600',
      description: 'Prix pour profs expérimentés',
    }
  }
  return {
    label: 'Luxe',
    emoji: '💎',
    couleur: 'from-amber-500 to-orange-600',
    description: 'Prix très haut de gamme',
  }
}

// ============================================================
// HELPER : Conseils IA selon profil
// ============================================================

const genererConseilsPrix = (
  profil: ProfilInfo | null,
  prixMin: number,
  prixMax: number,
  marche: PrixMarche
): { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  if (!profil) return conseils

  // Pas de prix défini
  if (prixMin === 0 || prixMax === 0) {
    conseils.push({
      emoji: '🚨',
      texte: 'Définissez vos tarifs pour que notre équipe valide votre dossier.',
      priorite: 'haute',
    })
    return conseils
  }

  // Prix hors marché
  if (marche.count >= 5) {
    if (prixMin < marche.moyenne * 0.5) {
      conseils.push({
        emoji: '⚠️',
        texte: `Vos prix sont bien en dessous du marché (${formaterPrix(marche.moyenne)} DJF). Vous pourriez être sous-évalué.`,
        priorite: 'haute',
      })
    }
    if (prixMin > marche.moyenne * 1.8 && profil.nombre_avis < 10) {
      conseils.push({
        emoji: '💡',
        texte: 'Vos prix sont élevés pour un prof avec peu d\'avis. Gagnez d\'abord des évaluations.',
        priorite: 'haute',
      })
    }
  }

  // Fourchette trop large
  const ecart = prixMax - prixMin
  if (ecart > prixMin * 1.5) {
    conseils.push({
      emoji: '📊',
      texte: 'Votre fourchette de prix est très large. Une fourchette plus serrée rassure les parents.',
      priorite: 'moyenne',
    })
  }

  // Prof débutant
  if (profil.experience_annees < 2 && prixMin > 30000) {
    conseils.push({
      emoji: '🎯',
      texte: 'En tant que débutant, un prix modéré attire plus de premiers clients.',
      priorite: 'moyenne',
    })
  }

  // Étudiant
  if (profil.est_etudiant && prixMin > 25000) {
    conseils.push({
      emoji: '🎓',
      texte: 'Votre statut étudiant est un avantage. Un prix modéré attire plus de parents.',
      priorite: 'moyenne',
    })
  }

  // Bien évalué
  if (profil.note_moyenne >= 4.5 && profil.nombre_avis >= 10) {
    conseils.push({
      emoji: '🌟',
      texte: `Avec ${profil.nombre_avis} avis et une note de ${profil.note_moyenne.toFixed(1)}, vous pouvez viser plus haut.`,
      priorite: 'basse',
    })
  }

  // Prix bien positionné
  if (conseils.length === 0 && prixMin >= PRIX_RECOMMANDE_MIN && prixMax <= PRIX_RECOMMANDE_MAX) {
    conseils.push({
      emoji: '✨',
      texte: 'Vos tarifs sont bien positionnés par rapport au marché.',
      priorite: 'basse',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// HELPER : Simulateur de revenus
// ============================================================

const simulerRevenus = (prix: number, eleves: number = 3) => {
  const revenusMois = prix * eleves
  const revenusAnnee = revenusMois * 12
  return { revenusMois, revenusAnnee }
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function TarifsProfesseur() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [loading, setLoading] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [modifications, setModifications] = useState(false)
  const [derniereModif, setDerniereModif] = useState<string | null>(null)

  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')
  const [profil, setProfil] = useState<ProfilInfo | null>(null)
  const [marche, setMarche] = useState<PrixMarche>({
    min: 0,
    max: 0,
    moyenne: 0,
    count: 0,
  })

  // Valeurs numériques
  const prixMinNum = Number(prixMin) || 0
  const prixMaxNum = Number(prixMax) || 0
  const prixMoyen = prixMinNum && prixMaxNum ? Math.round((prixMinNum + prixMaxNum) / 2) : 0

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée')
        setLoading(false)
        return
      }

      // Charger profil prof
      const [profRes, marcheRes] = await Promise.all([
        supabase
          .from('professeurs')
          .select(
            'prix_min, prix_max, experience_annees, a_bac_s, est_etudiant, note_moyenne, nombre_avis, etoiles, badge_admin, type_professeur'
          )
          .eq('id', user.id)
          .single(),
        supabase
          .from('professeurs')
          .select('prix_min, prix_max')
          .not('prix_min', 'is', null)
          .not('prix_max', 'is', null)
          .eq('approuve', true)
          .limit(200),
      ])

      if (profRes.data) {
        setPrixMin(profRes.data.prix_min?.toString() || '')
        setPrixMax(profRes.data.prix_max?.toString() || '')

        setProfil({
          experience_annees: profRes.data.experience_annees || 0,
          a_bac_s: profRes.data.a_bac_s === true,
          est_etudiant: profRes.data.est_etudiant === true,
          note_moyenne: Number(profRes.data.note_moyenne) || 0,
          nombre_avis: profRes.data.nombre_avis || 0,
          etoiles: profRes.data.etoiles || 0,
          badge_admin: profRes.data.badge_admin || null,
          type_professeur: profRes.data.type_professeur || null,
        })
      }

      // Calculer les stats du marché
      if (marcheRes.data && marcheRes.data.length > 0) {
        const mins = marcheRes.data
          .map((p) => Number(p.prix_min) || 0)
          .filter((n) => n > 0)
        const maxs = marcheRes.data
          .map((p) => Number(p.prix_max) || 0)
          .filter((n) => n > 0)

        if (mins.length > 0) {
          setMarche({
            min: Math.min(...mins),
            max: Math.max(...maxs),
            moyenne: Math.round(mins.reduce((a, b) => a + b, 0) / mins.length),
            count: mins.length,
          })
        }
      }

      // Charger la date de dernière modification
      const { data: logs } = await supabase
        .from('admin_logs')
        .select('created_at')
        .eq('action', 'modifier_tarifs')
        .order('created_at', { ascending: false })
        .limit(1)

      if (logs && logs.length > 0) {
        setDerniereModif(logs[0].created_at)
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // CALCULS DÉRIVÉS
  // ============================================================

  const conseils = useMemo(
    () => genererConseilsPrix(profil, prixMinNum, prixMaxNum, marche),
    [profil, prixMinNum, prixMaxNum, marche]
  )

  const categorie = useMemo(() => {
    if (prixMinNum === 0) return null
    return getCategoriePrix(prixMinNum)
  }, [prixMinNum])

  const simulateur = useMemo(() => {
    if (prixMoyen === 0) return null
    return simulerRevenus(prixMoyen, 3)
  }, [prixMoyen])

  const ecartPourcentage = useMemo(() => {
    if (marche.moyenne === 0 || prixMoyen === 0) return 0
    return Math.round(((prixMoyen - marche.moyenne) / marche.moyenne) * 100)
  }, [prixMoyen, marche.moyenne])

  // ============================================================
  // VALIDATION
  // ============================================================

  const validation = useMemo(() => {
    const erreurs: string[] = []

    if (!prixMin || !prixMax) {
      erreurs.push('Veuillez remplir les deux prix')
    } else {
      if (prixMinNum < PRIX_PLANCHER) {
        erreurs.push(`Le prix minimum doit être d'au moins ${formaterPrix(PRIX_PLANCHER)} DJF`)
      }
      if (prixMaxNum > PRIX_PLAFOND) {
        erreurs.push(`Le prix maximum ne peut pas dépasser ${formaterPrix(PRIX_PLAFOND)} DJF`)
      }
      if (prixMinNum > prixMaxNum) {
        erreurs.push('Le prix minimum ne peut pas être supérieur au maximum')
      }
      if (prixMaxNum - prixMinNum < 5000) {
        erreurs.push('La fourchette doit être d\'au moins 5 000 DJF')
      }
    }

    return {
      valide: erreurs.length === 0,
      erreurs,
    }
  }, [prixMin, prixMax, prixMinNum, prixMaxNum])

  // ============================================================
  // ACTIONS
  // ============================================================

  const modifierPrixMin = (valeur: string) => {
    const clean = valeur.replace(/\D/g, '').slice(0, 6)
    setPrixMin(clean)
    setModifications(true)
  }

  const modifierPrixMax = (valeur: string) => {
    const clean = valeur.replace(/\D/g, '').slice(0, 6)
    setPrixMax(clean)
    setModifications(true)
  }

  const appliquerSuggestion = (min: number, max: number) => {
    setPrixMin(min.toString())
    setPrixMax(max.toString())
    setModifications(true)
    setSucces('💡 Suggestion appliquée !')
    setTimeout(() => setSucces(''), 2500)
  }

  const enregistrer = async () => {
    if (!validation.valide) {
      setErreur(validation.erreurs[0])
      return
    }

    setSauvegarde(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('professeurs')
        .update({
          prix_min: prixMinNum,
          prix_max: prixMaxNum,
        })
        .eq('id', user.id)

      if (error) throw error

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'modifier_tarifs',
        details: `Tarifs : ${formaterPrix(prixMinNum)} - ${formaterPrix(prixMaxNum)} DJF`,
      })

      setDerniereModif(new Date().toISOString())
      setModifications(false)
      setSucces('✅ Tarifs enregistrés !')
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSauvegarde(false)
    }
  }

  const annuler = () => {
    if (!confirm('⚠️ Annuler les modifications ?')) return
    charger()
    setModifications(false)
    setErreur('')
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) => {
    const d = new Date(date)
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffJ = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'À l\'instant'
    if (diffMin < 60) return `Il y a ${diffMin} min`
    if (diffH < 24) return `Il y a ${diffH}h`
    if (diffJ < 7) return `Il y a ${diffJ}j`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm">Chargement de vos tarifs...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="space-y-6 pb-32">
      <Link
        href="/espace-professeur"
        className="text-sm text-slate-500 hover:text-emerald-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* ============================================================ */}
      {/* HEADER HERO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${categorie?.couleur || 'from-emerald-600 via-teal-600 to-blue-700'} rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden`}
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-60px] left-[-60px] w-56 h-56 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">💰 Mes tarifs</h1>
                {categorie && (
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black border border-white/30">
                    {categorie.emoji} {categorie.label.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-sm">
                🔒 Ces prix sont <strong>privés</strong> et invisibles aux parents
              </p>
            </div>
            <button
              onClick={enregistrer}
              disabled={sauvegarde || !modifications || !validation.valide}
              className={`px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                modifications && validation.valide
                  ? 'bg-white text-emerald-700 hover:shadow-xl'
                  : 'bg-white/20 text-white/60 cursor-not-allowed'
              }`}
            >
              {sauvegarde ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full"
                  />
                  Sauvegarde...
                </span>
              ) : modifications ? (
                '💾 Enregistrer'
              ) : (
                '✓ À jour'
              )}
            </button>
          </div>

          {/* Prix actuels */}
          {prixMoyen > 0 && (
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-[10px] font-black uppercase opacity-90">Minimum</div>
                <div className="text-2xl font-black">{formaterPrix(prixMinNum)}</div>
                <div className="text-[10px] opacity-80">DJF / mois</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-[10px] font-black uppercase opacity-90">Moyen</div>
                <div className="text-2xl font-black">{formaterPrix(prixMoyen)}</div>
                <div className="text-[10px] opacity-80">DJF / mois</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-[10px] font-black uppercase opacity-90">Maximum</div>
                <div className="text-2xl font-black">{formaterPrix(prixMaxNum)}</div>
                <div className="text-[10px] opacity-80">DJF / mois</div>
              </div>
            </div>
          )}

          {derniereModif && (
            <div className="mt-4 text-xs opacity-90">
              🕒 Dernière modification : {formaterDate(derniereModif)}
            </div>
          )}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* MESSAGES */}
      {/* ============================================================ */}

      <AnimatePresence>
        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <span className="text-xl">✅</span>
            <p className="text-emerald-800 text-sm font-bold">{succes}</p>
          </motion.div>
        )}
        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <span className="text-xl">⚠️</span>
            <p className="text-red-700 text-sm font-medium">{erreur}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* FORMULAIRE PRIX */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">
            💵
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Définir mes tarifs</h2>
            <p className="text-xs text-slate-500">Prix par mois en DJF</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Prix min */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              💰 Prix minimum
            </label>
            <div className={`flex items-center bg-white border-2 rounded-xl transition-all overflow-hidden ${
              validation.erreurs.some((e) => e.includes('minimum'))
                ? 'border-red-500 ring-4 ring-red-200'
                : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-200'
            }`}>
              <input
                type="text"
                inputMode="numeric"
                value={prixMin}
                onChange={(e) => modifierPrixMin(e.target.value)}
                placeholder="15000"
                className="flex-1 px-4 py-3.5 outline-none font-bold text-slate-900 text-lg"
                style={{ color: '#1e293b' }}
              />
              <div className="px-4 py-3.5 bg-slate-100 border-l border-slate-200 font-bold text-slate-700 text-sm">
                DJF
              </div>
            </div>
            {prixMinNum > 0 && (
              <p className="text-xs text-emerald-700 font-bold mt-2">
                ✓ {formaterPrix(prixMinNum)} DJF
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-1">
              Minimum requis : {formaterPrix(PRIX_PLANCHER)} DJF
            </p>
          </div>

          {/* Prix max */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              💰 Prix maximum
            </label>
            <div className={`flex items-center bg-white border-2 rounded-xl transition-all overflow-hidden ${
              validation.erreurs.some((e) => e.includes('maximum') || e.includes('supérieur'))
                ? 'border-red-500 ring-4 ring-red-200'
                : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-200'
            }`}>
              <input
                type="text"
                inputMode="numeric"
                value={prixMax}
                onChange={(e) => modifierPrixMax(e.target.value)}
                placeholder="35000"
                className="flex-1 px-4 py-3.5 outline-none font-bold text-slate-900 text-lg"
                style={{ color: '#1e293b' }}
              />
              <div className="px-4 py-3.5 bg-slate-100 border-l border-slate-200 font-bold text-slate-700 text-sm">
                DJF
              </div>
            </div>
            {prixMaxNum > 0 && (
              <p className="text-xs text-emerald-700 font-bold mt-2">
                ✓ {formaterPrix(prixMaxNum)} DJF
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-1">
              Maximum autorisé : {formaterPrix(PRIX_PLAFOND)} DJF
            </p>
          </div>
        </div>

        {/* Erreurs de validation */}
        {!validation.valide && (prixMinNum > 0 || prixMaxNum > 0) && (
          <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-3">
            {validation.erreurs.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                <span>⚠️</span>
                <span>{e}</span>
              </div>
            ))}
          </div>
        )}

        {/* Calculatrice auto */}
        {prixMoyen > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-5 border border-blue-200"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500 mb-1">
                  💎 Prix moyen calculé
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {formaterPrix(prixMoyen)} <span className="text-sm font-bold text-slate-500">DJF/mois</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500 mb-1">
                  📊 Fourchette
                </div>
                <div className="text-lg font-black text-slate-900">
                  {formaterPrix(prixMaxNum - prixMinNum)} DJF
                </div>
                <div className="text-[10px] text-slate-500">
                  {prixMaxNum - prixMinNum < 10000
                    ? 'Fourchette serrée ✓'
                    : prixMaxNum - prixMinNum < 20000
                    ? 'Fourchette normale'
                    : '⚠️ Fourchette large'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* COMPARAISON MARCHÉ */}
      {/* ============================================================ */}

      {marche.count >= 5 && prixMoyen > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
              📊
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Ma position vs marché</h2>
              <p className="text-xs text-slate-500">
                Basé sur {marche.count} profs vérifiés
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{formaterPrix(marche.min)} DJF</span>
              <span className="font-black">Moyenne marché : {formaterPrix(marche.moyenne)} DJF</span>
              <span>{formaterPrix(marche.max)} DJF</span>
            </div>

            <div className="relative h-12 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center">
                <div className="w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full" />
              </div>

              {/* Marqueur moyenne */}
              <motion.div
                initial={{ left: 0 }}
                animate={{
                  left: `${Math.min(
                    Math.max(
                      ((marche.moyenne - marche.min) / (marche.max - marche.min)) * 100,
                      0
                    ),
                    100
                  )}%`,
                }}
                transition={{ duration: 0.8 }}
                className="absolute top-0 bottom-0 w-1 bg-slate-900"
                style={{ transform: 'translateX(-50%)' }}
              />

              {/* Marqueur toi */}
              <motion.div
                initial={{ left: 0 }}
                animate={{
                  left: `${Math.min(
                    Math.max(
                      ((prixMoyen - marche.min) / (marche.max - marche.min)) * 100,
                      0
                    ),
                    100
                  )}%`,
                }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg"
                style={{ transform: 'translateX(-50%)' }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black whitespace-nowrap">
                  TOI
                </div>
              </motion.div>
            </div>

            <div className={`rounded-2xl p-4 border-2 ${
              ecartPourcentage > 20
                ? 'bg-amber-50 border-amber-200'
                : ecartPourcentage < -20
                ? 'bg-blue-50 border-blue-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="text-xs font-black uppercase text-slate-600 mb-1">
                Ton positionnement
              </div>
              <div className="text-sm font-bold text-slate-800">
                {ecartPourcentage > 20 && (
                  <>📈 Tu es {ecartPourcentage}% au-dessus du marché. Justifie tes prix par ton expérience.</>
                )}
                {ecartPourcentage < -20 && (
                  <>📉 Tu es {Math.abs(ecartPourcentage)}% en dessous du marché. Tu pourrais augmenter un peu.</>
                )}
                {ecartPourcentage >= -20 && ecartPourcentage <= 20 && (
                  <>✅ Ton prix est bien aligné sur le marché ({ecartPourcentage > 0 ? '+' : ''}{ecartPourcentage}%).</>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SUGGESTIONS RAPIDES */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl shadow-lg">
            ⚡
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Suggestions rapides</h2>
            <p className="text-xs text-slate-500">Appliquer en 1 clic</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {[
            {
              label: 'Débutant',
              emoji: '🌱',
              min: 10000,
              max: 20000,
              couleur: 'from-emerald-500 to-teal-600',
              desc: 'Pour attirer les premiers clients',
            },
            {
              label: 'Recommandé',
              emoji: '💎',
              min: 15000,
              max: 35000,
              couleur: 'from-blue-500 to-indigo-600',
              desc: 'Le plus populaire sur la plateforme',
            },
            {
              label: 'Premium',
              emoji: '👑',
              min: 25000,
              max: 50000,
              couleur: 'from-purple-500 to-pink-600',
              desc: 'Pour les profs expérimentés',
            },
          ].map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => appliquerSuggestion(s.min, s.max)}
              className={`bg-gradient-to-br ${s.couleur} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all text-left`}
            >
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="font-black text-sm mb-1">{s.label}</div>
              <div className="text-xs font-bold mb-2">
                {formaterPrix(s.min)} - {formaterPrix(s.max)} DJF
              </div>
              <div className="text-[10px] opacity-90">{s.desc}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SIMULATEUR DE REVENUS */}
      {/* ============================================================ */}

      {simulateur && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
        >
          <motion.div
            className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-4xl">💡</div>
              <div>
                <h2 className="text-xl font-black">Simulation de revenus</h2>
                <p className="text-xs text-purple-100">
                  Si tu as 3 élèves à {formaterPrix(prixMoyen)} DJF/mois
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="text-[10px] font-black uppercase opacity-90 mb-1">
                  📅 Par mois
                </div>
                <div className="text-3xl font-black">
                  {formaterPrix(simulateur.revenusMois)}
                </div>
                <div className="text-xs opacity-80 mt-1">DJF</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="text-[10px] font-black uppercase opacity-90 mb-1">
                  🎯 Par an
                </div>
                <div className="text-3xl font-black">
                  {formaterPrix(simulateur.revenusAnnee)}
                </div>
                <div className="text-xs opacity-80 mt-1">DJF</div>
              </div>
            </div>

            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-[11px] text-purple-100 italic">
                💡 Avec 5 élèves : {formaterPrix(prixMoyen * 5)} DJF/mois — avec 10 élèves :{' '}
                {formaterPrix(prixMoyen * 10)} DJF/mois
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* COACH IA */}
      {/* ============================================================ */}

      {conseils.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg">
              🤖
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">Coach IA</h3>
              <p className="text-xs text-slate-500">Conseils personnalisés</p>
            </div>
          </div>

          <div className="space-y-2">
            {conseils.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`rounded-xl p-3 border-2 flex items-start gap-3 ${
                  c.priorite === 'haute'
                    ? 'bg-red-50 border-red-200'
                    : c.priorite === 'moyenne'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-purple-100'
                }`}
              >
                <span className="text-xl flex-shrink-0">{c.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-800 font-medium">{c.texte}</p>
                </div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase flex-shrink-0 ${
                    c.priorite === 'haute'
                      ? 'bg-red-500 text-white'
                      : c.priorite === 'moyenne'
                      ? 'bg-amber-500 text-white'
                      : 'bg-purple-200 text-purple-700'
                  }`}
                >
                  {c.priorite}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* INFO CONFIDENTIALITÉ */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div>
            <p className="text-sm font-bold text-amber-900 mb-1">
              Confidentialité garantie
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Ces prix sont <strong>invisibles pour les parents</strong>. Ils servent
              uniquement à notre équipe pour valider votre profil et vous proposer les
              meilleures opportunités. Les prix définitifs se <strong>négocient
              directement</strong> avec le parent après la rencontre.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* BARRE STICKY */}
      {/* ============================================================ */}

      <AnimatePresence>
        {modifications && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-emerald-500 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-bold text-slate-800 text-sm">
                  Modifications non enregistrées
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={annuler}
                  disabled={sauvegarde}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrer}
                  disabled={sauvegarde || !validation.valide}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {sauvegarde ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Sauvegarde...
                    </>
                  ) : (
                    <>💾 Enregistrer</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}