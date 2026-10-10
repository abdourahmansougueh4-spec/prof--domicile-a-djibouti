'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Prof = {
  id: string
  nom_complet: string
  photo_url: string | null
}

export default function SignalerProf() {
  const supabase = createClient()
  const router = useRouter()

  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)

  const [profSelectionne, setProfSelectionne] = useState('')
  const [typeProbleme, setTypeProbleme] = useState('')
  const [motif, setMotif] = useState('')
  const [preuves, setPreuves] = useState('')

  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    chargerProfs()
  }, [])

  const chargerProfs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Récupérer les profs avec qui le parent a une demande acceptée
    const { data: demandes } = await supabase
      .from('demandes')
      .select('professeur_id')
      .eq('parent_id', user.id)
      .eq('statut', 'acceptee')

    const ids = (demandes || []).map((d) => d.professeur_id)

    if (ids.length === 0) {
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nom_complet, photo_url')
      .in('id', ids)

    setProfs(profiles || [])
    setLoading(false)
  }

  const envoyer = async () => {
    if (!profSelectionne) {
      setErreur('Veuillez sélectionner un prof')
      return
    }
    if (!typeProbleme) {
      setErreur('Veuillez sélectionner un type de problème')
      return
    }
    if (motif.trim().length < 20) {
      setErreur('Le motif doit contenir au moins 20 caractères')
      return
    }

    setEnvoi(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const motifComplet = `
🚨 Type : ${typeProbleme}

📝 Motif :
${motif.trim()}

${preuves ? `📎 Preuves / Détails :\n${preuves.trim()}` : ''}
      `.trim()

      const { error } = await supabase.from('signalements').insert({
        signale_par: user.id,
        cible_id: profSelectionne,
        type: typeProbleme,
        motif: motifComplet,
        statut: 'nouveau',
      })

      if (error) throw error

      setSucces(true)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setEnvoi(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-xl"
      >
        <h1 className="text-3xl font-black text-slate-900 mb-1">
          🚨 Signaler un prof
        </h1>
        <p className="text-slate-600 text-sm mb-6">
          Signalez un comportement inapproprié. Toutes les signalements sont
          examinés par notre équipe.
        </p>

        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6">
          <p className="text-xs text-red-800">
            ⚠️ <strong>Important :</strong> Un signalement doit être justifié
            avec un motif clair et des preuves si possible. Les signalements
            abusifs peuvent entraîner des sanctions.
          </p>
        </div>

        {succes ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Signalement envoyé
            </h3>
            <p className="text-slate-600 mb-6">
              Notre équipe va examiner votre signalement dans les plus brefs
              délais.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => {
                  setSucces(false)
                  setProfSelectionne('')
                  setTypeProbleme('')
                  setMotif('')
                  setPreuves('')
                }}
                className="px-5 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Nouveau signalement
              </button>
              <a
                href="https://wa.me/25377741482"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors"
              >
                💬 Contacter l'admin
              </a>
            </div>
          </motion.div>
        ) : profs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚨</div>
            <h3 className="font-black text-slate-900 text-xl mb-2">
              Aucun prof à signaler
            </h3>
            <p className="text-slate-600 text-sm">
              Vous ne pouvez signaler que des profs avec qui vous avez une
              demande acceptée.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                👨‍🏫 Quel prof voulez-vous signaler ?{' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={profSelectionne}
                onChange={(e) => setProfSelectionne(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-medium"
              >
                <option value="">-- Sélectionnez un prof --</option>
                {profs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom_complet}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                🚨 Type de problème <span className="text-red-500">*</span>
              </label>
              <div className="grid md:grid-cols-2 gap-2">
                {[
                  { val: 'absence', label: 'Absences répétées', emoji: '📅' },
                  { val: 'comportement', label: 'Comportement inapproprié', emoji: '⚠️' },
                  { val: 'pedagogie', label: 'Problème de pédagogie', emoji: '📚' },
                  { val: 'violence', label: 'Violence / Menace', emoji: '🚨' },
                  { val: 'argent', label: 'Problème d\'argent', emoji: '💰' },
                  { val: 'autre', label: 'Autre', emoji: '📝' },
                ].map((t) => (
                  <motion.button
                    key={t.val}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTypeProbleme(t.val)}
                    className={`p-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center gap-2 ${
                      typeProbleme === t.val
                        ? 'bg-red-600 text-white border-red-600 shadow-lg'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                📝 Motif détaillé <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Décrivez précisément ce qui s'est passé (dates, faits, contexte)..."
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                {motif.length}/1000 caractères (minimum 20)
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                📎 Preuves / Détails (optionnel)
              </label>
              <textarea
                value={preuves}
                onChange={(e) => setPreuves(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ex : captures d'écran, témoignages..."
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
            </div>

            {erreur && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
              >
                <span className="text-xl">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{erreur}</p>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                disabled={envoi}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={envoyer}
                disabled={envoi}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {envoi ? (
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
                  <>🚨 Envoyer le signalement</>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}