'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Prof = {
  id: string
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string | null
  photo_url: string | null
  approuve: boolean
  banni: boolean
  created_at: string
  experience_annees: number
  note_moyenne: number
  nombre_avis: number
  nombre_demandes: number
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  prix_min: number | null
  prix_max: number | null
  zone_enseignement: string | null
  a_bac_s: boolean
  est_etudiant: boolean
  universite: string | null
  niveau_etude: string | null
  domaine_etude: string | null
  matieres: string[]
  langues: string[]
}

type Filtre =
  | 'tous'
  | 'approuves'
  | 'en_attente'
  | 'bannis'
  | 'avec_etoiles'
  | 'top_notes'
  | 'pionniers'
  | 'illustres'

type Tri =
  | 'recent'
  | 'ancien'
  | 'note'
  | 'experience'
  | 'prix_bas'
  | 'prix_eleve'
  | 'avis'
  | 'demandes'

type Vue = 'liste' | 'grille'

// ============================================================
// CONFIG BADGES
// ============================================================

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
}

const zonesConfig: { [k: string]: string } = {
  chez_moi: '🏠 Chez moi',
  chez_eleve: "🚶 Chez l'élève",
  les_deux: '🔄 Les deux',
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function AdminProfsListe() {
  const supabase = createClient()

  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [vue, setVue] = useState<Vue>('liste')
  const [exportEnCours, setExportEnCours] = useState(false)
  const [succes, setSucces] = useState('')
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
        .select(`
          id, nom_complet, email, telephone, whatsapp, quartier, photo_url,
          approuve, banni, created_at,
          professeurs:professeurs!inner (
            experience_annees, note_moyenne, nombre_avis, nombre_demandes,
            etoiles, badge_admin, pionnier, pionnier_illustre,
            prix_min, prix_max, zone_enseignement,
            a_bac_s, est_etudiant, universite, niveau_etude, domaine_etude,
            photo_profil_url
          )
        `)
        .eq('role', 'professeur')
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Prof[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.professeurs)
          ? p.professeurs[0]
          : p.professeurs

        const [matieresRes, languesRes] = await Promise.all([
          supabase.from('matieres_par_prof').select('matiere').eq('professeur_id', p.id),
          supabase.from('langues_par_prof').select('langue').eq('professeur_id', p.id),
        ])

        complets.push({
          id: p.id,
          nom_complet: p.nom_complet || 'Sans nom',
          email: p.email || '—',
          telephone: p.telephone || '—',
          whatsapp: p.whatsapp || '—',
          quartier: p.quartier,
          photo_url: info?.photo_profil_url || p.photo_url || null,
          approuve: p.approuve === true,
          banni: p.banni === true,
          created_at: p.created_at,
          experience_annees: info?.experience_annees || 0,
          note_moyenne: Number(info?.note_moyenne) || 0,
          nombre_avis: info?.nombre_avis || 0,
          nombre_demandes: info?.nombre_demandes || 0,
          etoiles: info?.etoiles || 0,
          badge_admin: info?.badge_admin || null,
          pionnier: info?.pionnier === true,
          pionnier_illustre: info?.pionnier_illustre === true,
          prix_min: info?.prix_min ? Number(info.prix_min) : null,
          prix_max: info?.prix_max ? Number(info.prix_max) : null,
          zone_enseignement: info?.zone_enseignement || null,
          a_bac_s: info?.a_bac_s === true,
          est_etudiant: info?.est_etudiant === true,
          universite: info?.universite || null,
          niveau_etude: info?.niveau_etude || null,
          domaine_etude: info?.domaine_etude || null,
          matieres: (matieresRes.data || []).map((m) => m.matiere),
          langues: (languesRes.data || []).map((l) => l.langue),
        })
      }

      setProfs(complets)
      setDerniereMaj(new Date())
    } catch (err: any) {
      console.error('Erreur chargement profs:', err)
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

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      if (filtre === 'approuves' && (!p.approuve || p.banni)) return false
      if (filtre === 'en_attente' && (p.approuve || p.banni)) return false
      if (filtre === 'bannis' && !p.banni) return false
      if (filtre === 'avec_etoiles' && p.etoiles === 0) return false
      if (filtre === 'top_notes' && p.note_moyenne < 4) return false
      if (filtre === 'pionniers' && !p.pionnier && !p.pionnier_illustre) return false
      if (filtre === 'illustres' && !p.pionnier_illustre) return false

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.email.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r) ||
          p.telephone.includes(r) ||
          p.whatsapp.includes(r) ||
          p.matieres.some((m) => m.toLowerCase().includes(r)) ||
          p.langues.some((l) => l.toLowerCase().includes(r)) ||
          p.universite?.toLowerCase().includes(r) ||
          p.niveau_etude?.toLowerCase().includes(r) ||
          p.domaine_etude?.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'recent') resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'note') resultat.sort((a, b) => b.note_moyenne - a.note_moyenne)
    if (tri === 'experience') resultat.sort((a, b) => b.experience_annees - a.experience_annees)
    if (tri === 'prix_bas') resultat.sort((a, b) => (a.prix_min || 0) - (b.prix_min || 0))
    if (tri === 'prix_eleve') resultat.sort((a, b) => (b.prix_min || 0) - (a.prix_min || 0))
    if (tri === 'avis') resultat.sort((a, b) => b.nombre_avis - a.nombre_avis)
    if (tri === 'demandes') resultat.sort((a, b) => b.nombre_demandes - a.nombre_demandes)

    return resultat
  }, [profs, filtre, tri, recherche])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useCallback(
    (f: Filtre) => {
      if (f === 'tous') return profs.length
      if (f === 'approuves') return profs.filter((p) => p.approuve && !p.banni).length
      if (f === 'en_attente') return profs.filter((p) => !p.approuve && !p.banni).length
      if (f === 'bannis') return profs.filter((p) => p.banni).length
      if (f === 'avec_etoiles') return profs.filter((p) => p.etoiles > 0).length
      if (f === 'top_notes') return profs.filter((p) => p.note_moyenne >= 4).length
      if (f === 'pionniers') return profs.filter((p) => p.pionnier || p.pionnier_illustre).length
      if (f === 'illustres') return profs.filter((p) => p.pionnier_illustre).length
      return 0
    },
    [profs]
  )

  // ============================================================
  // STATS GLOBALES
  // ============================================================

  const statsGlobales = useMemo(() => {
    const approuves = profs.filter((p) => p.approuve && !p.banni)
    const noteMoyenne =
      approuves.length > 0
        ? approuves.reduce((acc, p) => acc + p.note_moyenne, 0) / approuves.length
        : 0
    const totalAvis = profs.reduce((acc, p) => acc + p.nombre_avis, 0)
    const totalDemandes = profs.reduce((acc, p) => acc + p.nombre_demandes, 0)
    return { noteMoyenne, totalAvis, totalDemandes }
  }, [profs])

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exporterCSV = useCallback(async () => {
    if (profsFiltres.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    setExportEnCours(true)
    try {
      const headers = [
        'Nom', 'Email', 'Téléphone', 'WhatsApp', 'Quartier', 'Statut',
        'Note', 'Avis', 'Étoiles', 'Badge', 'Pionnier', 'Illustre',
        'Expérience', 'Prix min', 'Prix max', 'Zone', 'Bac S', 'Étudiant',
        'Université', 'Niveau', 'Domaine', 'Matières', 'Langues', 'Demandes', 'Inscrit le',
      ]

      const rows = profsFiltres.map((p) => [
        p.nom_complet,
        p.email,
        p.telephone,
        p.whatsapp,
        p.quartier || '',
        p.banni ? 'Banni' : p.approuve ? 'Approuvé' : 'En attente',
        p.note_moyenne.toFixed(1),
        p.nombre_avis,
        `${p.etoiles}/3`,
        p.badge_admin ? badgesConfig[p.badge_admin]?.label || p.badge_admin : '',
        p.pionnier ? 'Oui' : 'Non',
        p.pionnier_illustre ? 'Oui' : 'Non',
        `${p.experience_annees} an${p.experience_annees > 1 ? 's' : ''}`,
        p.prix_min || '',
        p.prix_max || '',
        zonesConfig[p.zone_enseignement || ''] || '',
        p.a_bac_s ? 'Oui' : 'Non',
        p.est_etudiant ? 'Oui' : 'Non',
        p.universite || '',
        p.niveau_etude || '',
        p.domaine_etude || '',
        p.matieres.join(', '),
        p.langues.join(', '),
        p.nombre_demandes,
        new Date(p.created_at).toLocaleDateString('fr-FR'),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `profs-liste-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_profs_liste',
        details: `${profsFiltres.length} profs exportés`,
      })

      setSucces(`✅ ${profsFiltres.length} profs exportés avec succès`)
      setTimeout(() => setSucces(''), 4000)
    } catch (err: any) {
      alert('Erreur export : ' + err.message)
    } finally {
      setExportEnCours(false)
    }
  }, [profsFiltres, supabase])

  // ============================================================
  // UTILITAIRES
  // ============================================================

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const getStatutBadge = (p: Prof) => {
    if (p.banni)
      return { label: '🚫 BANNI', classe: 'bg-red-500/20 text-red-300 border-red-500/30' }
    if (p.approuve)
      return { label: '✓ APPROUVÉ', classe: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
    return { label: '⏳ EN ATTENTE', classe: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
  }

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
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">👨‍🏫 Liste des Professeurs</h1>
                <span className="text-2xl">🇩🇯</span>
              </div>
              <p className="text-emerald-100 text-sm">
                {profs.length} prof{profs.length > 1 ? 's' : ''} au total · Vue d'ensemble ·
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
                disabled={exportEnCours || profsFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Total</div>
              <div className="text-2xl font-black">{profs.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Approuvés</div>
              <div className="text-2xl font-black">{compte('approuves')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Note moy.</div>
              <div className="text-2xl font-black">{statsGlobales.noteMoyenne.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Total avis</div>
              <div className="text-2xl font-black">{statsGlobales.totalAvis}</div>
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
            { val: 'approuves', label: '✅ Approuvés' },
            { val: 'en_attente', label: '⏳ En attente' },
            { val: 'bannis', label: '🚫 Bannis' },
            { val: 'avec_etoiles', label: '⭐ Avec étoiles' },
            { val: 'top_notes', label: '🏆 Top notes (4+)' },
            { val: 'pionniers', label: '🏅 Pionniers' },
            { val: 'illustres', label: '👑 Illustres' },
          ] as { val: Filtre; label: string }[]
        ).map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtre === f.val
                ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg'
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
            placeholder="Rechercher par nom, email, téléphone, quartier, matière, langue..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
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
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="note">⭐ Meilleure note</option>
          <option value="experience">🎯 Plus expérimenté</option>
          <option value="prix_bas">💰 Prix bas</option>
          <option value="prix_eleve">💰 Prix élevé</option>
          <option value="avis">💬 Plus d'avis</option>
          <option value="demandes">📥 Plus de demandes</option>
        </select>
      </div>

      {/* COMPTEUR RÉSULTATS */}
      {(recherche || filtre !== 'tous') && (
        <div className="text-sm text-slate-400">
          <span className="font-bold text-white">{profsFiltres.length}</span> résultat{profsFiltres.length > 1 ? 's' : ''}
          {recherche && ` pour "${recherche}"`}
        </div>
      )}

      {/* LISTE / GRILLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement des profs...</p>
        </div>
      ) : profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">Aucun professeur trouvé</h3>
          <p className="text-slate-400 text-sm mb-4">
            {recherche ? `Aucun résultat pour "${recherche}"` : 'Aucun professeur dans cette catégorie.'}
          </p>
          {(recherche || filtre !== 'tous') && (
            <button
              onClick={() => { setRecherche(''); setFiltre('tous') }}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl font-bold text-sm border border-emerald-500/30"
            >
              ✕ Réinitialiser les filtres
            </button>
          )}
        </motion.div>
      ) : vue === 'grille' ? (
        /* VUE GRILLE */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profsFiltres.map((p, i) => {
            const statut = getStatutBadge(p)
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  p.banni ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/70 border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.nom_complet} className="w-14 h-14 rounded-2xl object-cover shadow-lg flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                      👨‍🏫
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-sm truncate">{p.nom_complet}</div>
                    <div className="text-[10px] text-slate-400 truncate">📧 {p.email}</div>
                    {p.quartier && <div className="text-[10px] text-slate-400 truncate">📍 {p.quartier}</div>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${statut.classe}`}>
                    {statut.label}
                  </span>
                  {p.pionnier_illustre && (
                    <span className="text-[9px] bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-0.5 rounded-full font-black">
                      👑 ILLUSTRE
                    </span>
                  )}
                  {p.badge_admin && badgesConfig[p.badge_admin] && (
                    <span className={`text-[9px] bg-gradient-to-r ${badgesConfig[p.badge_admin].couleur} text-white px-2 py-0.5 rounded-full font-black`}>
                      {badgesConfig[p.badge_admin].emoji} {badgesConfig[p.badge_admin].label}
                    </span>
                  )}
                  {p.pionnier && !p.pionnier_illustre && (
                    <span className="text-[9px] bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-2 py-0.5 rounded-full font-black">
                      🏆 PIONNIER
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-500 font-black">NOTE</div>
                    <div className="text-sm font-black text-amber-300">{p.note_moyenne.toFixed(1)}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-500 font-black">AVIS</div>
                    <div className="text-sm font-black text-white">{p.nombre_avis}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-500 font-black">⭐</div>
                    <div className="text-sm font-black text-white">{p.etoiles}/3</div>
                  </div>
                </div>

                {p.prix_min && p.prix_max && (
                  <div className="bg-amber-500/10 rounded-xl p-2 border border-amber-500/30 mb-3">
                    <div className="text-[9px] text-amber-300 font-black uppercase">🔒 Prix privés</div>
                    <div className="text-xs font-black text-white">
                      {Number(p.prix_min).toLocaleString()} - {Number(p.prix_max).toLocaleString()} DJF
                    </div>
                  </div>
                )}

                {p.matieres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.matieres.slice(0, 3).map((m) => (
                      <span key={m} className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        {m}
                      </span>
                    ))}
                    {p.matieres.length > 3 && (
                      <span className="text-[9px] text-slate-500 font-bold">+{p.matieres.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/zx-4f8b2e-9d3a-ctrl/utilisateurs?id=${p.id}`}
                    className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30 text-center hover:bg-blue-500/30 transition-colors"
                  >
                    👁️ Voir
                  </Link>
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
            )
          })}
        </div>
      ) : (
        /* VUE LISTE */
        <div className="space-y-3">
          {profsFiltres.map((p, i) => {
            const statut = getStatutBadge(p)
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  p.banni ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/70 border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.nom_complet} className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                      👨‍🏫
                    </div>
                  )}

                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="font-black text-white text-base">{p.nom_complet}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statut.classe}`}>
                        {statut.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-0.5 mb-2">
                      <div
                        className="cursor-pointer hover:text-emerald-300 transition-colors"
                        onClick={() => copier(p.email)}
                        title="Cliquer pour copier"
                      >
                        📧 {p.email}
                      </div>
                      <div>
                        📞 {p.telephone} · 💬 {p.whatsapp}
                      </div>
                      {p.quartier && <div>📍 {p.quartier}</div>}
                      <div>📅 Inscrit le {formaterDate(p.created_at)}</div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {p.a_bac_s && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black border border-amber-500/30">
                          🎓 Bac S
                        </span>
                      )}
                      {p.est_etudiant && p.niveau_etude && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                          🎓 {p.niveau_etude}{p.domaine_etude ? ` · ${p.domaine_etude}` : ''}
                        </span>
                      )}
                      {p.experience_annees > 0 && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-black border border-blue-500/30">
                          🎯 {p.experience_annees} an{p.experience_annees > 1 ? 's' : ''}
                        </span>
                      )}
                      {p.zone_enseignement && (
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-black">
                          {zonesConfig[p.zone_enseignement] || p.zone_enseignement}
                        </span>
                      )}
                      {p.pionnier_illustre && (
                        <span className="text-[10px] bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-0.5 rounded-full font-black">
                          👑 ILLUSTRE
                        </span>
                      )}
                      {p.badge_admin && badgesConfig[p.badge_admin] && (
                        <span className={`text-[10px] bg-gradient-to-r ${badgesConfig[p.badge_admin].couleur} text-white px-2 py-0.5 rounded-full font-black`}>
                          {badgesConfig[p.badge_admin].emoji} {badgesConfig[p.badge_admin].label.toUpperCase()}
                        </span>
                      )}
                      {p.pionnier && !p.pionnier_illustre && (
                        <span className="text-[10px] bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-2 py-0.5 rounded-full font-black">
                          🏆 PIONNIER
                        </span>
                      )}
                    </div>

                    {p.matieres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.matieres.slice(0, 6).map((m) => (
                          <span key={m} className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            {m}
                          </span>
                        ))}
                        {p.matieres.length > 6 && (
                          <span className="text-[9px] text-slate-500 font-bold">+{p.matieres.length - 6}</span>
                        )}
                      </div>
                    )}

                    {p.langues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.langues.slice(0, 4).map((l) => (
                          <span key={l} className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold capitalize">
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <div className="bg-white/5 rounded-lg px-3 py-2 text-center min-w-[60px]">
                      <div className="text-[9px] text-slate-500 font-black">NOTE</div>
                      <div className="text-sm font-black text-amber-300">{p.note_moyenne.toFixed(1)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg px-3 py-2 text-center min-w-[50px]">
                      <div className="text-[9px] text-slate-500 font-black">AVIS</div>
                      <div className="text-sm font-black text-white">{p.nombre_avis}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg px-3 py-2 text-center min-w-[50px]">
                      <div className="text-[9px] text-slate-500 font-black">⭐</div>
                      <div className="text-sm font-black text-white">{p.etoiles}/3</div>
                    </div>
                    {p.prix_min && p.prix_max && (
                      <div className="bg-amber-500/10 rounded-lg px-3 py-2 text-center border border-amber-500/30">
                        <div className="text-[9px] text-amber-300 font-black">🔒 PRIX</div>
                        <div className="text-[10px] font-black text-white">
                          {Number(p.prix_min).toLocaleString()}-{Number(p.prix_max).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/zx-4f8b2e-9d3a-ctrl/utilisateurs?id=${p.id}`}
                      className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                      title="Voir la fiche"
                    >
                      👁️
                    </Link>
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
            )
          })}
        </div>
      )}

      {/* INFO BAS */}
      {!loading && profsFiltres.length > 0 && (
        <div className="text-center text-xs text-slate-500 pt-4">
          Affichage de {profsFiltres.length} prof{profsFiltres.length > 1 ? 's' : ''} sur {profs.length}
        </div>
      )}
    </div>
  )
}