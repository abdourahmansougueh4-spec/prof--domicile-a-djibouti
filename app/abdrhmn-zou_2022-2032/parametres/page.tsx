'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Parametres = {
  // Général
  nom_site: string
  slogan: string
  description_site: string
  email_admin: string
  whatsapp_admin: string
  telephone_admin: string
  adresse_admin: string
  numero_waafi: string

  // Apparence
  couleur_primaire: string
  couleur_secondaire: string
  couleur_accent: string
  logo_url: string
  favicon_url: string
  police: string

  // SEO
  meta_titre: string
  meta_description: string
  meta_mots_cles: string
  og_image: string
  google_analytics_id: string
  google_tag_manager_id: string

  // Langues & Devise
  langue_defaut: string
  langues_actives: string
  devise: string
  symbole_devise: string

  // Tarifs
  formule_simple_pourcentage: string
  formule_premium_pourcentage: string
  formule_premium_frais_fixe: string
  frais_pro_mensuel: string
  frais_pro_etudiant: string
  frais_pro_enseignant: string
  commission_pourcentage: string

  // Paiement
  paiement_waafi_actif: string
  paiement_especes_actif: string
  paiement_carte_actif: string
  delai_remboursement_jours: string

  // Limites
  min_seances_semaine: string
  max_profs_gratuits: string
  max_eleves_par_prof: string
  max_demandes_par_jour: string
  duree_session_minutes: string
  duree_session_max_jours: string

  // Badges
  critere_etoile_1_avis: string
  critere_etoile_2_mois: string
  critere_etoile_3_mois: string
  critere_etoile_3_note: string

  // Notifications
  notif_email_active: string
  notif_push_active: string
  notif_sms_active: string
  email_expediteur: string
  email_reply_to: string

  // Email SMTP
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_secure: string

  // Sécurité
  deux_fa_active: string
  duree_session_admin: string
  max_tentatives_connexion: string
  bloquer_apres_tentatives: string
  forcer_mot_de_passe_fort: string

  // Récompenses
  parrainage_actif: string
  parrainage_montant: string
  bonus_premier_cours: string
  reduction_pionnier: string

  // Maintenance
  mode_maintenance: string
  message_maintenance: string
  mode_production: string
  mode_debug: string

  // Backup
  backup_auto: string
  backup_frequence: string
  date_derniere_sauvegarde: string

  // Divers
  version_site: string
  date_lancement: string
}

