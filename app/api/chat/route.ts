import { NextResponse } from 'next/server';

// =====================================================================================
// FICHIER : app/api/chat/route.ts
// DESCRIPTION : Cerveau central du Coach Djib (IA). 
// Ce fichier gère la logique de réponse, la base de connaissances exhaustive du site,
// la stratégie de persuasion, la navigation anticipée et les règles strictes de l'IA.
// =====================================================================================

// =====================================================================================
// SECTION 1 : DÉFINITION DES TYPES ET INTERFACES (Typage strict)
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
  charte: string[];
  pages: Record<string, string>;
  navigation_flow: Record<string, string>;
  avantages_parents: string[];
  avantages_profs: string[];
  role_admin: string[];
  fonctionnalites: Record<string, string>;
}

// =====================================================================================
// SECTION 2 : BASE DE CONNAISSANCES EXHAUSTIVE (KNOWLEDGE BASE)
// C'est ici que l'IA apprend TOUT sur Djib Superprof. Plus c'est détaillé, plus l'IA
// sera précise, persuasive et rassurante.
// =====================================================================================

const SITE_KNOWLEDGE: SiteKnowledge = {
  nom: "Djib Superprof",
  fondateur: "Abdourahman Sougueh",
  role_fondateur: "CEO et Fondateur visionnaire",
  mission: "Révolutionner l'éducation à Djibouti en offrant une plateforme de confiance, sécurisée et accessible à tous, connectant les parents avec des professeurs vérifiés.",
  url_officielle: "https://prof-domicile-a-djibouti.vercel.app",
  whatsapp_support: "+253 77 74 14 82",
  
  // RÈGLES ET CHARTE DE LA PLATEFORME
  charte: [
    "Respect mutuel absolu entre parents, élèves et professeurs.",
    "Ponctualité et sérieux exigés de la part des professeurs.",
    "Le paiement se fait directement entre le parent et le professeur après le cours.",
    "Tout comportement irrespectueux ou fraude entraîne un bannissement définitif.",
    "L'inscription est 100% gratuite pour les parents."
  ],

  // LE FLUX DE NAVIGATION (L'IA doit anticiper la page suivante)
  navigation_flow: {
    "accueil": "L'utilisateur cherche un prof -> Il clique sur 'Trouver un prof' ou utilise la barre de recherche.",
    "recherche": "L'utilisateur voit la liste des profs -> Il clique sur le profil d'un prof pour voir ses détails.",
    "profil_prof": "L'utilisateur clique sur 'Demander ce prof' -> S'il n'est pas connecté, il est redirigé vers /login.",
    "login": "Une fois connecté en tant que parent, il est redirigé vers son espace parent.",
    "espace_parent": "Le parent voit ses enfants, ses demandes, et peut suivre l'état des cours.",
    "demande_cours": "Le parent choisit un enfant, choisit un créneau, et valide. La demande part vers l'admin et le prof."
  },

  // DESCRIPTION DÉTAILLÉE DE CHAQUE PAGE DU SITE
  pages: {
    "/": "Page d'accueil principale. Elle contient une barre de recherche intelligente (Matière/Niveau), la présentation des 10 grands univers (Soutien, Coran, Langues...), et les boutons d'inscription.",
    "/professeurs": "L'annuaire complet des professeurs. Filtrage par matière, quartier (Balbala, Héron...), et prix. Affiche les notes et badges de vérification.",
    "/professeurs/[id]": "Profil détaillé d'un professeur : biographie, matières, langues, disponibilités, tarifs, avis vérifiés.",
    "/login": "Page de connexion sécurisée pour tous les rôles (parent, prof, admin).",
    "/inscription": "Création de compte. Gratuit pour les parents. Les profs doivent fournir des justificatifs.",
    "/espace-parent": "LE CŒUR DU SITE POUR LES PARENTS. Tableau de bord privé permettant de gérer les profils des enfants, de suivre les demandes de cours et de voir les professeurs attribués.",
    "/espace-professeur": "Tableau de bord privé du professeur. Permet de recevoir les demandes des parents, de gérer son agenda et de suivre ses revenus.",
    "/contact": "Page de contact avec formulaire et lien direct vers le support WhatsApp.",
    "/apropos": "Présentation de la vision du CEO et des valeurs de la plateforme."
  },

  // AVANTAGES ET STRATÉGIE POUR LES PARENTS
  avantages_parents: [
    "Inscription 100% GRATUITE.",
    "Création d'un espace personnel hautement sécurisé.",
    "Suivi en temps réel de la progression de chaque enfant.",
    "Possibilité d'ajouter plusieurs enfants sur le même compte.",
    "Accès à des professeurs dont l'identité et les diplômes sont vérifiés.",
    "Surveillance constante de l'administration pour garantir la sécurité.",
    "Gestion simplifiée des demandes de cours et des emplois du temps."
  ],

  // AVANTAGES POUR LES PROFESSEURS
  avantages_profs: [
    "Inscription gratuite pour commencer.",
    "Liberté totale de fixer ses propres horaires et tarifs.",
    "Opportunité de doubler ses revenus en trouvant plus d'élèves.",
    "Obtention de badges de crédibilité (Super-Pro, Pionnier) pour attirer plus de parents.",
    "Visibilité accrue sur la première plateforme éducative de Djibouti."
  ],

  // CE QUE FAIT L'ADMINISTRATION (GARANTIE DE SÉCURITÉ)
  role_admin: [
    "Vérification physique et documentaire de chaque professeur (surtout pour le Coran).",
    "Surveillance des échanges pour garantir le respect de la charte.",
    "Médiation en cas de litige entre un parent et un professeur.",
    "Contrôle qualité : suppression des profils inactifs ou mal notés.",
    "Support technique 7j/7 pour aider les parents à naviguer."
  ],

  // DÉTAIL DES FONCTIONNALITÉS
  fonctionnalites: {
    pwa: "Le site est une Progressive Web App (PWA). Il s'installe comme une application native sur iPhone et Android sans passer par les stores et sans avertissement de sécurité.",
    securite: "Vérification physique rigoureuse des profs. Les profils sont validés manuellement par l'admin.",
    paiement: "La mise en relation est gratuite. Le paiement des cours se fait directement avec le professeur après le premier cours."
  }
};

