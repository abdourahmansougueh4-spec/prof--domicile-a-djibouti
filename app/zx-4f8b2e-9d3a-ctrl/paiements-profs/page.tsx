'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type ProfPaiement = {
  id: string
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string | null
  approuve: boolean
  created_at: string
  est_etudiant: boolean
  statut_universitaire: string | null
  experience_annees: number
  fraisMensuels: number
  moisInscrit: number
  totalDu: number
  totalPaye: number
  solde: number
  statutPaiement: 'a_jour' | 'en_retard' | 'jamais_paye'
  paiements: Paiement[]
}

type Paiement = {
  id: string
  montant: number
  formule: string | null
  statut: string
  created_at: string
}

type Filtre = 'tous' | 'a_jour' | 'en_retard' | 'jamais_paye' | 'etudiants'
type Tri = 'retard' | 'recent' | 'ancien' | 'nom_az' | 'montant_du'

// ============================================================
// CONFIG
// ============================================================

const FRAIS_DEFAUT = {
  tuteur: 1000,
  etudiant: 500,
  enseignant: 1500,
}

const statutsConfig: {
  [k: string]: { label: string; emoji: string; couleur: string; bg: string }
} = {
  a_jour: {
    label: 'À jour',
    emoji: '✅',
    couleur: 'text-emerald-300',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
  },
  en_retard: {
    label: 'En retard',
    emoji: '⏰',
    couleur: 'text-amber-300',
    bg: 'bg-amber-500/20 border-amber-500/30',
  },
  jamais_paye: {
    label: 'Jamais payé',
    emoji: '❌',
    couleur: 'text-red-300',
    bg: 'bg-red-500/20 border-red-500/30',
  },
}

// ============================================================
// COMPOSANT
// ============================================================