const parametresDefaut: Parametres = {
  nom_site: 'Prof À Domicile Djibouti',
  slogan: 'Trouvez le professeur idéal pour vos enfants',
  description_site: 'Plateforme de mise en relation entre parents et professeurs à domicile à Djibouti',
  email_admin: 'contact@profadomicile.dj',
  whatsapp_admin: '+253 77 74 14 82',
  telephone_admin: '+253 77 74 14 82',
  adresse_admin: 'Djibouti, Djibouti',
  numero_waafi: '+253 77 74 14 82',

  couleur_primaire: '#3B82F6',
  couleur_secondaire: '#10B981',
  couleur_accent: '#F59E0B',
  logo_url: '',
  favicon_url: '',
  police: 'Inter',

  meta_titre: 'Prof À Domicile Djibouti — Trouvez le prof idéal',
  meta_description: 'Trouvez le professeur idéal pour vos enfants à Djibouti. Primaire, collège, lycée. Profs vérifiés.',
  meta_mots_cles: 'prof, professeur, domicile, Djibouti, cours, soutien scolaire',
  og_image: '',
  google_analytics_id: '',
  google_tag_manager_id: '',

  langue_defaut: 'fr',
  langues_actives: 'fr,ar,en',
  devise: 'DJF',
  symbole_devise: 'DJF',

  formule_simple_pourcentage: '30',
  formule_premium_pourcentage: '30',
  formule_premium_frais_fixe: '5000',
  frais_pro_mensuel: '1000',
  frais_pro_etudiant: '500',
  frais_pro_enseignant: '1500',
  commission_pourcentage: '0',

  paiement_waafi_actif: 'true',
  paiement_especes_actif: 'true',
  paiement_carte_actif: 'false',
  delai_remboursement_jours: '7',

  min_seances_semaine: '4',
  max_profs_gratuits: '50',
  max_eleves_par_prof: '5',
  max_demandes_par_jour: '10',
  duree_session_minutes: '60',
  duree_session_max_jours: '90',

  critere_etoile_1_avis: '5',
  critere_etoile_2_mois: '5',
  critere_etoile_3_mois: '12',
  critere_etoile_3_note: '4.5',

  notif_email_active: 'true',
  notif_push_active: 'true',
  notif_sms_active: 'false',
  email_expediteur: 'noreply@profadomicile.dj',
  email_reply_to: 'contact@profadomicile.dj',

  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_secure: 'true',

  deux_fa_active: 'false',
  duree_session_admin: '60',
  max_tentatives_connexion: '5',
  bloquer_apres_tentatives: '15',
  forcer_mot_de_passe_fort: 'true',

  parrainage_actif: 'true',
  parrainage_montant: '1000',
  bonus_premier_cours: '0',
  reduction_pionnier: '100',

  mode_maintenance: 'false',
  message_maintenance: 'La plateforme est en maintenance. Revenez bientôt !',
  mode_production: 'true',
  mode_debug: 'false',

  backup_auto: 'true',
  backup_frequence: 'quotidien',
  date_derniere_sauvegarde: '',

  version_site: '1.0.0',
  date_lancement: new Date().toISOString().slice(0, 10),
}

type Onglet =
  | 'general'
  | 'apparence'
  | 'seo'
  | 'langues'
  | 'tarifs'
  | 'paiement'
  | 'limites'
  | 'badges'
  | 'notifications'
  | 'securite'
  | 'recompenses'
  | 'maintenance'
  | 'backup'
  | 'legal'

