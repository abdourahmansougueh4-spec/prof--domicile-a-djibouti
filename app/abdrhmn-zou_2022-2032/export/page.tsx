'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type TypeExport =
  | 'utilisateurs'
  | 'profs'
  | 'parents'
  | 'demandes'
  | 'paiements'
  | 'avis'
  | 'signalements'
  | 'annonces'

type Periode = 'jour' | 'semaine' | 'mois' | 'tout' | 'custom'
type Format = 'csv' | 'json'

const exportsConfig: {
  [k in TypeExport]: { label: string; emoji: string; description: string; couleur: string }
} = {
  utilisateurs: {
    label: 'Tous les utilisateurs',
    emoji: '👥',
    description: 'Tous les comptes (parents + profs + admins)',
    couleur: 'from-blue-500 to-blue-600',
  },
  profs: {
    label: 'Professeurs',
    emoji: '👨‍🏫',
    description: 'Profils complets avec badges, étoiles, stats',
    couleur: 'from-emerald-500 to-emerald-600',
  },
  parents: {
    label: 'Parents',
    emoji: '👨‍👩‍👧',
    description: 'Profils parents avec nombre d\'enfants',
    couleur: 'from-cyan-500 to-blue-600',
  },
  demandes: {
    label: 'Demandes',
    emoji: '📥',
    description: 'Toutes les demandes (statuts, montants)',
    couleur: 'from-indigo-500 to-purple-600',
  },
  paiements: {
    label: 'Paiements',
    emoji: '💰',
    description: 'Historique des paiements et revenus',
    couleur: 'from-amber-500 to-orange-600',
  },
  avis: {
    label: 'Avis',
    emoji: '⭐',
    description: 'Tous les avis avec notes et commentaires',
    couleur: 'from-yellow-500 to-amber-600',
  },
  signalements: {
    label: 'Signalements',
    emoji: '🚨',
    description: 'Historique des signalements et résolutions',
    couleur: 'from-red-500 to-red-600',
  },
  annonces: {
    label: 'Annonces',
    emoji: '📰',
    description: 'Toutes les annonces (vues, clics)',
    couleur: 'from-pink-500 to-purple-600',
  },
}

