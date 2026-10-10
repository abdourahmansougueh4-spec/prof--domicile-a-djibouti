'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Paiement = {
  id: string
  parent_id: string | null
  parent_nom: string
  parent_email: string
  parent_tel: string
  parent_whatsapp: string
  professeur_id: string | null
  prof_nom: string
  prof_email: string
  demande_id: string | null
  montant: number
  formule: string | null
  methode: string | null
  reference: string | null
  capture_url: string | null
  statut: string
  valide_par: string | null
  created_at: string
}

type Onglet = 'en_attente' | 'valide' | 'refuse' | 'rembourse' | 'tous'
type Tri = 'recent' | 'ancien' | 'montant_eleve' | 'montant_bas'

const labelsStatut: {
  [k: string]: { label: string; couleur: string; emoji: string }
} = {
  en_attente: {
    label: 'En attente',
    couleur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    emoji: '⏳',
  },
  valide: {
    label: 'Validé',
    couleur: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    emoji: '✅',
  },
  refuse: {
    label: 'Refusé',
    couleur: 'bg-red-500/20 text-red-300 border-red-500/30',
    emoji: '❌',
  },
  rembourse: {
    label: 'Remboursé',
    couleur: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    emoji: '💸',
  },
}

const labelsFormule: { [k: string]: { label: string; emoji: string } } = {
  simple: { label: 'Simple', emoji: '💎' },
  premium: { label: 'Premium', emoji: '🏆' },
  prof_mensuel: { label: 'Frais Prof', emoji: '💵' },
}

