import { NextResponse } from 'next/server';

// =====================================================================================
// FICHIER : app/api/chat/route.ts
// DESCRIPTION : Cerveau central du Coach Djib (IA).
// Ce fichier contient une base de connaissances (Knowledge Base) exhaustive de toute
// la plateforme, les règles métier, la psychologie utilisateur, et la logique de réponse.
// =====================================================================================

// =====================================================================================
// SECTION 1 : TYPES ET INTERFACES
// =====================================================================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  currentPage: string;
  device: string;
}

interface SiteKnowledge {
  nom: string;
  fondateur: string;
  role_fondateur: string;
  mission: string;
  url_officielle: string;
  whatsapp_support: string;
  valeurs: string[];
  parent: {
    strategie: string[];
    charte_financiere: string[];
    droits: string[];
    erreurs_a_eviter: string[];
    suivi_mensuel: string[];
  };
  professeur: {
    strategie: string[];
    niveaux_etoiles: Record<string, string>;
    badges: Record<string, string>;
    documents_requis: string[];
    verification_physique: string[];
    regles_strictes: string[];
  };
  navigation: Record<string, string>;
  langues: {
    regle: string;
    nuances: Record<string, string>;
  };
  pwa: {
    description: string;
    instructions: Record<string, string>;
  };
}

// =====================================================================================
// SECTION 2 : BASE DE CONNAISSANCES EXHAUSTIVE (LE SAVOIR ABSOLU)
// =====================================================================================

