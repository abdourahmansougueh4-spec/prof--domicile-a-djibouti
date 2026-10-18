import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Fonction pour générer un code à 6 chiffres
const genererCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    // 1. Vérifier que l'appelant est bien un admin
    const cookieStore = await cookies()
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user: caller } } = await supabaseServer.auth.getUser()
    const { data: callerProfile } = await supabaseServer
      .from('profiles').select('role').eq('id', caller?.id).single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { email } = await request.json()

    // 2. Supprimer les anciens codes pour cet email
    await supabaseAdmin
      .from('reset_codes')
      .delete()
      .eq('email', email)
      .eq('used', false)

    // 3. Générer un nouveau code à 6 chiffres
    const code = genererCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // 4. Enregistrer le code dans la table reset_codes
    const { error: insertError } = await supabaseAdmin
      .from('reset_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Erreur insert code admin:', insertError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // 5. Logger l'action admin
    await supabaseAdmin.from('admin_logs').insert({
      action: 'generer_code_acces_admin',
      details: `Code à 6 chiffres généré pour ${email}`,
    })

    return NextResponse.json({ 
      success: true, 
      code: code,
      expires_in: '15 minutes'
    })

  } catch (error: any) {
    console.error('Erreur API God Mode:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
