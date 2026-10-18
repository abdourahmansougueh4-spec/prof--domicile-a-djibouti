'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Demande = {
  id: string
  parent_id: string
  parent_nom: string
  parent_email: string
  parent_telephone: string
  parent_whatsapp: string
  parent_quartier: string | null
  professeur_id: string
  prof_nom: string
  prof_email: string
  prof_telephone: string
  prof_whatsapp: string
  prof_quartier: string | null
  enfant_id: string | null
  enfant_prenom: string | null
  matiere: string | null
  message: string | null
  statut: string
  motif_refus: string | null
  nombre_enfants: number
  prix_souhaite: number | null
  prix_propose: number | null
  niveaux_souhaites: string[]
  creneaux_souhaites: string[]
  created_at: string
  updated_at: string
}

type Tri = 'recent' | 'ancien' | 'prix_eleve' | 'prix_bas' | 'urgentes'

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminDemandesAValider() {
  const supabase = createClient()

  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [tri, setTri] = useState<Tri>('urgentes')
  const [recherche, setRecherche] = useState('')
  const [action, setAction] = useState(false)
  const [succes, setSucces] = useState('')
  const [detail, setDetail] = useState<Demande | null>(null)
  const [decisionRefus, setDecisionRefus] = useState<Demande | null>(null)
  const [motifRefus, setMotifRefus] = useState('')
  const [noteInterne, setNoteInterne] = useState('')
  const [exportEnCours, setExportEnCours] = useState(false)
  const [derniereMaj, setDerniereMaj] = useState<Date>(new Date())
  const [selection, setSelection] = useState<string[]>([])
  const [modeSelection, setModeSelection] = useState(false)

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, est_admin, banni')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin' || !profile.est_admin) {
        setErreur('Accès refusé.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('demandes')
        .select('*')
        .eq('statut', 'pre_acceptee')
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Demande[] = []

      for (const d of data || []) {
        const [parentRes, profRes, enfantRes] = await Promise.all([
          supabase.from('profiles').select('nom_complet, email, telephone, whatsapp, quartier').eq('id', d.parent_id).single(),
          supabase.from('profiles').select('nom_complet, email, telephone, whatsapp, quartier').eq('id', d.professeur_id).single(),
          d.enfant_id
            ? supabase.from('enfants').select('prenom').eq('id', d.enfant_id).single()
            : Promise.resolve({ data: null }),
        ])

        complets.push({
          id: d.id,
          parent_id: d.parent_id,
          parent_nom: parentRes.data?.nom_complet || 'Parent',
          parent_email: parentRes.data?.email || '—',
          parent_telephone: parentRes.data?.telephone || '—',
          parent_whatsapp: parentRes.data?.whatsapp || '—',
          parent_quartier: parentRes.data?.quartier || null,
          professeur_id: d.professeur_id,
          prof_nom: profRes.data?.nom_complet || 'Prof',
          prof_email: profRes.data?.email || '—',
          prof_telephone: profRes.data?.telephone || '—',
          prof_whatsapp: profRes.data?.whatsapp || '—',
          prof_quartier: profRes.data?.quartier || null,
          enfant_id: d.enfant_id,
          enfant_prenom: enfantRes.data?.prenom || null,
          matiere: d.matiere || null,
          message: d.message || null,
          statut: d.statut || 'pre_acceptee',
          motif_refus: d.motif_refus || null,
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          prix_propose: d.prix_propose ? Number(d.prix_propose) : null,
          niveaux_souhaites: d.niveaux_souhaites || [],
          creneaux_souhaites: d.creneaux_souhaites || [],
          created_at: d.created_at,
          updated_at: d.updated_at || d.created_at,
        })
      }

      setDemandes(complets)
      setDerniereMaj(new Date())
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // URGENCE
  // ============================================================

  const estUrgente = (d: Demande) => {
    const diffH = (Date.now() - new Date(d.updated_at).getTime()) / 3600000
    return diffH > 24
  }

  const tempsDepuisPreAcceptation = (d: Demande) => {
    const diffH = (Date.now() - new Date(d.updated_at).getTime()) / 3600000
    if (diffH < 1) return 'À l\'instant'
    if (diffH < 24) return `Il y a ${Math.floor(diffH)}h`
    return `Il y a ${Math.floor(diffH / 24)}j`
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  const validerFinal = async (d: Demande) => {
    if (!confirm(`✅ VALIDER DÉFINITIVEMENT cette demande ?\n\n${d.parent_nom} → ${d.prof_nom}\n\nLe parent ET le prof seront notifiés.`)) return

    setAction(true)
    try {
      const { error } = await supabase
        .from('demandes')
        .update({ statut: 'acceptee', motif_refus: null })
        .eq('id', d.id)

      if (error) throw error

      await supabase.from('notifications').insert([
        {
          destinataire_id: d.parent_id,
          titre: '🎉 Demande acceptée !',
          contenu: `Votre demande pour ${d.prof_nom} a été acceptée. L'équipe va vous contacter pour finaliser.`,
          lien: '/espace-parent/demandes',
          lu: false,
        },
        {
          destinataire_id: d.professeur_id,
          titre: '✅ Élève confirmé',
          contenu: `Nouvel élève confirmé : ${d.parent_nom}. L'équipe vous contactera bientôt.`,
          lien: '/espace-professeur/eleves',
          lu: false,
        },
      ])

      await supabase.from('admin_logs').insert({
        action: 'valider_demande',
        details: `${d.parent_nom} → ${d.prof_nom} (pré-acceptée)`,
      })

      setSucces('✅ Demande validée définitivement !')
      setTimeout(() => setSucces(''), 4000)
      setDetail(null)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const refuser = async () => {
    if (!decisionRefus) return
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer un motif')
      return
    }

    setAction(true)
    try {
      await supabase
        .from('demandes')
        .update({ statut: 'refusee', motif_refus: motifRefus.trim() })
        .eq('id', decisionRefus.id)

      await supabase.from('notifications').insert([
        {
          destinataire_id: decisionRefus.parent_id,
          titre: '❌ Demande refusée',
          contenu: `Votre demande pour ${decisionRefus.prof_nom} n'a pas été acceptée. Motif : ${motifRefus}`,
          lien: '/espace-parent/demandes',
          lu: false,
        },
        {
          destinataire_id: decisionRefus.professeur_id,
          titre: '❌ Demande annulée',
          contenu: `La demande de ${decisionRefus.parent_nom} n'a pas été confirmée. Motif : ${motifRefus}`,
          lien: '/espace-professeur/demandes',
          lu: false,
        },
      ])

      await supabase.from('admin_logs').insert({
        action: 'refuser_demande',
        details: `${decisionRefus.parent_nom} → ${decisionRefus.prof_nom} | ${motifRefus}`,
      })

      setSucces('❌ Demande refusée')
      setTimeout(() => setSucces(''), 4000)
      setDecisionRefus(null)
      setDetail(null)
      setMotifRefus('')
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const validerEnMasse = async () => {
    if (selection.length === 0) return
    if (!confirm(`✅ VALIDER ${selection.length} demande(s) ?`)) return

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
            titre: '✅ Élève confirmé',
            contenu: `Nouvel élève confirmé : ${d.parent_nom}.`,
            lien: '/espace-professeur/eleves',
            lu: false,
          },
        ])
      }

      await supabase.from('admin_logs').insert({
        action: 'valider_demandes_masse',
        details: `${selection.length} demandes pré-acceptées validées`,
      })

      setSucces(`✅ ${selection.length} demandes validées !`)
      setTimeout(() => setSucces(''), 4000)
      setSelection([])
      setModeSelection(false)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const demandesFiltrees = useMemo(() => {
    let resultat = demandes.filter((d) => {
      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          d.parent_nom.toLowerCase().includes(r) ||
          d.prof_nom.toLowerCase().includes(r) ||
          d.parent_email.toLowerCase().includes(r) ||
          d.prof_email.toLowerCase().includes(r) ||
          d.matiere?.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'urgentes') {
      resultat.sort((a, b) => {
        const ua = estUrgente(a) ? 1 : 0
        const ub = estUrgente(b) ? 1 : 0
        if (ua !== ub) return ub - ua
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      })
    }
    if (tri === 'recent') resultat.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    if (tri === 'prix_eleve') resultat.sort((a, b) => (b.prix_propose || b.prix_souhaite || 0) - (a.prix_propose || a.prix_souhaite || 0))
    if (tri === 'prix_bas') resultat.sort((a, b) => (a.prix_propose || a.prix_souhaite || 0) - (b.prix_propose || b.prix_souhaite || 0))

    return resultat
  }, [demandes, tri, recherche])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const urgentes = demandes.filter(estUrgente).length
    const montantTotal = demandes.reduce((acc, d) => acc + (d.prix_propose || d.prix_souhaite || 0), 0)
    return { total: demandes.length, urgentes, montantTotal }
  }, [demandes])

  // ============================================================
  // SÉLECTION
  // ============================================================

  const toggleSelection = (id: string) => {
    setSelection(selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id])
  }

  const toutSelectionner = () => {
    if (selection.length === demandesFiltrees.length) setSelection([])
    else setSelection(demandesFiltrees.map((d) => d.id))
  }

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (demandesFiltrees.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = ['Date', 'Parent', 'Email Parent', 'Tel Parent', 'Prof', 'Email Prof', 'Tel Prof', 'Enfant', 'Matière', 'Prix souhaité', 'Prix proposé', 'Heures en attente']
      const rows = demandesFiltrees.map((d) => [
        new Date(d.created_at).toLocaleDateString('fr-FR'),
        d.parent_nom, d.parent_email, d.parent_telephone,
        d.prof_nom, d.prof_email, d.prof_telephone,
        d.enfant_prenom || '', d.matiere || '',
        d.prix_souhaite || '', d.prix_propose || '',
        Math.floor((Date.now() - new Date(d.updated_at).getTime()) / 3600000),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `demandes-a-valider-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export demandes pré-acceptées : ${demandesFiltrees.length}`,
      })

      setSucces(`✅ ${demandesFiltrees.length} demandes exportées`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [demandesFiltrees, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  // ============================================================
  // RENDU
  // ============================================================

  if (erreur) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-white mb-2">Erreur d'accès</h2>
          <p className="text-red-200 text-sm mb-6">{erreur}</p>
          <button
            onClick={charger}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-sm shadow-lg"
          >
            🔄 Réessayer
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">👍 Pré-acceptées (à valider)</h1>
                {stats.urgentes > 0 && (
                  <span className="flex items-center gap-1 bg-red-500/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black border border-red-300/50 animate-pulse">
                    🚨 {stats.urgentes} urgente{stats.urgentes > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-cyan-100 text-sm">
                {demandes.length} demande{demandes.length > 1 ? 's' : ''} pré-acceptée{demandes.length > 1 ? 's' : ''} ·
                Maj : {derniereMaj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setModeSelection(!modeSelection); setSelection([]) }}
                className={`px-4 py-3 rounded-xl font-bold text-white backdrop-blur-sm border transition-all text-sm ${
                  modeSelection
                    ? 'bg-blue-500/40 border-blue-300/50'
                    : 'bg-white/10 hover:bg-white/20 border-white/30'
                }`}
              >
                {modeSelection ? '✕ Annuler' : '☑️ Sélection'}
              </button>
              <button
                onClick={charger}
                disabled={loading}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={exporterCSV}
                disabled={exportEnCours || demandesFiltrees.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-cyan-200">Total</div>
              <div className="text-2xl font-black">{stats.total}</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-300/40">
              <div className="text-[10px] font-black uppercase text-red-100">Urgentes (+24h)</div>
              <div className="text-2xl font-black">{stats.urgentes}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-cyan-200">Montant total</div>
              <div className="text-lg font-black">{stats.montantTotal.toLocaleString()} DJF</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-cyan-200">Sélectionnées</div>
              <div className="text-2xl font-black">{selection.length}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MESSAGE SUCCÈS */}
      <AnimatePresence>
        {succes && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-xl">✅</span>
            <p className="text-emerald-200 text-sm font-bold">{succes}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INFO */}
      <div className="bg-teal-500/10 border-l-4 border-teal-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">👍</span>
          <div>
            <p className="text-sm font-bold text-teal-200 mb-1">
              Le prof a pré-accepté — à toi de valider
            </p>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              Le prof a donné son accord préliminaire. <strong>Ta validation finale confirme l'élève.</strong>
              Le parent et le prof seront tous les deux notifiés.
            </p>
          </div>
        </div>
      </div>

      {/* BARRE SÉLECTION */}
      {modeSelection && demandesFiltrees.length > 0 && (
        <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selection.length === demandesFiltrees.length && demandesFiltrees.length > 0}
              onChange={toutSelectionner}
              className="w-5 h-5 accent-blue-500"
            />
            <span className="text-sm font-bold text-white">
              {selection.length} sélectionnée{selection.length > 1 ? 's' : ''} / {demandesFiltrees.length}
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

      {/* RECHERCHE + TRI */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par parent, prof ou matière..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
          />
          {recherche && (
            <button
              onClick={() => setRecherche('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
        >
          <option value="urgentes">🚨 Urgentes d'abord</option>
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="prix_eleve">💰 Prix élevé</option>
          <option value="prix_bas">💰 Prix bas</option>
        </select>
      </div>

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement des demandes...</p>
        </div>
      ) : demandesFiltrees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="font-black text-white text-xl mb-2">
            {demandes.length === 0 ? 'Aucune demande pré-acceptée' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm">
            {demandes.length === 0 ? 'Toutes les pré-acceptations sont traitées. Bravo !' : 'Aucune demande ne correspond.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {demandesFiltrees.map((d, i) => {
            const urgent = estUrgente(d)
            const prixFinal = d.prix_propose || d.prix_souhaite
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  urgent
                    ? 'bg-red-500/10 border-red-500/40'
                    : 'bg-teal-500/5 border-teal-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {modeSelection && (
                    <input
                      type="checkbox"
                      checked={selection.includes(d.id)}
                      onChange={() => toggleSelection(d.id)}
                      className="w-5 h-5 accent-blue-500 mt-1 flex-shrink-0"
                    />
                  )}

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0 ${
                    urgent
                      ? 'bg-gradient-to-br from-red-500 to-orange-600 animate-pulse'
                      : 'bg-gradient-to-br from-teal-500 to-cyan-600'
                  }`}>
                    {urgent ? '🚨' : '👍'}
                  </div>

                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {urgent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-500 text-white animate-pulse">
                          🚨 URGENT
                        </span>
                      )}
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-black border border-teal-500/30">
                        👍 PRÉ-ACCEPTÉE
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {tempsDepuisPreAcceptation(d)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="text-[10px] text-blue-300 font-black uppercase mb-1">👨‍👩‍👧 Parent</div>
                        <div className="font-bold text-white text-sm">{d.parent_nom}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">📧 {d.parent_email}</div>
                        <div className="text-[10px] text-slate-400">📞 {d.parent_telephone}</div>
                      </div>

                      <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-300 font-black uppercase mb-1">👨‍🏫 Prof</div>
                        <div className="font-bold text-white text-sm">{d.prof_nom}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">📧 {d.prof_email}</div>
                        <div className="text-[10px] text-slate-400">📞 {d.prof_telephone}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">👶 ENFANTS</div>
                        <div className="text-white font-bold">{d.nombre_enfants}</div>
                      </div>
                      <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/30">
                        <div className="text-[9px] text-amber-300 font-black">💰 PRIX</div>
                        <div className="text-white font-bold text-sm">
                          {prixFinal ? `${Number(prixFinal).toLocaleString()}` : '—'}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-[9px] text-slate-500 font-black">📚 MATIÈRE</div>
                        <div className="text-white font-bold text-xs truncate">{d.matiere || '—'}</div>
                      </div>
                    </div>

                    {d.prix_propose && d.prix_souhaite && d.prix_propose !== d.prix_souhaite && (
                      <div className="text-[10px] text-amber-300 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                        💡 Prix proposé par le prof : <strong>{Number(d.prix_propose).toLocaleString()} DJF</strong>
                        {' · '}
                        Prix souhaité parent : <strong>{Number(d.prix_souhaite).toLocaleString()} DJF</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(d)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      👁️ Détails
                    </button>
                    <button
                      onClick={() => validerFinal(d)}
                      disabled={action}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
                    >
                      ✅ Valider
                    </button>
                    <button
                      onClick={() => { setDecisionRefus(d); setMotifRefus('') }}
                      className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl font-bold text-xs border border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* INFO BAS */}
      {!loading && demandesFiltrees.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? 's' : ''} affichée{demandesFiltrees.length > 1 ? 's' : ''}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-white/10 my-8"
            >
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">👍 Détail de la pré-acceptation</h2>
                    <p className="text-xs text-cyan-100 mt-1">
                      Le prof a pré-accepté {tempsDepuisPreAcceptation(detail)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-xs font-black text-blue-300 mb-2">👨‍👩‍👧 PARENT</div>
                  <div className="text-white font-bold mb-1">{detail.parent_nom}</div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.parent_email}</div>
                    <div>📞 {detail.parent_telephone}</div>
                    <div>💬 {detail.parent_whatsapp}</div>
                    {detail.parent_quartier && <div>📍 {detail.parent_quartier}</div>}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {detail.parent_whatsapp !== '—' && (
                      <a
                        href={`https://wa.me/${detail.parent_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        💬 WhatsApp parent
                      </a>
                    )}
                    {detail.parent_telephone !== '—' && (
                      <a
                        href={`tel:${detail.parent_telephone.replace(/\D/g, '')}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        📞 Appeler
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
                  <div className="text-xs font-black text-emerald-300 mb-2">👨‍🏫 PROFESSEUR</div>
                  <div className="text-white font-bold mb-1">{detail.prof_nom}</div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.prof_email}</div>
                    <div>📞 {detail.prof_telephone}</div>
                    <div>💬 {detail.prof_whatsapp}</div>
                    {detail.prof_quartier && <div>📍 {detail.prof_quartier}</div>}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {detail.prof_whatsapp !== '—' && (
                      <a
                        href={`https://wa.me/${detail.prof_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        💬 WhatsApp prof
                      </a>
                    )}
                    {detail.prof_telephone !== '—' && (
                      <a
                        href={`tel:${detail.prof_telephone.replace(/\D/g, '')}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        📞 Appeler
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">📋 DÉTAILS</div>
                  <div className="text-xs text-slate-300 space-y-2">
                    <div><strong className="text-white">Enfant :</strong> {detail.enfant_prenom || '—'}</div>
                    <div><strong className="text-white">Enfants :</strong> {detail.nombre_enfants}</div>
                    <div><strong className="text-white">Matière :</strong> {detail.matiere || '—'}</div>
                    {detail.prix_souhaite && (
                      <div><strong className="text-white">Prix souhaité parent :</strong> {Number(detail.prix_souhaite).toLocaleString()} DJF</div>
                    )}
                    {detail.prix_propose && (
                      <div><strong className="text-amber-300">Prix proposé prof :</strong> {Number(detail.prix_propose).toLocaleString()} DJF</div>
                    )}
                    {detail.niveaux_souhaites.length > 0 && (
                      <div><strong className="text-white">Niveaux :</strong> {detail.niveaux_souhaites.join(', ')}</div>
                    )}
                    {detail.creneaux_souhaites.length > 0 && (
                      <div><strong className="text-white">Créneaux :</strong> {detail.creneaux_souhaites.join(', ')}</div>
                    )}
                  </div>
                </div>

                {detail.message && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-xs font-black text-white mb-2">💬 Message initial</div>
                    <p className="text-xs text-slate-300 italic whitespace-pre-line leading-relaxed">
                      {detail.message}
                    </p>
                  </div>
                )}

                <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
                  <div className="text-xs font-black text-purple-300 mb-2">🔒 Note interne</div>
                  <textarea
                    value={noteInterne}
                    onChange={(e) => setNoteInterne(e.target.value)}
                    rows={3}
                    placeholder="Note admin (visible par toi seul)..."
                    className="w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-xl text-white text-xs outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3 flex-wrap">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => { setDecisionRefus(detail); setDetail(null); setMotifRefus('') }}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  ❌ Refuser
                </button>
                <button
                  onClick={() => validerFinal(detail)}
                  disabled={action}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-50"
                >
                  {action ? '⏳...' : '✅ Valider définitivement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL REFUS */}
      <AnimatePresence>
        {decisionRefus && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDecisionRefus(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">❌ Refuser</h2>
                    <p className="text-xs text-red-200 mt-1">
                      {decisionRefus.parent_nom} → {decisionRefus.prof_nom}
                    </p>
                  </div>
                  <button
                    onClick={() => setDecisionRefus(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Motif du refus <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={motifRefus}
                    onChange={(e) => setMotifRefus(e.target.value)}
                    rows={5}
                    placeholder="Ex : Prix incohérent, doublon, problème de disponibilité..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-red-500/30 rounded-xl text-white text-sm outline-none focus:border-red-500 resize-none"
                  />
                </div>

                <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-3">
                  <p className="text-[10px] text-amber-200">
                    ⚠️ Le parent ET le prof recevront ce motif.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDecisionRefus(null)}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={refuser}
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