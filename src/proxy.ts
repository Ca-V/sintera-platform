import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// CORS para as rotas /api — habilita clientes cross-origin (ex.: o app Mobile rodando
// como PWA web num outro domínio). As rotas de API usam Bearer (não cookie) no acesso
// cross-origin, então liberar a origem é seguro: o atacante não tem o token da usuária.
// A Web continua same-origin (CORS não se aplica).
function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── /api: só CORS (preflight + cabeçalhos), sem a lógica de sessão/redirect da Web ──
  if (pathname.startsWith('/api')) {
    const headers = corsHeaders(request.headers.get('origin'))
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers })
    }
    const res = NextResponse.next({ request })
    for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
    return res
  }

  let supabaseResponse = NextResponse.next({ request })

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

  // getSession() reads the JWT from the cookie without a network call —
  // avoids SSL errors and is fast enough for route protection.
  // Actual data security is enforced by Supabase RLS on every query.
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthed = !!session?.user

  // Unauthenticated user tries to access dashboard
  if (!isAuthed && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated user lands on /login — send to dashboard
  // Only redirect on exact /login to avoid catching /login?error=... loops
  if (isAuthed && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.svg|.*\\.png|.*\\.ico).*)',
  ],
}
