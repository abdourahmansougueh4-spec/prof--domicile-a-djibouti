import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================
// ROUTES PUBLIQUES (pas besoin d'auth)
// ============================================================

const ROUTES_PUBLIQUES = [
  '/',
  '/login',
  '/inscription',
  '/mot-de-passe-oublie',
  '/nouveau-mot-de-passe',
  '/apropos',
  '/contact',
  '/professeurs',
  '/recherche',
]

const ROUTE_ADMIN = '/zx-4f8b2e-9d3a-ctrl'
const ROUTE_PARENT = '/espace-parent'
const ROUTE_PROF = '/espace-professeur'

// ============================================================
// MIDDLEWARE
// ============================================================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ============================================================
  // 1. TOUJOURS LAISSER PASSER : assets, API publiques
  // ============================================================

  // Fichiers statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // fichiers avec extension (images, favicon, etc.)
  ) {
    return NextResponse.next()
  }

  // ============================================================
  // 2. ROUTES PUBLIQUES → passer sans rien vérifier (RAPIDE)
  // ============================================================

  const estPublique = ROUTES_PUBLIQUES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )

  if (estPublique) {
    return NextResponse.next()
  }

  // ============================================================
  // 3. APIs → on laisse passer (les API gèrent leur propre auth)
  // ============================================================

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ============================================================
  // 4. ROUTES PROTÉGÉES → vérifier auth (avec timeout + try/catch)
  // ============================================================

  const estEspaceParent = pathname.startsWith(ROUTE_PARENT)
  const estEspaceProf = pathname.startsWith(ROUTE_PROF)
  const estEspaceAdmin = pathname.startsWith(ROUTE_ADMIN)

  if (!estEspaceParent && !estEspaceProf && !estEspaceAdmin) {
    // Route inconnue → passer
    return NextResponse.next()
  }

  // Créer le client Supabase
  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // ✅ Timeout de 5s pour ne pas bloquer
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 5000)
    )

    const userPromise = supabase.auth.getUser()

    const result = await Promise.race([userPromise, timeoutPromise])
    const user = result.data?.user

    // Pas connecté → redirection vers login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Récupérer le rôle (avec timeout aussi)
    const profileTimeoutPromise = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 5000)
    )

    const profilePromise = supabase
      .from('profiles')
      .select('role, banni')
      .eq('id', user.id)
      .single()

    const profileResult = await Promise.race([
      profilePromise,
      profileTimeoutPromise,
    ])

    const profile = profileResult.data as { role: string; banni: boolean } | null

    // Si timeout ou pas de profil → laisser passer (les pages ont leur propre guard)
    if (!profile) {
      return supabaseResponse
    }

    const { role, banni } = profile

    // Utilisateur banni → déconnexion
    if (banni) {
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.error('Signout error:', e)
      }
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Mauvais rôle → accueil
    if (estEspaceParent && role !== 'parent') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (estEspaceProf && role !== 'professeur') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (estEspaceAdmin && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // ⚠️ Erreur réseau / timeout → on laisse passer
    // Les pages individuelles ont leur propre guard
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// ============================================================
// CONFIG
// ============================================================

export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     * - _next/static, _next/image
     * - favicon.ico
     * - fichiers statiques (images, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}