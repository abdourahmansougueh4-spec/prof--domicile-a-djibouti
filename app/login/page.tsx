'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)

  const valider = () => {
    if (!email || !motDePasse) {
      setErreur('Veuillez remplir votre email et votre mot de passe')
      return false
    }
    if (!email.includes('@')) {
      setErreur('Veuillez entrer un email valide')
      return false
    }
    setErreur('')
    return true
  }

  const seConnecter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valider()) return

    setLoading(true)
    setErreur('')

    try {
      // 1. Connexion à Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: motDePasse,
        })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setErreur('Email ou mot de passe incorrect.')
        } else if (authError.message.includes('Email not confirmed')) {
          setErreur(
            "Votre email n'a pas été confirmé. Contactez-nous sur WhatsApp."
          )
        } else {
          setErreur(`Erreur : ${authError.message}`)
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setErreur('Erreur de connexion. Veuillez réessayer.')
        setLoading(false)
        return
      }

      // 2. Récupérer le rôle de l'utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, nom_complet')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profileData) {
        setErreur('Profil introuvable. Contactez-nous.')
        setLoading(false)
        return
      }

      // 3. Rediriger selon le rôle
      const role = profileData.role

      if (role === 'parent') {
        router.push('/espace-parent')
      } else if (role === 'professeur') {
        router.push('/espace-professeur')
      } else if (role === 'admin') {
        router.push('/abdrhmn-zou_2022-2032')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setErreur('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden flex items-center justify-center px-6 py-12">
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
      <motion.div
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-300/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Lien retour */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors text-sm font-medium"
      >
        ← Retour à l'accueil
      </Link>

      {/* Lien aide WhatsApp */}
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
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Bon retour !
          </h1>
          <p className="text-slate-600">
            Connectez-vous à votre espace personnel
          </p>
        </motion.div>

        {/* Carte glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl shadow-blue-900/10 p-8 md:p-10"
        >
          {/* Erreur */}
          <AnimatePresence>
            {erreur && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <span className="text-xl">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{erreur}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={seConnecter} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email
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
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">
                  Mot de passe
                </label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔒
                </span>
                <input
                  type={voirMotDePasse ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setVoirMotDePasse(!voirMotDePasse)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {voirMotDePasse ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  Connexion...
                </>
              ) : (
                <>🔓 Se connecter</>
              )}
            </motion.button>
          </form>

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

          {/* Lien inscription */}
          <Link
            href="/inscription"
            className="block w-full py-4 rounded-2xl font-bold text-center text-blue-700 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
          >
            ✨ Créer un compte
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-center space-y-3"
        >
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
        </motion.div>
      </motion.div>
    </div>
  )
}
