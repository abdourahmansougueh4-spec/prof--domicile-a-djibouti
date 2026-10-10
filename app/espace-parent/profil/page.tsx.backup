'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ProfilParent() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const [nomComplet, setNomComplet] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [quartier, setQuartier] = useState('')

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('nom_complet, email, telephone, whatsapp, quartier')
      .eq('id', user.id)
      .single()

    if (profile) {
      setNomComplet(profile.nom_complet || '')
      setEmail(profile.email || user.email || '')
      setTelephone(profile.telephone || '+253 ')
      setWhatsapp(profile.whatsapp || '+253 ')
      setQuartier(profile.quartier || '')
    }
    setLoading(false)
  }

  const formaterTelephone = (valeur: string) => {
    // Enlever tout sauf les chiffres et le +
    let v = valeur.replace(/[^\d+]/g, '')
    if (!v.startsWith('+253')) {
      v = '+253 ' + v.replace(/^\+?253\s*/, '')
    }
    const apres = v.replace('+253', '').trim()
    const chiffres = apres.replace(/\D/g, '').slice(0, 8)
    const groupes: string[] = []
    for (let i = 0; i < chiffres.length; i += 2) {
      groupes.push(chiffres.slice(i, i + 2))
    }
    return '+253 ' + groupes.join(' ')
  }

  const enregistrer = async () => {
    if (!nomComplet.trim()) {
      setErreur('Veuillez entrer votre nom complet')
      return
    }
    if (nomComplet.trim().length < 3) {
      setErreur('Le nom doit contenir au moins 3 caractères')
      return
    }

    setSauvegarde(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          nom_complet: nomComplet.trim(),
          telephone: telephone.trim(),
          whatsapp: whatsapp.trim(),
          quartier: quartier.trim(),
        })
        .eq('id', user.id)

      if (error) throw error

      setSucces(true)
      setTimeout(() => setSucces(false), 3000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setSauvegarde(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full"
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
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              👤 Mon profil
            </h1>
            <p className="text-slate-600 text-sm">
              Modifiez vos informations à tout moment
            </p>
          </div>
          <button
            onClick={enregistrer}
            disabled={sauvegarde}
            className="px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {sauvegarde ? '⏳ Sauvegarde...' : '💾 Enregistrer'}
          </button>
        </div>

        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
          >
            <span className="text-xl">✅</span>
            <p className="text-emerald-700 text-sm font-bold">
              Profil enregistré avec succès !
            </p>
          </motion.div>
        )}

        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <span className="text-xl">⚠️</span>
            <p className="text-red-700 text-sm font-medium">{erreur}</p>
          </motion.div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              👤 Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nomComplet}
              onChange={(e) => setNomComplet(e.target.value)}
              placeholder="Ex : Ahmed Hassan"
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ✉️ Email (non modifiable)
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3.5 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none font-medium text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">
              L'email ne peut pas être modifié
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                📞 Téléphone
              </label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(formaterTelephone(e.target.value))}
                placeholder="+253 77 41 14 82"
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                💬 WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formaterTelephone(e.target.value))}
                placeholder="+253 77 41 14 82"
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              📍 Quartier
            </label>
            <input
              type="text"
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              placeholder="Ex : Héron, Balbala, Centre-ville..."
              className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
            />
          </div>
        </div>

        {/* Message info */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl">
          <p className="text-xs text-blue-800">
            💡 Vos informations sont <strong>confidentielles</strong> et ne
            sont visibles que par l'équipe Prof À Domicile Djibouti.
          </p>
        </div>
      </motion.div>

      {/* Zone danger */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-red-50 rounded-3xl p-6 md:p-8 border-2 border-red-200 shadow-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
            ⚠️
          </div>
          <div className="flex-1">
            <h3 className="font-black text-slate-900 mb-1">
              Zone sensible
            </h3>
            <p className="text-sm text-slate-700 mb-3">
              Pour toute demande de suppression de compte, contactez-nous sur
              WhatsApp.
            </p>
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
            >
              💬 Contacter l'équipe
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}