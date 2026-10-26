'use client'

import { useState, useEffect, useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// LOGO (identique à la page d'accueil)
// ============================================================
function Logo({ size = 'md', onDark = false }: { size?: 'sm' | 'md' | 'lg'; onDark?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-6 h-6', djib: 'text-[8px]', super: 'text-sm' },
    md: { box: 'w-10 h-10', icon: 'w-8 h-8', djib: 'text-[9px]', super: 'text-lg' },
    lg: { box: 'w-14 h-14', icon: 'w-11 h-11', djib: 'text-xs', super: 'text-2xl' },
  }
  const s = sizes[size]
  const bgId = `logoBg${uid}`
  const glowId = `logoGlow${uid}`

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0`}>
        <svg className={`${s.icon} w-full h-full`} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <radialGradient id={glowId} cx="30%" cy="20%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="120" height="120" rx="28" fill={`url(#${bgId})`} />
          <rect width="120" height="120" rx="28" fill={`url(#${glowId})`} />
          <g transform="translate(60, 68)">
            <path d="M0 -26 L36 -10 L0 8 L-36 -10 Z" fill="white" />
            <path d="M-24 -2 L-24 16 Q-24 26 -12 26 L12 26 Q24 26 24 16 L24 -2 L0 8 Z" fill="white" opacity="0.85" />
            <path d="M36 -10 Q43 -3 43 6" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="43" cy="9" r="3.5" fill="#fbbf24" />
          </g>
          <g transform="translate(93, 26)">
            <path d="M0 -9 L2.6 -2.9 L9.4 -2.9 L4 -1 L6.2 5.6 L0 1.8 L-6.2 5.6 L-4 -1 L-9.4 -2.9 L-2.6 -2.9 Z" fill="#dc2626" />
          </g>
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.djib} font-black tracking-[0.18em] uppercase text-slate-400`}>Djib</span>
        <span className={`${s.super} font-black tracking-tight -mt-0.5 ${onDark ? 'text-white' : 'text-slate-900'}`}>
          Superprof
        </span>
      </div>
    </div>
  )
}

// ============================================================
// VALEURS
// ============================================================

const VALEURS = [
  {
    emoji: '🎯',
    titre: 'Excellence',
    desc: 'Nous ne sélectionnons que des professeurs vérifiés et compétents.',
    couleur: 'from-blue-500 to-blue-600',
  },
  {
    emoji: '🤝',
    titre: 'Confiance',
    desc: 'Chaque prof est vérifié, chaque parent est rassuré.',
    couleur: 'from-emerald-500 to-emerald-600',
  },
  {
    emoji: '🌍',
    titre: 'Accessibilité',
    desc: 'Une éducation de qualité pour tous les enfants de Djibouti.',
    couleur: 'from-purple-500 to-purple-600',
  },
  {
    emoji: '💰',
    titre: 'Transparence',
    desc: 'Prix clairs, aucun frais caché, paiement direct au prof.',
    couleur: 'from-amber-500 to-amber-600',
  },
  {
    emoji: '🏅',
    titre: 'Reconnaissance',
    desc: 'Les bons profs sont récompensés par des badges et étoiles.',
    couleur: 'from-yellow-500 to-orange-600',
  },
  {
    emoji: '📱',
    titre: 'Support 7j/7',
    desc: 'Notre équipe est joignable à tout moment sur WhatsApp.',
    couleur: 'from-green-500 to-emerald-600',
  },
]

// ============================================================
// HISTOIRE / TIMELINE
// ============================================================

const HISTOIRE = [
  {
    annee: '2025',
    emoji: '💡',
    titre: 'L\'idée',
    desc: 'Un constat simple : à Djibouti, trouver un bon prof à domicile reste compliqué. Les parents se passent le mot, les profs manquent de visibilité.',
    couleur: 'from-amber-500 to-orange-600',
  },
  {
    annee: '2025',
    emoji: '🔬',
    titre: 'La recherche',
    desc: 'Des mois de discussions avec des parents, des profs et des écoles pour comprendre les vrais besoins et créer une solution adaptée.',
    couleur: 'from-blue-500 to-blue-600',
  },
  {
    annee: '2026',
    emoji: '🚀',
    titre: 'Lancement',
    desc: 'Djib Superprof voit le jour. Une plateforme moderne, vérifiée, et 100% adaptée au contexte djiboutien.',
    couleur: 'from-emerald-500 to-teal-600',
  },
  {
    annee: '2026',
    emoji: '🌟',
    titre: 'Aujourd\'hui',
    desc: 'Des centaines de familles nous font confiance. Notre communauté grandit chaque jour.',
    couleur: 'from-purple-500 to-pink-600',
  },
]

// ============================================================
// ÉQUIPE
// ============================================================

const EQUIPE = [
  {
    emoji: '👨‍💼',
    nom: 'Abdourahman Sougueh',
    role: 'Fondateur & CEO',
    desc: 'Visionnaire passionné par l\'éducation et la tech.',
    couleur: 'from-blue-500 to-indigo-600',
  },
  {
    emoji: '👩‍🏫',
    nom: 'Équipe pédagogique',
    role: 'Vérification & Qualité',
    desc: 'Des experts qui valident chaque profil et chaque document.',
    couleur: 'from-emerald-500 to-teal-600',
  },
  {
    emoji: '👨‍💻',
    nom: 'Équipe technique',
    role: 'Développement',
    desc: 'Nous construisons une plateforme moderne, rapide et sécurisée.',
    couleur: 'from-purple-500 to-pink-600',
  },
  {
    emoji: '💬',
    nom: 'Support 7j/7',
    role: 'Accompagnement',
    desc: 'Toujours là pour vous aider sur WhatsApp.',
    couleur: 'from-green-500 to-emerald-600',
  },
]

// ============================================================
// TYPES DE PROFS
// ============================================================

const TYPES_PROFS = [
  { emoji: '🎓', titre: 'Étudiant universitaire', desc: 'Licence, Master, Doctorat' },
  { emoji: '📜', titre: 'Diplômé universitaire', desc: 'Diplôme reconnu par l\'État' },
  { emoji: '🎓', titre: 'Bac Scientifique', desc: 'Spécialiste matières scientifiques' },
  { emoji: '👨‍🏫', titre: 'Enseignant officiel', desc: 'En activité en établissement' },
  { emoji: '💼', titre: 'Professeur freelance', desc: 'Tuteur indépendant expérimenté' },
  { emoji: '🏢', titre: 'Formateur spécialisé', desc: 'Informatique, langues, arts' },
  { emoji: '📖', titre: 'Enseignant Coran', desc: 'Testé : lecture, tajwid, hifz' },
]

// ============================================================
// QUARTIERS
// ============================================================

const QUARTIERS = [
  'Héron', 'Balbala', 'Centre-ville', 'Arta', 'Gabode', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7',
  'Qadi Doubi', 'Haramous', 'Gabod', 'Nassib', 'Ambouli', 'Einguela', 'Boulaos', 'PK12',
]

// ============================================================
// COMPOSANT
// ============================================================

export default function AProposPage() {
  const supabase = useMemo(() => createClient(), [])

  const [stats, setStats] = useState({
    profs: 0,
    parents: 0,
    eleves: 0,
    quartiers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const chargerStats = async () => {
      try {
        const [profsRes, parentsRes, elevesRes, quartiersRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professeur').eq('approuve', true).eq('banni', false),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
          supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('statut', 'acceptee'),
          supabase.from('profiles').select('quartier').not('quartier', 'is', null),
        ])

        const quartiersUniques = new Set(
          (quartiersRes.data || []).map((q) => q.quartier?.trim()).filter(Boolean)
        )

        setStats({
          profs: profsRes.count || 0,
          parents: parentsRes.count || 0,
          eleves: elevesRes.count || 0,
          quartiers: quartiersUniques.size,
        })
      } catch (err) {
        console.error('Erreur stats:', err)
      } finally {
        setLoading(false)
      }
    }
    chargerStats()
  }, [supabase])

  // ✅ Comme sur la homepage : parents + 40
  const parentsAffiches = (stats.parents || 0) + 40

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Blobs */}
      <motion.div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />

      {/* NAVBAR */}
      <nav className="relative z-40 backdrop-blur-md bg-white/80 border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          {/* ✅ Logo Djib Superprof identique à la homepage */}
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 px-3 py-2">← Accueil</Link>
            <Link href="/inscription" className="text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-2.5 rounded-xl shadow-lg">✨ S'inscrire</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-16 pb-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Notre histoire</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              Révolutionner l'éducation
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
                à Djibouti 🇩🇯
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Djib Superprof est né d'une conviction simple : <strong className="text-slate-900">chaque enfant de Djibouti mérite un professeur de qualité</strong>, et chaque professeur mérite d'être reconnu à sa juste valeur.
            </p>
          </motion.div>
        </div>
      </section>

      {/* MISSION */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-700 rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
            <motion.div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/10 rounded-full blur-3xl" animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="relative z-10">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl md:text-3xl font-black mb-4">Notre mission</h2>
              <p className="text-base md:text-lg leading-relaxed text-emerald-50">
                Connecter <strong className="text-white">chaque parent de Djibouti</strong> avec le <strong className="text-white">professeur idéal</strong> pour son enfant — en toute confiance, transparence et simplicité.
              </p>
              <p className="text-base md:text-lg leading-relaxed text-emerald-50 mt-4">
                Nous croyons qu'une éducation de qualité ne devrait jamais dépendre du bouche-à-oreille. Nous construisons la plateforme éducative de référence à Djibouti.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VISION */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border-2 border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg flex-shrink-0">🔭</div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">Notre vision</h2>
                <p className="text-base text-slate-700 leading-relaxed">
                  Devenir la <strong>plateforme éducative n°1 à Djibouti</strong>, et à terme, dans toute la région.
                </p>
                <p className="text-base text-slate-700 leading-relaxed mt-3">
                  Nous voulons que <strong>chaque famille djiboutienne</strong> puisse trouver en 24h le professeur parfait pour son enfant, dans sa langue maternelle, à un prix juste, avec une qualité garantie.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Nos chiffres</h2>
            <p className="text-slate-600">Une communauté qui grandit chaque jour.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '👨‍🏫', valeur: stats.profs, label: 'Professeurs vérifiés' },
              { emoji: '👨‍👩‍👧', valeur: parentsAffiches, label: 'Parents inscrits' }, // ✅ +40 inclus
              { emoji: '🎓', valeur: stats.eleves, label: 'Élèves accompagnés' },
              { emoji: '📍', valeur: stats.quartiers, label: 'Quartiers couverts' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-3xl p-6 border-2 border-white shadow-lg text-center">
                <div className="text-4xl mb-3">{s.emoji}</div>
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-blue-700 bg-clip-text text-transparent mb-2">
                  {loading ? <span className="inline-block w-16 h-8 bg-slate-200 animate-pulse rounded" /> : `${s.valeur}+`}
                </div>
                <div className="text-xs text-slate-600 font-bold">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
  
      {/* VALEURS */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">💎 Nos valeurs</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Ce qui nous guide
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              6 valeurs fondamentales qui animent chaque décision.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALEURS.map((v, i) => (
              <motion.div
                key={v.titre}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md hover:shadow-xl transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${v.couleur} flex items-center justify-center text-white text-2xl shadow-lg mb-3`}>
                  {v.emoji}
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{v.titre}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTOIRE */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">📅 Notre histoire</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Comment tout a commencé
            </h2>
            <p className="text-slate-600">De l'idée au lancement, en quelques mois.</p>
          </motion.div>

          <div className="space-y-4">
            {HISTOIRE.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-md flex items-start gap-4 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${h.couleur}`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${h.couleur} flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0`}>
                  {h.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`text-xs font-black text-white px-3 py-1 rounded-full bg-gradient-to-r ${h.couleur} shadow-md`}>
                      {h.annee}
                    </span>
                    <h3 className="font-black text-slate-900 text-lg">{h.titre}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{h.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ÉQUIPE */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">👥 Notre équipe</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Les visages derrière la plateforme
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Une équipe passionnée par l'éducation et la technologie.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EQUIPE.map((e, i) => (
              <motion.div
                key={e.nom}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md hover:shadow-xl transition-all text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${e.couleur} flex items-center justify-center text-white text-4xl shadow-lg`}>
                  {e.emoji}
                </div>
                <h3 className="font-black text-slate-900 text-base mb-1">{e.nom}</h3>
                <div className="text-xs text-emerald-700 font-bold mb-3">{e.role}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{e.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TYPES DE PROFS */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl p-6 md:p-10 border-2 border-purple-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm mb-4">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">🎓 7 types de profs</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
                Une communauté diversifiée
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Chaque profil est vérifié par notre équipe, avec des exigences adaptées à son type.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {TYPES_PROFS.map((t, i) => (
                <motion.div
                  key={t.titre}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-all text-center"
                >
                  <div className="text-3xl mb-2">{t.emoji}</div>
                  <div className="text-xs font-black text-slate-900 mb-1">{t.titre}</div>
                  <div className="text-[10px] text-slate-500 leading-relaxed">{t.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUARTIERS COUVERTS */}
      <section className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg">📍</div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Quartiers couverts</h2>
                <p className="text-xs text-slate-500">Nous sommes présents dans tout Djibouti</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUARTIERS.map((q) => (
                <span
                  key={q}
                  className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 px-3 py-1.5 rounded-full font-bold border border-emerald-200 shadow-sm"
                >
                  📍 {q}
                </span>
              ))}
            </div>
            <div className="mt-5 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <p className="text-xs text-blue-800">
                💡 <strong>Vous ne trouvez pas votre quartier ?</strong> Contactez-nous sur WhatsApp — nous ferons de notre mieux pour vous trouver un prof près de chez vous.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 px-4 md:px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-8 md:p-12 shadow-2xl text-white text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-[-60px] left-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
              animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative z-10">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Rejoignez l'aventure
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
                Que vous soyez parent ou professeur, faites partie de la communauté éducative de Djibouti.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/inscription/parent"
                  className="bg-white text-blue-700 px-7 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>👨‍👩‍👧</span>
                  <span>Je suis Parent</span>
                </Link>
                <Link
                  href="/inscription/professeur"
                  className="bg-emerald-500 text-white px-7 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>👨‍🏫</span>
                  <span>Je suis Professeur</span>
                </Link>
              </div>
              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-sm text-blue-100 mb-4">Une question ? Contactez-nous.</p>
                <a
                  href="https://wa.me/25377741482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-colors"
                >
                  <span className="text-xl">💬</span>
                  <span>Nous contacter sur WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER MINI */}
      <footer className="relative z-10 bg-slate-900 text-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* ✅ Logo Djib Superprof identique à la homepage (version dark) */}
          <Link href="/">
            <Logo size="md" onDark />
          </Link>
          <p className="text-xs text-slate-500">
            © 2026 Djib Superprof — Tous droits réservés
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