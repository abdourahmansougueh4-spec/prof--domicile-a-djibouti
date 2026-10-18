import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
// POST : Vérifier un code
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const code = typeof body?.code === 'string' ? body.code.trim() : ''

    if (!email || !code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Email et code requis' },
        { status: 400 }
      )
    }

    // 1. Chercher le code dans la base
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('reset_codes')
      .select('id, code, expires_at, used')
      .eq('email', email)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (codeError) {
      console.error('Erreur recherche code:', codeError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (!codeData) {
      return NextResponse.json(
        { error: 'Code introuvable ou déjà utilisé. Demandez un nouveau code.' },
        { status: 400 }
      )
    }

    // 2. Vérifier l'expiration
    if (new Date(codeData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Ce code a expiré. Demandez un nouveau code.' },
        { status: 400 }
      )
    }

    // 3. Vérifier le code
    if (codeData.code !== code) {
      return NextResponse.json(
        { error: 'Code incorrect. Vérifiez et réessayez.' },
        { status: 400 }
      )
    }

    // 4. Marquer comme utilisé
    await supabaseAdmin
      .from('reset_codes')
      .update({ used: true })
      .eq('id', codeData.id)

    // 5. Récupérer l'utilisateur
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    const user = usersData?.users.find(
      (u) => u.email?.toLowerCase() === email
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // 6. Marquer must_change_password = true
    await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', user.id)

    // 7. Générer un lien magique pour connecter l'utilisateur
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

    if (linkError) {
      console.error('Erreur generateLink:', linkError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      hashedToken: linkData.properties?.hashed_token,
    })
  } catch (error: any) {
    console.error('Erreur API:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