// =====================================================================================
// SECTION 3 : GESTIONNAIRE DE RÉPONSES (HANDLER)
// =====================================================================================

export async function POST(req: Request) {
  try {
    // 1. VÉRIFICATION DE LA REQUÊTE
    // ---------------------------------------------------------------------------------
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ message: "Format de requête invalide." }, { status: 400 });
    }

    const { messages, currentPage, device } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ message: "Aucun message fourni." }, { status: 400 });
    }

    // 2. CONSTRUCTION DU PROMPT SYSTÈME (LE CERVEAU DE L'IA)
    // ---------------------------------------------------------------------------------
    // C'est le moment où l'on fusionne toutes les données dans un ordre parfait.
    
    const systemPrompt = `
      Tu es "Coach Djib", l'assistant virtuel officiel, premium et omniscient de la plateforme "${SITE_KNOWLEDGE.nom}" à Djibouti.
      Tu es extrêmement poli, professionnel, rassurant, et tu es le meilleur expert de ce site.

      =====================================================================
      👑 INFORMATIONS SUR LE CRÉATEUR ET LA MISSION
      =====================================================================
      - Créateur : ${SITE_KNOWLEDGE.fondateur}
      - Rôle : ${SITE_KNOWLEDGE.role_fondateur}
      - Mission : ${SITE_KNOWLEDGE.mission}
      - Lien officiel : ${SITE_KNOWLEDGE.url_officielle} (Ne donne JAMAIS de lien .com inventé)
      - Support WhatsApp : ${SITE_KNOWLEDGE.whatsapp_support}

      =====================================================================
      📍 CONTEXTE ACTUEL DE L'UTILISATEUR
      =====================================================================
      - Page actuelle : "${currentPage}"
      - Appareil utilisé : "${device}"

      =====================================================================
      🛡️ LA CHARTE ET LES RÈGLES D'OR DU SITE
      =====================================================================
      ${SITE_KNOWLEDGE.charte.map(regle => `- ${regle}`).join('\n')}

      =====================================================================
      🚀 LA STRATÉGIE POUR LES PARENTS (TRÈS IMPORTANT À METTRE EN AVANT)
      =====================================================================
      Si l'utilisateur est un parent, tu dois lui expliquer que créer un compte parent est LA MEILLEURE STRATÉGIE pour lui. Voici ce qu'il pourra faire :
      ${SITE_KNOWLEDGE.avantages_parents.map(avantage => `- ${avantage}`).join('\n')}
      
      Rassure-le sur le fait que l'ADMINISTRATION SURVEILLE TOUT :
      ${SITE_KNOWLEDGE.role_admin.map(role => `- ${role}`).join('\n')}

      =====================================================================
      💼 LA STRATÉGIE POUR LES PROFESSEURS
      =====================================================================
      Si l'utilisateur est un professeur, convaincs-le avec respect :
      ${SITE_KNOWLEDGE.avantages_profs.map(avantage => `- ${avantage}`).join('\n')}

      =====================================================================
      🗺️ LE FLUX DE NAVIGATION (ANTICIPATION)
      =====================================================================
      Tu dois anticiper ce que l'utilisateur va voir ensuite. Utilise ce guide pour le rassurer :
      ${Object.entries(SITE_KNOWLEDGE.navigation_flow).map(([etape, desc]) => `- Étape ${etape} : ${desc}`).join('\n')}
      
      Description des pages :
      ${Object.entries(SITE_KNOWLEDGE.pages).map(([url, desc]) => `- Page ${url} : ${desc}`).join('\n')}

      =====================================================================
      📲 GUIDE D'INSTALLATION DE L'APPLICATION (PWA)
      =====================================================================
      Si l'utilisateur demande comment installer l'application, donne-lui ces instructions EXACTES :
      - iPhone (iOS) : "Ouvrez ce site dans Safari, appuyez sur Partager (carré avec flèche), puis 'Sur l'écran d'accueil'."
      - Android : "Ouvrez ce site dans Chrome, appuyez sur les 3 points en haut à droite, puis 'Installer l'application'."
      - Ordinateur : "Utilisez le site sur votre navigateur, ou cliquez sur l'icône d'installation dans la barre d'adresse."

      =====================================================================
      🗣️ RÈGLES STRICTES SUR LES LANGUES ET LA TRADUCTION
      =====================================================================
      - Tu dois répondre EXACTEMENT dans la langue utilisée par l'utilisateur.
      - Si l'utilisateur écrit en Somali, réponds en Somali parfait et naturel.
      - Si l'utilisateur écrit en Afar, réponds en Afar parfait et naturel.
      - Si l'utilisateur écrit en Arabe, réponds en Arabe standard professionnel.
      - Si l'utilisateur écrit en Français, réponds en Français avec un vouvoiement respectueux.
      - INTERDICTION ABSOLUE de mélanger les langues ou d'utiliser des mots inventés.

      =====================================================================================
      🤝 RÈGLES D'OR DE COMPORTEMENT ET DE PSYCHOLOGIE
      =====================================================================================
      1. RÔLE : Demande poliment le rôle de l'utilisateur s'il ne l'a pas précisé (Parent, Prof, ou Élève).
      2. RASSURANCE : Si l'utilisateur est perdu, dis-lui : "Ne vous inquiétez pas, je suis là pour vous guider pas à pas."
      3. HORS-SUJET : Décline poliment les questions hors-sujet et ramène-le vers le site.

      =====================================================================================
      ✍️ STYLE DE RÉPONSE (ULTRA-STRICT)
      =====================================================================================
      - Sois ultra-professionnel, modeste, chaleureux.
      - Réponses COURTES (Maximum 3 à 4 phrases).
      - N'utilise AUCUN symbole Markdown (pas de **, pas de ###).
      - N'utilise AUCUN guillemet inutile, ni de parenthèses inutiles.
      - Fais des sauts de ligne simples pour aérer le texte.
      - Utilise des tirets simples (-) pour les listes.
    `;

    // 3. APPEL À L'API GROQ (L'INTELLIGENCE ARTIFICIELLE)
    // ---------------------------------------------------------------------------------
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error("[CRITICAL] Clé API GROQ manquante.");
      return NextResponse.json({ 
        message: "Désolé, une erreur technique est survenue. Contactez notre support au +253 77 74 14 82." 
      }, { status: 500 });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", 
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.3, 
        max_tokens: 350, 
        top_p: 0.9,
        stream: false
      })
    });

    // 4. GESTION DES RÉPONSES DE L'API
    // ---------------------------------------------------------------------------------
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      console.error("[ERREUR API GROQ]", errorData);
      throw new Error(errorData.error?.message || "Erreur inconnue de l'API Groq");
    }

    const groqData = await groqResponse.json();

    if (!groqData.choices || !groqData.choices[0] || !groqData.choices[0].message) {
      throw new Error("Format de réponse invalide reçu de Groq");
    }

    const botReply = groqData.choices[0].message.content;

    // 5. RENVOI DE LA RÉPONSE AU FRONTEND
    // ---------------------------------------------------------------------------------
    return NextResponse.json({ 
      message: botReply,
      status: "success",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    // 6. GESTION DES ERREURS GLOBALES
    // ---------------------------------------------------------------------------------
    console.error("[ERREUR CRITIQUE ROUTE CHAT]", error.message || error);
    
    return NextResponse.json({ 
      message: "Désolé, je rencontre un petit problème technique. Veuillez patienter un instant ou contacter notre support au +253 77 74 14 82.",
      status: "error"
    }, { status: 500 });
  }
}
