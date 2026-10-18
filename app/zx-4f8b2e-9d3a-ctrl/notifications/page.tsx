'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  destinataire_id: string
  destinataire_nom: string
  destinataire_email: string
  destinataire_role: string
  titre: string
  contenu: string
  lien: string | null
  lu: boolean
  created_at: string
  type?: string
  groupe?: string
}

type Cible = 'tous' | 'parents' | 'profs' | 'admins' | 'specifique' | 'avance'
type TypeNotif = 'info' | 'alerte' | 'promo' | 'maintenance' | 'success'
type Envoi = 'maintenant' | 'programme'
type Recurrence = 'aucune' | 'quotidien' | 'hebdo' | 'mensuel'
type Apercu = 'mobile' | 'desktop'

const typesConfig: {
  [k: string]: { label: string; emoji: string; couleur: string; bg: string }
} = {
  info: {
    label: 'Information',
    emoji: '💡',
    couleur: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
  alerte: {
    label: 'Alerte',
    emoji: '⚠️',
    couleur: 'from-red-500 to-red-600',
    bg: 'bg-red-500/10 border-red-500/30',
  },
  promo: {
    label: 'Promotion',
    emoji: '🎉',
    couleur: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  maintenance: {
    label: 'Maintenance',
    emoji: '🔧',
    couleur: 'from-slate-500 to-slate-600',
    bg: 'bg-slate-500/10 border-slate-500/30',
  },
  success: {
    label: 'Félicitations',
    emoji: '🏆',
    couleur: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
}

const templates = [
  {
    type: 'info',
    titre: '💡 Nouvelle fonctionnalité',
    contenu:
      'Bonjour {{nom}}, découvrez notre nouvelle fonctionnalité disponible dès maintenant sur votre espace personnel.',
  },
  {
    type: 'promo',
    titre: '🎉 Offre spéciale ce mois-ci',
    contenu:
      'Bonjour {{nom}}, profitez de notre offre spéciale ! Connectez-vous pour en savoir plus.',
  },
  {
    type: 'maintenance',
    titre: '🔧 Maintenance prévue',
    contenu:
      'Bonjour {{nom}}, une maintenance est prévue. La plateforme pourrait être indisponible quelques minutes.',
  },
  {
    type: 'alerte',
    titre: '⚠️ Action requise',
    contenu:
      'Bonjour {{nom}}, merci de prendre connaissance de cette information importante concernant votre compte.',
  },
  {
    type: 'success',
    titre: '🏆 Félicitations !',
    contenu:
      'Bravo {{nom}} ! Vous venez d\'atteindre un nouveau palier sur la plateforme.',
  },
]

export default function AdminNotifications() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<'envoyer' | 'historique' | 'stats'>('envoyer')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recherche, setRecherche] = useState('')

  // Formulaire
  const [cible, setCible] = useState<Cible>('tous')
  const [userSpecifiqueId, setUserSpecifiqueId] = useState('')
  const [usersDisponibles, setUsersDisponibles] = useState<
    { id: string; nom: string; role: string }[]
  >([])

  // Filtres avancés
  const [filtreRole, setFiltreRole] = useState<string>('tous')
  const [filtreQuartier, setFiltreQuartier] = useState('')
  const [filtreNoteMin, setFiltreNoteMin] = useState('')
  const [filtreBadge, setFiltreBadge] = useState('')
  const [filtreEtoilesMin, setFiltreEtoilesMin] = useState('')

  const [type, setType] = useState<TypeNotif>('info')
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [lien, setLien] = useState('')
  const [pieceJointe, setPieceJointe] = useState('')
  const [envoiType, setEnvoiType] = useState<Envoi>('maintenant')
  const [dateEnvoi, setDateEnvoi] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('aucune')

  const [apercu, setApercu] = useState<Apercu>('desktop')
  const [action, setAction] = useState(false)
  const [succes, setSucces] = useState('')
  const [voirApercu, setVoirApercu] = useState(false)

  useEffect(() => {
    charger()
    chargerUsers()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      const complets: Notification[] = []

      for (const n of data || []) {
        const { data: user } = await supabase
          .from('profiles')
          .select('nom_complet, email, role')
          .eq('id', n.destinataire_id)
          .single()

        complets.push({
          id: n.id,
          destinataire_id: n.destinataire_id,
          destinataire_nom: user?.nom_complet || '—',
          destinataire_email: user?.email || '—',
          destinataire_role: user?.role || '—',
          titre: n.titre || '',
          contenu: n.contenu || '',
          lien: n.lien || null,
          lu: n.lu === true,
          created_at: n.created_at,
        })
      }

      setNotifications(complets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const chargerUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nom_complet, role')
      .order('nom_complet')

    setUsersDisponibles(
      (data || []).map((u) => ({
        id: u.id,
        nom: u.nom_complet || '—',
        role: u.role || '—',
      }))
    )
  }

  // Calcul des destinataires selon les filtres
  const calculerDestinataires = async (): Promise<
    { id: string; role: string; nom: string }[]
  > => {
    if (cible === 'specifique') {
      const user = usersDisponibles.find((u) => u.id === userSpecifiqueId)
      return user ? [{ id: user.id, role: user.role, nom: user.nom }] : []
    }

    let query = supabase.from('profiles').select('id, role, nom_complet, quartier')

    if (cible === 'parents') query = query.eq('role', 'parent')
    if (cible === 'profs') query = query.eq('role', 'professeur')
    if (cible === 'admins') query = query.eq('role', 'admin')

    if (cible === 'avance') {
      if (filtreRole !== 'tous') query = query.eq('role', filtreRole)
      if (filtreQuartier) query = query.ilike('quartier', `%${filtreQuartier}%`)
    }

    const { data: profils } = await query

    let resultats = (profils || []).map((p) => ({
      id: p.id,
      role: p.role,
      nom: p.nom_complet,
    }))

    // Appliquer les filtres avancés sur les professeurs
    if (filtreNoteMin || filtreBadge || filtreEtoilesMin) {
      const idsProfs = resultats
        .filter((r) => r.role === 'professeur')
        .map((r) => r.id)

      if (idsProfs.length > 0) {
        let profQuery = supabase
          .from('professeurs')
          .select('id, note_moyenne, badge_admin, etoiles')
          .in('id', idsProfs)

        const { data: infos } = await profQuery

        const profsFiltres = new Set<string>()

        ;(infos || []).forEach((info) => {
          let ok = true
          if (
            filtreNoteMin &&
            Number(info.note_moyenne || 0) < Number(filtreNoteMin)
          )
            ok = false
          if (filtreBadge && info.badge_admin !== filtreBadge) ok = false
          if (
            filtreEtoilesMin &&
            Number(info.etoiles || 0) < Number(filtreEtoilesMin)
          )
            ok = false
          if (ok) profsFiltres.add(info.id)
        })

        // Garder parents/admins + profs filtrés
        resultats = resultats.filter(
          (r) => r.role !== 'professeur' || profsFiltres.has(r.id)
        )
      }
    }

    return resultats
  }

  const remplacerVariables = (texte: string, nom: string, role: string) => {
    return texte
      .replace(/\{\{nom\}\}/g, nom)
      .replace(/\{\{role\}\}/g, role === 'professeur' ? 'professeur' : role)
  }

  const envoyer = async (modeTest: boolean = false) => {
    if (!titre.trim() || !contenu.trim()) {
      alert('Veuillez remplir le titre et le contenu')
      return
    }

    if (cible === 'specifique' && !userSpecifiqueId) {
      alert('Veuillez sélectionner un utilisateur')
      return
    }

    if (envoiType === 'programme' && !dateEnvoi) {
      alert('Veuillez choisir une date d\'envoi')
      return
    }

    setAction(true)
    try {
      // Mode TEST : envoyer à soi-même
      if (modeTest) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Utilisateur non connecté')

        const { data: me } = await supabase
          .from('profiles')
          .select('nom_complet, role')
          .eq('id', user.id)
          .single()

        await supabase.from('notifications').insert({
          destinataire_id: user.id,
          titre: `[TEST] ${titre.trim()}`,
          contenu: remplacerVariables(
            contenu.trim(),
            me?.nom_complet || 'Admin',
            me?.role || 'admin'
          ),
          lien: lien.trim() || null,
          lu: false,
        })

        setSucces('✅ Notification test envoyée à ton compte')
        setTimeout(() => setSucces(''), 5000)
        await charger()
        setAction(false)
        return
      }

      // Destinataires réels
      const destinataires = await calculerDestinataires()

      if (destinataires.length === 0) {
        alert('Aucun destinataire trouvé avec ces critères')
        setAction(false)
        return
      }

      // Créer les notifications
      const notifications = destinataires.map((d) => ({
        destinataire_id: d.id,
        titre: titre.trim(),
        contenu: remplacerVariables(contenu.trim(), d.nom, d.role),
        lien: lien.trim() || null,
        lu: false,
      }))

      await supabase.from('notifications').insert(notifications)

      await supabase.from('admin_logs').insert({
        action: 'envoyer_notification',
        details: `${destinataires.length} destinataire(s) | ${titre} | Cible: ${cible}${recurrence !== 'aucune' ? ` | Réc: ${recurrence}` : ''}`,
      })

      setSucces(
        `✅ ${notifications.length} notification(s) envoyée(s) à ${
          cible === 'tous'
            ? 'tous les utilisateurs'
            : cible === 'parents'
            ? 'tous les parents'
            : cible === 'profs'
            ? 'tous les profs'
            : cible === 'admins'
            ? 'tous les admins'
            : cible === 'specifique'
            ? '1 utilisateur'
            : `${destinataires.length} utilisateurs filtrés`
        }`
      )
      setTimeout(() => setSucces(''), 7000)

      // Reset
      setTitre('')
      setContenu('')
      setLien('')
      setPieceJointe('')
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const appliquerTemplate = (t: (typeof templates)[0]) => {
    setType(t.type as TypeNotif)
    setTitre(t.titre)
    setContenu(t.contenu)
  }

  const dupliquer = (n: Notification) => {
    setTitre(n.titre)
    setContenu(n.contenu)
    setLien(n.lien || '')
    setOnglet('envoyer')
    setSucces('✏️ Notification dupliquée. Modifie puis envoie.')
    setTimeout(() => setSucces(''), 4000)
  }

  const notificationsFiltrees = useMemo(() => {
    return notifications.filter((n) => {
      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          n.titre.toLowerCase().includes(r) ||
          n.contenu.toLowerCase().includes(r) ||
          n.destinataire_nom.toLowerCase().includes(r)
        )
      }
      return true
    })
  }, [notifications, recherche])

  // Stats
  const totalEnvoyees = notifications.length
  const totalLues = notifications.filter((n) => n.lu).length
  const totalNonLues = notifications.filter((n) => !n.lu).length
  const tauxLecture =
    totalEnvoyees > 0 ? Math.round((totalLues / totalEnvoyees) * 100) : 0

  // Stats par jour (7 derniers jours)
  const statsParJour = useMemo(() => {
    const jours: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = notifications.filter((n) =>
        n.created_at.startsWith(dateStr)
      ).length
      jours.push({
        date: d.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
        }),
        count,
      })
    }
    return jours
  }, [notifications])

  const maxJour = Math.max(...statsParJour.map((s) => s.count), 1)

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const typeConfig = typesConfig[type]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">📢 Notifications</h1>
          <p className="text-purple-100 text-sm mb-5">
            Envoie un message ciblé à tes utilisateurs
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-purple-200">
                Total envoyées
              </div>
              <div className="text-2xl font-black">{totalEnvoyees}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-purple-200">
                Lues
              </div>
              <div className="text-2xl font-black">{totalLues}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-purple-200">
                Non lues
              </div>
              <div className="text-2xl font-black">{totalNonLues}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-purple-200">
                Taux lecture
              </div>
              <div className="text-2xl font-black">{tauxLecture}%</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'envoyer', label: '📤 Envoyer' },
          { val: 'historique', label: '📋 Historique' },
          { val: 'stats', label: '📊 Statistiques' },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() =>
              setOnglet(o.val as 'envoyer' | 'historique' | 'stats')
            }
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ONGLET ENVOYER */}
      {onglet === 'envoyer' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl space-y-5"
        >
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

          {/* Templates */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">
              ⚡ Modèles rapides
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {templates.map((t, i) => {
                const tConfig = typesConfig[t.type]
                return (
                  <button
                    key={i}
                    onClick={() => appliquerTemplate(t)}
                    className={`p-3 rounded-xl text-left bg-gradient-to-br ${tConfig.couleur} border-2 border-white/10 hover:border-white/30 transition-all`}
                  >
                    <div className="text-xl mb-1">{tConfig.emoji}</div>
                    <div className="text-xs font-black text-white">
                      {tConfig.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cible */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              👥 Destinataires *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {[
                { val: 'tous', label: '🌍 Tous' },
                { val: 'parents', label: '👨‍👩‍👧 Parents' },
                { val: 'profs', label: '👨‍🏫 Profs' },
                { val: 'admins', label: '👑 Admins' },
                { val: 'specifique', label: '🎯 1 user' },
                { val: 'avance', label: '🎛️ Avancé' },
              ].map((c) => (
                <button
                  key={c.val}
                  onClick={() => setCible(c.val as Cible)}
                  className={`p-3 rounded-xl font-bold text-xs transition-all ${
                    cible === c.val
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* User spécifique */}
          {cible === 'specifique' && (
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                🎯 Sélectionner l'utilisateur
              </label>
              <select
                value={userSpecifiqueId}
                onChange={(e) => setUserSpecifiqueId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              >
                <option value="">-- Choisir un utilisateur --</option>
                {usersDisponibles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtres avancés */}
          {cible === 'avance' && (
            <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-5 space-y-4">
              <div className="text-sm font-black text-purple-200">
                🎛️ Filtres avancés
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Rôle
                  </label>
                  <select
                    value={filtreRole}
                    onChange={(e) => setFiltreRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                  >
                    <option value="tous">Tous les rôles</option>
                    <option value="parent">Parents uniquement</option>
                    <option value="professeur">Professeurs uniquement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Quartier
                  </label>
                  <input
                    type="text"
                    value={filtreQuartier}
                    onChange={(e) => setFiltreQuartier(e.target.value)}
                    placeholder="Ex : Héron"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                  />
                </div>

                {filtreRole !== 'parent' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Note minimum
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        value={filtreNoteMin}
                        onChange={(e) => setFiltreNoteMin(e.target.value)}
                        placeholder="Ex : 4"
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Badge
                      </label>
                      <select
                        value={filtreBadge}
                        onChange={(e) => setFiltreBadge(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                      >
                        <option value="">Tous les badges</option>
                        <option value="recommande">🏅 Recommandé</option>
                        <option value="super_pro">👑 Super-Pro</option>
                        <option value="pionnier">🏆 Pionnier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Étoiles minimum
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={filtreEtoilesMin}
                        onChange={(e) => setFiltreEtoilesMin(e.target.value)}
                        placeholder="Ex : 2"
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setFiltreRole('tous')
                  setFiltreQuartier('')
                  setFiltreNoteMin('')
                  setFiltreBadge('')
                  setFiltreEtoilesMin('')
                }}
                className="text-xs text-purple-300 hover:text-purple-200 font-bold"
              >
                ✕ Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              🎨 Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(typesConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setType(key as TypeNotif)}
                  className={`p-3 rounded-xl font-bold text-xs transition-all ${
                    type === key
                      ? `bg-gradient-to-r ${config.couleur} text-white shadow-lg`
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {config.emoji} {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              📝 Titre *
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={100}
              placeholder="Ex : Nouvelle fonctionnalité disponible"
              className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
            />
            <p className="text-xs text-slate-500 mt-1">{titre.length}/100</p>
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              💬 Contenu *
            </label>
            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Détaillez votre message..."
              className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-slate-500">{contenu.length}/500</p>
              <p className="text-xs text-purple-300">
                💡 Variables : <code className="bg-slate-900 px-1 rounded">{'{{nom}}'}</code>{' '}
                <code className="bg-slate-900 px-1 rounded">{'{{role}}'}</code>
              </p>
            </div>
          </div>

          {/* Lien */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              🔗 Lien (optionnel)
            </label>
            <input
              type="text"
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              placeholder="Ex : /espace-professeur/statut"
              className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
            />
          </div>

          {/* Envoi */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                ⏰ Envoi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEnvoiType('maintenant')}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                    envoiType === 'maintenant'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  ⚡ Maintenant
                </button>
                <button
                  onClick={() => setEnvoiType('programme')}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                    envoiType === 'programme'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  📅 Programmé
                </button>
              </div>
              {envoiType === 'programme' && (
                <input
                  type="datetime-local"
                  value={dateEnvoi}
                  onChange={(e) => setDateEnvoi(e.target.value)}
                  className="w-full mt-2 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                🔁 Récurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
              >
                <option value="aucune">Aucune (envoi unique)</option>
                <option value="quotidien">Quotidien</option>
                <option value="hebdo">Hebdomadaire</option>
                <option value="mensuel">Mensuel</option>
              </select>
            </div>
          </div>

          {/* Aperçu toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoirApercu(!voirApercu)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                voirApercu
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-slate-900 text-slate-300 border border-slate-700'
              }`}
            >
              👁️ {voirApercu ? 'Masquer' : 'Voir'} l'aperçu
            </button>

            {voirApercu && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setApercu('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    apercu === 'mobile'
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  📱 Mobile
                </button>
                <button
                  onClick={() => setApercu('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    apercu === 'desktop'
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  💻 Desktop
                </button>
              </div>
            )}
          </div>

          {/* Aperçu */}
          <AnimatePresence>
            {voirApercu && (titre || contenu) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center"
              >
                <div
                  className={`bg-slate-900 rounded-2xl p-4 border-2 border-dashed border-slate-700 ${
                    apercu === 'mobile' ? 'w-80' : 'w-full'
                  }`}
                >
                  <div className="text-xs text-slate-500 font-black uppercase mb-3 text-center">
                    👁️ Aperçu {apercu}
                  </div>
                  <div className={`${typeConfig.bg} rounded-xl p-4 border`}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{typeConfig.emoji}</div>
                      <div className="flex-1">
                        <div className="font-black text-white mb-1">
                          {remplacerVariables(titre, 'Ahmed', 'parent')}
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed">
                          {remplacerVariables(contenu, 'Ahmed', 'parent')}
                        </div>
                        {lien && (
                          <div className="text-xs text-blue-300 mt-2 font-bold">
                            → {lien}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boutons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => envoyer(true)}
              disabled={action || !titre.trim() || !contenu.trim()}
              className="px-5 py-4 rounded-xl font-bold text-white bg-slate-700 hover:bg-slate-600 shadow-lg disabled:opacity-50 transition-colors"
            >
              🧪 Envoyer un test
            </button>
            <button
              onClick={() => envoyer(false)}
              disabled={action || !titre.trim() || !contenu.trim()}
              className="flex-1 min-w-[200px] py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all disabled:opacity-50 text-base"
            >
              {action ? '⏳ Envoi en cours...' : '📢 Envoyer la notification'}
            </button>
          </div>
        </motion.div>
      )}

      {/* ONGLET HISTORIQUE */}
      {onglet === 'historique' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher dans l'historique..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
              />
            </div>
          ) : notificationsFiltrees.length === 0 ? (
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="font-black text-white text-xl mb-2">
                Aucune notification
              </h3>
              <p className="text-slate-400 text-sm">
                Aucune notification dans l'historique.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notificationsFiltrees.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01 }}
                  className={`backdrop-blur-xl rounded-2xl p-4 border transition-all ${
                    n.lu
                      ? 'bg-slate-800/70 border-white/10'
                      : 'bg-blue-500/5 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0 ${
                        n.lu
                          ? 'bg-gradient-to-br from-slate-500 to-slate-600'
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}
                    >
                      {n.lu ? '📖' : '📩'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className="font-bold text-white text-sm">
                          {n.titre}
                        </div>
                        {!n.lu && (
                          <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black">
                            NON LU
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {formaterDate(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {n.contenu}
                      </p>
                      <div className="text-[10px] text-slate-500 mt-1">
                        👤 {n.destinataire_nom} ({n.destinataire_role})
                      </div>
                    </div>
                    <button
                      onClick={() => dupliquer(n)}
                      className="px-3 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 border border-white/20"
                      title="Dupliquer"
                    >
                      📋
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ONGLET STATS */}
      {onglet === 'stats' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Activité 7 derniers jours */}
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4">
              📊 Activité 7 derniers jours
            </h3>
            <div className="flex items-end justify-between gap-2 h-48">
              {statsParJour.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-slate-400 font-bold mb-2">
                    {s.count}
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max((s.count / maxJour) * 100, 4)}%`,
                    }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-lg"
                  />
                  <div className="text-[10px] text-slate-400 mt-2 font-bold">
                    {s.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats par type */}
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <h3 className="text-lg font-black text-white mb-4">
              📈 Répartition
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                <div className="text-xs text-purple-300 font-black uppercase">
                  Total
                </div>
                <div className="text-2xl font-black text-white">
                  {totalEnvoyees}
                </div>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                <div className="text-xs text-emerald-300 font-black uppercase">
                  Lues
                </div>
                <div className="text-2xl font-black text-white">
                  {totalLues}
                </div>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                <div className="text-xs text-blue-300 font-black uppercase">
                  Non lues
                </div>
                <div className="text-2xl font-black text-white">
                  {totalNonLues}
                </div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                <div className="text-xs text-amber-300 font-black uppercase">
                  Taux lecture
                </div>
                <div className="text-2xl font-black text-white">
                  {tauxLecture}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}