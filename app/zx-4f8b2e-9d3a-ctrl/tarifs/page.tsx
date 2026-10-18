
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Prof = {
  id: string
  nom_complet: string
  email: string
  quartier: string | null
  photo_url: string | null
  prix_min: number | null
  prix_max: number | null
  experience_annees: number
  note_moyenne: number
  nombre_avis: number
  approuve: boolean
  banni: boolean
  created_at: string
}

type Filtre = 'tous' | 'avec_tarifs' | 'sans_tarifs' | 'prix_eleve' | 'prix_bas'
type Tri = 'recent' | 'prix_eleve' | 'prix_bas' | 'prix_moyen'

export default function AdminTarifs() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  const [editProf, setEditProf] = useState<Prof | null>(null)
  const [editPrixMin, setEditPrixMin] = useState('')
  const [editPrixMax, setEditPrixMax] = useState('')
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
          id, nom_complet, email, quartier, photo_url, approuve, banni, created_at,
          professeurs:professeurs!inner (
            prix_min, prix_max, experience_annees, note_moyenne, nombre_avis,
            photo_profil_url
          )
        `
        )
        .eq('role', 'professeur')
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
          quartier: p.quartier,
          photo_url: info?.photo_profil_url || p.photo_url || null,
          prix_min: info?.prix_min || null,
          prix_max: info?.prix_max || null,
          experience_annees: info?.experience_annees || 0,
          note_moyenne: info?.note_moyenne || 0,
          nombre_avis: info?.nombre_avis || 0,
          approuve: p.approuve,
          banni: p.banni,
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

  const ouvrirEdition = (p: Prof) => {
    setEditProf(p)
    setEditPrixMin(p.prix_min?.toString() || '')
    setEditPrixMax(p.prix_max?.toString() || '')
  }

  const enregistrerTarifs = async () => {
    if (!editProf) return
    if (!editPrixMin || !editPrixMax) {
      alert('Veuillez remplir les deux prix')
      return
    }
    if (Number(editPrixMin) <= 0 || Number(editPrixMax) <= 0) {
      alert('Les prix doivent être supérieurs à 0')
      return
    }
    if (Number(editPrixMin) > Number(editPrixMax)) {
      alert('Le prix minimum ne peut pas être supérieur au maximum')
      return
    }

    setAction(true)
    try {
      await supabase
        .from('professeurs')
        .update({
          prix_min: Number(editPrixMin),
          prix_max: Number(editPrixMax),
        })
        .eq('id', editProf.id)

      await supabase.from('admin_logs').insert({
        action: 'modifier_tarifs',
        details: `${editProf.nom_complet} → ${Number(editPrixMin).toLocaleString()} - ${Number(editPrixMax).toLocaleString()} DJF`,
      })

      await charger()
      setEditProf(null)
      alert('✅ Tarifs mis à jour')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const exporterCSV = () => {
    const headers = [
      'Nom',
      'Email',
      'Quartier',
      'Prix min',
      'Prix max',
      'Moyenne',
      'Expérience',
      'Note',
      'Nb avis',
    ]

    const rows = profsFiltres.map((p) => {
      const moyenne =
        p.prix_min && p.prix_max
          ? Math.round((p.prix_min + p.prix_max) / 2)
          : 0
      return [
        p.nom_complet,
        p.email,
        p.quartier || '',
        p.prix_min || '',
        p.prix_max || '',
        moyenne,
        p.experience_annees,
        p.note_moyenne,
        p.nombre_avis,
      ]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tarifs-profs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      if (onglet === 'avec_tarifs' && (!p.prix_min || !p.prix_max))
        return false
      if (onglet === 'sans_tarifs' && (p.prix_min || p.prix_max)) return false
      if (
        onglet === 'prix_eleve' &&
        (!p.prix_min || !p.prix_max || p.prix_min < 30000)
      )
        return false
      if (
        onglet === 'prix_bas' &&
        (!p.prix_min || !p.prix_max || p.prix_min >= 15000)
      )
        return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.email.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'recent')
      resultat.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    if (tri === 'prix_eleve')
      resultat.sort((a, b) => (b.prix_min || 0) - (a.prix_min || 0))
    if (tri === 'prix_bas')
      resultat.sort((a, b) => (a.prix_min || 0) - (b.prix_min || 0))
    if (tri === 'prix_moyen')
      resultat.sort((a, b) => {
        const moyA = ((a.prix_min || 0) + (a.prix_max || 0)) / 2
        const moyB = ((b.prix_min || 0) + (b.prix_max || 0)) / 2
        return moyB - moyA
      })

    return resultat
  }, [profs, onglet, recherche, tri])

  const profsAvecTarifs = profs.filter((p) => p.prix_min && p.prix_max)

  const prixMinGlobal =
    profsAvecTarifs.length > 0
      ? Math.min(...profsAvecTarifs.map((p) => p.prix_min || 0))
      : 0

  const prixMaxGlobal =
    profsAvecTarifs.length > 0
      ? Math.max(...profsAvecTarifs.map((p) => p.prix_max || 0))
      : 0

  const prixMoyenGlobal =
    profsAvecTarifs.length > 0
      ? Math.round(
          profsAvecTarifs.reduce(
            (acc, p) => acc + ((p.prix_min || 0) + (p.prix_max || 0)) / 2,
            0
          ) / profsAvecTarifs.length
        )
      : 0

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
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">💵 Tarifs Profs (privés)</h1>
          <p className="text-emerald-100 text-sm mb-5">
            {profs.length} profs · Vue interne · Non visible par les parents
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">
                Prix min global
              </div>
              <div className="text-lg font-black">
                {prixMinGlobal.toLocaleString()} DJF
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">
                Prix max global
              </div>
              <div className="text-lg font-black">
                {prixMaxGlobal.toLocaleString()} DJF
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">
                Prix moyen
              </div>
              <div className="text-lg font-black">
                {prixMoyenGlobal.toLocaleString()} DJF
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">
                Profs tarifés
              </div>
              <div className="text-lg font-black">
                {profsAvecTarifs.length}/{profs.length}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-bold text-amber-200 mb-1">
              Informations confidentielles
            </p>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Ces prix sont <strong>invisibles aux parents</strong>. Ils
              servent uniquement à l'équipe pour valider les profils et
              calculer les commissions.
            </p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'tous', label: '👥 Tous', count: profs.length },
          {
            val: 'avec_tarifs',
            label: '💰 Avec tarifs',
            count: profsAvecTarifs.length,
          },
          {
            val: 'sans_tarifs',
            label: '⚪ Sans tarifs',
            count: profs.length - profsAvecTarifs.length,
          },
          {
            val: 'prix_eleve',
            label: '💎 Prix élevé (30K+)',
            count: profs.filter(
              (p) => p.prix_min && p.prix_min >= 30000
            ).length,
          },
          {
            val: 'prix_bas',
            label: '💸 Prix bas (-15K)',
            count: profs.filter(
              (p) => p.prix_min && p.prix_min < 15000
            ).length,
          },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val as Filtre)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.label} ({o.count})
          </button>
        ))}
      </div>

      {/* Recherche + Tri + Export */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="recent">Plus récent</option>
          <option value="prix_eleve">Prix élevé</option>
          <option value="prix_bas">Prix bas</option>
          <option value="prix_moyen">Prix moyen</option>
        </select>

        <button
          onClick={exporterCSV}
          className="px-4 py-3 rounded-2xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          📤 Export CSV
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
        </div>
      ) : profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">💵</div>
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
            const moyenne =
              p.prix_min && p.prix_max
                ? Math.round((p.prix_min + p.prix_max) / 2)
                : 0

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Photo */}
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.nom_complet}
                      className="w-14 h-14 rounded-2xl object-cover shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                      👨‍🏫
                    </div>
                  )}

                  {/* Infos */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="font-black text-white text-base">
                        {p.nom_complet}
                      </div>
                      {p.approuve && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black border border-emerald-500/30">
                          ✓
                        </span>
                      )}
                      {p.banni && (
                        <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-black border border-red-500/30">
                          🚫 BANNI
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <div>📧 {p.email}</div>
                      {p.quartier && <div>📍 {p.quartier}</div>}
                      <div>
                        ⭐ {p.note_moyenne.toFixed(1)}/5 · {p.nombre_avis} avis
                        · 🎯 {p.experience_annees} an
                      </div>
                      <div>📅 {formaterDate(p.created_at)}</div>
                    </div>
                  </div>

                  {/* Tarifs actuels */}
                  <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30 min-w-[200px]">
                    <div className="text-[10px] text-amber-300 font-black uppercase mb-1">
                      🔒 TARIFS ACTUELS
                    </div>
                    {p.prix_min && p.prix_max ? (
                      <div>
                        <div className="text-white font-black text-lg">
                          {p.prix_min.toLocaleString()} -{' '}
                          {p.prix_max.toLocaleString()} DJF
                        </div>
                        <div className="text-[10px] text-amber-200 mt-1">
                          Moyenne : {moyenne.toLocaleString()} DJF
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic">
                        Aucun tarif défini
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => ouvrirEdition(p)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl"
                    >
                      ✏️ Modifier
                    </button>
                    <a
                      href={`mailto:${p.email}`}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 text-center hover:bg-white/20"
                    >
                      📧 Email
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* MODAL ÉDITION */}
      <AnimatePresence>
        {editProf && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      ✏️ Modifier les tarifs
                    </h2>
                    <p className="text-xs text-emerald-200 mt-1">
                      {editProf.nom_complet}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditProf(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    💰 Prix minimum (DJF / mois)
                  </label>
                  <input
                    type="number"
                    value={editPrixMin}
                    onChange={(e) =>
                      setEditPrixMin(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Ex : 15000"
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 font-bold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    💰 Prix maximum (DJF / mois)
                  </label>
                  <input
                    type="number"
                    value={editPrixMax}
                    onChange={(e) =>
                      setEditPrixMax(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Ex : 35000"
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 font-bold text-lg"
                  />
                </div>

                {editPrixMin && editPrixMax && (
                  <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
                    <div className="text-xs text-blue-200">
                      <strong>Fourchette :</strong>{' '}
                      {Number(editPrixMin).toLocaleString()} -{' '}
                      {Number(editPrixMax).toLocaleString()} DJF
                    </div>
                    <div className="text-xs text-blue-200 mt-1">
                      <strong>Moyenne :</strong>{' '}
                      {Math.round(
                        (Number(editPrixMin) + Number(editPrixMax)) / 2
                      ).toLocaleString()}{' '}
                      DJF
                    </div>
                  </div>
                )}

                <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-3">
                  <p className="text-[10px] text-amber-200">
                    ⚠️ La modification est enregistrée dans les logs.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditProf(null)}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={enregistrerTarifs}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-50"
                  >
                    {action ? '⏳...' : '💾 Enregistrer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}