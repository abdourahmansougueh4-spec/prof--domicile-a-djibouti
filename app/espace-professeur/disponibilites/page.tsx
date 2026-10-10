'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Jour = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'

type Creneau = 'matin' | 'apres_midi' | 'soir'

type Disponibilite = {
  id: string
  jour: Jour
  creneau: Creneau
}

type DemandeRecente = {
  jour_souhaite: string | null
  creneau_souhaite: string | null
  created_at: string
}

// ============================================================
// CONFIG
// ============================================================

const JOURS: Jour[] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
]

const JOURS_WEEKEND: Jour[] = ['Samedi', 'Dimanche']

const CRENEAUX: { val: Creneau; label: string; horaire: string; emoji: string; couleur: string }[] = [
  { val: 'matin', label: 'Matin', horaire: '8h - 12h', emoji: '🌅', couleur: 'from-amber-400 to-yellow-500' },
  { val: 'apres_midi', label: 'Après-midi', horaire: '12h - 17h', emoji: '☀️', couleur: 'from-orange-400 to-red-500' },
  { val: 'soir', label: 'Soir', horaire: '17h - 21h', emoji: '🌙', couleur: 'from-indigo-400 to-purple-600' },
]

const MIN_CRENEAUX_REQUIS = 6

// ============================================================
// HELPER : Générer une clé unique pour un créneau
// ============================================================

const getKey = (jour: Jour, creneau: Creneau) => `${jour}|${creneau}`

// ============================================================
// HELPER : Conseils IA selon les dispos
// ============================================================

