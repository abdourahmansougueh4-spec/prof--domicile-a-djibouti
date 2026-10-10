'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Professeur = {
  nomComplet: string
  email: string
  motDePasse: string
  telephone: string
  whatsapp: string
  quartier: string
  bio: string
  experienceAnnees: string
  estEtudiant: boolean
  statutUniversitaire: string
  domaineEtude: string
  niveauEtude: string
  universite: string
  aBacS: boolean
  autresMatieres: string
  zoneEnseignement: string
  maxEleves: string
  accepteConditions: boolean
}

export default function InscriptionProfesseur() {
  const router = useRouter()
  const supabase = createClient()

  const [etape, setEtape] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  const [prof, setProf] = useState<Professeur>({
    nomComplet: '',
    email: '',
    motDePasse: '',
    telephone: '',
    whatsapp: '',
    quartier: '',
    bio: '',
    experienceAnnees: '',
    estEtudiant: false,
    statutUniversitaire: '',
    domaineEtude: '',
    niveauEtude: '',
    universite: '',
    aBacS: false,
    autresMatieres: '',
    zoneEnseignement: '',
    maxEleves: '',
    accepteConditions: false,
  })

  const [matieres, setMatieres] = useState<string[]>([])
  const [languesSpeciales, setLanguesSpeciales] = useState<string[]>([])
  const [precisionsLangues, setPrecisionsLangues] = useState<string[]>([])
  const [languesParlees, setLanguesParlees] = useState<string[]>([])

  const [disponibilites, setDisponibilites] = useState<{
    [jour: string]: string[]
  }>({
    Lundi: [],
    Mardi: [],
    Mercredi: [],
    Jeudi: [],
    Vendredi: [],
    Samedi: [],
    Dimanche: [],
  })

  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  const creneaux = [
    { val: 'matin', label: 'Matin', horaire: '8h - 12h', emoji: '🌅' },
    { val: 'apres_midi', label: 'Après-midi', horaire: '12h - 17h', emoji: '☀️' },
    { val: 'soir', label: 'Soir', horaire: '17h - 21h', emoji: '🌙' },
  ]

  const matieresPrimaire = [
    { val: 'primaire_fr', label: 'Primaire — Toutes matières francophones', besoinBacS: false },
    { val: 'primaire_ar', label: 'Primaire — Arabe', besoinBacS: false },
  ]

  const matieresCollege = [
    { val: 'college_maths', label: 'Collège — Maths', besoinBacS: true },
    { val: 'college_physique', label: 'Collège — Physique-Chimie', besoinBacS: true },
    { val: 'college_svt', label: 'Collège — SVT', besoinBacS: true },
    { val: 'college_francais', label: 'Collège — Français', besoinBacS: false },
    { val: 'college_anglais', label: 'Collège — Anglais', besoinBacS: false },
    { val: 'college_arabe', label: 'Collège — Arabe', besoinBacS: false },
  ]

  const matieresLycee = [
    { val: 'lycee_maths', label: 'Lycée — Maths', besoinBacS: true },
  ]

  // Formater un numéro : uniquement 8 chiffres, groupés par 2
  const formaterTelephone = (valeur: string) => {
    // Ne garder que les chiffres
    const chiffres = valeur.replace(/\D/g, '').slice(0, 8)
    // Grouper par 2 : 77 41 14 82
    const groupes: string[] = []
    for (let i = 0; i < chiffres.length; i += 2) {
      groupes.push(chiffres.slice(i, i + 2))
    }
    return groupes.join(' ')
  }

  // Validation email
  const emailValide = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const toggleMatieres = (val: string) => {
    const all = [...matieresPrimaire, ...matieresCollege, ...matieresLycee]
    const matiereInfo = all.find((x) => x.val === val)
    const besoinBacS = matiereInfo?.besoinBacS === true

    if (besoinBacS && !prof.aBacS) {
      setErreur("Vous devez avoir le Bac S (coché à l'étape 2) pour enseigner cette matière scientifique.")
      return
    }

    if (matieres.includes(val)) {
      setMatieres(matieres.filter((m) => m !== val))
    } else {
      setMatieres([...matieres, val])
    }
  }

  const toggleLangueSpeciale = (val: string) => {
    let nouvellesLangues: string[]
    let nouvellesPrecisions: string[]

    if (languesSpeciales.includes(val)) {
      nouvellesLangues = languesSpeciales.filter((l) => l !== val)
      nouvellesPrecisions = precisionsLangues.filter((p) => !p.startsWith(val))
    } else {
      nouvellesLangues = [...languesSpeciales, val]
      nouvellesPrecisions = precisionsLangues
    }

    setLanguesSpeciales(nouvellesLangues)
    setPrecisionsLangues(nouvellesPrecisions)
  }

  const togglePrecision = (val: string) => {
    if (precisionsLangues.includes(val)) {
      setPrecisionsLangues(precisionsLangues.filter((p) => p !== val))
    } else {
      setPrecisionsLangues([...precisionsLangues, val])
    }
  }

  const toggleLangueParlee = (val: string) => {
    if (languesParlees.includes(val)) {
      setLanguesParlees(languesParlees.filter((l) => l !== val))
    } else {
      setLanguesParlees([...languesParlees, val])
    }
  }

  const toggleDisponibilite = (jour: string, creneau: string) => {
    const actuel = disponibilites[jour] || []
    let nouveaux: string[]
    if (actuel.includes(creneau)) {
      nouveaux = actuel.filter((c) => c !== creneau)
    } else {
      nouveaux = [...actuel, creneau]
    }
    setDisponibilites({ ...disponibilites, [jour]: nouveaux })
  }

  const totalSeances = Object.values(disponibilites).flat().length

  const besoinBacS = () => {
    return matieres.some((m) => {
      const all = [...matieresPrimaire, ...matieresCollege, ...matieresLycee]
      const found = all.find((x) => x.val === m)
      return found?.besoinBacS === true
    })
  }

  const precisionsDisponibles = () => {
    const precisions: { val: string; label: string; emoji: string }[] = []
    if (languesSpeciales.includes('arabe')) {
      precisions.push(
        { val: 'arabe_debutant', label: 'Arabe — Débutant', emoji: '🅰️' },
        { val: 'arabe_conversation', label: 'Arabe — Conversation', emoji: '💬' },
        { val: 'arabe_grammaire', label: 'Arabe — Grammaire', emoji: '📚' },
        { val: 'arabe_perfectionnement', label: 'Arabe — Perfectionnement', emoji: '⭐' }
      )
    }
    if (languesSpeciales.includes('coran')) {
      precisions.push(
        { val: 'coran_lecture', label: 'Coran — Lecture', emoji: '📖' },
        { val: 'coran_tajwid', label: 'Coran — Tajwid', emoji: '🎵' },
        { val: 'coran_memorisation', label: 'Coran — Mémorisation', emoji: '🧠' },
        { val: 'coran_tafsir', label: 'Coran — Tafsir', emoji: '📜' }
      )
    }
    if (languesSpeciales.includes('francais')) {
      precisions.push(
        { val: 'francais_debutant', label: 'Français — Débutant', emoji: '🅰️' },
        { val: 'francais_conversation', label: 'Français — Conversation', emoji: '💬' },
        { val: 'francais_grammaire', label: 'Français — Grammaire', emoji: '📚' },
        { val: 'francais_perfectionnement', label: 'Français — Perfectionnement', emoji: '⭐' }
      )
    }
    if (languesSpeciales.includes('anglais')) {
      precisions.push(
        { val: 'anglais_debutant', label: 'Anglais — Débutant', emoji: '🅰️' },
        { val: 'anglais_conversation', label: 'Anglais — Conversation', emoji: '💬' },
        { val: 'anglais_grammaire', label: 'Anglais — Grammaire', emoji: '📚' },
        { val: 'anglais_perfectionnement', label: 'Anglais — Perfectionnement', emoji: '⭐' }
      )
    }
    return precisions
  }

  const validerEtape1 = () => {
    if (!prof.nomComplet.trim()) {
      setErreur('Veuillez entrer votre nom complet')
      return false
    }
    if (prof.nomComplet.trim().length < 3) {
      setErreur('Le nom doit contenir au moins 3 caractères')
      return false
    }
    if (!prof.email.trim()) {
      setErreur('Veuillez entrer votre email')
      return false
    }
    if (!emailValide(prof.email.trim())) {
      setErreur('Veuillez entrer un email valide (ex : nom@email.com)')
      return false
    }
    if (!prof.motDePasse) {
      setErreur('Veuillez entrer un mot de passe')
      return false
    }
    if (prof.motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }
    if (prof.telephone.length < 8) {
      setErreur('Veuillez entrer un numéro de téléphone valide (8 chiffres)')
      return false
    }
    if (prof.whatsapp.length < 8) {
      setErreur('Veuillez entrer un numéro WhatsApp valide (8 chiffres)')
      return false
    }
    if (prof.estEtudiant) {
      if (!prof.statutUniversitaire) {
        setErreur('Veuillez préciser votre statut universitaire')
        return false
      }
      if (!prof.domaineEtude.trim()) {
        setErreur("Veuillez renseigner votre domaine d'étude")
        return false
      }
      if (!prof.niveauEtude) {
        setErreur('Veuillez préciser votre niveau universitaire')
        return false
      }
      if (!prof.universite.trim()) {
        setErreur("Veuillez renseigner le nom de votre université")
        return false
      }
    }
    setErreur('')
    return true
  }

  const validerEtape2 = () => {
    if (besoinBacS() && !prof.aBacS) {
      setErreur('Le Bac S est obligatoire pour enseigner les matières scientifiques du collège ou du lycée')
      return false
    }
    setErreur('')
    return true
  }

  const validerEtape3 = () => {
    if (matieres.length === 0 && languesSpeciales.length === 0) {
      setErreur('Veuillez choisir au moins une matière ou une langue à enseigner')
      return false
    }
    if (languesSpeciales.length > 0 && precisionsLangues.length === 0) {
      setErreur('Veuillez préciser le type de cours pour les langues sélectionnées')
      return false
    }
    if (!prof.zoneEnseignement) {
      setErreur("Veuillez choisir votre zone d'enseignement")
      return false
    }
    setErreur('')
    return true
  }

  const validerEtape4 = () => {
    if (totalSeances < 4) {
      setErreur(`Minimum 4 séances par semaine. Vous en avez actuellement ${totalSeances}.`)
      return false
    }
    setErreur('')
    return true
  }

  const validerEtape5 = () => {
    if (!prixMin || !prixMax) {
      setErreur('Veuillez indiquer vos prix minimum et maximum')
      return false
    }
    if (Number(prixMin) <= 0 || Number(prixMax) <= 0) {
      setErreur('Les prix doivent être supérieurs à 0')
      return false
    }
    if (Number(prixMin) > Number(prixMax)) {
      setErreur('Le prix minimum ne peut pas être supérieur au prix maximum')
      return false
    }
    if (!prof.accepteConditions) {
      setErreur("Veuillez accepter les conditions d'utilisation")
      return false
    }
    setErreur('')
    return true
  }

  const suivant = () => {
    if (etape === 1 && !validerEtape1()) return
    if (etape === 2 && !validerEtape2()) return
    if (etape === 3 && !validerEtape3()) return
    if (etape === 4 && !validerEtape4()) return
    setEtape(etape + 1)
  }

  const precedent = () => {
    setErreur('')
    setEtape(etape - 1)
  }

  const soumettre = async () => {
    if (!validerEtape5()) return

    setLoading(true)
    setErreur('')

    try {
      const response = await fetch('/api/creer-utilisateur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: prof.email.trim().toLowerCase(),
          password: prof.motDePasse,
          nomComplet: prof.nomComplet.trim(),
          role: 'professeur',
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        if (result.error?.includes('already')) {
          setErreur('Cet email est déjà utilisé. Connectez-vous plutôt.')
        } else {
          setErreur(`Erreur : ${result.error || 'inconnue'}`)
        }
        setLoading(false)
        return
      }

      const userId = result.userId

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: prof.email.trim().toLowerCase(),
        password: prof.motDePasse,
      })

      if (signInError) {
        console.error('Erreur signIn:', JSON.stringify(signInError, null, 2))
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          telephone: `+253 ${prof.telephone.trim()}`,
          whatsapp: `+253 ${prof.whatsapp.trim()}`,
          quartier: prof.quartier.trim(),
          bio: prof.bio.trim(),
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Erreur profil:', JSON.stringify(profileError, null, 2))
      }

      const { error: profError } = await supabase.from('professeurs').insert({
        id: userId,
        experience_annees: Number(prof.experienceAnnees) || 0,
        a_bac_s: prof.aBacS,
        est_etudiant: prof.estEtudiant,
        statut_universitaire: prof.statutUniversitaire || null,
        domaine_etude: prof.domaineEtude.trim() || null,
        niveau_etude: prof.niveauEtude || null,
        universite: prof.universite.trim() || null,
        zone_enseignement: prof.zoneEnseignement,
        max_eleves: Number(prof.maxEleves) || null,
        prix_min: Number(prixMin),
        prix_max: Number(prixMax),
        autres_matieres: prof.autresMatieres.trim() || null,
        accepte_conditions: prof.accepteConditions,
      })

      if (profError) {
        console.error('Erreur professeur:', JSON.stringify(profError, null, 2))
      }

      if (matieres.length > 0) {
        const matieresData = matieres.map((m) => ({
          professeur_id: userId,
          matiere: m,
        }))
        const { error: matErr } = await supabase.from('matieres_par_prof').insert(matieresData)
        if (matErr) console.error('Erreur matières:', JSON.stringify(matErr, null, 2))
      }

      if (languesParlees.length > 0) {
        const languesData = languesParlees.map((l) => ({
          professeur_id: userId,
          langue: l,
        }))
        const { error: langErr } = await supabase.from('langues_par_prof').insert(languesData)
        if (langErr) console.error('Erreur langues:', JSON.stringify(langErr, null, 2))
      }

      const disposData: { professeur_id: string; jour: string; creneau: string }[] = []
      Object.entries(disponibilites).forEach(([jour, creneauxJour]) => {
        creneauxJour.forEach((creneau) => {
          disposData.push({
            professeur_id: userId,
            jour,
            creneau,
          })
        })
      })

      if (disposData.length > 0) {
        const { error: dispoErr } = await supabase.from('disponibilites').insert(disposData)
        if (dispoErr) console.error('Erreur dispos:', JSON.stringify(dispoErr, null, 2))
      }

      alert('🎉 Inscription réussie !\n\nBienvenue sur Prof À Domicile Djibouti. Complétez vos documents dans votre espace pour être vérifié.')
      router.push('/espace-professeur/documents')
    } catch (err) {
      console.error('Erreur générale:', err)
      setErreur('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const etapes = [
    { num: 1, titre: 'Vos informations', desc: 'Nom, email, contact' },
    { num: 2, titre: 'Vérification', desc: 'Diplômes, identité' },
    { num: 3, titre: 'Matières', desc: 'Ce que vous enseignez' },
    { num: 4, titre: 'Disponibilités', desc: 'Minimum 4 séances/sem' },
    { num: 5, titre: 'Tarifs & Conditions', desc: 'Prix et validation' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 relative overflow-hidden">
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <nav className="relative z-10 backdrop-blur-md bg-white/70 border-b border-white/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Prof À Domicile
            </span>
            <span className="text-xl">🇩🇯</span>
          </Link>
          <a
            href="https://wa.me/25377741482"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
          >
            💬 Aide
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/80 shadow-sm mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Inscription professeur · Vérifiée
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Devenez professeur
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
              à domicile à Djibouti
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Rejoignez notre communauté de professeurs vérifiés et trouvez des élèves près de chez vous.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-xl shadow-blue-900/5 sticky top-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                Votre progression
              </h3>
              <div className="space-y-1">
                {etapes.map((e) => (
                  <div key={e.num} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{
                          scale: etape === e.num ? 1.1 : 1,
                          backgroundColor:
                            etape > e.num
                              ? '#059669'
                              : etape === e.num
                              ? '#1d4ed8'
                              : '#e2e8f0',
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                      >
                        {etape > e.num ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          e.num
                        )}
                      </motion.div>
                      {e.num < 5 && (
                        <div
                          className={`w-0.5 h-10 my-1 transition-colors ${
                            etape > e.num ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-2 pb-4">
                      <div
                        className={`font-bold text-sm transition-colors ${
                          etape >= e.num ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {e.titre}
                      </div>
                      <div className="text-xs text-slate-500">{e.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200/70 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">🔒</span>
                  <span>Données chiffrées</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">✅</span>
                  <span>Vérification sous 24h</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-base">🇩🇯</span>
                  <span>100% djiboutien</span>
                </div>
              </div>
            </div>
          </motion.aside>

          <div className="lg:col-span-1">
            <div className="lg:hidden mb-6 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    n <= etape
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-700'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence>
              {erreur && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl p-4 flex items-start gap-3"
                >
                  <span className="text-xl">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{erreur}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl shadow-blue-900/10 overflow-hidden">
              <AnimatePresence mode="wait">
                {/* ÉTAPE 1 */}
                {etape === 1 && (
                  <motion.div
                    key="etape1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                        Étape 1 / 5
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos informations</h2>
                      <p className="text-slate-500 mt-2">Ces informations resteront confidentielles.</p>
                    </div>

                    <div className="space-y-5">
                      <Field
                        label="Nom complet"
                        required
                        value={prof.nomComplet}
                        onChange={(v) => setProf({ ...prof, nomComplet: v })}
                        placeholder="Ex : Mohamed Ali"
                      />
                      <Field
                        label="Email"
                        required
                        type="email"
                        value={prof.email}
                        onChange={(v) => setProf({ ...prof, email: v })}
                        placeholder="exemple@email.com"
                      />
                      <Field
                        label="Mot de passe"
                        required
                        type="password"
                        value={prof.motDePasse}
                        onChange={(v) => setProf({ ...prof, motDePasse: v })}
                        placeholder="Au moins 6 caractères"
                        hint="Utilisez un mélange de lettres et de chiffres"
                      />
                      <div className="grid md:grid-cols-2 gap-5">
                        <TelephoneField
                          label="Téléphone"
                          required
                          value={prof.telephone}
                          onChange={(v) => setProf({ ...prof, telephone: v })}
                        />
                        <TelephoneField
                          label="WhatsApp"
                          required
                          value={prof.whatsapp}
                          onChange={(v) => setProf({ ...prof, whatsapp: v })}
                        />
                      </div>
                      <Field
                        label="Quartier à Djibouti"
                        value={prof.quartier}
                        onChange={(v) => setProf({ ...prof, quartier: v })}
                        placeholder="Ex : Héron, Balbala, Centre-ville..."
                      />
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Bio / Présentation
                        </label>
                        <textarea
                          value={prof.bio}
                          onChange={(e) => setProf({ ...prof, bio: e.target.value })}
                          rows={3}
                          maxLength={500}
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-800 resize-none"
                          placeholder="Décrivez votre parcours, votre pédagogie..."
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {prof.bio.length}/500 caractères
                        </p>
                      </div>
                      <Field
                        label="Années d'expérience"
                        type="number"
                        value={prof.experienceAnnees}
                        onChange={(v) => setProf({ ...prof, experienceAnnees: v })}
                        placeholder="Ex : 3"
                      />

                      <div className="bg-purple-50/70 rounded-2xl p-5 border-2 border-purple-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prof.estEtudiant}
                            onChange={(e) => setProf({ ...prof, estEtudiant: e.target.checked })}
                            className="w-5 h-5 accent-purple-700"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-800">
                              🎓 J'ai un parcours universitaire
                            </div>
                            <div className="text-xs text-slate-600">
                              Étudiant actuel, diplômé, ou ancien étudiant
                            </div>
                          </div>
                        </label>

                        <AnimatePresence>
                          {prof.estEtudiant && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 space-y-4"
                            >
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                  Votre statut actuel <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { val: 'actuel', label: 'Étudiant actuel', emoji: '📚' },
                                    { val: 'diplome', label: 'Diplômé', emoji: '✅' },
                                    { val: 'quitte', label: "J'ai quitté", emoji: '🚪' },
                                  ].map((s) => {
                                    const actif = prof.statutUniversitaire === s.val
                                    return (
                                      <motion.button
                                        key={s.val}
                                        type="button"
                                        whileHover={{ scale: actif ? 1.03 : 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setProf({ ...prof, statutUniversitaire: s.val })}
                                        className={`relative py-3 rounded-xl font-bold text-xs transition-all duration-200 flex flex-col items-center gap-1 ${
                                          actif
                                            ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-600/40 border-4 border-purple-800 scale-105'
                                            : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-purple-300'
                                        }`}
                                      >
                                        {actif && (
                                          <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-purple-600"
                                          >
                                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </motion.div>
                                        )}
                                        <span className="text-lg">{s.emoji}</span>
                                        <span>{s.label}</span>
                                      </motion.button>
                                    )
                                  })}
                                </div>
                              </div>

                              <Field
                                label="Domaine d'étude"
                                required
                                value={prof.domaineEtude}
                                onChange={(v) => setProf({ ...prof, domaineEtude: v })}
                                placeholder="Ex : Mathématiques, Physique..."
                              />

                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                  Niveau universitaire atteint <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={prof.niveauEtude}
                                  onChange={(e) => setProf({ ...prof, niveauEtude: e.target.value })}
                                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-medium"
                                >
                                  <option value="">Sélectionnez votre niveau</option>
                                  <option value="L1">Licence 1</option>
                                  <option value="L2">Licence 2</option>
                                  <option value="L3">Licence 3</option>
                                  <option value="M1">Master 1</option>
                                  <option value="M2">Master 2</option>
                                  <option value="Doctorat">Doctorat</option>
                                </select>
                              </div>

                              <Field
                                label="Université / Établissement"
                                required
                                value={prof.universite}
                                onChange={(v) => setProf({ ...prof, universite: v })}
                                placeholder="Ex : Université de Djibouti..."
                              />

                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-start gap-3">
                                  <span className="text-xl">🏅</span>
                                  <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-800 mb-1">
                                      Badge de vérification (facultatif)
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">
                                      Contactez-nous après inscription pour le badge bleu vérifié.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <a
                                        href="https://wa.me/25377741482"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600"
                                      >
                                        💬 WhatsApp
                                      </a>
                                      <a
                                        href="mailto:contact@profadomicile.dj"
                                        className="inline-flex items-center gap-1 bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-800"
                                      >
                                        ✉️ Email
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 2 */}
                {etape === 2 && (
                  <motion.div
                    key="etape2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                        Étape 2 / 5
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vérification</h2>
                      <p className="text-slate-500 mt-2">
                        Ces informations seront vérifiées sous 24h.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-blue-50/50 rounded-2xl p-5 border-2 border-blue-200">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="text-2xl">🆔</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-slate-900">
                                Carte d'identité nationale
                              </span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                Facultatif
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              Réservé aux citoyens djiboutiens. Bien que facultatif, fournir votre carte d'identité <strong>boostera votre profil</strong>.
                            </div>
                          </div>
                        </div>
                        <div className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-6 text-center">
                          <p className="text-sm text-slate-600">
                            📎 Vous pourrez uploader votre carte d'identité dans votre espace personnel après inscription.
                          </p>
                        </div>
                      </div>

                      <div className="bg-amber-50/50 rounded-2xl p-5 border-2 border-amber-200">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="text-2xl">🎓</span>
                          <div>
                            <div className="font-bold text-slate-900">
                              Baccalauréat Scientifique (Bac S)
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              <strong>Obligatoire</strong> pour enseigner les matières scientifiques.
                            </div>
                          </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/70 transition-colors">
                          <input
                            type="checkbox"
                            checked={prof.aBacS}
                            onChange={(e) => setProf({ ...prof, aBacS: e.target.checked })}
                            className="w-5 h-5 accent-emerald-700"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            J'ai obtenu un Bac S
                          </span>
                        </label>

                        {prof.aBacS && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 bg-red-50 border-l-4 border-red-500 p-3 rounded-lg"
                          >
                            <p className="text-xs text-red-800 font-bold">
                              ⚠️ Vous devrez OBLIGATOIREMENT fournir le scan de votre diplôme Bac S dans votre espace personnel pour être vérifié.
                            </p>
                          </motion.div>
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="text-2xl">📸</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-slate-900">Photo de profil</span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                Facultatif
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              Les profs avec photo reçoivent <strong>3x plus de demandes</strong>.
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                          <p className="text-xs text-blue-800">
                            💡 <strong>Vous pourrez ajouter votre photo à tout moment</strong> depuis votre espace personnel.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 3 */}
                {etape === 3 && (
                  <motion.div
                    key="etape3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                        Étape 3 / 5
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Matières & Langues</h2>
                      <p className="text-slate-500 mt-2">Ce que vous enseignez et où.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white/70 rounded-2xl p-5 border-2 border-blue-100">
                        <div className="font-bold text-blue-700 mb-3">🎒 Primaire</div>
                        <div className="space-y-2">
                          {matieresPrimaire.map((m) => {
                            const actif = matieres.includes(m.val)
                            return (
                              <motion.button
                                key={m.val}
                                type="button"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => toggleMatieres(m.val)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                  actif
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-slate-200 bg-white hover:border-blue-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${actif ? 'bg-blue-700 border-blue-700' : 'border-slate-300'}`}>
                                  {actif && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-slate-800">{m.label}</span>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-2xl p-5 border-2 border-indigo-100">
                        <div className="font-bold text-indigo-700 mb-3 flex items-center gap-2 flex-wrap">
                          📖 Collège
                          {!prof.aBacS && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                              🔒 Bac S requis pour Maths/Physique/SVT
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {matieresCollege.map((m) => {
                            const actif = matieres.includes(m.val)
                            const bloque = m.besoinBacS && !prof.aBacS
                            return (
                              <motion.button
                                key={m.val}
                                type="button"
                                whileHover={{ scale: bloque ? 1 : 1.01 }}
                                whileTap={{ scale: bloque ? 1 : 0.99 }}
                                onClick={() => toggleMatieres(m.val)}
                                disabled={bloque}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                  bloque
                                    ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                                    : actif
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-slate-200 bg-white hover:border-indigo-300 cursor-pointer'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                  actif ? 'bg-indigo-700 border-indigo-700' : bloque ? 'border-slate-300 bg-slate-200' : 'border-slate-300'
                                }`}>
                                  {actif && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {bloque && <span className="text-xs">🔒</span>}
                                </div>
                                <span className={`text-sm font-medium ${bloque ? 'text-slate-400' : 'text-slate-800'}`}>
                                  {m.label}
                                </span>
                                {m.besoinBacS && (
                                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    bloque ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {bloque ? '🔒 Bac S' : 'Bac S'}
                                  </span>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-2xl p-5 border-2 border-purple-100">
                        <div className="font-bold text-purple-700 mb-3 flex items-center gap-2 flex-wrap">
                          🎓 Lycée
                          {!prof.aBacS && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                              🔒 Bac S requis
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {matieresLycee.map((m) => {
                            const actif = matieres.includes(m.val)
                            const bloque = m.besoinBacS && !prof.aBacS
                            return (
                              <motion.button
                                key={m.val}
                                type="button"
                                whileHover={{ scale: bloque ? 1 : 1.01 }}
                                whileTap={{ scale: bloque ? 1 : 0.99 }}
                                onClick={() => toggleMatieres(m.val)}
                                disabled={bloque}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                  bloque
                                    ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                                    : actif
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-slate-200 bg-white hover:border-purple-300 cursor-pointer'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                  actif ? 'bg-purple-700 border-purple-700' : bloque ? 'border-slate-300 bg-slate-200' : 'border-slate-300'
                                }`}>
                                  {actif && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {bloque && <span className="text-xs">🔒</span>}
                                </div>
                                <span className={`text-sm font-medium ${bloque ? 'text-slate-400' : 'text-slate-800'}`}>
                                  {m.label}
                                </span>
                                {m.besoinBacS && (
                                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    bloque ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {bloque ? '🔒 Bac S' : 'Bac S'}
                                  </span>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-2xl p-5 border-2 border-pink-100">
                        <div className="font-bold text-pink-700 mb-2 flex items-center gap-2">
                          📕 Langues & Coran
                          <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">🆕</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                          Cochez les langues et/ou le Coran que vous pouvez enseigner.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {[
                            { val: 'arabe', label: 'Arabe' },
                            { val: 'coran', label: 'Coran' },
                            { val: 'francais', label: 'Français' },
                            { val: 'anglais', label: 'Anglais' },
                          ].map((l) => {
                            const actif = languesSpeciales.includes(l.val)
                            return (
                              <motion.button
                                key={l.val}
                                type="button"
                                whileHover={{ scale: actif ? 1.03 : 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleLangueSpeciale(l.val)}
                                className={`relative py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                                  actif
                                    ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-xl shadow-pink-600/40 border-4 border-pink-800 scale-105'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-pink-300'
                                }`}
                              >
                                {actif && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-pink-600"
                                  >
                                    <svg className="w-3 h-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </motion.div>
                                )}
                                {l.label}
                              </motion.button>
                            )
                          })}
                        </div>

                        {precisionsDisponibles().length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-4 border-t border-pink-100"
                          >
                            <div className="text-xs font-bold text-pink-700 mb-3">
                              🎯 Précisez ce que vous pouvez enseigner :
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {precisionsDisponibles().map((p) => {
                                const actif = precisionsLangues.includes(p.val)
                                return (
                                  <motion.button
                                    key={p.val}
                                    type="button"
                                    whileHover={{ scale: actif ? 1.02 : 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => togglePrecision(p.val)}
                                    className={`p-3 rounded-xl font-bold text-xs border-2 transition-all flex items-center gap-2 ${
                                      actif
                                        ? 'border-pink-600 bg-pink-600 text-white shadow-lg'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-pink-300'
                                    }`}
                                  >
                                    <span>{p.emoji}</span>
                                    <span>{p.label}</span>
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="bg-white/70 rounded-2xl p-5 border-2 border-slate-200">
                        <div className="font-bold text-slate-700 mb-2">
                          ✏️ Autres matières (optionnel)
                        </div>
                        <textarea
                          value={prof.autresMatieres}
                          onChange={(e) => setProf({ ...prof, autresMatieres: e.target.value })}
                          rows={2}
                          maxLength={300}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                          placeholder="Ex : Informatique, Soutien scolaire..."
                        />
                      </div>

                      <div className="bg-white/70 rounded-2xl p-5 border-2 border-emerald-100">
                        <div className="font-bold text-emerald-700 mb-3">
                          💬 Langues que vous parlez
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { val: 'francais', label: 'Français' },
                            { val: 'arabe', label: 'Arabe' },
                            { val: 'somali', label: 'Somali' },
                            { val: 'afar', label: 'Afar' },
                            { val: 'anglais', label: 'Anglais' },
                          ].map((l) => {
                            const actif = languesParlees.includes(l.val)
                            return (
                              <motion.button
                                key={l.val}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleLangueParlee(l.val)}
                                className={`p-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                  actif
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                                }`}
                              >
                                {l.label}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-2xl p-5 border-2 border-slate-200">
                        <div className="font-bold text-slate-800 mb-3">
                          🏠 Zone d'enseignement <span className="text-red-500">*</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { val: 'chez_moi', label: 'Chez moi uniquement', emoji: '🏠' },
                            { val: 'chez_eleve', label: "Chez l'élève uniquement", emoji: '🚶' },
                            { val: 'les_deux', label: 'Les deux possibles', emoji: '🔄' },
                          ].map((z) => {
                            const actif = prof.zoneEnseignement === z.val
                            return (
                              <motion.button
                                key={z.val}
                                type="button"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setProf({ ...prof, zoneEnseignement: z.val })}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                  actif
                                    ? 'border-emerald-600 bg-emerald-50 shadow-lg'
                                    : 'border-slate-200 bg-white hover:border-emerald-300'
                                }`}
                              >
                                <span className="text-xl">{z.emoji}</span>
                                <span className="text-sm font-medium text-slate-800">{z.label}</span>
                                {actif && (
                                  <svg className="w-5 h-5 text-emerald-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      <Field
                        label="Nombre maximum d'élèves simultanés"
                        type="number"
                        value={prof.maxEleves}
                        onChange={(v) => setProf({ ...prof, maxEleves: v })}
                        placeholder="Ex : 3"
                      />
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 4 */}
                {etape === 4 && (
                  <motion.div
                    key="etape4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                        Étape 4 / 5
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Vos disponibilités</h2>
                      <p className="text-slate-500 mt-2">Cochez les créneaux où vous êtes disponible.</p>
                    </div>

                    <motion.div
                      animate={{
                        backgroundColor: totalSeances >= 4 ? '#ecfdf5' : '#fef3c7',
                        borderColor: totalSeances >= 4 ? '#10b981' : '#f59e0b',
                      }}
                      className="rounded-2xl p-5 border-2 mb-6"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="font-bold text-slate-900">
                            {totalSeances >= 4 ? '✓' : '⏳'} {totalSeances} séance{totalSeances > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            Minimum requis : <strong>4 séances par semaine</strong>
                          </div>
                        </div>
                        {totalSeances >= 4 ? (
                          <span className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold">
                            ✓ Validé
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-full font-bold">
                            Encore {4 - totalSeances}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${Math.min((totalSeances / 4) * 100, 100)}%` }}
                          transition={{ duration: 0.4 }}
                          className={`h-full ${
                            totalSeances >= 4
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                              : 'bg-gradient-to-r from-amber-500 to-amber-400'
                          }`}
                        />
                      </div>
                    </motion.div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl mb-6">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Astuce :</strong> Vous pourrez <strong>modifier vos horaires à tout moment</strong> depuis votre espace personnel.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {jours.map((jour) => (
                        <div key={jour} className="bg-white/70 rounded-2xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-slate-800">{jour}</div>
                            {disponibilites[jour]?.length > 0 && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                {disponibilites[jour].length} créneau{disponibilites[jour].length > 1 ? 'x' : ''}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {creneaux.map((c) => {
                              const actif = disponibilites[jour]?.includes(c.val)
                              return (
                                <motion.button
                                  key={c.val}
                                  type="button"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => toggleDisponibilite(jour, c.val)}
                                  className={`p-3 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-1 relative ${
                                    actif
                                      ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg border-2 border-emerald-700'
                                      : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-emerald-300'
                                  }`}
                                >
                                  {actif && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-emerald-600">
                                      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                  <span className="text-lg">{c.emoji}</span>
                                  <span>{c.label}</span>
                                  <span className={`text-[10px] ${actif ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {c.horaire}
                                  </span>
                                </motion.button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 5 */}
                {etape === 5 && (
                  <motion.div
                    key="etape5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="p-8 md:p-10"
                  >
                    <div className="mb-8">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                        Étape 5 / 5
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">Tarifs & Conditions</h2>
                      <p className="text-slate-500 mt-2">
                        Dernière étape avant de rejoindre la plateforme.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl">
                        <p className="text-xs text-amber-800">
                          🔒 <strong>Confidentiel :</strong> Les prix ne sont <strong>PAS visibles</strong> par les parents. Les prix réels se négocient après la rencontre.
                        </p>
                      </div>

                      <Field
                        label="Prix minimum envisagé (par mois, en DJF)"
                        type="number"
                        value={prixMin}
                        onChange={setPrixMin}
                        placeholder="Ex : 15000"
                      />
                      <Field
                        label="Prix maximum envisagé (par mois, en DJF)"
                        type="number"
                        value={prixMax}
                        onChange={setPrixMax}
                        placeholder="Ex : 35000"
                      />

                      <div className="bg-blue-50/50 rounded-2xl p-5 border-2 border-blue-200">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prof.accepteConditions}
                            onChange={(e) => setProf({ ...prof, accepteConditions: e.target.checked })}
                            className="mt-1 w-5 h-5 accent-emerald-700"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-bold text-slate-800">
                              J'accepte les conditions d'utilisation <span className="text-red-500">*</span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              • Fournir un enseignement de qualité<br />
                              • Respecter les familles et les élèves<br />
                              • Fournir mes documents pour vérification<br />
                              • Respecter la charte qualité de la plateforme
                            </div>
                          </div>
                        </label>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-5 rounded-2xl border border-emerald-100">
                        <div className="flex gap-3">
                          <span className="text-xl">✅</span>
                          <div>
                            <p className="text-sm font-semibold text-emerald-900 mb-1">
                              Prêt à rejoindre la plateforme !
                            </p>
                            <p className="text-sm text-emerald-800">
                              Après validation (sous 24h), votre profil apparaîtra dans les recherches des parents.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-slate-200/70 bg-white/60 backdrop-blur-sm p-6 md:p-8 flex gap-4">
                {etape > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={precedent}
                    disabled={loading}
                    className="px-6 py-4 rounded-2xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    ← Précédent
                  </motion.button>
                )}
                {etape < 5 ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={suivant}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-700 shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all"
                  >
                    Continuer →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    onClick={soumettre}
                    disabled={loading}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Création du compte...
                      </>
                    ) : (
                      '✓ Créer mon compte prof'
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            <div className="text-center mt-6">
              <a
                href="https://wa.me/25377741482"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-2"
              >
                💬 Besoin d'aide ? Contactez-nous sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// COMPOSANT FIELD (pour les champs texte normaux)
// ═══════════════════════════════════════════════════════
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
      />
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// COMPOSANT TELEPHONE FIELD (avec +253 fixe et formatage)
// ═══════════════════════════════════════════════════════
function TelephoneField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  const formaterTelephone = (valeur: string) => {
    const chiffres = valeur.replace(/\D/g, '').slice(0, 8)
    const groupes: string[] = []
    for (let i = 0; i < chiffres.length; i += 2) {
      groupes.push(chiffres.slice(i, i + 2))
    }
    return groupes.join(' ')
  }

  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all overflow-hidden">
        {/* Préfixe fixe */}
        <div className="px-4 py-3.5 bg-slate-100 border-r border-slate-200 font-bold text-slate-700 flex items-center gap-2 flex-shrink-0">
          <span>🇩🇯</span>
          <span>+253</span>
        </div>
        {/* Champ de saisie */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9 ]*"
          value={value}
          onChange={(e) => onChange(formaterTelephone(e.target.value))}
          placeholder="77 41 14 82"
          maxLength={11}
          className="flex-1 px-4 py-3.5 bg-transparent outline-none font-medium text-slate-800 placeholder:text-slate-400"
        />
      </div>
      <p className="text-xs text-slate-500 mt-1.5">
        Entrez 8 chiffres (uniquement des chiffres)
      </p>
    </div>
  )
}
