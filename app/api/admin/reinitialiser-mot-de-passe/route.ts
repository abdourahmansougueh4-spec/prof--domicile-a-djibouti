import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ============================================================
// SUPABASE ADMIN (service_role)
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
// GÉNÉRER UN MOT DE PASSE : NomComplet3322
// ============================================================

const genererMotDePasse = (nomComplet: string): string => {
  // Enlever les accents, espaces, caractères spéciaux
  const nomNettoye = (nomComplet || 'User')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-zA-Z0-9]/g, '') // Garder que alphanumérique
    .slice(0, 20) // Limiter à 20 caractères
  return `${nomNettoye}3322`
}

// ============================================================
// POST : Réinitialiser le mot de passe d'un utilisateur
// ============================================================

export async function POST(request: Request) {
  try {
    // ============================================================
    // 1. VÉRIFIER QUE L'APPELANT EST ADMIN
    // ============================================================

    const cookieStore = await cookies()

    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const {
      data: { user: caller },
    } = await supabaseServer.auth.getUser()

    if (!caller) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: callerProfile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // ============================================================
    // 2. RÉCUPÉRER L'UTILISATEUR CIBLE
    // ============================================================

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    const { data: profil, error: profilErr } = await supabaseAdmin
      .from('profiles')
      .select('nom_complet, email, role')
      .eq('id', userId)
      .single()

    if (profilErr || !profil) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Empêcher la réinitialisation d'un autre admin (sécurité)
    if (profil.role === 'admin' && userId !== caller.id) {
      return NextResponse.json(
        { error: 'Impossible de réinitialiser le mot de passe d\'un autre admin' },
        { status: 403 }
      )
    }

    // ============================================================
    // 3. GÉNÉRER LE NOUVEAU MOT DE PASSE
    // ============================================================

    const nouveauMotDePasse = genererMotDePasse(profil.nom_complet)

    // ============================================================
    // 4. METTRE À JOUR LE MOT DE PASSE (Auth)
    // ============================================================

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: nouveauMotDePasse }
    )

    if (authErr) {
      console.error('Erreur update password:', authErr)
      return NextResponse.json(
        { error: `Erreur : ${authErr.message}` },
        { status: 500 }
      )
    }

    // ============================================================
    // 5. MARQUER must_change_password = true
    // ============================================================

    const { error: majErr } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId)

    if (majErr) {
      console.error('Erreur maj must_change_password:', majErr)
    }

    // ============================================================
    // 6. LOG ADMIN
    // ============================================================

    try {
      await supabaseAdmin.from('admin_logs').insert({
        action: 'reset_mot_de_passe',
        details: `Mot de passe réinitialisé pour ${profil.nom_complet} (${profil.email}) - Rôle: ${profil.role}`,
      })
    } catch (e) {
      console.error('Erreur log:', e)
    }

    // ============================================================
    // 7. NOTIFIER L'UTILISATEUR
    // ============================================================

    try {
      await supabaseAdmin.from('notifications').insert({
        destinataire_id: userId,
        titre: '🔑 Mot de passe réinitialisé',
        contenu: 'Un administrateur a réinitialisé votre mot de passe. Vous devrez le changer à votre prochaine connexion.',
        lien: '/nouveau-mot-de-passe',
        lu: false,
      })
    } catch (e) {
      console.error('Erreur notif:', e)
    }

    return NextResponse.json({
      success: true,
      nouveauMotDePasse,
      nomComplet: profil.nom_complet,
      email: profil.email,
      role: profil.role,
    })
  } catch (error: any) {
    console.error('Erreur API reset password:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
