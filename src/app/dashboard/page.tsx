'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Profile, Activity, Challenge } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [ranking, setRanking] = useState({ position: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single()

    if (!profileData || profileData.plan_status !== 'active') {
      router.push('/admin')
    }
    setProfile(profileData)

    const { data: activitiesData } = await supabase
      .from('activities').select('*').eq('user_id', session.user.id)
      .eq('valid', true).order('recorded_at', { ascending: false }).limit(10)
    setActivities(activitiesData || [])

    const now = new Date()
    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*, progress:challenge_progress(*)')
      .eq('active', true)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
    setChallenges(challengesData || [])

    const { data: rankingData } = await supabase
      .from('profiles').select('id, total_km')
      .eq('plan_status', 'active').order('total_km', { ascending: false })

    if (rankingData) {
      const pos = rankingData.findIndex(r => r.id === session.user.id) + 1
      setRanking({ position: pos, total: rankingData.length })
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando dashboard...
    </div>
  )

  if (!profile) return null

  const now = new Date()
  const monthKm = activities
    .filter(a => {
      const d = new Date(a.recorded_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, a) => sum + a.distance_km, 0)

  const levelColors: Record<string, string> = {
    bronce: '#cd7f32', plata: '#c0c0c0', oro: '#ffd700', elite: '#22d3ee'
  }
  const levelColor = levelColors[profile.level] || '#fff'
  const levelEmoji: Record<string, string> = {
    bronce: '🥉', plata: '🥈', oro: '🥇', elite: '⚡'
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,10,0.95)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '15px', fontWeight: 600 }}>
          Santiago<em style={{ fontStyle: 'italic', fontWeight: 400 }}>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {[['Eventos','/events'],['Directorio','/directory'],['Chat','/chat'],['Galería','/gallery'],['Patrocinadores','/sponsors']].map(([label, href]) => (
            <a key={href} href={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{label}</a>
          ))}
          <a href="/profile" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ade80,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0a0a0a', textDecoration: 'none' }}>
            {profile.full_name?.charAt(0).toUpperCase()}
          </a>
        </div>
      </nav>

      <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* BIENVENIDA */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px 32px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#4ade80,#22d3ee,#818cf8)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ade80,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#0a0a0a', flexShrink: 0 }}>
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>¡Bienvenido de vuelta!</div>
              <div style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>{profile.full_name}</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', background: `${levelColor}22`, color: levelColor, border: `0.5px solid ${levelColor}44` }}>
                  {levelEmoji[profile.level]} Nivel {profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
                </span>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                  Plan {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>Puntos</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#ffd700', lineHeight: 1 }}>
                {profile.points.toLocaleString('es-DO')}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '16px' }}>Resumen del mes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Km este mes', value: `${monthKm.toFixed(1)}`, unit: 'km', color: '#4ade80' },
            { label: 'Pace promedio', value: profile.pace_avg || '—', unit: '/km', color: '#818cf8' },
            { label: 'Ranking general', value: `#${ranking.position}`, unit: `/ ${ranking.total}`, color: '#fbbf24' },
            { label: 'Actividades', value: String(activities.length), unit: 'registradas', color: '#22d3ee' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px 16px' }}>
              <div style={{ fontSize: '26px', fontWeight: 600, color: stat.color, marginBottom: '4px' }}>
                {stat.value}<span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}> {stat.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* RETOS */}
        {challenges.length > 0 && (
          <>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '16px' }}>Retos del mes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '28px' }}>
              {challenges.map(challenge => {
                const progress = Array.isArray(challenge.progress) ? challenge.progress[0] : challenge.progress
                const pct = progress ? Math.min(100, (progress.current_value / challenge.goal_value) * 100) : 0
                const completed = progress?.completed
                return (
                  <div key={challenge.id} style={{ background: completed ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${completed ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.09)'}`, borderRadius: '14px', padding: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: completed ? '#4ade80' : '#fbbf24', marginBottom: '8px' }}>{completed ? '✓ Completado' : '⚡ En progreso'}</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>{challenge.title}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>+{challenge.reward_points} pts al completar</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                      <span>{progress?.current_value || 0} / {challenge.goal_value} {challenge.goal_unit}</span>
                      <span style={{ fontWeight: 600, color: completed ? '#4ade80' : '#fbbf24' }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px' }}>
                      <div style={{ height: '6px', borderRadius: '999px', width: `${pct}%`, background: completed ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : 'linear-gradient(90deg,#fbbf24,#f59e0b)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ACTIVIDADES */}
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '16px' }}>Actividades recientes</div>
        {activities.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '32px', textAlign: 'center' as const, fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
            Aún no tienes actividades. Conecta Strava o Garmin en tu perfil.
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
            {activities.slice(0, 5).map((activity, i) => (
              <div key={activity.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: i < 4 ? '0.5px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ textAlign: 'center' as const, minWidth: '40px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{new Date(activity.recorded_at).getDate()}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const }}>{new Date(activity.recorded_at).toLocaleDateString('es-DO', { month: 'short' })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '3px' }}>{activity.type} · {activity.source}</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                    {activity.duration_minutes && <span>⏱ {Math.floor(activity.duration_minutes)}min</span>}
                    {activity.pace_avg && <span>⚡ {activity.pace_avg}/km</span>}
                    {activity.heart_rate_avg && <span>❤️ {activity.heart_rate_avg}bpm</span>}
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4ade80' }}>{activity.distance_km.toFixed(1)}km</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center' as const }}>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: 'none', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}