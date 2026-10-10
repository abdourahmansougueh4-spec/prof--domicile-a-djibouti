'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type AvisExistant = {
  id: string
  note: number
  commentaire: string
  created_at: string
  signale: boolean
}

type ProfAvecAvis = {
  professeur_id: string
  demande_id: string
  nom_complet: string
  photo_url: string | null
  quartier: string | null
  matiere: string | null
  note_moyenne_prof: number
  nombre_avis_prof: number
  etoiles_prof: number
  avis_parent: AvisExistant | null
  mois_collaboration: number
}

type Filtre = 'tous' | 'note_5' | 'note_4' | 'a_noter'
type Tri = 'recent' | 'ancien' | 'note_haute' | 'note_basse'

// ============================================================
// HELPER : Format date
// ============================================================

const formaterDate = (date: string): string => {
  const d = new Date(date)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffJ = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'À l\'instant'
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH}h`
  if (diffJ < 7) return `Il y a ${diffJ}j`
  if (diffJ < 30) return `Il y a ${Math.floor(diffJ / 7)} sem.`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ============================================================
// HELPER : Couleur note
// ============================================================

const getCouleurNote = (note: number) => {
  if (note >= 5) return { couleur: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excellent', emoji: '🌟' }
  if (note >= 4) return { couleur: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Très bien', emoji: '😊' }
  if (note >= 3) return { couleur: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Bien', emoji: '🙂' }
  if (note >= 2) return { couleur: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Moyen', emoji: '😐' }
  return { couleur: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Décevant', emoji: '😞' }
}

// ============================================================
// HELPER : Coach IA
// ============================================================

const genererConseils = (profs: ProfAvecAvis[]): {
  emoji: string
  texte: string
  priorite: 'haute' | 'moyenne' | 'basse'
}[] => {
  const conseils: { emoji: string; texte: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []

  if (profs.length === 0) {
    conseils.push({
      emoji: '🔍',
      texte: 'Vous n\'avez pas encore de prof. Trouvez-en un pour commencer.',
      priorite: 'haute',
    })
    return conseils
  }

  const aNoter = profs.filter((p) => !p.avis_parent)
  if (aNoter.length > 0) {
    conseils.push({
      emoji: '⭐',
      texte: `${aNoter.length} prof${aNoter.length > 1 ? 's' : ''} n'ont pas encore reçu votre avis. Cela les aide énormément !`,
      priorite: 'haute',
    })
  }

  const notes = profs.filter((p) => p.avis_parent).map((p) => p.avis_parent!.note)
  if (notes.length > 0) {
    const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length
    if (moyenne >= 4.5) {
      conseils.push({
        emoji: '🎉',
        texte: `Excellente moyenne ! Vous êtes très satisfait de vos profs (${moyenne.toFixed(1)}/5).`,
        priorite: 'basse',
      })
    }
    if (moyenne < 3.5) {
      conseils.push({
        emoji: '🤔',
        texte: 'Votre moyenne est basse. Contactez-nous sur WhatsApp pour discuter d\'un éventuel remplacement.',
        priorite: 'haute',
      })
    }
  }

  const anciens = profs.filter((p) => p.mois_collaboration >= 6)
  if (anciens.length > 0 && aNoter.length === 0) {
    conseils.push({
      emoji: '💎',
      texte: `Bravo ! Vous collaborez avec ${anciens.length} prof${anciens.length > 1 ? 's' : ''} depuis plus de 6 mois.`,
      priorite: 'basse',
    })
  }

  if (conseils.length === 0) {
    conseils.push({
      emoji: '✨',
      texte: 'Tous vos avis sont à jour. Merci pour votre contribution !',
      priorite: 'basse',
    })
  }

  return conseils.sort((a, b) => {
    const ordre = { haute: 0, moyenne: 1, basse: 2 }
    return ordre[a.priorite] - ordre[b.priorite]
  }).slice(0, 4)
}

// ============================================================
// COMPOSANT
// ============================================================

