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
  professeur_id: string
  prof_nom: string
  prof_photo: string | null
  prof_quartier: string | null
  matiere: string | null
  message: string | null
  statut: string
  motif_refus: string | null
  nombre_enfants: number
  prix_souhaite: number | null
  niveaux_souhaites: string[]
  creneaux_souhaites: string[]
  created_at: string
  updated_at: string
}

type Filtre = 'toutes' | 'en_cours' | 'acceptee' | 'refusee' | 'annulee'

// ============================================================
// STATUTS (simplifiés pour le parent)
// ============================================================

const STATUTS: {
  [k: string]: {
    label: string
    dot: string
    bg: string
    text: string
    border: string
  }
} = {
  en_attente: {
    label: 'En cours',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  pre_acceptee: {
    label: 'En cours',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  acceptee: {
    label: 'Acceptée',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  refusee: {
    label: 'Non retenue',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  annulee: {
    label: 'Annulée',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
}

// ============================================================
// LABELS
// ============================================================

const LABELS_MATIERES: { [k: string]: string } = {
  primaire_fr: 'Primaire — Français',
  primaire_ar: 'Primaire — Arabe',
  college_maths: 'Collège — Maths',
  college_physique: 'Collège — Physique',
  college_svt: 'Collège — SVT',
  college_francais: 'Collège — Français',
  college_anglais: 'Collège — Anglais',
  college_arabe: 'Collège — Arabe',
  lycee_maths: 'Lycée — Maths',
  arabe: 'Arabe',
  coran: 'Coran',
  francais: 'Français',
  anglais: 'Anglais',
}

const LABELS_CRENEAUX: { [k: string]: string } = {
  matin: 'Matin',
  apres_midi: 'Après-midi',
  soir: 'Soir',
}

// ============================================================
// MOTIFS D'ANNULATION
// ============================================================

const MOTIFS = [
  { val: 'prof_trouve', label: 'J\'ai déjà trouvé un professeur', emoji: '👨‍🏫' },
  { val: 'plus_besoin', label: 'Je n\'ai plus besoin de cours', emoji: '✅' },
  { val: 'horaire', label: 'Les horaires ne me conviennent plus', emoji: '📅' },
  { val: 'prix', label: 'Le budget ne correspond pas', emoji: '💰' },
  { val: 'autre', label: 'Autre raison', emoji: '💬' },
]

// ============================================================
// HELPERS
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
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

const normaliserStatut = (statut: string): string => {
  if (statut === 'pre_acceptee') return 'en_attente'
  return statut
}

const peutEtreAnnulee = (statut: string): boolean => {
  return statut === 'en_attente' || statut === 'pre_acceptee'
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function MesDemandes() {
  const supabase = createClient()

  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('toutes')
  const [recherche, setRecherche] = useState('')
  const [detail, setDetail] = useState<Demande | null>(null)

  // Annulation
  const [aAnnuler, setAAnnuler] = useState<Demande | null>(null)
  const [motif, setMotif] = useState('')
  const [precision, setPrecision] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [succes, setSucces] = useState(false)

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

      const { data, error } = await supabase
        .from('demandes')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Demande[] = []

      for (const d of data || []) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('nom_complet, photo_url, quartier')
          .eq('id', d.professeur_id)
          .single()

        const { data: profInfo } = await supabase
          .from('professeurs')
          .select('photo_profil_url')
          .eq('id', d.professeur_id)
          .single()

        complets.push({
          id: d.id,
          professeur_id: d.professeur_id,
          prof_nom: prof?.nom_complet || 'Professeur',
          prof_photo: profInfo?.photo_profil_url || prof?.photo_url || null,
          prof_quartier: prof?.quartier || null,
          matiere: d.matiere || null,
          message: d.message || null,
          statut: d.statut || 'en_attente',
          motif_refus: d.motif_refus || null,
          nombre_enfants: d.nombre_enfants || 1,
          prix_souhaite: d.prix_souhaite ? Number(d.prix_souhaite) : null,
          niveaux_souhaites: d.niveaux_souhaites || [],
          creneaux_souhaites: d.creneaux_souhaites || [],
          created_at: d.created_at,
          updated_at: d.updated_at || d.created_at,
        })
      }

      setDemandes(complets)
    } catch (err: any) {
      console.error('Erreur:', err)
      setErreur(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // ANNULATION
  // ============================================================

  const ouvrirAnnulation = (d: Demande) => {
    setAAnnuler(d)
    setMotif('')
    setPrecision('')
    setSucces(false)
  }

  const fermerAnnulation = () => {
    if (enCours) return
    setAAnnuler(null)
    setMotif('')
    setPrecision('')
    setSucces(false)
  }

  const confirmerAnnulation = async () => {
    if (!aAnnuler || !motif) return

    setEnCours(true)

    try {
      const motifLabel = MOTIFS.find((m) => m.val === motif)?.label || motif
      const motifComplet = precision.trim()
        ? `${motifLabel} — ${precision.trim()}`
        : motifLabel

      const maintenant = new Date().toISOString()

      const { error } = await supabase
        .from('demandes')
        .update({
          statut: 'annulee',
          motif_refus: motifComplet,
          updated_at: maintenant,
        })
        .eq('id', aAnnuler.id)

      if (error) throw error

      // Notifier le professeur
      await supabase.from('notifications').insert({
        destinataire_id: aAnnuler.professeur_id,
        titre: 'Demande annulée',
        contenu: `Le parent a annulé sa demande. Motif : ${motifComplet}`,
        lien: '/espace-professeur/demandes',
        lu: false,
      })

      // Mettre à jour localement
      setDemandes((prev) =>
        prev.map((d) =>
          d.id === aAnnuler.id
            ? {
                ...d,
                statut: 'annulee',
                motif_refus: motifComplet,
                updated_at: maintenant,
              }
            : d
        )
      )

      setSucces(true)

      setTimeout(() => {
        setAAnnuler(null)
        setMotif('')
        setPrecision('')
        setSucces(false)
        setEnCours(false)
      }, 2200)
    } catch (err: any) {
      console.error('Erreur annulation:', err)
      setEnCours(false)
    }
  }

  // ============================================================
  // FILTRES
  // ============================================================

  const compte = useMemo(() => {
    return {
      toutes: demandes.length,
      en_cours: demandes.filter((d) =>
        ['en_attente', 'pre_acceptee'].includes(d.statut)
      ).length,
      acceptee: demandes.filter((d) => d.statut === 'acceptee').length,
      refusee: demandes.filter((d) => d.statut === 'refusee').length,
      annulee: demandes.filter((d) => d.statut === 'annulee').length,
    }
  }, [demandes])

  const filtrees = useMemo(() => {
    return demandes.filter((d) => {
      if (
        filtre === 'en_cours' &&
        !['en_attente', 'pre_acceptee'].includes(d.statut)
      )
        return false
      if (filtre === 'acceptee' && d.statut !== 'acceptee') return false
      if (filtre === 'refusee' && d.statut !== 'refusee') return false
      if (filtre === 'annulee' && d.statut !== 'annulee') return false

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          d.prof_nom.toLowerCase().includes(r) ||
          d.matiere?.toLowerCase().includes(r) ||
          d.prof_quartier?.toLowerCase().includes(r)
        )
      }
      return true
    })
  }, [demandes, filtre, recherche])

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-slate-900 border-t-transparent rounded-full"
        />
        <p className="text-slate-400 text-sm font-medium">Chargement...</p>
      </div>
    )
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <Link
        href="/espace-parent"
        className="text-sm text-slate-400 hover:text-slate-700 inline-flex items-center gap-1.5 transition-colors"
      >
        ← Retour
      </Link>

      {/* HEADER */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Mes demandes
        </h1>
        <p className="text-slate-500 text-sm">
          Suivez l'état de vos demandes de professeurs.
        </p>
      </div>

      {/* EMPTY STATE */}
      {demandes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-12 md:p-16 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl">
            📭
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Aucune demande pour le moment
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
            Trouvez un professeur qui correspond à vos besoins et envoyez votre
            première demande.
          </p>
          <Link
            href="/espace-parent/recherche"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Trouver un professeur
          </Link>
        </motion.div>
      ) : (
        <>
          {/* FILTRES */}
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'toutes' as Filtre, label: 'Toutes', count: compte.toutes },
              { val: 'en_cours' as Filtre, label: 'En cours', count: compte.en_cours },
              {
                val: 'acceptee' as Filtre,
                label: 'Acceptées',
                count: compte.acceptee,
              },
              {
                val: 'refusee' as Filtre,
                label: 'Non retenues',
                count: compte.refusee,
              },
              {
                val: 'annulee' as Filtre,
                label: 'Annulées',
                count: compte.annulee,
              },
            ].map((f) => {
              const actif = filtre === f.val
              return (
                <button
                  key={f.val}
                  onClick={() => setFiltre(f.val)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    actif
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                      actif
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* RECHERCHE */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom ou matière..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 transition-colors text-sm font-medium"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* LISTE */}
          {filtrees.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-bold text-slate-900 mb-1">
                Aucun résultat
              </h3>
              <p className="text-slate-500 text-sm">
                Essayez avec d'autres critères.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtrees.map((d, i) => {
                const statut =
                  STATUTS[normaliserStatut(d.statut)] || STATUTS.en_attente
                const annulable = peutEtreAnnulee(d.statut)

                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(i * 0.03, 0.3),
                    }}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="p-5 md:p-6">
                      {/* Ligne 1 : Prof + Statut */}
                      <div className="flex items-start gap-4 mb-4">
                        {d.prof_photo ? (
                          <img
                            src={d.prof_photo}
                            alt={d.prof_nom}
                            className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                            👨‍🏫
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">
                              {d.prof_nom}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statut.bg} ${statut.text} border ${statut.border} flex-shrink-0`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statut.dot}`}
                              />
                              {statut.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            {d.prof_quartier && (
                              <span className="flex items-center gap-1">
                                <span>📍</span>
                                <span>{d.prof_quartier}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{formaterDate(d.created_at)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ligne 2 : Détails */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {d.matiere && (
                          <div className="col-span-2 md:col-span-1">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                              Matières
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {d.matiere
                                .split(', ')
                                .slice(0, 2)
                                .map((m) => (
                                  <span
                                    key={m}
                                    className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold"
                                  >
                                    {LABELS_MATIERES[m.trim()] || m.trim()}
                                  </span>
                                ))}
                              {d.matiere.split(', ').length > 2 && (
                                <span className="text-[11px] text-slate-400 font-bold px-1">
                                  +{d.matiere.split(', ').length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            Enfants
                          </div>
                          <div className="text-sm font-bold text-slate-800">
                            {d.nombre_enfants}
                          </div>
                        </div>

                        {d.prix_souhaite && (
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                              Budget
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                              {d.prix_souhaite.toLocaleString()} DJF
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Motif */}
                      {d.motif_refus &&
                        (d.statut === 'refusee' ||
                          d.statut === 'annulee') && (
                          <div
                            className={`rounded-xl p-3 mb-4 border ${
                              d.statut === 'annulee'
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-rose-50 border-rose-200'
                            }`}
                          >
                            <div
                              className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                d.statut === 'annulee'
                                  ? 'text-slate-500'
                                  : 'text-rose-600'
                              }`}
                            >
                              {d.statut === 'annulee'
                                ? 'Motif d\'annulation'
                                : 'Motif'}
                            </div>
                            <p
                              className={`text-xs ${
                                d.statut === 'annulee'
                                  ? 'text-slate-700'
                                  : 'text-rose-800'
                              }`}
                            >
                              {d.motif_refus}
                            </p>
                          </div>
                        )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setDetail(d)}
                          className="px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          Voir le détail
                        </button>

                        {annulable && (
                          <button
                            onClick={() => ouvrirAnnulation(d)}
                            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-colors"
                          >
                            Annuler la demande
                          </button>
                        )}

                        {d.statut === 'acceptee' && (
                          <a
                            href={`https://wa.me/25377741482?text=${encodeURIComponent(
                              `Bonjour, je souhaite avoir les coordonnées de ${d.prof_nom} pour ma demande acceptée.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                          >
                            Contacter l'équipe
                          </a>
                        )}

                        {(d.statut === 'refusee' ||
                          d.statut === 'annulee') && (
                          <Link
                            href="/espace-parent/recherche"
                            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
                          >
                            Chercher un autre prof
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL DÉTAIL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {detail && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {detail.prof_photo ? (
                    <img
                      src={detail.prof_photo}
                      alt={detail.prof_nom}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                      👨‍🏫
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900">
                      {detail.prof_nom}
                    </div>
                    {detail.prof_quartier && (
                      <div className="text-xs text-slate-500">
                        📍 {detail.prof_quartier}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDetail(null)}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Statut */}
                {(() => {
                  const s =
                    STATUTS[normaliserStatut(detail.statut)] ||
                    STATUTS.en_attente
                  return (
                    <div
                      className={`rounded-2xl p-4 ${s.bg} border ${s.border}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className={`text-sm font-bold ${s.text}`}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Infos */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow
                    label="Enfants"
                    value={String(detail.nombre_enfants)}
                  />
                  {detail.prix_souhaite && (
                    <InfoRow
                      label="Budget"
                      value={`${detail.prix_souhaite.toLocaleString()} DJF`}
                    />
                  )}
                  <InfoRow
                    label="Envoyée"
                    value={formaterDate(detail.created_at)}
                  />
                </div>

                {/* Matières */}
                {detail.matiere && (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Matières
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.matiere.split(', ').map((m) => (
                        <span
                          key={m}
                          className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold"
                        >
                          {LABELS_MATIERES[m.trim()] || m.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Créneaux */}
                {detail.creneaux_souhaites.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Créneaux
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.creneaux_souhaites.map((c) => {
                        const [jour, creneau] = c.split('|')
                        return (
                          <span
                            key={c}
                            className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold"
                          >
                            {jour} {LABELS_CRENEAUX[creneau] || creneau}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Message */}
                {detail.message && (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Votre message
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {detail.message}
                    </div>
                  </div>
                )}

                {/* Motif */}
                {detail.motif_refus &&
                  (detail.statut === 'refusee' ||
                    detail.statut === 'annulee') && (
                    <div
                      className={`rounded-xl p-3 border ${
                        detail.statut === 'annulee'
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          detail.statut === 'annulee'
                            ? 'text-slate-500'
                            : 'text-rose-600'
                        }`}
                      >
                        {detail.statut === 'annulee'
                          ? 'Motif d\'annulation'
                          : 'Motif'}
                      </div>
                      <p
                        className={`text-xs ${
                          detail.statut === 'annulee'
                            ? 'text-slate-700'
                            : 'text-rose-800'
                        }`}
                      >
                        {detail.motif_refus}
                      </p>
                    </div>
                  )}
              </div>

              {/* Actions footer */}
              <div className="p-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  Fermer
                </button>
                {peutEtreAnnulee(detail.statut) && (
                  <button
                    onClick={() => {
                      const d = detail
                      setDetail(null)
                      setTimeout(() => ouvrirAnnulation(d), 150)
                    }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    Annuler la demande
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL ANNULATION */}
      {/* ============================================================ */}
      <AnimatePresence>
        {aAnnuler && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
            onClick={fermerAnnulation}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              {succes ? (
                // ÉCRAN DE SUCCÈS
                <div className="p-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-50 flex items-center justify-center"
                  >
                    <svg
                      className="w-8 h-8 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Demande annulée
                  </h3>
                  <p className="text-sm text-slate-500">
                    Le professeur a été prévenu.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Annuler la demande
                    </h3>
                    <p className="text-sm text-slate-500">
                      À {aAnnuler.prof_nom}
                    </p>
                  </div>

                  {/* Contenu */}
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Pourquoi annulez-vous ?
                      </label>
                      <div className="space-y-2">
                        {MOTIFS.map((m) => {
                          const actif = motif === m.val
                          return (
                            <button
                              key={m.val}
                              type="button"
                              onClick={() => setMotif(m.val)}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                                actif
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  actif
                                    ? 'border-white bg-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {actif && (
                                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                                )}
                              </div>
                              <span className="text-base">{m.emoji}</span>
                              <span className="text-sm font-medium flex-1">
                                {m.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Précisions{' '}
                        <span className="text-slate-400 font-normal">
                          (facultatif)
                        </span>
                      </label>
                      <textarea
                        value={precision}
                        onChange={(e) => setPrecision(e.target.value)}
                        rows={3}
                        maxLength={200}
                        placeholder="Ajoutez un commentaire..."
                        className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-medium text-slate-800 resize-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={fermerAnnulation}
                      disabled={enCours}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                      Retour
                    </button>
                    <button
                      onClick={confirmerAnnulation}
                      disabled={enCours || !motif}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {enCours ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Annulation...
                        </>
                      ) : (
                        'Confirmer'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// SOUS-COMPOSANT
// ============================================================

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-sm font-bold text-slate-800">{value}</div>
    </div>
  )
}