'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Prof = {
  id: string
  nom_complet: string
  email: string
  telephone: string
  whatsapp: string
  quartier: string
  bio: string
  photo_url: string | null
  approuve: boolean
  banni: boolean
  motif_bannissement: string | null
  created_at: string
  experience_annees: number
  a_bac_s: boolean
  bac_s_scan_url: string | null
  carte_identite_url: string | null
  photo_profil_url: string | null
  est_etudiant: boolean
  statut_universitaire: string | null
  domaine_etude: string | null
  niveau_etude: string | null
  universite: string | null
  carte_etudiante_url: string | null
  zone_enseignement: string | null
  prix_min: number | null
  prix_max: number | null
  matieres: string[]
  langues: string[]
}

type Onglet = 'en_attente' | 'approuves' | 'refuses' | 'bannis'

export default function AdminProfs() {
  const supabase = createClient()

  const [onglet, setOnglet] = useState<Onglet>('en_attente')
  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  // Modal détail
  const [profDetaille, setProfDetaille] = useState<Prof | null>(null)

  // Modal décision
  const [profDecision, setProfDecision] = useState<Prof | null>(null)
  const [motifRefus, setMotifRefus] = useState('')
  const [motifBan, setMotifBan] = useState('')
  const [action, setAction] = useState(false)

  useEffect(() => {
    charger()
  }, [onglet])

  const charger = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select(
          `
          id, nom_complet, email, telephone, whatsapp, quartier, bio, photo_url,
          approuve, banni, motif_bannissement, created_at,
          professeurs:professeurs!inner (
            experience_annees, a_bac_s, bac_s_scan_url, carte_identite_url,
            photo_profil_url, est_etudiant, statut_universitaire, domaine_etude,
            niveau_etude, universite, carte_etudiante_url, zone_enseignement,
            prix_min, prix_max
          )
        `
        )
        .eq('role', 'professeur')

      if (onglet === 'en_attente') {
        query = query.eq('approuve', false).eq('banni', false)
      } else if (onglet === 'approuves') {
        query = query.eq('approuve', true).eq('banni', false)
      } else if (onglet === 'refuses') {
        query = query.eq('approuve', false).eq('banni', false)
      } else if (onglet === 'bannis') {
        query = query.eq('banni', true)
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      })

      if (error) throw error

      const profsComplets: Prof[] = []

      for (const p of data || []) {
        const info = Array.isArray(p.professeurs)
          ? p.professeurs[0]
          : p.professeurs

        const [matieresRes, languesRes] = await Promise.all([
          supabase
            .from('matieres_par_prof')
            .select('matiere')
            .eq('professeur_id', p.id),
          supabase
            .from('langues_par_prof')
            .select('langue')
            .eq('professeur_id', p.id),
        ])

        profsComplets.push({
          id: p.id,
          nom_complet: p.nom_complet,
          email: p.email,
          telephone: p.telephone,
          whatsapp: p.whatsapp,
          quartier: p.quartier,
          bio: p.bio,
          photo_url: p.photo_url,
          approuve: p.approuve,
          banni: p.banni,
          motif_bannissement: p.motif_bannissement,
          created_at: p.created_at,
          experience_annees: info?.experience_annees || 0,
          a_bac_s: info?.a_bac_s || false,
          bac_s_scan_url: info?.bac_s_scan_url || null,
          carte_identite_url: info?.carte_identite_url || null,
          photo_profil_url: info?.photo_profil_url || null,
          est_etudiant: info?.est_etudiant || false,
          statut_universitaire: info?.statut_universitaire || null,
          domaine_etude: info?.domaine_etude || null,
          niveau_etude: info?.niveau_etude || null,
          universite: info?.universite || null,
          carte_etudiante_url: info?.carte_etudiante_url || null,
          zone_enseignement: info?.zone_enseignement || null,
          prix_min: info?.prix_min || null,
          prix_max: info?.prix_max || null,
          matieres: (matieresRes.data || []).map((m) => m.matiere),
          langues: (languesRes.data || []).map((l) => l.langue),
        })
      }

      setProfs(profsComplets)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const approuver = async (prof: Prof) => {
    if (!confirm(`Approuver le profil de ${prof.nom_complet} ?`)) return

    setAction(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approuve: true })
        .eq('id', prof.id)

      if (error) throw error

      // Notifier le prof
      await supabase.from('notifications').insert({
        destinataire_id: prof.id,
        titre: '✅ Profil approuvé',
        contenu:
          'Félicitations ! Votre profil a été approuvé. Vous apparaissez maintenant dans les recherches.',
        lien: '/espace-professeur',
        lu: false,
      })

      await charger()
      setProfDetaille(null)
      alert('✅ Prof approuvé avec succès !')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const refuser = async (prof: Prof) => {
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer un motif de refus')
      return
    }

    setAction(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approuve: false,
          motif_bannissement: `REFUS: ${motifRefus}`,
        })
        .eq('id', prof.id)

      if (error) throw error

      // Notifier le prof
      await supabase.from('notifications').insert({
        destinataire_id: prof.id,
        titre: '❌ Demande refusée',
        contenu: `Votre demande n'a pas été acceptée. Motif : ${motifRefus}`,
        lien: '/espace-professeur/documents',
        lu: false,
      })

      await charger()
      setProfDecision(null)
      setMotifRefus('')
      alert('❌ Prof refusé')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const bannir = async (prof: Prof) => {
    if (!motifBan.trim()) {
      alert('Veuillez indiquer un motif de bannissement')
      return
    }

    if (!confirm(`⚠️ BANNIR définitivement ${prof.nom_complet} ?`)) return

    setAction(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          banni: true,
          approuve: false,
          motif_bannissement: motifBan.trim(),
        })
        .eq('id', prof.id)

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'bannir_prof',
        details: `${prof.nom_complet} (${prof.email}) - Motif: ${motifBan}`,
      })

      await charger()
      setProfDecision(null)
      setMotifBan('')
      alert('🚫 Prof banni')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const debannir = async (prof: Prof) => {
    if (!confirm(`Débannir ${prof.nom_complet} ?`)) return

    setAction(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          banni: false,
          motif_bannissement: null,
        })
        .eq('id', prof.id)

      if (error) throw error

      await charger()
      alert('✅ Prof débanni')
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setAction(false)
    }
  }

  const profsFiltres = recherche
    ? profs.filter(
        (p) =>
          p.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
          p.email.toLowerCase().includes(recherche.toLowerCase()) ||
          p.quartier?.toLowerCase().includes(recherche.toLowerCase())
      )
    : profs

  const formaterDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const labelsZones: { [k: string]: string } = {
    chez_moi: '🏠 Chez moi',
    chez_eleve: "🚶 Chez l'élève",
    les_deux: '🔄 Les deux',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white"
      >
        <h1 className="text-3xl font-black mb-2">✅ Validation des profs</h1>
        <p className="text-emerald-100 text-sm">
          Approuvez, refusez ou bannissez les professeurs
        </p>
      </motion.div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: 'en_attente', label: '⏳ En attente', emoji: '⏳' },
          { val: 'approuves', label: '✅ Approuvés', emoji: '✅' },
          { val: 'refuses', label: '❌ Refusés', emoji: '❌' },
          { val: 'bannis', label: '🚫 Bannis', emoji: '🚫' },
        ].map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val as Onglet)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          🔍
        </span>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, email ou quartier..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
      </div>

      {/* Liste profs */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      ) : profsFiltres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-xl text-center"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-black text-white text-xl mb-2">
            Aucun prof dans cette catégorie
          </h3>
          <p className="text-slate-400 text-sm">
            {onglet === 'en_attente'
              ? 'Aucun prof en attente de validation.'
              : 'Aucun prof dans cette section.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {profsFiltres.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start gap-4 flex-wrap">
                {/* Photo */}
                <div className="relative flex-shrink-0">
                  {p.photo_profil_url || p.photo_url ? (
                    <img
                      src={p.photo_profil_url || p.photo_url || ''}
                      alt={p.nom_complet}
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">
                      👨‍🏫
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-black text-white text-lg">
                      {p.nom_complet}
                    </h3>
                    {p.approuve && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black border border-emerald-500/30">
                        ✓ APPROUVÉ
                      </span>
                    )}
                    {p.banni && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-black border border-red-500/30">
                        🚫 BANNI
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>📧 {p.email}</div>
                    <div>📞 {p.telephone} · 💬 {p.whatsapp}</div>
                    <div>📍 {p.quartier}</div>
                    <div>📅 Inscrit le {formaterDate(p.created_at)}</div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.a_bac_s && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black border border-amber-500/30">
                        🎓 Bac S
                      </span>
                    )}
                    {p.est_etudiant && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-black border border-purple-500/30">
                        🎓 {p.niveau_etude} {p.domaine_etude}
                      </span>
                    )}
                    {p.experience_annees > 0 && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-black border border-blue-500/30">
                        🎯 {p.experience_annees} ans
                      </span>
                    )}
                  </div>
                </div>

                {/* Prix (admin uniquement) */}
                {p.prix_min && p.prix_max && (
                  <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30">
                    <div className="text-[9px] text-amber-300 font-black uppercase mb-1">
                      🔒 PRIX (PRIVÉ)
                    </div>
                    <div className="text-white font-black text-sm">
                      {Number(p.prix_min).toLocaleString()} -{' '}
                      {Number(p.prix_max).toLocaleString()} DJF
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setProfDetaille(p)}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition-colors border border-white/20"
                  >
                    👁️ Voir détails
                  </button>

                  {!p.approuve && !p.banni && (
                    <button
                      onClick={() => setProfDecision(p)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all"
                    >
                      ✅ Décider
                    </button>
                  )}

                  {p.banni && (
                    <button
                      onClick={() => debannir(p)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors"
                    >
                      🔓 Débannir
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-xs hover:bg-green-600 transition-colors text-center"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>

              {p.motif_bannissement && (
                <div className="mt-4 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-xl">
                  <div className="text-[10px] text-red-300 font-black uppercase mb-1">
                    MOTIF
                  </div>
                  <div className="text-xs text-red-100">
                    {p.motif_bannissement}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      <AnimatePresence>
        {profDetaille && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl my-8 border border-white/10"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-700 p-6 rounded-t-3xl sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      📁 Dossier de {profDetaille.nom_complet}
                    </h2>
                    <p className="text-xs text-purple-200 mt-1">
                      Vérifiez tous les documents avant de décider
                    </p>
                  </div>
                  <button
                    onClick={() => setProfDetaille(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Infos générales */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-sm font-black text-white mb-4">
                    👤 Informations
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Nom :</span>{' '}
                      <span className="text-white font-bold">
                        {profDetaille.nom_complet}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email :</span>{' '}
                      <span className="text-white">
                        {profDetaille.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Téléphone :</span>{' '}
                      <span className="text-white">
                        {profDetaille.telephone}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">WhatsApp :</span>{' '}
                      <span className="text-white">
                        {profDetaille.whatsapp}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Quartier :</span>{' '}
                      <span className="text-white">
                        {profDetaille.quartier}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Expérience :</span>{' '}
                      <span className="text-white">
                        {profDetaille.experience_annees} ans
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Zone :</span>{' '}
                      <span className="text-white">
                        {labelsZones[profDetaille.zone_enseignement || ''] ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Prix privés :</span>{' '}
                      <span className="text-amber-300 font-black">
                        {profDetaille.prix_min &&
                        profDetaille.prix_max
                          ? `${Number(profDetaille.prix_min).toLocaleString()} - ${Number(profDetaille.prix_max).toLocaleString()} DJF`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profDetaille.bio && (
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-sm font-black text-white mb-3">
                      📝 Bio
                    </div>
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                      « {profDetaille.bio} »
                    </p>
                  </div>
                )}

                {/* Universitaire */}
                {profDetaille.est_etudiant && (
                  <div className="bg-purple-500/10 rounded-2xl p-5 border border-purple-500/30">
                    <div className="text-sm font-black text-purple-300 mb-3">
                      🎓 Parcours universitaire
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400">Statut :</span>{' '}
                        <span className="text-white">
                          {profDetaille.statut_universitaire}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Niveau :</span>{' '}
                        <span className="text-white">
                          {profDetaille.niveau_etude}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Domaine :</span>{' '}
                        <span className="text-white">
                          {profDetaille.domaine_etude}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Université :</span>{' '}
                        <span className="text-white">
                          {profDetaille.universite}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Matières */}
                {profDetaille.matieres.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-sm font-black text-white mb-3">
                      📚 Matières enseignées
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profDetaille.matieres.map((m) => (
                        <span
                          key={m}
                          className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold border border-emerald-500/30"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Langues */}
                {profDetaille.langues.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-sm font-black text-white mb-3">
                      💬 Langues parlées
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profDetaille.langues.map((l) => (
                        <span
                          key={l}
                          className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-bold capitalize border border-blue-500/30"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-sm font-black text-white mb-4">
                    📎 Documents fournis
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Bac S */}
                    <div
                      className={`rounded-2xl p-4 border-2 ${
                        profDetaille.bac_s_scan_url
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : profDetaille.a_bac_s
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-black text-white">
                          🎓 Diplôme Bac S
                        </div>
                        {profDetaille.bac_s_scan_url ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                            ✓ FOURNI
                          </span>
                        ) : profDetaille.a_bac_s ? (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black">
                            ⚠️ MANQUANT
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-black">
                            NON REQUIS
                          </span>
                        )}
                      </div>
                      {profDetaille.bac_s_scan_url ? (
                        <a
                          href={profDetaille.bac_s_scan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-slate-900 rounded-xl p-6 text-center hover:bg-slate-950 transition-colors"
                        >
                          <div className="text-4xl mb-2">📄</div>
                          <div className="text-xs text-blue-400 font-bold">
                            👁️ Ouvrir le document
                          </div>
                        </a>
                      ) : (
                        <div className="text-xs text-slate-500 italic text-center py-4">
                          Document non fourni
                        </div>
                      )}
                    </div>

                    {/* Carte identité */}
                    <div
                      className={`rounded-2xl p-4 border-2 ${
                        profDetaille.carte_identite_url
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-black text-white">
                          🆔 Carte d'identité
                        </div>
                        {profDetaille.carte_identite_url ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                            ✓ FOURNI
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-black">
                            FACULTATIF
                          </span>
                        )}
                      </div>
                      {profDetaille.carte_identite_url ? (
                        <a
                          href={profDetaille.carte_identite_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-slate-900 rounded-xl p-6 text-center hover:bg-slate-950 transition-colors"
                        >
                          <div className="text-4xl mb-2">🆔</div>
                          <div className="text-xs text-blue-400 font-bold">
                            👁️ Ouvrir le document
                          </div>
                        </a>
                      ) : (
                        <div className="text-xs text-slate-500 italic text-center py-4">
                          Document non fourni
                        </div>
                      )}
                    </div>

                    {/* Carte étudiante */}
                    {profDetaille.est_etudiant && (
                      <div
                        className={`rounded-2xl p-4 border-2 ${
                          profDetaille.carte_etudiante_url
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-black text-white">
                            🎓 Carte étudiante
                          </div>
                          {profDetaille.carte_etudiante_url ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                              ✓ FOURNI
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black">
                              ⚠️ MANQUANT
                            </span>
                          )}
                        </div>
                        {profDetaille.carte_etudiante_url ? (
                          <a
                            href={profDetaille.carte_etudiante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-slate-900 rounded-xl p-6 text-center hover:bg-slate-950 transition-colors"
                          >
                            <div className="text-4xl mb-2">📸</div>
                            <div className="text-xs text-blue-400 font-bold">
                              👁️ Ouvrir le document
                            </div>
                          </a>
                        ) : (
                          <div className="text-xs text-slate-500 italic text-center py-4">
                            Document non fourni
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photo */}
                    <div
                      className={`rounded-2xl p-4 border-2 ${
                        profDetaille.photo_profil_url || profDetaille.photo_url
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-black text-white">
                          📸 Photo de profil
                        </div>
                        {profDetaille.photo_profil_url ||
                        profDetaille.photo_url ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                            ✓ FOURNI
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-black">
                            FACULTATIF
                          </span>
                        )}
                      </div>
                      {profDetaille.photo_profil_url ||
                      profDetaille.photo_url ? (
                        <img
                          src={
                            profDetaille.photo_profil_url ||
                            profDetaille.photo_url ||
                            ''
                          }
                          alt="Photo"
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="text-xs text-slate-500 italic text-center py-4">
                          Photo non fournie
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Note interne */}
                <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/30">
                  <div className="text-xs text-blue-300 font-black mb-2">
                    💡 Rappel
                  </div>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    Vérifiez que tous les documents obligatoires sont fournis
                    et lisibles avant d'approuver. Le Bac S est obligatoire
                    pour les matières scientifiques.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 flex flex-wrap gap-3">
                <button
                  onClick={() => setProfDetaille(null)}
                  className="flex-1 min-w-[150px] py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                >
                  Fermer
                </button>
                {!profDetaille.approuve && !profDetaille.banni && (
                  <>
                    <button
                      onClick={() => {
                        setProfDetaille(null)
                        setProfDecision(profDetaille)
                      }}
                      className="flex-1 min-w-[150px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-600 shadow-lg hover:shadow-xl transition-all"
                    >
                      ❌ Refuser
                    </button>
                    <button
                      onClick={() => approuver(profDetaille)}
                      disabled={action}
                      className="flex-1 min-w-[150px] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {action ? '⏳...' : '✅ Approuver'}
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
        {profDecision && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">
                    Décision — {profDecision.nom_complet}
                  </h2>
                  <button
                    onClick={() => {
                      setProfDecision(null)
                      setMotifRefus('')
                      setMotifBan('')
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Approuver */}
                <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-black text-white text-sm">
                        Approuver le profil
                      </div>
                      <div className="text-xs text-emerald-200">
                        Le prof apparaîtra dans les recherches et pourra
                        recevoir des demandes.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => approuver(profDecision)}
                    disabled={action}
                    className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-50"
                  >
                    {action ? '⏳...' : '✅ Approuver ce prof'}
                  </button>
                </div>

                {/* Refuser */}
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <div className="font-black text-white text-sm">
                        Refuser (avec motif)
                      </div>
                      <div className="text-xs text-red-200">
                        Le prof sera informé du motif.
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={motifRefus}
                    onChange={(e) => setMotifRefus(e.target.value)}
                    rows={3}
                    placeholder="Ex : Diplôme Bac S illisible, veuillez re-uploader..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-red-500/30 rounded-xl text-white text-sm outline-none focus:border-red-500 resize-none"
                  />
                  <button
                    onClick={() => refuser(profDecision)}
                    disabled={action}
                    className="w-full py-3 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 shadow-lg disabled:opacity-50"
                  >
                    {action ? '⏳...' : '❌ Refuser'}
                  </button>
                </div>

                {/* Bannir */}
                <div className="bg-slate-900/50 border-2 border-slate-700 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">🚫</span>
                    <div>
                      <div className="font-black text-white text-sm">
                        Bannir définitivement
                      </div>
                      <div className="text-xs text-slate-400">
                        Action irréversible. Le prof ne pourra plus se
                        connecter.
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={motifBan}
                    onChange={(e) => setMotifBan(e.target.value)}
                    rows={2}
                    placeholder="Motif du bannissement..."
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white text-sm outline-none focus:border-red-500 resize-none"
                  />
                  <button
                    onClick={() => bannir(profDecision)}
                    disabled={action}
                    className="w-full py-3 mt-2 rounded-xl font-bold text-red-300 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {action ? '⏳...' : '🚫 Bannir'}
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