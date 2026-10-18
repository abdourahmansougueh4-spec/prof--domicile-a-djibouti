'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Demande = {
  id: string
  parent_id: string
  parent_nom: string
  parent_email: string
  parent_telephone: string
  parent_whatsapp: string
  parent_quartier: string
  professeur_id: string
  prof_nom: string
  prof_email: string
  prof_telephone: string
  prof_whatsapp: string
  prof_quartier: string
  matiere: string | null
  message: string
  statut: string
  pre_decision: string | null
  nombre_enfants: number
  prix_souhaite: number | null
  niveaux_souhaites: string[]
  creneaux_souhaites: string[]
  motif_refus: string | null
  created_at: string
}

type Onglet =
  | 'urgentes'
  | 'en_attente'
  | 'a_valider'
  | 'acceptees'
  | 'refusees'
  | 'toutes'

type Tri = 'recent' | 'ancien' | 'prix_eleve' | 'prix_bas' | 'enfants'

const labelsStatut: {
  [k: string]: { label: string; couleur: string; emoji: string }
} = {
  en_attente: {
    label: 'En attente',
    couleur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    emoji: '⏳',
  },
  pre_acceptee: {
    label: 'Pré-acceptée par prof',
    couleur: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    emoji: '👍',
  },
  pre_refusee: {
    label: 'Pré-refusée par prof',
    couleur: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    emoji: '👎',
  },
  acceptee: {
    label: 'Acceptée',
    couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    emoji: '✅',
  },
  refusee: {
    label: 'Refusée',
    couleur: 'bg-red-500/20 text-red-300 border-red-500/30',
    emoji: '❌',
  },
}

const labelsMatieres: { [k: string]: string } = {
  primaire_fr: 'Primaire FR',
  primaire_ar: 'Primaire AR',
  college_maths: 'Collège Maths',
  college_physique: 'Collège Physique',
  college_svt: 'Collège SVT',
  college_francais: 'Collège Français',
  college_anglais: 'Collège Anglais',
  college_arabe: 'Collège Arabe',
  lycee_maths: 'Lycée Maths',
  arabe: 'Arabe',
  coran: 'Coran',
  francais: 'Français',
  anglais: 'Anglais',
}

