'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// COMPOSANT
// ============================================================

export default function MotDePasseOublie() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!email.trim()) {
      setErreur('Veuillez entrer votre email')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErreur('Veuillez entrer un email valide')
      return
    }

    setLoading(true)
    setErreur('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/mot-de-passe-oublie/nouveau`,
        }
      )

      if (error) {
        if (error.message.includes('rate limit')) {
          setErreur('Trop de tentatives. Attendez quelques minutes.')
        } else {
          setErreur(`Erreur : ${error.message}`)
        }
        setLoading(false)
        return
      }

      setSucces(true)
      setEmail('')
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Blobs animés */}
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-emerald-300/30 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Lien retour */}
      <Link
        href="/login"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors text-sm font-medium"
      >
        ← Retour à la connexion
      </Link>

      {/* Lien aide */}
      <a
        href="https://wa.me/25377741482"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-6 right-6 z-20 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
      >
        💬 Aide
      </a>

      {/* Carte principale */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white text-4xl shadow-2xl mb-4"
          >
            🔐
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* Carte glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl shadow-blue-900/10 p-8"
        >
          <AnimatePresence mode="wait">
            {!succes ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={envoyer}
                className="space-y-5"
              >
                {/* Info box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-xl">
                  <p className="text-xs text-blue-800">
                    💡 Un email contenant un lien de réinitialisation vous sera envoyé. Pensez à vérifier vos spams.
                  </p>
                </div>

                {/* Erreur */}
                {erreur && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <span className="text-xl">⚠️</span>
                    <p className="text-red-700 text-sm font-medium">{erreur}</p>
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    📧 Votre email
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      ✉️
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      autoComplete="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Bouton */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Envoi en cours...
                    </>
                  ) : (
                    <>📧 Envoyer le lien</>
                  )}
                </motion.button>

                {/* Séparateur */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white/80 px-3 text-slate-500 font-medium">
                      OU
                    </span>
                  </div>
                </div>

                {/* Retour connexion */}
                <Link
                  href="/login"
                  className="block w-full py-4 rounded-2xl font-bold text-center text-blue-700 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
                >
                  🔓 Retour à la connexion
                </Link>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl shadow-2xl"
                >
                  ✓
                </motion.div>

                <h2 className="text-2xl font-black text-slate-900 mb-3">
                  Email envoyé !
                </h2>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes.
                </p>

                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-xs text-amber-800 font-bold mb-2">
                    📬 Vous ne recevez rien ?
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Vérifiez votre dossier <strong>Spam</strong> ou <strong>Courrier indésirable</strong></li>
                    <li>Attendez 2-3 minutes</li>
                    <li>Vérifiez que l'email est correctement écrit</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setSucces(false)}
                    className="w-full py-3.5 rounded-2xl font-bold text-blue-700 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-all"
                  >
                    🔄 Essayer un autre email
                  </button>

                  <a
                    href="https://wa.me/25377741482"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    💬 Contacter le support
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span>🔒</span>
              <span>Connexion sécurisée</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🇩🇯</span>
              <span>100% djiboutien</span>
            </div>
          </div>
          <a
            href="https://wa.me/25377741482"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-2"
          >
            💬 Besoin d'aide ? Contactez-nous sur WhatsApp
          </a>
        </div>
      </motion.div>
    </div>
  )
}