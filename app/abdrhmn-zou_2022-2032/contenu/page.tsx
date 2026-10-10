'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// TYPES
// ============================================================

type Langue = 'fr' | 'ar' | 'en'

type TexteMultiLangue = {
  fr: string
  ar: string
  en: string
}

type ItemSection = {
  id: string
  emoji: string
  titre: TexteMultiLangue
  description: TexteMultiLangue
}

type SectionType =
  | 'hero'
  | 'etapes'
  | 'matieres'
  | 'temoignages'
  | 'avantages'
  | 'cta'
  | 'stats'
  | 'faq'
  | 'custom'

type Section = {
  id: string
  type: SectionType
  emoji: string
  nom: string
  actif: boolean
  ordre: number
  titre: TexteMultiLangue
  sous_titre: TexteMultiLangue
  bouton: TexteMultiLangue
  items: ItemSection[]
}

type General = {
  nom_site: TexteMultiLangue
  slogan: TexteMultiLangue
  description: TexteMultiLangue
  email: string
  telephone: string
  whatsapp: string
  footer_description: TexteMultiLangue
  footer_copyright: TexteMultiLangue
}

type MenuItems = {
  accueil: TexteMultiLangue
  profs: TexteMultiLangue
  inscription: TexteMultiLangue
  login: TexteMultiLangue
}

type SEO = {
  meta_titre: TexteMultiLangue
  meta_description: TexteMultiLangue
  meta_mots_cles: TexteMultiLangue
}

type PageTexte = {
  inscription_titre: TexteMultiLangue
  inscription_sous_titre: TexteMultiLangue
  login_titre: TexteMultiLangue
  login_sous_titre: TexteMultiLangue
}

type ContenuSite = {
  version: number
  langues: Langue[]
  general: General
  menu: MenuItems
  seo: SEO
  pages: PageTexte
  sections: Section[]
}

type Version = {
  id: string
  date: string
  contenu: ContenuSite
  note: string
  publie: boolean
}

type OngletPrincipal = 'general' | 'menu' | 'seo' | 'pages' | 'sections' | 'apercu' | 'historique'

// ============================================================
// HELPERS
// ============================================================

const VIDE: TexteMultiLangue = { fr: '', ar: '', en: '' }