export default function AdminParametres() {
  const supabase = createClient()

  const [params, setParams] = useState<Parametres>(parametresDefaut)
  const [loading, setLoading] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [modifie, setModifie] = useState(false)
  const [onglet, setOnglet] = useState<Onglet>('general')
  const [rechercheParam, setRechercheParam] = useState('')

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parametres_site')
        .select('*')

      if (!error && data) {
        const recuperes: any = { ...parametresDefaut }
        data.forEach((p: any) => {
          if (p.cle in recuperes) {
            recuperes[p.cle] = p.valeur
          }
        })
        setParams(recuperes)
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const modifierChamp = (champ: keyof Parametres, valeur: string) => {
    setParams({ ...params, [champ]: valeur })
    setModifie(true)
  }

  const enregistrer = async () => {
    setSauvegarde(true)
    setErreur('')

    try {
      const entrees = Object.entries(params).map(([cle, valeur]) => ({
        cle,
        valeur: String(valeur),
      }))

      for (const entree of entrees) {
        await supabase
          .from('parametres_site')
          .upsert(entree, { onConflict: 'cle' })
      }

      await supabase.from('parametres_site').upsert(
        {
          cle: 'date_derniere_sauvegarde',
          valeur: new Date().toISOString(),
        },
        { onConflict: 'cle' }
      )

      await supabase.from('admin_logs').insert({
        action: 'modifier_parametres',
        details: 'Paramètres mis à jour',
      })

      setParams({
        ...params,
        date_derniere_sauvegarde: new Date().toISOString(),
      })
      setModifie(false)
      setSucces('✅ Paramètres enregistrés avec succès')
      setTimeout(() => setSucces(''), 5000)
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setSauvegarde(false)
    }
  }

  const resetDefaut = async () => {
    if (!confirm('⚠️ Réinitialiser TOUS les paramètres aux valeurs par défaut ?')) return
    setParams(parametresDefaut)
    setModifie(true)
    setSucces('Paramètres réinitialisés. Clique sur Enregistrer pour confirmer.')
    setTimeout(() => setSucces(''), 5000)
  }

  const exporterParametres = () => {
    const json = JSON.stringify(params, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `parametres-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importerParametres = (fichier: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importe = JSON.parse(e.target?.result as string)
        setParams({ ...parametresDefaut, ...importe })
        setModifie(true)
        setSucces('✅ Paramètres importés. Clique sur Enregistrer.')
        setTimeout(() => setSucces(''), 5000)
      } catch (err) {
        alert('Fichier invalide')
      }
    }
    reader.readAsText(fichier)
  }

  const formaterDate = (date: string) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const Field = ({
    label,
    value,
    onChange,
    type = 'text',
    hint,
    placeholder,
    colSpan,
  }: any) => (
    <div className={colSpan ? `md:col-span-${colSpan}` : ''}>
      <label className="block text-sm font-bold text-slate-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 font-medium"
      />
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )

  const Textarea = ({ label, value, onChange, rows = 3, hint }: any) => (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 font-medium resize-none"
      />
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )

  const Toggle = ({ label, value, onChange, activeColor = 'emerald' }: any) => (
    <label className="flex items-center justify-between cursor-pointer p-4 bg-slate-900 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
      <span className="text-sm font-bold text-white">{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${
          value
            ? `bg-gradient-to-r from-${activeColor}-500 to-${activeColor}-600`
            : 'bg-slate-700'
        }`}
      >
        <motion.div
          animate={{ x: value ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-6 h-6 bg-white rounded-full shadow-md"
        />
      </div>
    </label>
  )

  const ongletsListe: { val: Onglet; label: string; emoji: string }[] = [
    { val: 'general', label: 'Général', emoji: '🌍' },
    { val: 'apparence', label: 'Apparence', emoji: '🎨' },
    { val: 'seo', label: 'SEO', emoji: '🔍' },
    { val: 'langues', label: 'Langues', emoji: '🌐' },
    { val: 'tarifs', label: 'Tarifs', emoji: '💰' },
    { val: 'paiement', label: 'Paiement', emoji: '💳' },
    { val: 'limites', label: 'Limites', emoji: '📊' },
    { val: 'badges', label: 'Badges', emoji: '🏅' },
    { val: 'notifications', label: 'Notifications', emoji: '📢' },
    { val: 'securite', label: 'Sécurité', emoji: '🔐' },
    { val: 'recompenses', label: 'Récompenses', emoji: '🎁' },
    { val: 'maintenance', label: 'Maintenance', emoji: '🔧' },
    { val: 'backup', label: 'Backup', emoji: '💾' },
    { val: 'legal', label: 'Légal', emoji: '📝' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-black mb-2">⚙️ Paramètres généraux</h1>
              <p className="text-slate-300 text-sm">
                Contrôle total de la plateforme · {ongletsListe.length} sections
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exporterParametres}
                className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm"
              >
                📤 Exporter
              </button>
              <label className="px-4 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm cursor-pointer">
                📥 Importer
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importerParametres(f)
                  }}
                  className="hidden"
                />
              </label>
              <button
                onClick={resetDefaut}
                className="px-4 py-3 rounded-xl font-bold text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all text-sm"
              >
                🔄 Reset
              </button>
              <button
                onClick={enregistrer}
                disabled={sauvegarde || !modifie}
                className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm"
              >
                {sauvegarde ? '⏳...' : modifie ? '💾 Enregistrer' : '✓ À jour'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-[10px] text-slate-400 font-black uppercase">Version</div>
              <div className="text-sm font-black text-white">{params.version_site}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-[10px] text-slate-400 font-black uppercase">Mode</div>
              <div className="text-sm font-black text-white">
                {params.mode_production === 'true' ? '🚀 Production' : '🧪 Test'}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-[10px] text-slate-400 font-black uppercase">Langues</div>
              <div className="text-sm font-black text-white">
                {params.langues_actives.split(',').length}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-[10px] text-slate-400 font-black uppercase">Dernière sauvegarde</div>
              <div className="text-xs font-black text-white">
                {formaterDate(params.date_derniere_sauvegarde)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      {succes && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <span className="text-xl">✅</span>
          <p className="text-emerald-200 text-sm font-bold">{succes}</p>
        </motion.div>
      )}

      {erreur && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3"
        >
          <span className="text-xl">⚠️</span>
          <p className="text-red-200 text-sm font-bold">{erreur}</p>
        </motion.div>
      )}

      {/* Recherche paramètres */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          type="text"
          value={rechercheParam}
          onChange={(e) => setRechercheParam(e.target.value)}
          placeholder="Rechercher un paramètre (ex : tarif, sécurité, email...)"
          className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {ongletsListe
          .filter(
            (o) =>
              !rechercheParam ||
              o.label.toLowerCase().includes(rechercheParam.toLowerCase())
          )
          .map((o) => (
            <button
              key={o.val}
              onClick={() => setOnglet(o.val)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                onglet === o.val
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              {o.emoji} {o.label}
            </button>
          ))}
      </div>

      {/* ONGLET GÉNÉRAL */}
      {onglet === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🌍</span> Informations générales
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="📝 Nom du site" value={params.nom_site} onChange={(v: string) => modifierChamp('nom_site', v)} />
            <Field label="🎯 Slogan" value={params.slogan} onChange={(v: string) => modifierChamp('slogan', v)} />
            <div className="md:col-span-2">
              <Textarea label="📄 Description du site" value={params.description_site} onChange={(v: string) => modifierChamp('description_site', v)} />
            </div>
            <Field label="📧 Email admin" type="email" value={params.email_admin} onChange={(v: string) => modifierChamp('email_admin', v)} />
            <Field label="💬 WhatsApp admin" value={params.whatsapp_admin} onChange={(v: string) => modifierChamp('whatsapp_admin', v)} />
            <Field label="📞 Téléphone admin" value={params.telephone_admin} onChange={(v: string) => modifierChamp('telephone_admin', v)} />
            <Field label="📍 Adresse admin" value={params.adresse_admin} onChange={(v: string) => modifierChamp('adresse_admin', v)} />
            <Field label="💰 Numéro Waafi" value={params.numero_waafi} onChange={(v: string) => modifierChamp('numero_waafi', v)} hint="Pour recevoir les paiements" />
            <Field label="🏷️ Version du site" value={params.version_site} onChange={(v: string) => modifierChamp('version_site', v)} />
          </div>
        </motion.div>
      )}

      {/* ONGLET APPARENCE */}
      {onglet === 'apparence' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🎨</span> Apparence du site
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">🎨 Couleur primaire</label>
              <div className="flex gap-2">
                <input type="color" value={params.couleur_primaire} onChange={(e) => modifierChamp('couleur_primaire', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-2 border-slate-700" />
                <input type="text" value={params.couleur_primaire} onChange={(e) => modifierChamp('couleur_primaire', e.target.value)} className="flex-1 px-3 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">🎨 Couleur secondaire</label>
              <div className="flex gap-2">
                <input type="color" value={params.couleur_secondaire} onChange={(e) => modifierChamp('couleur_secondaire', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-2 border-slate-700" />
                <input type="text" value={params.couleur_secondaire} onChange={(e) => modifierChamp('couleur_secondaire', e.target.value)} className="flex-1 px-3 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">🎨 Couleur accent</label>
              <div className="flex gap-2">
                <input type="color" value={params.couleur_accent} onChange={(e) => modifierChamp('couleur_accent', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-2 border-slate-700" />
                <input type="text" value={params.couleur_accent} onChange={(e) => modifierChamp('couleur_accent', e.target.value)} className="flex-1 px-3 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="🖼️ URL du logo" value={params.logo_url} onChange={(v: string) => modifierChamp('logo_url', v)} placeholder="https://..." />
            <Field label="🖼️ URL du favicon" value={params.favicon_url} onChange={(v: string) => modifierChamp('favicon_url', v)} placeholder="https://..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">✍️ Police d'écriture</label>
            <select value={params.police} onChange={(e) => modifierChamp('police', e.target.value)} className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 font-medium">
              <option value="Inter">Inter (moderne)</option>
              <option value="Roboto">Roboto (Google)</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Poppins">Poppins (arrondi)</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Cairo">Cairo (arabe)</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* ONGLET SEO */}
      {onglet === 'seo' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🔍</span> SEO & Réseaux sociaux
          </h2>

          <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-xl p-4">
            <p className="text-xs text-blue-200">
              💡 Le SEO permet à ton site d'apparaître dans Google quand quelqu'un cherche "prof à domicile Djibouti".
            </p>
          </div>

          <div className="space-y-4">
            <Field label="📝 Meta titre (max 60 caractères)" value={params.meta_titre} onChange={(v: string) => modifierChamp('meta_titre', v)} />
            <Textarea label="📄 Meta description (max 160 caractères)" value={params.meta_description} onChange={(v: string) => modifierChamp('meta_description', v)} />
            <Field label="🏷️ Mots-clés (séparés par virgules)" value={params.meta_mots_cles} onChange={(v: string) => modifierChamp('meta_mots_cles', v)} />
            <Field label="🖼️ Image Open Graph (partage social)" value={params.og_image} onChange={(v: string) => modifierChamp('og_image', v)} placeholder="https://..." />
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="📊 Google Analytics ID" value={params.google_analytics_id} onChange={(v: string) => modifierChamp('google_analytics_id', v)} placeholder="G-XXXXXXXXXX" />
              <Field label="🏷️ Google Tag Manager ID" value={params.google_tag_manager_id} onChange={(v: string) => modifierChamp('google_tag_manager_id', v)} placeholder="GTM-XXXXXXX" />
            </div>
          </div>
        </motion.div>
      )}

      {/* ONGLET LANGUES */}
      {onglet === 'langues' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🌐</span> Langues & Devise
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">🌐 Langue par défaut</label>
              <select value={params.langue_defaut} onChange={(e) => modifierChamp('langue_defaut', e.target.value)} className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none">
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇸🇦 Arabe</option>
                <option value="en">🇬🇧 Anglais</option>
              </select>
            </div>
            <Field label="🌐 Langues actives (séparées par virgules)" value={params.langues_actives} onChange={(v: string) => modifierChamp('langues_actives', v)} placeholder="fr,ar,en" hint="Les langues disponibles sur le site" />
            <Field label="💰 Devise" value={params.devise} onChange={(v: string) => modifierChamp('devise', v)} placeholder="DJF" />
            <Field label="💰 Symbole devise" value={params.symbole_devise} onChange={(v: string) => modifierChamp('symbole_devise', v)} placeholder="DJF" />
          </div>
        </motion.div>
      )}

      {/* ONGLET TARIFS */}
      {onglet === 'tarifs' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">💰</span> Tarifs de la plateforme
          </h2>

          <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider">💎 Formule Simple</h3>
          <Field label="Pourcentage du salaire (%)" type="number" value={params.formule_simple_pourcentage} onChange={(v: string) => modifierChamp('formule_simple_pourcentage', v)} />

          <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider mt-4">🏆 Formule Premium</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Pourcentage du salaire (%)" type="number" value={params.formule_premium_pourcentage} onChange={(v: string) => modifierChamp('formule_premium_pourcentage', v)} />
            <Field label="Frais fixes additionnels (DJF)" type="number" value={params.formule_premium_frais_fixe} onChange={(v: string) => modifierChamp('formule_premium_frais_fixe', v)} />
          </div>

          <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider mt-4">💵 Frais Profs</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Tuteur indépendant (DJF/mois)" type="number" value={params.frais_pro_mensuel} onChange={(v: string) => modifierChamp('frais_pro_mensuel', v)} />
            <Field label="Étudiant universitaire (DJF/mois)" type="number" value={params.frais_pro_etudiant} onChange={(v: string) => modifierChamp('frais_pro_etudiant', v)} />
            <Field label="Enseignant officiel (DJF/mois)" type="number" value={params.frais_pro_enseignant} onChange={(v: string) => modifierChamp('frais_pro_enseignant', v)} />
          </div>

          <Field label="📊 Commission plateforme (%)" type="number" value={params.commission_pourcentage} onChange={(v: string) => modifierChamp('commission_pourcentage', v)} hint="Commission sur chaque transaction (0 = désactivée)" />
        </motion.div>
      )}

      {/* ONGLET PAIEMENT */}
      {onglet === 'paiement' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">💳</span> Méthodes de paiement
          </h2>

          <div className="space-y-3">
            <Toggle label="💳 Waafi (Mobile Money)" value={params.paiement_waafi_actif === 'true'} onChange={(v: boolean) => modifierChamp('paiement_waafi_actif', String(v))} />
            <Toggle label="💵 Espèces (en personne)" value={params.paiement_especes_actif === 'true'} onChange={(v: boolean) => modifierChamp('paiement_especes_actif', String(v))} />
            <Toggle label="💳 Carte bancaire" value={params.paiement_carte_actif === 'true'} onChange={(v: boolean) => modifierChamp('paiement_carte_actif', String(v))} />
          </div>

          <Field label="⏱️ Délai de remboursement (jours)" type="number" value={params.delai_remboursement_jours} onChange={(v: string) => modifierChamp('delai_remboursement_jours', v)} hint="Nombre de jours pour traiter un remboursement" />
        </motion.div>
      )}

      {/* ONGLET LIMITES */}
      {onglet === 'limites' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">📊</span> Limites et contraintes
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Minimum séances/semaine" type="number" value={params.min_seances_semaine} onChange={(v: string) => modifierChamp('min_seances_semaine', v)} />
            <Field label="Max profs gratuits" type="number" value={params.max_profs_gratuits} onChange={(v: string) => modifierChamp('max_profs_gratuits', v)} />
            <Field label="Max élèves/prof" type="number" value={params.max_eleves_par_prof} onChange={(v: string) => modifierChamp('max_eleves_par_prof', v)} />
            <Field label="Max demandes/jour/parent" type="number" value={params.max_demandes_par_jour} onChange={(v: string) => modifierChamp('max_demandes_par_jour', v)} />
            <Field label="Durée séance (minutes)" type="number" value={params.duree_session_minutes} onChange={(v: string) => modifierChamp('duree_session_minutes', v)} />
            <Field label="Durée engagement max (jours)" type="number" value={params.duree_session_max_jours} onChange={(v: string) => modifierChamp('duree_session_max_jours', v)} />
          </div>
        </motion.div>
      )}

      {/* ONGLET BADGES */}
      {onglet === 'badges' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🏅</span> Critères des étoiles
          </h2>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⭐</span>
              <h3 className="font-black text-white">1 étoile</h3>
            </div>
            <Field label="Avis minimum" type="number" value={params.critere_etoile_1_avis} onChange={(v: string) => modifierChamp('critere_etoile_1_avis', v)} />
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⭐⭐</span>
              <h3 className="font-black text-white">2 étoiles</h3>
            </div>
            <Field label="Mois avec un client" type="number" value={params.critere_etoile_2_mois} onChange={(v: string) => modifierChamp('critere_etoile_2_mois', v)} />
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⭐⭐⭐</span>
              <h3 className="font-black text-white">3 étoiles</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Mois minimum" type="number" value={params.critere_etoile_3_mois} onChange={(v: string) => modifierChamp('critere_etoile_3_mois', v)} />
              <Field label="Note minimum" type="number" step="0.1" value={params.critere_etoile_3_note} onChange={(v: string) => modifierChamp('critere_etoile_3_note', v)} />
            </div>
          </div>
        </motion.div>
      )}

      {/* ONGLET NOTIFICATIONS */}
      {onglet === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">📢</span> Notifications & Email
          </h2>

          <div className="space-y-3">
            <Toggle label="📧 Notifications email" value={params.notif_email_active === 'true'} onChange={(v: boolean) => modifierChamp('notif_email_active', String(v))} />
            <Toggle label="🔔 Notifications push" value={params.notif_push_active === 'true'} onChange={(v: boolean) => modifierChamp('notif_push_active', String(v))} />
            <Toggle label="📱 Notifications SMS" value={params.notif_sms_active === 'true'} onChange={(v: boolean) => modifierChamp('notif_sms_active', String(v))} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Field label="📧 Email expéditeur" type="email" value={params.email_expediteur} onChange={(v: string) => modifierChamp('email_expediteur', v)} />
            <Field label="↩️ Reply-To" type="email" value={params.email_reply_to} onChange={(v: string) => modifierChamp('email_reply_to', v)} />
          </div>

          <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider mt-6">📧 Configuration SMTP</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="SMTP Host" value={params.smtp_host} onChange={(v: string) => modifierChamp('smtp_host', v)} placeholder="smtp.gmail.com" />
            <Field label="SMTP Port" value={params.smtp_port} onChange={(v: string) => modifierChamp('smtp_port', v)} placeholder="587" />
            <Field label="SMTP User" value={params.smtp_user} onChange={(v: string) => modifierChamp('smtp_user', v)} />
            <div className="flex items-end">
              <Toggle label="🔒 SMTP Secure (TLS)" value={params.smtp_secure === 'true'} onChange={(v: boolean) => modifierChamp('smtp_secure', String(v))} />
            </div>
          </div>
        </motion.div>
      )}

      {/* ONGLET SÉCURITÉ */}
      {onglet === 'securite' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🔐</span> Sécurité
          </h2>

          <div className="bg-red-500/10 border-l-4 border-red-500 rounded-xl p-4">
            <p className="text-xs text-red-200">
              ⚠️ Ces paramètres protègent la plateforme contre les attaques.
            </p>
          </div>

          <div className="space-y-3">
            <Toggle label="🔐 Authentification à 2 facteurs (2FA)" value={params.deux_fa_active === 'true'} onChange={(v: boolean) => modifierChamp('deux_fa_active', String(v))} />
            <Toggle label="🔒 Forcer mot de passe fort" value={params.forcer_mot_de_passe_fort === 'true'} onChange={(v: boolean) => modifierChamp('forcer_mot_de_passe_fort', String(v))} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="⏱️ Durée session admin (min)" type="number" value={params.duree_session_admin} onChange={(v: string) => modifierChamp('duree_session_admin', v)} />
            <Field label="🔢 Max tentatives de connexion" type="number" value={params.max_tentatives_connexion} onChange={(v: string) => modifierChamp('max_tentatives_connexion', v)} />
            <Field label="🚫 Blocage après (minutes)" type="number" value={params.bloquer_apres_tentatives} onChange={(v: string) => modifierChamp('bloquer_apres_tentatives', v)} />
          </div>
        </motion.div>
      )}

      {/* ONGLET RÉCOMPENSES */}
      {onglet === 'recompenses' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🎁</span> Programme de récompenses
          </h2>

          <div className="space-y-3">
            <Toggle label="🎁 Parrainage activé" value={params.parrainage_actif === 'true'} onChange={(v: boolean) => modifierChamp('parrainage_actif', String(v))} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="💰 Montant parrainage (DJF)" type="number" value={params.parrainage_montant} onChange={(v: string) => modifierChamp('parrainage_montant', v)} />
            <Field label="🎁 Bonus premier cours (DJF)" type="number" value={params.bonus_premier_cours} onChange={(v: string) => modifierChamp('bonus_premier_cours', v)} />
            <Field label="🏆 Réduction pionnier (%)" type="number" value={params.reduction_pionnier} onChange={(v: string) => modifierChamp('reduction_pionnier', v)} />
          </div>
        </motion.div>
      )}

      {/* ONGLET MAINTENANCE */}
      {onglet === 'maintenance' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">🔧</span> Maintenance & Mode
          </h2>

          <div className="bg-red-500/10 border-l-4 border-red-500 rounded-xl p-4">
            <p className="text-xs text-red-200">
              ⚠️ Le mode maintenance bloque le site au public.
            </p>
          </div>

          <div className="space-y-3">
            <Toggle label="🚧 Mode maintenance" value={params.mode_maintenance === 'true'} onChange={(v: boolean) => modifierChamp('mode_maintenance', String(v))} activeColor="red" />
            <Toggle label="🚀 Mode production" value={params.mode_production === 'true'} onChange={(v: boolean) => modifierChamp('mode_production', String(v))} />
            <Toggle label="🐛 Mode debug" value={params.mode_debug === 'true'} onChange={(v: boolean) => modifierChamp('mode_debug', String(v))} activeColor="amber" />
          </div>

          <Textarea label="💬 Message de maintenance" value={params.message_maintenance} onChange={(v: string) => modifierChamp('message_maintenance', v)} />
        </motion.div>
      )}

      {/* ONGLET BACKUP */}
      {onglet === 'backup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">💾</span> Sauvegarde
          </h2>

          <div className="space-y-3">
            <Toggle label="💾 Sauvegarde automatique" value={params.backup_auto === 'true'} onChange={(v: boolean) => modifierChamp('backup_auto', String(v))} />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">⏱️ Fréquence</label>
            <select value={params.backup_frequence} onChange={(e) => modifierChamp('backup_frequence', e.target.value)} className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none">
              <option value="horaire">Toutes les heures</option>
              <option value="quotidien">Quotidien</option>
              <option value="hebdo">Hebdomadaire</option>
              <option value="mensuel">Mensuel</option>
            </select>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400 font-black uppercase mb-1">Dernière sauvegarde</div>
            <div className="text-sm font-bold text-white">{formaterDate(params.date_derniere_sauvegarde)}</div>
          </div>

          <button onClick={exporterParametres} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
            📤 Télécharger un backup maintenant
          </button>
        </motion.div>
      )}

      {/* ONGLET LÉGAL */}
      {onglet === 'legal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span className="text-2xl">📝</span> Informations légales
          </h2>

          <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-xl p-4">
            <p className="text-xs text-blue-200">
              💡 Ces informations seront affichées dans les pages légales du site (CGU, Confidentialité).
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="🏢 Nom de l'entreprise" value={params.nom_site} onChange={(v: string) => modifierChamp('nom_site', v)} />
            <Field label="📧 Email légal" type="email" value={params.email_admin} onChange={(v: string) => modifierChamp('email_admin', v)} />
            <Field label="📞 Téléphone légal" value={params.telephone_admin} onChange={(v: string) => modifierChamp('telephone_admin', v)} />
            <Field label="📍 Adresse légale" value={params.adresse_admin} onChange={(v: string) => modifierChamp('adresse_admin', v)} />
            <Field label="🚀 Date de lancement" type="date" value={params.date_lancement} onChange={(v: string) => modifierChamp('date_lancement', v)} />
          </div>
        </motion.div>
      )}

      {/* Barre sticky */}
      {modifie && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-slate-800 border-t-4 border-emerald-500 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-bold text-white text-sm">Modifications non enregistrées</span>
            </div>
            <div className="flex gap-2">
              <button onClick={resetDefaut} disabled={sauvegarde} className="px-4 py-2.5 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 text-sm disabled:opacity-50">🔄 Reset</button>
              <button onClick={enregistrer} disabled={sauvegarde} className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg disabled:opacity-50 text-sm">
                {sauvegarde ? '⏳...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}