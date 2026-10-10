'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// ============================================================
// CONFIG
// ============================================================

const SUJETS = [
  { val: 'general', label: '💬 Question générale' },
  { val: 'parent', label: '👨‍👩‍👧 Je suis parent' },
  { val: 'prof', label: '👨‍🏫 Je suis professeur' },
  { val: 'probleme', label: '⚠️ Signaler un problème' },
  { val: 'partenariat', label: '🤝 Partenariat' },
  { val: 'autre', label: '📝 Autre' },
]

const FAQ_RAPIDE = [
  {
    emoji: '⏱️',
    q: 'Quel est le délai de réponse ?',
    r: 'Nous répondons généralement en moins de 2h pendant les heures d\'ouverture.',
  },
  {
    emoji: '📱',
    q: 'Puis-je vous joindre sur WhatsApp ?',
    r: 'Oui ! WhatsApp est notre canal le plus rapide. Cliquez sur le bouton vert.',
  },
  {
    emoji: '🌍',
    q: 'Travaillez-vous en dehors de Djibouti-ville ?',
    r: 'Nous couvrons tout Djibouti. Contactez-nous pour les zones éloignées.',
  },
  {
    emoji: '💰',
    q: 'Puis-je avoir des infos sur les tarifs ?',
    r: 'L\'inscription est gratuite pour les parents. Pour les profs, voir la page À propos.',
  },
]

// ============================================================
// COMPOSANT
// ============================================================