export default function AdminDemandes() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Onglet>('urgentes')
  const [tri, setTri] = useState<Tri>('recent')
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtrePrixMin, setFiltrePrixMin] = useState('')
  const [filtrePrixMax, setFiltrePrixMax] = useState('')
  const [filtresAvancesOuverts, setFiltresAvancesOuverts] = useState(false)
  const [selection, setSelection] = useState<string[]>([])
  const [modeSelection, setModeSelection] = useState(false)

  // Modals
  const [demandeDetail, setDemandeDetail] = useState<Demande | null>(null)
  const [demandeDecision, setDemandeDecision] = useState<Demande | null>(null)
  const [motifRefus, setMotifRefus] = useState('')
  const [noteInterne, setNoteInterne] = useState('')
  const [action, setAction] = useState(false)

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('demandes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const demandesCompletes: Demande[] = []

      for (const d of data || []) {
        const [parentRes, profRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nom_complet, email, telephone, whatsapp, quartier')
            .eq('id', d.parent_id)
            .single(),
          supabase
            .from('profiles')
            .select('nom_complet, email, telephone, whatsapp, quartier')
            .eq('id', d.professeur_id)
            .single(),
        ])

        demandesCompletes.push({
          id: d.id,
          parent_id: d.parent_id,
          parent_nom: parentRes.data?.nom_complet || 'Parent',
          parent_email: parentRes.data?.email || '—',
          parent_telephone: parentRes.data?.telephone || '—',
          parent_whatsapp: parentRes.data?.whatsapp || '—',
          parent_quartier: parentRes.data?.quartier || '—',
          professeur_id: d.professeur_id,
          prof_nom: profRes.data?.nom_complet || 'Prof',
          prof_email: profRes.data?.email || '—',
          prof_telephone: profRes.data?.telephone || '—',
          prof_whatsapp: profRes.data?.whatsapp || '—',
          prof_quartier: profRes.data?.quartier || '—',
          matiere: d.matiere,
          message: d.message,
          statut: d.statut,
          pre_decision: d.pre_decision || null,
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite,
          niveaux_souhaites: d.niveaux_souhaites || [],
          creneaux_souhaites: d.creneaux_souhaites || [],
          motif_refus: d.motif_refus || null,
          created_at: d.created_at,
        })
      }

      setDemandes(demandesCompletes)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calcul d'urgence (plus de 24h sans décision)
  const estUrgente = (d: Demande) => {
    if (d.statut !== 'en_attente' && d.statut !== 'pre_acceptee') return false
    const diffH = (Date.now() - new Date(d.created_at).getTime()) / 3600000
    return diffH > 24
  }

  // Temps restant avant urgence
  const tempsRestant = (d: Demande) => {
    const diffH = 24 - (Date.now() - new Date(d.created_at).getTime()) / 3600000
    if (diffH <= 0) return 'URGENT'
    if (diffH < 1) return `${Math.floor(diffH * 60)}min`
    return `${Math.floor(diffH)}h`
  }

  const validerDemande = async (demande: Demande) => {
    if (
      !confirm(
        `✅ VALIDER cette demande ?\n\n${demande.parent_nom} → ${demande.prof_nom}\n\nLe parent recevra le contact du prof.`
      )
    )
      return

    setAction(true)
    try {
      await supabase
        .from('demandes')
        .update({
          statut: 'acceptee',
          motif_refus: null,
        })
        .eq('id', demande.id)

      await supabase.from('notifications').insert([
        {
          destinataire_id: demande.parent_id,
          titre: '🎉 Demande acceptée !',
          contenu: `Votre demande pour ${demande.prof_nom} a été acceptée. L'équipe va vous contacter.`,
          lien: '/espace-parent/demandes',
          lu: false,
        },
        {
          destinataire_id: demande.professeur_id,
          titre: '✅ Nouvel élève validé',
          contenu: `Vous avez un nouvel élève : ${demande.parent_nom}.`,
          lien: '/espace-professeur/eleves',
          lu: false,
        },
      ])

      await supabase.from('admin_logs').insert({
        action: 'valider_demande',
        details: `${demande.parent_nom} → ${demande.prof_nom}`,
      })

      await charger()
      setDemandeDecision(null)
      setDemandeDetail(null)
      alert('✅ Demande validée !')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const refuserDemande = async (demande: Demande) => {
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer un motif de refus')
      return
    }

    setAction(true)
    try {
      await supabase
        .from('demandes')
        .update({
          statut: 'refusee',
          motif_refus: motifRefus.trim(),
        })
        .eq('id', demande.id)

      await supabase.from('notifications').insert({
        destinataire_id: demande.parent_id,
        titre: '❌ Demande refusée',
        contenu: `Votre demande pour ${demande.prof_nom} n'a pas été acceptée. Motif : ${motifRefus}`,
        lien: '/espace-parent/demandes',
        lu: false,
      })

      await supabase.from('admin_logs').insert({
        action: 'refuser_demande',
        details: `${demande.parent_nom} → ${demande.prof_nom} | Motif: ${motifRefus}`,
      })

      await charger()
      setDemandeDecision(null)
      setDemandeDetail(null)
      setMotifRefus('')
      alert('❌ Demande refusée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const toggleSelection = (id: string) => {
    setSelection(
      selection.includes(id)
        ? selection.filter((s) => s !== id)
        : [...selection, id]
    )
  }

  const toutSelectionner = () => {
    if (selection.length === demandesFiltrees.length) {
      setSelection([])
    } else {
      setSelection(demandesFiltrees.map((d) => d.id))
    }
  }

  const validerEnMasse = async () => {
    if (selection.length === 0) return
    if (
      !confirm(
        `✅ VALIDER ${selection.length} demande(s) ?\n\nTous les parents et profs concernés seront notifiés.`
      )
    )
      return

    setAction(true)
    try {
      for (const id of selection) {
        const d = demandes.find((x) => x.id === id)
        if (!d) continue

        await supabase
          .from('demandes')
          .update({ statut: 'acceptee', motif_refus: null })
          .eq('id', id)

        await supabase.from('notifications').insert([
          {
            destinataire_id: d.parent_id,
            titre: '🎉 Demande acceptée !',
            contenu: `Votre demande pour ${d.prof_nom} a été acceptée.`,
            lien: '/espace-parent/demandes',
            lu: false,
          },
          {
            destinataire_id: d.professeur_id,
            titre: '✅ Nouvel élève validé',
            contenu: `Nouvel élève : ${d.parent_nom}.`,
            lien: '/espace-professeur/eleves',
            lu: false,
          },
        ])
      }

      await supabase.from('admin_logs').insert({
        action: 'valider_demandes_masse',
        details: `${selection.length} demandes validées`,
      })

      setSelection([])
      setModeSelection(false)
      await charger()
      alert(`✅ ${selection.length} demandes validées !`)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const exporterCSV = () => {
    const headers = [
      'Date',
      'Parent',
      'Email Parent',
      'Tel Parent',
      'Prof',
      'Email Prof',
      'Tel Prof',
      'Enfants',
      'Prix',
      'Niveaux',
      'Matières',
      'Statut',
    ]

    const rows = demandesFiltrees.map((d) => [
      new Date(d.created_at).toLocaleDateString('fr-FR'),
      d.parent_nom,
      d.parent_email,
      d.parent_telephone,
      d.prof_nom,
      d.prof_email,
      d.prof_telephone,
      d.nombre_enfants,
      d.prix_souhaite || '',
      d.niveaux_souhaites.join('; '),
      d.matiere || '',
      d.statut,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `demandes-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const demandesFiltrees = useMemo(() => {
    let resultat = demandes.filter((d) => {
      // Onglet
      if (onglet === 'urgentes' && !estUrgente(d)) return false
      if (onglet === 'en_attente' && d.statut !== 'en_attente') return false
      if (onglet === 'a_valider' && d.statut !== 'pre_acceptee') return false
      if (onglet === 'acceptees' && d.statut !== 'acceptee') return false
      if (onglet === 'refusees' && d.statut !== 'refusee') return false

      // Recherche
      if (recherche) {
        const r = recherche.toLowerCase()
        if (
          !d.parent_nom.toLowerCase().includes(r) &&
          !d.prof_nom.toLowerCase().includes(r) &&
          !d.parent_email.toLowerCase().includes(r) &&
          !d.prof_email.toLowerCase().includes(r)
        )
          return false
      }

      // Prix
      if (filtrePrixMin && Number(d.prix_souhaite || 0) < Number(filtrePrixMin))
        return false
      if (filtrePrixMax && Number(d.prix_souhaite || 0) > Number(filtrePrixMax))
        return false

      return true
    })

    // Tri
    if (tri === 'recent')
      resultat.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    if (tri === 'ancien')
      resultat.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    if (tri === 'prix_eleve')
      resultat.sort(
        (a, b) => Number(b.prix_souhaite || 0) - Number(a.prix_souhaite || 0)
      )
    if (tri === 'prix_bas')
      resultat.sort(
        (a, b) => Number(a.prix_souhaite || 0) - Number(b.prix_souhaite || 0)
      )
    if (tri === 'enfants')
      resultat.sort((a, b) => b.nombre_enfants - a.nombre_enfants)

    return resultat
  }, [demandes, onglet, recherche, filtrePrixMin, filtrePrixMax, tri])

  const compte = (statut: string) =>
    demandes.filter((d) => d.statut === statut).length

  const compteUrgentes = demandes.filter(estUrgente).length

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const totalRevenus = demandes
    .filter((d) => d.statut === 'acceptee')
    .reduce((acc, d) => acc + Number(d.prix_souhaite || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">📥 Gestion des demandes</h1>
          <p className="text-indigo-100 text-sm mb-4">
            {demandes.length} demande{demandes.length > 1 ? 's' : ''} ·
            Décision finale
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-indigo-200">
                Urgentes
              </div>
              <div className="text-2xl font-black">{compteUrgentes}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-indigo-200">
                En attente
              </div>
              <div className="text-2xl font-black">{compte('en_attente')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-indigo-200">
                Acceptées
              </div>
              <div className="text-2xl font-black">{compte('acceptee')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-indigo-200">
                Revenus validés
              </div>
              <div className="text-sm font-black">
                {totalRevenus.toLocaleString()} DJF
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-200 mb-1">
              Votre décision est la décision finale
            </p>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Le prof peut pré-accepter/refuser. <strong>Mais TOI tu décides.</strong>{' '}
              Le parent est notifié seulement quand TU valides.
            </p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            val: 'urgentes',
            label: '🚨 Urgentes',
            count: compteUrgentes,
            couleur: 'from-red-600 to-orange-600',
          },
          {
            val: 'en_attente',
            label: '⏳ En attente',
            count: compte('en_attente'),
          },
          {
            val: 'a_valider',
            label: '👍 À valider',
            count: compte('pre_acceptee'),
          },
          {
            val: 'acceptees',
            label: '✅ Acceptées',
            count: compte('acceptee'),
          },
          {
            val: 'refusees',
            label: '❌ Refusées',
            count: compte('refusee'),
          },
          { val: 'toutes', label: '📋 Toutes', count: demandes.length },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val as Onglet)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? `bg-gradient-to-r ${o.couleur || 'from-purple-600 to-blue-600'} text-white shadow-lg`
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.label} ({o.count})
          </button>
        ))}
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="recent">Trier : Plus récent</option>
          <option value="ancien">Plus ancien</option>
          <option value="prix_eleve">Prix élevé</option>
          <option value="prix_bas">Prix bas</option>
          <option value="enfants">Plus d'enfants</option>
        </select>

        <button
          onClick={() => setFiltresAvancesOuverts(!filtresAvancesOuverts)}
          className={`px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
            filtresAvancesOuverts
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-300 border border-white/10'
          }`}
        >
          🎛️ Filtres
        </button>

        <button
          onClick={exporterCSV}
          className="px-4 py-3 rounded-2xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          📤 Export CSV
        </button>

        <button
          onClick={() => {
            setModeSelection(!modeSelection)
            setSelection([])
          }}
          className={`px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
            modeSelection
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 border border-white/10'
          }`}
        >
          {modeSelection ? '✕ Annuler sélection' : '☑️ Sélection multiple'}
        </button>
      </div>

      {/* Filtres avancés */}
      <AnimatePresence>
        {filtresAvancesOuverts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/70 rounded-2xl p-5 border border-white/10 grid md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Prix minimum (DJF)
              </label>
              <input
                type="number"
                value={filtrePrixMin}
                onChange={(e) => setFiltrePrixMin(e.target.value)}
                placeholder="Ex : 10000"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Prix maximum (DJF)
              </label>
              <input
                type="number"
                value={filtrePrixMax}
                onChange={(e) => setFiltrePrixMax(e.target.value)}
                placeholder="Ex : 50000"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltrePrixMin('')
                  setFiltrePrixMax('')
                  setRecherche('')
                }}
                className="w-full px-4 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl font-bold text-sm"
              >
                ✕ Réinitialiser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de sélection */}
      {modeSelection && demandesFiltrees.length > 0 && (
        <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selection.length === demandesFiltrees.length}
              onChange={toutSelectionner}
              className="w-5 h-5 accent-blue-500"
            />
            <span className="text-sm font-bold text-white">
              {selection.length} sélectionnée{selection.length > 1 ? 's' : ''}{' '}
              / {demandesFiltrees.length}
            </span>
          </div>
          {selection.length > 0 && (
            <button
              onClick={validerEnMasse}
              disabled={action}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
            >
              {action ? '⏳...' : `✅ Valider les ${selection.length}`}
            </button>
          )}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      ) : demandesFiltrees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucune demande
          </h3>
          <p className="text-slate-400 text-sm">
            Aucune demande dans cette catégorie.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {demandesFiltrees.map((d, i) => {
            const statutInfo = labelsStatut[d.statut] || labelsStatut.en_attente
            const peutDecider = [
              'en_attente',
              'pre_acceptee',
              'pre_refusee',
            ].includes(d.statut)
            const urgent = estUrgente(d)

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  urgent
                    ? 'bg-red-500/10 border-red-500/40'
                    : 'bg-slate-800/70 border-white/10 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Checkbox */}
                  {modeSelection && (
                    <input
                      type="checkbox"
                      checked={selection.includes(d.id)}
                      onChange={() => toggleSelection(d.id)}
                      className="w-5 h-5 accent-blue-500 mt-1 flex-shrink-0"
                    />
                  )}

                  {/* Icône */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0 ${
                      urgent
                        ? 'bg-gradient-to-br from-red-500 to-orange-600 animate-pulse'
                        : 'bg-gradient-to-br from-purple-500 to-blue-600'
                    }`}
                  >
                    {urgent ? '🚨' : '📩'}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statutInfo.couleur}`}
                      >
                        {statutInfo.emoji} {statutInfo.label}
                      </span>
                      {urgent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-500 text-white animate-pulse">
                          🚨 URGENT — {tempsRestant(d)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {formaterDate(d.created_at)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      {/* Parent */}
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="text-[10px] text-blue-300 font-black uppercase mb-1">
                          👨‍👩‍👧 PARENT
                        </div>
                        <div className="font-bold text-white text-sm">
                          {d.parent_nom}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📧 {d.parent_email}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📞 {d.parent_telephone}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📍 {d.parent_quartier}
                        </div>
                      </div>

                      {/* Prof */}
                      <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-300 font-black uppercase mb-1">
                          👨‍🏫 PROF
                        </div>
                        <div className="font-bold text-white text-sm">
                          {d.prof_nom}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📧 {d.prof_email}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📞 {d.prof_telephone}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📍 {d.prof_quartier}
                        </div>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">
                          👶 ENFANTS
                        </div>
                        <div className="text-white font-bold">
                          {d.nombre_enfants}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">
                          💰 PRIX
                        </div>
                        <div className="text-white font-bold text-sm">
                          {d.prix_souhaite
                            ? `${Number(d.prix_souhaite).toLocaleString()}`
                            : '—'}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">
                          🎓 NIVEAUX
                        </div>
                        <div className="text-white font-bold text-xs truncate">
                          {d.niveaux_souhaites.length > 0
                            ? d.niveaux_souhaites.join(', ')
                            : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Matières */}
                    {d.matiere && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {d.matiere.split(', ').slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30"
                          >
                            {labelsMatieres[m.trim()] || m.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pré-décision */}
                    {d.pre_decision && (
                      <div
                        className={`p-2 rounded-lg border-l-4 ${
                          d.pre_decision === 'pre_acceptee'
                            ? 'bg-blue-500/10 border-blue-500'
                            : 'bg-orange-500/10 border-orange-500'
                        }`}
                      >
                        <div className="text-[10px] font-black text-white">
                          {d.pre_decision === 'pre_acceptee'
                            ? '👍 Le prof a pré-accepté'
                            : '👎 Le prof a pré-refusé'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDemandeDetail(d)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition-colors border border-white/20"
                    >
                      👁️ Détails
                    </button>

                    {peutDecider && (
                      <>
                        <button
                          onClick={() => validerDemande(d)}
                          disabled={action}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
                        >
                          ✅ Valider
                        </button>
                        <button
                          onClick={() => setDemandeDecision(d)}
                          className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl font-bold text-xs border border-red-500/30 hover:bg-red-500/30"
                        >
                          ❌ Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {demandeDetail && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 rounded-t-3xl sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    📩 Détail de la demande
                  </h2>
                  <button
                    onClick={() => setDemandeDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Parent */}
                <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-xs font-black text-blue-300 mb-2">
                    👨‍👩‍👧 PARENT
                  </div>
                  <div className="text-white font-bold mb-1">
                    {demandeDetail.parent_nom}
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {demandeDetail.parent_email}</div>
                    <div>📞 {demandeDetail.parent_telephone}</div>
                    <div>💬 {demandeDetail.parent_whatsapp}</div>
                    <div>📍 {demandeDetail.parent_quartier}</div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {demandeDetail.parent_whatsapp &&
                      demandeDetail.parent_whatsapp !== '—' && (
                        <a
                          href={`https://wa.me/${demandeDetail.parent_whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          💬 WhatsApp parent
                        </a>
                      )}
                    {demandeDetail.parent_telephone &&
                      demandeDetail.parent_telephone !== '—' && (
                        <a
                          href={`tel:${demandeDetail.parent_telephone.replace(/\D/g, '')}`}
                          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          📞 Appeler
                        </a>
                      )}
                  </div>
                </div>

                {/* Prof */}
                <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
                  <div className="text-xs font-black text-emerald-300 mb-2">
                    👨‍🏫 PROFESSEUR
                  </div>
                  <div className="text-white font-bold mb-1">
                    {demandeDetail.prof_nom}
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {demandeDetail.prof_email}</div>
                    <div>📞 {demandeDetail.prof_telephone}</div>
                    <div>💬 {demandeDetail.prof_whatsapp}</div>
                    <div>📍 {demandeDetail.prof_quartier}</div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {demandeDetail.prof_whatsapp &&
                      demandeDetail.prof_whatsapp !== '—' && (
                        <a
                          href={`https://wa.me/${demandeDetail.prof_whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          💬 WhatsApp prof
                        </a>
                      )}
                    {demandeDetail.prof_telephone &&
                      demandeDetail.prof_telephone !== '—' && (
                        <a
                          href={`tel:${demandeDetail.prof_telephone.replace(/\D/g, '')}`}
                          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          📞 Appeler
                        </a>
                      )}
                  </div>
                </div>

                {/* Détails */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">
                    📋 DÉTAILS
                  </div>
                  <div className="text-xs text-slate-300 space-y-2">
                    <div>
                      <strong className="text-white">Enfants :</strong>{' '}
                      {demandeDetail.nombre_enfants}
                    </div>
                    <div>
                      <strong className="text-white">Prix :</strong>{' '}
                      {demandeDetail.prix_souhaite
                        ? `${Number(demandeDetail.prix_souhaite).toLocaleString()} DJF`
                        : '—'}
                    </div>
                    <div>
                      <strong className="text-white">Niveaux :</strong>{' '}
                      {demandeDetail.niveaux_souhaites.join(', ') || '—'}
                    </div>
                    <div>
                      <strong className="text-white">Matières :</strong>{' '}
                      {demandeDetail.matiere || '—'}
                    </div>
                  </div>
                </div>

                {/* Message */}
                {demandeDetail.message && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-xs font-black text-white mb-2">
                      💬 MESSAGE
                    </div>
                    <p className="text-xs text-slate-300 italic whitespace-pre-line leading-relaxed">
                      {demandeDetail.message}
                    </p>
                  </div>
                )}

                {/* Note interne */}
                <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
                  <div className="text-xs font-black text-purple-300 mb-2">
                    🔒 NOTE INTERNE (visible que par toi)
                  </div>
                  <textarea
                    value={noteInterne}
                    onChange={(e) => setNoteInterne(e.target.value)}
                    rows={3}
                    placeholder="Ajoutez une note personnelle (ex : négocier prix à la baisse...)"
                    className="w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-xl text-white text-xs outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3 sticky bottom-0 bg-slate-800">
                <button
                  onClick={() => setDemandeDetail(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Fermer
                </button>
                {[
                  'en_attente',
                  'pre_acceptee',
                  'pre_refusee',
                ].includes(demandeDetail.statut) && (
                  <>
                    <button
                      onClick={() => {
                        setDemandeDecision(demandeDetail)
                        setDemandeDetail(null)
                      }}
                      className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-600 shadow-lg"
                    >
                      ❌ Refuser
                    </button>
                    <button
                      onClick={() => validerDemande(demandeDetail)}
                      disabled={action}
                      className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-50"
                    >
                      {action ? '⏳...' : '✅ Valider'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DÉCISION */}
      <AnimatePresence>
        {demandeDecision && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      ❌ Refuser la demande
                    </h2>
                    <p className="text-xs text-red-200 mt-1">
                      {demandeDecision.parent_nom} → {demandeDecision.prof_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDemandeDecision(null)
                      setMotifRefus('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                  rows={5}
                  placeholder="Motif du refus (visible par le parent)..."
                  className="w-full px-4 py-3 bg-slate-900 border-2 border-red-500/30 rounded-xl text-white text-sm outline-none focus:border-red-500 resize-none"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDemandeDecision(null)
                      setMotifRefus('')
                    }}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => refuserDemande(demandeDecision)}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-700 shadow-lg disabled:opacity-50"
                  >
                    {action ? '⏳...' : '❌ Refuser'}
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