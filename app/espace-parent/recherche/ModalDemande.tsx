'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

type Prof = {
  id: string
  nom_complet: string
  photo_url: string | null
  matieres: string[]
  disponibilites: { jour: string; creneau: string }[]
}

const creneauxLabels: { [key: string]: string } = {
  matin: 'Matin (8h-12h)',
  apres_midi: 'Après-midi (12h-17h)',
  soir: 'Soir (17h-21h)',
}

const joursOrdre = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
]

const labelsMatieres: { [key: string]: string } = {
  primaire_fr: 'Primaire — Toutes matières francophones',
  primaire_ar: 'Primaire — Arabe',
  college_maths: 'Collège — Maths',
  college_physique: 'Collège — Physique-Chimie',
  college_svt: 'Collège — SVT',
  college_francais: 'Collège — Français',
  college_anglais: 'Collège — Anglais',
  college_arabe: 'Collège — Arabe',
  lycee_maths: 'Lycée — Maths',
  arabe: 'Arabe',
  coran: 'Coran',
  francais: 'Français',
  anglais: 'Anglais',
}

const labelsNiveaux: { [key: string]: string } = {
  primaire: '🎒 Primaire',
  college: '📖 Collège',
  lycee: '🎓 Lycée',
}

const extraireNiveaux = (matieres: string[]) => {
  const niveaux = new Set<string>()
  matieres.forEach((m) => {
    if (m.startsWith('primaire_')) niveaux.add('primaire')
    if (m.startsWith('college_')) niveaux.add('college')
    if (m.startsWith('lycee_')) niveaux.add('lycee')
  })
  return Array.from(niveaux)
}

