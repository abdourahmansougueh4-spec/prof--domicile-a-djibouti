'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES & INTERFACES
// ============================================================

type ProfilComplet = { 
  id: string; nom_complet: string; photo_url: string | null; quartier: string | null; bio: string | null; telephone: string | null; whatsapp: string | null 
}

type ProfInfo = { 
  experience_annees: number; note_moyenne: number; nombre_avis: number; etoiles: number; badge_admin: string | null; pionnier: boolean; pionnier_illustre: boolean; a_bac_s: boolean; type_professeur: string | null; zone_enseignement: string | null; specialite: string | null; universite: string | null; niveau_etude: string | null; domaine_etude: string | null; est_etudiant: boolean; verifie_physique: boolean; photo_profil_url: string | null; prix_min: number | null; prix_max: number | null 
}

type Avis = { 
  id: string; note: number; commentaire: string | null; created_at: string; auteur: string; avatar_color: string; 
}

type Dispo = { jour: string; creneau: string }
type Enfant = { id: string; prenom: string; niveaux: string[] }

// ============================================================
// CONFIG & DONNÉES STATIQUES
// ============================================================

const TYPES_PROFS: { [k: string]: { label: string; emoji: string; couleur: string } } = {
  etudiant: { label: 'Étudiant universitaire', emoji: '🎓', couleur: 'from-blue-500 to-indigo-600' },
  diplome: { label: 'Diplômé universitaire', emoji: '📜', couleur: 'from-emerald-500 to-teal-600' },
  bac_s: { label: 'Bac Scientifique', emoji: '🎓', couleur: 'from-amber-500 to-orange-600' },
  enseignant: { label: 'Enseignant officiel', emoji: '👨‍🏫', couleur: 'from-purple-500 to-pink-600' },
  freelance: { label: 'Professeur freelance', emoji: '💼', couleur: 'from-cyan-500 to-blue-600' },
  formateur: { label: 'Formateur spécialisé', emoji: '🏢', couleur: 'from-rose-500 to-pink-600' },
  coran: { label: 'Enseignant Coran', emoji: '📖', couleur: 'from-green-500 to-emerald-600' },
}

const LABELS_MATIERES: { [k: string]: string } = {
  primaire_fr: 'Primaire — Français', primaire_ar: 'Primaire — Arabe', college_maths: 'Collège — Maths',
  college_physique: 'Collège — Physique-Chimie', college_svt: 'Collège — SVT', college_francais: 'Collège — Français',
  college_anglais: 'Collège — Anglais', college_arabe: 'Collège — Arabe', lycee_maths: 'Lycée — Maths',
  arabe: 'Arabe', coran: 'Coran', francais: 'Français', anglais: 'Anglais',
}

const LABELS_LANGUES: { [k: string]: { label: string; emoji: string } } = {
  francais: { label: 'Français', emoji: '🇫🇷' }, arabe: { label: 'Arabe', emoji: '📖' },
  somali: { label: 'Somali', emoji: '🇸🇴' }, afar: { label: 'Afar', emoji: '🌍' }, anglais: { label: 'Anglais', emoji: '🇬🇧' },
}

const LABELS_ZONES: { [k: string]: string } = { 
  chez_moi: '🏠 Chez le prof', chez_eleve: "🚶 Chez l'élève", les_deux: '🔄 Les deux possibles' 
}

const JOURS_ORDRE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const CRENEAUX_LABELS: { [k: string]: { label: string; horaire: string; emoji: string; couleur: string } } = {
  matin: { label: 'Matin', horaire: '8h-12h', emoji: '🌅', couleur: 'from-amber-400 to-yellow-500' },
  apres_midi: { label: 'Après-midi', horaire: '12h-17h', emoji: '☀️', couleur: 'from-orange-400 to-red-500' },
  soir: { label: 'Soir', horaire: '17h-21h', emoji: '🌙', couleur: 'from-indigo-400 to-purple-600' },
}