export default function ContactPage() {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    sujet: 'general',
    message: '',
  })
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async () => {
    // Validation
    if (!form.nom.trim() || form.nom.trim().length < 3) {
      setErreur('Le nom doit contenir au moins 3 caractères')
      return
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setErreur('Veuillez entrer un email valide')
      return
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      setErreur('Le message doit contenir au moins 10 caractères')
      return
    }

    setEnvoi(true)
    setErreur('')

    try {
      // Ici on enverrait à une API / service d'email
      // Pour l'instant on ouvre WhatsApp avec le message pré-rempli
      const sujetLabel = SUJETS.find((s) => s.val === form.sujet)?.label || 'Question'
      const messageWA = `Bonjour l'équipe Prof À Domicile,\n\n*Nom :* ${form.nom}\n*Email :* ${form.email}\n*Sujet :* ${sujetLabel}\n\n*Message :*\n${form.message}`

      window.open(`https://wa.me/25377741482?text=${encodeURIComponent(messageWA)}`, '_blank')

      setSucces(true)
      setForm({ nom: '', email: '', sujet: 'general', message: '' })
      setTimeout(() => setSucces(false), 5000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Blobs */}
      <motion.div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />

      {/* NAVBAR */}
      <nav className="relative z-40 backdrop-blur-md bg-white/80 border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">Prof À Domicile</span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 px-3 py-2">← Accueil</Link>
            <Link href="/inscription" className="text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-2.5 rounded-xl shadow-lg">✨ S'inscrire</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-16 pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Support 7j/7 · Réponse en 2h</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              Contactez-nous
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
                à tout moment 💬
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Une question, un problème, un partenariat ? Notre équipe vous répond en moins de 2h.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3 CARTES CONTACT */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            <motion.a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all text-white"
            >
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-black text-lg mb-1">WhatsApp</h3>
              <p className="text-xs text-emerald-100 mb-3">Canal le plus rapide</p>
              <div className="text-sm font-bold">+253 77 74 14 82</div>
              <div className="text-[10px] mt-2 opacity-90">→ Cliquer pour discuter</div>
            </motion.a>

            <motion.a
              href="mailto:contact@profadomicile.dj"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all text-white"
            >
              <div className="text-4xl mb-3">✉️</div>
              <h3 className="font-black text-lg mb-1">Email</h3>
              <p className="text-xs text-blue-100 mb-3">Pour les messages longs</p>
              <div className="text-sm font-bold">contact@profadomicile.dj</div>
              <div className="text-[10px] mt-2 opacity-90">→ Cliquer pour envoyer</div>
            </motion.a>

            <motion.a
              href="tel:+25377741482"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all text-white"
            >
              <div className="text-4xl mb-3">📞</div>
              <h3 className="font-black text-lg mb-1">Téléphone</h3>
              <p className="text-xs text-purple-100 mb-3">Pour les urgences</p>
              <div className="text-sm font-bold">+253 77 74 14 82</div>
              <div className="text-[10px] mt-2 opacity-90">→ Cliquer pour appeler</div>
            </motion.a>
          </div>
        </div>
      </section>
    
      {/* FORMULAIRE + INFOS */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
            {/* FORMULAIRE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-700 flex items-center justify-center text-white text-2xl shadow-lg">
                  📩
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Envoyez-nous un message</h2>
                  <p className="text-xs text-slate-500">Réponse garantie en moins de 2h</p>
                </div>
              </div>

              {/* Messages */}
              <AnimatePresence>
                {succes && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="text-emerald-800 text-sm font-bold">Message préparé !</p>
                      <p className="text-emerald-700 text-xs mt-1">
                        WhatsApp s'est ouvert. Cliquez sur Envoyer pour finaliser.
                      </p>
                    </div>
                  </motion.div>
                )}
                {erreur && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-5 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <span className="text-xl">⚠️</span>
                    <p className="text-red-700 text-sm font-medium">{erreur}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nom */}
              <div className="mb-4">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  👤 Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex : Ahmed Hassan"
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  📧 Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="exemple@email.com"
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Sujet */}
              <div className="mb-4">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  🎯 Sujet
                </label>
                <select
                  value={form.sujet}
                  onChange={(e) => setForm({ ...form, sujet: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900 transition-all"
                >
                  {SUJETS.map((s) => (
                    <option key={s.val} value={s.val}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="mb-5">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  💬 Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  maxLength={1000}
                  placeholder="Décrivez votre demande en détail..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-slate-500">{form.message.length}/1000</span>
                  {form.message.length > 0 && form.message.length < 10 && (
                    <span className="text-[10px] text-amber-700 font-bold">Minimum 10 caractères</span>
                  )}
                </div>
              </div>

              {/* Bouton */}
              <button
                onClick={envoyer}
                disabled={envoi}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-blue-700 text-white rounded-2xl font-black text-base shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {envoi ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Envoi en cours...
                  </>
                ) : (
                  <>📩 Envoyer le message</>
                )}
              </button>

              <p className="text-[10px] text-slate-500 text-center mt-3">
                💬 Votre message sera envoyé sur WhatsApp pour une réponse instantanée.
              </p>
            </motion.div>

            {/* INFOS PRATIQUES */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Horaires */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-xl text-white">
                <div className="text-3xl mb-3">🕐</div>
                <h3 className="font-black text-lg mb-3">Horaires de support</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <span className="font-medium">Lundi - Vendredi</span>
                    <span className="font-black">8h - 21h</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <span className="font-medium">Samedi</span>
                    <span className="font-black">9h - 18h</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <span className="font-medium">Dimanche</span>
                    <span className="font-black">10h - 16h</span>
                  </div>
                </div>
                <div className="mt-4 bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-300/40">
                  <div className="text-xs font-bold">⚡ WhatsApp répond en priorité</div>
                </div>
              </div>

              {/* Adresse */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                <div className="text-3xl mb-3">📍</div>
                <h3 className="font-black text-lg text-slate-900 mb-3">Notre localisation</h3>
                <div className="text-sm text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1">Prof À Domicile Djibouti</p>
                  <p>République de Djibouti 🇩🇯</p>
                  <p className="text-xs text-slate-500 mt-2">Service 100% en ligne</p>
                </div>
              </div>

              {/* Support 7j/7 */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 shadow-xl text-white">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-black text-lg mb-2">Support 7j/7</h3>
                <p className="text-xs text-amber-100 leading-relaxed">
                  Notre équipe est disponible tous les jours pour répondre à vos questions, urgences ou demandes spéciales.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ RAPIDE */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">❓ FAQ rapide</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
              Questions fréquentes
            </h2>
            <p className="text-slate-600">Avant de nous contacter, jetez un œil ici.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {FAQ_RAPIDE.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md flex-shrink-0">
                    {f.emoji}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm mb-1">{f.q}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.r}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WHATSAPP DIRECT */}
      <section className="relative z-10 px-4 md:px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-3xl p-8 md:p-10 shadow-2xl text-white text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative z-10">
              <div className="text-5xl mb-3">💬</div>
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                Besoin d'une réponse immédiate ?
              </h2>
              <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
                Notre équipe est en ligne maintenant sur WhatsApp. Écrivez-nous, on vous répond en moins de 10 minutes.
              </p>
              <a
                href="https://wa.me/25377741482"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-green-700 px-8 py-4 rounded-2xl font-black text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <span className="text-2xl">💬</span>
                <span>Ouvrir WhatsApp</span>
              </a>
              <div className="mt-4 text-xs text-emerald-100">
                Disponible 7j/7 · Réponse en moins de 2h
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER MINI */}
      <footer className="relative z-10 bg-slate-900 text-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span>🇩🇯</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 Prof À Domicile Djibouti — Tous droits réservés
          </p>
          <div className="flex gap-3 text-sm">
            <a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
              💬
            </a>
            <Link href="/" className="text-slate-400 hover:text-white">
              🏠
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}