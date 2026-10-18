import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ============================================================
// CLIENT SUPABASE ADMIN
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
// VALIDATION EMAIL
// ============================================================

const emailValide = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(email) && email.length <= 254
}

// ============================================================
// POST — Vérifier si un email existe (auth.users = source de vérité)
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const emailBrut = typeof body?.email === 'string' ? body.email : ''

    const email = emailBrut.trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'Email manquant' },
        { status: 400 }
      )
    }

    if (!emailValide(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // 🎯 On cherche dans auth.users (source de vérité)
    // On liste les users et on filtre par email
    // (Supabase Admin API ne permet pas encore de filtrer par email directement)
    let page = 1
    const perPage = 1000
    let userTrouve: any = null

    while (page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (error) {
        console.error('Erreur listUsers:', error)
        return NextResponse.json(
          { error: 'Erreur serveur' },
          { status: 500 }
        )
      }

      const found = data.users.find(
        (u) => u.email?.toLowerCase() === email
      )

      if (found) {
        userTrouve = found
        break
      }

      // Plus de pages à parcourir
      if (data.users.length < perPage) break
      page++
    }

    return NextResponse.json({
      existe: userTrouve !== null,
    })
  } catch (error: any) {
    console.error('Erreur API verifier-email:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