export default function AvisParent() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [profs, setProfs] = useState<ProfAvecAvis[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('recent')
  const [recherche, setRecherche] = useState('')

  // Modal notation
  const [modalOuvert, setModalOuvert] = useState<ProfAvecAvis | null>(null)
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
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

      if (demandesErr) throw demandesErr

      const profsComplets: ProfAvecAvis[] = []

      for (const d of demandes || []) {
        const [profRes, profInfoRes, avisRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nom_complet, photo_url, quartier')
            .eq('id', d.professeur_id)
            .single(),
          supabase
            .from('professeurs')
            .select('note_moyenne, nombre_avis, etoiles, photo_profil_url')
            .eq('id', d.professeur_id)
            .single(),
          supabase
            .from('avis')
            .select('id, note, commentaire, created_at, signale')
            .eq('parent_id', user.id)
            .eq('professeur_id', d.professeur_id)
            .maybeSingle(),
        ])

        const dateDebut = new Date(d.created_at)
        const maintenant = new Date()
        const moisEcoules =
          (maintenant.getFullYear() - dateDebut.getFullYear()) * 12 +
          (maintenant.getMonth() - dateDebut.getMonth())

        profsComplets.push({
          professeur_id: d.professeur_id,
          demande_id: d.id,
          nom_complet: profRes.data?.nom_complet || 'Prof',
          photo_url: profInfoRes.data?.photo_profil_url || profRes.data?.photo_url || null,
          quartier: profRes.data?.quartier || null,
          matiere: d.matiere,
          note_moyenne_prof: Number(profInfoRes.data?.note_moyenne) || 0,
          nombre_avis_prof: profInfoRes.data?.nombre_avis || 0,
          etoiles_prof: profInfoRes.data?.etoiles || 0,
          avis_parent: avisRes.data || null,
          mois_collaboration: moisEcoules,
        })
      }

      setProfs(profsComplets)
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
  // FILTRES + TRI
  // ============================================================

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      if (filtre === 'note_5' && (!p.avis_parent || p.avis_parent.note !== 5)) return false
      if (filtre === 'note_4' && (!p.avis_parent || p.avis_parent.note !== 4)) return false
      if (filtre === 'a_noter' && p.avis_parent) return false

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

    if (tri === 'recent') {
      resultat.sort((a, b) => {
        const da = a.avis_parent?.created_at || a.demande_id
        const db = b.avis_parent?.created_at || b.demande_id
        return new Date(db).getTime() - new Date(da).getTime()
      })
    }
    if (tri === 'ancien') {
      resultat.sort((a, b) => {
        const da = a.avis_parent?.created_at || a.demande_id
        const db = b.avis_parent?.created_at || b.demande_id
        return new Date(da).getTime() - new Date(db).getTime()
      })
    }
    if (tri === 'note_haute') {
      resultat.sort((a, b) => (b.avis_parent?.note || 0) - (a.avis_parent?.note || 0))
    }
    if (tri === 'note_basse') {
      resultat.sort((a, b) => (a.avis_parent?.note || 0) - (b.avis_parent?.note || 0))
    }

    return resultat
  }, [profs, filtre, tri, recherche])

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const total = profs.length
    const avecAvis = profs.filter((p) => p.avis_parent).length
    const aNoter = total - avecAvis

    const notes = profs.filter((p) => p.avis_parent).map((p) => p.avis_parent!.note)
    const moyenne = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0

    const repartition = [5, 4, 3, 2, 1].map((n) => ({
      note: n,
      count: profs.filter((p) => p.avis_parent?.note === n).length,
    }))

    return { total, avecAvis, aNoter, moyenne, repartition }
  }, [profs])

  const compte = useMemo(() => {
    return {
      tous: profs.length,
      note_5: profs.filter((p) => p.avis_parent?.note === 5).length,
      note_4: profs.filter((p) => p.avis_parent?.note === 4).length,
      a_noter: profs.filter((p) => !p.avis_parent).length,
    }
  }, [profs])

  const conseils = useMemo(() => genererConseils(profs), [profs])

  // ============================================================
  // ACTIONS
  // ============================================================

  const ouvrirModal = (p: ProfAvecAvis) => {
    setModalOuvert(p)
    if (p.avis_parent) {
      setNote(p.avis_parent.note)
      setCommentaire(p.avis_parent.commentaire)
    } else {
      setNote(5)
      setCommentaire('')
    }
  }

  const enregistrer = async () => {
    if (!modalOuvert) return
    if (commentaire.trim().length < 10) {
      setErreur('Le commentaire doit contenir au moins 10 caractères')
      return
    }

    setSauvegarde(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (modalOuvert.avis_parent) {
        // Modifier
        const { error } = await supabase
          .from('avis')
          .update({
            note,
            commentaire: commentaire.trim(),
          })
          .eq('id', modalOuvert.avis_parent.id)

        if (error) throw error
      } else {
        // Créer
        const { error } = await supabase.from('avis').insert({
          parent_id: user.id,
          professeur_id: modalOuvert.professeur_id,
          demande_id: modalOuvert.demande_id,
          note,
          commentaire: commentaire.trim(),
          publie: true,
        })

        if (error) throw error
      }

      await charger()
      setModalOuvert(null)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setSauvegarde(false)
    }
  }

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 text-sm">Chargement de vos avis...</p>
      </div>
    )
  }

  if (erreur && profs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-red-700 text-sm mb-6">{erreur}</p>
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

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* ============================================================ */}
      {/* HEADER HERO */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-60px] left-[-60px] w-56 h-56 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-2 border-white/30 flex-shrink-0">
              ⭐
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                Mes évaluations
              </div>
              <h1 className="text-3xl md:text-4xl font-black">
                Mes avis
              </h1>
            </div>
          </div>
          <p className="text-amber-100 text-sm mb-5">
            {stats.avecAvis} avis publié{stats.avecAvis > 1 ? 's' : ''} · Moyenne : {stats.moyenne > 0 ? `${stats.moyenne.toFixed(1)}/5` : '—'}
          </p>

          {/* 4 KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                📝 Avis laissés
              </div>
              <div className="text-2xl font-black">{stats.avecAvis}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                ⭐ Note moy.
              </div>
              <div className="text-2xl font-black">
                {stats.moyenne > 0 ? stats.moyenne.toFixed(1) : '—'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                ⏳ À noter
              </div>
              <div className="text-2xl font-black">{stats.aNoter}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase opacity-90">
                🌟 5 étoiles
              </div>
              <div className="text-2xl font-black">{compte.note_5}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* EMPTY STATE */}
      {/* ============================================================ */}

      {stats.total === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/80 shadow-xl text-center"
        >
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Aucun prof à noter
          </h2>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Vous pourrez laisser un avis quand un prof aura accepté votre demande.
          </p>
          <Link
            href="/espace-parent/recherche"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-600 shadow-lg hover:shadow-xl transition-all"
          >
            🔍 Trouver un prof
          </Link>
        </motion.div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* ALERTE À NOTER */}
          {/* ============================================================ */}

          {stats.aNoter > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">💡</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900 mb-1">
                    {stats.aNoter} prof{stats.aNoter > 1 ? 's' : ''} en attente d'avis
                  </p>
                  <p className="text-xs text-blue-800 leading-relaxed mb-3">
                    Votre avis aide les autres parents à choisir. Il encourage
                    aussi les profs à continuer leur excellent travail.
                  </p>
                  <button
                    onClick={() => setFiltre('a_noter')}
                    className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg text-xs"
                  >
                    ⭐ Voir les profs à noter
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* FILTRES */}
          {/* ============================================================ */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            {(
              [
                { val: 'tous', label: '📋 Tous', count: compte.tous },
                { val: 'note_5', label: '🌟 5 étoiles', count: compte.note_5 },
                { val: 'note_4', label: '😊 4 étoiles', count: compte.note_4 },
                { val: 'a_noter', label: '⏳ À noter', count: compte.a_noter },
              ] as { val: Filtre; label: string; count: number }[]
            ).map((f) => (
              <button
                key={f.val}
                onClick={() => setFiltre(f.val)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  filtre === f.val
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </motion.div>

          {/* ============================================================ */}
          {/* RECHERCHE + TRI */}
          {/* ============================================================ */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            <div className="relative flex-1 min-w-[250px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par prof, matière ou quartier..."
                className="w-full pl-12 pr-4 py-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:bg-white font-medium transition-all"
              />
              {recherche && (
                <button
                  onClick={() => setRecherche('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="px-4 py-3 bg-white/80 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-bold outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="recent">📅 Plus récent</option>
              <option value="ancien">📅 Plus ancien</option>
              <option value="note_haute">⭐ Note haute</option>
              <option value="note_basse">⭐ Note basse</option>
            </select>
          </motion.div>

          {/* Compteur résultats */}
          {(recherche || filtre !== 'tous') && (
            <div className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{profsFiltres.length}</span>{' '}
              résultat{profsFiltres.length > 1 ? 's' : ''}
            </div>
          )}

          {/* ============================================================ */}
          {/* STATS RÉPARTITION */}
          {/* ============================================================ */}

          {stats.avecAvis > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
                  📊
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Répartition de mes notes</h3>
                  <p className="text-[10px] text-slate-500">
                    Sur {stats.avecAvis} avis publiés
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {stats.repartition.map((r) => {
                  const pct = stats.avecAvis > 0 ? (r.count / stats.avecAvis) * 100 : 0
                  return (
                    <div key={r.note} className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-500 w-10">
                        {r.note} ⭐
                      </span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5 }}
                          className={`h-full bg-gradient-to-r ${
                            r.note >= 5
                              ? 'from-emerald-500 to-teal-600'
                              : r.note >= 4
                              ? 'from-blue-500 to-indigo-600'
                              : r.note >= 3
                              ? 'from-amber-500 to-orange-600'
                              : r.note >= 2
                              ? 'from-orange-500 to-red-500'
                              : 'from-red-500 to-rose-600'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-700 w-10 text-right">
                        {r.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* COACH IA */}
          {/* ============================================================ */}

          {conseils.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg">
                  🤖
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Coach IA</h3>
                  <p className="text-xs text-slate-500">
                    Conseils pour vos avis
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {conseils.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className={`rounded-xl p-3 border-2 flex items-start gap-3 ${
                      c.priorite === 'haute'
                        ? 'bg-red-50 border-red-200'
                        : c.priorite === 'moyenne'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-purple-100'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{c.emoji}</span>
                    <p className="text-sm text-slate-800 font-medium flex-1">
                      {c.texte}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* LISTE DES PROFS À NOTER/NOTÉS */}
          {/* ============================================================ */}

          {profsFiltres.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/80 shadow-xl text-center"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-black text-slate-900 text-xl mb-2">
                Aucun résultat
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Aucun prof ne correspond à ces critères.
              </p>
              <button
                onClick={() => {
                  setRecherche('')
                  setFiltre('tous')
                }}
                className="px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                ✕ Réinitialiser
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {profsFiltres.map((p, i) => {
                const avis = p.avis_parent
                const infoNote = avis ? getCouleurNote(avis.note) : null

                return (
                  <motion.div
                    key={p.demande_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
                    whileHover={{ y: -3 }}
                    className={`bg-white rounded-3xl p-6 border-2 shadow-lg hover:shadow-xl transition-all ${
                      avis ? 'border-slate-200' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
                    }`}
                  >
                    {/* Header prof */}
                    <div className="flex items-start gap-4 flex-wrap mb-4">
                      {p.photo_url ? (
                        <img
                          src={p.photo_url}
                          alt={p.nom_complet}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-3xl shadow-lg flex-shrink-0">
                          👨‍🏫
                        </div>
                      )}

                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-black text-slate-900 text-lg mb-2">
                          {p.nom_complet}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2">
                          {p.note_moyenne_prof > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="text-amber-400">
                                {'⭐'.repeat(Math.floor(p.note_moyenne_prof))}
                              </span>
                              <span className="font-bold text-slate-900">
                                {p.note_moyenne_prof.toFixed(1)}
                              </span>
                              <span className="text-slate-400">
                                ({p.nombre_avis_prof} avis)
                              </span>
                            </span>
                          )}
                          {p.quartier && (
                            <>
                              <span>•</span>
                              <span>📍 {p.quartier}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>📅 {p.mois_collaboration} mois</span>
                        </div>

                        {p.matiere && (
                          <div className="flex flex-wrap gap-1.5">
                            {p.matiere.split(', ').slice(0, 3).map((m) => (
                              <span
                                key={m}
                                className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Avis existant */}
                    {avis && infoNote ? (
                      <div className={`${infoNote.bg} rounded-2xl p-4 border-2 ${infoNote.border} mb-4`}>
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-slate-900">
                              {avis.note}
                            </span>
                            <span className="text-2xl">{'⭐'.repeat(avis.note)}</span>
                            <span className={`text-xs font-black ${infoNote.couleur}`}>
                              {infoNote.emoji} {infoNote.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {formaterDate(avis.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 italic leading-relaxed">
                          « {avis.commentaire} »
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 rounded-2xl p-4 border-2 border-dashed border-amber-300 mb-4">
                        <p className="text-sm text-amber-800 italic text-center">
                          ⏳ Vous n'avez pas encore laissé d'avis pour ce prof
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => ouvrirModal(p)}
                        className={`flex-1 min-w-[140px] py-3 rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all ${
                          avis
                            ? 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50'
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                        }`}
                      >
                        {avis ? '✏️ Modifier mon avis' : '⭐ Laisser un avis'}
                      </button>
                      <Link
                        href={`/espace-parent/profils/${p.professeur_id}`}
                        className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        👁️ Profil
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* CTA TROUVER PLUS DE PROFS */}
      {/* ============================================================ */}

      {stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white text-center relative overflow-hidden"
        >
          <motion.div
            className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10">
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="text-xl md:text-2xl font-black mb-3">
              Cherchez d'autres profs
            </h2>
            <p className="text-sm text-blue-100 mb-5 max-w-lg mx-auto">
              Découvrez tous les professeurs vérifiés disponibles à Djibouti
              et laissez de nouveaux avis.
            </p>
            <Link
              href="/espace-parent/recherche"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              🔍 Voir tous les profs
            </Link>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* SUPPORT WHATSAPP */}
      {/* ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10 flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border border-white/30 flex-shrink-0">
            💬
          </div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-black mb-1">
              Un problème avec un prof ?
            </h3>
            <p className="text-xs text-emerald-100 mb-3">
              Si vous n'êtes pas satisfait, contactez-nous. Nous pouvons
              remplacer le prof ou vous aider à trouver mieux.
            </p>
            <a
              href="https://wa.me/25377741482"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors shadow-lg"
            >
              💬 Contacter le support
            </a>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* MODAL NOTATION */}
      {/* ============================================================ */}

      <AnimatePresence>
        {modalOuvert && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setModalOuvert(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {modalOuvert.photo_url ? (
                      <img
                        src={modalOuvert.photo_url}
                        alt={modalOuvert.nom_complet}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                        👨‍🏫
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-white">
                        {modalOuvert.avis_parent ? '✏️ Modifier votre avis' : '⭐ Laisser un avis'}
                      </h2>
                      <p className="text-xs text-amber-100 mt-1">
                        {modalOuvert.nom_complet}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalOuvert(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-5">
                {/* Info */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-3">
                  <p className="text-xs text-blue-800">
                    💡 Votre avis est <strong>public</strong> et aide les autres
                    parents à choisir. Soyez honnête et respectueux.
                  </p>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Votre note
                  </label>
                  <div className="flex justify-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <motion.button
                        key={n}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNote(n)}
                        className={`text-5xl transition-all ${
                          n <= note
                            ? 'scale-110 drop-shadow-lg'
                            : 'opacity-30 hover:opacity-60'
                        }`}
                      >
                        ⭐
                      </motion.button>
                    ))}
                  </div>
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-xl ${getCouleurNote(note).bg} border-2 ${getCouleurNote(note).border}`}>
                      <span className="text-xl mr-2">{getCouleurNote(note).emoji}</span>
                      <span className={`font-black ${getCouleurNote(note).couleur}`}>
                        {note}/5 — {getCouleurNote(note).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Commentaire */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Commentaire <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={5}
                    maxLength={500}
                    placeholder="Partagez votre expérience : pédagogie, ponctualité, résultats de votre enfant..."
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none font-medium text-slate-900 text-sm"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">
                      {commentaire.length}/500
                    </span>
                    {commentaire.length > 0 && commentaire.length < 10 && (
                      <span className="text-xs text-amber-700 font-bold">
                        Minimum 10 caractères
                      </span>
                    )}
                  </div>
                </div>

                {/* Erreur */}
                {erreur && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
                  >
                    <span>⚠️</span>
                    <p className="text-red-700 text-xs font-medium">{erreur}</p>
                  </motion.div>
                )}

                {/* Aperçu */}
                {commentaire.length >= 10 && (
                  <div className="bg-gradient-to-br from-slate-50 to-amber-50 rounded-2xl p-4 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-black uppercase mb-2">
                      👁️ Aperçu de votre avis
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{'⭐'.repeat(note)}</span>
                      <span className="text-xs text-slate-500">
                        Aujourd'hui
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 italic">
                      « {commentaire} »
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Publié par vous
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 sticky bottom-0">
                <button
                  onClick={() => setModalOuvert(null)}
                  disabled={sauvegarde}
                  className="flex-1 py-3.5 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrer}
                  disabled={sauvegarde || commentaire.trim().length < 10}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sauvegarde ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Publication...
                    </>
                  ) : (
                    <>✓ {modalOuvert.avis_parent ? 'Mettre à jour' : 'Publier mon avis'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}