const genererId = (prefixe: string) =>
  `${prefixe}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const creerItem = (emoji = '⭐'): ItemSection => ({
  id: genererId('item'),
  emoji,
  titre: { ...VIDE },
  description: { ...VIDE },
})

const creerSection = (type: SectionType, ordre: number): Section => {
  const base: Section = {
    id: genererId('section'),
    type,
    emoji: '📝',
    nom: 'Nouvelle section',
    actif: true,
    ordre,
    titre: { ...VIDE },
    sous_titre: { ...VIDE },
    bouton: { ...VIDE },
    items: [],
  }

  const config: { [k in SectionType]: Partial<Section> } = {
    hero: {
      emoji: '🎯',
      nom: 'Hero (bannière principale)',
      titre: {
        fr: 'Trouvez le professeur idéal',
        ar: 'اعثر على المدرس المثالي',
        en: 'Find the perfect teacher',
      },
      sous_titre: {
        fr: 'Cours à domicile pour vos enfants à Djibouti',
        ar: 'دروس منزلية لأطفالك في جيبوتي',
        en: 'Home lessons for your children in Djibouti',
      },
      bouton: {
        fr: 'Commencer',
        ar: 'ابدأ',
        en: 'Get started',
      },
      items: [],
    },
    etapes: {
      emoji: '📖',
      nom: 'Comment ça marche',
      titre: { fr: 'Comment ça marche ?', ar: 'كيف يعمل؟', en: 'How it works?' },
      sous_titre: { fr: 'En 3 étapes simples', ar: 'في 3 خطوات', en: 'In 3 simple steps' },
      items: [
        { ...creerItem('1️⃣'), titre: { fr: 'Inscrivez-vous', ar: 'سجل', en: 'Sign up' } },
        { ...creerItem('2️⃣'), titre: { fr: 'Choisissez', ar: 'اختر', en: 'Choose' } },
        { ...creerItem('3️⃣'), titre: { fr: 'Commencez', ar: 'ابدأ', en: 'Start' } },
      ],
    },
    matieres: {
      emoji: '📚',
      nom: 'Matières',
      titre: { fr: 'Nos matières', ar: 'موادنا', en: 'Our subjects' },
      sous_titre: { fr: 'Tous les niveaux', ar: 'جميع المستويات', en: 'All levels' },
      items: [
        { ...creerItem('🎒'), titre: { fr: 'Primaire', ar: 'الابتدائي', en: 'Primary' } },
        { ...creerItem('📖'), titre: { fr: 'Collège', ar: 'الإعدادي', en: 'Middle school' } },
        { ...creerItem('🎓'), titre: { fr: 'Lycée', ar: 'الثانوي', en: 'High school' } },
      ],
    },
    temoignages: {
      emoji: '💬',
      nom: 'Témoignages',
      titre: { fr: 'Ils nous font confiance', ar: 'يثقون بنا', en: 'They trust us' },
      sous_titre: { fr: 'Avis de parents', ar: 'آراء الآباء', en: 'Parent reviews' },
      items: [creerItem('👨'), creerItem('👩'), creerItem('👨‍🦱')],
    },
    avantages: {
      emoji: '⭐',
      nom: 'Avantages',
      titre: { fr: 'Pourquoi nous choisir ?', ar: 'لماذا تختارنا؟', en: 'Why choose us?' },
      sous_titre: { fr: 'Nos points forts', ar: 'نقاط قوتنا', en: 'Our strengths' },
      items: [
        { ...creerItem('✅'), titre: { fr: 'Gratuit', ar: 'مجاني', en: 'Free' } },
        { ...creerItem('✅'), titre: { fr: 'Rapide', ar: 'سريع', en: 'Fast' } },
        { ...creerItem('✅'), titre: { fr: 'Sécurisé', ar: 'آمن', en: 'Secure' } },
      ],
    },
    cta: {
      emoji: '📞',
      nom: 'Appel à l\'action',
      titre: { fr: 'Besoin d\'aide ?', ar: 'تحتاج مساعدة؟', en: 'Need help?' },
      sous_titre: { fr: 'Contactez-nous sur WhatsApp', ar: 'تواصل معنا', en: 'Contact us on WhatsApp' },
      bouton: { fr: 'Nous contacter', ar: 'اتصل بنا', en: 'Contact us' },
      items: [],
    },
    stats: {
      emoji: '📊',
      nom: 'Statistiques',
      titre: { fr: 'Nos chiffres', ar: 'أرقامنا', en: 'Our numbers' },
      sous_titre: { ...VIDE },
      items: [
        { ...creerItem('👥'), titre: { fr: '500+ parents', ar: '+500 والد', en: '500+ parents' } },
        { ...creerItem('📚'), titre: { fr: '200+ profs', ar: '+200 مدرس', en: '200+ tutors' } },
        { ...creerItem('⭐'), titre: { fr: '4.8/5 étoiles', ar: '4.8/5 نجوم', en: '4.8/5 stars' } },
      ],
    },
    faq: {
      emoji: '❓',
      nom: 'FAQ',
      titre: { fr: 'Questions fréquentes', ar: 'الأسئلة الشائعة', en: 'Frequently asked questions' },
      sous_titre: { fr: 'Vos réponses ici', ar: 'إجاباتك هنا', en: 'Your answers here' },
      items: [creerItem('❓'), creerItem('❓'), creerItem('❓')],
    },
    custom: {
      emoji: '🆕',
      nom: 'Section personnalisée',
      titre: { fr: 'Titre', ar: 'عنوان', en: 'Title' },
      sous_titre: { ...VIDE },
      items: [creerItem('⭐')],
    },
  }

  return { ...base, ...config[type] }
}

const contenuParDefaut = (): ContenuSite => ({
  version: 2,
  langues: ['fr', 'ar', 'en'],
  general: {
    nom_site: {
      fr: 'Prof À Domicile Djibouti',
      ar: 'مدرس في المنزل جيبوتي',
      en: 'Home Tutor Djibouti',
    },
    slogan: {
      fr: 'Trouvez le professeur idéal',
      ar: 'اعثر على المدرس المثالي',
      en: 'Find the perfect teacher',
    },
    description: {
      fr: 'Plateforme de mise en relation entre parents et professeurs.',
      ar: 'منصة تربط الآباء والمدرسين.',
      en: 'Platform connecting parents and tutors.',
    },
    email: 'contact@profadomicile.dj',
    telephone: '+253 77 74 14 82',
    whatsapp: '+253 77 74 14 82',
    footer_description: {
      fr: 'La plateforme éducative de référence à Djibouti.',
      ar: 'المنصة التعليمية المرجعية في جيبوتي.',
      en: 'The reference educational platform in Djibouti.',
    },
    footer_copyright: {
      fr: '© 2026 Prof À Domicile Djibouti',
      ar: '© 2026 مدرس في المنزل جيبوتي',
      en: '© 2026 Home Tutor Djibouti',
    },
  },
  menu: {
    accueil: { fr: 'Accueil', ar: 'الرئيسية', en: 'Home' },
    profs: { fr: 'Trouver un prof', ar: 'ابحث عن مدرس', en: 'Find a tutor' },
    inscription: { fr: 'S\'inscrire', ar: 'التسجيل', en: 'Sign up' },
    login: { fr: 'Connexion', ar: 'تسجيل الدخول', en: 'Login' },
  },
  seo: {
    meta_titre: {
      fr: 'Prof À Domicile Djibouti',
      ar: 'مدرس في المنزل جيبوتي',
      en: 'Home Tutor Djibouti',
    },
    meta_description: {
      fr: 'Trouvez le professeur idéal pour vos enfants.',
      ar: 'اعثر على المدرس المثالي لأطفالك.',
      en: 'Find the perfect teacher for your children.',
    },
    meta_mots_cles: {
      fr: 'prof, professeur, Djibouti, cours',
      ar: 'مدرس، تعليم، جيبوتي',
      en: 'tutor, teacher, Djibouti',
    },
  },
  pages: {
    inscription_titre: { fr: 'Créez votre compte', ar: 'أنشئ حسابك', en: 'Create your account' },
    inscription_sous_titre: {
      fr: 'Choisissez votre profil',
      ar: 'اختر ملفك',
      en: 'Choose your profile',
    },
    login_titre: { fr: 'Bon retour !', ar: 'مرحبا!', en: 'Welcome back!' },
    login_sous_titre: {
      fr: 'Connectez-vous',
      ar: 'سجل الدخول',
      en: 'Log in',
    },
  },
  sections: [
    creerSection('hero', 1),
    creerSection('etapes', 2),
    creerSection('matieres', 3),
    creerSection('temoignages', 4),
    creerSection('avantages', 5),
    creerSection('cta', 6),
  ],
})

// ============================================================
// CONFIG TYPES SECTIONS
// ============================================================

const typesConfig: {
  [k in SectionType]: {
    label: string
    emoji: string
    couleur: string
    description: string
    aTitre: boolean
    aSousTitre: boolean
    aBouton: boolean
    aItems: boolean
    itemsLabel?: string
  }
} = {
  hero: {
    label: 'Hero',
    emoji: '🎯',
    couleur: 'from-blue-500 to-indigo-600',
    description: 'Bannière principale',
    aTitre: true,
    aSousTitre: true,
    aBouton: true,
    aItems: false,
  },
  etapes: {
    label: 'Étapes',
    emoji: '📖',
    couleur: 'from-emerald-500 to-teal-600',
    description: 'Comment ça marche',
    aTitre: true,
    aSousTitre: true,
    aBouton: false,
    aItems: true,
    itemsLabel: 'Étapes',
  },
  matieres: {
    label: 'Matières',
    emoji: '📚',
    couleur: 'from-purple-500 to-pink-600',
    description: 'Matières et niveaux',
    aTitre: true,
    aSousTitre: true,
    aBouton: false,
    aItems: true,
    itemsLabel: 'Matières',
  },
  temoignages: {
    label: 'Témoignages',
    emoji: '💬',
    couleur: 'from-amber-500 to-orange-600',
    description: 'Avis clients',
    aTitre: true,
    aSousTitre: true,
    aBouton: false,
    aItems: true,
    itemsLabel: 'Témoignages',
  },
  avantages: {
    label: 'Avantages',
    emoji: '⭐',
    couleur: 'from-yellow-500 to-amber-600',
    description: 'Avantages / bénéfices',
    aTitre: true,
    aSousTitre: true,
    aBouton: false,
    aItems: true,
    itemsLabel: 'Avantages',
  },
  cta: {
    label: 'CTA',
    emoji: '📞',
    couleur: 'from-green-500 to-emerald-600',
    description: 'Appel à l\'action',
    aTitre: true,
    aSousTitre: true,
    aBouton: true,
    aItems: false,
  },
  stats: {
    label: 'Statistiques',
    emoji: '📊',
    couleur: 'from-cyan-500 to-blue-600',
    description: 'Chiffres clés',
    aTitre: true,
    aSousTitre: false,
    aBouton: false,
    aItems: true,
    itemsLabel: 'Chiffres',
  },
  faq: {
    label: 'FAQ',
    emoji: '❓',
    couleur: 'from-slate-500 to-slate-700',
    description: 'Questions fréquentes',
    aTitre: true,
    aSousTitre: true,
    aBouton: false,
    aItems: true,
    itemsLabel: 'Questions',
  },
  custom: {
    label: 'Personnalisée',
    emoji: '🆕',
    couleur: 'from-fuchsia-500 to-pink-600',
    description: 'Section libre',
    aTitre: true,
    aSousTitre: true,
    aBouton: true,
    aItems: true,
    itemsLabel: 'Éléments',
  },
}

const langueLabels: { [k in Langue]: { label: string; drapeau: string } } = {
  fr: { label: 'Français', drapeau: '🇫🇷' },
  ar: { label: 'العربية', drapeau: '🇸🇦' },
  en: { label: 'English', drapeau: '🇬🇧' },
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function AdminContenu() {
  const supabase = createClient()

  // ---- ÉTATS ----
  const [contenu, setContenu] = useState<ContenuSite>(contenuParDefaut())
  const [contenuOriginal, setContenuOriginal] = useState<ContenuSite>(contenuParDefaut())
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)
  const [modifie, setModifie] = useState(false)
  const [langueEdit, setLangueEdit] = useState<Langue>('fr')
  const [onglet, setOnglet] = useState<OngletPrincipal>('sections')
  const [recherche, setRecherche] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [noteVersion, setNoteVersion] = useState('')
  const [sectionOuverte, setSectionOuverte] = useState<string | null>(null)
  const [modalAjoutSection, setModalAjoutSection] = useState(false)
  const [modalSuppression, setModalSuppression] = useState<string | null>(null)
  const [vueApercu, setVueApercu] = useState<'mobile' | 'tablette' | 'desktop'>('desktop')
  const [autoSave, setAutoSave] = useState(true)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const charger = useCallback(async () => {
    setLoading(true)
    setErreur('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErreur('Session expirée. Reconnecte-toi.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, est_admin, banni')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin' || !profile.est_admin) {
        setErreur('Accès refusé. Tu n\'es pas administrateur.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('parametres_site')
        .select('valeur')
        .eq('cle', 'contenu_site_v2')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (data?.valeur) {
        try {
          const parse = JSON.parse(data.valeur) as ContenuSite
          if (parse.version === 2) {
            setContenu(parse)
            setContenuOriginal(JSON.parse(JSON.stringify(parse)))
          }
        } catch (e) {
          console.warn('Contenu corrompu, utilisation des valeurs par défaut')
          const defaut = contenuParDefaut()
          setContenu(defaut)
          setContenuOriginal(JSON.parse(JSON.stringify(defaut)))
        }
      } else {
        const defaut = contenuParDefaut()
        setContenu(defaut)
        setContenuOriginal(JSON.parse(JSON.stringify(defaut)))
      }
    } catch (err: any) {
      console.error('Erreur chargement:', err)
      setErreur(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    charger()
  }, [charger])

  // ============================================================
  // SAUVEGARDE
  // ============================================================

  const sauvegarder = useCallback(async (silencieux = false) => {
    if (!silencieux) setSauvegarde(true)
    setErreur('')

    try {
      const json = JSON.stringify(contenu, null, 2)

      const { error } = await supabase
        .from('parametres_site')
        .upsert(
          {
            cle: 'contenu_site_v2',
            valeur: json,
            description: 'Contenu complet du site (multi-langue)',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'cle' }
        )

      if (error) throw error

      await supabase.from('admin_logs').insert({
        action: 'sauvegarder_contenu',
        details: `Contenu site v2 sauvegardé (${contenu.sections.length} sections)`,
      })

      setContenuOriginal(JSON.parse(JSON.stringify(contenu)))
      setModifie(false)

      if (!silencieux) {
        setSucces('✅ Contenu sauvegardé avec succès')
        setTimeout(() => setSucces(''), 3000)
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err)
      if (!silencieux) {
        setErreur('Erreur sauvegarde : ' + err.message)
        setTimeout(() => setErreur(''), 5000)
      }
    } finally {
      if (!silencieux) setSauvegarde(false)
    }
  }, [contenu, supabase])

  // ============================================================
  // AUTO-SAVE
  // ============================================================

  useEffect(() => {
    if (!autoSave || !modifie || loading) return

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      sauvegarder(true)
    }, 30000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [modifie, autoSave, loading, sauvegarder])

  // ============================================================
  // RACCOURCI CLAVIER Ctrl+S
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (modifie && !sauvegarde) sauvegarder()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modifie, sauvegarde, sauvegarder])

  // ============================================================
  // GESTION SECTIONS
  // ============================================================

  const ajouterSection = (type: SectionType) => {
    const nouvelOrdre = contenu.sections.length + 1
    const nouvelle = creerSection(type, nouvelOrdre)
    setContenu({
      ...contenu,
      sections: [...contenu.sections, nouvelle],
    })
    setModifie(true)
    setModalAjoutSection(false)
    setSectionOuverte(nouvelle.id)
    setSucces(`✅ Section "${typesConfig[type].label}" ajoutée`)
    setTimeout(() => setSucces(''), 3000)
  }

  const supprimerSection = (id: string) => {
    setContenu({
      ...contenu,
      sections: contenu.sections.filter((s) => s.id !== id),
    })
    setModifie(true)
    setModalSuppression(null)
    setSectionOuverte(null)
    setSucces('🗑️ Section supprimée')
    setTimeout(() => setSucces(''), 3000)
  }

  const dupliquerSection = (section: Section) => {
    const copie: Section = {
      ...JSON.parse(JSON.stringify(section)),
      id: genererId('section'),
      nom: `${section.nom} (copie)`,
      ordre: contenu.sections.length + 1,
    }
    copie.items = copie.items.map((it) => ({ ...it, id: genererId('item') }))
    setContenu({
      ...contenu,
      sections: [...contenu.sections, copie],
    })
    setModifie(true)
    setSucces('📋 Section dupliquée')
    setTimeout(() => setSucces(''), 3000)
  }

  const toggleSectionActif = (id: string) => {
    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === id ? { ...s, actif: !s.actif } : s
      ),
    })
    setModifie(true)
  }

  const deplacerSection = (id: string, direction: 'haut' | 'bas') => {
    const index = contenu.sections.findIndex((s) => s.id === id)
    if (index === -1) return

    const newIndex = direction === 'haut' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= contenu.sections.length) return

    const nouvelles = [...contenu.sections]
    ;[nouvelles[index], nouvelles[newIndex]] = [nouvelles[newIndex], nouvelles[index]]

    setContenu({
      ...contenu,
      sections: nouvelles.map((s, i) => ({ ...s, ordre: i + 1 })),
    })
    setModifie(true)
  }

  const modifierSection = (id: string, champ: keyof Section, valeur: any) => {
    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === id ? { ...s, [champ]: valeur } : s
      ),
    })
    setModifie(true)
  }

  const modifierTexteSection = (
    id: string,
    champ: 'titre' | 'sous_titre' | 'bouton',
    langue: Langue,
    valeur: string
  ) => {
    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === id ? { ...s, [champ]: { ...s[champ], [langue]: valeur } } : s
      ),
    })
    setModifie(true)
  }

  // ============================================================
  // GESTION ITEMS
  // ============================================================

  const ajouterItem = (sectionId: string, emoji = '⭐') => {
    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, creerItem(emoji)] } : s
      ),
    })
    setModifie(true)
  }

  const supprimerItem = (sectionId: string, itemId: string) => {
    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((it) => it.id !== itemId) }
          : s
      ),
    })
    setModifie(true)
  }

  const modifierItem = (
    sectionId: string,
    itemId: string,
    champ: 'emoji' | 'titre' | 'description',
    valeur: any
  ) => {
    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === itemId ? { ...it, [champ]: valeur } : it
              ),
            }
          : s
      ),
    })
    setModifie(true)
  }

  const modifierTexteItem = (
    sectionId: string,
    itemId: string,
    champ: 'titre' | 'description',
    langue: Langue,
    valeur: string
  ) => {
    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === itemId
                  ? { ...it, [champ]: { ...it[champ], [langue]: valeur } }
                  : it
              ),
            }
          : s
      ),
    })
    setModifie(true)
  }

  const deplacerItem = (sectionId: string, itemId: string, direction: 'haut' | 'bas') => {
    const section = contenu.sections.find((s) => s.id === sectionId)
    if (!section) return

    const index = section.items.findIndex((it) => it.id === itemId)
    if (index === -1) return

    const newIndex = direction === 'haut' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= section.items.length) return

    const nouveauxItems = [...section.items]
    ;[nouveauxItems[index], nouveauxItems[newIndex]] = [nouveauxItems[newIndex], nouveauxItems[index]]

    setContenu({
      ...contenu,
      sections: contenu.sections.map((s) =>
        s.id === sectionId ? { ...s, items: nouveauxItems } : s
      ),
    })
    setModifie(true)
  }

  // ============================================================
  // GESTION GÉNÉRAL / MENU / SEO / PAGES
  // ============================================================

  const modifierGeneral = (champ: keyof General, langue: Langue | null, valeur: string) => {
    setContenu({
      ...contenu,
      general: {
        ...contenu.general,
        [champ]: langue
          ? { ...(contenu.general[champ] as TexteMultiLangue), [langue]: valeur }
          : valeur,
      },
    })
    setModifie(true)
  }

  const modifierMenu = (champ: keyof MenuItems, langue: Langue, valeur: string) => {
    setContenu({
      ...contenu,
      menu: { ...contenu.menu, [champ]: { ...contenu.menu[champ], [langue]: valeur } },
    })
    setModifie(true)
  }

  const modifierSEO = (champ: keyof SEO, langue: Langue, valeur: string) => {
    setContenu({
      ...contenu,
      seo: { ...contenu.seo, [champ]: { ...contenu.seo[champ], [langue]: valeur } },
    })
    setModifie(true)
  }

  const modifierPage = (champ: keyof PageTexte, langue: Langue, valeur: string) => {
    setContenu({
      ...contenu,
      pages: { ...contenu.pages, [champ]: { ...contenu.pages[champ], [langue]: valeur } },
    })
    setModifie(true)
  }

  // ============================================================
  // HISTORIQUE
  // ============================================================

  const creerVersion = () => {
    const nouvelle: Version = {
      id: genererId('version'),
      date: new Date().toISOString(),
      contenu: JSON.parse(JSON.stringify(contenu)),
      note: noteVersion || 'Version manuelle',
      publie: false,
    }
    setVersions([nouvelle, ...versions.slice(0, 29)])
    setNoteVersion('')
    setSucces('📸 Version snapshot créée')
    setTimeout(() => setSucces(''), 3000)
  }

  const restaurerVersion = (version: Version) => {
    if (!confirm(`⚠️ Restaurer la version du ${new Date(version.date).toLocaleString('fr-FR')} ?\n\nLe contenu actuel sera remplacé.`)) return
    setContenu(JSON.parse(JSON.stringify(version.contenu)))
    setModifie(true)
    setSucces('✅ Version restaurée. Clique sur Sauvegarder.')
    setTimeout(() => setSucces(''), 5000)
  }

  const supprimerVersion = (id: string) => {
    setVersions(versions.filter((v) => v.id !== id))
  }

  // ============================================================
  // IMPORT / EXPORT
  // ============================================================

  const exporter = () => {
    const json = JSON.stringify(contenu, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contenu-site-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setSucces('📤 Contenu exporté')
    setTimeout(() => setSucces(''), 3000)
  }

  const importer = (fichier: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importe = JSON.parse(e.target?.result as string)
        if (importe.version === 2 && importe.sections && importe.general) {
          setContenu(importe)
          setModifie(true)
          setSucces('✅ Contenu importé. Clique sur Sauvegarder.')
          setTimeout(() => setSucces(''), 5000)
        } else {
          alert('Fichier invalide : version ou structure incorrecte')
        }
      } catch (err) {
        alert('Fichier JSON invalide')
      }
    }
    reader.readAsText(fichier)
  }

  // ============================================================
  // RESET
  // ============================================================

  const resetDefaut = () => {
    if (!confirm('⚠️ Réinitialiser TOUT le contenu aux valeurs par défaut ?\n\nCela effacera toutes tes modifications.')) return
    const defaut = contenuParDefaut()
    setContenu(defaut)
    setModifie(true)
    setSucces('Contenu réinitialisé. Clique sur Sauvegarder.')
    setTimeout(() => setSucces(''), 5000)
  }

  // ============================================================
  // STATS TEMPS RÉEL
  // ============================================================

  const stats = useMemo(() => {
    let mots = 0
    let caracteres = 0
    let sectionsActives = 0
    let itemsTotal = 0
    let languesCompletes = { fr: 0, ar: 0, en: 0 }
    let languesTotal = { fr: 0, ar: 0, en: 0 }

    const compterTexte = (texte: TexteMultiLangue) => {
      ;(['fr', 'ar', 'en'] as Langue[]).forEach((l) => {
        languesTotal[l]++
        if (texte[l]?.trim()) {
          languesCompletes[l]++
          mots += texte[l].split(/\s+/).filter(Boolean).length
          caracteres += texte[l].length
        }
      })
    }

    // Général
    Object.values(contenu.general).forEach((v) => {
      if (typeof v === 'object' && v !== null && 'fr' in v) compterTexte(v as TexteMultiLangue)
    })
    Object.values(contenu.menu).forEach((v) => compterTexte(v))
    Object.values(contenu.seo).forEach((v) => {
      if (typeof v === 'object' && v !== null && 'fr' in v) compterTexte(v as TexteMultiLangue)
    })
    Object.values(contenu.pages).forEach((v) => compterTexte(v))

    // Sections
    contenu.sections.forEach((s) => {
      if (s.actif) sectionsActives++
      itemsTotal += s.items.length
      compterTexte(s.titre)
      compterTexte(s.sous_titre)
      if (s.bouton) compterTexte(s.bouton)
      s.items.forEach((it) => {
        compterTexte(it.titre)
        compterTexte(it.description)
      })
    })

    const taux = {
      fr: languesTotal.fr > 0 ? Math.round((languesCompletes.fr / languesTotal.fr) * 100) : 0,
      ar: languesTotal.ar > 0 ? Math.round((languesCompletes.ar / languesTotal.ar) * 100) : 0,
      en: languesTotal.en > 0 ? Math.round((languesCompletes.en / languesTotal.en) * 100) : 0,
    }

    return {
      mots,
      caracteres,
      sections: contenu.sections.length,
      sectionsActives,
      itemsTotal,
      taux,
    }
  }, [contenu])

  // ============================================================
  // RECHERCHE
  // ============================================================

  const resultatsRecherche = useMemo(() => {
    if (!recherche.trim()) return null
    const r = recherche.toLowerCase().trim()
    const resultats: { chemin: string; extrait: string; langue: Langue }[] = []

    const chercherDans = (texte: TexteMultiLangue, chemin: string) => {
      ;(['fr', 'ar', 'en'] as Langue[]).forEach((l) => {
        if (texte[l]?.toLowerCase().includes(r)) {
          const idx = texte[l].toLowerCase().indexOf(r)
          const debut = Math.max(0, idx - 30)
          const fin = Math.min(texte[l].length, idx + 50)
          resultats.push({
            chemin: `${chemin} [${l.toUpperCase()}]`,
            extrait: `...${texte[l].substring(debut, fin)}...`,
            langue: l,
          })
        }
      })
    }

    Object.entries(contenu.general).forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null && 'fr' in v) chercherDans(v as TexteMultiLangue, `Général > ${k}`)
    })
    Object.entries(contenu.menu).forEach(([k, v]) => chercherDans(v, `Menu > ${k}`))
    Object.entries(contenu.seo).forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null && 'fr' in v) chercherDans(v as TexteMultiLangue, `SEO > ${k}`)
    })
    Object.entries(contenu.pages).forEach(([k, v]) => chercherDans(v, `Pages > ${k}`))

    contenu.sections.forEach((s) => {
      chercherDans(s.titre, `Section "${s.nom}" > Titre`)
      chercherDans(s.sous_titre, `Section "${s.nom}" > Sous-titre`)
      if (s.bouton) chercherDans(s.bouton, `Section "${s.nom}" > Bouton`)
      s.items.forEach((it, i) => {
        chercherDans(it.titre, `Section "${s.nom}" > Item ${i + 1} > Titre`)
        chercherDans(it.description, `Section "${s.nom}" > Item ${i + 1} > Description`)
      })
    })

    return resultats
  }, [recherche, contenu])

  // ============================================================
  // SECTIONS TRIÉES
  // ============================================================

  const sectionsTriees = useMemo(() => {
    return [...contenu.sections].sort((a, b) => a.ordre - b.ordre)
  }, [contenu.sections])

  // ============================================================
  // RENDU — ÉCRAN DE CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-400 text-sm">Chargement du contenu...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDU — ERREUR
  // ============================================================

  if (erreur && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-white mb-2">Erreur</h2>
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

  // ============================================================
  // RENDU — INTERFACE PRINCIPALE
  // ============================================================

  return (
    <div className="space-y-6 pb-32">
      {/* BARRE SUPÉRIEURE STICKY */}
      <div className="sticky top-0 z-40 -mx-6 -mt-6 px-6 py-3 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
              📝 Contenu du site
              {modifie && (
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full font-black border border-blue-500/30">
                {stats.sections} sections
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full font-black border border-emerald-500/30">
                {stats.mots} mots
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full font-black border border-purple-500/30">
                {stats.caracteres} car.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
              <span className="text-xs font-bold text-white">Auto-save</span>
            </label>

            <button
              onClick={() => sauvegarder()}
              disabled={sauvegarde || !modifie}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                modifie
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {sauvegarde ? '⏳...' : modifie ? '💾 Sauvegarder (Ctrl+S)' : '✓ À jour'}
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGES SUCCÈS / ERREUR */}
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
        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-xl">⚠️</span>
            <p className="text-red-200 text-sm font-bold">{erreur}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BARRE DE STATS / RECHERCHE */}
      <div className="grid md:grid-cols-[1fr_auto] gap-4">
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <div className="grid grid-cols-3 gap-3">
            {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
              <div key={l} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{langueLabels[l].drapeau}</span>
                  <span className="text-[10px] font-black text-white uppercase">{l}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.taux[l]}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${
                      stats.taux[l] === 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        : stats.taux[l] >= 70
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        : stats.taux[l] >= 40
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-bold">
                  {stats.taux[l]}% complété
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-center gap-3 min-w-[280px]">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-blue-500 text-sm"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RÉSULTATS RECHERCHE */}
      {resultatsRecherche && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 max-h-60 overflow-y-auto">
          <h3 className="text-xs font-black text-blue-200 mb-2">
            🔍 {resultatsRecherche.length} résultat(s)
          </h3>
          {resultatsRecherche.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Aucun résultat</p>
          ) : (
            <div className="space-y-1">
              {resultatsRecherche.slice(0, 20).map((r, i) => (
                <div key={i} className="bg-slate-900 rounded-lg p-2 border border-slate-700">
                  <div className="text-[10px] text-slate-500 font-mono">{r.chemin}</div>
                  <div className="text-xs text-white truncate">{r.extrait}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLETS PRINCIPAUX */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { val: 'general', label: 'Général', emoji: '🌍' },
            { val: 'menu', label: 'Menu', emoji: '🧭' },
            { val: 'seo', label: 'SEO', emoji: '🔍' },
            { val: 'pages', label: 'Pages', emoji: '📄' },
            { val: 'sections', label: 'Sections', emoji: '🧱' },
            { val: 'apercu', label: 'Aperçu', emoji: '👁️' },
            { val: 'historique', label: 'Historique', emoji: '📸' },
          ] as { val: OngletPrincipal; label: string; emoji: string }[]
        ).map((o) => (
          <button
            key={o.val}
            onClick={() => setOnglet(o.val)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              onglet === o.val
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* ONGLET : GÉNÉRAL */}
      {/* ============================================================ */}
      {onglet === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-5">
            <h2 className="text-lg font-black text-white">🌍 Informations générales</h2>

            {[
              { champ: 'nom_site' as keyof General, label: '📝 Nom du site' },
              { champ: 'slogan' as keyof General, label: '🎯 Slogan' },
              { champ: 'description' as keyof General, label: '📄 Description', rows: 3 },
              { champ: 'footer_description' as keyof General, label: '🦶 Description footer', rows: 2 },
              { champ: 'footer_copyright' as keyof General, label: '© Copyright' },
            ].map((f) => (
              <div key={f.champ}>
                <label className="block text-sm font-bold text-slate-300 mb-2">{f.label}</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                    <div key={l} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                        {langueLabels[l].drapeau}
                      </span>
                      {f.rows ? (
                        <textarea
                          value={(contenu.general[f.champ] as TexteMultiLangue)[l]}
                          onChange={(e) => modifierGeneral(f.champ, l, e.target.value)}
                          rows={f.rows}
                          dir={l === 'ar' ? 'rtl' : 'ltr'}
                          className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 font-medium resize-none ${
                            l === 'ar' ? 'text-right' : ''
                          }`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={(contenu.general[f.champ] as TexteMultiLangue)[l]}
                          onChange={(e) => modifierGeneral(f.champ, l, e.target.value)}
                          dir={l === 'ar' ? 'rtl' : 'ltr'}
                          className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 font-medium ${
                            l === 'ar' ? 'text-right' : ''
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-black text-slate-300 mb-3">📞 Coordonnées</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={contenu.general.email}
                    onChange={(e) => modifierGeneral('email', null, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={contenu.general.telephone}
                    onChange={(e) => modifierGeneral('telephone', null, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={contenu.general.whatsapp}
                    onChange={(e) => modifierGeneral('whatsapp', null, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* ONGLET : MENU */}
      {/* ============================================================ */}
      {onglet === 'menu' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-5"
        >
          <h2 className="text-lg font-black text-white">🧭 Menu de navigation</h2>

          {[
            { champ: 'accueil' as keyof MenuItems, label: '🏠 Accueil' },
            { champ: 'profs' as keyof MenuItems, label: '👨‍🏫 Trouver un prof' },
            { champ: 'inscription' as keyof MenuItems, label: '📝 S\'inscrire' },
            { champ: 'login' as keyof MenuItems, label: '🔐 Connexion' },
          ].map((f) => (
            <div key={f.champ}>
              <label className="block text-sm font-bold text-slate-300 mb-2">{f.label}</label>
              <div className="grid md:grid-cols-3 gap-2">
                {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                  <div key={l} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                      {langueLabels[l].drapeau}
                    </span>
                    <input
                      type="text"
                      value={contenu.menu[f.champ][l]}
                      onChange={(e) => modifierMenu(f.champ, l, e.target.value)}
                      dir={l === 'ar' ? 'rtl' : 'ltr'}
                      className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 font-medium ${
                        l === 'ar' ? 'text-right' : ''
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* ONGLET : SEO */}
      {/* ============================================================ */}
      {onglet === 'seo' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-5"
        >
          <h2 className="text-lg font-black text-white">🔍 SEO (référencement Google)</h2>

          <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-xl p-4">
            <p className="text-xs text-blue-200">
              💡 Le SEO permet à ton site d'apparaître dans les recherches Google.
            </p>
          </div>

          {[
            { champ: 'meta_titre' as keyof SEO, label: '📝 Meta titre', max: 60 },
            { champ: 'meta_description' as keyof SEO, label: '📄 Meta description', max: 160, rows: 2 },
            { champ: 'meta_mots_cles' as keyof SEO, label: '🏷️ Mots-clés (virgules)', max: 200 },
          ].map((f) => (
            <div key={f.champ}>
              <label className="block text-sm font-bold text-slate-300 mb-2">{f.label}</label>
              <div className="grid md:grid-cols-3 gap-2">
                {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                  <div key={l} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                      {langueLabels[l].drapeau}
                    </span>
                    {f.rows ? (
                      <textarea
                        value={contenu.seo[f.champ][l]}
                        onChange={(e) => modifierSEO(f.champ, l, e.target.value)}
                        rows={f.rows}
                        maxLength={f.max}
                        dir={l === 'ar' ? 'rtl' : 'ltr'}
                        className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 font-medium resize-none ${
                          l === 'ar' ? 'text-right' : ''
                        }`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={contenu.seo[f.champ][l]}
                        onChange={(e) => modifierSEO(f.champ, l, e.target.value)}
                        maxLength={f.max}
                        dir={l === 'ar' ? 'rtl' : 'ltr'}
                        className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 font-medium ${
                          l === 'ar' ? 'text-right' : ''
                        }`}
                      />
                    )}
                    <div className="text-[10px] text-slate-500 mt-1 text-right">
                      {contenu.seo[f.champ][l].length}/{f.max}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* ONGLET : PAGES */}
      {/* ============================================================ */}
      {onglet === 'pages' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-5"
        >
          <h2 className="text-lg font-black text-white">📄 Autres pages</h2>

          <div>
            <h3 className="text-sm font-black text-blue-300 mb-3">📝 Page Inscription</h3>
            {[
              { champ: 'inscription_titre' as keyof PageTexte, label: 'Titre' },
              { champ: 'inscription_sous_titre' as keyof PageTexte, label: 'Sous-titre' },
            ].map((f) => (
              <div key={f.champ} className="mb-3">
                <label className="block text-xs font-bold text-slate-400 mb-1">{f.label}</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                    <div key={l} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                        {langueLabels[l].drapeau}
                      </span>
                      <input
                        type="text"
                        value={contenu.pages[f.champ][l]}
                        onChange={(e) => modifierPage(f.champ, l, e.target.value)}
                        dir={l === 'ar' ? 'rtl' : 'ltr'}
                        className={`w-full pl-9 pr-3 py-2 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm ${
                          l === 'ar' ? 'text-right' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-black text-blue-300 mb-3">🔐 Page Connexion</h3>
            {[
              { champ: 'login_titre' as keyof PageTexte, label: 'Titre' },
              { champ: 'login_sous_titre' as keyof PageTexte, label: 'Sous-titre' },
            ].map((f) => (
              <div key={f.champ} className="mb-3">
                <label className="block text-xs font-bold text-slate-400 mb-1">{f.label}</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                    <div key={l} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                        {langueLabels[l].drapeau}
                      </span>
                      <input
                        type="text"
                        value={contenu.pages[f.champ][l]}
                        onChange={(e) => modifierPage(f.champ, l, e.target.value)}
                        dir={l === 'ar' ? 'rtl' : 'ltr'}
                        className={`w-full pl-9 pr-3 py-2 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm ${
                          l === 'ar' ? 'text-right' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* ONGLET : SECTIONS */}
      {/* ============================================================ */}
      {onglet === 'sections' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Barre actions sections */}
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-white">
                🧱 {stats.sections} sections ({stats.sectionsActives} actives)
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={resetDefaut}
                className="px-3 py-2 rounded-xl font-bold text-xs bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
              >
                🔄 Reset
              </button>
              <button
                onClick={() => setModalAjoutSection(true)}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl"
              >
                ➕ Ajouter une section
              </button>
            </div>
          </div>

          {/* Liste des sections */}
          {sectionsTriees.map((section, idx) => {
            const config = typesConfig[section.type]
            const ouverte = sectionOuverte === section.id
            return (
              <motion.div
                key={section.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`backdrop-blur-xl rounded-2xl border transition-all ${
                  section.actif
                    ? 'bg-slate-800/70 border-white/10'
                    : 'bg-slate-900/50 border-slate-700 opacity-60'
                }`}
              >
                {/* Header section */}
                <div className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deplacerSection(section.id, 'haut')}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => deplacerSection(section.id, 'bas')}
                      disabled={idx === sectionsTriees.length - 1}
                      className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                    >
                      ⬇️
                    </button>
                  </div>

                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.couleur} flex items-center justify-center text-white text-lg shadow-lg flex-shrink-0`}>
                    {section.emoji}
                  </div>

                  <button
                    onClick={() => setSectionOuverte(ouverte ? null : section.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-sm">
                        {section.nom}
                      </span>
                      <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase">
                        {config.label}
                      </span>
                      {!section.actif && (
                        <span className="text-[9px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-black border border-red-500/30">
                          ⏸️ MASQUÉE
                        </span>
                      )}
                      {section.items.length > 0 && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-black">
                          {section.items.length} item{section.items.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {section.titre[langueEdit] && (
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {section.titre[langueEdit]}
                      </div>
                    )}
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleSectionActif(section.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                        section.actif
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                      title={section.actif ? 'Masquer' : 'Activer'}
                    >
                      {section.actif ? '👁️' : '🚫'}
                    </button>
                    <button
                      onClick={() => dupliquerSection(section)}
                      className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 flex items-center justify-center text-sm"
                      title="Dupliquer"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => setModalSuppression(section.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 flex items-center justify-center text-sm"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => setSectionOuverte(ouverte ? null : section.id)}
                      className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-sm"
                    >
                      {ouverte ? '▼' : '▶'}
                    </button>
                  </div>
                </div>

                {/* Contenu dépliable */}
                <AnimatePresence>
                  {ouverte && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/10"
                    >
                      <div className="p-5 space-y-5">
                        {/* Nom + emoji */}
                        <div className="grid md:grid-cols-[80px_1fr] gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Emoji</label>
                            <input
                              type="text"
                              value={section.emoji}
                              onChange={(e) => modifierSection(section.id, 'emoji', e.target.value)}
                              maxLength={2}
                              className="w-full px-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-center text-2xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Nom interne</label>
                            <input
                              type="text"
                              value={section.nom}
                              onChange={(e) => modifierSection(section.id, 'nom', e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>

                        {/* Titre */}
                        {config.aTitre && (
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">📝 Titre</label>
                            <div className="grid md:grid-cols-3 gap-2">
                              {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                                <div key={l} className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                                    {langueLabels[l].drapeau}
                                  </span>
                                  <input
                                    type="text"
                                    value={section.titre[l]}
                                    onChange={(e) => modifierTexteSection(section.id, 'titre', l, e.target.value)}
                                    dir={l === 'ar' ? 'rtl' : 'ltr'}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm ${
                                      l === 'ar' ? 'text-right' : ''
                                    }`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sous-titre */}
                        {config.aSousTitre && (
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">📄 Sous-titre</label>
                            <div className="grid md:grid-cols-3 gap-2">
                              {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                                <div key={l} className="relative">
                                  <span className="absolute left-3 top-3 text-lg pointer-events-none">
                                    {langueLabels[l].drapeau}
                                  </span>
                                  <textarea
                                    value={section.sous_titre[l]}
                                    onChange={(e) => modifierTexteSection(section.id, 'sous_titre', l, e.target.value)}
                                    rows={2}
                                    dir={l === 'ar' ? 'rtl' : 'ltr'}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm resize-none ${
                                      l === 'ar' ? 'text-right' : ''
                                    }`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bouton */}
                        {config.aBouton && (
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">🔘 Texte du bouton</label>
                            <div className="grid md:grid-cols-3 gap-2">
                              {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                                <div key={l} className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                                    {langueLabels[l].drapeau}
                                  </span>
                                  <input
                                    type="text"
                                    value={section.bouton[l]}
                                    onChange={(e) => modifierTexteSection(section.id, 'bouton', l, e.target.value)}
                                    dir={l === 'ar' ? 'rtl' : 'ltr'}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border-2 border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm ${
                                      l === 'ar' ? 'text-right' : ''
                                    }`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        {config.aItems && (
                          <div className="border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-black text-white">
                                📋 {config.itemsLabel || 'Éléments'} ({section.items.length})
                              </h4>
                              <button
                                onClick={() => ajouterItem(section.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                              >
                                ➕ Ajouter
                              </button>
                            </div>

                            <div className="space-y-3">
                              {section.items.map((item, iIdx) => (
                                <div key={item.id} className="bg-slate-900/50 rounded-xl p-3 border border-white/10">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => deplacerItem(section.id, item.id, 'haut')}
                                        disabled={iIdx === 0}
                                        className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                                      >
                                        ⬆️
                                      </button>
                                      <button
                                        onClick={() => deplacerItem(section.id, item.id, 'bas')}
                                        disabled={iIdx === section.items.length - 1}
                                        className="w-6 h-6 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                                      >
                                        ⬇️
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={item.emoji}
                                      onChange={(e) => modifierItem(section.id, item.id, 'emoji', e.target.value)}
                                      maxLength={3}
                                      className="w-12 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-center text-xl outline-none focus:border-blue-500"
                                    />
                                    <span className="text-[10px] text-slate-500 font-black">
                                      ITEM #{iIdx + 1}
                                    </span>
                                    <button
                                      onClick={() => supprimerItem(section.id, item.id)}
                                      className="ml-auto w-6 h-6 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 flex items-center justify-center text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div className="grid md:grid-cols-3 gap-2 mb-2">
                                    {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                                      <div key={l} className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                                          {langueLabels[l].drapeau}
                                        </span>
                                        <input
                                          type="text"
                                          value={item.titre[l]}
                                          onChange={(e) => modifierTexteItem(section.id, item.id, 'titre', l, e.target.value)}
                                          placeholder="Titre"
                                          dir={l === 'ar' ? 'rtl' : 'ltr'}
                                          className={`w-full pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500 text-xs font-bold ${
                                            l === 'ar' ? 'text-right' : ''
                                          }`}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  <div className="grid md:grid-cols-3 gap-2">
                                    {(['fr', 'ar', 'en'] as Langue[]).map((l) => (
                                      <div key={l} className="relative">
                                        <span className="absolute left-2 top-2 text-sm pointer-events-none">
                                          {langueLabels[l].drapeau}
                                        </span>
                                        <textarea
                                          value={item.description[l]}
                                          onChange={(e) => modifierTexteItem(section.id, item.id, 'description', l, e.target.value)}
                                          placeholder="Description"
                                          rows={2}
                                          dir={l === 'ar' ? 'rtl' : 'ltr'}
                                          className={`w-full pl-8 pr-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500 text-xs resize-none ${
                                            l === 'ar' ? 'text-right' : ''
                                          }`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {section.items.length === 0 && (
                                <p className="text-xs text-slate-500 italic text-center py-4">
                                  Aucun item. Clique sur "➕ Ajouter".
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* ONGLET : APERÇU */}
      {/* ============================================================ */}
      {onglet === 'apercu' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-black text-white">👁️ Aperçu en direct</h2>
              <p className="text-xs text-slate-400">Langue : {langueLabels[langueEdit].drapeau} {langueLabels[langueEdit].label}</p>
            </div>
            <div className="flex gap-2">
              {(['mobile', 'tablette', 'desktop'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setVueApercu(t)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    vueApercu === t
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {t === 'mobile' ? '📱 Mobile' : t === 'tablette' ? '📱 Tablette' : '💻 Desktop'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className={`bg-gradient-to-br from-slate-100 to-white rounded-2xl shadow-2xl overflow-hidden transition-all ${
                vueApercu === 'mobile'
                  ? 'max-w-sm w-full'
                  : vueApercu === 'tablette'
                  ? 'max-w-2xl w-full'
                  : 'max-w-5xl w-full'
              }`}
            >
              {/* Header aperçu */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-4 py-3 flex items-center justify-between">
                <div className="text-white font-black text-sm">
                  {contenu.general.nom_site[langueEdit]}
                </div>
                <div className="flex gap-3 text-xs text-white/80">
                  <span>{contenu.menu.accueil[langueEdit]}</span>
                  <span>{contenu.menu.profs[langueEdit]}</span>
                  <span>{contenu.menu.login[langueEdit]}</span>
                </div>
              </div>

              {/* Body aperçu */}
              <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
                {sectionsTriees.filter((s) => s.actif).map((s) => {
                  const config = typesConfig[s.type]
                  return (
                    <div key={s.id} className="text-center">
                      {s.titre[langueEdit] && (
                        <h3 className="text-xl font-black text-slate-900 mb-1">
                          {s.emoji} {s.titre[langueEdit]}
                        </h3>
                      )}
                      {s.sous_titre[langueEdit] && (
                        <p className="text-xs text-slate-500 mb-3">
                          {s.sous_titre[langueEdit]}
                        </p>
                      )}

                      {config.aItems && s.items.length > 0 && (
                        <div
                          className={`grid gap-2 mt-3 ${
                            s.type === 'temoignages' || s.type === 'matieres'
                              ? 'grid-cols-3'
                              : s.type === 'avantages'
                              ? 'grid-cols-4'
                              : 'grid-cols-2'
                          }`}
                        >
                          {s.items.map((it) => (
                            <div key={it.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                              <div className="text-2xl mb-1">{it.emoji}</div>
                              <div className="font-bold text-slate-900 text-xs">
                                {it.titre[langueEdit] || '—'}
                              </div>
                              {it.description[langueEdit] && (
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {it.description[langueEdit]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {config.aBouton && s.bouton[langueEdit] && (
                        <div className="mt-3">
                          <span className="inline-block bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold">
                            {s.bouton[langueEdit]}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer aperçu */}
              <div className="bg-slate-900 text-white text-center py-3 text-[10px]">
                {contenu.general.footer_copyright[langueEdit]}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* ONGLET : HISTORIQUE */}
      {/* ============================================================ */}
      {onglet === 'historique' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-lg font-black text-white">📸 Historique ({versions.length}/30)</h2>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={noteVersion}
                  onChange={(e) => setNoteVersion(e.target.value)}
                  placeholder="Note (ex: ajout témoignages)"
                  className="px-3 py-2 bg-slate-900 border-2 border-slate-700 rounded-xl text-white text-xs outline-none focus:border-blue-500 min-w-[200px]"
                />
                <button
                  onClick={creerVersion}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                >
                  📸 Créer version
                </button>
              </div>
            </div>

            {versions.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">
                Aucune version. Clique sur "📸 Créer version".
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10"
                  >
                    <span className="text-2xl">{v.publie ? '🚀' : '💾'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">
                        {new Date(v.date).toLocaleString('fr-FR')}
                      </div>
                      {v.note && (
                        <div className="text-[10px] text-slate-400 italic">{v.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => restaurerVersion(v)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    >
                      🔄 Restaurer
                    </button>
                    <button
                      onClick={() => supprimerVersion(v.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-3">
            <h3 className="text-lg font-black text-white">💾 Import / Export</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exporter}
                className="flex-1 min-w-[150px] px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
              >
                📤 Exporter JSON
              </button>
              <label className="flex-1 min-w-[150px] px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg cursor-pointer text-center">
                📥 Importer JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importer(f)
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* MODAL AJOUT SECTION */}
      {/* ============================================================ */}
      <AnimatePresence>
        {modalAjoutSection && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setModalAjoutSection(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl border border-white/10 my-8"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">➕ Ajouter une section</h2>
                  <button
                    onClick={() => setModalAjoutSection(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(typesConfig) as SectionType[]).map((type) => {
                    const config = typesConfig[type]
                    return (
                      <button
                        key={type}
                        onClick={() => ajouterSection(type)}
                        className={`p-4 rounded-2xl text-left bg-gradient-to-br ${config.couleur} text-white shadow-lg hover:scale-105 transition-transform`}
                      >
                        <div className="text-3xl mb-2">{config.emoji}</div>
                        <div className="font-black text-sm mb-1">{config.label}</div>
                        <div className="text-[10px] opacity-80">{config.description}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL SUPPRESSION */}
      {/* ============================================================ */}
      <AnimatePresence>
        {modalSuppression && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalSuppression(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-white/10 p-6"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-black text-white mb-2">Supprimer cette section ?</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Cette action est irréversible. La section et tous ses items seront perdus.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalSuppression(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/10 hover:bg-white/20"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => supprimerSection(modalSuppression)}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600"
                  >
                    🗑️ Supprimer
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