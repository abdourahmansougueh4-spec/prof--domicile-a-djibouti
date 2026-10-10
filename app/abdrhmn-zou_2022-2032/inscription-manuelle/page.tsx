'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'choix' | 'prof' | 'parent'

export default function InscriptionManuelle() {
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('choix')

  // FORMULAIRE PROF
  const [profForm, setProfForm] = useState({
    nomComplet: '',
    email: '',
    motDePasse: '',
    telephone: '+253 ',
    whatsapp: '+253 ',
    quartier: '',
    bio: '',
    experienceAnnees: 0,
    zoneEnseignement: 'les_deux',
    aBacS: false,
    estEtudiant: false,
    universite: '',
    niveauEtude: '',
    domaineEtude: '',
    statutUniversitaire: '',
    prixMin: '',
    prixMax: '',
    badgePionnier: false,
    badgeRecommande: false,
    badgeSuperPro: false,
  })

  // FORMULAIRE PARENT
  const [parentForm, setParentForm] = useState({
    nomComplet: '',
    email: '',
    motDePasse: '',
    telephone: '+253 ',
    whatsapp: '+253 ',
    quartier: '',
  })

  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')

  const formaterTelephone = (valeur: string) => {
    let v = valeur.replace(/[^\d+]/g, '')
    if (!v.startsWith('+253')) v = '+253 ' + v.replace(/^\+?253\s*/, '')
    const chiffres = v.replace('+253', '').trim().replace(/\D/g, '').slice(0, 8)
    const groupes: string[] = []
    for (let i = 0; i < chiffres.length; i += 2) groupes.push(chiffres.slice(i, i + 2))
    return '+253 ' + groupes.join(' ')
  }

  const creerProf = async () => {
    if (!profForm.nomComplet || !profForm.email || !profForm.motDePasse) {
      setErreur('Veuillez remplir les champs obligatoires')
      return
    }
    if (profForm.motDePasse.length < 6) {
      setErreur('Mot de passe minimum 6 caractères')
      return
    }

    setLoading(true)
    setErreur('')

    try {
      // 1. Créer le compte Auth
      const response = await fetch('/api/creer-utilisateur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profForm.email.trim().toLowerCase(),
          password: profForm.motDePasse,
          nomComplet: profForm.nomComplet.trim(),
          role: 'professeur',
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        if (result.error?.includes('already')) {
          setErreur('Cet email est déjà utilisé')
        } else {
          setErreur(`Erreur : ${result.error}`)
        }
        setLoading(false)
        return
      }

      const userId = result.userId

      // 2. Mettre à jour le profil
      await supabase
        .from('profiles')
        .update({
          telephone: profForm.telephone.trim(),
          whatsapp: profForm.whatsapp.trim(),
          quartier: profForm.quartier.trim(),
          bio: profForm.bio.trim(),
          approuve: true,
        })
        .eq('id', userId)

      // 3. Créer le profil professeur
      await supabase.from('professeurs').insert({
        id: userId,
        experience_annees: profForm.experienceAnnees,
        a_bac_s: profForm.aBacS,
        est_etudiant: profForm.estEtudiant,
        universite: profForm.universite || null,
        niveau_etude: profForm.niveauEtude || null,
        domaine_etude: profForm.domaineEtude || null,
        statut_universitaire: profForm.statutUniversitaire || null,
        zone_enseignement: profForm.zoneEnseignement,
        prix_min: profForm.prixMin ? Number(profForm.prixMin) : null,
        prix_max: profForm.prixMax ? Number(profForm.prixMax) : null,
        accepte_conditions: true,
        badge_admin: profForm.badgeSuperPro
          ? 'super_pro'
          : profForm.badgeRecommande
          ? 'recommande'
          : null,
        pionnier: profForm.badgePionnier,
      })

      setSucces(`✅ Prof ${profForm.nomComplet} créé avec succès !`)
      setProfForm({
        nomComplet: '',
        email: '',
        motDePasse: '',
        telephone: '+253 ',
        whatsapp: '+253 ',
        quartier: '',
        bio: '',
        experienceAnnees: 0,
        zoneEnseignement: 'les_deux',
        aBacS: false,
        estEtudiant: false,
        universite: '',
        niveauEtude: '',
        domaineEtude: '',
        statutUniversitaire: '',
        prixMin: '',
        prixMax: '',
        badgePionnier: false,
        badgeRecommande: false,
        badgeSuperPro: false,
      })
      setTimeout(() => setSucces(''), 5000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const creerParent = async () => {
    if (!parentForm.nomComplet || !parentForm.email || !parentForm.motDePasse) {
      setErreur('Veuillez remplir les champs obligatoires')
      return
    }

    setLoading(true)
    setErreur('')

    try {
      const response = await fetch('/api/creer-utilisateur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: parentForm.email.trim().toLowerCase(),
          password: parentForm.motDePasse,
          nomComplet: parentForm.nomComplet.trim(),
          role: 'parent',
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setErreur(`Erreur : ${result.error}`)
        setLoading(false)
        return
      }

      const userId = result.userId

      await supabase
        .from('profiles')
        .update({
          telephone: parentForm.telephone.trim(),
          whatsapp: parentForm.whatsapp.trim(),
          quartier: parentForm.quartier.trim(),
        })
        .eq('id', userId)

      await supabase.from('parents').insert({
        id: userId,
        nombre_enfants: 0,
        cours_a_domicile: true,
      })

      setSucces(`✅ Parent ${parentForm.nomComplet} créé avec succès !`)
      setParentForm({
        nomComplet: '',
        email: '',
        motDePasse: '',
        telephone: '+253 ',
        whatsapp: '+253 ',
        quartier: '',
      })
      setTimeout(() => setSucces(''), 5000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/abdrhmn-zou_2022-2032"
        className="text-sm text-slate-400 hover:text-purple-300 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white"
      >
        <h1 className="text-3xl font-black mb-2">➕ Inscription manuelle</h1>
        <p className="text-purple-100 text-sm">
          Créez un compte prof ou parent directement
        </p>
      </motion.div>

      {succes && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <span className="text-xl">✅</span>
          <p className="text-emerald-200 text-sm font-bold">{succes}</p>
        </motion.div>
      )}

      {erreur && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3"
        >
          <span className="text-xl">⚠️</span>
          <p className="text-red-200 text-sm font-bold">{erreur}</p>
        </motion.div>
      )}

      {/* Choix */}
      {mode === 'choix' && (
        <div className="grid md:grid-cols-2 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('prof')}
            className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/10 hover:border-emerald-500/50 shadow-xl text-left transition-all"
          >
            <div className="text-5xl mb-4">👨‍🏫</div>
            <h2 className="text-xl font-black text-white mb-2">
              Créer un Professeur
            </h2>
            <p className="text-sm text-slate-400">
              Compte complet avec badges, matières, prix et disponibilités
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('parent')}
            className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/10 hover:border-blue-500/50 shadow-xl text-left transition-all"
          >
            <div className="text-5xl mb-4">👨‍👩‍👧</div>
            <h2 className="text-xl font-black text-white mb-2">
              Créer un Parent
            </h2>
            <p className="text-sm text-slate-400">
              Compte parent avec possibilité d'ajouter des enfants
            </p>
          </motion.button>
        </div>
      )}

      {/* FORMULAIRE PROF */}
      {mode === 'prof' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white">
              👨‍🏫 Nouveau professeur
            </h2>
            <button
              onClick={() => setMode('choix')}
              className="text-sm text-slate-400 hover:text-white"
            >
              ✕ Annuler
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={profForm.nomComplet}
                onChange={(e) =>
                  setProfForm({ ...profForm, nomComplet: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={profForm.email}
                onChange={(e) =>
                  setProfForm({ ...profForm, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Mot de passe *
              </label>
              <input
                type="text"
                value={profForm.motDePasse}
                onChange={(e) =>
                  setProfForm({ ...profForm, motDePasse: e.target.value })
                }
                placeholder="Minimum 6 caractères"
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Quartier
              </label>
              <input
                type="text"
                value={profForm.quartier}
                onChange={(e) =>
                  setProfForm({ ...profForm, quartier: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                📞 Téléphone
              </label>
              <input
                type="text"
                value={profForm.telephone}
                onChange={(e) =>
                  setProfForm({
                    ...profForm,
                    telephone: formaterTelephone(e.target.value),
                  })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                💬 WhatsApp
              </label>
              <input
                type="text"
                value={profForm.whatsapp}
                onChange={(e) =>
                  setProfForm({
                    ...profForm,
                    whatsapp: formaterTelephone(e.target.value),
                  })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              📝 Bio
            </label>
            <textarea
              value={profForm.bio}
              onChange={(e) =>
                setProfForm({ ...profForm, bio: e.target.value })
              }
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium resize-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                🎯 Années d'expérience
              </label>
              <input
                type="number"
                value={profForm.experienceAnnees}
                onChange={(e) =>
                  setProfForm({
                    ...profForm,
                    experienceAnnees: Number(e.target.value),
                  })
                }
                min="0"
                max="50"
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                💰 Prix min (DJF)
              </label>
              <input
                type="number"
                value={profForm.prixMin}
                onChange={(e) =>
                  setProfForm({ ...profForm, prixMin: e.target.value })
                }
                placeholder="Ex: 15000"
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                💰 Prix max (DJF)
              </label>
              <input
                type="number"
                value={profForm.prixMax}
                onChange={(e) =>
                  setProfForm({ ...profForm, prixMax: e.target.value })
                }
                placeholder="Ex: 35000"
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              🏠 Zone d'enseignement
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'chez_moi', label: '🏠 Chez moi' },
                { val: 'chez_eleve', label: "🚶 Chez l'élève" },
                { val: 'les_deux', label: '🔄 Les deux' },
              ].map((z) => (
                <button
                  key={z.val}
                  type="button"
                  onClick={() =>
                    setProfForm({ ...profForm, zoneEnseignement: z.val })
                  }
                  className={`py-3 rounded-xl font-bold text-xs transition-all ${
                    profForm.zoneEnseignement === z.val
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-slate-900 text-slate-300 border-2 border-slate-700'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl">
              <input
                type="checkbox"
                checked={profForm.aBacS}
                onChange={(e) =>
                  setProfForm({ ...profForm, aBacS: e.target.checked })
                }
                className="w-5 h-5 accent-amber-500"
              />
              <span className="text-sm font-bold text-amber-200">
                🎓 A le Bac S
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-purple-500/10 border-2 border-purple-500/30 rounded-xl">
              <input
                type="checkbox"
                checked={profForm.estEtudiant}
                onChange={(e) =>
                  setProfForm({ ...profForm, estEtudiant: e.target.checked })
                }
                className="w-5 h-5 accent-purple-500"
              />
              <span className="text-sm font-bold text-purple-200">
                🎓 Étudiant universitaire
              </span>
            </label>
          </div>

          {/* BADGES ADMIN */}
          <div className="bg-gradient-to-br from-amber-500/10 to-red-500/10 rounded-2xl p-5 border-2 border-amber-500/30">
            <div className="font-black text-amber-200 mb-3 text-sm">
              👑 BADGES ADMIN (optionnel)
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900/50 rounded-xl border border-amber-500/20">
                <input
                  type="checkbox"
                  checked={profForm.badgePionnier}
                  onChange={(e) =>
                    setProfForm({
                      ...profForm,
                      badgePionnier: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-bold text-amber-200">
                  🏆 Pionnier
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900/50 rounded-xl border border-blue-500/20">
                <input
                  type="checkbox"
                  checked={profForm.badgeRecommande}
                  onChange={(e) =>
                    setProfForm({
                      ...profForm,
                      badgeRecommande: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-xs font-bold text-blue-200">
                  🏅 Recommandé
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900/50 rounded-xl border border-orange-500/20">
                <input
                  type="checkbox"
                  checked={profForm.badgeSuperPro}
                  onChange={(e) =>
                    setProfForm({
                      ...profForm,
                      badgeSuperPro: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-xs font-bold text-orange-200">
                  👑 Super-Pro
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={creerProf}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-700 shadow-2xl disabled:opacity-50 text-base"
          >
            {loading ? '⏳ Création...' : '✅ Créer le professeur'}
          </button>
        </motion.div>
      )}

      {/* FORMULAIRE PARENT */}
      {mode === 'parent' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white">
              👨‍👩‍👧 Nouveau parent
            </h2>
            <button
              onClick={() => setMode('choix')}
              className="text-sm text-slate-400 hover:text-white"
            >
              ✕ Annuler
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={parentForm.nomComplet}
                onChange={(e) =>
                  setParentForm({ ...parentForm, nomComplet: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={parentForm.email}
                onChange={(e) =>
                  setParentForm({ ...parentForm, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Mot de passe *
              </label>
              <input
                type="text"
                value={parentForm.motDePasse}
                onChange={(e) =>
                  setParentForm({ ...parentForm, motDePasse: e.target.value })
                }
                placeholder="Minimum 6 caractères"
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Quartier
              </label>
              <input
                type="text"
                value={parentForm.quartier}
                onChange={(e) =>
                  setParentForm({ ...parentForm, quartier: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                📞 Téléphone
              </label>
              <input
                type="text"
                value={parentForm.telephone}
                onChange={(e) =>
                  setParentForm({
                    ...parentForm,
                    telephone: formaterTelephone(e.target.value),
                  })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                💬 WhatsApp
              </label>
              <input
                type="text"
                value={parentForm.whatsapp}
                onChange={(e) =>
                  setParentForm({
                    ...parentForm,
                    whatsapp: formaterTelephone(e.target.value),
                  })
                }
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>
          </div>

          <button
            onClick={creerParent}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-2xl disabled:opacity-50 text-base"
          >
            {loading ? '⏳ Création...' : '✅ Créer le parent'}
          </button>
        </motion.div>
      )}
    </div>
  )
}