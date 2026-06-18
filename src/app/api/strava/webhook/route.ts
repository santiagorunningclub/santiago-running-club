import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VERIFY_TOKEN = 'srcwebhook2025'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }
  return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
}

export async function POST(request: Request) {
  const body = await request.json()

  if (body.aspect_type === 'create' && body.object_type === 'activity') {
    const athleteId = body.owner_id
    const activityId = body.object_id

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, strava_access_token, strava_refresh_token, strava_token_expires_at')
      .eq('strava_athlete_id', athleteId)
      .single()

    if (!profile) return NextResponse.json({ received: true })

    let accessToken = profile.strava_access_token

    if (profile.strava_token_expires_at < Math.floor(Date.now() / 1000)) {
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: profile.strava_refresh_token
        })
      })
      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token
      await supabaseAdmin.from('profiles').update({
        strava_access_token: refreshData.access_token,
        strava_refresh_token: refreshData.refresh_token,
        strava_token_expires_at: refreshData.expires_at
      }).eq('id', profile.id)
    }

    const activityResponse = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const activity = await activityResponse.json()

    if (activity.manual === true) {
      return NextResponse.json({ received: true })
    }

    if (activity.type === 'Run' || activity.type === 'TrailRun' || activity.type === 'VirtualRun') {
      const distanceKm = activity.distance / 1000
      const durationMinutes = Math.round(activity.moving_time / 60)
      const paceSecondsPerKm = activity.moving_time / distanceKm
      const paceMin = Math.floor(paceSecondsPerKm / 60)
      const paceSec = Math.round(paceSecondsPerKm % 60)
      const isRealisticPace = paceSecondsPerKm >= 120

      const { error: insertError } = await supabaseAdmin.from('activities').insert([{
        user_id: profile.id,
        type: activity.workout_type === 1 ? 'race' : 'run',
        distance_km: Math.round(distanceKm * 100) / 100,
        duration_minutes: durationMinutes,
        pace_avg: `${paceMin}:${paceSec.toString().padStart(2, '0')}`,
        recorded_at: activity.start_date,
        strava_activity_id: activityId,
        avg_heartrate: activity.average_heartrate || null,
        max_heartrate: activity.max_heartrate || null,
        avg_cadence: activity.average_cadence ? Math.round(activity.average_cadence * 2) : null,
        elevation_gain: activity.total_elevation_gain || null,
        has_heartrate: activity.has_heartrate || false,
        valid: isRealisticPace
      }])

      if (!insertError) {
        const { data: allActivities } = await supabaseAdmin.from('activities').select('distance_km, recorded_at').eq('user_id', profile.id).eq('valid', true)
        const totalKm = (allActivities || []).reduce((sum, a) => sum + a.distance_km, 0)
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
        const weeklyKm = (allActivities || []).filter(a => new Date(a.recorded_at) > weekAgo).reduce((sum, a) => sum + a.distance_km, 0)

        const { data: paceActivities } = await supabaseAdmin.from('activities').select('distance_km, duration_minutes').eq('user_id', profile.id).eq('valid', true)
        let paceAvg = null
        if (paceActivities && paceActivities.length > 0) {
          const totalDist = paceActivities.reduce((s, a) => s + a.distance_km, 0)
          const totalDur = paceActivities.reduce((s, a) => s + a.duration_minutes, 0)
          if (totalDist > 0) {
            const avgPaceSec = (totalDur * 60) / totalDist
            const m = Math.floor(avgPaceSec / 60)
            const s = Math.round(avgPaceSec % 60)
            paceAvg = `${m}:${s.toString().padStart(2, '0')}`
          }
        }

        await supabaseAdmin.from('profiles').update({
          total_km: Math.round(totalKm * 100) / 100,
          weekly_km: Math.round(weeklyKm * 100) / 100,
          ...(paceAvg ? { pace_avg: paceAvg } : {})
        }).eq('id', profile.id)
      }
    }
  }

  return NextResponse.json({ received: true })
}