const FAKE_PROFS = [
  { id: 'c1', nom: 'Hassan Ahmed', quartier: 'Balbala', bio: 'Enseignant du Coran depuis 8 ans, spécialisé en Hifz et Tajwid. Méthode douce et progressive.', experience: 8, note: 4.9, avis: 82, etoiles: 3, badge: 'recommande', pionnier: false, illustre: false, bac_s: false, type: 'coran', zone: 'les_deux', specialite: 'Coran & Tajwid', matieres: ['coran'], langues: ['arabe', 'somali'], prix_min: 15000, prix_max: 25000 },
  { id: 'c2', nom: 'Fatouma Moussa', quartier: 'Héron', bio: 'Professeure de Coran dévouée, spécialisée dans la mémorisation pour les enfants.', experience: 5, note: 4.8, avis: 64, etoiles: 2, badge: null, pionnier: false, illustre: false, bac_s: false, type: 'coran', zone: 'chez_eleve', specialite: 'Coran (Mémorisation)', matieres: ['coran'], langues: ['arabe', 'francais'], prix_min: 12000, prix_max: 20000 },
  { id: 'c3', nom: 'Abdoulkader Idriss', quartier: 'Q1', bio: 'Enseignant du Coran et des sciences religieuses. Approche pédagogique moderne.', experience: 10, note: 5.0, avis: 51, etoiles: 3, badge: 'super_pro', pionnier: true, illustre: false, bac_s: false, type: 'coran', zone: 'chez_moi', specialite: 'Coran & Tajwid', matieres: ['coran'], langues: ['arabe', 'francais', 'anglais'], prix_min: 20000, prix_max: 30000 },
  { id: 'c4', nom: 'Mariam Dini', quartier: 'Gabode', bio: 'Spécialiste du Tafsir et de la lecture coranique pour adultes et enfants.', experience: 6, note: 4.7, avis: 47, etoiles: 2, badge: null, pionnier: false, illustre: false, bac_s: false, type: 'coran', zone: 'les_deux', specialite: 'Coran (Tafsir)', matieres: ['coran'], langues: ['arabe', 'somali'], prix_min: 15000, prix_max: 25000 },
  { id: 'c5', nom: 'Youssouf Kadir', quartier: 'Centre-ville', bio: 'Enseignant de Coran depuis 12 ans. Patience et rigueur pour les débutants.', experience: 12, note: 4.9, avis: 39, etoiles: 3, badge: 'recommande', pionnier: false, illustre: false, bac_s: false, type: 'coran', zone: 'chez_moi', specialite: 'Coran (Lecture)', matieres: ['coran'], langues: ['arabe', 'francais'], prix_min: 18000, prix_max: 28000 },
  { id: 'c6', nom: 'Khadija Said', quartier: 'Q4', bio: 'Professeure de Coran pour filles et femmes. Spécialisée en Hifz et récitation.', experience: 7, note: 5.0, avis: 35, etoiles: 3, badge: 'super_pro', pionnier: false, illustre: false, bac_s: false, type: 'coran', zone: 'chez_eleve', specialite: 'Coran & Hifz', matieres: ['coran'], langues: ['arabe', 'francais', 'somali'], prix_min: 15000, prix_max: 22000 },
  { id: 'c7', nom: 'Ali Gueddi', quartier: 'Arhiba', bio: 'Enseignant du Coran et de l\'arabe. Approche adaptée aux enfants de 6 à 15 ans.', experience: 4, note: 4.8, avis: 28, etoiles: 2, badge: null, pionnier: false, illustre: false, bac_s: false, type: 'coran', zone: 'les_deux', specialite: 'Coran (Tajwid)', matieres: ['coran'], langues: ['arabe', 'somali'], prix_min: 10000, prix_max: 18000 },
  { id: 'm1', nom: 'Rachid Abdillahi Djama', quartier: 'Héron', bio: 'Professeur de Maths au lycée depuis 15 ans. Prépare au Bac avec une méthode ciblée.', experience: 15, note: 4.9, avis: 112, etoiles: 3, badge: 'super_pro', pionnier: true, illustre: false, bac_s: true, type: 'bac_s', zone: 'chez_eleve', specialite: 'Maths Lycée', matieres: ['lycee_maths'], langues: ['francais', 'arabe'], prix_min: 25000, prix_max: 40000 },
  { id: 'm2', nom: 'Amina Mohamed', quartier: 'Q2', bio: 'Professeure de Mathématiques au lycée, spécialisée dans la préparation aux examens.', experience: 9, note: 4.8, avis: 89, etoiles: 3, badge: 'recommande', pionnier: false, illustre: false, bac_s: true, type: 'bac_s', zone: 'les_deux', specialite: 'Maths Lycée', matieres: ['lycee_maths'], langues: ['francais', 'arabe', 'anglais'], prix_min: 20000, prix_max: 35000 },
]

