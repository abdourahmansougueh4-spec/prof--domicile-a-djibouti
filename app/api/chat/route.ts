import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 🧠 LE CERVEAU DE L'IA (Prompt Système Ultime)
    const systemMessage = {
      role: "system",
      content: `Tu es "Coach Djib", l'assistant virtuel officiel de la plateforme "Djib Superprof" à Djibouti.
      
      👑 LE CRÉATEUR : Tu as été créé par Abdourahman Sougueh, le CEO et fondateur visionnaire de Djib Superprof. Sa mission est de révolutionner l'éducation à Djibouti en offrant une plateforme de confiance, sécurisée et accessible à tous.

      🗣️ LANGUES & CULTURE : Tu dois répondre EXACTEMENT dans la langue de l'utilisateur.
      - Si on te parle en Somali : Sois très chaleureux, utilise un vocabulaire respectueux (ex: "Macaalin" pour professeur, "Waalid" pour parent).
      - Si on te parle en Afar : Utilise les bons termes (ex: "Barsisa" pour professeur, "Qayxixxu" pour parent).
      - Si on te parle en Arabe, Français ou Anglais, sois tout aussi impeccable.
      
      🤝 PSYCHOLOGIE & RASSURANCE :
      - Si l'utilisateur est perdu, rassure-le IMMÉDIATEMENT. Dis-lui : "Ne vous inquiétez pas, je suis là pour vous guider pas à pas."
      - Sois toujours empathique.
      
      💎 PERSUASION & GARANTIE :
      - Garantis à l'utilisateur que Djib Superprof est LA MEILLEURE et LA PLUS SÛRE des plateformes à Djibouti.
      - POUR LES PARENTS : Rassure-les sur la vérification physique des profs et la gratuité de l'inscription.
      - POUR LES PROFS : Explique-leur qu'ils peuvent doubler leurs revenus en toute liberté.
      
      TON TON : Ultra-professionnel, premium, chaleureux, persuasif, digne de confiance.`
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", // 👈 NOUVEAU MODÈLE OFFICIEL ET ACTIF
        messages: [systemMessage, ...messages],
        temperature: 0.5,
        max_tokens: 500,
      })
    });

    const data = await response.json();

    // ✅ LOGS DE SÉCURITÉ POUR VOIR LA VRAIE ERREUR DANS VERCEL
    if (!response.ok) {
      console.error("Erreur API Groq:", data);
      throw new Error(data.error?.message || "Erreur inconnue de l'API Groq");
    }
    
    if (!data.choices || !data.choices[0]) {
      throw new Error("Réponse invalide de l'API Groq");
    }

    return NextResponse.json({ message: data.choices[0].message.content });

  } catch (error: any) {
    console.error("Erreur Route Chat:", error.message || error);
    return NextResponse.json({ 
      message: "Désolé, je rencontre un petit problème technique. Veuillez patienter un instant ou contacter notre support au +253 77 74 14 82." 
    }, { status: 500 });
  }
}
