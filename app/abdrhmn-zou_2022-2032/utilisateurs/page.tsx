'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Utilisateur = {
  id: string
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string
  role: 'parent' | 'professeur' | 'admin'
  approuve: boolean
  banni: boolean
  motif_bannissement: string | null
  masque: boolean
  motif_masquage: string | null
  date_masquage: string | null
  est_admin: boolean
  created_at: string
}

type FiltreRole = 'tous' | 'parent' | 'professeur' | 'admin'
type FiltreStatut = 'tous' | 'actifs' | 'bannis' | 'masques'

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminUtilisateurs() {
  const supabase = createClient()

  const [users, setUsers] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<FiltreRole>('tous')
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous')
  const [recherche, setRecherche] = useState('')
  const [succes, setSucces] = useState('')

  // Modal édition
  const [userEdit, setUserEdit] = useState<Utilisateur | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editTel, setEditTel] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editQuartier, setEditQuartier] = useState('')
  const [editRole, setEditRole] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)

  // Modal ban
  const [userBan, setUserBan] = useState<Utilisateur | null>(null)
  const [motifBan, setMotifBan] = useState('')

  // Modal masquage
  const [userMasque, setUserMasque] = useState<Utilisateur | null>(null)
  const [motifMasque, setMotifMasque] = useState('')

  // ============================================================
  // CHARGEMENT
  // ============================================================

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const charger = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur:', error)
      setLoading(false)
      return
    }

    setUsers(
      (data || []).map((u) => ({
        ...u,
        masque: u.masque === true,
        motif_masquage: u.motif_masquage || null,
        date_masquage: u.date_masquage || null,
      }))
    )
    setLoading(false)
  }

  // ============================================================
  // ÉDITION
  // ============================================================

  const ouvrirEdition = (u: Utilisateur) => {
    setUserEdit(u)
    setEditNom(u.nom_complet || '')
    setEditEmail(u.email || '')
    setEditTel(u.telephone || '')
    setEditWhatsapp(u.whatsapp || '')
    setEditQuartier(u.quartier || '')
    setEditRole(u.role || 'parent')
  }

  const enregistrerEdition = async () => {
    if (!userEdit) return
    if (!editNom.trim() || editNom.trim().length < 3) {
      alert('Le nom doit contenir au moins 3 caractères')
      return
    }

    setSauvegarde(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nom_complet: editNom.trim(),
          telephone: editTel.trim(),
          whatsapp: editWhatsapp.trim(),
          quartier: editQuartier.trim(),
          role: editRole,
        })
        .eq('id', userEdit.id)

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'modifier_utilisateur',
        details: `${userEdit.nom_complet} → ${editNom}`,
      })

      setSucces('✅ Utilisateur modifié')
      setTimeout(() => setSucces(''), 3000)
      setUserEdit(null)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSauvegarde(false)
    }
  }

  // ============================================================
  // BANNISSEMENT
  // ============================================================

  const bannir = async () => {
    if (!userBan) return
    if (!motifBan.trim()) {
      alert('Veuillez indiquer un motif')
      return
    }

    setSauvegarde(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          banni: true,
          motif_bannissement: motifBan.trim(),
        })
        .eq('id', userBan.id)

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'bannir_utilisateur',
        details: `${userBan.nom_complet} - Motif: ${motifBan}`,
      })

      await supabase.from('notifications').insert({
        destinataire_id: userBan.id,
        titre: '🚫 Compte suspendu',
        contenu: `Votre compte a été suspendu. Motif : ${motifBan}`,
        lu: false,
      })

      setSucces('🚫 Utilisateur banni')
      setTimeout(() => setSucces(''), 3000)
      setUserBan(null)
      setMotifBan('')
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSauvegarde(false)
    }
  }

  const debannir = async (u: Utilisateur) => {
    if (!confirm(`Débannir ${u.nom_complet} ?`)) return

    setSauvegarde(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          banni: false,
          motif_bannissement: null,
        })
        .eq('id', u.id)

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'debannir_utilisateur',
        details: u.nom_complet,
      })

      await supabase.from('notifications').insert({
        destinataire_id: u.id,
        titre: '🔓 Compte réactivé',
        contenu: 'Votre compte a été réactivé. Vous pouvez à nouveau utiliser la plateforme.',
        lu: false,
      })

      setSucces('✅ Utilisateur débanni')
      setTimeout(() => setSucces(''), 3000)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSauvegarde(false)
    }
  }

  // ============================================================
  // MASQUAGE
  // ============================================================

  const masquer = async () => {
    if (!userMasque) return
    if (!motifMasque.trim()) {
      alert('Veuillez indiquer un motif')
      return
    }

    setSauvegarde(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          masque: true,
          motif_masquage: motifMasque.trim(),
          date_masquage: new Date().toISOString(),
        })
        .eq('id', userMasque.id)

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'masquer_utilisateur',
        details: `${userMasque.nom_complet} - Motif: ${motifMasque}`,
      })

      await supabase.from('notifications').insert({
        destinataire_id: userMasque.id,
        titre: '👻 Profil masqué',
        contenu: `Votre profil n'apparaît plus dans les recherches publiques. Motif : ${motifMasque}`,
        lu: false,
      })

      setSucces('👻 Utilisateur masqué')
      setTimeout(() => setSucces(''), 3000)
      setUserMasque(null)
      setMotifMasque('')
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSauvegarde(false)
    }
  }

  const demasquer = async (u: Utilisateur) => {
    if (!confirm(`👁️ Afficher à nouveau ${u.nom_complet} sur la plateforme ?`)) return

    setSauvegarde(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          masque: false,
          motif_masquage: null,
          date_masquage: null,
        })
        .eq('id', u.id)

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'demasquer_utilisateur',
        details: u.nom_complet,
      })

      await supabase.from('notifications').insert({
        destinataire_id: u.id,
        titre: '👁️ Profil réactivé',
        contenu: 'Votre profil est de nouveau visible sur la plateforme.',
        lu: false,
      })

      setSucces('👁️ Utilisateur affiché à nouveau')
      setTimeout(() => setSucces(''), 3000)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSauvegarde(false)
    }
  }

  // ============================================================
  // SUPPRESSION
  // ============================================================

  const supprimer = async (u: Utilisateur) => {
    if (
      !confirm(
        `⚠️ SUPPRIMER DÉFINITIVEMENT ${u.nom_complet} ?\n\nCette action est IRRÉVERSIBLE.`
      )
    )
      return

    if (!confirm(`Confirmez une dernière fois : supprimer ${u.email} ?`)) return

    setSauvegarde(true)
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', u.id)
      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'supprimer_utilisateur',
        details: `${u.nom_complet} (${u.email})`,
      })

      setSucces('🗑️ Utilisateur supprimé')
      setTimeout(() => setSucces(''), 3000)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSauvegarde(false)
    }
  }

  // ============================================================
  // FILTRES
  // ============================================================

  const usersFiltres = useMemo(() => {
    return users.filter((u) => {
      if (filtre !== 'tous' && u.role !== filtre) return false

      if (filtreStatut === 'actifs' && (u.banni || u.masque)) return false
      if (filtreStatut === 'bannis' && !u.banni) return false
      if (filtreStatut === 'masques' && !u.masque) return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          u.nom_complet?.toLowerCase().includes(r) ||
          u.email?.toLowerCase().includes(r) ||
          u.quartier?.toLowerCase().includes(r) ||
          u.telephone?.includes(r)
        )
      }
      return true
    })
  }, [users, filtre, filtreStatut, recherche])

  const compteParRole = (role: string) =>
    users.filter((u) => u.role === role).length

  const compteParStatut = (statut: FiltreStatut) => {
    if (statut === 'tous') return users.length
    if (statut === 'actifs') return users.filter((u) => !u.banni && !u.masque).length
    if (statut === 'bannis') return users.filter((u) => u.banni).length
    if (statut === 'masques') return users.filter((u) => u.masque).length
    return 0
  }

  const labelsRole: {
    [k: string]: { label: string; couleur: string; emoji: string }
  } = {
    parent: {
      label: 'Parent',
      couleur: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      emoji: '👨‍👩‍👧',
    },
    professeur: {
      label: 'Professeur',
      couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      emoji: '👨‍🏫',
    },
    admin: {
      label: 'Admin',
      couleur: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      emoji: '👑',
    },
  }

  // ============================================================
  // RENDU
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white"
      >
        <h1 className="text-3xl font-black mb-2">👥 Utilisateurs</h1>
        <p className="text-blue-100 text-sm">
          {users.length} compte{users.length > 1 ? 's' : ''} au total · Gestion complète
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-[10px] font-black uppercase text-blue-200">
              Total
            </div>
            <div className="text-2xl font-black">{users.length}</div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-300/40">
            <div className="text-[10px] font-black uppercase text-emerald-100">
              Actifs
            </div>
            <div className="text-2xl font-black">{compteParStatut('actifs')}</div>
          </div>
          <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-300/40">
            <div className="text-[10px] font-black uppercase text-red-100">
              Bannis
            </div>
            <div className="text-2xl font-black">{compteParStatut('bannis')}</div>
          </div>
          <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 border border-purple-300/40">
            <div className="text-[10px] font-black uppercase text-purple-100">
              Masqués
            </div>
            <div className="text-2xl font-black">{compteParStatut('masques')}</div>
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

      {/* FILTRES RÔLE */}
      <div>
        <div className="text-[10px] text-slate-400 font-black uppercase mb-2 ml-1">
          Filtrer par rôle
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { val: 'tous', label: '👥 Tous', count: users.length },
            { val: 'parent', label: '👨‍👩‍👧 Parents', count: compteParRole('parent') },
            {
              val: 'professeur',
              label: '👨‍🏫 Professeurs',
              count: compteParRole('professeur'),
            },
            { val: 'admin', label: '👑 Admins', count: compteParRole('admin') },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFiltre(f.val as FiltreRole)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                filtre === f.val
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* FILTRES STATUT */}
      <div>
        <div className="text-[10px] text-slate-400 font-black uppercase mb-2 ml-1">
          Filtrer par statut
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { val: 'tous', label: '📋 Tous', count: compteParStatut('tous') },
            { val: 'actifs', label: '✅ Actifs', count: compteParStatut('actifs') },
            { val: 'bannis', label: '🚫 Bannis', count: compteParStatut('bannis') },
            { val: 'masques', label: '👻 Masqués', count: compteParStatut('masques') },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFiltreStatut(f.val as FiltreStatut)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                filtreStatut === f.val
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          🔍
        </span>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, email, téléphone ou quartier..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
      </div>

      {/* COMPTEUR RÉSULTATS */}
      <div className="text-sm text-slate-400">
        <span className="font-bold text-white">{usersFiltres.length}</span>{' '}
        résultat{usersFiltres.length > 1 ? 's' : ''}
        {recherche && ` pour "${recherche}"`}
      </div>

      {/* LISTE */}
      {usersFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-xl text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucun utilisateur
          </h3>
          <p className="text-slate-400 text-sm">
            Aucun utilisateur ne correspond à ces critères.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {usersFiltres.map((u, i) => {
            const roleInfo = labelsRole[u.role] || labelsRole.parent
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  u.banni
                    ? 'bg-red-500/10 border-red-500/30'
                    : u.masque
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-800/70 border-white/10 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* AVATAR */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                        u.role === 'admin'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                          : u.role === 'professeur'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}
                    >
                      {roleInfo.emoji}
                    </div>
                    {u.banni && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-slate-900">
                        🚫
                      </div>
                    )}
                    {u.masque && !u.banni && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-slate-900">
                        👻
                      </div>
                    )}
                  </div>

                  {/* INFOS */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-black text-white text-base">
                        {u.nom_complet}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${roleInfo.couleur}`}
                      >
                        {roleInfo.emoji} {roleInfo.label}
                      </span>
                      {u.est_admin && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                          👑 ADMIN
                        </span>
                      )}
                      {u.approuve && !u.banni && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black border border-emerald-500/30">
                          ✓ VÉRIFIÉ
                        </span>
                      )}
                      {u.banni && (
                        <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-black border border-red-500/30">
                          🚫 BANNI
                        </span>
                      )}
                      {u.masque && !u.banni && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                          👻 MASQUÉ
                        </span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-1 text-xs text-slate-400">
                      <div>📧 {u.email || '—'}</div>
                      <div>📞 {u.telephone || '—'}</div>
                      <div>💬 {u.whatsapp || '—'}</div>
                      <div>📍 {u.quartier || '—'}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Inscrit le{' '}
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => ouvrirEdition(u)}
                      className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                    >
                      ✏️ Modifier
                    </button>

                    {!u.banni ? (
                      <button
                        onClick={() => setUserBan(u)}
                        className="px-3 py-2 bg-red-500/20 text-red-300 rounded-xl font-bold text-xs hover:bg-red-500/30 transition-colors border border-red-500/30"
                      >
                        🚫 Bannir
                      </button>
                    ) : (
                      <button
                        onClick={() => debannir(u)}
                        className="px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl font-bold text-xs hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                      >
                        🔓 Débannir
                      </button>
                    )}

                    {!u.masque ? (
                      <button
                        onClick={() => {
                          setUserMasque(u)
                          setMotifMasque('')
                        }}
                        className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-xl font-bold text-xs hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                      >
                        👻 Masquer
                      </button>
                    ) : (
                      <button
                        onClick={() => demasquer(u)}
                        className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                      >
                        👁️ Afficher
                      </button>
                    )}

                    <button
                      onClick={() => supprimer(u)}
                      className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-xl font-bold text-xs hover:bg-red-500/30 hover:text-red-300 transition-colors border border-slate-700"
                    >
                      🗑️
                    </button>

                    {u.whatsapp && (
                      <a
                        href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs hover:bg-green-500/30 transition-colors border border-green-500/30"
                      >
                        💬
                      </a>
                    )}
                  </div>
                </div>

                {/* MOTIF BAN */}
                {u.banni && u.motif_bannissement && (
                  <div className="mt-3 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-xl">
                    <div className="text-[10px] text-red-300 font-black uppercase">
                      Motif du bannissement
                    </div>
                    <div className="text-xs text-red-100 mt-1">
                      {u.motif_bannissement}
                    </div>
                  </div>
                )}

                {/* MOTIF MASQUAGE */}
                {u.masque && u.motif_masquage && (
                  <div className="mt-3 bg-purple-500/10 border-l-4 border-purple-500 p-3 rounded-xl">
                    <div className="text-[10px] text-purple-300 font-black uppercase">
                      Motif du masquage
                    </div>
                    <div className="text-xs text-purple-100 mt-1">
                      {u.motif_masquage}
                    </div>
                    {u.date_masquage && (
                      <div className="text-[10px] text-purple-300 mt-1">
                        Masqué le{' '}
                        {new Date(u.date_masquage).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL ÉDITION */}
      {/* ============================================================ */}
      <AnimatePresence>
        {userEdit && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    ✏️ Modifier — {userEdit.nom_complet}
                  </h2>
                  <button
                    onClick={() => setUserEdit(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Email (non modifiable)
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    disabled
                    className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-xl text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      📞 Téléphone
                    </label>
                    <input
                      type="text"
                      value={editTel}
                      onChange={(e) => setEditTel(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      💬 WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    📍 Quartier
                  </label>
                  <input
                    type="text"
                    value={editQuartier}
                    onChange={(e) => setEditQuartier(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    👤 Rôle
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'parent', label: '👨‍👩‍👧 Parent' },
                      { val: 'professeur', label: '👨‍🏫 Professeur' },
                      { val: 'admin', label: '👑 Admin' },
                    ].map((r) => (
                      <button
                        key={r.val}
                        type="button"
                        onClick={() => setEditRole(r.val)}
                        className={`py-3 rounded-xl font-bold text-xs transition-all ${
                          editRole === r.val
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                            : 'bg-slate-900 text-slate-300 border-2 border-slate-700 hover:border-purple-500/50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-xl">
                  <p className="text-xs text-amber-200">
                    ⚠️ Toute modification est enregistrée dans le journal
                    d'activité.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setUserEdit(null)}
                  disabled={sauvegarde}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrerEdition}
                  disabled={sauvegarde}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {sauvegarde ? '⏳...' : '💾 Enregistrer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL BAN */}
      {/* ============================================================ */}
      <AnimatePresence>
        {userBan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">
                    🚫 Bannir — {userBan.nom_complet}
                  </h2>
                  <button
                    onClick={() => {
                      setUserBan(null)
                      setMotifBan('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-xl">
                  <p className="text-xs text-red-200">
                    ⚠️ L'utilisateur ne pourra plus se connecter. Il recevra
                    une notification avec le motif.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Motif du bannissement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={motifBan}
                    onChange={(e) => setMotifBan(e.target.value)}
                    rows={4}
                    placeholder="Ex : Comportement inapproprié signalé par plusieurs parents..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-red-500/30 rounded-xl text-white outline-none focus:border-red-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUserBan(null)
                      setMotifBan('')
                    }}
                    disabled={sauvegarde}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={bannir}
                    disabled={sauvegarde}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {sauvegarde ? '⏳...' : '🚫 Bannir'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL MASQUAGE */}
      {/* ============================================================ */}
      <AnimatePresence>
        {userMasque && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">
                    👻 Masquer — {userMasque.nom_complet}
                  </h2>
                  <button
                    onClick={() => {
                      setUserMasque(null)
                      setMotifMasque('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-purple-500/10 border-l-4 border-purple-500 p-4 rounded-xl">
                  <p className="text-xs text-purple-200">
                    ⚠️ L'utilisateur <strong>pourra toujours se connecter</strong> mais
                    n'apparaîtra <strong>plus dans les recherches publiques</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Motif du masquage <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={motifMasque}
                    onChange={(e) => setMotifMasque(e.target.value)}
                    rows={4}
                    placeholder="Ex : Trop d'élèves actuellement, en pause temporaire, doublon..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-purple-500/30 rounded-xl text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUserMasque(null)
                      setMotifMasque('')
                    }}
                    disabled={sauvegarde}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={masquer}
                    disabled={sauvegarde}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {sauvegarde ? '⏳...' : '👻 Masquer'}
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