'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Annonce = {
  id: string
  titre: string
  message: string
  type: string
  position: string
  couleur: string
  couleur_texte: string
  texte_bouton: string | null
  lien_bouton: string | null
  audience: string
  comportement: string
  push_actif: boolean
  variante_a: string | null
  variante_b: string | null
  active: boolean
  date_debut: string | null
  date_fin: string | null
  vues: number
  clics: number
  created_at: string
}

type Onglet = 'toutes' | 'actives' | 'inactives' | 'programmees' | 'terminees' | 'ab_test' | 'top'
type FiltreType = 'tous' | 'info' | 'promo' | 'alerte' | 'urgent'
type FiltrePosition = 'toutes' | 'haut' | 'bas' | 'popup' | 'slide_in' | 'corner'
type Apercu = 'mobile' | 'desktop'

const typesConfig: {
  [k: string]: { label: string; emoji: string; couleur: string }
} = {
  info: { label: 'Information', emoji: '💡', couleur: 'from-blue-500 to-blue-600' },
  promo: { label: 'Promotion', emoji: '🎉', couleur: 'from-amber-500 to-orange-600' },
  alerte: { label: 'Alerte', emoji: '⚠️', couleur: 'from-red-500 to-red-600' },
  urgent: { label: 'Urgent', emoji: '🚨', couleur: 'from-red-600 to-pink-600' },
}

const positionsConfig: {
  [k: string]: { label: string; emoji: string; description: string }
} = {
  haut: { label: 'Bannière haut', emoji: '⬆️', description: 'En haut de chaque page' },
  bas: { label: 'Bannière bas', emoji: '⬇️', description: 'En bas de chaque page' },
  popup: { label: 'Popup central', emoji: '💬', description: 'Au centre de l\'écran' },
  slide_in: { label: 'Slide-in', emoji: '➡️', description: 'Glisse depuis le côté' },
  corner: { label: 'Coin bas-droit', emoji: '📌', description: 'Notification coin' },
}

const audiencesConfig: { [k: string]: string } = {
  tous: '🌍 Tout le monde',
  parents: '👨‍👩‍👧 Parents uniquement',
  profs: '👨‍🏫 Profs uniquement',
  nouveaux: '🆕 Nouveaux (7 jours)',
  actifs: '🔥 Utilisateurs actifs',
  inactifs: '💤 Inactifs (30 jours)',
}

const comportementsConfig: { [k: string]: string } = {
  tous: '👁️ Tout le monde',
  non_connectes: '🚪 Non connectés',
  connectes: '✅ Connectés',
  premiere_visite: '🎯 Première visite',
}

const templates = [
  { type: 'info', titre: '🎉 Bienvenue !', message: 'Découvrez notre plateforme et trouvez le prof idéal pour vos enfants.', texte_bouton: 'Commencer' },
  { type: 'promo', titre: '💰 -20% ce mois-ci', message: 'Profitez de notre offre exceptionnelle sur tous les profs Premium.', texte_bouton: 'Voir les profs' },
  { type: 'info', titre: '📚 Nouveaux profs disponibles', message: 'Plus de 50 nouveaux professeurs ont rejoint la plateforme cette semaine !', texte_bouton: 'Découvrir' },
  { type: 'promo', titre: '⭐ 50 premiers gratuits', message: 'Les 50 premiers profs inscrits sont gratuits à vie !', texte_bouton: 'Devenir prof' },
  { type: 'alerte', titre: '⚠️ Maintenance prévue', message: 'Une maintenance est prévue dimanche de 2h à 4h du matin.', texte_bouton: '' },
  { type: 'promo', titre: '🎁 Parrainez un ami', message: 'Invitez un ami et gagnez 1 mois gratuit sur votre abonnement.', texte_bouton: 'Inviter' },
  { type: 'info', titre: '🏅 Badges disponibles', message: 'Les profs peuvent maintenant obtenir des badges de vérification !', texte_bouton: 'En savoir plus' },
  { type: 'promo', titre: '🎓 Cours de Coran', message: 'Nouveaux professeurs de Coran disponibles à Djibouti.', texte_bouton: 'Voir les profs' },
  { type: 'promo', titre: '🚀 Lancement plateforme', message: 'Bienvenue sur Prof À Domicile Djibouti ! Inscriptions ouvertes.', texte_bouton: 'S\'inscrire' },
  { type: 'urgent', titre: '⚡ Offre expire bientôt', message: 'Dernière chance ! L\'offre se termine dans 24 heures.', texte_bouton: 'Profiter' },
]