export default function AdminExport() {
  const supabase = createClient()

  const [typeExport, setTypeExport] = useState<TypeExport | ''>('')
  const [periode, setPeriode] = useState<Periode>('tout')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [format, setFormat] = useState<Format>('csv')
  const [colonnesSelectionnees, setColonnesSelectionnees] = useState<string[]>([])

  const [apercu, setApercu] = useState<any[]>([])
  const [apercuColonnes, setApercuColonnes] = useState<string[]>([])
  const [totalLignes, setTotalLignes] = useState(0)
  const [chargementApercu, setChargementApercu] = useState(false)
  const [exportEnCours, setExportEnCours] = useState(false)
  const [succes, setSucces] = useState('')
  const [historique, setHistorique] = useState<
    { type: TypeExport; date: string; lignes: number; format: Format }[]
  >([])

  const chargerApercu = async (type: TypeExport) => {
    setChargementApercu(true)
    try {
      let query = supabase.from(getTableName(type)).select('*')

      // Appliquer filtre période
      const dateFilter = getDateFilter()
      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      const { data, error } = await query.limit(5000)

      if (error) throw error

      if (data && data.length > 0) {
        const cols = Object.keys(data[0])
        setApercu(data.slice(0, 5))
        setApercuColonnes(cols)
        setColonnesSelectionnees(cols)
        setTotalLignes(data.length)
      } else {
        setApercu([])
        setApercuColonnes([])
        setColonnesSelectionnees([])
        setTotalLignes(0)
      }
    } catch (err) {
      console.error('Erreur aperçu:', err)
      setApercu([])
    } finally {
      setChargementApercu(false)
    }
  }

  const getTableName = (type: TypeExport): string => {
    const map: { [k in TypeExport]: string } = {
      utilisateurs: 'profiles',
      profs: 'profiles',
      parents: 'profiles',
      demandes: 'demandes',
      paiements: 'paiements',
      avis: 'avis',
      signalements: 'signalements',
      annonces: 'annonces',
    }
    return map[type]
  }

  const getDateFilter = (): string | null => {
    const now = new Date()
    if (periode === 'jour') {
      now.setHours(0, 0, 0, 0)
      return now.toISOString()
    }
    if (periode === 'semaine') {
      now.setDate(now.getDate() - 7)
      return now.toISOString()
    }
    if (periode === 'mois') {
      now.setMonth(now.getMonth() - 1)
      return now.toISOString()
    }
    if (periode === 'custom' && dateDebut) {
      return new Date(dateDebut).toISOString()
    }
    return null
  }

  const selectionnerType = (type: TypeExport) => {
    setTypeExport(type)
    setSucces('')
    chargerApercu(type)
  }

  const toggleColonne = (col: string) => {
    setColonnesSelectionnees(
      colonnesSelectionnees.includes(col)
        ? colonnesSelectionnees.filter((c) => c !== col)
        : [...colonnesSelectionnees, col]
    )
  }

  const toutSelectionner = () => {
    if (colonnesSelectionnees.length === apercuColonnes.length) {
      setColonnesSelectionnees([])
    } else {
      setColonnesSelectionnees(apercuColonnes)
    }
  }

  const exporter = async () => {
    if (!typeExport) {
      alert('Sélectionne un type d\'export')
      return
    }
    if (colonnesSelectionnees.length === 0) {
      alert('Sélectionne au moins une colonne')
      return
    }

    setExportEnCours(true)
    try {
      let query = supabase.from(getTableName(typeExport)).select('*')

      const dateFilter = getDateFilter()
      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      // Cas spécial : filtrer par rôle pour profs/parents
      if (typeExport === 'profs') query = query.eq('role', 'professeur')
      if (typeExport === 'parents') query = query.eq('role', 'parent')

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        alert('Aucune donnée à exporter')
        setExportEnCours(false)
        return
      }

      // Filtrer les colonnes sélectionnées
      const filtered = data.map((row) => {
        const obj: any = {}
        colonnesSelectionnees.forEach((col) => {
          obj[col] = row[col]
        })
        return obj
      })

      let contenu = ''
      let mimeType = ''
      let extension = ''

      if (format === 'csv') {
        const headers = colonnesSelectionnees
        const rows = filtered.map((r) =>
          colonnesSelectionnees.map((c) => {
            const val = r[c]
            if (val === null || val === undefined) return ''
            if (typeof val === 'object') return JSON.stringify(val)
            return String(val).replace(/"/g, '""')
          })
        )
        contenu = [headers, ...rows]
          .map((row) => row.map((c) => `"${c}"`).join(','))
          .join('\n')
        contenu = '\ufeff' + contenu // BOM pour Excel
        mimeType = 'text/csv;charset=utf-8'
        extension = 'csv'
      } else {
        contenu = JSON.stringify(filtered, null, 2)
        mimeType = 'application/json'
        extension = 'json'
      }

      const blob = new Blob([contenu], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${typeExport}-${new Date().toISOString().slice(0, 10)}.${extension}`
      link.click()
      URL.revokeObjectURL(url)

      // Log admin
      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `${typeExport} · ${filtered.length} lignes · ${format.toUpperCase()}`,
      })

      // Historique local
      setHistorique([
        {
          type: typeExport,
          date: new Date().toISOString(),
          lignes: filtered.length,
          format,
        },
        ...historique.slice(0, 9),
      ])

      setSucces(`✅ ${filtered.length} lignes exportées avec succès`)
      setTimeout(() => setSucces(''), 5000)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }

  const tailleEstimee = () => {
    if (totalLignes === 0) return '0 Ko'
    const tailleLigne = colonnesSelectionnees.length * 30
    const total = (tailleLignee: number) =>
      (tailleLignee * totalLignes) / 1024 / 1024
    const mo = total(tailleLigne)
    return mo < 1 ? `${Math.round(mo * 1024)} Ko` : `${mo.toFixed(2)} Mo`
  }

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
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
          <h1 className="text-3xl font-black mb-2">📤 Export de données</h1>
          <p className="text-emerald-100 text-sm">
            Exporte toutes les données de la plateforme en CSV ou JSON
          </p>
        </div>
      </motion.div>

      {/* Message succès */}
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

      {/* ÉTAPE 1 : Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-black">
            1
          </div>
          <h2 className="text-lg font-black text-white">
            Choisir le type de données
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(exportsConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => selectionnerType(key as TypeExport)}
              className={`p-4 rounded-xl text-left transition-all ${
                typeExport === key
                  ? `bg-gradient-to-br ${config.couleur} text-white shadow-lg ring-4 ring-white scale-105`
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-white/30'
              }`}
            >
              <div className="text-2xl mb-2">{config.emoji}</div>
              <div className="font-black text-sm mb-1">{config.label}</div>
              <div
                className={`text-[10px] ${
                  typeExport === key ? 'text-white/80' : 'text-slate-500'
                }`}
              >
                {config.description}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ÉTAPE 2 : Filtres */}
      {typeExport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-black">
              2
            </div>
            <h2 className="text-lg font-black text-white">
              Filtrer par période
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: 'jour', label: '📅 Aujourd\'hui' },
                  { val: 'semaine', label: '📆 7 jours' },
                  { val: 'mois', label: '🗓️ 30 jours' },
                  { val: 'tout', label: '🌍 Tout' },
                  { val: 'custom', label: '⚙️ Personnalisé' },
                ].map((p) => (
                  <button
                    key={p.val}
                    onClick={() => {
                      setPeriode(p.val as Periode)
                      if (p.val !== 'custom') chargerApercu(typeExport)
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      periode === p.val
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg'
                        : 'bg-slate-900 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {periode === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                  />
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Format d'export
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat('csv')}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    format === 'csv'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  📊 CSV (Excel)
                </button>
                <button
                  onClick={() => setFormat('json')}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    format === 'json'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  🧩 JSON
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ÉTAPE 3 : Colonnes */}
      {typeExport && apercuColonnes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-black">
                3
              </div>
              <h2 className="text-lg font-black text-white">
                Colonnes à exporter
              </h2>
            </div>
            <button
              onClick={toutSelectionner}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
            >
              {colonnesSelectionnees.length === apercuColonnes.length
                ? '✕ Tout décocher'
                : '✓ Tout cocher'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {apercuColonnes.map((col) => (
              <button
                key={col}
                onClick={() => toggleColonne(col)}
                className={`p-2.5 rounded-xl font-bold text-xs transition-all text-left truncate ${
                  colonnesSelectionnees.includes(col)
                    ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white border-2 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                }`}
              >
                {colonnesSelectionnees.includes(col) ? '✓ ' : '○ '}
                {col}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ÉTAPE 4 : Aperçu + Export */}
      {typeExport && apercuColonnes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-black">
              4
            </div>
            <h2 className="text-lg font-black text-white">
              Aperçu et export
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-3 border border-blue-500/30">
              <div className="text-[10px] text-blue-300 font-black uppercase">
                Lignes totales
              </div>
              <div className="text-2xl font-black text-white">{totalLignes}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-3 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-300 font-black uppercase">
                Colonnes sélectionnées
              </div>
              <div className="text-2xl font-black text-white">
                {colonnesSelectionnees.length}/{apercuColonnes.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl p-3 border border-amber-500/30">
              <div className="text-[10px] text-amber-300 font-black uppercase">
                Taille estimée
              </div>
              <div className="text-2xl font-black text-white">
                {tailleEstimee()}
              </div>
            </div>
          </div>

          {/* Aperçu table */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-white/10 overflow-x-auto mb-4">
            <div className="text-xs font-black text-slate-400 uppercase mb-3">
              👁️ Aperçu (5 premières lignes)
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {colonnesSelectionnees.slice(0, 6).map((col) => (
                    <th
                      key={col}
                      className="text-left py-2 px-3 text-slate-400 font-black uppercase text-[10px]"
                    >
                      {col}
                    </th>
                  ))}
                  {colonnesSelectionnees.length > 6 && (
                    <th className="text-left py-2 px-3 text-slate-400 font-black text-[10px]">
                      +{colonnesSelectionnees.length - 6} autres...
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {apercu.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    {colonnesSelectionnees.slice(0, 6).map((col) => (
                      <td
                        key={col}
                        className="py-2 px-3 text-white truncate max-w-[150px]"
                      >
                        {row[col] === null || row[col] === undefined
                          ? '—'
                          : typeof row[col] === 'object'
                          ? JSON.stringify(row[col]).substring(0, 30) + '...'
                          : String(row[col]).substring(0, 50)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bouton export */}
          <button
            onClick={exporter}
            disabled={exportEnCours || colonnesSelectionnees.length === 0}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-700 shadow-2xl shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all disabled:opacity-50 text-base"
          >
            {exportEnCours ? (
              <>⏳ Génération du fichier...</>
            ) : (
              <>📤 Télécharger {typeExport} en {format.toUpperCase()} ({totalLignes} lignes)</>
            )}
          </button>
        </motion.div>
      )}

      {/* Historique */}
      {historique.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-black text-white mb-4">
            📋 Historique des exports récents
          </h2>
          <div className="space-y-2">
            {historique.map((h, i) => {
              const config = exportsConfig[h.type]
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10"
                >
                  <span className="text-2xl">{config?.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">
                      {config?.label}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {h.lignes} lignes · {h.format.toUpperCase()} ·{' '}
                      {formaterDate(h.date)}
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full font-black">
                    ✓
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Info */}
      {!typeExport && (
        <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm font-bold text-blue-200 mb-1">
                Comment ça marche ?
              </p>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                1️⃣ Choisis un type de données · 2️⃣ Filtre par période · 3️⃣
                Sélectionne les colonnes · 4️⃣ Aperçu et téléchargement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}