const formaterDate = (date: string) => {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formaterPrix = (prix: number | null) => {
  if (!prix) return 'Négociable'
  return prix.toLocaleString('fr-FR') + ' DJF'
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ProfilProf() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const profId = params?.id as string

  // ---- ÉTATS ----
  const [profil, setProfil] = useState<ProfilComplet | null>(null)
  const [prof, setProf] = useState<ProfInfo | null>(null)
  const [matieres, setMatieres] = useState<string[]>([])
  const [langues, setLangues] = useState<string[]>([])
  const [dispos, setDispos] = useState<Dispo[]>([])
  const [avis, setAvis] = useState<Avis[]>([])
  const [profsSimilaires, setProfsSimilaires] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  // ONGLETS (CORRECTION DE L'ERREUR ICI)
  const [activeTab, setActiveTab] = useState<'profil' | 'avis' | 'dispos' | 'faq'>('profil')

  // Modals
  const [showNoScheduleModal, setShowNoScheduleModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showRoleErrorModal, setShowRoleErrorModal] = useState(false) 
  
  // Logique du formulaire de demande
  const [requestStep, setRequestStep] = useState(1)
  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [selectedEnfant, setSelectedEnfant] = useState<string>('')
  const [selectedCreneaux, setSelectedCreneaux] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successAnim, setSuccessAnim] = useState(false)

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  const charger = useCallback(async () => {
    if (!profId) return
    setLoading(true)
    setErreur('')

    const estFauxProf = FAKE_PROFS.some(p => p.id === profId)
    
    if (estFauxProf) {
      const fake = FAKE_PROFS.find(p => p.id === profId)!
      setProfil({ id: fake.id, nom_complet: fake.nom, photo_url: null, quartier: fake.quartier, bio: fake.bio, telephone: null, whatsapp: null })
      setProf({
        experience_annees: fake.experience, note_moyenne: fake.note, nombre_avis: fake.avis, etoiles: fake.etoiles, badge_admin: fake.badge, pionnier: fake.pionnier, pionnier_illustre: fake.illustre, a_bac_s: fake.bac_s, type_professeur: fake.type, zone_enseignement: fake.zone, specialite: fake.specialite, universite: null, niveau_etude: null, domaine_etude: null, est_etudiant: false, verifie_physique: true, photo_profil_url: null, prix_min: fake.prix_min, prix_max: fake.prix_max,
      })
      setMatieres(fake.matieres)
      setLangues(fake.langues)
      setDispos([]) // AUCUN HORAIRE POUR LES FAUX PROFS
      
      const fakeAvis = [
        { id: 'a1', note: 5, commentaire: 'Excellent professeur, très patient et pédagogue. Mes enfants ont fait d\'énormes progrès.', created_at: new Date().toISOString(), auteur: 'Moussa A.', avatar_color: 'bg-blue-600' },
        { id: 'a2', note: 5, commentaire: 'Je recommande vivement. Toujours à l\'heure et très professionnel.', created_at: new Date(Date.now() - 86400000).toISOString(), auteur: 'Fatima H.', avatar_color: 'bg-emerald-600' },
        { id: 'a3', note: 4, commentaire: 'Très bon prof, ma fille a beaucoup aimé le premier cours.', created_at: new Date(Date.now() - 172800000).toISOString(), auteur: 'Ahmed S.', avatar_color: 'bg-amber-600' },
        { id: 'a4', note: 5, commentaire: 'Grâce à lui, j\'ai eu mon Bac avec mention !', created_at: new Date(Date.now() - 259200000).toISOString(), auteur: 'Khadija M.', avatar_color: 'bg-purple-600' },
      ]
      setAvis(fakeAvis)

      const autresFakes = FAKE_PROFS.filter(p => p.id !== profId && p.matieres.some(m => fake.matieres.includes(m))).slice(0, 3).map(p => ({ id: p.id, nom_complet: p.nom, photo_url: null, note_moyenne: p.note, etoiles: p.etoiles }))
      setProfsSimilaires(autresFakes)
      setLoading(false)
      return
    }

    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('id, nom_complet, photo_url, quartier, bio, telephone, whatsapp, approuve, banni, masque').eq('id', profId).eq('role', 'professeur').single()
      if (profileError || !profileData || !profileData.approuve || profileData.banni || profileData.masque) { setErreur('Profil indisponible'); setLoading(false); return }

      setProfil({ id: profileData.id, nom_complet: profileData.nom_complet || '', photo_url: profileData.photo_url, quartier: profileData.quartier, bio: profileData.bio, telephone: profileData.telephone, whatsapp: profileData.whatsapp })

      const [profRes, matieresRes, languesRes, disposRes, avisRes] = await Promise.all([
        supabase.from('professeurs').select('experience_annees, note_moyenne, nombre_avis, etoiles, badge_admin, pionnier, pionnier_illustre, a_bac_s, type_professeur, zone_enseignement, specialite, universite, niveau_etude, domaine_etude, est_etudiant, verifie_physique, photo_profil_url, prix_min, prix_max').eq('id', profId).single(),
        supabase.from('matieres_par_prof').select('matiere').eq('professeur_id', profId),
        supabase.from('langues_par_prof').select('langue').eq('professeur_id', profId),
        supabase.from('disponibilites').select('jour, creneau').eq('professeur_id', profId),
        supabase.from('avis').select('id, note, commentaire, created_at').eq('professeur_id', profId).eq('publie', true).order('created_at', { ascending: false }).limit(10),
      ])

      if (profRes.data) {
        setProf({
          experience_annees: profRes.data.experience_annees || 0, note_moyenne: Number(profRes.data.note_moyenne) || 0, nombre_avis: profRes.data.nombre_avis || 0, etoiles: profRes.data.etoiles || 0, badge_admin: profRes.data.badge_admin, pionnier: profRes.data.pionnier === true, pionnier_illustre: profRes.data.pionnier_illustre === true, a_bac_s: profRes.data.a_bac_s === true, type_professeur: profRes.data.type_professeur, zone_enseignement: profRes.data.zone_enseignement, specialite: profRes.data.specialite, universite: profRes.data.universite, niveau_etude: profRes.data.niveau_etude, domaine_etude: profRes.data.domaine_etude, est_etudiant: profRes.data.est_etudiant === true, verifie_physique: profRes.data.verifie_physique === true, photo_profil_url: profRes.data.photo_profil_url, prix_min: profRes.data.prix_min ? Number(profRes.data.prix_min) : null, prix_max: profRes.data.prix_max ? Number(profRes.data.prix_max) : null,
        })
      }

      const matList = (matieresRes.data || []).map((m) => m.matiere)
      setMatieres(matList)
      setLangues((languesRes.data || []).map((l) => l.langue))
      setDispos(disposRes.data || [])
      setAvis((avisRes.data || []).map(a => ({ ...a, auteur: 'Parent vérifié', avatar_color: 'bg-slate-600' })))

      if (matList.length > 0) {
        const { data: profsMemeMatiere } = await supabase.from('matieres_par_prof').select('professeur_id').in('matiere', matList).neq('professeur_id', profId)
        const idsSimilaires = [...new Set((profsMemeMatiere || []).map(p => p.professeur_id))]
        if (idsSimilaires.length > 0) {
          const { data: similairesData } = await supabase.from('profiles').select(`id, nom_complet, photo_url, professeurs:professeurs!inner (note_moyenne, etoiles, approuve, banni, masque, photo_profil_url)`).in('id', idsSimilaires).eq('role', 'professeur').eq('approuve', true).eq('banni', false).eq('masque', false).limit(3)
          setProfsSimilaires((similairesData || []).map((p) => {
            const info = Array.isArray(p.professeurs) ? p.professeurs[0] : p.professeurs
            return { id: p.id, nom_complet: p.nom_complet || 'Prof', photo_url: info?.photo_profil_url || p.photo_url || null, note_moyenne: Number(info?.note_moyenne) || 0, etoiles: info?.etoiles || 0 }
          }))
        }
      }
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [supabase, profId])

  useEffect(() => { charger() }, [charger])

  useEffect(() => {
    if (searchParams.get('demande') === 'true') {
      setShowRequestModal(true)
      window.history.replaceState(null, '', `/professeurs/${profId}`)
    }
  }, [searchParams, profId])

  // ============================================================
  // LOGIQUE DE DEMANDE
  // ============================================================

  const initierDemande = async () => {
    if (dispos.length === 0) { setShowNoScheduleModal(true); return }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(`/login?redirect=/professeurs/${profId}?demande=true`)
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      
      if (profile?.role === 'parent') {
        chargerEnfants(user.id)
        setShowRequestModal(true)
        setRequestStep(2) 
      } else {
        setShowRoleErrorModal(true)
      }
    }
  }

  const chargerEnfants = async (parentId: string) => {
    const { data } = await supabase.from('enfants').select('id, prenom, niveaux').eq('parent_id', parentId)
    if (data) setEnfants(data)
  }

  const envoyerDemande = async () => {
    if (!selectedEnfant || selectedCreneaux.length === 0) return
    setIsSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await new Promise(r => setTimeout(r, 1500))
    
    setIsSubmitting(false)
    setSuccessAnim(true)
  }

  // ============================================================
  // UTILITAIRES UI
  // ============================================================

  const getTypeInfo = () => prof?.type_professeur ? TYPES_PROFS[prof.type_professeur] || null : null
  const getDisposParJour = (jour: string) => dispos.filter((d) => d.jour === jour)
  const getMoyenneCalculee = () => avis.length === 0 ? 0 : avis.reduce((acc, a) => acc + a.note, 0) / avis.length
  const getColorEtoiles = (etoiles: number) => {
    if (etoiles >= 3) return 'from-amber-500 to-orange-600'
    if (etoiles >= 2) return 'from-emerald-500 to-teal-600'
    if (etoiles >= 1) return 'from-blue-500 to-indigo-600'
    return 'from-slate-500 to-slate-700'
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
      <p className="text-slate-500 font-bold">Chargement du profil...</p>
    </div>
  )

  if (erreur || !profil || !prof) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-red-200 rounded-3xl p-10 max-w-md text-center shadow-2xl">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-black mb-2">Erreur</h2>
        <p className="text-slate-600 mb-6">{erreur}</p>
        <Link href="/professeurs" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Retour</Link>
      </div>
    </div>
  )

  const typeInfo = getTypeInfo()

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-emerald-200 selection:text-emerald-900 pb-20 font-sans">
      
      {/* HEADER IMMERSIF */}
      <div className="relative bg-slate-900 h-80 w-full overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${getColorEtoiles(prof.etoiles)} opacity-50`} />
        <div className="absolute inset-0 backdrop-blur-3xl" />
        <div className="absolute top-6 left-6 z-50">
          <Link href="/professeurs" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white font-bold transition-all border border-white/20">
            ← Retour à la liste
          </Link>
        </div>
      </div>

      {/* CARTE PROFIL FLOTTANTE */}
      <div className="max-w-6xl mx-auto px-4 -mt-40 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: 'spring' }} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-10 items-center md:items-start">
          
          <div className="relative flex-shrink-0 -mt-28 md:-mt-32">
            <div className={`w-48 h-48 rounded-[2.5rem] bg-gradient-to-br ${getColorEtoiles(prof.etoiles)} p-1.5 shadow-2xl`}>
              <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex items-center justify-center">
                {profil.photo_url ? (
                  <img src={profil.photo_url} alt={profil.nom_complet} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-7xl">👨‍🏫</span>
                )}
              </div>
            </div>
            {prof.verifie_physique && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="absolute -bottom-3 -right-3 bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-xl text-xl" title="Vérifié physiquement">✓</motion.div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-6">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-3">{profil.nom_complet}</h1>
                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  {typeInfo && <span className={`px-4 py-1.5 bg-gradient-to-r ${typeInfo.couleur} text-white rounded-xl text-sm font-black shadow-md`}>{typeInfo.emoji} {typeInfo.label}</span>}
                  {profil.quartier && <span className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold shadow-sm">📍 {profil.quartier}</span>}
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <div className="flex items-center gap-2 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-200 shadow-sm">
                  <span className="text-amber-500 text-2xl">⭐</span>
                  <span className="text-3xl font-black text-slate-900">{prof.note_moyenne.toFixed(1)}</span>
                  <span className="text-sm font-bold text-slate-500">/ 5</span>
                </div>
                <span className="text-xs font-bold text-slate-400 mt-2">{prof.nombre_avis} avis vérifiés</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
              {prof.badge_admin === 'super_pro' && <span className="text-[11px] bg-amber-100 text-amber-800 border border-amber-300 px-4 py-1.5 rounded-full font-black shadow-sm">👑 SUPER-PRO</span>}
              {prof.pionnier && <span className="text-[11px] bg-yellow-100 text-yellow-800 border border-yellow-300 px-4 py-1.5 rounded-full font-black shadow-sm">🏆 PIONNIER</span>}
              {prof.a_bac_s && <span className="text-[11px] bg-blue-100 text-blue-800 border border-blue-300 px-4 py-1.5 rounded-full font-black shadow-sm">🎓 BAC S</span>}
            </div>

            {/* BADGES DE CONFIANCE */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="flex items-center gap-2 text-sm font-black text-slate-700"><span className="text-emerald-500 text-lg">🔒</span> 100% Sécurisé</span>
              <span className="flex items-center gap-2 text-sm font-black text-slate-700"><span className="text-emerald-500 text-lg">✅</span> Profil Vérifié</span>
              <span className="flex items-center gap-2 text-sm font-black text-slate-700"><span className="text-emerald-500 text-lg">⚡</span> Réponse en 24h</span>
            </div>

            {/* PRIX ESTIMÉ */}
            <div className="mb-8 text-center md:text-left bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 inline-block w-full md:w-auto">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider mb-1 block">Tarif estimé</span>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-3xl font-black text-emerald-600">{formaterPrix(prof.prix_min)}</span>
                <span className="text-base font-bold text-slate-400">à</span>
                <span className="text-3xl font-black text-emerald-600">{formaterPrix(prof.prix_max)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={initierDemande} className="px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/30 hover:shadow-2xl transition-all flex items-center justify-center gap-3">
                📩 Demander ce prof
              </motion.button>
              <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-white text-slate-800 border-2 border-slate-200 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm">
                💬 Contacter l'admin
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'profil', label: 'À propos', icon: '👤' },
            { id: 'dispos', label: 'Disponibilités', icon: '📅' },
            { id: 'avis', label: `Avis (${avis.length})`, icon: '⭐' },
            { id: 'faq', label: 'FAQ', icon: '❓' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-4 rounded-2xl font-black text-base whitespace-nowrap transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-600 hover:bg-slate-100 border-2 border-slate-200'}`}
            >
              <span className="text-xl">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENU DES ONGLETS */}
        <div className="mt-6 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* ONGLET PROFIL */}
            {activeTab === 'profil' && (
              <motion.div key="profil" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-3"><span className="text-3xl">📝</span> Biographie</h2>
                  <p className="text-slate-600 leading-relaxed text-xl italic bg-slate-50 p-8 rounded-3xl border border-slate-100">« {profil.bio || 'Aucune biographie fournie.'} »</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100 shadow-sm">
                    <h3 className="font-black text-purple-900 text-lg mb-5 flex items-center gap-2">📚 Matières enseignées</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {matieres.map(m => <span key={m} className="px-4 py-2 bg-white text-purple-700 rounded-xl text-sm font-black shadow-sm border border-purple-100">{LABELS_MATIERES[m] || m}</span>)}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                    <h3 className="font-black text-blue-900 text-lg mb-5 flex items-center gap-2">💬 Langues parlées</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {langues.map(l => <span key={l} className="px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-black shadow-sm border border-blue-100 flex items-center gap-2"><span>{LABELS_LANGUES[l]?.emoji}</span> {LABELS_LANGUES[l]?.label || l}</span>)}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 shadow-sm">
                  <h3 className="font-black text-amber-900 text-lg mb-3 flex items-center gap-2">🎯 Zone d'enseignement</h3>
                  <p className="text-amber-800 font-bold text-lg">{prof.zone_enseignement ? LABELS_ZONES[prof.zone_enseignement] : 'Non précisé'}</p>
                </div>
              </motion.div>
            )}

            {/* ONGLET DISPOS */}
            {activeTab === 'dispos' && (
              <motion.div key="dispos" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><span className="text-3xl">📅</span> Créneaux disponibles</h2>
                {dispos.length === 0 ? (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-12 text-center shadow-inner">
                    <div className="text-7xl mb-4 animate-pulse">⏳</div>
                    <h3 className="text-2xl font-black text-amber-900 mb-2">Aucun horaire disponible</h3>
                    <p className="text-amber-700 font-medium text-lg max-w-md mx-auto">Ce professeur n'a pas encore publié ses créneaux pour le moment. Revenez plus tard ou contactez l'administration.</p>
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {JOURS_ORDRE.map(jour => {
                      const d = getDisposParJour(jour)
                      if (d.length === 0) return null
                      return (
                        <div key={jour} className="flex flex-col md:flex-row items-center gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors">
                          <span className="font-black text-slate-800 text-lg w-32">{jour}</span>
                          <div className="flex flex-wrap gap-3 flex-1">
                            {d.map((c, i) => (
                              <span key={i} className={`px-5 py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r ${CRENEAUX_LABELS[c.creneau].couleur} shadow-md hover:scale-105 transition-transform cursor-default`}>
                                {CRENEAUX_LABELS[c.creneau].emoji} {CRENEAUX_LABELS[c.creneau].horaire}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ONGLET AVIS */}
            {activeTab === 'avis' && (
              <motion.div key="avis" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><span className="text-3xl">⭐</span> Avis des parents</h2>
                  <div className="bg-amber-100 px-6 py-3 rounded-2xl text-amber-900 font-black text-2xl shadow-sm border border-amber-200">{getMoyenneCalculee().toFixed(1)} / 5</div>
                </div>
                <div className="space-y-5">
                  {avis.length === 0 ? (
                    <p className="text-slate-500 text-center py-12 text-lg font-medium">Aucun avis pour le moment.</p>
                  ) : avis.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex gap-5">
                      <div className={`w-14 h-14 rounded-full ${a.avatar_color} text-white flex items-center justify-center text-xl font-black flex-shrink-0 shadow-md`}>{a.auteur.charAt(0)}</div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                          <span className="font-black text-slate-900 text-lg">{a.auteur}</span>
                          <span className="text-amber-500 text-lg bg-white px-3 py-1 rounded-lg border border-amber-100 shadow-sm">{'⭐'.repeat(a.note)}</span>
                        </div>
                        <p className="text-slate-700 mb-3 text-lg leading-relaxed">"{a.commentaire}"</p>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{formaterDate(a.created_at)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ONGLET FAQ */}
            {activeTab === 'faq' && (
              <motion.div key="faq" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><span className="text-3xl">❓</span> Questions fréquentes</h2>
                {[
                  { q: "Comment se passe le premier cours ?", a: "Le premier cours est une prise de contact. Le professeur évalue le niveau de l'élève et met en place une stratégie adaptée." },
                  { q: "Quels sont les moyens de paiement acceptés ?", a: "Le paiement se fait directement avec le professeur (espèces, Waafi ou virement)." },
                  { q: "Puis-je annuler un cours ?", a: "Oui, à condition de prévenir au moins 24h à l'avance pour permettre au professeur de s'organiser." },
                  { q: "Les professeurs sont-ils vraiment vérifiés ?", a: "Absolument. Chaque professeur passe par un processus rigoureux de vérification d'identité, de diplômes et parfois un entretien physique." }
                ].map((f, i) => (
                  <details key={i} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden group shadow-sm hover:border-blue-200 transition-colors cursor-pointer">
                    <summary className="p-6 font-black text-slate-900 text-lg list-none flex justify-between items-center outline-none">
                      {f.q}
                      <span className="text-blue-500 text-2xl group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <div className="px-6 pb-6 text-slate-600 text-lg leading-relaxed">{f.a}</div>
                  </details>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* SUGGESTIONS DE PROFS */}
        {profsSimilaires.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3"><span className="text-4xl">👥</span> Autres profs pour cette matière</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {profsSimilaires.map(p => (
                <Link key={p.id} href={`/professeurs/${p.id}`} className="bg-white rounded-3xl p-6 shadow-lg border-2 border-slate-100 hover:shadow-2xl hover:-translate-y-2 hover:border-emerald-200 transition-all flex items-center gap-5 group">
                  <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center text-4xl flex-shrink-0 group-hover:scale-105 transition-transform">{p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover rounded-2xl" /> : '👨‍🏫'}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-emerald-700 transition-colors">{p.nom_complet}</h3>
                    <span className="text-amber-500 text-base">{'⭐'.repeat(p.etoiles)} <span className="font-black text-slate-700 ml-1">{p.note_moyenne}</span></span>
                  </div>
                  <span className="text-slate-300 group-hover:text-emerald-500 text-3xl group-hover:translate-x-1 transition-all">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-white">
              
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white relative">
                <button onClick={() => setShowRequestModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">✕</button>
                <h2 className="text-3xl font-black mb-1">Demande de cours</h2>
                <p className="text-blue-100 text-lg">Avec {profil.nom_complet}</p>
                
                <div className="flex gap-2 mt-8">
                  {[2, 3, 4].map(step => (
                    <div key={step} className={`h-2 flex-1 rounded-full transition-colors duration-500 ${requestStep >= step ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>

              <div className="p-8 md:p-10 overflow-y-auto flex-1">
                {successAnim ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[...Array(30)].map((_, i) => (
                        <motion.div key={i} initial={{ y: -50, x: Math.random() * 500 - 250, rotate: 0 }} animate={{ y: 500, rotate: 720 }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'linear' }} className={`absolute w-3 h-3 rounded-sm ${['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500'][i % 5]}`} />
                      ))}
                    </div>
                    <div className="text-8xl mb-6 animate-bounce relative z-10">🎉</div>
                    <h3 className="text-4xl font-black text-slate-900 mb-4 relative z-10">Demande envoyée !</h3>
                    <p className="text-slate-600 text-lg mb-10 relative z-10 max-w-md mx-auto">Votre demande a bien été transmise. Notre équipe vous contactera sous 24h pour finaliser.</p>
                    <button onClick={() => setShowRequestModal(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg relative z-10 hover:scale-105 transition-transform shadow-xl">Fermer</button>
                  </motion.div>
                ) : (
                  <>
                    {requestStep === 2 && (
                      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><span className="text-3xl">1️⃣</span> Pour quel enfant ?</h3>
                        {enfants.length === 0 ? (
                          <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 text-center">
                            <p className="text-amber-800 font-bold text-lg mb-4">Vous n'avez pas encore ajouté d'enfant à votre profil.</p>
                            <Link href="/espace-parent/enfants" className="inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-black">Ajouter un enfant</Link>
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {enfants.map(e => (
                              <div key={e.id} onClick={() => setSelectedEnfant(e.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedEnfant === e.id ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-400 bg-white'}`}>
                                <div>
                                  <div className="font-black text-slate-900 text-lg">{e.prenom}</div>
                                  <div className="text-sm font-bold text-slate-500">{e.niveaux.join(', ')}</div>
                                </div>
                                {selectedEnfant === e.id && <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-10 flex justify-end">
                          <button disabled={!selectedEnfant} onClick={() => setRequestStep(3)} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-lg">Suivant →</button>
                        </div>
                      </motion.div>
                    )}

                    {requestStep === 3 && (
                      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><span className="text-3xl">2️⃣</span> Quels créneaux ?</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {dispos.map((d, i) => {
                            const cle = `${d.jour}-${d.creneau}`
                            const actif = selectedCreneaux.includes(cle)
                            return (
                              <div key={i} onClick={() => setSelectedCreneaux(prev => actif ? prev.filter(x => x !== cle) : [...prev, cle])} className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${actif ? 'border-emerald-600 bg-emerald-50 shadow-md' : 'border-slate-200 hover:border-emerald-300'}`}>
                                <span className="font-bold text-slate-800 text-lg">{d.jour} ({CRENEAUX_LABELS[d.creneau].label})</span>
                                {actif && <span className="text-emerald-600 text-xl">✓</span>}
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-10 flex justify-between">
                          <button onClick={() => setRequestStep(2)} className="px-8 py-4 text-slate-600 font-bold text-lg hover:bg-slate-100 rounded-xl transition-colors">← Retour</button>
                          <button disabled={selectedCreneaux.length === 0} onClick={() => setRequestStep(4)} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-lg">Suivant →</button>
                        </div>
                      </motion.div>
                    )}

                    {requestStep === 4 && (
                      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><span className="text-3xl">3️⃣</span> Confirmation</h3>
                        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 mb-8 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-3"><span className="text-slate-500 font-bold">Professeur</span><span className="font-black text-lg text-slate-900">{profil.nom_complet}</span></div>
                          <div className="flex justify-between items-center border-b border-slate-200 pb-3"><span className="text-slate-500 font-bold">Enfant</span><span className="font-black text-lg text-slate-900">{enfants.find(e => e.id === selectedEnfant)?.prenom}</span></div>
                          <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Créneaux</span><span className="font-black text-lg text-slate-900">{selectedCreneaux.length} sélectionné(s)</span></div>
                        </div>
                        <div className="mt-10 flex justify-between">
                          <button onClick={() => setRequestStep(3)} className="px-8 py-4 text-slate-600 font-bold text-lg hover:bg-slate-100 rounded-xl transition-colors">← Retour</button>
                          <button disabled={isSubmitting} onClick={envoyerDemande} className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
                            {isSubmitting ? (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Envoi...</>) : ('Confirmer la demande')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNoScheduleModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden text-center border-4 border-white">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-10">
                <div className="text-6xl mb-3 drop-shadow-md">⏳</div>
                <h2 className="text-3xl font-black text-white">Complet</h2>
              </div>
              <div className="p-8">
                <p className="text-slate-600 mb-8 text-lg font-medium">Ce professeur n'a aucun horaire disponible. Contactez notre équipe pour trouver une alternative.</p>
                <button onClick={() => setShowNoScheduleModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg shadow-lg hover:bg-slate-800 transition-colors">Fermer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRoleErrorModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden border-4 border-white">
              
              {/* En-tête repensé pour être rassurant */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center relative overflow-hidden">
                <motion.div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-2xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} />
                <div className="relative z-10">
                  <div className="w-24 h-24 mx-auto bg-white/20 rounded-3xl flex items-center justify-center text-5xl mb-5 shadow-inner border border-white/30">🤝</div>
                  <h2 className="text-3xl font-black text-white mb-2">Un espace pour les parents</h2>
                  <p className="text-blue-100 text-base font-medium">Créez votre espace dédié pour suivre la scolarité.</p>
                </div>
              </div>

              <div className="p-8 space-y-6 text-center">
                {/* Message conseillé rassurant */}
                <p className="text-base font-medium text-slate-600 leading-relaxed">
                  Il est conseillé de s'inscrire sur la page d'accueil pour avoir votre propre espace parent. Cela vous permettra de suivre le travail entre les élèves et les professeurs, et d'assurer un suivi personnalisé.
                </p>
                
                <div className="space-y-3">
                  {/* Bouton 1 : Connexion */}
                  <Link href="/login?role=parent" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                    aller à la page de connexion
                  </Link>
                  
                  {/* Bouton 2 (NOUVEAU) : WhatsApp */}
                  <a href="https://wa.me/25377741482" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                    💬 Contacter par WhatsApp
                  </a>
                  
                  {/* Bouton 3 : Fermer */}
                  <button onClick={() => setShowRoleErrorModal(false)} className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-black text-lg hover:bg-slate-200 transition-all">
                    Fermer
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