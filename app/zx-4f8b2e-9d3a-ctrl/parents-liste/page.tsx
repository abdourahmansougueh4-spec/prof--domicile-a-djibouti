'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Enfant = {
  id: string
  prenom: string
  niveaux: string[]
  classes: string[]
  langues_comprises: string[]
  langues_speciales: string[]
}

type Parent = {
  id: string
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string | null
  photo_url: string | null
  banni: boolean
  approuve: boolean
  created_at: string
  nombre_enfants: number
  preference_organisation: string | null
  cours_a_domicile: boolean
  enfants: Enfant[]
  nombre_demandes: number
  nombre_demandes_acceptees: number
}

type Filtre =
  | 'tous'
  | 'avec_enfants'
  | 'sans_enfants'
  | 'avec_demandes'
  | 'sans_demandes'
  | 'bannis'

type Tri =
  | 'recent'
  | 'ancien'
  | 'nom_az'
  | 'nom_za'
  | 'plus_enfants'
  | 'plus_demandes'

type Vue = 'liste' | 'grille'

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminParentsListe() {
  const supabase = createClient()

  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [vue, setVue] = useState<Vue>('liste')
  const [exportEnCours, setExportEnCours] = useState(false)
  const [succes, setSucces] = useState('')
  const [derniereMaj, setDerniereMaj] = useState<Date>(new Date())
  const [detail, setDetail] = useState<Parent | null>(null)

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

      // Récupération des parents
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, nom_complet, email, telephone, whatsapp, quartier, photo_url,
          banni, approuve, created_at,
          parents:parents!inner (
            nombre_enfants, preference_organisation, cours_a_domicile
          )
        `)
        .eq('role', 'parent')
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Parent[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.parents) ? p.parents[0] : p.parents

        // Récupérer les enfants
        const { data: enfantsData } = await supabase
          .from('enfants')
          .select('id, prenom, niveaux, classes, langues_comprises, langues_speciales')
          .eq('parent_id', p.id)

        // Récupérer les demandes
        const { count: demandesCount } = await supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', p.id)

        const { count: demandesAcceptees } = await supabase
          .from('demandes')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', p.id)
          .eq('statut', 'acceptee')

        complets.push({
          id: p.id,
          nom_complet: p.nom_complet || 'Sans nom',
          email: p.email || '—',
          telephone: p.telephone || '—',
          whatsapp: p.whatsapp || '—',
          quartier: p.quartier,
          photo_url: p.photo_url || null,
          banni: p.banni === true,
          approuve: p.approuve === true,
          created_at: p.created_at,
          nombre_enfants: info?.nombre_enfants || 0,
          preference_organisation: info?.preference_organisation || null,
          cours_a_domicile: info?.cours_a_domicile === true,
          enfants: (enfantsData || []).map((e) => ({
            id: e.id,
            prenom: e.prenom || '—',
            niveaux: e.niveaux || [],
            classes: e.classes || [],
            langues_comprises: e.langues_comprises || [],
            langues_speciales: e.langues_speciales || [],
          })),
          nombre_demandes: demandesCount || 0,
          nombre_demandes_acceptees: demandesAcceptees || 0,
        })
      }

      setParents(complets)
      setDerniereMaj(new Date())
    } catch (err: any) {
      console.error('Erreur chargement parents:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const parentsFiltres = useMemo(() => {
    let resultat = parents.filter((p) => {
      if (filtre === 'avec_enfants' && p.enfants.length === 0) return false
      if (filtre === 'sans_enfants' && p.enfants.length > 0) return false
      if (filtre === 'avec_demandes' && p.nombre_demandes === 0) return false
      if (filtre === 'sans_demandes' && p.nombre_demandes > 0) return false
      if (filtre === 'bannis' && !p.banni) return false

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.email.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r) ||
          p.telephone.includes(r) ||
          p.whatsapp.includes(r) ||
          p.enfants.some((e) => e.prenom.toLowerCase().includes(r))
        )
      }
      return true
    })

    if (tri === 'recent') resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'nom_az') resultat.sort((a, b) => a.nom_complet.localeCompare(b.nom_complet))
    if (tri === 'nom_za') resultat.sort((a, b) => b.nom_complet.localeCompare(a.nom_complet))
    if (tri === 'plus_enfants') resultat.sort((a, b) => b.enfants.length - a.enfants.length)
    if (tri === 'plus_demandes') resultat.sort((a, b) => b.nombre_demandes - a.nombre_demandes)

    return resultat
  }, [parents, filtre, tri, recherche])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useCallback(
    (f: Filtre) => {
      if (f === 'tous') return parents.length
      if (f === 'avec_enfants') return parents.filter((p) => p.enfants.length > 0).length
      if (f === 'sans_enfants') return parents.filter((p) => p.enfants.length === 0).length
      if (f === 'avec_demandes') return parents.filter((p) => p.nombre_demandes > 0).length
      if (f === 'sans_demandes') return parents.filter((p) => p.nombre_demandes === 0).length
      if (f === 'bannis') return parents.filter((p) => p.banni).length
      return 0
    },
    [parents]
  )

  // ============================================================
  // STATS GLOBALES
  // ============================================================

  const statsGlobales = useMemo(() => {
    const totalEnfants = parents.reduce((acc, p) => acc + p.enfants.length, 0)
    const totalDemandes = parents.reduce((acc, p) => acc + p.nombre_demandes, 0)
    const totalAcceptees = parents.reduce((acc, p) => acc + p.nombre_demandes_acceptees, 0)
    return { totalEnfants, totalDemandes, totalAcceptees }
  }, [parents])

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (parentsFiltres.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = [
        'Nom', 'Email', 'Téléphone', 'WhatsApp', 'Quartier',
        'Nombre d\'enfants', 'Noms des enfants', 'Niveaux',
        'Cours à domicile', 'Demandes', 'Acceptées', 'Statut', 'Inscrit le',
      ]

      const rows = parentsFiltres.map((p) => [
        p.nom_complet,
        p.email,
        p.telephone,
        p.whatsapp,
        p.quartier || '',
        p.enfants.length,
        p.enfants.map((e) => e.prenom).join(', '),
        p.enfants.flatMap((e) => e.niveaux).join(', '),
        p.cours_a_domicile ? 'Oui' : 'Non',
        p.nombre_demandes,
        p.nombre_demandes_acceptees,
        p.banni ? 'Banni' : 'Actif',
        new Date(p.created_at).toLocaleDateString('fr-FR'),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `parents-liste-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export parents : ${parentsFiltres.length} parents`,
      })

      setSucces(`✅ ${parentsFiltres.length} parents exportés`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [parentsFiltres, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const copier = (texte: string) => {
    navigator.clipboard.writeText(texte)
    setSucces('📋 Copié !')
    setTimeout(() => setSucces(''), 1500)
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
        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">👨‍👩‍👧 Liste des Parents</h1>
                <span className="text-2xl">🇩🇯</span>
              </div>
              <p className="text-blue-100 text-sm">
                {parents.length} parent{parents.length > 1 ? 's' : ''} · Vue d'ensemble ·
                Maj : {derniereMaj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setVue(vue === 'liste' ? 'grille' : 'liste')}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm"
              >
                {vue === 'liste' ? '🔲 Grille' : '📋 Liste'}
              </button>
              <button
                onClick={charger}
                disabled={loading}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={exporterCSV}
                disabled={exportEnCours || parentsFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">Total parents</div>
              <div className="text-2xl font-black">{parents.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">Total enfants</div>
              <div className="text-2xl font-black">{statsGlobales.totalEnfants}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">Total demandes</div>
              <div className="text-2xl font-black">{statsGlobales.totalDemandes}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-blue-200">Acceptées</div>
              <div className="text-2xl font-black text-emerald-200">{statsGlobales.totalAcceptees}</div>
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

      {/* FILTRES */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { val: 'tous', label: '👥 Tous' },
            { val: 'avec_enfants', label: '👶 Avec enfants' },
            { val: 'sans_enfants', label: '⚪ Sans enfants' },
            { val: 'avec_demandes', label: '📥 Avec demandes' },
            { val: 'sans_demandes', label: '📭 Sans demandes' },
            { val: 'bannis', label: '🚫 Bannis' },
          ] as { val: Filtre; label: string }[]
        ).map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtre === f.val
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
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
            placeholder="Rechercher par nom, email, téléphone, quartier ou prénom d'enfant..."
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
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="nom_az">🔤 Nom A→Z</option>
          <option value="nom_za">🔤 Nom Z→A</option>
          <option value="plus_enfants">👶 Plus d'enfants</option>
          <option value="plus_demandes">📥 Plus de demandes</option>
        </select>
      </div>

      {/* COMPTEUR RÉSULTATS */}
      {(recherche || filtre !== 'tous') && (
        <div className="text-sm text-slate-400">
          <span className="font-bold text-white">{parentsFiltres.length}</span> résultat{parentsFiltres.length > 1 ? 's' : ''}
          {recherche && ` pour "${recherche}"`}
        </div>
      )}

      {/* LISTE / GRILLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement des parents...</p>
        </div>
      ) : parentsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun parent trouvé</h3>
          <p className="text-slate-400 text-sm mb-4">
            {recherche ? `Aucun résultat pour "${recherche}"` : 'Aucun parent dans cette catégorie.'}
          </p>
          {(recherche || filtre !== 'tous') && (
            <button
              onClick={() => { setRecherche(''); setFiltre('tous') }}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-sm border border-blue-500/30"
            >
              ✕ Réinitialiser les filtres
            </button>
          )}
        </motion.div>
      ) : vue === 'grille' ? (
        /* VUE GRILLE */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parentsFiltres.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                p.banni ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/70 border-white/10 hover:border-blue-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.nom_complet} className="w-14 h-14 rounded-2xl object-cover shadow-lg flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                    👨‍👩‍👧
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white text-sm truncate">{p.nom_complet}</div>
                  <div className="text-[10px] text-slate-400 truncate">📧 {p.email}</div>
                  {p.quartier && <div className="text-[10px] text-slate-400 truncate">📍 {p.quartier}</div>}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {p.banni ? (
                  <span className="text-[9px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-black border border-red-500/30">
                    🚫 BANNI
                  </span>
                ) : (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black border border-emerald-500/30">
                    ✓ ACTIF
                  </span>
                )}
                {p.cours_a_domicile && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                    🏠 À domicile
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-slate-500 font-black">ENFANTS</div>
                  <div className="text-sm font-black text-blue-300">{p.enfants.length}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-slate-500 font-black">DEMANDES</div>
                  <div className="text-sm font-black text-white">{p.nombre_demandes}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-slate-500 font-black">✓ ACCEPT.</div>
                  <div className="text-sm font-black text-emerald-300">{p.nombre_demandes_acceptees}</div>
                </div>
              </div>

              {p.enfants.length > 0 && (
                <div className="mb-3">
                  <div className="text-[9px] text-slate-500 font-black uppercase mb-1">Enfants</div>
                  <div className="flex flex-wrap gap-1">
                    {p.enfants.slice(0, 3).map((e) => (
                      <span key={e.id} className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                        👶 {e.prenom}
                      </span>
                    ))}
                    {p.enfants.length > 3 && (
                      <span className="text-[9px] text-slate-500 font-bold">+{p.enfants.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setDetail(p)}
                  className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30 text-center hover:bg-blue-500/30 transition-colors"
                >
                  👁️ Détails
                </button>
                {p.whatsapp && p.whatsapp !== '—' && (
                  <a
                    href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 transition-colors"
                    title="WhatsApp"
                  >
                    💬
                  </a>
                )}
                {p.email && p.email !== '—' && (
                  <a
                    href={`mailto:${p.email}`}
                    className="px-3 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                    title="Email"
                  >
                    📧
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* VUE LISTE */
        <div className="space-y-3">
          {parentsFiltres.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
              className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                p.banni ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/70 border-white/10 hover:border-blue-500/30'
              }`}
            >
              <div className="flex items-start gap-4 flex-wrap">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.nom_complet} className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                    👨‍👩‍👧
                  </div>
                )}

                <div className="flex-1 min-w-[250px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className="font-black text-white text-base">{p.nom_complet}</div>
                    {p.banni ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black border bg-red-500/20 text-red-300 border-red-500/30">
                        🚫 BANNI
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        ✓ ACTIF
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 space-y-0.5 mb-2">
                    <div
                      className="cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={() => copier(p.email)}
                      title="Cliquer pour copier"
                    >
                      📧 {p.email}
                    </div>
                    <div>📞 {p.telephone} · 💬 {p.whatsapp}</div>
                    {p.quartier && <div>📍 {p.quartier}</div>}
                    <div>📅 Inscrit le {formaterDate(p.created_at)}</div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {p.cours_a_domicile && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                        🏠 Cours à domicile
                      </span>
                    )}
                    {p.preference_organisation && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-black">
                        ⚙️ {p.preference_organisation}
                      </span>
                    )}
                  </div>

                  {p.enfants.length > 0 && (
                    <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20 mb-2">
                      <div className="text-[9px] text-blue-300 font-black uppercase mb-1">
                        👶 Enfants ({p.enfants.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.enfants.slice(0, 5).map((e) => (
                          <span key={e.id} className="text-[9px] bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full font-bold">
                            {e.prenom}
                            {e.niveaux.length > 0 && ` · ${e.niveaux[0]}`}
                          </span>
                        ))}
                        {p.enfants.length > 5 && (
                          <span className="text-[9px] text-slate-500 font-bold">+{p.enfants.length - 5}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <div className="bg-white/5 rounded-lg px-3 py-2 text-center min-w-[60px]">
                    <div className="text-[9px] text-slate-500 font-black">ENFANTS</div>
                    <div className="text-sm font-black text-blue-300">{p.enfants.length}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2 text-center min-w-[60px]">
                    <div className="text-[9px] text-slate-500 font-black">DEMANDES</div>
                    <div className="text-sm font-black text-white">{p.nombre_demandes}</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg px-3 py-2 text-center border border-emerald-500/30 min-w-[60px]">
                    <div className="text-[9px] text-emerald-300 font-black">✓ ACCEPT.</div>
                    <div className="text-sm font-black text-emerald-200">{p.nombre_demandes_acceptees}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDetail(p)}
                    className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    title="Détails"
                  >
                    👁️
                  </button>
                  {p.whatsapp && p.whatsapp !== '—' && (
                    <a
                      href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 transition-colors"
                      title="WhatsApp"
                    >
                      💬
                    </a>
                  )}
                  {p.email && p.email !== '—' && (
                    <a
                      href={`mailto:${p.email}`}
                      className="px-3 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                      title="Email"
                    >
                      📧
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* INFO BAS */}
      {!loading && parentsFiltres.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          Affichage de {parentsFiltres.length} parent{parentsFiltres.length > 1 ? 's' : ''} sur {parents.length}
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
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👨‍👩‍👧</span>
                    <div>
                      <h2 className="text-lg font-black text-white">{detail.nom_complet}</h2>
                      <p className="text-xs text-blue-100 mt-0.5">Fiche parent complète</p>
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

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Infos générales */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">📋 Informations</div>
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    <div><strong className="text-white">Email :</strong> <span className="text-slate-300">{detail.email}</span></div>
                    <div><strong className="text-white">Téléphone :</strong> <span className="text-slate-300">{detail.telephone}</span></div>
                    <div><strong className="text-white">WhatsApp :</strong> <span className="text-slate-300">{detail.whatsapp}</span></div>
                    <div><strong className="text-white">Quartier :</strong> <span className="text-slate-300">{detail.quartier || '—'}</span></div>
                    <div><strong className="text-white">Inscrit le :</strong> <span className="text-slate-300">{formaterDate(detail.created_at)}</span></div>
                    <div><strong className="text-white">Cours à domicile :</strong> <span className="text-slate-300">{detail.cours_a_domicile ? 'Oui' : 'Non'}</span></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30 text-center">
                    <div className="text-2xl font-black text-blue-300">{detail.enfants.length}</div>
                    <div className="text-[10px] text-blue-200 font-black">ENFANTS</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                    <div className="text-2xl font-black text-white">{detail.nombre_demandes}</div>
                    <div className="text-[10px] text-slate-400 font-black">DEMANDES</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/30 text-center">
                    <div className="text-2xl font-black text-emerald-300">{detail.nombre_demandes_acceptees}</div>
                    <div className="text-[10px] text-emerald-200 font-black">ACCEPTÉES</div>
                  </div>
                </div>

                {/* Enfants */}
                {detail.enfants.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-xs font-black text-white mb-3">👶 Enfants ({detail.enfants.length})</div>
                    <div className="space-y-2">
                      {detail.enfants.map((e) => (
                        <div key={e.id} className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                          <div className="font-bold text-white text-sm mb-1">👶 {e.prenom}</div>
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {e.niveaux.map((n) => (
                              <span key={n} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                                📚 {n}
                              </span>
                            ))}
                            {e.classes.map((c) => (
                              <span key={c} className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                🎓 {c}
                              </span>
                            ))}
                            {e.langues_comprises.map((l) => (
                              <span key={l} className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                💬 {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {detail.whatsapp && detail.whatsapp !== '—' && (
                    <a
                      href={`https://wa.me/${detail.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[120px] py-3 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 text-center transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {detail.email && detail.email !== '—' && (
                    <a
                      href={`mailto:${detail.email}`}
                      className="flex-1 min-w-[120px] py-3 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30 hover:bg-blue-500/30 text-center transition-colors"
                    >
                      📧 Email
                    </a>
                  )}
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