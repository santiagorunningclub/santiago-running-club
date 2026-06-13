import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state') // pasamos el user id como state

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/profile?strava=error', request.url))
  }

  // Intercambiar código por tokens
  const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    })
  })

  const tokenData = await tokenResponse.json()

  if (tokenData.errors) {
    return NextResponse.redirect(new URL('/profile?strava=error', request.url))
  }

  // Guardar tokens en el perfil del usuario
  await supabaseAdmin.from('profiles').update({
    strava_athlete_id: tokenData.athlete.id,
    strava_access_token: tokenData.access_token,
    strava_refresh_token: tokenData.refresh_token,
    strava_token_expires_at: tokenData.expires_at,
    strava_connected: true
  }).eq('id', userId)

  return NextResponse.redirect(new URL('/profile?strava=success', request.url))
}