export default function AdminPaiementsParents() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Onglet>('en_attente')
  const [tri, setTri] = useState<Tri>('recent')
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  const [detail, setDetail] = useState<Paiement | null>(null)
  const [decision, setDecision] = useState<Paiement | null>(null)
  const [typeAction, setTypeAction] = useState<'valider' | 'refuser' | 'rembourser'>('valider')
  const [motifRefus, setMotifRefus] = useState('')
  const [action, setAction] = useState(false)

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('paiements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: Paiement[] = []

      for (const p of data || []) {
        const [parentRes, profRes] = await Promise.all([
          p.parent_id
            ? supabase
                .from('profiles')
                .select('nom_complet, email, telephone, whatsapp')
                .eq('id', p.parent_id)
                .single()
            : Promise.resolve({ data: null }),
          p.professeur_id
            ? supabase
                .from('profiles')
                .select('nom_complet, email')
                .eq('id', p.professeur_id)
                .single()
            : Promise.resolve({ data: null }),
        ])

        complets.push({
          id: p.id,
          parent_id: p.parent_id,
          parent_nom: parentRes.data?.nom_complet || '—',
          parent_email: parentRes.data?.email || '—',
          parent_tel: parentRes.data?.telephone || '—',
          parent_whatsapp: parentRes.data?.whatsapp || '—',
          professeur_id: p.professeur_id,
          prof_nom: profRes.data?.nom_complet || '—',
          prof_email: profRes.data?.email || '—',
          demande_id: p.demande_id,
          montant: Number(p.montant) || 0,
          formule: p.formule || null,
          methode: p.methode || null,
          reference: p.reference || null,
          capture_url: p.capture_url || null,
          statut: p.statut || 'en_attente',
          valide_par: p.valide_par,
          created_at: p.created_at,
        })
      }

      setPaiements(complets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const validerPaiement = async (p: Paiement) => {
    if (!confirm(`✅ VALIDER ce paiement de ${p.montant.toLocaleString()} DJF ?`)) return

    setAction(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase
        .from('paiements')
        .update({
          statut: 'valide',
          valide_par: user?.id,
        })
        .eq('id', p.id)

      // Si c'est un paiement lié à une demande, la marquer payée
      if (p.demande_id) {
        await supabase
          .from('demandes')
          .update({
            paiement_effectue: true,
            montant_paye: p.montant,
          })
          .eq('id', p.demande_id)
      }

      // Notifier le parent
      if (p.parent_id) {
        await supabase.from('notifications').insert({
          destinataire_id: p.parent_id,
          titre: '✅ Paiement validé !',
          contenu: `Votre paiement de ${p.montant.toLocaleString()} DJF a été validé. L'équipe va vous contacter.`,
          lien: '/espace-parent/demandes',
          lu: false,
        })
      }

      await supabase.from('admin_logs').insert({
        action: 'valider_paiement',
        details: `${p.parent_nom} → ${p.montant.toLocaleString()} DJF`,
      })

      await charger()
      setDecision(null)
      setDetail(null)
      alert('✅ Paiement validé !')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const refuserPaiement = async (p: Paiement) => {
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer un motif')
      return
    }

    setAction(true)
    try {
      await supabase
        .from('paiements')
        .update({ statut: 'refuse' })
        .eq('id', p.id)

      if (p.parent_id) {
        await supabase.from('notifications').insert({
          destinataire_id: p.parent_id,
          titre: '❌ Paiement refusé',
          contenu: `Votre paiement n'a pas pu être validé. Motif : ${motifRefus}`,
          lien: '/espace-parent',
          lu: false,
        })
      }

      await supabase.from('admin_logs').insert({
        action: 'refuser_paiement',
        details: `${p.parent_nom} | Motif: ${motifRefus}`,
      })

      await charger()
      setDecision(null)
      setDetail(null)
      setMotifRefus('')
      alert('❌ Paiement refusé')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const rembourserPaiement = async (p: Paiement) => {
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer le motif du remboursement')
      return
    }

    if (!confirm(`💸 REMBOURSER ${p.montant.toLocaleString()} DJF ?`)) return

    setAction(true)
    try {
      await supabase
        .from('paiements')
        .update({ statut: 'rembourse' })
        .eq('id', p.id)

      if (p.parent_id) {
        await supabase.from('notifications').insert({
          destinataire_id: p.parent_id,
          titre: '💸 Paiement remboursé',
          contenu: `Votre paiement de ${p.montant.toLocaleString()} DJF sera remboursé. Motif : ${motifRefus}`,
          lien: '/espace-parent',
          lu: false,
        })
      }

      await supabase.from('admin_logs').insert({
        action: 'rembourser_paiement',
        details: `${p.parent_nom} → ${p.montant} DJF | ${motifRefus}`,
      })

      await charger()
      setDecision(null)
      setDetail(null)
      setMotifRefus('')
      alert('💸 Paiement remboursé')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const paiementsFiltres = useMemo(() => {
    let resultat = paiements.filter((p) => {
      if (onglet === 'en_attente' && p.statut !== 'en_attente') return false
      if (onglet === 'valide' && p.statut !== 'valide') return false
      if (onglet === 'refuse' && p.statut !== 'refuse') return false
      if (onglet === 'rembourse' && p.statut !== 'rembourse') return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return (
          p.parent_nom.toLowerCase().includes(r) ||
          p.prof_nom.toLowerCase().includes(r) ||
          p.parent_email.toLowerCase().includes(r) ||
          (p.reference || '').toLowerCase().includes(r)
        )
      }
      return true
    })

    if (tri === 'recent')
      resultat.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    if (tri === 'ancien')
      resultat.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    if (tri === 'montant_eleve') resultat.sort((a, b) => b.montant - a.montant)
    if (tri === 'montant_bas') resultat.sort((a, b) => a.montant - b.montant)

    return resultat
  }, [paiements, onglet, recherche, tri])

  const compte = (statut: string) =>
    paiements.filter((p) => p.statut === statut).length

  const revenusMois = paiements
    .filter((p) => {
      if (p.statut !== 'valide') return false
      const date = new Date(p.created_at)
      const maintenant = new Date()
      return (
        date.getMonth() === maintenant.getMonth() &&
        date.getFullYear() === maintenant.getFullYear()
      )
    })
    .reduce((acc, p) => acc + p.montant, 0)

  const totalRevenus = paiements
    .filter((p) => p.statut === 'valide')
    .reduce((acc, p) => acc + p.montant, 0)

  const totalEnAttente = paiements
    .filter((p) => p.statut === 'en_attente')
    .reduce((acc, p) => acc + p.montant, 0)

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">💰 Paiements Parents</h1>
          <p className="text-orange-100 text-sm mb-5">
            {paiements.length} paiement{paiements.length > 1 ? 's' : ''} ·
            Valider les paiements des parents
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-orange-200">
                En attente
              </div>
              <div className="text-xl font-black">{compte('en_attente')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-orange-200">
                Validés
              </div>
              <div className="text-xl font-black">{compte('valide')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-orange-200">
                Revenus du mois
              </div>
              <div className="text-sm font-black">
                {revenusMois.toLocaleString()} DJF
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-orange-200">
                Total revenus
              </div>
              <div className="text-sm font-black">
                {totalRevenus.toLocaleString()} DJF
              </div>
            </div>
          </div>

          {totalEnAttente > 0 && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-orange-200">
                💰 Montant total en attente
              </div>
              <div className="text-2xl font-black">
                {totalEnAttente.toLocaleString()} DJF
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Info */}
      <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-bold text-blue-200 mb-1">
              Vérifie la capture d'écran avant de valider
            </p>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Le parent envoie son paiement via <strong>Waafi</strong> (+253 77
              74 14 82) puis envoie une capture. Vérifie que le montant
              correspond avant de valider.
            </p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            val: 'en_attente',
            label: '⏳ En attente',
            count: compte('en_attente'),
          },
          { val: 'valide', label: '✅ Validés', count: compte('valide') },
          { val: 'refuse', label: '❌ Refusés', count: compte('refuse') },
          {
            val: 'rembourse',
            label: '💸 Remboursés',
            count: compte('rembourse'),
          },
          { val: 'tous', label: '📋 Tous', count: paiements.length },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val as Onglet)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.label} ({o.count})
          </button>
        ))}
      </div>

      {/* Recherche + Tri */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par parent, prof ou référence..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
          <option value="montant_eleve">Montant élevé</option>
          <option value="montant_bas">Montant bas</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
          />
        </div>
      ) : paiementsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">💰</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucun paiement
          </h3>
          <p className="text-slate-400 text-sm">
            Aucun paiement dans cette catégorie.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {paiementsFiltres.map((p, i) => {
            const statutInfo = labelsStatut[p.statut] || labelsStatut.en_attente
            const formuleInfo = p.formule
              ? labelsFormule[p.formule] || { label: p.formule, emoji: '💎' }
              : null

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  p.statut === 'en_attente'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-slate-800/70 border-white/10'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Montant */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-lg flex-shrink-0">
                    <div className="text-[10px] font-black">DJF</div>
                    <div className="text-sm font-black">
                      {p.montant.toLocaleString()}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statutInfo.couleur}`}
                      >
                        {statutInfo.emoji} {statutInfo.label}
                      </span>
                      {formuleInfo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {formuleInfo.emoji} {formuleInfo.label}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {formaterDate(p.created_at)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-2">
                      {/* Parent */}
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="text-[10px] text-blue-300 font-black uppercase mb-1">
                          👨‍👩‍👧 PARENT
                        </div>
                        <div className="font-bold text-white text-sm">
                          {p.parent_nom}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📧 {p.parent_email}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📞 {p.parent_tel}
                        </div>
                      </div>

                      {/* Prof */}
                      {p.prof_nom !== '—' && (
                        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                          <div className="text-[10px] text-emerald-300 font-black uppercase mb-1">
                            👨‍🏫 PROF
                          </div>
                          <div className="font-bold text-white text-sm">
                            {p.prof_nom}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            📧 {p.prof_email}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Méthode + Ref */}
                    <div className="flex flex-wrap gap-2">
                      {p.methode && (
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full font-bold">
                          💳 {p.methode}
                        </span>
                      )}
                      {p.reference && (
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full font-bold">
                          🔖 {p.reference}
                        </span>
                      )}
                      {p.capture_url && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                          📸 Capture fournie
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(p)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 border border-white/20"
                    >
                      👁️ Détails
                    </button>

                    {p.statut === 'en_attente' && (
                      <>
                        <button
                          onClick={() => validerPaiement(p)}
                          disabled={action}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
                        >
                          ✅ Valider
                        </button>
                        <button
                          onClick={() => {
                            setDecision(p)
                            setTypeAction('refuser')
                            setMotifRefus('')
                          }}
                          className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl font-bold text-xs border border-red-500/30 hover:bg-red-500/30"
                        >
                          ❌ Refuser
                        </button>
                      </>
                    )}

                    {p.statut === 'valide' && (
                      <button
                        onClick={() => {
                          setDecision(p)
                          setTypeAction('rembourser')
                          setMotifRefus('')
                        }}
                        className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl font-bold text-xs border border-purple-500/30 hover:bg-purple-500/30"
                      >
                        💸 Rembourser
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {detail && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    💰 Détail du paiement
                  </h2>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Montant */}
                <div className="text-center py-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl border border-amber-500/30">
                  <div className="text-4xl font-black text-white">
                    {detail.montant.toLocaleString()}
                  </div>
                  <div className="text-sm text-amber-200 font-black mt-1">
                    DJF
                  </div>
                </div>

                {/* Parent */}
                <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-xs font-black text-blue-300 mb-2">
                    👨‍👩‍👧 PARENT
                  </div>
                  <div className="text-white font-bold mb-1">
                    {detail.parent_nom}
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div>📧 {detail.parent_email}</div>
                    <div>📞 {detail.parent_tel}</div>
                    <div>💬 {detail.parent_whatsapp}</div>
                  </div>
                  {detail.parent_whatsapp !== '—' && (
                    <a
                      href={`https://wa.me/${detail.parent_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      💬 WhatsApp parent
                    </a>
                  )}
                </div>

                {/* Détails */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">
                    📋 DÉTAILS
                  </div>
                  <div className="text-xs text-slate-300 space-y-2">
                    {detail.formule && (
                      <div>
                        <strong className="text-white">Formule :</strong>{' '}
                        {labelsFormule[detail.formule]?.label ||
                          detail.formule}
                      </div>
                    )}
                    {detail.methode && (
                      <div>
                        <strong className="text-white">Méthode :</strong>{' '}
                        {detail.methode}
                      </div>
                    )}
                    {detail.reference && (
                      <div>
                        <strong className="text-white">Référence :</strong>{' '}
                        {detail.reference}
                      </div>
                    )}
                    <div>
                      <strong className="text-white">Date :</strong>{' '}
                      {formaterDate(detail.created_at)}
                    </div>
                  </div>
                </div>

                {/* Capture */}
                {detail.capture_url && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-xs font-black text-white mb-3">
                      📸 CAPTURE DU PAIEMENT
                    </div>
                    <a
                      href={detail.capture_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-slate-900 rounded-xl p-6 text-center hover:bg-slate-950"
                    >
                      <div className="text-4xl mb-2">📄</div>
                      <div className="text-xs text-blue-400 font-bold">
                        👁️ Ouvrir la capture
                      </div>
                    </a>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 flex flex-wrap gap-3">
                <button
                  onClick={() => setDetail(null)}
                  className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20"
                >
                  Fermer
                </button>
                {detail.statut === 'en_attente' && (
                  <>
                    <button
                      onClick={() => {
                        setDecision(detail)
                        setDetail(null)
                        setTypeAction('refuser')
                      }}
                      className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700"
                    >
                      ❌ Refuser
                    </button>
                    <button
                      onClick={() => validerPaiement(detail)}
                      disabled={action}
                      className="flex-1 min-w-[120px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-50"
                    >
                      {action ? '⏳...' : '✅ Valider'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DÉCISION */}
      <AnimatePresence>
        {decision && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div
                className={`p-6 ${
                  typeAction === 'refuser'
                    ? 'bg-gradient-to-r from-red-600 to-red-700'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {typeAction === 'refuser'
                        ? '❌ Refuser le paiement'
                        : '💸 Rembourser'}
                    </h2>
                    <p className="text-xs text-white/80 mt-1">
                      {decision.parent_nom} ·{' '}
                      {decision.montant.toLocaleString()} DJF
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDecision(null)
                      setMotifRefus('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    {typeAction === 'refuser'
                      ? 'Motif du refus *'
                      : 'Motif du remboursement *'}
                  </label>
                  <textarea
                    value={motifRefus}
                    onChange={(e) => setMotifRefus(e.target.value)}
                    rows={4}
                    placeholder={
                      typeAction === 'refuser'
                        ? 'Ex : Montant incorrect, capture illisible...'
                        : 'Ex : Cours annulés, insatisfaction...'
                    }
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white text-sm outline-none focus:border-red-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDecision(null)
                      setMotifRefus('')
                    }}
                    disabled={action}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={
                      typeAction === 'refuser'
                        ? () => refuserPaiement(decision)
                        : () => rembourserPaiement(decision)
                    }
                    disabled={action}
                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${
                      typeAction === 'refuser'
                        ? 'bg-gradient-to-r from-red-600 to-red-700'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700'
                    }`}
                  >
                    {action
                      ? '⏳...'
                      : typeAction === 'refuser'
                      ? '❌ Refuser'
                      : '💸 Rembourser'}
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