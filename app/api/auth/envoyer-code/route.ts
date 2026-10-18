import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// ============================================================
// CONFIG SUPABASE ADMIN
// ============================================================

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// ============================================================
// CONFIG GMAIL
// ============================================================

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Anti-spam
  pool: true,
  maxConnections: 1,
  maxMessages: 50,
  tls: {
    rejectUnauthorized: false,
  },
})

// ============================================================
// GÉNÉRER UN CODE À 6 CHIFFRES
// ============================================================

const genererCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ============================================================
// VERSION TEXTE (très important pour éviter le spam)
// ============================================================

const versionTexte = (code: string, nom: string) => `
Bonjour${nom ? ` ${nom}` : ''},

Vous recevez cet email car une réinitialisation de mot de passe a été demandée pour votre compte Djib Superprof.

Votre code de vérification est :

    ${code}

Ce code est valide pendant 15 minutes.

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Votre mot de passe restera inchangé.

---

Djib Superprof
La plateforme éducative de référence à Djibouti

Site web : https://prof-domicile-a-djibouti.vercel.app
Contact : djibsuperprof@gmail.com
Téléphone : +253 77 74 14 82

Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
`.trim()

// ============================================================
// VERSION HTML (simple et efficace)
// ============================================================

const versionHtml = (code: string, nom: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">
                Djib Superprof
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 30px 25px;">
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.5;">
                Bonjour${nom ? ` ${nom}` : ''},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.5;">
                Vous recevez cet email car une réinitialisation de mot de passe a été demandée pour votre compte.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.5;">
                Votre code de vérification est :
              </p>
              
              <!-- Code -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="display: inline-block; padding: 18px 32px; background-color: #f1f5f9; border: 2px solid #0f172a; border-radius: 8px; color: #0f172a; font-size: 28px; font-weight: bold; letter-spacing: 6px; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #334155; font-size: 14px; line-height: 1.5;">
                Ce code est valide pendant <strong>15 minutes</strong>.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Votre mot de passe restera inchangé.
              </p>
            </td>
          </tr>
          
          <!-- Signature -->
          <tr>
            <td style="padding: 20px 25px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #0f172a; font-size: 13px; font-weight: bold;">
                Djib Superprof
              </p>
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                La plateforme éducative de référence à Djibouti
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.6;">
                <a href="https://prof-domicile-a-djibouti.vercel.app" style="color: #2563eb; text-decoration: none;">
                  prof-domicile-a-djibouti.vercel.app
                </a>
                <br>
                Contact : djibsuperprof@gmail.com
                <br>
                Téléphone : +253 77 74 14 82
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 15px; background-color: #f1f5f9; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

// ============================================================
// POST : Envoyer un code
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // 1. Vérifier que l'email existe dans Supabase Auth
    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })

    if (usersError) {
      console.error('Erreur listUsers:', usersError)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === email
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte n\'est associé à cette adresse email.' },
        { status: 404 }
      )
    }

    // 2. Récupérer le prénom
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nom_complet')
      .eq('id', user.id)
      .single()

    const prenom = (profile?.nom_complet || '').split(' ')[0] || ''

    // 3. Supprimer les anciens codes non utilisés
    await supabaseAdmin
      .from('reset_codes')
      .delete()
      .eq('email', email)
      .eq('used', false)

    // 4. Générer un nouveau code
    const code = genererCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // 5. Enregistrer dans la table
    const { error: insertError } = await supabaseAdmin
      .from('reset_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Erreur insert code:', insertError)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    // 6. Envoyer l'email via Gmail avec TOUS les anti-spam
    try {
      await transporter.sendMail({
        // ✅ Expéditeur propre
        from: `"Djib Superprof" <${process.env.GMAIL_USER}>`,

        // ✅ Reply-To : les réponses vont vers une adresse valide
        replyTo: `"Djib Superprof" <${process.env.GMAIL_USER}>`,

        // ✅ Destinataire
        to: email,

        // ✅ Subject optimisé (évite les mots "urgent", "gratuit", etc.)
        subject: `Votre code de vérification — Djib Superprof`,

        // ✅ Version TEXTE (crucial pour éviter le spam)
        text: versionTexte(code, prenom),

        // ✅ Version HTML
        html: versionHtml(code, prenom),

        // ✅ En-têtes professionnels
        headers: {
          'X-Priority': '3', // Priorité normale (pas urgent)
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'X-Mailer': 'DjibSuperprof-Mailer',
          'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Precedence': 'bulk',
          'Auto-Submitted': 'auto-generated',
        },
      })
    } catch (mailError) {
      console.error('Erreur Gmail:', mailError)
      return NextResponse.json(
        { error: 'Impossible d\'envoyer l\'email. Réessayez.' },
        { status: 500 }
      )
    }

    // Log admin
    try {
      await supabaseAdmin.from('admin_logs').insert({
        action: 'envoi_code_reset',
        details: `Code envoyé à ${email}`,
      })
    } catch (e) {
      console.error('Log error:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Code envoyé',
    })
  } catch (error: any) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