export default function AdminAnnonces() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Onglet>('toutes')
  const [filtreType, setFiltreType] = useState<FiltreType>('tous')
  const [filtrePosition, setFiltrePosition] = useState<FiltrePosition>('toutes')
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  const [modal, setModal] = useState<Annonce | null>(null)
  const [modeEdition, setModeEdition] = useState(false)
  const [action, setAction] = useState(false)
  const [modalTemplates, setModalTemplates] = useState(false)
  const [apercuType, setApercuType] = useState<Apercu>('desktop')

  const [form, setForm] = useState({
    titre: '',
    message: '',
    type: 'info',
    position: 'haut',
    couleur: 'from-blue-500 to-blue-600',
    couleur_texte: '#FFFFFF',
    texte_bouton: '',
    lien_bouton: '',
    audience: 'tous',
    comportement: 'tous',
    push_actif: false,
    variante_a: '',
    variante_b: '',
    active: true,
    date_debut: '',
    date_fin: '',
  })

  useEffect(() => {
    charger()
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      charger()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const charger = async () => {
    try {
      const { data, error } = await supabase
        .from('annonces')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.message.includes('does not exist')) {
          setAnnonces([])
        } else {
          throw error
        }
      } else {
        setAnnonces(
          (data || []).map((a) => ({
            ...a,
            couleur_texte: a.couleur_texte || '#FFFFFF',
            audience: a.audience || 'tous',
            comportement: a.comportement || 'tous',
            push_actif: a.push_actif || false,
          }))
        )
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Suggestions intelligentes
  const suggestions = useMemo(() => {
    const heure = new Date().getHours()
    const jour = new Date().getDay()
    const suggestions: { titre: string; message: string; type: string }[] = []

    if (heure >= 6 && heure < 12) {
      suggestions.push({
        titre: '🌅 Bonjour Djibouti',
        message: 'Commencez la journée en trouvant le prof idéal pour vos enfants !',
        type: 'info',
      })
    } else if (heure >= 12 && heure < 18) {
      suggestions.push({
        titre: '☀️ Cours de l\'après-midi',
        message: 'Des profs disponibles dès maintenant pour des cours à domicile.',
        type: 'promo',
      })
    } else {
      suggestions.push({
        titre: '🌙 Cours du soir',
        message: 'Réservez votre prof pour les cours du soir avant 21h.',
        type: 'info',
      })
    }

    if (jour === 5 || jour === 6) {
      suggestions.push({
        titre: '🎉 Weekend spécial',
        message: 'Cours du week-end disponibles ! Réservez maintenant.',
        type: 'promo',
      })
    }

    return suggestions
  }, [])

  const ouvrirCreation = () => {
    setForm({
      titre: '',
      message: '',
      type: 'info',
      position: 'haut',
      couleur: 'from-blue-500 to-blue-600',
      couleur_texte: '#FFFFFF',
      texte_bouton: '',
      lien_bouton: '',
      audience: 'tous',
      comportement: 'tous',
      push_actif: false,
      variante_a: '',
      variante_b: '',
      active: true,
      date_debut: '',
      date_fin: '',
    })
    setModeEdition(false)
    setModal({
      id: '', titre: '', message: '', type: '', position: '', couleur: '',
      couleur_texte: '#FFFFFF', texte_bouton: null, lien_bouton: null,
      audience: 'tous', comportement: 'tous', push_actif: false,
      variante_a: null, variante_b: null, active: true,
      date_debut: null, date_fin: null, vues: 0, clics: 0, created_at: '',
    })
  }

  const ouvrirEdition = (a: Annonce) => {
    setForm({
      titre: a.titre,
      message: a.message,
      type: a.type,
      position: a.position,
      couleur: a.couleur,
      couleur_texte: a.couleur_texte,
      texte_bouton: a.texte_bouton || '',
      lien_bouton: a.lien_bouton || '',
      audience: a.audience,
      comportement: a.comportement,
      push_actif: a.push_actif,
      variante_a: a.variante_a || '',
      variante_b: a.variante_b || '',
      active: a.active,
      date_debut: a.date_debut ? a.date_debut.slice(0, 16) : '',
      date_fin: a.date_fin ? a.date_fin.slice(0, 16) : '',
    })
    setModeEdition(true)
    setModal(a)
  }

  // ⚡ CORRECTION : Template → Ouvre le modal de création
  const appliquerTemplate = (t: (typeof templates)[0]) => {
    setModalTemplates(false)

    setForm({
      titre: t.titre,
      message: t.message,
      type: t.type,
      position: 'haut',
      couleur: typesConfig[t.type]?.couleur || 'from-blue-500 to-blue-600',
      couleur_texte: '#FFFFFF',
      texte_bouton: t.texte_bouton || '',
      lien_bouton: '',
      audience: 'tous',
      comportement: 'tous',
      push_actif: false,
      variante_a: '',
      variante_b: '',
      active: true,
      date_debut: '',
      date_fin: '',
    })

    setModeEdition(false)
    setModal({
      id: '', titre: '', message: '', type: '', position: '', couleur: '',
      couleur_texte: '#FFFFFF', texte_bouton: null, lien_bouton: null,
      audience: 'tous', comportement: 'tous', push_actif: false,
      variante_a: null, variante_b: null, active: true,
      date_debut: null, date_fin: null, vues: 0, clics: 0, created_at: '',
    })
  }

  const appliquerSuggestion = (s: { titre: string; message: string; type: string }) => {
    setForm({
      ...form,
      titre: s.titre,
      message: s.message,
      type: s.type,
      couleur: typesConfig[s.type]?.couleur || form.couleur,
    })
  }

  const enregistrer = async () => {
    if (!form.titre.trim() || !form.message.trim()) {
      alert('Titre et message obligatoires')
      return
    }

    setAction(true)
    try {
      const data: any = {
        titre: form.titre.trim(),
        message: form.message.trim(),
        type: form.type,
        position: form.position,
        couleur: form.couleur,
        couleur_texte: form.couleur_texte,
        texte_bouton: form.texte_bouton.trim() || null,
        lien_bouton: form.lien_bouton.trim() || null,
        audience: form.audience,
        comportement: form.comportement,
        push_actif: form.push_actif,
        variante_a: form.variante_a.trim() || null,
        variante_b: form.variante_b.trim() || null,
        active: form.active,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
      }

      if (modeEdition && modal) {
        await supabase.from('annonces').update(data).eq('id', modal.id)
      } else {
        await supabase.from('annonces').insert(data)
      }

      await supabase.from('admin_logs').insert({
        action: modeEdition ? 'modifier_annonce' : 'creer_annonce',
        details: form.titre,
      })

      await charger()
      setModal(null)
      alert(modeEdition ? '✅ Annonce modifiée' : '✅ Annonce créée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const toggleActive = async (a: Annonce) => {
    setAction(true)
    try {
      await supabase.from('annonces').update({ active: !a.active }).eq('id', a.id)
      await supabase.from('admin_logs').insert({
        action: 'toggle_annonce',
        details: `${a.titre} → ${!a.active ? 'Activée' : 'Désactivée'}`,
      })
      await charger()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const supprimer = async (a: Annonce) => {
    if (!confirm(`⚠️ SUPPRIMER "${a.titre}" ?`)) return
    setAction(true)
    try {
      await supabase.from('annonces').delete().eq('id', a.id)
      await supabase.from('admin_logs').insert({
        action: 'supprimer_annonce',
        details: a.titre,
      })
      await charger()
      alert('🗑️ Annonce supprimée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const dupliquer = async (a: Annonce) => {
    setAction(true)
    try {
      await supabase.from('annonces').insert({
        titre: `${a.titre} (copie)`,
        message: a.message,
        type: a.type,
        position: a.position,
        couleur: a.couleur,
        couleur_texte: a.couleur_texte,
        texte_bouton: a.texte_bouton,
        lien_bouton: a.lien_bouton,
        audience: a.audience,
        comportement: a.comportement,
        push_actif: a.push_actif,
        variante_a: a.variante_a,
        variante_b: a.variante_b,
        active: false,
        date_debut: null,
        date_fin: null,
      })
      await charger()
      alert('✅ Annonce dupliquée')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const exporterCSV = () => {
    const headers = ['Titre', 'Type', 'Position', 'Audience', 'Active', 'Vues', 'Clics', 'Taux', 'Date création']
    const rows = annoncesFiltrees.map((a) => [
      a.titre, a.type, a.position, a.audience, a.active, a.vues, a.clics,
      a.vues > 0 ? Math.round((a.clics / a.vues) * 100) + '%' : '0%',
      a.created_at,
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `annonces-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Classement des meilleures annonces
  const meilleuresAnnonces = useMemo(() => {
    return [...annonces]
      .filter((a) => a.vues > 10)
      .sort((a, b) => {
        const tauxA = a.vues > 0 ? a.clics / a.vues : 0
        const tauxB = b.vues > 0 ? b.clics / b.vues : 0
        return tauxB - tauxA
      })
      .slice(0, 3)
  }, [annonces])

  // Alertes intelligentes
  const alertes = useMemo(() => {
    const alerts: { type: 'success' | 'warning'; message: string }[] = []

    annonces.forEach((a) => {
      if (!a.active) return
      const taux = a.vues > 0 ? (a.clics / a.vues) * 100 : 0

      if (a.vues > 100 && taux < 2) {
        alerts.push({
          type: 'warning',
          message: `"${a.titre}" a un faible taux de clics (${taux.toFixed(1)}%). Essaie un nouveau titre.`,
        })
      }

      if (a.vues > 100 && taux > 10) {
        alerts.push({
          type: 'success',
          message: `"${a.titre}" performe super bien (${taux.toFixed(1)}% de clics) !`,
        })
      }
    })

    return alerts.slice(0, 3)
  }, [annonces])

  const annoncesFiltrees = useMemo(() => {
    return annonces.filter((a) => {
      if (onglet === 'actives' && !a.active) return false
      if (onglet === 'inactives' && a.active) return false
      if (onglet === 'programmees' && (!a.date_debut || !a.date_fin)) return false
      if (onglet === 'terminees' && a.active) return false
      if (onglet === 'ab_test' && !a.variante_a && !a.variante_b) return false
      if (onglet === 'top' && a.vues < 10) return false
      if (filtreType !== 'tous' && a.type !== filtreType) return false
      if (filtrePosition !== 'toutes' && a.position !== filtrePosition) return false

      if (recherche) {
        const r = recherche.toLowerCase()
        return a.titre.toLowerCase().includes(r) || a.message.toLowerCase().includes(r)
      }
      return true
    })
  }, [annonces, onglet, filtreType, filtrePosition, recherche])

  const compte = (statut: string) => {
    if (statut === 'toutes') return annonces.length
    if (statut === 'actives') return annonces.filter((a) => a.active).length
    if (statut === 'inactives') return annonces.filter((a) => !a.active).length
    if (statut === 'programmees') return annonces.filter((a) => a.date_debut && a.date_fin).length
    if (statut === 'terminees') return annonces.filter((a) => !a.active).length
    if (statut === 'ab_test') return annonces.filter((a) => a.variante_a || a.variante_b).length
    if (statut === 'top') return annonces.filter((a) => a.vues >= 10).length
    return 0
  }

  const formaterDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const gradients = [
    'from-blue-500 to-blue-600',
    'from-red-500 to-red-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-slate-500 to-slate-700',
    'from-cyan-500 to-blue-600',
    'from-yellow-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-cyan-600',
    'from-fuchsia-500 to-pink-600',
  ]

  const couleurTexte = ['#FFFFFF', '#000000', '#FEF3C7', '#DBEAFE', '#DCFCE7']

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black mb-2">📰 Annonces Pro</h1>
              <p className="text-pink-100 text-sm">
                Bannières intelligentes, A/B testing, analytics temps réel
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setModalTemplates(true)}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all text-sm"
              >
                📚 Templates
              </button>
              <button
                onClick={exporterCSV}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all text-sm"
              >
                📤 Export
              </button>
              <button
                onClick={ouvrirCreation}
                className="px-6 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all"
              >
                ➕ Nouvelle annonce
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Total</div>
              <div className="text-xl font-black">{compte('toutes')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Actives</div>
              <div className="text-xl font-black">{compte('actives')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Programmées</div>
              <div className="text-xl font-black">{compte('programmees')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">A/B Tests</div>
              <div className="text-xl font-black">{compte('ab_test')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-[10px] font-black uppercase text-pink-200">Vues totales</div>
              <div className="text-xl font-black">
                {annonces.reduce((acc, a) => acc + (a.vues || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Suggestions intelligentes */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-l-4 border-cyan-500 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-cyan-200 mb-3">
                Suggestions intelligentes
              </p>
              <div className="grid md:grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => appliquerSuggestion(s)}
                    className="bg-white/5 hover:bg-white/10 rounded-xl p-3 text-left transition-colors border border-cyan-500/20"
                  >
                    <div className="font-bold text-white text-sm mb-1">{s.titre}</div>
                    <div className="text-xs text-slate-400">{s.message}</div>
                    <div className="text-[10px] text-cyan-300 font-bold mt-2">→ Cliquer pour utiliser</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Alertes */}
      {alertes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {alertes.map((a, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 border-l-4 ${
                a.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500'
                  : 'bg-amber-500/10 border-amber-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  {a.type === 'success' ? '🎉' : '⚠️'}
                </span>
                <p className={`text-sm font-medium ${a.type === 'success' ? 'text-emerald-200' : 'text-amber-200'}`}>
                  {a.message}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Top annonces */}
      {meilleuresAnnonces.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏆</span>
            <h3 className="text-sm font-black text-amber-200">
              TOP 3 — Meilleures annonces
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {meilleuresAnnonces.map((a, i) => {
              const taux = a.vues > 0 ? Math.round((a.clics / a.vues) * 100) : 0
              return (
                <div
                  key={a.id}
                  className="bg-white/5 rounded-xl p-3 border border-amber-500/20"
                >
                  <div className="text-[10px] text-amber-300 font-black mb-1">
                    #{i + 1}
                  </div>
                  <div className="text-xs font-bold text-white mb-1 truncate">{a.titre}</div>
                  <div className="text-lg font-black text-amber-300">{taux}%</div>
                  <div className="text-[10px] text-slate-500">
                    {a.clics} clics / {a.vues} vues
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Onglets */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { val: 'toutes', label: '📋 Toutes', count: compte('toutes') },
            { val: 'actives', label: '✅ Actives', count: compte('actives') },
            { val: 'inactives', label: '⏸️ Inactives', count: compte('inactives') },
            { val: 'programmees', label: '📅 Programmées', count: compte('programmees') },
            { val: 'ab_test', label: '🔬 A/B Tests', count: compte('ab_test') },
            { val: 'top', label: '🏆 Top', count: compte('top') },
          ].map((o) => (
            <button
              key={o.val}
              onClick={() => setOnglet(o.val as Onglet)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                onglet === o.val
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              {o.label} ({o.count})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value as FiltreType)}
            className="px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm outline-none"
          >
            <option value="tous">Tous les types</option>
            <option value="info">💡 Info</option>
            <option value="promo">🎉 Promo</option>
            <option value="alerte">⚠️ Alerte</option>
            <option value="urgent">🚨 Urgent</option>
          </select>

          <select
            value={filtrePosition}
            onChange={(e) => setFiltrePosition(e.target.value as FiltrePosition)}
            className="px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm outline-none"
          >
            <option value="toutes">Toutes positions</option>
            <option value="haut">⬆️ Haut</option>
            <option value="bas">⬇️ Bas</option>
            <option value="popup">💬 Popup</option>
            <option value="slide_in">➡️ Slide-in</option>
            <option value="corner">📌 Coin</option>
          </select>

          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-800/70 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
          />
        </div>
      ) : annoncesFiltrees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="text-6xl mb-4">📰</div>
          <h3 className="font-black text-white text-xl mb-2">Aucune annonce</h3>
          <p className="text-slate-400 text-sm mb-4">
            Crée ta première annonce pour animer ton site public.
          </p>
          <button
            onClick={ouvrirCreation}
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg"
          >
            ➕ Créer une annonce
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {annoncesFiltrees.map((a, i) => {
            const typeInfo = typesConfig[a.type] || typesConfig.info
            const posInfo = positionsConfig[a.position] || positionsConfig.haut
            const taux = a.vues > 0 ? Math.round((a.clics / a.vues) * 100) : 0

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`backdrop-blur-xl rounded-2xl p-5 border transition-all ${
                  a.active ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-800/70 border-white/10'
                }`}
              >
                <div
                  className={`bg-gradient-to-r ${a.couleur} rounded-xl p-3 mb-4`}
                  style={{ color: a.couleur_texte }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeInfo.emoji}</span>
                    <div className="flex-1">
                      <div className="font-black text-sm">{a.titre}</div>
                      <div className="text-xs opacity-90">{a.message}</div>
                    </div>
                    {a.texte_bouton && (
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold">
                        {a.texte_bouton}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex flex-wrap gap-2 flex-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        a.active ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {a.active ? '✅ ACTIVE' : '⏸️ INACTIVE'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {typeInfo.emoji} {typeInfo.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {posInfo.emoji} {posInfo.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {audiencesConfig[a.audience] || a.audience}
                    </span>
                    {a.push_actif && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        🔔 PUSH
                      </span>
                    )}
                    {(a.variante_a || a.variante_b) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        🔬 A/B TEST
                      </span>
                    )}
                    {taux > 10 && a.vues > 50 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500 text-white animate-pulse">
                        🏆 TOP PERF
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="bg-white/5 rounded-xl px-3 py-2 text-center">
                      <div className="text-[9px] text-slate-500 font-black">VUES</div>
                      <div className="text-sm font-black text-white">{a.vues}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl px-3 py-2 text-center">
                      <div className="text-[9px] text-slate-500 font-black">CLICS</div>
                      <div className="text-sm font-black text-white">{a.clics}</div>
                    </div>
                    {a.vues > 0 && (
                      <div className="bg-white/5 rounded-xl px-3 py-2 text-center">
                        <div className="text-[9px] text-slate-500 font-black">TAUX</div>
                        <div className={`text-sm font-black ${taux > 5 ? 'text-emerald-300' : taux > 2 ? 'text-amber-300' : 'text-red-300'}`}>
                          {taux}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleActive(a)}
                      disabled={action}
                      className={`px-3 py-2 rounded-xl font-bold text-xs ${
                        a.active
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      } disabled:opacity-50`}
                    >
                      {a.active ? '⏸️ Désactiver' : '▶️ Activer'}
                    </button>
                    <button
                      onClick={() => ouvrirEdition(a)}
                      className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-xl font-bold text-xs border border-blue-500/30"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => dupliquer(a)}
                      disabled={action}
                      className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-xl font-bold text-xs border border-purple-500/30 disabled:opacity-50"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => supprimer(a)}
                      disabled={action}
                      className="px-3 py-2 bg-red-500/20 text-red-300 rounded-xl font-bold text-xs border border-red-500/30 disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* MODAL TEMPLATES */}
      <AnimatePresence>
        {modalTemplates && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl my-8 border border-white/10 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-white">
                    📚 Bibliothèque de modèles
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Clique sur un modèle pour créer une annonce
                  </p>
                </div>
                <button
                  onClick={() => setModalTemplates(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {templates.map((t, i) => {
                  const info = typesConfig[t.type]
                  return (
                    <button
                      key={i}
                      onClick={() => appliquerTemplate(t)}
                      className={`bg-gradient-to-br ${info.couleur} rounded-xl p-4 text-left text-white hover:scale-[1.02] transition-transform`}
                    >
                      <div className="text-2xl mb-2">{info.emoji}</div>
                      <div className="font-black text-sm mb-1">{t.titre}</div>
                      <div className="text-xs opacity-90">{t.message}</div>
                      {t.texte_bouton && (
                        <div className="mt-2 inline-block bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold">
                          {t.texte_bouton}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ÉDITION */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-6 rounded-t-3xl sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-white">
                    {modeEdition ? '✏️ Modifier' : '➕ Créer'} une annonce
                  </h2>
                  <button
                    onClick={() => setModal(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    📝 Titre *
                  </label>
                  <input
                    type="text"
                    value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-pink-500 font-medium"
                  />
                  <p className="text-xs text-slate-500 mt-1">{form.titre.length}/100</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    💬 Message *
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-pink-500 font-medium resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">{form.message.length}/200</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    🎨 Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(typesConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, type: key, couleur: config.couleur })}
                        className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                          form.type === key
                            ? `bg-gradient-to-r ${config.couleur} text-white`
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {config.emoji} {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    📍 Position
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(positionsConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, position: key })}
                        className={`py-2.5 rounded-xl font-bold text-[10px] transition-all ${
                          form.position === key
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                        title={config.description}
                      >
                        {config.emoji} {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    🎨 Couleur de fond
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {gradients.map((g) => (
                      <button
                        key={g}
                        onClick={() => setForm({ ...form, couleur: g })}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g} ${
                          form.couleur === g ? 'ring-4 ring-white scale-110' : ''
                        } transition-all`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    🎨 Couleur du texte
                  </label>
                  <div className="flex gap-2">
                    {couleurTexte.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, couleur_texte: c })}
                        className={`w-12 h-12 rounded-xl border-2 ${
                          form.couleur_texte === c ? 'ring-4 ring-white scale-110' : 'border-slate-700'
                        } transition-all`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    👥 Audience
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(audiencesConfig).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, audience: key })}
                        className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                          form.audience === key
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    🎯 Comportement
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(comportementsConfig).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, comportement: key })}
                        className={`py-2.5 rounded-xl font-bold text-[10px] transition-all ${
                          form.comportement === key
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      🔘 Texte bouton (opt)
                    </label>
                    <input
                      type="text"
                      value={form.texte_bouton}
                      onChange={(e) => setForm({ ...form, texte_bouton: e.target.value })}
                      maxLength={30}
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-pink-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      🔗 Lien bouton (opt)
                    </label>
                    <input
                      type="text"
                      value={form.lien_bouton}
                      onChange={(e) => setForm({ ...form, lien_bouton: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-pink-500 font-medium"
                    />
                  </div>
                </div>

                <div className="bg-cyan-500/10 rounded-2xl p-4 border border-cyan-500/30">
                  <div className="text-sm font-black text-cyan-300 mb-3">
                    🔬 A/B Testing (optionnel)
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Variante A
                      </label>
                      <textarea
                        value={form.variante_a}
                        onChange={(e) => setForm({ ...form, variante_a: e.target.value })}
                        rows={2}
                        maxLength={200}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Variante B
                      </label>
                      <textarea
                        value={form.variante_b}
                        onChange={(e) => setForm({ ...form, variante_b: e.target.value })}
                        rows={2}
                        maxLength={200}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      📅 Début (opt)
                    </label>
                    <input
                      type="datetime-local"
                      value={form.date_debut}
                      onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-pink-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      📅 Fin (opt)
                    </label>
                    <input
                      type="datetime-local"
                      value={form.date_fin}
                      onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-pink-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-5 h-5 accent-emerald-500"
                    />
                    <span className="text-sm font-bold text-emerald-200">
                      ✅ Activer immédiatement
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                    <input
                      type="checkbox"
                      checked={form.push_actif}
                      onChange={(e) => setForm({ ...form, push_actif: e.target.checked })}
                      className="w-5 h-5 accent-pink-500"
                    />
                    <span className="text-sm font-bold text-pink-200">
                      🔔 Envoyer notification push
                    </span>
                  </label>
                </div>

                {form.titre && form.message && (
                  <div>
                    <div className="text-xs text-slate-500 font-black uppercase mb-2">
                      👁️ Aperçu
                    </div>
                    <div className="flex justify-center mb-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setApercuType('mobile')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            apercuType === 'mobile'
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          📱 Mobile
                        </button>
                        <button
                          onClick={() => setApercuType('desktop')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            apercuType === 'desktop'
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          💻 Desktop
                        </button>
                      </div>
                    </div>

                    <div className={apercuType === 'mobile' ? 'max-w-xs mx-auto' : ''}>
                      <div
                        className={`bg-gradient-to-r ${form.couleur} rounded-xl p-3 shadow-2xl`}
                        style={{ color: form.couleur_texte }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{typesConfig[form.type]?.emoji}</span>
                          <div className="flex-1">
                            <div className="font-black text-sm">{form.titre}</div>
                            <div className="text-xs opacity-90">{form.message}</div>
                          </div>
                          {form.texte_bouton && (
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold">
                              {form.texte_bouton}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setModal(null)}
                  disabled={action}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={enregistrer}
                  disabled={action}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-700 shadow-lg disabled:opacity-50"
                >
                  {action ? '⏳...' : modeEdition ? '💾 Enregistrer' : '✅ Créer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}