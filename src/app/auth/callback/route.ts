import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { destinoAposLogin } from '@sintera/core'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // REDIRECIONAMENTO ABERTO, corrigido em 27/09/2026. Isto era `searchParams.get('next') ?? '/dashboard'`,
  // concatenado cru em `${origin}${next}`. Com `?next=@sitefalso.com` a URL virava
  // `https://sinteramais.com.br@sitefalso.com` — e o navegador lê a nossa origem como NOME DE USUÁRIO e vai
  // para sitefalso.com. Logo depois de a pessoa digitar a senha, que é quando ela mais acredita no que vê.
  //
  // `destinoAposLogin` é a única porta, e é a mesma que o `/login` usa: só caminho relativo da plataforma.
  const next = destinoAposLogin(searchParams.get('next'))

  if (code) {
    // Vincula os cookies de sessão diretamente à resposta de redirect.
    // (Antes usávamos cookies() do next/headers, que não anexava o Set-Cookie
    // à resposta de redirect de forma confiável — causava bounce na 1ª tentativa
    // do login OAuth: a 1ª volta chegava sem sessão e o proxy mandava de volta.)
    const response = NextResponse.redirect(`${origin}${next}`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
