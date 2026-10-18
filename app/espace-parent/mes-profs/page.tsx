'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfActif = {
  id: string
  professeur_id: string
  demande_id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  matiere: string | null
  note_moyenne: number
  etoiles: number
  badge_admin: string | null
  pionnier: boolean
  pionnier_illustre: boolean
  created_at: string
  mois_avec_client: number
  suivi_actuel: {
    id: string
    mois: string
    note: number | null
    appreciation: string | null
    points_forts: string | null
    points_ameliorer: string | null
    enfant_id: string | null
    enfant_prenom: string | null
  } | null
  historique_notes: { mois: string; note: number; enfant_prenom: string | null }[]
  deja_noté_par_parent: boolean
}

type Filtre = 'tous' | 'recents' | 'long_terme' | 'top_notes'
type Tri = 'recent' | 'ancien' | 'note_haute' | 'mois_eleve' | 'matiere'

// ============================================================
// CONFIG
// ============================================================

const LABELS_MATIERES: { [k: string]: string } = {
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

// ============================================================
// HELPERS
// ============================================================

const getMoisActuel = (): string => {
  const d = new Date()
  const mois = d.toLocaleDateString('fr-FR', { month: 'long' })
  return `${mois.charAt(0).toUpperCase() + mois.slice(1)} ${d.getFullYear()}`
}

const getFidelite = (mois: number) => {
  if (mois >= 12) return { emoji: '👑', label: 'Légende', couleur: 'from-amber-500 to-orange-600' }
  if (mois >= 6) return { emoji: '💎', label: 'Fidèle', couleur: 'from-emerald-500 to-teal-600' }
  if (mois >= 3) return { emoji: '⭐', label: 'Régulier', couleur: 'from-blue-500 to-indigo-600' }
  return { emoji: '🌱', label: 'Nouveau', couleur: 'from-purple-500 to-pink-600' }
}

const getCouleurNote = (note: number | null) => {
  if (note === null || note === 0)
    return { couleur: 'text-slate-400', bg: 'bg-slate-100', label: 'Non évalué', emoji: '⏳' }
  if (note >= 16)
    return { couleur: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent', emoji: '🌟' }
  if (note >= 12)
    return { couleur: 'text-blue-600', bg: 'bg-blue-50', label: 'Bien', emoji: '✅' }
  if (note >= 10)
    return { couleur: 'text-amber-600', bg: 'bg-amber-50', label: 'Moyen', emoji: '📊' }
  return { couleur: 'text-red-600', bg: 'bg-red-50', label: 'À améliorer', emoji: '⚠️' }
}

const genererConseils = (profs: ProfActif[]) => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  if (profs.length === 0) {
    conseils.push({
      emoji: '🔍',
      texte: 'Vous n\'avez pas encore de prof actif. Commencez par envoyer une demande.',
      priorite: 'haute',
    })
    return conseils
  }

  const moisActuel = getMoisActuel()
  const sansSuivi = profs.filter((p) => !p.suivi_actuel || p.suivi_actuel.mois !== moisActuel)

  if (sansSuivi.length > 0) {
    conseils.push({
      emoji: '📊',
      texte: `${sansSuivi.length} prof${sansSuivi.length > 1 ? 's' : ''} n'ont pas encore publié le suivi de ${moisActuel}.`,
      priorite: 'haute',
    })
  }

  const aNoter = profs.filter((p) => !p.deja_noté_par_parent)
  if (aNoter.length > 0) {
    conseils.push({
      emoji: '⭐',
      texte: `Vous pouvez laisser un avis sur ${aNoter.length} prof${aNoter.length > 1 ? 's' : ''}.`,
      priorite: 'moyenne',
    })
  }

  const fideles = profs.filter((p) => p.mois_avec_client >= 6)
  if (fideles.length > 0) {
    conseils.push({
      emoji: '💎',
      texte: `${fideles.length} prof${fideles.length > 1 ? 's' : ''} depuis plus de 6 mois. Excellent !`,
      priorite: 'basse',
    })
  }

  if (conseils.length === 0) {
    conseils.push({
      emoji: '✨',
      texte: 'Tout va bien avec vos profs !',
      priorite: 'basse',
    })
  }

  return conseils
    .sort((a, b) => {
      const ordre = { haute: 0, moyenne: 1, basse: 2 }
      return ordre[a.priorite] - ordre[b.priorite]
    })
    .slice(0, 4)
}

// ============================================================
// COMPOSANT
// ============================================================

export default function MesProfs() {
  const supabase = createClient()

  const [profs, setProfs] = useState<ProfActif[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')
  const [historiqueModal, setHistoriqueModal] = useState<ProfActif | null>(null)
  const [suiviDetail, setSuiviDetail] = useState<ProfActif | null>(null)

  const moisActuel = getMoisActuel()

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée')
        setLoading(false)
        return
      }

      const { data: demandes, error: demandesErr } = await supabase
        .from('demandes')
        .select('*')
        .eq('parent_id', user.id)
        .eq('statut', 'acceptee')
        .order('created_at', { ascending: false })

      if (demandesErr) throw demandesErr

      const profsComplets: ProfActif[] = []

      for (const d of demandes || []) {
        const [profRes, profInfoRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nom_complet, photo_url, quartier')
            .eq('id', d.professeur_id)
            .single(),
          supabase
            .from('professeurs')
            .select('note_moyenne, etoiles, badge_admin, pionnier, pionnier_illustre, photo_profil_url')
            .eq('id', d.professeur_id)
            .single(),
        ])

        // ✅ Suivi du mois avec enfant_prenom + points forts/à améliorer
        const { data: suiviActuel } = await supabase
          .from('suivi_mensuel')
          .select('id, mois, note, appreciation, points_forts, points_ameliorer, enfant_id, enfant_prenom')
          .eq('demande_id', d.id)
          .eq('mois', moisActuel)
          .maybeSingle()

        // Historique complet
        const { data: historique } = await supabase
          .from('suivi_mensuel')
          .select('mois, note, enfant_prenom')
          .eq('demande_id', d.id)
          .not('note', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6)

        const { data: avisExistant } = await supabase
          .from('avis')
          .select('id')
          .eq('parent_id', user.id)
          .eq('professeur_id', d.professeur_id)
          .maybeSingle()

        const dateDebut = new Date(d.created_at)
        const maintenant = new Date()
        const moisEcoules =
          (maintenant.getFullYear() - dateDebut.getFullYear()) * 12 +
          (maintenant.getMonth() - dateDebut.getMonth())

        profsComplets.push({
          id: d.id,
          professeur_id: d.professeur_id,
          demande_id: d.id,
          nom_complet: profRes.data?.nom_complet || 'Prof',
          photo_url: profInfoRes.data?.photo_profil_url || profRes.data?.photo_url || null,
          quartier: profRes.data?.quartier || null,
          matiere: d.matiere,
          note_moyenne: Number(profInfoRes.data?.note_moyenne) || 0,
          etoiles: profInfoRes.data?.etoiles || 0,
          badge_admin: profInfoRes.data?.badge_admin || null,
          pionnier: profInfoRes.data?.pionnier === true,
          pionnier_illustre: profInfoRes.data?.pionnier_illustre === true,
          created_at: d.created_at,
          mois_avec_client: moisEcoules,
          suivi_actuel: suiviActuel || null,
          historique_notes: (historique || []).map((h) => ({
            mois: h.mois,
            note: Number(h.note),
            enfant_prenom: h.enfant_prenom || null,
          })),
          deja_noté_par_parent: !!avisExistant,
        })
      }

      setProfs(profsComplets)
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase, moisActuel])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // FILTRES
  // ============================================================

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      if (filtre === 'recents' && p.mois_avec_client >= 3) return false
      if (filtre === 'long_terme' && p.mois_avec_client < 6) return false
      if (filtre === 'top_notes' && p.note_moyenne < 4.5) return false

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r) ||
          p.matiere?.toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'recent')
      resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien')
      resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'note_haute') resultat.sort((a, b) => b.note_moyenne - a.note_moyenne)
    if (tri === 'mois_eleve') resultat.sort((a, b) => b.mois_avec_client - a.mois_avec_client)
    if (tri === 'matiere') resultat.sort((a, b) => (a.matiere || '').localeCompare(b.matiere || ''))

    return resultat
  }, [profs, filtre, tri, recherche])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const total = profs.length
    const moyenneNotes =
      profs.filter((p) => p.note_moyenne > 0).length > 0
        ? profs.filter((p) => p.note_moyenne > 0).reduce((acc, p) => acc + p.note_moyenne, 0) /
          profs.filter((p) => p.note_moyenne > 0).length
        : 0
    const moisCumules = profs.reduce((acc, p) => acc + p.mois_avec_client, 0)
    const suiviAJour = profs.filter((p) => p.suivi_actuel && p.suivi_actuel.mois === moisActuel).length

    return { total, moyenneNotes, moisCumules, suiviAJour }
  }, [profs, moisActuel])

  const compte = useMemo(
    () => ({
      tous: profs.length,
      recents: profs.filter((p) => p.mois_avec_client < 3).length,
      long_terme: profs.filter((p) => p.mois_avec_client >= 6).length,
      top_notes: profs.filter((p) => p.note_moyenne >= 4.5).length,
    }),
    [profs]
  )

  const conseils = useMemo(() => genererConseils(profs), [profs])

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-slate-900 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm">Chargement...</p>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 max-w-md text-center"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-rose-700 text-sm mb-6">{erreur}</p>
          <button
            onClick={charger}
            className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
          >
            Réessayer
          </button>
        </motion.div>
      </div>
    )
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-400 hover:text-slate-700 inline-flex items-center gap-1.5 transition-colors"
      >
        ← Retour
      </Link>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl text-white relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl border-2 border-white/30 flex-shrink-0">
              👨‍🏫
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                Mon équipe éducative
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black">
                Mes professeurs
              </h1>
            </div>
          </div>
          <p className="text-emerald-100 text-xs sm:text-sm mb-4 sm:mb-5">
            {stats.total} prof{stats.total > 1 ? 's' : ''} actif{stats.total > 1 ? 's' : ''} · Suivi à jour : {stats.suiviAJour}/{stats.total}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Total profs', val: stats.total, emoji: '👥' },
              { label: 'Note moy.', val: stats.moyenneNotes > 0 ? stats.moyenneNotes.toFixed(1) : '—', emoji: '⭐' },
              { label: 'Mois cumulés', val: stats.moisCumules, emoji: '📅' },
              { label: 'Suivi à jour', val: `${stats.suiviAJour}/${stats.total}`, emoji: '✅' },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/20"
              >
                <div className="text-[9px] sm:text-[10px] font-bold uppercase opacity-90 mb-1">
                  {k.emoji} {k.label}
                </div>
                <div className="text-lg sm:text-2xl font-black">{k.val}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Alerte suivi */}
      {stats.total > 0 && stats.suiviAJour < stats.total && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-3 sm:p-4 flex items-start gap-3"
        >
          <span className="text-xl sm:text-2xl flex-shrink-0">⏳</span>
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-bold text-amber-900 mb-0.5">
              {stats.total - stats.suiviAJour} suivi{stats.total - stats.suiviAJour > 1 ? 's' : ''} en attente pour {moisActuel}
            </p>
            <p className="text-[11px] sm:text-xs text-amber-800">
              Vos profs n'ont pas encore publié le suivi de ce mois.
            </p>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {stats.total === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 text-center"
        >
          <div className="text-5xl sm:text-6xl mb-4">👨‍🏫</div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-2">
            Aucun prof actif
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mb-6 max-w-md mx-auto">
            Vous n'avez pas encore de professeur accepté. Envoyez votre première demande.
          </p>
          <Link
            href="/espace-parent/recherche"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors text-sm"
          >
            🔍 Trouver un prof
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Filtres */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {(
              [
                { val: 'tous', label: '👥 Tous', count: compte.tous, color: 'from-slate-700 to-slate-900' },
                { val: 'recents', label: '🌱 Récents', count: compte.recents, color: 'from-emerald-500 to-teal-600' },
                { val: 'long_terme', label: '💎 6+ mois', count: compte.long_terme, color: 'from-blue-500 to-indigo-600' },
                { val: 'top_notes', label: '⭐ Top', count: compte.top_notes, color: 'from-amber-500 to-orange-600' },
              ] as any[]
            ).map((f) => (
              <button
                key={f.val}
                onClick={() => setFiltre(f.val)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  filtre === f.val
                    ? `bg-gradient-to-r ${f.color} text-white shadow-md`
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 sm:pl-11 pr-3 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 outline-none font-medium transition-colors"
              />
            </div>
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:border-slate-400 outline-none cursor-pointer"
            >
              <option value="recent">📅 Récent</option>
              <option value="ancien">📅 Ancien</option>
              <option value="note_haute">⭐ Meilleure note</option>
              <option value="mois_eleve">⏰ Plus mois</option>
              <option value="matiere">📚 Matière</option>
            </select>
          </div>

          {/* Coach IA */}
          {conseils.length > 0 && (
            <div className="bg-purple-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white text-xl sm:text-2xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Coach IA</h3>
                  <p className="text-[11px] text-slate-500">Conseils</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2 sm:gap-3">
                {conseils.map((c, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border flex items-start gap-2 ${
                      c.priorite === 'haute'
                        ? 'bg-rose-50 border-rose-200'
                        : c.priorite === 'moyenne'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-purple-100'
                    }`}
                  >
                    <span className="text-lg sm:text-xl flex-shrink-0">{c.emoji}</span>
                    <p className="text-[12px] sm:text-sm text-slate-800 font-medium flex-1">
                      {c.texte}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste des profs */}
          <div className="space-y-3 sm:space-y-4">
            {profsFiltres.map((p, i) => {
              const fidelite = getFidelite(p.mois_avec_client)
              const infoNote = getCouleurNote(p.suivi_actuel?.note || null)
              const suiviAJour = p.suivi_actuel && p.suivi_actuel.mois === moisActuel

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
                  className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all ${
                    suiviAJour ? 'border-slate-200' : 'border-amber-200'
                  }`}
                >
                  {/* Header prof */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-wrap mb-4">
                    <div className="relative flex-shrink-0">
                      {p.photo_url ? (
                        <img
                          src={p.photo_url}
                          alt={p.nom_complet}
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl sm:text-3xl">
                          👨‍🏫
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${fidelite.couleur} flex items-center justify-center text-white text-[10px] sm:text-sm border-2 border-white`}
                      >
                        {fidelite.emoji}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                          {p.nom_complet}
                        </h3>
                        <span
                          className={`text-[9px] bg-gradient-to-r ${fidelite.couleur} text-white px-2 py-0.5 rounded-full font-bold`}
                        >
                          {fidelite.emoji} {fidelite.label.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {p.etoiles > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="text-amber-400">{'⭐'.repeat(p.etoiles)}</span>
                            {p.note_moyenne > 0 && (
                              <span className="font-bold text-slate-900">{p.note_moyenne.toFixed(1)}</span>
                            )}
                          </span>
                        )}
                        {p.quartier && (
                          <span className="flex items-center gap-1">
                            <span>📍</span>
                            <span>{p.quartier}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{p.mois_avec_client} mois</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ SUIVI DU MOIS AVEC ENFANT */}
                  <div className={`rounded-2xl p-3 sm:p-4 border ${
                    suiviAJour
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-700 uppercase">
                          📊 Suivi de {moisActuel}
                        </span>
                        {suiviAJour && p.suivi_actuel?.enfant_prenom && (
                          <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">
                            👶 {p.suivi_actuel.enfant_prenom}
                          </span>
                        )}
                      </div>
                      {suiviAJour ? (
                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                          ✓ PUBLIÉ
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                          ⏳ EN ATTENTE
                        </span>
                      )}
                    </div>

                    {suiviAJour && p.suivi_actuel ? (
                      <div className="space-y-3">
                        {/* Note + Statut */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`${infoNote.bg} rounded-xl px-3 py-2 border border-slate-200`}>
                            <div className="text-[9px] text-slate-500 font-bold uppercase">Note</div>
                            <div className={`text-xl sm:text-2xl font-black ${infoNote.couleur}`}>
                              {p.suivi_actuel.note || '—'}/20
                            </div>
                          </div>
                          <div className={`${infoNote.bg} rounded-xl px-3 py-2 border border-slate-200`}>
                            <div className="text-[9px] text-slate-500 font-bold uppercase">Niveau</div>
                            <div className={`text-sm font-bold ${infoNote.couleur}`}>
                              {infoNote.emoji} {infoNote.label}
                            </div>
                          </div>
                        </div>

                        {/* Appréciation */}
                        {p.suivi_actuel.appreciation && (
                          <div className="bg-white rounded-xl p-3 border border-slate-200">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                              💬 Appréciation du prof
                            </div>
                            <p className="text-xs text-slate-700 italic leading-relaxed">
                              « {p.suivi_actuel.appreciation} »
                            </p>
                          </div>
                        )}

                        {/* Points forts / À améliorer */}
                        {(p.suivi_actuel.points_forts || p.suivi_actuel.points_ameliorer) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {p.suivi_actuel.points_forts && (
                              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                                <div className="text-[10px] text-emerald-700 font-bold uppercase mb-1">
                                  ✅ Points forts
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  {p.suivi_actuel.points_forts}
                                </p>
                              </div>
                            )}
                            {p.suivi_actuel.points_ameliorer && (
                              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                                <div className="text-[10px] text-amber-700 font-bold uppercase mb-1">
                                  ⚠️ À améliorer
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  {p.suivi_actuel.points_ameliorer}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">
                        Le prof n'a pas encore publié le suivi de ce mois.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                    <a
                      href={`https://wa.me/25377741482?text=${encodeURIComponent(`Bonjour, je suis le parent de ${p.nom_complet}, pouvez-vous me donner des nouvelles ?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 bg-green-500 text-white rounded-xl font-bold text-xs text-center hover:bg-green-600 transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                    <Link
                      href={`/espace-parent/profils/${p.professeur_id}`}
                      className="px-3 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs text-center hover:bg-slate-200 transition-colors"
                    >
                      👁️ Profil
                    </Link>
                    {p.historique_notes.length > 1 && (
                      <button
                        onClick={() => setHistoriqueModal(p)}
                        className="px-3 py-2.5 bg-purple-100 text-purple-700 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors"
                      >
                        📊 Historique
                      </button>
                    )}
                    <Link
                      href="/espace-parent/avis"
                      className={`px-3 py-2.5 rounded-xl font-bold text-xs text-center transition-colors ${
                        p.deja_noté_par_parent
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {p.deja_noté_par_parent ? '✓ Avis' : '⭐ Noter'}
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      {/* Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl text-white"
      >
        <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
            💬
          </div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-base sm:text-lg font-bold mb-1">Besoin d'aide ?</h3>
            <p className="text-[11px] sm:text-xs text-emerald-100 mb-3">
              Disponible 7j/7 pour vous accompagner.
            </p>
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm"
            >
              💬 Contacter le support
            </a>
          </div>
        </div>
      </motion.div>

      {/* Modal historique */}
      <AnimatePresence>
        {historiqueModal && (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setHistoriqueModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl my-8 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">📊 Historique</h2>
                    <p className="text-xs text-purple-100 mt-0.5">{historiqueModal.nom_complet}</p>
                  </div>
                  <button
                    onClick={() => setHistoriqueModal(null)}
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
                {historiqueModal.historique_notes.map((h, i) => {
                  const info = getCouleurNote(h.note)
                  return (
                    <div
                      key={i}
                      className={`rounded-xl p-3.5 border ${info.bg} border-slate-200 flex items-center gap-3`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                        {info.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {h.mois}
                          {h.enfant_prenom && (
                            <span className="text-slate-500 font-medium"> · {h.enfant_prenom}</span>
                          )}
                        </div>
                        <div className={`text-[10px] font-bold ${info.couleur}`}>{info.label}</div>
                      </div>
                      <div className={`text-2xl font-bold ${info.couleur}`}>{h.note}/20</div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setHistoriqueModal(null)}
                  className="w-full py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-sm"
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