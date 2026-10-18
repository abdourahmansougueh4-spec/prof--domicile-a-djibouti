'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  approuve: boolean
  banni: boolean
  note_moyenne: number
  nombre_avis: number
  created_at: string
}

type Filtre =
  | 'tous'
  | 'pionniers'
  | 'illustres'
  | 'recommandes'
  | 'super_pro'
  | 'sans_badge'
  | 'avec_etoiles'

const badgesConfig: {
  [k: string]: { label: string; emoji: string; couleur: string }
} = {
  recommande: {
    label: 'Recommandé',
    emoji: '🏅',
    couleur: 'from-blue-500 to-blue-600',
  },
  super_pro: {
    label: 'Super-Pro',
    emoji: '👑',
    couleur: 'from-amber-500 to-orange-600',
  },
  pionnier: {
    label: 'Pionnier',
    emoji: '🏆',
    couleur: 'from-yellow-500 to-amber-600',
  },
  pionnier_illustre: {
    label: 'Pionnier Illustre',
    emoji: '👑',
    couleur: 'from-red-500 to-pink-600',
  },
}

export default function AdminBadges() {
  const supabase = createClient()

  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [recherche, setRecherche] = useState('')

  const [profSelectionne, setProfSelectionne] = useState<Prof | null>(null)
  const [motif, setMotif] = useState('')
  const [action, setAction] = useState(false)

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
          id, nom_complet, email, photo_url, quartier, approuve, banni, created_at,
          professeurs:professeurs!inner (
            etoiles, badge_admin, pionnier, pionnier_illustre,
            note_moyenne, nombre_avis, photo_profil_url
          )
        `
        )
        .eq('role', 'professeur')
        .eq('banni', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Prof[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.professeurs)
          ? p.professeurs[0]
          : p.professeurs

        complets.push({
          id: p.id,
          nom_complet: p.nom_complet,
          email: p.email,
          photo_url: info?.photo_profil_url || p.photo_url || null,
          quartier: p.quartier,
          etoiles: info?.etoiles || 0,
          badge_admin: info?.badge_admin || null,
          pionnier: info?.pionnier || false,
          pionnier_illustre: info?.pionnier_illustre || false,
          approuve: p.approuve,
          banni: p.banni,
          note_moyenne: info?.note_moyenne || 0,
          nombre_avis: info?.nombre_avis || 0,
          created_at: p.created_at,
        })
      }

      setProfs(complets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const setEtoiles = async (prof: Prof, nb: number) => {
    if (nb < 0 || nb > 3) return

    setAction(true)
    try {
      await supabase
        .from('professeurs')
        .update({
          etoiles: nb,
          date_derniere_etoile: new Date().toISOString(),
        })
        .eq('id', prof.id)

      // Notifier le prof si augmentation
      if (nb > prof.etoiles) {
        await supabase.from('notifications').insert({
          destinataire_id: prof.id,
          titre: `⭐ Niveau ${nb} atteint !`,
          contenu: `Félicitations ! Vous avez maintenant ${nb} étoile${nb > 1 ? 's' : ''}. Continuez comme ça !`,
          lien: '/espace-professeur/statut',
          lu: false,
        })
      }

      await supabase.from('admin_logs').insert({
        action: 'modifier_etoiles',
        details: `${prof.nom_complet} → ${nb} étoile${nb > 1 ? 's' : ''}${motif ? ' | Motif: ' + motif : ''}`,
      })

      await charger()
      setMotif('')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const setBadge = async (prof: Prof, badge: string | null) => {
    setAction(true)
    try {
      await supabase
        .from('professeurs')
        .update({ badge_admin: badge })
        .eq('id', prof.id)

      if (badge) {
        await supabase.from('notifications').insert({
          destinataire_id: prof.id,
          titre: `${badgesConfig[badge]?.emoji || '🏅'} Nouveau badge obtenu !`,
          contenu: `Vous avez reçu le badge "${badgesConfig[badge]?.label}". Félicitations !`,
          lien: '/espace-professeur/statut',
          lu: false,
        })
      }

      await supabase.from('admin_logs').insert({
        action: 'modifier_badge',
        details: `${prof.nom_complet} → ${badge || 'Aucun'}${motif ? ' | Motif: ' + motif : ''}`,
      })

      await charger()
      setMotif('')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const setPionnier = async (prof: Prof, valeur: boolean) => {
    setAction(true)
    try {
      await supabase
        .from('professeurs')
        .update({ pionnier: valeur })
        .eq('id', prof.id)

      if (valeur) {
        await supabase.from('notifications').insert({
          destinataire_id: prof.id,
          titre: '🏆 Badge Pionnier',
          contenu: 'Vous êtes officiellement Pionnier de la plateforme !',
          lien: '/espace-professeur/statut',
          lu: false,
        })
      }

      await supabase.from('admin_logs').insert({
        action: 'modifier_pionnier',
        details: `${prof.nom_complet} → ${valeur ? 'Pionnier ON' : 'Pionnier OFF'}`,
      })

      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const setPionnierIllustre = async (prof: Prof, valeur: boolean) => {
    setAction(true)
    try {
      await supabase
        .from('professeurs')
        .update({ pionnier_illustre: valeur })
        .eq('id', prof.id)

      if (valeur) {
        await supabase.from('notifications').insert({
          destinataire_id: prof.id,
          titre: '👑 Pionnier Illustre',
          contenu: 'Vous avez reçu le badge VIP Pionnier Illustre. Merci pour votre confiance !',
          lien: '/espace-professeur/statut',
          lu: false,
        })
      }

      await supabase.from('admin_logs').insert({
        action: 'modifier_pionnier_illustre',
        details: `${prof.nom_complet} → ${valeur ? 'ON' : 'OFF'}`,
      })

      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const profsFiltres = useMemo(() => {
    return profs.filter((p) => {
      if (filtre === 'pionniers' && !p.pionnier) return false
      if (filtre === 'illustres' && !p.pionnier_illustre) return false
      if (filtre === 'recommandes' && p.badge_admin !== 'recommande')
        return false
      if (filtre === 'super_pro' && p.badge_admin !== 'super_pro')
        return false
      if (
        filtre === 'sans_badge' &&
        (p.badge_admin || p.pionnier || p.pionnier_illustre)
      )
        return false
      if (filtre === 'avec_etoiles' && p.etoiles === 0) return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.email.toLowerCase().includes(r)
        )
      }
      return true
    })
  }, [profs, filtre, recherche])

  const compte = (f: Filtre) => {
    if (f === 'tous') return profs.length
    if (f === 'pionniers') return profs.filter((p) => p.pionnier).length
    if (f === 'illustres') return profs.filter((p) => p.pionnier_illustre).length
    if (f === 'recommandes')
      return profs.filter((p) => p.badge_admin === 'recommande').length
    if (f === 'super_pro')
      return profs.filter((p) => p.badge_admin === 'super_pro').length
    if (f === 'sans_badge')
      return profs.filter(
        (p) => !p.badge_admin && !p.pionnier && !p.pionnier_illustre
      ).length
    if (f === 'avec_etoiles') return profs.filter((p) => p.etoiles > 0).length
    return 0
  }

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

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
          <h1 className="text-3xl font-black mb-2">🏅 Badges & Étoiles</h1>
          <p className="text-amber-100 text-sm mb-4">
            {profs.length} profs · Donne ou retire étoiles et badges manuellement
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                🏆 Pionniers
              </div>
              <div className="text-2xl font-black">{compte('pionniers')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                👑 Illustres
              </div>
              <div className="text-2xl font-black">{compte('illustres')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                🏅 Recommandés
              </div>
              <div className="text-2xl font-black">{compte('recommandes')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-amber-200">
                ⭐ Avec étoiles
              </div>
              <div className="text-2xl font-black">{compte('avec_etoiles')}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-bold text-blue-200 mb-1">
              Contrôle total
            </p>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Tu peux donner ou retirer <strong>étoiles</strong> et{' '}
              <strong>badges</strong> à tout moment. Le prof reçoit une
              notification automatique.
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'tous', label: '👥 Tous', count: compte('tous') },
          { val: 'pionniers', label: '🏆 Pionniers', count: compte('pionniers') },
          { val: 'illustres', label: '👑 Illustres', count: compte('illustres') },
          {
            val: 'recommandes',
            label: '🏅 Recommandés',
            count: compte('recommandes'),
          },
          { val: 'super_pro', label: '👑 Super-Pro', count: compte('super_pro') },
          {
            val: 'avec_etoiles',
            label: '⭐ Avec étoiles',
            count: compte('avec_etoiles'),
          },
          {
            val: 'sans_badge',
            label: '⚪ Sans badge',
            count: compte('sans_badge'),
          },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val as Filtre)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtre === f.val
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {f.label} ({f.count})
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
          placeholder="Rechercher un prof par nom ou email..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      {/* Liste */}
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
          <div className="text-6xl mb-4">🏅</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucun prof
          </h3>
          <p className="text-slate-400 text-sm">
            Aucun prof dans cette catégorie.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {profsFiltres.map((p, i) => {
            const badgeInfo = p.badge_admin
              ? badgesConfig[p.badge_admin]
              : null
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Photo */}
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.nom_complet}
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                      👨‍🏫
                    </div>
                  )}

                  {/* Infos */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-black text-white text-base mb-1">
                      {p.nom_complet}
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <div>📧 {p.email}</div>
                      {p.quartier && <div>📍 {p.quartier}</div>}
                      <div>
                        ⭐ {p.note_moyenne.toFixed(1)}/5 · {p.nombre_avis} avis
                      </div>
                      <div>📅 Inscrit {formaterDate(p.created_at)}</div>
                    </div>

                    {/* Badges actuels */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.pionnier_illustre && (
                        <span className="text-[10px] bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-0.5 rounded-full font-black">
                          👑 ILLUSTRE
                        </span>
                      )}
                      {p.badge_admin && badgesConfig[p.badge_admin] && (
                        <span
                          className={`text-[10px] bg-gradient-to-r ${
                            badgesConfig[p.badge_admin].couleur
                          } text-white px-2 py-0.5 rounded-full font-black`}
                        >
                          {badgesConfig[p.badge_admin].emoji}{' '}
                          {badgesConfig[p.badge_admin].label.toUpperCase()}
                        </span>
                      )}
                      {p.pionnier && (
                        <span className="text-[10px] bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-2 py-0.5 rounded-full font-black">
                          🏆 PIONNIER
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Étoiles */}
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 min-w-[150px]">
                    <div className="text-[10px] text-slate-400 font-black uppercase mb-2">
                      ⭐ Étoiles
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className={`text-2xl ${
                            n <= p.etoiles
                              ? 'text-amber-400'
                              : 'text-slate-600 opacity-30'
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEtoiles(p, p.etoiles - 1)}
                        disabled={action || p.etoiles === 0}
                        className="flex-1 py-1 bg-red-500/20 text-red-300 rounded-lg font-bold text-xs hover:bg-red-500/30 disabled:opacity-30"
                      >
                        −
                      </button>
                      <button
                        onClick={() => setEtoiles(p, p.etoiles + 1)}
                        disabled={action || p.etoiles === 3}
                        className="flex-1 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-bold text-xs hover:bg-emerald-500/30 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions badges */}
                  <div className="flex flex-col gap-1.5 min-w-[160px]">
                    <button
                      onClick={() =>
                        setBadge(
                          p,
                          p.badge_admin === 'recommande' ? null : 'recommande'
                        )
                      }
                      disabled={action}
                      className={`px-3 py-2 rounded-xl font-bold text-xs border transition-colors ${
                        p.badge_admin === 'recommande'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                      }`}
                    >
                      🏅 {p.badge_admin === 'recommande' ? 'RETIRER' : 'Recommandé'}
                    </button>

                    <button
                      onClick={() =>
                        setBadge(
                          p,
                          p.badge_admin === 'super_pro' ? null : 'super_pro'
                        )
                      }
                      disabled={action}
                      className={`px-3 py-2 rounded-xl font-bold text-xs border transition-colors ${
                        p.badge_admin === 'super_pro'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-600'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                    >
                      👑 {p.badge_admin === 'super_pro' ? 'RETIRER' : 'Super-Pro'}
                    </button>

                    <button
                      onClick={() => setPionnier(p, !p.pionnier)}
                      disabled={action}
                      className={`px-3 py-2 rounded-xl font-bold text-xs border transition-colors ${
                        p.pionnier
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-amber-600'
                          : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/20'
                      }`}
                    >
                      🏆 {p.pionnier ? 'RETIRER' : 'Pionnier'}
                    </button>

                    <button
                      onClick={() => setPionnierIllustre(p, !p.pionnier_illustre)}
                      disabled={action}
                      className={`px-3 py-2 rounded-xl font-bold text-xs border transition-colors ${
                        p.pionnier_illustre
                          ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-pink-600'
                          : 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                      }`}
                    >
                      👑{' '}
                      {p.pionnier_illustre ? 'RETIRER' : 'Pionnier Illustre'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Note interne modal */}
      <AnimatePresence>
        {profSelectionne && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-black text-white mb-4">
                Motif (optionnel)
              </h3>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={4}
                placeholder="Note pour l'historique..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none resize-none"
              />
              <button
                onClick={() => setProfSelectionne(null)}
                className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}