'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)

  // Récupérer l'URL de redirection (ex: /professeurs/123)
  const redirectUrl = searchParams.get('redirect') || ''

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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: motDePasse,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setErreur('Email ou mot de passe incorrect.')
        } else if (authError.message.includes('Email not confirmed')) {
          setErreur("Votre email n'a pas été confirmé. Contactez-nous sur WhatsApp.")
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

      const role = profileData.role

      // 🌟 LA LOGIQUE DE REDIRECTION INTELLIGENTE 🌟
      if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        if (role === 'parent') {
          router.push('/espace-parent')
        } else if (role === 'professeur') {
          router.push('/espace-professeur')
        } else if (role === 'admin') {
          router.push('/zx-4f8b2e-9d3a-ctrl')
        } else {
          router.push('/')
        }
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

      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors text-sm font-bold"
      >
        ← Retour à l'accueil
      </Link>

      <a
        href="https://wa.me/25377741482"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-6 right-6 z-20 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors"
      >
        💬 Aide
      </a>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Djib Superprof
            </span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Bon retour !</h1>
          <p className="text-slate-600 font-medium">
            Connectez-vous à votre espace personnel
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl shadow-blue-900/10 p-8 md:p-10">
          <AnimatePresence>
            {erreur && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <span className="text-xl">⚠️</span>
                <p className="text-red-700 text-sm font-bold">{erreur}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={seConnecter} className="space-y-5">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">
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
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wide">
                  Mot de passe
                </label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  Oublié ?
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
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setVoirMotDePasse(!voirMotDePasse)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {voirMotDePasse ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-xl shadow-blue-600/30 hover:shadow-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Connexion...
                </>
              ) : (
                <>🔓 Se connecter</>
              )}
            </motion.button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400 font-black uppercase tracking-widest">
                OU
              </span>
            </div>
          </div>

          {/* Lien Inscription avec conservation du redirect */}
          <Link
            href={`/inscription${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="block w-full py-4 rounded-xl font-black text-center text-blue-700 bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 transition-all"
          >
            ✨ Créer un compte
          </Link>
        </div>

        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-bold">
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
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-2 font-bold"
          >
            💬 Besoin d'aide ? Contactez-nous sur WhatsApp
          </a>
        </div>
      </motion.div>
    </div>
  )
}