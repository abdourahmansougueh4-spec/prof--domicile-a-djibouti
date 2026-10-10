'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Message = {
  id: string
  expediteur_id: string | null
  expediteur_nom: string
  expediteur_email: string
  expediteur_role: string
  destinataire_id: string | null
  destinataire_nom: string
  destinataire_email: string
  destinataire_role: string
  demande_id: string | null
  contenu: string
  lu: boolean
  signale: boolean
  created_at: string
}

type Onglet = 'signales' | 'non_lus' | 'tous' | 'recents'
type Tri = 'recent' | 'ancien' | 'signales_first'

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminMessages() {
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState<Onglet>('signales')
  const [tri, setTri] = useState<Tri>('signales_first')
  const [recherche, setRecherche] = useState('')
  const [action, setAction] = useState(false)
  const [succes, setSucces] = useState('')
  const [detail, setDetail] = useState<Message | null>(null)
  const [exportEnCours, setExportEnCours] = useState(false)
  const [derniereMaj, setDerniereMaj] = useState<Date>(new Date())

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
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      const complets: Message[] = []

      for (const m of data || []) {
        const [expRes, destRes] = await Promise.all([
          m.expediteur_id
            ? supabase
                .from('profiles')
                .select('nom_complet, email, role')
                .eq('id', m.expediteur_id)
                .single()
            : Promise.resolve({ data: null }),
          m.destinataire_id
            ? supabase
                .from('profiles')
                .select('nom_complet, email, role')
                .eq('id', m.destinataire_id)
                .single()
            : Promise.resolve({ data: null }),
        ])

        complets.push({
          id: m.id,
          expediteur_id: m.expediteur_id || null,
          expediteur_nom: expRes.data?.nom_complet || 'Inconnu',
          expediteur_email: expRes.data?.email || '—',
          expediteur_role: expRes.data?.role || '—',
          destinataire_id: m.destinataire_id || null,
          destinataire_nom: destRes.data?.nom_complet || 'Inconnu',
          destinataire_email: destRes.data?.email || '—',
          destinataire_role: destRes.data?.role || '—',
          demande_id: m.demande_id || null,
          contenu: m.contenu || '(message vide)',
          lu: m.lu === true,
          signale: m.signale === true,
          created_at: m.created_at,
        })
      }

      setMessages(complets)
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
  // ACTIONS
  // ============================================================

  const toggleSignale = async (m: Message) => {
    setAction(true)
    try {
      await supabase
        .from('messages')
        .update({ signale: !m.signale })
        .eq('id', m.id)

      await supabase.from('admin_logs').insert({
        action: m.signale ? 'message_marque_traite' : 'message_signale',
        details: `${m.expediteur_nom} → ${m.destinataire_nom}`,
      })

      setSucces(m.signale ? '✅ Message marqué comme traité' : '🚨 Message signalé')
      setTimeout(() => setSucces(''), 3000)
      setDetail(null)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const toggleLu = async (m: Message) => {
    setAction(true)
    try {
      await supabase
        .from('messages')
        .update({ lu: !m.lu })
        .eq('id', m.id)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const supprimer = async (m: Message) => {
    if (!confirm(`⚠️ SUPPRIMER ce message ?\n\nDe : ${m.expediteur_nom}\nÀ : ${m.destinataire_nom}\n\n"${m.contenu.substring(0, 100)}..."`)) return

    setAction(true)
    try {
      await supabase.from('messages').delete().eq('id', m.id)

      await supabase.from('admin_logs').insert({
        action: 'supprimer_message',
        details: `${m.expediteur_nom} → ${m.destinataire_nom}`,
      })

      setSucces('🗑️ Message supprimé')
      setTimeout(() => setSucces(''), 3000)
      setDetail(null)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const bannirExpediteur = async (m: Message) => {
    if (!m.expediteur_id) {
      alert('Impossible d\'identifier l\'expéditeur')
      return
    }

    const motif = prompt(`🚫 Bannir ${m.expediteur_nom} ?\n\nMotif du bannissement :`)
    if (!motif) return

    setAction(true)
    try {
      await supabase
        .from('profiles')
        .update({
          banni: true,
          motif_bannissement: `Banni depuis modération messages : ${motif}`,
        })
        .eq('id', m.expediteur_id)

      await supabase.from('notifications').insert({
        destinataire_id: m.expediteur_id,
        titre: '🚫 Compte suspendu',
        contenu: `Votre compte a été suspendu. Motif : ${motif}`,
        lu: false,
      })

      await supabase.from('admin_logs').insert({
        action: 'bannir_utilisateur',
        details: `${m.expediteur_nom} (depuis modération messages) - ${motif}`,
      })

      setSucces(`🚫 ${m.expediteur_nom} banni`)
      setTimeout(() => setSucces(''), 4000)
      setDetail(null)
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

  const messagesFiltres = useMemo(() => {
    let resultat = messages.filter((m) => {
      if (onglet === 'signales' && !m.signale) return false
      if (onglet === 'non_lus' && m.lu) return false
      if (onglet === 'recents') {
        const diffH = (Date.now() - new Date(m.created_at).getTime()) / 3600000
        if (diffH > 24) return false
      }

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          m.contenu.toLowerCase().includes(r) ||
          m.expediteur_nom.toLowerCase().includes(r) ||
          m.destinataire_nom.toLowerCase().includes(r) ||
          m.expediteur_email.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'signales_first') {
      resultat.sort((a, b) => {
        if (a.signale !== b.signale) return a.signale ? -1 : 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }
    if (tri === 'recent') resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return resultat
  }, [messages, onglet, recherche, tri])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useCallback(
    (o: Onglet) => {
      if (o === 'signales') return messages.filter((m) => m.signale).length
      if (o === 'non_lus') return messages.filter((m) => !m.lu).length
      if (o === 'tous') return messages.length
      if (o === 'recents') {
        return messages.filter((m) => {
          const diffH = (Date.now() - new Date(m.created_at).getTime()) / 3600000
          return diffH <= 24
        }).length
      }
      return 0
    },
    [messages]
  )

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const total = messages.length
    const signales = messages.filter((m) => m.signale).length
    const nonLus = messages.filter((m) => !m.lu).length
    const tauxSignalement = total > 0 ? Math.round((signales / total) * 100) : 0
    return { total, signales, nonLus, tauxSignalement }
  }, [messages])

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (messagesFiltres.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = ['Date', 'Expéditeur', 'Email Exp.', 'Rôle Exp.', 'Destinataire', 'Email Dest.', 'Rôle Dest.', 'Contenu', 'Lu', 'Signalé']
      const rows = messagesFiltres.map((m) => [
        new Date(m.created_at).toLocaleString('fr-FR'),
        m.expediteur_nom, m.expediteur_email, m.expediteur_role,
        m.destinataire_nom, m.destinataire_email, m.destinataire_role,
        m.contenu.replace(/\n/g, ' '),
        m.lu ? 'Oui' : 'Non',
        m.signale ? 'Oui' : 'Non',
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `messages-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export messages : ${messagesFiltres.length}`,
      })

      setSucces(`✅ ${messagesFiltres.length} messages exportés`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [messagesFiltres, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffJ = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'À l\'instant'
    if (diffMin < 60) return `Il y a ${diffMin} min`
    if (diffH < 24) return `Il y a ${diffH}h`
    if (diffJ < 7) return `Il y a ${diffJ}j`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formaterDateComplete = (date: string) =>
    new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const roleEmoji = (role: string) => {
    if (role === 'parent') return '👨‍👩‍👧'
    if (role === 'professeur') return '👨‍🏫'
    if (role === 'admin') return '👑'
    return '👤'
  }

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
        className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">💬 Modération des messages</h1>
                {stats.signales > 0 && (
                  <span className="flex items-center gap-1 bg-red-500/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black border border-red-300/50 animate-pulse">
                    🚨 {stats.signales} signalé{stats.signales > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-sm">
                {messages.length} message{messages.length > 1 ? 's' : ''} · Surveillance du chat ·
                Maj : {derniereMaj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={charger}
                disabled={loading}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={exporterCSV}
                disabled={exportEnCours || messagesFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">Total messages</div>
              <div className="text-2xl font-black">{stats.total}</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-300/40">
              <div className="text-[10px] font-black uppercase text-red-100">Signalés</div>
              <div className="text-2xl font-black">{stats.signales}</div>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-3 border border-amber-300/40">
              <div className="text-[10px] font-black uppercase text-amber-100">Non lus</div>
              <div className="text-2xl font-black">{stats.nonLus}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">Taux signalement</div>
              <div className="text-2xl font-black">{stats.tauxSignalement}%</div>
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
      <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="text-sm font-bold text-blue-200 mb-1">
              Surveillance des conversations
            </p>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Les messages <strong>signalés</strong> par les utilisateurs remontent ici en priorité.
              Tu peux marquer un message comme traité, le supprimer, ou <strong>bannir l'expéditeur</strong> en cas d'abus.
            </p>
          </div>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { val: 'signales', label: '🚨 Signalés' },
            { val: 'non_lus', label: '📩 Non lus' },
            { val: 'recents', label: '🕐 24h' },
            { val: 'tous', label: '📋 Tous' },
          ] as { val: Onglet; label: string }[]
        ).map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.label} ({compte(o.val)})
          </button>
        ))}
      </div>

      {/* RECHERCHE + TRI */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher dans le contenu ou les noms..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
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
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="signales_first">🚨 Signalés d'abord</option>
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
        </select>
      </div>

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement des messages...</p>
        </div>
      ) : messagesFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">💬</div>
          <h3 className="font-black text-white text-xl mb-2">
            {onglet === 'signales' && messages.filter((m) => m.signale).length === 0
              ? 'Aucun message signalé'
              : 'Aucun message trouvé'}
          </h3>
          <p className="text-slate-400 text-sm">
            {onglet === 'signales' && messages.filter((m) => m.signale).length === 0
              ? 'Bon signe ! Aucun message signalé par les utilisateurs.'
              : 'Aucun message ne correspond à ces critères.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {messagesFiltres.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className={`backdrop-blur-xl rounded-2xl p-5 border transition-all cursor-pointer ${
                m.signale
                  ? 'bg-red-500/10 border-red-500/40 hover:border-red-500/60'
                  : !m.lu
                  ? 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500/50'
                  : 'bg-slate-800/70 border-white/10 hover:border-white/30'
              }`}
              onClick={() => setDetail(m)}
            >
              <div className="flex items-start gap-4">
                {/* Icône signal */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0 ${
                  m.signale
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 animate-pulse'
                    : !m.lu
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-slate-500 to-slate-600'
                }`}>
                  {m.signale ? '🚨' : !m.lu ? '📩' : '💬'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {m.signale && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-500 text-white animate-pulse">
                        🚨 SIGNALÉ
                      </span>
                    )}
                    {!m.lu && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        📩 NON LU
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {formaterDate(m.created_at)}
                    </span>
                  </div>

                  {/* De → À */}
                  <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
                    <div className="bg-blue-500/10 rounded-lg px-3 py-1.5 border border-blue-500/20">
                      <span className="text-[10px] text-blue-300 font-black mr-1">
                        {roleEmoji(m.expediteur_role)} DE
                      </span>
                      <span className="text-white font-bold">{m.expediteur_nom}</span>
                    </div>
                    <span className="text-slate-500">→</span>
                    <div className="bg-emerald-500/10 rounded-lg px-3 py-1.5 border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-300 font-black mr-1">
                        {roleEmoji(m.destinataire_role)} À
                      </span>
                      <span className="text-white font-bold">{m.destinataire_nom}</span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
                    <p className="text-sm text-slate-200 italic leading-relaxed line-clamp-3">
                      « {m.contenu} »
                    </p>
                  </div>
                </div>

                <span className="text-slate-500 text-xs flex-shrink-0">👁️</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* INFO BAS */}
      {!loading && messagesFiltres.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          {messagesFiltres.length} message{messagesFiltres.length > 1 ? 's' : ''} affiché{messagesFiltres.length > 1 ? 's' : ''} sur {messages.length}
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
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-white/10 my-8 overflow-hidden"
            >
              <div className={`p-6 ${
                detail.signale
                  ? 'bg-gradient-to-r from-red-600 to-rose-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {detail.signale ? '🚨 Message signalé' : '💬 Détail du message'}
                    </h2>
                    <p className="text-xs text-white/80 mt-1">
                      Envoyé {formaterDate(detail.created_at)}
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
                {/* Expéditeur */}
                <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-xs font-black text-blue-300 mb-2">
                    {roleEmoji(detail.expediteur_role)} EXPÉDITEUR
                  </div>
                  <div className="text-white font-bold mb-1">{detail.expediteur_nom}</div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.expediteur_email}</div>
                    <div className="capitalize">👤 {detail.expediteur_role}</div>
                  </div>
                </div>

                {/* Destinataire */}
                <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
                  <div className="text-xs font-black text-emerald-300 mb-2">
                    {roleEmoji(detail.destinataire_role)} DESTINATAIRE
                  </div>
                  <div className="text-white font-bold mb-1">{detail.destinataire_nom}</div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.destinataire_email}</div>
                    <div className="capitalize">👤 {detail.destinataire_role}</div>
                  </div>
                </div>

                {/* Contenu complet */}
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">💬 CONTENU COMPLET</div>
                  <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                    {detail.contenu}
                  </p>
                </div>

                {/* Méta */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">📋 INFORMATIONS</div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div><strong className="text-white">Date :</strong> {formaterDateComplete(detail.created_at)}</div>
                    <div><strong className="text-white">Lu :</strong> {detail.lu ? '✅ Oui' : '📩 Non'}</div>
                    <div><strong className="text-white">Signalé :</strong> {detail.signale ? '🚨 Oui' : 'Non'}</div>
                    {detail.demande_id && (
                      <div><strong className="text-white">Lié à une demande :</strong> {detail.demande_id.substring(0, 8)}...</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleSignale(detail)}
                    disabled={action}
                    className={`py-3 rounded-xl font-bold text-xs border transition-colors disabled:opacity-50 ${
                      detail.signale
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                    }`}
                  >
                    {detail.signale ? '✅ Marquer traité' : '🚨 Signaler'}
                  </button>

                  <button
                    onClick={() => toggleLu(detail)}
                    disabled={action}
                    className="py-3 rounded-xl font-bold text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    {detail.lu ? '📩 Marquer non lu' : '✅ Marquer lu'}
                  </button>

                  <button
                    onClick={() => bannirExpediteur(detail)}
                    disabled={action || detail.expediteur_role === 'admin'}
                    className="py-3 rounded-xl font-bold text-xs bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    🚫 Bannir l'expéditeur
                  </button>

                  <button
                    onClick={() => supprimer(detail)}
                    disabled={action}
                    className="py-3 rounded-xl font-bold text-xs bg-slate-700 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-white/10">
                <button
                  onClick={() => setDetail(null)}
                  className="w-full py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}