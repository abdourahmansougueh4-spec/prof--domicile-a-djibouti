'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogin() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)

  const seConnecter = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !motDePasse) {
      setErreur('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    setErreur('')

    try {
      const emailClean = email.trim().toLowerCase()

      // 1. Connexion
      console.log('🔍 Tentative connexion:', emailClean)
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: emailClean,
          password: motDePasse,
        })

      if (authError) {
        console.error('❌ Erreur auth:', authError)
        if (authError.message.includes('Invalid login credentials')) {
          setErreur('Email ou mot de passe incorrect')
        } else if (authError.message.includes('Email not confirmed')) {
          setErreur("Email non confirmé. Contacte l'admin.")
        } else {
          setErreur(`Erreur auth : ${authError.message}`)
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setErreur('Erreur de connexion')
        setLoading(false)
        return
      }

      console.log('✅ Auth OK - UserID:', authData.user.id)

      // 2. Vérifier le profil admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, est_admin, banni, nom_complet, email')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('❌ Erreur profil:', JSON.stringify(profileError, null, 2))
        setErreur(`Erreur profil : ${profileError.message}`)
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (!profile) {
        console.error('❌ Aucun profil trouvé pour ID:', authData.user.id)
        setErreur(
          `Aucun profil pour cet utilisateur. ID: ${authData.user.id.substring(0, 8)}...`
        )
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      console.log('📋 Profil trouvé:', profile)

      if (profile.banni) {
        setErreur('⛔ Votre compte a été banni')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (profile.role !== 'admin' || !profile.est_admin) {
        setErreur(
          `⛔ Accès refusé. Rôle: ${profile.role}, Admin: ${profile.est_admin}`
        )
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      // 3. Logger la connexion
      await supabase.from('admin_logs').insert({
        action: 'connexion_admin',
        details: `Connexion ${emailClean}`,
      })

      console.log('✅ Connexion réussie, redirection...')
      router.push('/abdrhmn-zou_2022-2032')
    } catch (err: any) {
      console.error('❌ Erreur globale:', err)
      setErreur(`Erreur : ${err.message || 'inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center px-6 py-12">
      {/* Blobs */}
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Badge sécurité */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-500/30"
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-black text-red-300 uppercase tracking-wider">
          🔒 Zone sécurisée
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 items-center justify-center text-white text-4xl font-black shadow-2xl mb-4 border-2 border-white/20"
          >
            👑
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400 text-sm">
            Accès réservé aux administrateurs
          </p>
        </div>

        {/* Carte */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
          {erreur && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3"
            >
              <span className="text-xl flex-shrink-0">⚠️</span>
              <p className="text-red-200 text-xs font-medium break-words">
                {erreur}
              </p>
            </motion.div>
          )}

          <form onSubmit={seConnecter} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Email admin
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  ✉️
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="boss@admin.dj"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-medium text-white placeholder:text-slate-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  🔐
                </span>
                <input
                  type={voirMotDePasse ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-medium text-white placeholder:text-slate-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setVoirMotDePasse(!voirMotDePasse)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {voirMotDePasse ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
                  Vérification...
                </>
              ) : (
                <>🔓 Accéder au panel</>
              )}
            </motion.button>
          </form>

          {/* Info sécurité */}
          <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>🔒</span>
              <span>Connexion chiffrée SSL</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>📝</span>
              <span>Toutes les connexions sont enregistrées</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>⚠️</span>
              <span>Accès non autorisé = poursuites</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-2"
          >
            ← Retour au site public
          </Link>
        </div>
      </motion.div>
    </div>
  )
}