'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Prof = {
  id: string
  nom_complet: string
  email: string
  photo_url: string | null
  quartier: string | null
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  note_moyenne: number
  nombre_avis: number
  experience_annees: number
  approuve: boolean
  created_at: string
  nombre_eleves: number
  nombre_demandes: number
  revenus_estimes: number
  score_global: number
}

type TypeClassement = 'note' | 'etoiles' | 'revenus' | 'activite' | 'score'

const badgesConfig: { [k: string]: { label: string; emoji: string; couleur: string } } = {
  recommande: { label: 'Recommandé', emoji: '🏅', couleur: 'from-blue-500 to-blue-600' },
  super_pro: { label: 'Super-Pro', emoji: '👑', couleur: 'from-amber-500 to-orange-600' },
}

export default function AdminTopProfs() {
  const supabase = createClient()

  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [typeClassement, setTypeClassement] = useState<TypeClassement>('score')
  const [filtreMatiere, setFiltreMatiere] = useState('toutes')
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id, nom_complet, email, quartier, photo_url, approuve, created_at,
          professeurs:professeurs!inner (
            etoiles, badge_admin, pionnier, pionnier_illustre,
            note_moyenne, nombre_avis, experience_annees, photo_profil_url
          )
        `
        )
        .eq('role', 'professeur')
        .eq('banni', false)

      if (error) throw error

      const complets: Prof[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.professeurs)
          ? p.professeurs[0]
          : p.professeurs

        // Compter élèves acceptés
        const { count: elevesCount } = await supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('professeur_id', p.id)
          .eq('statut', 'acceptee')

        // Compter demandes totales
        const { count: demandesCount } = await supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('professeur_id', p.id)

        // Calculer revenus estimés
        const { data: paiements } = await supabase
          .from('paiements')
          .select('montant')
          .eq('professeur_id', p.id)
          .eq('statut', 'valide')

        const revenus = (paiements || []).reduce(
          (acc, x) => acc + Number(x.montant || 0),
          0
        )

        const noteMoyenne = info?.note_moyenne || 0
        const etoiles = info?.etoiles || 0
        const nbAvis = info?.nombre_avis || 0
        const nbEleves = elevesCount || 0

        // Score global pondéré
        const score =
          noteMoyenne * 20 +
          etoiles * 15 +
          Math.min(nbAvis / 5, 20) +
          Math.min(nbEleves * 3, 30) +
          (info?.pionnier_illustre ? 20 : info?.badge_admin === 'super_pro' ? 15 : 0)

        complets.push({
          id: p.id,
          nom_complet: p.nom_complet,
          email: p.email,
          photo_url: info?.photo_profil_url || p.photo_url || null,
          quartier: p.quartier,
          etoiles,
          badge_admin: info?.badge_admin || null,
          pionnier: info?.pionnier || false,
          pionnier_illustre: info?.pionnier_illustre || false,
          note_moyenne: noteMoyenne,
          nombre_avis: nbAvis,
          experience_annees: info?.experience_annees || 0,
          approuve: p.approuve,
          created_at: p.created_at,
          nombre_eleves: nbEleves,
          nombre_demandes: demandesCount || 0,
          revenus_estimes: revenus,
          score_global: Math.round(score),
        })
      }

      setProfs(complets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.email.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (typeClassement === 'note')
      resultat.sort((a, b) => b.note_moyenne - a.note_moyenne)
    if (typeClassement === 'etoiles')
      resultat.sort((a, b) => b.etoiles - a.etoiles)
    if (typeClassement === 'revenus')
      resultat.sort((a, b) => b.revenus_estimes - a.revenus_estimes)
    if (typeClassement === 'activite')
      resultat.sort((a, b) => b.nombre_eleves - a.nombre_eleves)
    if (typeClassement === 'score')
      resultat.sort((a, b) => b.score_global - a.score_global)

    return resultat.slice(0, 50)
  }, [profs, typeClassement, recherche])

  const top3 = profsFiltres.slice(0, 3)
  const reste = profsFiltres.slice(3)

  const totalProfs = profs.length
  const noteMoyenneGlobale =
    profs.length > 0
      ? profs.reduce((acc, p) => acc + p.note_moyenne, 0) / profs.length
      : 0
  const totalEleves = profs.reduce((acc, p) => acc + p.nombre_eleves, 0)
  const totalRevenus = profs.reduce((acc, p) => acc + p.revenus_estimes, 0)

  const exporterCSV = () => {
    const headers = ['Rang', 'Nom', 'Email', 'Quartier', 'Note', 'Avis', 'Étoiles', 'Élèves', 'Revenus', 'Score']
    const rows = profsFiltres.map((p, i) => [
      i + 1, p.nom_complet, p.email, p.quartier || '', p.note_moyenne,
      p.nombre_avis, p.etoiles, p.nombre_eleves, p.revenus_estimes, p.score_global,
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `top-profs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formaterPrix = (n: number) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })

  const getMedaille = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getPodiumColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 to-amber-500'
    if (index === 1) return 'from-slate-300 to-slate-400'
    if (index === 2) return 'from-amber-600 to-orange-700'
    return 'from-slate-700 to-slate-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black mb-2">🏆 Top Profs</h1>
              <p className="text-amber-100 text-sm">
                Classements, podium, statistiques
              </p>
            </div>
            <button
              onClick={exporterCSV}
              className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all text-sm"
            >
              📤 Export CSV
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                Total profs
              </div>
              <div className="text-2xl font-black">{totalProfs}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                Note moyenne globale
              </div>
              <div className="text-2xl font-black">
                {noteMoyenneGlobale.toFixed(2)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                Total élèves
              </div>
              <div className="text-2xl font-black">{totalEleves}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                Revenus totaux
              </div>
              <div className="text-sm font-black">
                {formaterPrix(totalRevenus)} DJF
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Types de classement */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'score', label: '⭐ Score global', emoji: '⭐' },
          { val: 'note', label: '📊 Meilleure note', emoji: '📊' },
          { val: 'etoiles', label: '🌟 Plus d\'étoiles', emoji: '🌟' },
          { val: 'revenus', label: '💰 Revenus', emoji: '💰' },
          { val: 'activite', label: '🎯 Plus d\'élèves', emoji: '🎯' },
        ].map((c) => (
          <button
            key={c.val}
            onClick={() => setTypeClassement(c.val as TypeClassement)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              typeClassement === c.val
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          🔍
        </span>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un prof..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
          />
        </div>
      ) : profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucun prof
          </h3>
          <p className="text-slate-400 text-sm">
            Aucun prof dans ce classement.
          </p>
        </motion.div>
      ) : (
        <>
          {/* PODIUM TOP 3 */}
          {top3.length > 0 && (
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10">
              <h2 className="text-xl font-black text-white mb-6 text-center">
                🏅 PODIUM
              </h2>
              <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                {top3.map((p, i) => {
                  const ordre = [1, 0, 2][i]
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: ordre === 0 ? -20 : 0 }}
                      transition={{ delay: i * 0.15, type: 'spring' }}
                      className={`${ordre === 0 ? 'col-span-1' : 'col-span-1'} flex flex-col items-center`}
                    >
                      <div
                        className={`bg-gradient-to-br ${getPodiumColor(
                          ordre
                        )} rounded-2xl p-4 w-full text-center shadow-2xl ${
                          ordre === 0 ? 'scale-110' : ''
                        }`}
                      >
                        <div className="text-4xl mb-2">
                          {getMedaille(ordre)}
                        </div>
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt={p.nom_complet}
                            className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-white/30 shadow-lg mb-2"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl mx-auto mb-2 border-4 border-white/30">
                            👨‍🏫
                          </div>
                        )}
                        <div className="font-black text-white text-xs mb-1 truncate">
                          {p.nom_complet}
                        </div>
                        <div className="text-[10px] text-white/80">
                          {p.note_moyenne.toFixed(1)} ⭐ · {p.etoiles} 🌟
                        </div>
                        {p.badge_admin && badgesConfig[p.badge_admin] && (
                          <div className="mt-2 text-[9px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-black inline-block">
                            {badgesConfig[p.badge_admin].emoji}{' '}
                            {badgesConfig[p.badge_admin].label}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Classement complet */}
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">
                📋 Classement complet ({profsFiltres.length} profs)
              </h2>
            </div>

            <div className="space-y-2">
              {profsFiltres.map((p, i) => {
                const tauxRevenus =
                  totalRevenus > 0 ? (p.revenus_estimes / totalRevenus) * 100 : 0
                const estTop3 = i < 3

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`backdrop-blur-xl rounded-2xl p-4 border transition-all ${
                      estTop3
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30'
                        : 'bg-slate-900/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Rang */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                          estTop3
                            ? 'bg-gradient-to-br ' + getPodiumColor(i)
                            : 'bg-slate-800 text-slate-400'
                        } text-white`}
                      >
                        {getMedaille(i)}
                      </div>

                      {/* Photo + Nom */}
                      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt={p.nom_complet}
                            className="w-12 h-12 rounded-xl object-cover shadow-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl flex-shrink-0">
                            👨‍🏫
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <div className="font-black text-white text-sm truncate">
                              {p.nom_complet}
                            </div>
                            {p.badge_admin && badgesConfig[p.badge_admin] && (
                              <span
                                className={`text-[9px] bg-gradient-to-r ${
                                  badgesConfig[p.badge_admin].couleur
                                } text-white px-1.5 py-0.5 rounded-full font-black`}
                              >
                                {badgesConfig[p.badge_admin].emoji}
                              </span>
                            )}
                            {p.pionnier && (
                              <span className="text-[9px] bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-1.5 py-0.5 rounded-full font-black">
                                🏆
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            📧 {p.email}
                            {p.quartier && ` · 📍 ${p.quartier}`}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-2 flex-wrap">
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center min-w-[60px]">
                          <div className="text-[9px] text-slate-500 font-black">NOTE</div>
                          <div className="text-sm font-black text-amber-300">
                            {p.note_moyenne.toFixed(1)}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center min-w-[50px]">
                          <div className="text-[9px] text-slate-500 font-black">AVIS</div>
                          <div className="text-sm font-black text-white">
                            {p.nombre_avis}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center min-w-[50px]">
                          <div className="text-[9px] text-slate-500 font-black">🌟</div>
                          <div className="text-sm font-black text-white">
                            {p.etoiles}/3
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center min-w-[50px]">
                          <div className="text-[9px] text-slate-500 font-black">ÉLÈVES</div>
                          <div className="text-sm font-black text-emerald-300">
                            {p.nombre_eleves}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center min-w-[80px]">
                          <div className="text-[9px] text-slate-500 font-black">REVENUS</div>
                          <div className="text-xs font-black text-amber-300">
                            {formaterPrix(p.revenus_estimes)}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg px-3 py-1.5 text-center min-w-[70px] border border-purple-500/30">
                          <div className="text-[9px] text-purple-300 font-black">SCORE</div>
                          <div className="text-sm font-black text-white">
                            {p.score_global}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${p.email}`}
                          className="px-3 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20"
                          title="Email"
                        >
                          📧
                        </a>
                        <Link
                          href={`/zx-4f8b2e-9d3a-ctrl/utilisateurs`}
                          className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30"
                          title="Voir dans utilisateurs"
                        >
                          👁️
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}