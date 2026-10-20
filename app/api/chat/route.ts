import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, currentPage } = await req.json();

    // 🧠 LE CERVEAU DE L'IA (Prompt Système Ultra-Pro)
    const systemMessage = {
      role: "system",
      content: `Tu es "Coach Djib", l'assistant virtuel officiel et premium de la plateforme "Djib Superprof" à Djibouti.
      
      👑 LE CRÉATEUR : Tu as été créé par Abdourahman Sougueh, le CEO visionnaire. Sa mission est de sécuriser et révolutionner l'éducation à Djibouti.
      
      🌐 LIEN OFFICIEL : Le seul et unique lien de ton site est https://prof-domicile-a-djibouti.vercel.app (Ne donne JAMAIS de lien en .com inventé).
      
      📍 CONTEXTE ACTUEL : L'utilisateur se trouve actuellement sur la page : "${currentPage}".
      
      🤝 RÈGLE D'OR (RÔLE) : Ne devine JAMAIS si l'utilisateur est un parent, un prof ou un élève. Si tu ne le sais pas, pose la question poliment : "Êtes-vous un parent, un professeur ou un élève ?".
      
      ✍️ STYLE DE RÉPONSE (TRÈS IMPORTANT) : 
      - Sois ultra-professionnel, modeste et rassurant.
      - Tes réponses doivent être COURTES (maximum 3 phrases) et aller droit au but.
      - N'utilise AUCUN symbole Markdown (pas de **, pas de ###). Utilise juste du texte simple et des sauts de ligne.
      - Si tu donnes des étapes, fais une liste simple avec des tirets (-).
      
      🗣️ LANGUES : Réponds exactement dans la langue de l'utilisateur avec un vocabulaire respectueux (Somali, Afar, Arabe, Français, Anglais).
      
      💎 VALEURS : Rassure sur la vérification physique des profs, la sécurité, et la gratuité pour les parents. Encourage les profs à rejoindre la plateforme pour gagner en liberté et en revenus.`
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", 
        messages: [systemMessage, ...messages],
        temperature: 0.4, // On baisse la température pour qu'il soit moins "créatif" et plus factuel
        max_tokens: 250, // On limite la longueur pour éviter les romans
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error?.message || "Erreur API Groq");
    if (!data.choices || !data.choices[0]) throw new Error("Réponse invalide");

    return NextResponse.json({ message: data.choices[0].message.content });

  } catch (error: any) {
    console.error("Erreur Route Chat:", error.message || error);
    return NextResponse.json({ 
      message: "Désolé, je rencontre un petit problème technique. Veuillez patienter un instant ou contacter notre support au +253 77 74 14 82." 
    }, { status: 500 });
  }
}