const SITE_KNOWLEDGE: SiteKnowledge = {
  nom: "Djib Superprof",
  fondateur: "Abdourahman Sougueh",
  role_fondateur: "CEO et Fondateur visionnaire",
  mission: "Révolutionner l'accès à l'éducation à Djibouti en connectant les parents avec des professeurs vérifiés physiquement, en toute sécurité.",
  url_officielle: "https://prof-domicile-a-djibouti.vercel.app",
  whatsapp_support: "+253 77 74 14 82",
  
  valeurs: [
    "Excellence pédagogique et rigueur.",
    "Sécurité absolue et vérification physique des enseignants.",
    "Respect mutuel entre parents, élèves et professeurs.",
    "Transparence totale sur les tarifs et les suivis.",
    "Accompagnement psychologique et pédagogique continu."
  ],

  parent: {
    strategie: [
      "Inscription 100% GRATUITE.",
      "Créer un compte parent est LA meilleure stratégie pour centraliser le suivi.",
      "Possibilité d'ajouter plusieurs enfants avec des profils distincts.",
      "L'espace parent permet de suivre le travail, les notes, et les appréciations mensuelles (sur 20).",
      "Les parents peuvent signaler un prof avec preuves pour protéger les autres.",
      "L'administration surveille tous les profils et bannit les mauvais comportements."
    ],
    charte_financiere: [
      "Formule Simple : 30% du salaire mensuel du prof payé en avance à la plateforme.",
      "Formule Premium : 30% + 5 000 DJF pour un suivi rapproché (comportement, pédagogie, cahiers).",
      "Garantie de remplacement si le prof ne convient pas.",
      "Remboursement en cas de problème grave."
    ],
    droits: [
      "Connaître la vraie identité du prof (vérifiée).",
      "Signaler tout problème avec preuves.",
      "Donner un avis (positif ou négatif) impactant la visibilité du prof.",
      "Exiger le respect de la charte qualité."
    ],
    erreurs_a_eviter: [
      "Ne pas contourner la plateforme pour payer le prof directement (risque de perte de garantie).",
      "Ne pas laisser l'enfant seul avec le prof sans surveillance.",
      "Comprendre que le prof n'est pas là que pour refaire les devoirs, mais pour consolider les bases."
    ],
    suivi_mensuel: [
      "Le professeur a l'obligation de publier un suivi mensuel dans l'espace parent.",
      "Ce suivi contient : une note sur 20, une appréciation globale, les points forts, et les points à améliorer.",
      "Si le suivi n'est pas fait, le parent peut le signaler à l'administration."
    ]
  },

  professeur: {
    strategie: [
      "L'inscription est gratuite pour commencer.",
      "Le prof choisit ses propres tarifs (minimum et maximum) et ses horaires.",
      "La plateforme fournit un flux constant de parents cherchant des cours.",
      "Compléter son profil à 100% (photo, bio, documents) augmente les chances de recevoir des demandes.",
      "Le prof doit renseigner ses disponibilités (matin, après-midi, soir) pour être visible."
    ],
    niveaux_etoiles: {
      "0 étoile": "Nouveau : Bienvenue, le profil est en cours de complétion.",
      "1 étoile": "Vérifié : Les documents ont été contrôlés par l'administration.",
      "2 étoiles": "Confirmé : Le prof a accumulé 5 mois d'ancienneté avec un client.",
      "3 étoiles": "Expert : Le prof a 12 mois d'ancienneté et une note supérieure à 4.5."
    },
    badges: {
      "recommande": "Donné par l'admin pour un prof exceptionnel.",
      "super_pro": "Réservé au niveau 3 étoiles avec une note > 4.7.",
      "pionnier": "Pour les 50 premiers inscrits sur la plateforme.",
      "pionnier_illustre": "Badge VIP donné manuellement par le CEO."
    },
    documents_requis: [
      "Carte d'identité nationale (fortement recommandée).",
      "Photo de profil professionnelle (visage visible).",
      "Étudiant : Carte étudiante.",
      "Diplômé : Diplôme universitaire et relevé de notes.",
      "Bac S : Scan du diplôme du Bac Scientifique (obligatoire pour les matières scientifiques).",
      "Enseignant : Attestation employeur et carte professionnelle.",
      "Freelance : CV et attestations d'expérience."
    ],
    verification_physique: [
      "OBLIGATOIRE pour les types : Enseignant, Freelance, Formateur, et Coran.",
      "L'admin convoque le prof pour un entretien physique.",
      "Pour le Coran, un test de récitation et de Tajwid est effectué.",
      "Si le test échoue, le profil est masqué ou refusé."
    ],
    regles_strictes: [
      "Zéro absence non justifiée.",
      "Zéro comportement inapproprié (bannissement immédiat).",
      "Obligation de faire le suivi mensuel de chaque élève.",
      "Paiement des frais de plateforme (500 à 1500 DJF selon statut) pour rester visible.",
      "Respect absolu de la confidentialité des familles."
    ]
  },

  navigation: {
    "/": "Accueil. Recherche de prof, 10 univers (Soutien, Coran, Langues, Informatique, Arts).",
    "/professeurs": "Annuaire des profs. Filtres par matière, quartier (Balbala, Héron...), prix.",
    "/login": "Connexion sécurisée (Parent, Prof, Admin).",
    "/inscription": "Création de compte.",
    "/espace-parent": "Dashboard parent : Enfants, Demandes, Mes Profs, Suivi mensuel, Avis, Charte.",
    "/espace-professeur": "Dashboard prof : Demandes reçues, Élèves, Suivi, Documents, Tarifs, Statut.",
    "/contact": "Support WhatsApp 7j/7."
  },

  langues: {
    regle: "Réponds TOUJOURS dans la langue de l'utilisateur. Ne mélange JAMAIS les langues.",
    nuances: {
      "français": "Vouvoiement obligatoire. Ton premium, professionnel et rassurant.",
      "arabe": "Utilise un arabe standard (Fusha) clair et respectueux.",
      "somali": "Ton chaleureux et respectueux. Utilise les termes appropriés (ex: Macalin pour prof, Waalid pour parent).",
      "afar": "Ton respectueux et culturellement adapté.",
      "anglais": "Direct, professionnel et poli."
    }
  },

  pwa: {
    description: "Le site s'installe comme une véritable application mobile (PWA). Aucun avertissement de spam, aucune boutique d'applications requise.",
    instructions: {
      "iPhone": "Ouvrez le site dans Safari, appuyez sur le bouton Partager (le carré avec une flèche), puis 'Sur l'écran d'accueil'.",
      "Android": "Ouvrez le site dans Chrome, appuyez sur les 3 petits points en haut à droite, puis 'Installer l'application'.",
      "Ordinateur": "Cliquez sur la petite icône d'installation (monitor avec une flèche) dans la barre d'adresse de Chrome."
    }
  }
};

