'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// VALIDATION
// ============================================================

const emailValide = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(email) && email.length <= 254
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function MotDePasseOublie() {
  const supabase = createClient()
  const router = useRouter()

  const [etape, setEtape] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ============================================================
  // ÉTAPE 1 : ENVOYER LE CODE (Standard)
  // ============================================================

  const envoyerCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')

    const emailNettoye = email.trim().toLowerCase()

    if (!emailNettoye) {
      setErreur('Veuillez saisir votre adresse email')
      return
    }

    if (!emailValide(emailNettoye)) {
      setErreur('Le format de l\'adresse email est invalide')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/envoyer-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNettoye }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setErreur(data.error || 'Impossible d\'envoyer le code.')
        setLoading(false)
        return
      }

      setEtape(2)
      setSucces(false)
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 300)
    } catch (err: any) {
      console.error(err)
      setErreur('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // ÉTAPE 1 BIS : PASSER DIRECTEMENT À LA SAISIE DU CODE (Admin)
  // ============================================================

  const passerDirectementAuCode = (e: React.MouseEvent) => {
    e.preventDefault()
    setErreur('')
    
    if (!email.trim()) {
      setErreur('Veuillez d\'abord saisir votre adresse email')
      return
    }
    if (!emailValide(email.trim())) {
      setErreur('Le format de l\'adresse email est invalide')
      return
    }

    setEtape(2)
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 300)
  }

  // ============================================================
  // ÉTAPE 2 : VÉRIFIER LE CODE
  // ============================================================

  const gererSaisieCode = (index: number, valeur: string) => {
    const chiffre = valeur.replace(/\D/g, '').slice(-1)
    const nouveau = [...code]
    nouveau[index] = chiffre
    setCode(nouveau)

    if (chiffre && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (chiffre && index === 5) {
      const codeComplet = nouveau.join('')
      if (codeComplet.length === 6) {
        setTimeout(() => verifierCode(codeComplet), 200)
      }
    }
  }

  const gererEffacerCode = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const gererColler = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const texte = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (texte.length === 0) return

    const nouveau = ['', '', '', '', '', '']
    for (let i = 0; i < texte.length; i++) {
      nouveau[i] = texte[i]
    }
    setCode(nouveau)

    const index = Math.min(texte.length, 5)
    inputRefs.current[index]?.focus()

    if (texte.length === 6) {
      setTimeout(() => verifierCode(texte), 200)
    }
  }

  const verifierCode = async (codeForce?: string) => {
    const codeComplet = codeForce || code.join('')

    if (codeComplet.length !== 6) {
      setErreur('Veuillez saisir les 6 chiffres du code')
      return
    }

    setErreur('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verifier-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: codeComplet,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setErreur(data.error || 'Code invalide ou expiré.')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      // ✅ Code valide → se connecter avec le token magic link
      if (data.hashedToken) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.hashedToken,
          type: 'magiclink',
        })

        if (verifyError) {
          console.error('Erreur verifyOtp:', verifyError)
          setErreur('Erreur de connexion. Réessayez.')
          setLoading(false)
          return
        }
      }

      // ✅ Rediriger vers la page de nouveau mot de passe
      router.push('/nouveau-mot-de-passe')
    } catch (err: any) {
      console.error(err)
      setErreur('Erreur de vérification. Réessayez.')
      setLoading(false)
      setCode(['', '', '', '', '', ''])
    }
  }

  const renvoyerCode = async () => {
    setErreur('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/envoyer-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setErreur(data.error || 'Impossible de renvoyer le code.')
      } else {
        setSucces(true)
        setTimeout(() => setSucces(false), 4000)
      }
    } catch (err) {
      setErreur('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const retourEmail = () => {
    setEtape(1)
    setCode(['', '', '', '', '', ''])
    setErreur('')
  }

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative">
      <Link
        href="/login"
        className="absolute top-6 left-6 text-sm text-slate-400 hover:text-slate-700 inline-flex items-center gap-1.5 transition-colors"
      >
        ← Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900">
              Djib Superprof
            </span>
            <span className="text-xl">🇩🇯</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <AnimatePresence mode="wait">
            {etape === 1 ? (
              <motion.div
                key="etape1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-slate-900 mb-2">
                    Mot de passe oublié ?
                  </h1>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Saisissez l'email associé à votre compte. Vous recevrez un{' '}
                    <strong>code à 6 chiffres</strong> par email.
                  </p>
                </div>

                <form onSubmit={envoyerCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        ✉️
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (erreur) setErreur('')
                        }}
                        placeholder="exemple@email.com"
                        autoComplete="email"
                        autoFocus
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none font-medium text-slate-800 transition-colors placeholder:text-slate-400 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {erreur && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2"
                      >
                        <span className="text-base flex-shrink-0">⚠️</span>
                        <p className="text-rose-700 text-xs font-semibold flex-1 leading-relaxed">
                          {erreur}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        Envoi en cours...
                      </>
                    ) : (
                      '📨 Recevoir le code'
                    )}
                  </button>

                  {/* ✅ BOUTON POUR CODE ADMIN */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-slate-400 font-medium">OU</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={passerDirectementAuCode}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    🔑 J'ai déjà un code (Admin)
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-slate-900 font-semibold transition-colors"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="etape2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={retourEmail}
                  className="text-xs text-slate-400 hover:text-slate-700 inline-flex items-center gap-1.5 mb-4 transition-colors"
                >
                  ← Changer d'email
                </button>

                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg mb-4">
                    🔐
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 mb-2">
                    Saisissez le code
                  </h1>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Entrez le code à 6 chiffres pour{' '}
                    <strong className="text-slate-900 break-all">{email}</strong>
                  </p>
                </div>

                {succes && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 mb-4"
                  >
                    <span className="text-base">✅</span>
                    <p className="text-emerald-700 text-xs font-semibold flex-1">
                      Nouveau code envoyé !
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                  {code.map((chiffre, i) => (
                    <motion.input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={chiffre}
                      onChange={(e) => gererSaisieCode(i, e.target.value)}
                      onKeyDown={(e) => gererEffacerCode(i, e)}
                      onPaste={i === 0 ? gererColler : undefined}
                      disabled={loading}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-black rounded-xl border-2 outline-none transition-all ${
                        chiffre
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500'
                      } ${loading ? 'opacity-60' : ''}`}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {erreur && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 mb-4"
                    >
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <p className="text-rose-700 text-xs font-semibold flex-1 leading-relaxed">
                        {erreur}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => verifierCode()}
                  disabled={loading || code.join('').length !== 6}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      Vérification...
                    </>
                  ) : (
                    '🔓 Vérifier le code'
                  )}
                </button>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    Vous n'avez pas reçu le code ?
                  </p>
                  <button
                    onClick={renvoyerCode}
                    disabled={loading}
                    className="text-sm text-blue-700 hover:text-blue-900 font-bold transition-colors disabled:opacity-50"
                  >
                    🔄 Renvoyer un nouveau code
                  </button>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pensez à vérifier vos spams.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed px-4">
          🔒 Vos informations sont sécurisées et confidentielles.
        </p>
      </motion.div>
    </div>
  )
}