export default function ModalDemande({
  prof,
  onClose,
}: {
  prof: Prof
  onClose: () => void
}) {
  const supabase = createClient()

  const [nombreEnfants, setNombreEnfants] = useState(1)
  const [matieresChoisies, setMatieresChoisies] = useState<string[]>([])
  const [niveauxChoisis, setNiveauxChoisis] = useState<string[]>([])
  const [prixSouhaite, setPrixSouhaite] = useState('')
  const [creneauxChoisis, setCreneauxChoisis] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  const niveauxDisponibles = extraireNiveaux(prof.matieres)
  const creneauxProposes = prof.disponibilites || []

  const toggleMatiere = (m: string) => {
    setMatieresChoisies(
      matieresChoisies.includes(m)
        ? matieresChoisies.filter((x) => x !== m)
        : [...matieresChoisies, m]
    )
  }

  const toggleNiveau = (n: string) => {
    setNiveauxChoisis(
      niveauxChoisis.includes(n)
        ? niveauxChoisis.filter((x) => x !== n)
        : [...niveauxChoisis, n]
    )
  }

  const toggleCreneau = (jour: string, creneau: string) => {
    const cle = `${jour}|${creneau}`
    setCreneauxChoisis(
      creneauxChoisis.includes(cle)
        ? creneauxChoisis.filter((x) => x !== cle)
        : [...creneauxChoisis, cle]
    )
  }

  const valider = () => {
    if (matieresChoisies.length === 0) {
      setErreur('Veuillez sélectionner au moins une matière')
      return false
    }
    if (niveauxChoisis.length === 0) {
      setErreur('Veuillez sélectionner au moins un niveau')
      return false
    }
    if (!prixSouhaite || Number(prixSouhaite) <= 0) {
      setErreur('Veuillez indiquer un prix souhaité (en DJF)')
      return false
    }
    if (creneauxChoisis.length === 0) {
      setErreur('Veuillez sélectionner au moins un créneau')
      return false
    }
    setErreur('')
    return true
  }

  const envoyerDemande = async () => {
    if (!valider()) return

    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Vous devez être connecté')
        setLoading(false)
        return
      }

      const messageComplet = `
👶 Nombre d'enfants : ${nombreEnfants}
📚 Matières souhaitées : ${matieresChoisies.map((m) => labelsMatieres[m] || m).join(', ')}
🎓 Niveaux : ${niveauxChoisis.map((n) => labelsNiveaux[n] || n).join(', ')}
💰 Prix souhaité : ${Number(prixSouhaite).toLocaleString()} DJF/mois
📅 Créneaux souhaités : ${creneauxChoisis
        .map((c) => {
          const [j, cr] = c.split('|')
          return `${j} — ${creneauxLabels[cr] || cr}`
        })
        .join(', ')}

💬 Message du parent :
${message.trim() || '(aucun message)'}
      `.trim()

            const response = await fetch('/api/creer-demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: user.id,
          professeurId: prof.id,
          nombreEnfants: nombreEnfants,
          matiere: matieresChoisies.join(', '),
          prixSouhaite: Number(prixSouhaite),
          niveauxSouhaites: niveauxChoisis,
          creneauxSouhaites: creneauxChoisis,
          message: messageComplet,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setErreur(result.error || 'Erreur inconnue')
        setLoading(false)
        return
      }

      setSucces(true)
      setTimeout(() => {
        onClose()
      }, 4000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const prixFormate = prixSouhaite
    ? Number(prixSouhaite).toLocaleString('fr-FR')
    : ''

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl my-8 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">
                📩 Demande à {prof.nom_complet}
              </h2>
              <p className="text-xs text-blue-100 mt-1">
                Remplissez pour nous aider à bien organiser
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {succes ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Demande envoyée !
                </h3>
                <p className="text-slate-600 mb-4">
                  Votre demande a été transmise à l'équipe Prof À Domicile
                  Djibouti. Nous vous contacterons très prochainement par
                  WhatsApp.
                </p>
                <a
                  href="https://wa.me/25377741482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors"
                >
                  💬 Nous contacter maintenant
                </a>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl">
                  <p className="text-xs text-blue-800">
                    🎯 Vous pouvez uniquement choisir les <strong>matières</strong>{' '}
                    et <strong>niveaux</strong> que ce prof propose. Le prix
                    pourra être négocié après la rencontre.
                  </p>
                </div>

                {/* Nombre d'enfants */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    👶 Nombre d'enfants concernés{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setNombreEnfants(Math.max(1, nombreEnfants - 1))
                      }
                      className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-700 text-xl transition-colors"
                    >
                      −
                    </button>
                    <div className="w-20 h-12 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center font-black text-2xl text-slate-900">
                      {nombreEnfants}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNombreEnfants(nombreEnfants + 1)}
                      className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-700 text-xl transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Matières */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📚 Matières souhaitées{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {prof.matieres.map((m) => {
                      const actif = matieresChoisies.includes(m)
                      return (
                        <motion.button
                          key={m}
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => toggleMatiere(m)}
                          className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            actif
                              ? 'border-emerald-600 bg-emerald-50 shadow-lg'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                              actif
                                ? 'bg-emerald-600 border-emerald-600'
                                : 'border-slate-300'
                            }`}
                          >
                            {actif && (
                              <svg
                                className="w-3 h-3 text-white"
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
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {labelsMatieres[m] || m}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Niveaux */}
                {niveauxDisponibles.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      🎓 Niveaux concernés{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {niveauxDisponibles.map((n) => {
                        const actif = niveauxChoisis.includes(n)
                        return (
                          <motion.button
                            key={n}
                            type="button"
                            whileHover={{ scale: actif ? 1.03 : 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleNiveau(n)}
                            className={`py-4 rounded-xl font-bold text-sm transition-all ${
                              actif
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg border-4 border-blue-800'
                                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            {labelsNiveaux[n] || n}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Prix */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    💰 Prix souhaité (DJF / mois){' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-white border-2 border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 transition-all overflow-hidden">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={prixSouhaite}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setPrixSouhaite(val)
                      }}
                      placeholder="Ex : 25000"
                      className="flex-1 px-4 py-3.5 bg-transparent outline-none font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    <div className="px-4 py-3.5 bg-slate-100 border-l border-slate-200 font-bold text-slate-700 flex-shrink-0 text-sm">
                      DJF / mois
                    </div>
                  </div>
                  {prixFormate && (
                    <p className="text-xs text-emerald-700 font-bold mt-2">
                      ✓ {prixFormate} DJF / mois
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    💡 Négociable après la rencontre
                  </p>
                </div>

                {/* Créneaux */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📅 Créneaux souhaités{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {joursOrdre.map((jour) => {
                      const disposJour = creneauxProposes.filter(
                        (d) => d.jour === jour
                      )
                      if (disposJour.length === 0) return null
                      return (
                        <div
                          key={jour}
                          className="bg-slate-50 rounded-xl p-3 border border-slate-200"
                        >
                          <div className="font-bold text-slate-800 text-sm mb-2">
                            {jour}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {disposJour.map((d) => {
                              const cle = `${jour}|${d.creneau}`
                              const actif = creneauxChoisis.includes(cle)
                              return (
                                <motion.button
                                  key={cle}
                                  type="button"
                                  whileHover={{ scale: actif ? 1.03 : 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    toggleCreneau(jour, d.creneau)
                                  }
                                  className={`py-2.5 px-3 rounded-lg font-bold text-xs transition-all ${
                                    actif
                                      ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                                  }`}
                                >
                                  {creneauxLabels[d.creneau] || d.creneau}
                                </motion.button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    💬 Message complémentaire (optionnel)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Ex : Mon fils a besoin de soutien en maths..."
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-800 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {message.length}/500 caractères
                  </p>
                </div>

                {erreur && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                  >
                    <span className="text-xl">⚠️</span>
                    <p className="text-red-700 text-sm font-medium">
                      {erreur}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!succes && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 sticky bottom-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={envoyerDemande}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Envoi...
                </>
              ) : (
                <>📩 Envoyer la demande</>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}