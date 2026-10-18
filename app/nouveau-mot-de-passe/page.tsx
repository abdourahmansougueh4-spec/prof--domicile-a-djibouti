'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NouveauMotDePasse() {
  const router = useRouter()
  const supabase = createClient()

  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [voir, setVoir] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifSession, setVerifSession] = useState(true)
  const [sessionOk, setSessionOk] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    const verifier = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setSessionOk(true)
        setVerifSession(false)
        return
      }

      setTimeout(async () => {
        const {
          data: { session: s2 },
        } = await supabase.auth.getSession()
        if (s2) setSessionOk(true)
        setVerifSession(false)
      }, 1000)
    }

    verifier()
  }, [supabase])

  const valider = () => {
    if (!motDePasse || motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }
    if (!/[A-Z]/.test(motDePasse)) {
      setErreur('Le mot de passe doit contenir au moins une majuscule')
      return false
    }
    if (!/[a-z]/.test(motDePasse)) {
      setErreur('Le mot de passe doit contenir au moins une minuscule')
      return false
    }
    if (!/[0-9]/.test(motDePasse)) {
      setErreur('Le mot de passe doit contenir au moins un chiffre')
      return false
    }
    if (motDePasse !== confirmation) {
      setErreur('Les mots de passe ne correspondent pas')
      return false
    }
    setErreur('')
    return true
  }

  const changer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valider()) return

    setLoading(true)
    setErreur('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: motDePasse,
      })

      if (error) throw error

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', user.id)
      }

      setSucces(true)

      setTimeout(async () => {
        const {
          data: { user: u },
        } = await supabase.auth.getUser()

        if (!u) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .single()

        if (profile?.role === 'parent') {
          router.push('/espace-parent')
        } else if (profile?.role === 'professeur') {
          router.push('/espace-professeur')
        } else if (profile?.role === 'admin') {
          router.push('/zx-4f8b2e-9d3a-ctrl')
        } else {
          router.push('/')
        }
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setErreur(
        'Impossible de changer le mot de passe. Le lien est peut-être expiré.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (verifSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!sessionOk) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-50 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Lien invalide ou expiré
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Ce lien de réinitialisation n'est plus valide. Veuillez en demander
            un nouveau.
          </p>
          <Link
            href="/mot-de-passe-oublie"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <AnimatePresence mode="wait">
            {succes ? (
              <motion.div
                key="succes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Mot de passe modifié
                </h2>
                <p className="text-sm text-slate-500">
                  Redirection vers votre espace...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-slate-900 mb-2">
                    Nouveau mot de passe
                  </h1>
                  <p className="text-sm text-slate-500">
                    Choisissez un mot de passe sécurisé.
                  </p>
                </div>

                <form onSubmit={changer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        🔒
                      </span>
                      <input
                        type={voir ? 'text' : 'password'}
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setVoir(!voir)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {voir ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        🔒
                      </span>
                      <input
                        type={voir ? 'text' : 'password'}
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Le mot de passe doit contenir
                    </div>
                    <div className="space-y-1">
                      {[
                        {
                          ok: motDePasse.length >= 8,
                          label: '8 caractères minimum',
                        },
                        { ok: /[A-Z]/.test(motDePasse), label: '1 majuscule' },
                        { ok: /[a-z]/.test(motDePasse), label: '1 minuscule' },
                        { ok: /[0-9]/.test(motDePasse), label: '1 chiffre' },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span
                            className={
                              c.ok ? 'text-emerald-600' : 'text-slate-300'
                            }
                          >
                            {c.ok ? '✓' : '○'}
                          </span>
                          <span
                            className={
                              c.ok ? 'text-slate-700' : 'text-slate-400'
                            }
                          >
                            {c.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {erreur && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <p className="text-rose-700 text-xs font-semibold flex-1">
                        {erreur}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer le mot de passe'
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}