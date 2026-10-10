'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ============================================================
// CONFIG
// ============================================================

const TYPES_PROFS = [
  { val: 'etudiant', label: 'Étudiant universitaire', emoji: '🎓' },
  { val: 'diplome', label: 'Diplômé universitaire', emoji: '📜' },
  { val: 'bac_s', label: 'Bac Scientifique', emoji: '🎓' },
  { val: 'enseignant', label: 'Enseignant officiel', emoji: '👨‍🏫' },
  { val: 'freelance', label: 'Professeur freelance', emoji: '💼' },
  { val: 'formateur', label: 'Formateur spécialisé', emoji: '🏢' },
  { val: 'coran', label: 'Enseignant Coran', emoji: '📖' },
]

const MATIERES = [
  { val: 'primaire_fr', label: 'Primaire — FR', emoji: '🎒' },
  { val: 'primaire_ar', label: 'Primaire — AR', emoji: '📖' },
  { val: 'college_maths', label: 'Collège Maths', emoji: '📐' },
  { val: 'college_physique', label: 'Collège Physique', emoji: '⚗️' },
  { val: 'college_svt', label: 'Collège SVT', emoji: '🌱' },
  { val: 'college_francais', label: 'Collège Français', emoji: '📚' },
  { val: 'college_anglais', label: 'Collège Anglais', emoji: '🇬🇧' },
  { val: 'college_arabe', label: 'Collège Arabe', emoji: '📖' },
  { val: 'lycee_maths', label: 'Lycée Maths', emoji: '🎓' },
  { val: 'arabe', label: 'Arabe', emoji: '📖' },
  { val: 'coran', label: 'Coran', emoji: '🕌' },
  { val: 'francais', label: 'Français', emoji: '🇫🇷' },
  { val: 'anglais', label: 'Anglais', emoji: '🇬🇧' },
]

const LANGUES = [
  { val: 'francais', label: 'Français', emoji: '🇫🇷' },
  { val: 'arabe', label: 'Arabe', emoji: '📖' },
  { val: 'somali', label: 'Somali', emoji: '🇸🇴' },
  { val: 'afar', label: 'Afar', emoji: '🌍' },
  { val: 'anglais', label: 'Anglais', emoji: '🇬🇧' },
]

const RECHERCHES_POPULAIRES = [
  { emoji: '📐', label: 'Prof de Maths', href: '/professeurs?matiere=college_maths' },
  { emoji: '📖', label: 'Prof de Coran', href: '/professeurs?matiere=coran' },
  { emoji: '🇫🇷', label: 'Prof de Français', href: '/professeurs?matiere=francais' },
  { emoji: '🇬🇧', label: 'Prof d\'Anglais', href: '/professeurs?matiere=anglais' },
  { emoji: '🎒', label: 'Soutien Primaire', href: '/professeurs?matiere=primaire_fr' },
  { emoji: '⭐', label: 'Top Profs (4.5+)', href: '/professeurs?note=4.5' },
  { emoji: '🎓', label: 'Bac S', href: '/professeurs?type=bac_s' },
  { emoji: '👨‍🏫', label: 'Enseignants officiels', href: '/professeurs?type=enseignant' },
]

// ============================================================
// COMPOSANT
// ============================================================

export default function RecherchePage() {
  const router = useRouter()

  const [recherche, setRecherche] = useState('')
  const [type, setType] = useState('')
  const [matiere, setMatiere] = useState('')
  const [langue, setLangue] = useState('')
  const [quartier, setQuartier] = useState('')

  const rechercher = () => {
    const params = new URLSearchParams()
    if (recherche.trim()) params.set('q', recherche.trim())
    if (type) params.set('type', type)
    if (matiere) params.set('matiere', matiere)
    if (langue) params.set('langue', langue)
    if (quartier.trim()) params.set('quartier', quartier.trim())

    router.push(`/professeurs?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Blobs */}
      <motion.div
        className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* NAVBAR */}
      <nav className="relative z-40 backdrop-blur-md bg-white/80 border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-2xl">🇩🇯</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 px-3 py-2">
              ← Accueil
            </Link>
            <Link
              href="/professeurs"
              className="text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-2.5 rounded-xl shadow-lg"
            >
              👁️ Voir tous les profs
            </Link>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <section className="relative z-10 pt-12 pb-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Recherche intelligente
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Trouvez votre{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
                prof idéal
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Filtrez par matière, niveau, langue, quartier et plus encore.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FORMULAIRE DE RECHERCHE */}
      <section className="relative z-10 px-4 md:px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100"
          >
            {/* Recherche texte */}
            <div className="mb-5">
              <label className="block text-sm font-black text-slate-700 mb-2">
                🔍 Que recherchez-vous ?
              </label>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Nom du prof, matière, quartier..."
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white font-medium transition-all text-base"
                onKeyDown={(e) => e.key === 'Enter' && rechercher()}
              />
            </div>

            {/* Filtres principaux */}
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  👥 Type de professeur
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900"
                >
                  <option value="">Tous les types</option>
                  {TYPES_PROFS.map((t) => (
                    <option key={t.val} value={t.val}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  📚 Matière
                </label>
                <select
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900"
                >
                  <option value="">Toutes les matières</option>
                  {MATIERES.map((m) => (
                    <option key={m.val} value={m.val}>
                      {m.emoji} {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  🌍 Langue parlée
                </label>
                <select
                  value={langue}
                  onChange={(e) => setLangue(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900"
                >
                  <option value="">Toutes les langues</option>
                  {LANGUES.map((l) => (
                    <option key={l.val} value={l.val}>
                      {l.emoji} {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  📍 Quartier
                </label>
                <input
                  type="text"
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                  placeholder="Ex : Héron, Balbala..."
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Bouton rechercher */}
            <button
              onClick={rechercher}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-blue-700 text-white rounded-2xl font-black text-base shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              🔍 Lancer la recherche
            </button>
          </motion.div>
        </div>
      </section>

      {/* RECHERCHES POPULAIRES */}
      <section className="relative z-10 px-4 md:px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span>Recherches populaires</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RECHERCHES_POPULAIRES.map((r, i) => (
                <Link key={i} href={r.href}>
                  <motion.div
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md hover:shadow-xl hover:border-emerald-200 transition-all text-center"
                  >
                    <div className="text-3xl mb-2">{r.emoji}</div>
                    <div className="text-xs font-black text-slate-800">{r.label}</div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CONSEILS */}
      <section className="relative z-10 px-4 md:px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-3xl p-6 md:p-8 border-2 border-blue-100"
          >
            <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <span>Conseils pour bien choisir</span>
            </h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 font-black">1.</span>
                <p><strong>Vérifiez la note</strong> : Les profs avec 4.5+ ont été validés par plusieurs parents.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 font-black">2.</span>
                <p><strong>Regardez les langues</strong> : Le prof doit parler la langue maternelle de votre enfant.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 font-black">3.</span>
                <p><strong>Vérifiez la zone</strong> : Chez vous, chez le prof, ou les deux — selon votre préférence.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 font-black">4.</span>
                <p><strong>Consultez les avis</strong> : Les commentaires des autres parents sont très instructifs.</p>
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