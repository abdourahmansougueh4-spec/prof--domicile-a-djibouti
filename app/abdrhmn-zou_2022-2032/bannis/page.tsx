'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type UtilisateurBanni = {
  id: string
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string | null
  role: 'parent' | 'professeur' | 'admin'
  motif_bannissement: string | null
  created_at: string
  est_admin: boolean
  approuve: boolean
}

type FiltreRole = 'tous' | 'parent' | 'professeur' | 'admin'
type Tri = 'recent' | 'ancien' | 'nom_az' | 'role'

// ============================================================
// CONFIG RÔLES
// ============================================================

const rolesConfig: {
  [k: string]: { label: string; emoji: string; couleur: string }
} = {
  parent: {
    label: 'Parent',
    emoji: '👨‍👩‍👧',
    couleur: 'from-blue-500 to-blue-600',
  },
  professeur: {
    label: 'Professeur',
    emoji: '👨‍🏫',
    couleur: 'from-emerald-500 to-teal-600',
  },
  admin: {
    label: 'Admin',
    emoji: '👑',
    couleur: 'from-purple-500 to-pink-600',
  },
}

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminBannis() {
  const supabase = createClient()

  const [bannis, setBannis] = useState<UtilisateurBanni[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtreRole, setFiltreRole] = useState<FiltreRole>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [action, setAction] = useState(false)
  const [detail, setDetail] = useState<UtilisateurBanni | null>(null)
  const [exportEnCours, setExportEnCours] = useState(false)
  const [succes, setSucces] = useState('')

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée. Reconnecte-toi.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, est_admin, banni')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin' || !profile.est_admin) {
        setErreur('Accès refusé. Tu n\'es pas administrateur.')
        setLoading(false)
        return
      }

      if (profile.banni) {
        setErreur('Ton compte a été banni.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nom_complet, email, telephone, whatsapp, quartier, role, motif_bannissement, created_at, est_admin, approuve, banni')
        .eq('banni', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const utilisateurs: UtilisateurBanni[] = (data || []).map((u) => ({
        id: u.id,
        nom_complet: u.nom_complet || 'Sans nom',
        email: u.email || '—',
        telephone: u.telephone || '—',
        whatsapp: u.whatsapp || '—',
        quartier: u.quartier,
        role: (u.role as 'parent' | 'professeur' | 'admin') || 'parent',
        motif_bannissement: u.motif_bannissement,
        created_at: u.created_at,
        est_admin: u.est_admin === true,
        approuve: u.approuve === true,
      }))

      setBannis(utilisateurs)
    } catch (err: any) {
      console.error('Erreur chargement bannis:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // DÉBANNIR
  // ============================================================

  const debannir = useCallback(
    async (u: UtilisateurBanni) => {
      if (!confirm(`✅ DÉBANNIR ${u.nom_complet} ?\n\nLe compte sera réactivé.`)) return

      setAction(true)
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            banni: false,
            motif_bannissement: null,
          })
          .eq('id', u.id)

        if (error) throw error

        // Notifier l'utilisateur
        await supabase.from('notifications').insert({
          destinataire_id: u.id,
          titre: '🔓 Compte réactivé',
          contenu: 'Votre compte a été réactivé. Vous pouvez à nouveau utiliser la plateforme.',
          lu: false,
        })

        // Log admin
        await supabase.from('admin_logs').insert({
          action: 'debannir_utilisateur',
          details: `${u.nom_complet} (${u.email})`,
        })

        setSucces(`✅ ${u.nom_complet} a été débanni`)
        setTimeout(() => setSucces(''), 4000)
        setDetail(null)
        await charger()
      } catch (err: any) {
        alert('Erreur : ' + err.message)
      } finally {
        setAction(false)
      }
    },
    [supabase, charger]
  )

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const bannisFiltres = useMemo(() => {
    let resultat = bannis.filter((u) => {
      if (filtreRole !== 'tous' && u.role !== filtreRole) return false

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          u.nom_complet.toLowerCase().includes(r) ||
          u.email.toLowerCase().includes(r) ||
          u.telephone.includes(r) ||
          u.whatsapp.includes(r) ||
          u.quartier?.toLowerCase().includes(r) ||
          u.motif_bannissement?.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'recent')
      resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien')
      resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'nom_az')
      resultat.sort((a, b) => a.nom_complet.localeCompare(b.nom_complet))
    if (tri === 'role')
      resultat.sort((a, b) => a.role.localeCompare(b.role))

    return resultat
  }, [bannis, filtreRole, recherche, tri])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useCallback(
    (role: FiltreRole) => {
      if (role === 'tous') return bannis.length
      return bannis.filter((u) => u.role === role).length
    },
    [bannis]
  )

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (bannisFiltres.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = ['Nom', 'Email', 'Téléphone', 'WhatsApp', 'Quartier', 'Rôle', 'Motif', 'Date bannissement']
      const rows = bannisFiltres.map((u) => [
        u.nom_complet,
        u.email,
        u.telephone,
        u.whatsapp,
        u.quartier || '',
        rolesConfig[u.role]?.label || u.role,
        u.motif_bannissement || '',
        new Date(u.created_at).toLocaleDateString('fr-FR'),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bannis-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export bannis : ${bannisFiltres.length} utilisateurs`,
      })
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [bannisFiltres, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
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
        className="bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black mb-2">🚫 Bannis / Suspendus</h1>
              <p className="text-red-100 text-sm">
                {bannis.length} utilisateur{bannis.length > 1 ? 's' : ''} banni{bannis.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={charger}
                disabled={loading}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={exporterCSV}
                disabled={exportEnCours || bannisFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">Total</div>
              <div className="text-2xl font-black">{bannis.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">Parents</div>
              <div className="text-2xl font-black">{compte('parent')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">Profs</div>
              <div className="text-2xl font-black">{compte('professeur')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-red-200">Admins</div>
              <div className="text-2xl font-black">{compte('admin')}</div>
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
      <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-200 mb-1">
              Comptes suspendus
            </p>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Ces utilisateurs <strong>ne peuvent plus se connecter</strong> à la plateforme.
              Tu peux les débannir à tout moment pour réactiver leur compte.
            </p>
          </div>
        </div>
      </div>

      {/* FILTRES RÔLE */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { val: 'tous', label: '👥 Tous' },
            { val: 'parent', label: '👨‍👩‍👧 Parents' },
            { val: 'professeur', label: '👨‍🏫 Profs' },
            { val: 'admin', label: '👑 Admins' },
          ] as { val: FiltreRole; label: string }[]
        ).map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltreRole(f.val)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtreRole === f.val
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {f.label} ({compte(f.val)})
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
            placeholder="Rechercher par nom, email, téléphone ou motif..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 outline-none"
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
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
        >
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="nom_az">🔤 Nom A→Z</option>
          <option value="role">👤 Par rôle</option>
        </select>
      </div>

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement des bannis...</p>
        </div>
      ) : bannisFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="font-black text-white text-xl mb-2">
            {bannis.length === 0
              ? 'Aucun utilisateur banni'
              : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm">
            {bannis.length === 0
              ? 'Bonne nouvelle ! Aucun compte n\'est suspendu.'
              : 'Aucun utilisateur ne correspond à ces critères.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {bannisFiltres.map((u, i) => {
            const role = rolesConfig[u.role] || rolesConfig.parent
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="backdrop-blur-xl rounded-2xl p-5 border transition-all bg-red-500/10 border-red-500/30 hover:border-red-500/50"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.couleur} flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0 relative`}
                  >
                    {role.emoji}
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-slate-900">
                      🚫
                    </span>
                  </div>

                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="font-black text-white text-base">
                        {u.nom_complet}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border bg-gradient-to-r ${role.couleur} text-white border-transparent`}>
                        {role.emoji} {role.label}
                      </span>
                      {u.est_admin && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                          👑 ADMIN
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 space-y-0.5 mb-2">
                      <div>📧 {u.email}</div>
                      <div>📞 {u.telephone}</div>
                      {u.whatsapp !== '—' && <div>💬 {u.whatsapp}</div>}
                      {u.quartier && <div>📍 {u.quartier}</div>}
                      <div>📅 Banni le {formaterDate(u.created_at)}</div>
                    </div>

                    {u.motif_bannissement && (
                      <div className="bg-red-500/20 border-l-4 border-red-500 rounded-lg p-3 mt-2">
                        <div className="text-[10px] text-red-200 font-black uppercase mb-1">
                          Motif du bannissement
                        </div>
                        <p className="text-xs text-red-100">{u.motif_bannissement}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(u)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      👁️ Détails
                    </button>
                    <button
                      onClick={() => debannir(u)}
                      disabled={action}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {action ? '⏳...' : '🔓 Débannir'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* INFO BAS */}
      {!loading && bannisFiltres.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          Affichage de {bannisFiltres.length} utilisateur{bannisFiltres.length > 1 ? 's' : ''} banni{bannisFiltres.length > 1 ? 's' : ''} sur {bannis.length}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-pink-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{rolesConfig[detail.role]?.emoji || '👤'}</span>
                    <div>
                      <h2 className="text-lg font-black text-white">{detail.nom_complet}</h2>
                      <p className="text-xs text-red-100 mt-0.5">
                        {rolesConfig[detail.role]?.label || detail.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-[10px] text-slate-500 font-black uppercase mb-2">📋 Informations</div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div><strong className="text-white">Email :</strong> {detail.email}</div>
                    <div><strong className="text-white">Téléphone :</strong> {detail.telephone}</div>
                    <div><strong className="text-white">WhatsApp :</strong> {detail.whatsapp}</div>
                    <div><strong className="text-white">Quartier :</strong> {detail.quartier || '—'}</div>
                    <div><strong className="text-white">Rôle :</strong> {rolesConfig[detail.role]?.label}</div>
                    <div><strong className="text-white">Admin :</strong> {detail.est_admin ? 'Oui' : 'Non'}</div>
                    <div><strong className="text-white">Date :</strong> {formaterDate(detail.created_at)}</div>
                  </div>
                </div>

                {detail.motif_bannissement && (
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                    <div className="text-[10px] text-red-300 font-black uppercase mb-2">
                      🚫 Motif du bannissement
                    </div>
                    <p className="text-sm text-red-100 whitespace-pre-line leading-relaxed">
                      {detail.motif_bannissement}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {detail.whatsapp && detail.whatsapp !== '—' && (
                    <a
                      href={`https://wa.me/${detail.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[120px] py-2.5 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 text-center transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {detail.email && detail.email !== '—' && (
                    <a
                      href={`mailto:${detail.email}`}
                      className="flex-1 min-w-[120px] py-2.5 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30 hover:bg-blue-500/30 text-center transition-colors"
                    >
                      📧 Email
                    </a>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => debannir(detail)}
                  disabled={action}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg transition-all disabled:opacity-50"
                >
                  {action ? '⏳...' : '🔓 Débannir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}