export default function AdminPaiementsProfs() {
  const supabase = createClient()

  const [profs, setProfs] = useState<ProfPaiement[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<Tri>('retard')
  const [recherche, setRecherche] = useState('')
  const [action, setAction] = useState(false)
  const [succes, setSucces] = useState('')
  const [detail, setDetail] = useState<ProfPaiement | null>(null)
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
        .from('profiles')
        .select(`
          id, nom_complet, email, telephone, whatsapp, quartier,
          approuve, banni, created_at,
          professeurs:professeurs!inner (
            est_etudiant, statut_universitaire, experience_annees
          )
        `)
        .eq('role', 'professeur')
        .eq('banni', false)
        .eq('approuve', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const complets: ProfPaiement[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.professeurs) ? p.professeurs[0] : p.professeurs

        // Récupérer tous les paiements de ce prof
        const { data: paiementsData } = await supabase
          .from('paiements')
          .select('id, montant, formule, statut, created_at')
          .eq('professeur_id', p.id)
          .order('created_at', { ascending: false })

        const paiements: Paiement[] = (paiementsData || []).map((pa) => ({
          id: pa.id,
          montant: Number(pa.montant) || 0,
          formule: pa.formule || null,
          statut: pa.statut || 'en_attente',
          created_at: pa.created_at,
        }))

        // Calcul frais mensuels selon statut
        let fraisMensuels = FRAIS_DEFAUT.tuteur
        if (info?.est_etudiant) fraisMensuels = FRAIS_DEFAUT.etudiant
        else if (
          info?.statut_universitaire === 'enseignant' ||
          info?.statut_universitaire === 'professeur_officiel'
        ) {
          fraisMensuels = FRAIS_DEFAUT.enseignant
        }

        // Calcul nombre de mois depuis l'inscription
        const dateInscription = new Date(p.created_at)
        const maintenant = new Date()
        const moisInscrit = Math.max(
          1,
          (maintenant.getFullYear() - dateInscription.getFullYear()) * 12 +
            (maintenant.getMonth() - dateInscription.getMonth()) + 1
        )

        // Total dû
        const totalDu = moisInscrit * fraisMensuels

        // Total payé (uniquement les paiements validés)
        const totalPaye = paiements
          .filter((pa) => pa.statut === 'valide')
          .reduce((acc, pa) => acc + pa.montant, 0)

        // Solde (négatif = en retard, positif = avance)
        const solde = totalPaye - totalDu

        // Statut de paiement
        let statutPaiement: 'a_jour' | 'en_retard' | 'jamais_paye'
        if (totalPaye === 0) statutPaiement = 'jamais_paye'
        else if (solde >= 0) statutPaiement = 'a_jour'
        else statutPaiement = 'en_retard'

        complets.push({
          id: p.id,
          nom_complet: p.nom_complet || 'Sans nom',
          email: p.email || '—',
          telephone: p.telephone || '—',
          whatsapp: p.whatsapp || '—',
          quartier: p.quartier,
          approuve: p.approuve === true,
          created_at: p.created_at,
          est_etudiant: info?.est_etudiant === true,
          statut_universitaire: info?.statut_universitaire || null,
          experience_annees: info?.experience_annees || 0,
          fraisMensuels,
          moisInscrit,
          totalDu,
          totalPaye,
          solde,
          statutPaiement,
          paiements,
        })
      }

      setProfs(complets)
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

  const marquerPaye = async (p: ProfPaiement, montant: number) => {
    if (!confirm(`✅ Marquer un paiement de ${montant.toLocaleString()} DJF pour ${p.nom_complet} ?`)) return

    setAction(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('paiements').insert({
        professeur_id: p.id,
        montant,
        formule: 'prof_mensuel',
        methode: 'especes',
        statut: 'valide',
        valide_par: user?.id,
      })

      // Notifier le prof
      await supabase.from('notifications').insert({
        destinataire_id: p.id,
        titre: '💰 Paiement reçu',
        contenu: `Nous avons bien reçu votre paiement de ${montant.toLocaleString()} DJF. Merci !`,
        lu: false,
      })

      await supabase.from('admin_logs').insert({
        action: 'valider_paiement_prof',
        details: `${p.nom_complet} → ${montant.toLocaleString()} DJF`,
      })

      setSucces(`✅ Paiement enregistré pour ${p.nom_complet}`)
      setTimeout(() => setSucces(''), 4000)
      setDetail(null)
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const envoyerRappel = (p: ProfPaiement) => {
    const message = encodeURIComponent(
      `Bonjour ${p.nom_complet},\n\n` +
      `Rappel : vos frais de plateforme s'élèvent à ${p.fraisMensuels.toLocaleString()} DJF/mois.\n` +
      `Total dû : ${p.totalDu.toLocaleString()} DJF\n` +
      `Total payé : ${p.totalPaye.toLocaleString()} DJF\n` +
      `Solde : ${p.solde.toLocaleString()} DJF\n\n` +
      `Merci de régulariser votre situation.\n\nProf À Domicile Djibouti`
    )

    if (p.whatsapp && p.whatsapp !== '—') {
      window.open(`https://wa.me/${p.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank')
    } else if (p.telephone && p.telephone !== '—') {
      window.open(`https://wa.me/${p.telephone.replace(/\D/g, '')}?text=${message}`, '_blank')
    } else {
      alert('Pas de WhatsApp disponible pour ce prof')
    }
  }

  // ============================================================
  // FILTRES + TRI
  // ============================================================

  const profsFiltres = useMemo(() => {
    let resultat = profs.filter((p) => {
      if (filtre === 'a_jour' && p.statutPaiement !== 'a_jour') return false
      if (filtre === 'en_retard' && p.statutPaiement !== 'en_retard') return false
      if (filtre === 'jamais_paye' && p.statutPaiement !== 'jamais_paye') return false
      if (filtre === 'etudiants' && !p.est_etudiant) return false

      if (recherche.trim()) {
        const r = recherche.toLowerCase().trim()
        return (
          p.nom_complet.toLowerCase().includes(r) ||
          p.email.toLowerCase().includes(r) ||
          p.quartier?.toLowerCase().includes(r) ||
          p.telephone.includes(r)
        )
      }
      return true
    })

    if (tri === 'retard') {
      resultat.sort((a, b) => {
        // Priorité aux retards
        const ordre = { en_retard: 0, jamais_paye: 1, a_jour: 2 }
        if (ordre[a.statutPaiement] !== ordre[b.statutPaiement]) {
          return ordre[a.statutPaiement] - ordre[b.statutPaiement]
        }
        // Puis par montant dû décroissant
        return b.totalDu - a.totalDu
      })
    }
    if (tri === 'recent') resultat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (tri === 'ancien') resultat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (tri === 'nom_az') resultat.sort((a, b) => a.nom_complet.localeCompare(b.nom_complet))
    if (tri === 'montant_du') resultat.sort((a, b) => b.totalDu - a.totalDu)

    return resultat
  }, [profs, filtre, recherche, tri])

  // ============================================================
  // COMPTEURS
  // ============================================================

  const compte = useCallback(
    (f: Filtre) => {
      if (f === 'tous') return profs.length
      if (f === 'a_jour') return profs.filter((p) => p.statutPaiement === 'a_jour').length
      if (f === 'en_retard') return profs.filter((p) => p.statutPaiement === 'en_retard').length
      if (f === 'jamais_paye') return profs.filter((p) => p.statutPaiement === 'jamais_paye').length
      if (f === 'etudiants') return profs.filter((p) => p.est_etudiant).length
      return 0
    },
    [profs]
  )

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const totalDu = profs.reduce((acc, p) => acc + p.totalDu, 0)
    const totalPaye = profs.reduce((acc, p) => acc + p.totalPaye, 0)
    const totalImpaye = Math.max(0, totalDu - totalPaye)
    const enRetard = profs.filter((p) => p.statutPaiement === 'en_retard').length
    const jamaisPaye = profs.filter((p) => p.statutPaiement === 'jamais_paye').length
    return { totalDu, totalPaye, totalImpaye, enRetard, jamaisPaye }
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
        'Nom', 'Email', 'Téléphone', 'WhatsApp', 'Quartier',
        'Étudiant', 'Frais mensuels', 'Mois inscrit', 'Total dû',
        'Total payé', 'Solde', 'Statut', 'Nb paiements', 'Inscrit le',
      ]
      const rows = profsFiltres.map((p) => [
        p.nom_complet, p.email, p.telephone, p.whatsapp, p.quartier || '',
        p.est_etudiant ? 'Oui' : 'Non',
        p.fraisMensuels, p.moisInscrit, p.totalDu, p.totalPaye, p.solde,
        statutsConfig[p.statutPaiement].label,
        p.paiements.length,
        new Date(p.created_at).toLocaleDateString('fr-FR'),
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `paiements-profs-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)

      await supabase.from('admin_logs').insert({
        action: 'export_donnees',
        details: `Export paiements profs : ${profsFiltres.length}`,
      })

      setSucces(`✅ ${profsFiltres.length} profs exportés`)
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

  const formaterPrix = (n: number) => n.toLocaleString('fr-FR')

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
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
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
                <h1 className="text-3xl font-black">💵 Frais des professeurs</h1>
                {(stats.enRetard + stats.jamaisPaye) > 0 && (
                  <span className="flex items-center gap-1 bg-amber-500/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black border border-amber-300/50">
                    ⚠️ {stats.enRetard + stats.jamaisPaye} à relancer
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-sm">
                {profs.length} prof{profs.length > 1 ? 's' : ''} actifs · Frais mensuels de plateforme ·
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
                disabled={exportEnCours || profsFiltres.length === 0}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all text-sm disabled:opacity-50"
              >
                {exportEnCours ? '⏳...' : '📤 Export CSV'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Total dû</div>
              <div className="text-lg font-black">{formaterPrix(stats.totalDu)} DJF</div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-300/40">
              <div className="text-[10px] font-black uppercase text-emerald-100">Total payé</div>
              <div className="text-lg font-black">{formaterPrix(stats.totalPaye)} DJF</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-300/40">
              <div className="text-[10px] font-black uppercase text-red-100">Impayé</div>
              <div className="text-lg font-black">{formaterPrix(stats.totalImpaye)} DJF</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-emerald-200">Taux recouvrement</div>
              <div className="text-lg font-black">
                {stats.totalDu > 0 ? Math.round((stats.totalPaye / stats.totalDu) * 100) : 0}%
              </div>
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
      <div className="bg-emerald-500/10 border-l-4 border-emerald-500 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-bold text-emerald-200 mb-1">
              Frais mensuels de plateforme
            </p>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Les profs paient <strong>1000 DJF/mois</strong> (tuteur), <strong>500 DJF/mois</strong> (étudiant),
              ou <strong>1500 DJF/mois</strong> (enseignant officiel). Le montant est calculé automatiquement
              depuis leur inscription. <strong>Relance-les via WhatsApp</strong> s'ils sont en retard.
            </p>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { val: 'tous', label: '👥 Tous' },
            { val: 'en_retard', label: '⏰ En retard' },
            { val: 'jamais_paye', label: '❌ Jamais payé' },
            { val: 'a_jour', label: '✅ À jour' },
            { val: 'etudiants', label: '🎓 Étudiants' },
          ] as { val: Filtre; label: string }[]
        ).map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              filtre === f.val
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg'
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
            placeholder="Rechercher par nom, email, téléphone ou quartier..."
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
          <option value="retard">⏰ Retards d'abord</option>
          <option value="montant_du">💰 Montant dû décroissant</option>
          <option value="recent">📅 Plus récent</option>
          <option value="ancien">📅 Plus ancien</option>
          <option value="nom_az">🔤 Nom A→Z</option>
        </select>
      </div>

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-400 text-sm">Chargement des paiements...</p>
        </div>
      ) : profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="font-black text-white text-xl mb-2">
            {profs.length === 0 ? 'Aucun prof actif' : 'Aucun résultat'}
          </h3>
          <p className="text-slate-400 text-sm">
            {profs.length === 0 ? 'Aucun professeur approuvé pour le moment.' : 'Aucun prof ne correspond à ces critères.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {profsFiltres.map((p, i) => {
            const statut = statutsConfig[p.statutPaiement]
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  p.statutPaiement === 'en_retard'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : p.statutPaiement === 'jamais_paye'
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-emerald-500/5 border-emerald-500/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0 ${
                    p.statutPaiement === 'en_retard'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : p.statutPaiement === 'jamais_paye'
                      ? 'bg-gradient-to-br from-red-500 to-rose-600'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {statut.emoji}
                  </div>

                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <div className="font-black text-white text-base">{p.nom_complet}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${statut.bg} ${statut.couleur}`}>
                        {statut.emoji} {statut.label}
                      </span>
                      {p.est_etudiant && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                          🎓 Étudiant
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                      <div>📧 {p.email}</div>
                      <div>📞 {p.telephone} · 💬 {p.whatsapp}</div>
                      {p.quartier && <div>📍 {p.quartier}</div>}
                      <div>📅 Inscrit le {formaterDate(p.created_at)} · {p.moisInscrit} mois</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[9px] text-slate-500 font-black">FRAIS/MOIS</div>
                        <div className="text-xs font-black text-white">{formaterPrix(p.fraisMensuels)}</div>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-2 text-center border border-blue-500/20">
                        <div className="text-[9px] text-blue-300 font-black">TOTAL DÛ</div>
                        <div className="text-xs font-black text-blue-200">{formaterPrix(p.totalDu)}</div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
                        <div className="text-[9px] text-emerald-300 font-black">PAYÉ</div>
                        <div className="text-xs font-black text-emerald-200">{formaterPrix(p.totalPaye)}</div>
                      </div>
                      <div className={`rounded-lg p-2 text-center border ${
                        p.solde >= 0
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}>
                        <div className={`text-[9px] font-black ${p.solde >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                          {p.solde >= 0 ? 'AVANCE' : 'RETARD'}
                        </div>
                        <div className={`text-xs font-black ${p.solde >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                          {formaterPrix(Math.abs(p.solde))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(p)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      👁️ Détails
                    </button>
                    {p.statutPaiement !== 'a_jour' && (
                      <>
                        <button
                          onClick={() => marquerPaye(p, p.fraisMensuels)}
                          disabled={action}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
                        >
                          {action ? '⏳...' : '💰 +1 mois'}
                        </button>
                        <button
                          onClick={() => envoyerRappel(p)}
                          className="px-4 py-2 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 transition-colors"
                        >
                          💬 Rappel
                        </button>
                      </>
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
          {profsFiltres.length} prof{profsFiltres.length > 1 ? 's' : ''} affiché{profsFiltres.length > 1 ? 's' : ''}
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
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-white/10 my-8"
            >
              <div className={`p-6 rounded-t-3xl bg-gradient-to-r ${
                detail.statutPaiement === 'en_retard'
                  ? 'from-amber-600 to-orange-700'
                  : detail.statutPaiement === 'jamais_paye'
                  ? 'from-red-600 to-rose-700'
                  : 'from-emerald-600 to-teal-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">{detail.nom_complet}</h2>
                    <p className="text-xs text-white/80 mt-1">
                      {statutsConfig[detail.statutPaiement].emoji} {statutsConfig[detail.statutPaiement].label}
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
                {/* Résumé financier */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30 text-center">
                    <div className="text-[10px] text-blue-300 font-black">TOTAL DÛ</div>
                    <div className="text-lg font-black text-white">{formaterPrix(detail.totalDu)}</div>
                    <div className="text-[9px] text-slate-400">{detail.moisInscrit} mois × {formaterPrix(detail.fraisMensuels)}</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/30 text-center">
                    <div className="text-[10px] text-emerald-300 font-black">PAYÉ</div>
                    <div className="text-lg font-black text-white">{formaterPrix(detail.totalPaye)}</div>
                    <div className="text-[9px] text-slate-400">{detail.paiements.length} paiement(s)</div>
                  </div>
                  <div className={`rounded-xl p-3 border text-center ${
                    detail.solde >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className={`text-[10px] font-black ${detail.solde >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {detail.solde >= 0 ? 'AVANCE' : 'RETARD'}
                    </div>
                    <div className="text-lg font-black text-white">{formaterPrix(Math.abs(detail.solde))}</div>
                  </div>
                </div>

                {/* Infos prof */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">👨‍🏫 Informations</div>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div><strong className="text-white">Email :</strong> {detail.email}</div>
                    <div><strong className="text-white">Téléphone :</strong> {detail.telephone}</div>
                    <div><strong className="text-white">WhatsApp :</strong> {detail.whatsapp}</div>
                    <div><strong className="text-white">Quartier :</strong> {detail.quartier || '—'}</div>
                    <div><strong className="text-white">Inscrit le :</strong> {formaterDate(detail.created_at)}</div>
                    <div><strong className="text-white">Expérience :</strong> {detail.experience_annees} an{detail.experience_annees > 1 ? 's' : ''}</div>
                    {detail.est_etudiant && (
                      <div className="md:col-span-2"><strong className="text-purple-300">🎓 Étudiant</strong> · {detail.statut_universitaire || '—'}</div>
                    )}
                  </div>
                </div>

                {/* Historique paiements */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-black text-white mb-3">
                    📜 Historique des paiements ({detail.paiements.length})
                  </div>
                  {detail.paiements.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      Aucun paiement enregistré
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detail.paiements.map((pa) => (
                        <div
                          key={pa.id}
                          className="flex items-center justify-between bg-slate-900 rounded-lg p-2.5 border border-white/5"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              💰 {formaterPrix(pa.montant)} DJF
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {formaterDate(pa.created_at)} · {pa.formule || 'prof_mensuel'}
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            pa.statut === 'valide'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : pa.statut === 'refuse'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {pa.statut}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => marquerPaye(detail, detail.fraisMensuels)}
                    disabled={action}
                    className="py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
                  >
                    {action ? '⏳...' : `💰 Marquer 1 mois payé (${formaterPrix(detail.fraisMensuels)} DJF)`}
                  </button>
                  <button
                    onClick={() => envoyerRappel(detail)}
                    className="py-3 bg-green-500/20 text-green-300 rounded-xl font-bold text-xs border border-green-500/30 hover:bg-green-500/30 transition-colors"
                  >
                    💬 Rappel WhatsApp
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