// =====================================================================================
// SECTION 3 : LOGIQUE DE L'API (HANDLER)
// =====================================================================================

export async function POST(req: Request) {
  try {
    // 1. RÉCEPTION ET VALIDATION
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ message: "Format invalide." }, { status: 400 });
    }

    const { messages, currentPage, device } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: "Aucun message fourni." }, { status: 400 });
    }

    // 2. CONSTRUCTION DU PROMPT SYSTÈME (LE CERVEAU)
    // C'est ici que l'on injecte toutes les connaissances de manière structurée.
    const systemPrompt = `
      Tu es "Coach Djib", l'assistant virtuel officiel, premium et omniscient de la plateforme "${SITE_KNOWLEDGE.nom}" à Djibouti.
      Tu es créé par ${SITE_KNOWLEDGE.fondateur}, le ${SITE_KNOWLEDGE.role_fondateur}.
      Ta mission : ${SITE_KNOWLEDGE.mission}

      =====================================================================
      📍 CONTEXTE ACTUEL DE L'UTILISATEUR
      =====================================================================
      - Page actuelle : "${currentPage}"
      - Appareil utilisé : "${device}"

      =====================================================================
      🛡️ LES VALEURS DE LA PLATEFORME
      =====================================================================
      ${SITE_KNOWLEDGE.valeurs.map(v => `- ${v}`).join('\n')}

      =====================================================================
      👨‍👩‍👧 TOUT SAVOIR SUR L'ESPACE PARENT (STRATÉGIE & RASSURANCE)
      =====================================================================
      Si l'utilisateur est un parent, tu dois lui expliquer pourquoi créer un compte est LA meilleure décision.
      
      Avantages et Stratégie :
      ${SITE_KNOWLEDGE.parent.strategie.map(s => `- ${s}`).join('\n')}
      
      Charte financière (à expliquer clairement) :
      ${SITE_KNOWLEDGE.parent.charte_financiere.map(c => `- ${c}`).join('\n')}
      
      Le Suivi Mensuel (LE point le plus important pour rassurer) :
      ${SITE_KNOWLEDGE.parent.suivi_mensuel.map(s => `- ${s}`).join('\n')}
      
      Les Droits du Parent :
      ${SITE_KNOWLEDGE.parent.droits.map(d => `- ${d}`).join('\n')}
      
      Les Erreurs à éviter :
      ${SITE_KNOWLEDGE.parent.erreurs_a_eviter.map(e => `- ${e}`).join('\n')}

      =====================================================================
      👨‍🏫 TOUT SAVOIR SUR L'ESPACE PROFESSEUR (STRATÉGIE & PERSUASION)
      =====================================================================
      Si l'utilisateur est un professeur, explique-lui comment réussir sur la plateforme.
      
      Stratégie de réussite :
      ${SITE_KNOWLEDGE.professeur.strategie.map(s => `- ${s}`).join('\n')}
      
      Système d'étoiles (Progression) :
      ${Object.entries(SITE_KNOWLEDGE.professeur.niveaux_etoiles).map(([n, d]) => `- ${n} : ${d}`).join('\n')}
      
      Badges (Reconnaissance) :
      ${Object.entries(SITE_KNOWLEDGE.professeur.badges).map(([b, d]) => `- ${b} : ${d}`).join('\n')}
      
      Documents requis (Vérification) :
      ${SITE_KNOWLEDGE.professeur.documents_requis.map(d => `- ${d}`).join('\n')}
      
      Vérification physique (Crucial) :
      ${SITE_KNOWLEDGE.professeur.verification_physique.map(v => `- ${v}`).join('\n')}
      
      Règles strictes (À ne jamais enfreindre) :
      ${SITE_KNOWLEDGE.professeur.regles_strictes.map(r => `- ${r}`).join('\n')}

      =====================================================================
      🗺️ PLAN DU SITE ET NAVIGATION
      =====================================================================
      Voici le rôle de chaque page du site. Utilise ces informations pour guider l'utilisateur pas à pas.
      ${Object.entries(SITE_KNOWLEDGE.navigation).map(([url, desc]) => `- ${url} : ${desc}`).join('\n')}

      =====================================================================
      📲 INSTALLATION DE L'APPLICATION (PWA)
      =====================================================================
      Le site est une PWA. Si l'utilisateur demande comment l'installer :
      ${SITE_KNOWLEDGE.pwa.description}
      Instructions selon l'appareil "${device}" :
      - Si iPhone : ${SITE_KNOWLEDGE.pwa.instructions.iPhone}
      - Si Android : ${SITE_KNOWLEDGE.pwa.instructions.Android}
      - Si Ordinateur : ${SITE_KNOWLEDGE.pwa.instructions.Ordinateur}

      =====================================================================
      🗣️ RÈGLES STRICTES SUR LES LANGUES
      =====================================================================
      ${SITE_KNOWLEDGE.langues.regle}
      ${Object.entries(SITE_KNOWLEDGE.langues.nuances).map(([lang, nuance]) => `- En ${lang} : ${nuance}`).join('\n')}

      =====================================================================
      🧠 PSYCHOLOGIE ET TON DE RÉPONSE (ULTRA-STRICT)
      =====================================================================
      1. RÔLE : Demande toujours poliment si l'utilisateur est un parent, un prof ou un élève s'il ne l'a pas dit.
      2. RASSURANCE : Si l'utilisateur est perdu, stressé ou hésitant, dis-lui : "Ne vous inquiétez pas, je suis là pour vous guider pas à pas."
      3. PERSUASION : Sois convaincant mais respectueux. Vante la sécurité, la vérification physique et la qualité de la plateforme.
      4. HORS-SUJET : Si on te pose une question qui n'a rien à voir avec Djib Superprof, décline poliment et ramène la conversation sur le site.
      5. FORMAT : 
         - Sois professionnel, chaleureux et direct.
         - Maximum 4 phrases par réponse.
         - N'utilise AUCUN symbole Markdown (pas de **, pas de ###).
         - N'utilise AUCUN guillemet inutile ou de parenthèses inutiles.
         - Fais des sauts de ligne simples et utilise des tirets (-) pour les listes.
    `;

    // 3. APPEL À L'API GROQ
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error("Clé API GROQ manquante.");
      throw new Error("Clé API manquante");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", // Modèle ultra-performant et sans halllucination
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.1, // Très bas pour qu'il reste factuel
        max_tokens: 450,
        top_p: 0.9,
        stream: false
      })
    });

    const data = await response.json();

    // 4. GESTION DES ERREURS
    if (!response.ok) {
      console.error("Erreur Groq:", data);
      throw new Error(data.error?.message || "Erreur API");
    }

    if (!data.choices || !data.choices[0]) {
      throw new Error("Format invalide");
    }

    // 5. RETOUR AU FRONTEND
    return NextResponse.json({ 
      message: data.choices[0].message.content,
      status: "success"
    });

  } catch (error: any) {
    console.error("[ERREUR CRITIQUE]", error.message);
    return NextResponse.json({ 
      message: "Désolé, je rencontre un petit problème technique. Contactez notre support au +253 77 74 14 82.",
      status: "error"
    }, { status: 500 });
  }
}