const genererConseils = (
  dispos: Set<string>,
  demandesPopulaires: { jour: string; count: number }[]
): { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  const total = dispos.size

  if (total === 0) {
    conseils.push({
      emoji: '🚨',
      texte: 'Sélectionnez au moins 6 créneaux pour commencer à recevoir des demandes.',
      priorite: 'haute',
    })
    return conseils
  }

  if (total < MIN_CRENEAUX_REQUIS) {
    conseils.push({
      emoji: '⚠️',
      texte: `Il vous manque ${MIN_CRENEAUX_REQUIS - total} créneaux pour atteindre le minimum recommandé.`,
      priorite: 'haute',
    })
  }

  // Vérifier weekend
  const aSamedi = JOURS.filter((j) => j === 'Samedi').some((j) =>
    ['matin', 'apres_midi', 'soir'].some((c) => dispos.has(getKey(j as Jour, c as Creneau)))
  )
  const aDimanche = JOURS.filter((j) => j === 'Dimanche').some((j) =>
    ['matin', 'apres_midi', 'soir'].some((c) => dispos.has(getKey(j as Jour, c as Creneau)))
  )

  if (!aSamedi) {
    conseils.push({
      emoji: '📅',
      texte: 'Le samedi est très demandé par les parents. Ajoutez des créneaux ce jour.',
      priorite: 'moyenne',
    })
  }

  if (!aDimanche) {
    conseils.push({
      emoji: '📅',
      texte: 'Le dimanche matin est aussi populaire. Pensez-y !',
      priorite: 'basse',
    })
  }

  // Vérifier soir
  const aSoir = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].some((j) =>
    dispos.has(getKey(j as Jour, 'soir'))
  )
  if (!aSoir) {
    conseils.push({
      emoji: '🌙',
      texte: 'Les créneaux du soir (17h-21h) sont les plus demandés en semaine.',
      priorite: 'moyenne',
    })
  }

  // Conseils basés sur les jours populaires
  demandesPopulaires.slice(0, 2).forEach((d) => {
    const jour = d.jour as Jour
    const hasJour = ['matin', 'apres_midi', 'soir'].some((c) =>
      dispos.has(getKey(jour, c as Creneau))
    )
    if (!hasJour && d.count >= 2) {
      conseils.push({
        emoji: '🔥',
        texte: `${d.count} parents ont demandé le ${jour}. Ajoutez des créneaux ce jour !`,
        priorite: 'haute',
      })
    }
  })

  // Si aucun conseil
  if (conseils.length === 0) {
    conseils.push({
      emoji: '✨',
      texte: `Excellent ! Vous avez ${total} créneaux répartis intelligemment.`,
      priorite: 'basse',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// HELPER : Stats par jour
// ============================================================

const calculerStatsParJour = (dispos: Set<string>) => {
  return JOURS.map((jour) => {
    const count = CRENEAUX.filter((c) => dispos.has(getKey(jour, c.val))).length
    return { jour, count }
  })
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function DisponibilitesProfesseur() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [loading, setLoading] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [modifications, setModifications] = useState(false)
  const [derniereModif, setDerniereModif] = useState<string | null>(null)

  const [dispos, setDispos] = useState<Set<string>>(new Set())
  const [demandesPopulaires, setDemandesPopulaires] = useState<{ jour: string; count: number }[]>([])

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

      // Charger les dispos du prof
      const { data: disposData, error: disposError } = await supabase
        .from('disponibilites')
        .select('id, jour, creneau, created_at')
        .eq('professeur_id', user.id)

      if (disposError) throw disposError

      const nouvellesDispos = new Set<string>()
      let derniereDate: string | null = null

      ;(disposData || []).forEach((d) => {
        if (d.jour && d.creneau) {
          nouvellesDispos.add(getKey(d.jour as Jour, d.creneau as Creneau))
        }
        if (d.created_at) {
          if (!derniereDate || new Date(d.created_at) > new Date(derniereDate)) {
            derniereDate = d.created_at
          }
        }
      })

      setDispos(nouvellesDispos)
      setDerniereModif(derniereDate)

      // Charger les jours populaires (depuis les demandes)
      const { data: demandesData } = await supabase
        .from('demandes')
        .select('jour_souhaite, creneau_souhaite, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      // Compter par jour
      const compteur: { [jour: string]: number } = {}
      ;(demandesData || []).forEach((d) => {
        if (d.jour_souhaite) {
          compteur[d.jour_souhaite] = (compteur[d.jour_souhaite] || 0) + 1
        }
      })

      const populaires = Object.entries(compteur)
        .map(([jour, count]) => ({ jour, count }))
        .sort((a, b) => b.count - a.count)

      setDemandesPopulaires(populaires)
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
  // CALCULS
  // ============================================================

  const total = dispos.size
  const atteintMinimum = total >= MIN_CRENEAUX_REQUIS
  const pourcentage = Math.min(Math.round((total / MIN_CRENEAUX_REQUIS) * 100), 100)
  const statsParJour = useMemo(() => calculerStatsParJour(dispos), [dispos])
  const conseils = useMemo(() => genererConseils(dispos, demandesPopulaires), [dispos, demandesPopulaires])

  const meilleurJour = useMemo(() => {
    const max = Math.max(...statsParJour.map((s) => s.count))
    if (max === 0) return null
    return statsParJour.find((s) => s.count === max)
  }, [statsParJour])

  // ============================================================
  // ACTIONS
  // ============================================================

  const toggle = (jour: Jour, creneau: Creneau) => {
    const key = getKey(jour, creneau)
    const nouveau = new Set(dispos)
    if (nouveau.has(key)) {
      nouveau.delete(key)
    } else {
      nouveau.add(key)
    }
    setDispos(nouveau)
    setModifications(true)
  }

  const toutSelectionner = () => {
    if (!confirm(`⚠️ Sélectionner tous les créneaux (${JOURS.length * CRENEAUX.length}) ?`)) return
    const nouveau = new Set<string>()
    JOURS.forEach((j) => {
      CRENEAUX.forEach((c) => {
        nouveau.add(getKey(j, c.val))
      })
    })
    setDispos(nouveau)
    setModifications(true)
  }

  const toutEffacer = () => {
    if (total === 0) return
    if (!confirm(`⚠️ Effacer tous vos créneaux (${total}) ?`)) return
    setDispos(new Set())
    setModifications(true)
  }

  const copierJour = (jourSource: Jour) => {
    const creneauxJour = CRENEAUX.filter((c) => dispos.has(getKey(jourSource, c.val))).map((c) => c.val)
    if (creneauxJour.length === 0) {
      alert(`Aucun créneau sélectionné pour ${jourSource}`)
      return
    }

    const cible = prompt(
      `Copier les ${creneauxJour.length} créneau(x) de ${jourSource} vers :\n\n${JOURS.filter((j) => j !== jourSource).join(', ')}`
    )

    if (!cible) return

    const jourCible = JOURS.find((j) => j.toLowerCase() === cible.toLowerCase())
    if (!jourCible || jourCible === jourSource) {
      alert('Jour invalide')
      return
    }

    const nouveau = new Set(dispos)
    creneauxJour.forEach((c) => {
      nouveau.add(getKey(jourCible, c))
    })
    setDispos(nouveau)
    setModifications(true)
    setSucces(`✅ Créneaux copiés vers ${jourCible}`)
    setTimeout(() => setSucces(''), 3000)
  }

  const viderJour = (jour: Jour) => {
    const count = statsParJour.find((s) => s.jour === jour)?.count || 0
    if (count === 0) return
    if (!confirm(`Effacer les ${count} créneau(x) de ${jour} ?`)) return

    const nouveau = new Set(dispos)
    CRENEAUX.forEach((c) => {
      nouveau.delete(getKey(jour, c.val))
    })
    setDispos(nouveau)
    setModifications(true)
  }

  const enregistrer = async () => {
    if (total < MIN_CRENEAUX_REQUIS) {
      setErreur(`Minimum ${MIN_CRENEAUX_REQUIS} créneaux requis. Actuellement : ${total}.`)
      return
    }

    setSauvegarde(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Supprimer les anciennes dispos
      const { error: deleteError } = await supabase
        .from('disponibilites')
        .delete()
        .eq('professeur_id', user.id)

      if (deleteError) throw deleteError

      // Insérer les nouvelles
      const disposData = Array.from(dispos).map((key) => {
        const [jour, creneau] = key.split('|')
        return {
          professeur_id: user.id,
          jour,
          creneau,
        }
      })

      if (disposData.length > 0) {
        const { error: insertError } = await supabase
          .from('disponibilites')
          .insert(disposData)

        if (insertError) throw insertError
      }

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'modifier_disponibilites',
        details: `${disposData.length} créneaux enregistrés`,
      })

      setDerniereModif(new Date().toISOString())
      setModifications(false)
      setSucces(`✅ ${disposData.length} créneaux enregistrés !`)
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

  const getCouleurJour = (jour: Jour) => {
    if (JOURS_WEEKEND.includes(jour)) return 'from-pink-500 to-rose-600'
    return 'from-blue-500 to-indigo-600'
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
        <p className="text-slate-500 text-sm">Chargement de vos disponibilités...</p>
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
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">📅 Mes disponibilités</h1>
                {atteintMinimum && (
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-black border border-white/30">
                    ✓ VALIDÉ
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-sm">
                Sélectionnez vos créneaux pour recevoir des demandes
              </p>
            </div>
            <button
              onClick={enregistrer}
              disabled={sauvegarde || !modifications}
              className={`px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                modifications
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

          {/* Compteur intelligent */}
          <div className={`rounded-2xl p-4 border-2 ${
            atteintMinimum
              ? 'bg-emerald-500/20 border-emerald-300/40'
              : 'bg-amber-500/20 border-amber-300/40'
          }`}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{atteintMinimum ? '✅' : '⏳'}</span>
                <div>
                  <div className="font-black text-lg">
                    {total} créneau{total > 1 ? 'x' : ''} sélectionné{total > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs opacity-90">
                    {atteintMinimum
                      ? 'Vous êtes visible pour les parents !'
                      : `Il vous manque ${MIN_CRENEAUX_REQUIS - total} créneau(x) pour être visible`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black">{pourcentage}%</div>
                <div className="text-[10px] opacity-90">
                  {total}/{MIN_CRENEAUX_REQUIS}
                </div>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pourcentage}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full ${
                  atteintMinimum
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                }`}
              />
            </div>
          </div>
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
      {/* DERNIÈRE MODIFICATION */}
      {/* ============================================================ */}

      {derniereModif && (
        <div className="text-xs text-slate-500 text-center">
          🕒 Dernière modification : {formaterDate(derniereModif)}
        </div>
      )}

      {/* ============================================================ */}
      {/* ACTIONS RAPIDES */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-lg"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-slate-500 uppercase mr-2">
            ⚡ Actions rapides :
          </span>
          <button
            onClick={toutSelectionner}
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            ✅ Tout sélectionner
          </button>
          <button
            onClick={toutEffacer}
            disabled={total === 0}
            className="px-3 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-xs border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            🗑️ Tout effacer
          </button>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* CALENDRIER HEBDO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {JOURS.map((jour, idx) => {
          const countJour = statsParJour.find((s) => s.jour === jour)?.count || 0
          const isWeekend = JOURS_WEEKEND.includes(jour)

          return (
            <motion.div
              key={jour}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.03 }}
              className={`bg-white/80 backdrop-blur-xl rounded-2xl p-4 border-2 shadow-lg transition-all ${
                countJour > 0
                  ? 'border-emerald-300'
                  : 'border-white/80'
              }`}
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCouleurJour(jour)} flex items-center justify-center text-white font-black text-sm shadow-lg`}
                  >
                    {jour.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                      {jour}
                      {isWeekend && (
                        <span className="text-[9px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-black">
                          🔥 DEMANDÉ
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {countJour > 0
                        ? `${countJour} créneau${countJour > 1 ? 'x' : ''} sélectionné${countJour > 1 ? 's' : ''}`
                        : 'Aucun créneau'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {countJour > 0 && (
                    <button
                      onClick={() => copierJour(jour)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors"
                      title="Copier vers un autre jour"
                    >
                      📋 Copier
                    </button>
                  )}
                  {countJour > 0 && (
                    <button
                      onClick={() => viderJour(jour)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
                      title="Vider ce jour"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Créneaux */}
              <div className="grid grid-cols-3 gap-2">
                {CRENEAUX.map((c) => {
                  const actif = dispos.has(getKey(jour, c.val))
                  return (
                    <motion.button
                      key={c.val}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggle(jour, c.val)}
                      className={`relative p-3 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                        actif
                          ? `bg-gradient-to-br ${c.couleur} text-white shadow-lg border-2 border-white/30`
                          : 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      {actif && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-emerald-600"
                        >
                          <svg
                            className="w-2.5 h-2.5 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={4}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </motion.div>
                      )}
                      <span className="text-xl">{c.emoji}</span>
                      <span className="font-black">{c.label}</span>
                      <span
                        className={`text-[9px] ${
                          actif ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        {c.horaire}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ============================================================ */}
      {/* STATS PAR JOUR */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
            📊
          </div>
          <div>
            <h3 className="font-black text-slate-900">Répartition par jour</h3>
            <p className="text-[10px] text-slate-500">Aperçu de vos créneaux</p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 h-32">
          {statsParJour.map((s) => {
            const maxCount = Math.max(...statsParJour.map((x) => x.count), 1)
            const height = (s.count / maxCount) * 100
            return (
              <div key={s.jour} className="flex-1 flex flex-col items-center group">
                <div className="text-[9px] text-slate-500 font-black mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {s.count}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 4)}%` }}
                  transition={{ duration: 0.5 }}
                  className={`w-full rounded-t-md ${
                    s.count > 0
                      ? 'bg-gradient-to-t from-cyan-500 to-blue-400'
                      : 'bg-slate-200'
                  }`}
                />
                <div className="text-[9px] text-slate-400 font-bold mt-1">
                  {s.jour.slice(0, 3)}
                </div>
              </div>
            )
          })}
        </div>

        {meilleurJour && meilleurJour.count > 0 && (
          <div className="mt-4 text-center text-xs text-slate-600">
            🔥 Jour le plus chargé : <strong className="text-slate-900">{meilleurJour.jour}</strong>{' '}
            ({meilleurJour.count} créneau{meilleurJour.count > 1 ? 'x' : ''})
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* CONSEILS COACH IA */}
      {/* ============================================================ */}

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
            <p className="text-xs text-slate-500">Optimisez vos disponibilités</p>
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

      {/* ============================================================ */}
      {/* APERÇU PUBLIC */}
      {/* ============================================================ */}

      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">
              👁️
            </div>
            <div>
              <h3 className="font-black text-slate-900">Ce que voient les parents</h3>
              <p className="text-[10px] text-slate-500">Aperçu de votre planning public</p>
            </div>
          </div>

          <div className="space-y-2">
            {JOURS.filter((jour) => {
              return CRENEAUX.some((c) => dispos.has(getKey(jour, c.val)))
            }).map((jour) => {
              const creneauxJour = CRENEAUX.filter((c) => dispos.has(getKey(jour, c.val)))
              return (
                <div
                  key={jour}
                  className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200"
                >
                  <span className="font-black text-slate-700 text-sm w-24 flex-shrink-0">
                    {jour}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {creneauxJour.map((c) => (
                      <span
                        key={c.val}
                        className={`text-[10px] bg-gradient-to-r ${c.couleur} text-white px-3 py-1 rounded-full font-black shadow`}
                      >
                        {c.emoji} {c.horaire}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* INFO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">
              Conseil pour maximiser vos chances
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Plus vous avez de créneaux, plus vous recevrez de demandes.
              Les parents cherchent surtout des profs disponibles le{' '}
              <strong>samedi</strong>, les <strong>soirs en semaine</strong> (17h-21h),
              et le <strong>dimanche matin</strong>.
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
                  Modifications non enregistrées ({total} créneaux)
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
                  disabled={sauvegarde || total < MIN_CRENEAUX_REQUIS}
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