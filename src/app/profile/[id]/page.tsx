'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function MemberProfilePage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params?.id as string

  const [profile, setProfile] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadProfile() }, [memberId])

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setCurrentUser(session.user)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', memberId).single()
    if (!profileData) { router.push('/directory'); return }
    setProfile(profileData)

    const { data: activitiesData } = await supabase.from('activities').select('*').eq('user_id', memberId).eq('valid', true).order('recorded_at', { ascending: false }).limit(10)
    setActivities(activitiesData || [])
    setLoading(false)
  }

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const levelEmoji: Record<string, string> = { bronce: '🥉', plata: '🥈', oro: '🥇' }
  const isOwnProfile = currentUser?.id === memberId

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando perfil...
    </div>
  )

  if (!profile) return null

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
    nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 0.5px solid rgba(255,255,255,0.07); position: sticky; top: 0; background: rgba(10,10,10,0.92); backdrop-filter: blur(12px); z-index: 100; }
    .logo { text-decoration: none; font-size: 14px; font-weight: 600; color: #fff; }
    .logo em { font-style: italic; font-weight: 400; }
    .nav-back { font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; display: flex; align-items: center; gap: 6px; }
    .nav-back:hover { color: #fff; }
    .nav-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #0a0a0a; text-decoration: none; }
    .cover { height: 140px; background: linear-gradient(135deg, #0f3460, #1a1a2e, #0d1b2a); }
    .profile-info { padding: 0 32px 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
    .avatar-wrap { margin-top: -40px; }
    .avatar { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: #0a0a0a; border: 3px solid #0a0a0a; }
    .profile-name { font-size: 22px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; }
    .badge-plan { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
    .badge-elite { background: rgba(34,211,238,0.1); color: #22d3ee; }
    .badge-level { background: rgba(255,215,0,0.1); color: #ffd700; }
    .badge-strava { background: rgba(252,76,2,0.1); color: #fc4c02; }
    .body { display: grid; grid-template-columns: 280px 1fr; gap: 24px; padding: 28px 32px 60px; max-width: 1000px; }
    .card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
    .card-title { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 14px; }
    .info-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 11px; color: rgba(255,255,255,0.25); margin-bottom: 1px; }
    .info-value { font-size: 13px; color: rgba(255,255,255,0.7); }
    .bio { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.65; }
    .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 14px; }
    .stat { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; text-align: center; }
    .stat-val { font-size: 22px; font-weight: 600; margin-bottom: 3px; }
    .stat-lbl { font-size: 11px; color: rgba(255,255,255,0.3); }
    .run-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
    .run-item:last-child { border-bottom: none; }
    .run-date-day { font-size: 18px; font-weight: 600; line-height: 1; }
    .run-date-month { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; }
    .run-name { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
    .run-meta { display: flex; gap: 10px; flex-wrap: wrap; }
    .run-stat { font-size: 12px; color: rgba(255,255,255,0.35); }
    .run-km { font-size: 16px; font-weight: 600; color: #4ade80; min-width: 50px; text-align: right; }
    .empty { text-align: center; padding: 32px; color: rgba(255,255,255,0.25); font-size: 13px; }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav>
        <a className="logo" href="/dashboard">Santiago<em>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup></a>
        <a className="nav-back" href="/directory">← Volver al directorio</a>
        <a href="/profile" className="nav-avatar">{initials(currentUser?.email || '')}</a>
      </nav>

      <div className="cover" />

      <div className="profile-info">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div className="avatar-wrap">
            <div className="avatar">{initials(profile.full_name)}</div>
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div className="profile-name">{profile.full_name}</div>
            <div className="badges">
              {profile.level && <span className="badge badge-level">{levelEmoji[profile.level]} {profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}</span>}
              <span className={`badge ${profile.plan === 'elite' ? 'badge-elite' : 'badge-plan'}`}>
                {profile.plan === 'elite' ? '⚡ Elite' : '🏃 Pace'}
              </span>
              {profile.strava_connected && <span className="badge badge-strava">🟠 Strava</span>}
              {profile.sector && <span className="badge badge-plan">📍 {profile.sector}</span>}
            </div>
          </div>
        </div>
        {isOwnProfile && (
          <a href="/profile" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', paddingBottom: 4 }}>
            ✏️ Editar mi perfil
          </a>
        )}
      </div>

      <div className="body">
        {/* LEFT */}
        <div>
          {profile.bio && (
            <div className="card">
              <div className="card-title">Sobre mí</div>
              <p className="bio">{profile.bio}</p>
            </div>
          )}
          <div className="card">
            <div className="card-title">Información</div>
            {profile.distance_preference && <div className="info-row"><span>🏃</span><div><div className="info-label">Distancia favorita</div><div className="info-value">{profile.distance_preference}</div></div></div>}
            {profile.runner_level && <div className="info-row"><span>⚡</span><div><div className="info-label">Nivel</div><div className="info-value">{profile.runner_level.charAt(0).toUpperCase() + profile.runner_level.slice(1)}</div></div></div>}
            {profile.pace_avg && <div className="info-row"><span>⏱️</span><div><div className="info-label">Pace promedio</div><div className="info-value">{profile.pace_avg} /km</div></div></div>}
            {profile.instagram && <div className="info-row"><span>📸</span><div><div className="info-label">Instagram</div><div className="info-value">{profile.instagram}</div></div></div>}
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="stats-grid">
            <div className="stat"><div className="stat-val" style={{ color: '#4ade80' }}>{profile.weekly_km || 0}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>km</span></div><div className="stat-lbl">Esta semana</div></div>
            <div className="stat"><div className="stat-val">{profile.total_km || 0}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>km</span></div><div className="stat-lbl">Total acumulado</div></div>
            <div className="stat"><div className="stat-val">{profile.pace_avg || '—'}</div><div className="stat-lbl">Pace promedio</div></div>
          </div>

          <div className="card">
            <div className="card-title">Actividades recientes</div>
            {activities.length === 0 ? (
              <div className="empty">Sin actividades registradas aún.</div>
            ) : (
              activities.map(act => {
                const date = new Date(act.recorded_at)
                return (
                  <div key={act.id} className="run-item">
                    <div style={{ textAlign: 'center', minWidth: 40 }}>
                      <div className="run-date-day">{date.getDate()}</div>
                      <div className="run-date-month">{date.toLocaleDateString('es-DO', { month: 'short' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="run-name">{act.type === 'race' ? '🏆 Carrera' : '🏃 Running'}</div>
                      <div className="run-meta">
                        {act.duration_minutes && <span className="run-stat">⏱ {Math.floor(act.duration_minutes/60)}h {act.duration_minutes%60}m</span>}
                        {act.pace_avg && <span className="run-stat">⚡ {act.pace_avg}/km</span>}
                        {act.avg_heartrate && <span className="run-stat">❤️ {Math.round(act.avg_heartrate)} bpm</span>}
                        {act.elevation_gain && <span className="run-stat">⛰️ {Math.round(act.elevation_gain)}m</span>}
                      </div>
                    </div>
                    <div className="run-km">{act.distance_km}km</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}
