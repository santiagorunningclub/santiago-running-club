'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('resumen')
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saveMsg, setSaveMsg] = useState('')
  const [ranking, setRanking] = useState(0)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (!profileData) { router.push('/login'); return }
    setProfile(profileData)
    setEditForm({
      full_name: profileData.full_name || '',
      bio: profileData.bio || '',
      sector: profileData.sector || '',
      instagram: profileData.instagram || '',
      distance_preference: profileData.distance_preference || '10K',
      pace_target: profileData.pace_target || '',
      runner_level: profileData.runner_level || '',
      shirt_size: profileData.shirt_size || '',
      show_in_directory: profileData.show_in_directory ?? true,
    })
    const { data: activitiesData } = await supabase.from('activities').select('*').eq('user_id', session.user.id).order('recorded_at', { ascending: false }).limit(10)
    setActivities(activitiesData || [])
    const { data: rankData } = await supabase.from('profiles').select('id').eq('plan_status', 'active').order('total_km', { ascending: false })
    if (rankData) setRanking(rankData.findIndex(r => r.id === session.user.id) + 1)
    setLoading(false)
  }

  async function saveProfile() {
    if (!profile) return
    const { error } = await supabase.from('profiles').update(editForm).eq('id', profile.id)
    if (!error) {
      setSaveMsg('✓ Perfil actualizado')
      setProfile({ ...profile, ...editForm })
      setTimeout(() => { setShowEdit(false); setSaveMsg('') }, 1500)
    }
  }

  async function toggleSetting(key: string) {
    const newVal = !profile[key]
    await supabase.from('profiles').update({ [key]: newVal }).eq('id', profile.id)
    setProfile((p: any) => ({ ...p, [key]: newVal }))
  }

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SRC'
  const levelClass: Record<string, string> = { bronce: 'level-bronce', plata: 'level-plata', oro: 'level-oro' }
  const levelEmoji: Record<string, string> = { bronce: '🥉', plata: '🥈', oro: '🥇' }

  const pointsProgress = profile ? Math.min(100, ((profile.points || 0) % 1000) / 10) : 0

  const achievements = [
    { icon: '🏃', name: 'Primera corrida', desc: 'Completaste tu primer km con el SRC', date: 'Ene 2025', locked: false },
    { icon: '🌅', name: 'Madrugador', desc: '5 corridas antes de las 6 AM', date: 'Jun 2025', locked: false },
    { icon: '🔥', name: 'Racha de fuego', desc: '10 días seguidos corriendo', date: 'Jun 2025', locked: false },
    { icon: '🏅', name: 'Medio maratón', desc: 'Completaste tu primer 21K', date: 'Jun 2025', locked: false },
    { icon: '💯', name: '100km en un mes', desc: 'Reto mensual completado', date: 'May 2025', locked: false },
    { icon: '👥', name: 'Corredor social', desc: 'Asististe a 10 corridas grupales', date: 'Abr 2025', locked: false },
    { icon: '🏆', name: 'Podio', desc: 'Top 3 en el ranking del club', date: '', locked: true },
    { icon: '⚡', name: 'Sub 5:00', desc: 'Pace promedio bajo 5:00/km', date: '', locked: true },
  ]

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
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-text { font-size: 14px; font-weight: 600; color: #fff; letter-spacing: 0.02em; font-family: Inter, sans-serif; }
    .logo-text em { font-style: italic; font-weight: 400; }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a { font-size: 13px; color: rgba(255,255,255,0.42); text-decoration: none; }
    .nav-links a:hover { color: rgba(255,255,255,0.8); }
    .nav-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #0a0a0a; text-decoration: none; flex-shrink: 0; }
    .profile-cover { height: 160px; background: linear-gradient(135deg, #0f3460, #1a1a2e, #0d1b2a); position: relative; overflow: hidden; }
    .profile-info { padding: 0 32px 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
    .profile-left { display: flex; align-items: flex-end; gap: 20px; }
    .avatar-wrap { position: relative; margin-top: -40px; }
    .profile-avatar { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: #0a0a0a; border: 3px solid #0a0a0a; flex-shrink: 0; }
    .profile-name-wrap { padding-bottom: 4px; }
    .profile-name { font-size: 22px; font-weight: 600; letter-spacing: -.01em; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; }
    .profile-badges { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .level-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; }
    .level-bronce { background: rgba(205,127,50,0.15); color: #cd7f32; border: 0.5px solid rgba(205,127,50,0.3); }
    .level-plata { background: rgba(192,192,192,0.12); color: #c0c0c0; border: 0.5px solid rgba(192,192,192,0.25); }
    .level-oro { background: rgba(255,215,0,0.12); color: #ffd700; border: 0.5px solid rgba(255,215,0,0.25); }
    .plan-tag { font-size: 11px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 4px 10px; }
    .member-since { font-size: 12px; color: rgba(255,255,255,0.25); }
    .profile-actions { display: flex; gap: 8px; padding-bottom: 4px; }
    .btn-edit { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.07); border: 0.5px solid rgba(255,255,255,0.14); border-radius: 10px; padding: 0 16px; height: 38px; font-size: 13px; color: rgba(255,255,255,0.65); cursor: pointer; font-family: inherit; }
    .btn-edit:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .profile-tabs { padding: 0 32px; display: flex; gap: 4px; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
    .ptab { padding: 12px 18px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.38); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -0.5px; }
    .ptab:hover { color: rgba(255,255,255,0.7); }
    .ptab.active { color: #fff; border-bottom-color: #fff; }
    .profile-body { display: grid; grid-template-columns: 300px 1fr; gap: 24px; padding: 28px 32px 60px; max-width: 1100px; }
    .left-col { display: flex; flex-direction: column; gap: 16px; }
    .info-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; }
    .info-card-title { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 14px; }
    .info-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 11px; color: rgba(255,255,255,0.25); margin-bottom: 1px; }
    .info-value { font-size: 13px; color: rgba(255,255,255,0.7); }
    .bio-text { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.65; }
    .bio-empty { font-size: 13px; color: rgba(255,255,255,0.2); font-style: italic; }
    .social-link { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.45); text-decoration: none; margin-bottom: 8px; }
    .social-link:hover { color: #fff; }
    .points-card { background: rgba(255,215,0,0.04); border: 0.5px solid rgba(255,215,0,0.15); border-radius: 14px; padding: 18px; }
    .points-title { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,215,0,0.5); margin-bottom: 10px; }
    .points-value { font-size: 32px; font-weight: 700; color: #ffd700; letter-spacing: -.02em; margin-bottom: 2px; line-height: 1; }
    .points-sub { font-size: 12px; color: rgba(255,255,255,0.25); margin-bottom: 14px; }
    .points-bar-track { height: 6px; background: rgba(255,255,255,0.07); border-radius: 999px; margin-bottom: 6px; }
    .points-bar-fill { height: 6px; background: linear-gradient(90deg, #ffd700, #fbbf24); border-radius: 999px; }
    .points-levels { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.2); }
    .right-col { display: flex; flex-direction: column; gap: 16px; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat-box { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 16px; text-align: center; }
    .stat-box-val { font-size: 24px; font-weight: 600; letter-spacing: -.02em; margin-bottom: 3px; }
    .stat-box-lbl { font-size: 11px; color: rgba(255,255,255,0.3); }
    .activity-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
    .activity-header { padding: 16px 18px; border-bottom: 0.5px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
    .activity-title { font-size: 13px; font-weight: 500; }
    .run-list { display: flex; flex-direction: column; }
    .run-item { display: flex; align-items: center; gap: 14px; padding: 12px 18px; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
    .run-item:last-child { border-bottom: none; }
    .run-item:hover { background: rgba(255,255,255,0.02); }
    .run-date { text-align: center; min-width: 40px; }
    .run-date-day { font-size: 18px; font-weight: 600; line-height: 1; }
    .run-date-month { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: .04em; }
    .run-info { flex: 1; }
    .run-name { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
    .run-meta { display: flex; gap: 12px; }
    .run-stat { font-size: 12px; color: rgba(255,255,255,0.35); }
    .run-type { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
    .rt-run { background: rgba(74,222,128,0.1); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.2); }
    .rt-race { background: rgba(251,191,36,0.1); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.2); }
    .run-km { font-size: 16px; font-weight: 600; color: #4ade80; min-width: 50px; text-align: right; }
    .achievements-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 18px; }
    .achievement { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px 10px; text-align: center; }
    .achievement:hover { border-color: rgba(255,255,255,0.14); }
    .achievement.locked { opacity: .35; }
    .ach-icon { font-size: 28px; margin-bottom: 8px; }
    .ach-name { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.65); margin-bottom: 2px; line-height: 1.3; }
    .ach-desc { font-size: 10px; color: rgba(255,255,255,0.25); line-height: 1.4; }
    .ach-date { font-size: 10px; color: rgba(255,255,255,0.2); margin-top: 4px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
    .toggle-row:last-child { border-bottom: none; }
    .toggle-label { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
    .toggle-sub { font-size: 12px; color: rgba(255,255,255,0.3); }
    .toggle-sw { width: 44px; height: 24px; background: rgba(74,222,128,0.3); border-radius: 999px; position: relative; cursor: pointer; flex-shrink: 0; border: 0.5px solid rgba(74,222,128,0.4); }
    .toggle-sw::after { content: ''; width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 22px; transition: left .2s; }
    .toggle-sw.off { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
    .toggle-sw.off::after { left: 3px; }
    .empty-activity { padding: 32px; text-align: center; color: rgba(255,255,255,0.25); font-size: 13px; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; align-items: center; justify-content: center; padding: 24px; overflow-y: auto; }
    .modal-overlay.open { display: flex; }
    .modal { background: #141414; border: 0.5px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 32px; width: 100%; max-width: 500px; margin: auto; }
    .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .modal h2 { font-size: 18px; font-weight: 600; }
    .modal-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-family: inherit; font-size: 13px; }
    .modal label { display: block; font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
    .modal input, .modal select, .modal textarea { width: 100%; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 9px; padding: 0 12px; height: 42px; color: #fff; font-size: 14px; font-family: inherit; outline: none; margin-bottom: 14px; }
    .modal textarea { height: auto; padding: 10px 12px; resize: vertical; }
    .modal-submit { width: 100%; height: 44px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav>
        <a className="logo" href="/dashboard">
          <span className="logo-text">Santiago<em>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup></span>
        </a>
        <div className="nav-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/events">Eventos</a>
          <a href="/directory">Directorio</a>
          <a href="/chat">Chat</a>
          <a href="/gallery">Galería</a>
        </div>
        <a href="/profile" className="nav-avatar">{initials(profile.full_name)}</a>
      </nav>

      {/* COVER */}
      <div className="profile-cover" />

      {/* INFO */}
      <div className="profile-info">
        <div className="profile-left">
          <div className="avatar-wrap">
            <div className="profile-avatar">{initials(profile.full_name)}</div>
          </div>
          <div className="profile-name-wrap">
            <div className="profile-name">{profile.full_name} <span style={{ fontSize: 16 }}>✓</span></div>
            <div className="profile-badges">
              {profile.level && <span className={`level-badge ${levelClass[profile.level] || 'level-bronce'}`}>{levelEmoji[profile.level]} Nivel {profile.level?.charAt(0).toUpperCase() + profile.level?.slice(1)}</span>}
              <span className="plan-tag">Plan {profile.plan?.charAt(0).toUpperCase() + profile.plan?.slice(1)}</span>
              <span className="member-since">Miembro desde {new Date(profile.created_at).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn-edit" onClick={() => setShowEdit(true)}>✏️ Editar perfil</button>
        </div>
      </div>

      {/* TABS */}
      <div className="profile-tabs">
        {[['resumen','Resumen'],['actividad','Actividad'],['logros','Logros'],['configuracion','Configuración']].map(([val, label]) => (
          <div key={val} className={`ptab ${tab === val ? 'active' : ''}`} onClick={() => setTab(val)}>{label}</div>
        ))}
      </div>

      <div className="profile-body">
        {/* LEFT COL */}
        <div className="left-col">
          <div className="info-card">
            <div className="info-card-title">Sobre mí</div>
            {profile.bio ? <p className="bio-text">{profile.bio}</p> : <p className="bio-empty">Sin bio aún. Edita tu perfil para agregar una.</p>}
          </div>
          <div className="info-card">
            <div className="info-card-title">Información</div>
            {profile.sector && <div className="info-row"><span>📍</span><div><div className="info-label">Ubicación</div><div className="info-value">{profile.sector}, Santiago</div></div></div>}
            {profile.distance_preference && <div className="info-row"><span>🏃</span><div><div className="info-label">Distancia favorita</div><div className="info-value">{profile.distance_preference}</div></div></div>}
            {profile.runner_level && <div className="info-row"><span>⚡</span><div><div className="info-label">Nivel</div><div className="info-value">{profile.runner_level?.charAt(0).toUpperCase() + profile.runner_level?.slice(1)}</div></div></div>}
            {profile.pace_target && <div className="info-row"><span>⏱️</span><div><div className="info-label">Pace objetivo</div><div className="info-value">{profile.pace_target}</div></div></div>}
            {profile.shirt_size && <div className="info-row"><span>👕</span><div><div className="info-label">Talla</div><div className="info-value">{profile.shirt_size}</div></div></div>}
          </div>
          {profile.instagram && (
            <div className="info-card">
              <div className="info-card-title">Redes sociales</div>
              <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="social-link">
                📸 {profile.instagram}
              </a>
            </div>
          )}
          <div className="points-card">
            <div className="points-title">Puntos de lealtad ⭐</div>
            <div className="points-value">{(profile.points || 0).toLocaleString('es-DO')}</div>
            <div className="points-sub">{1000 - ((profile.points || 0) % 1000)} puntos para siguiente nivel</div>
            <div className="points-bar-track"><div className="points-bar-fill" style={{ width: `${pointsProgress}%` }}></div></div>
            <div className="points-levels"><span>🥉 Bronce</span><span>🥈 Plata</span><span>🥇 Oro</span></div>
          </div>
        </div>

        {/* RIGHT COL */}
        <div className="right-col">
          <div className="stats-row">
            <div className="stat-box"><div className="stat-box-val" style={{ color: '#4ade80' }}>{profile.weekly_km || 0}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>km</span></div><div className="stat-box-lbl">Esta semana</div></div>
            <div className="stat-box"><div className="stat-box-val">{profile.pace_avg || '—'}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>/km</span></div><div className="stat-box-lbl">Pace promedio</div></div>
            <div className="stat-box"><div className="stat-box-val" style={{ color: '#fbbf24' }}>{ranking > 0 ? `#${ranking}` : '—'}</div><div className="stat-box-lbl">Ranking general</div></div>
            <div className="stat-box"><div className="stat-box-val" style={{ color: '#fb7185' }}>🔥{profile.streak_days || 0}</div><div className="stat-box-lbl">Racha de días</div></div>
          </div>

          {/* RESUMEN */}
          {tab === 'resumen' && (
            <div className="activity-card">
              <div className="activity-header">
                <div className="activity-title">Actividades recientes</div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }} onClick={() => setTab('actividad')}>Ver todas →</span>
              </div>
              {activities.length === 0 ? (
                <div className="empty-activity">No hay actividades registradas aún.</div>
              ) : (
                <div className="run-list">
                  {activities.slice(0, 5).map(act => {
                    const date = new Date(act.recorded_at)
                    return (
                      <div key={act.id} className="run-item">
                        <div className="run-date">
                          <div className="run-date-day">{date.getDate()}</div>
                          <div className="run-date-month">{date.toLocaleDateString('es-DO', { month: 'short' })}</div>
                        </div>
                        <div className="run-info">
                          <div className="run-name">{act.name || 'Corrida'}</div>
                          <div className="run-meta">
                            {act.duration_minutes && <span className="run-stat">⏱ {Math.floor(act.duration_minutes / 60)}h {act.duration_minutes % 60}m</span>}
                            {act.pace_avg && <span className="run-stat">⚡ {act.pace_avg}/km</span>}
                          </div>
                        </div>
                        <span className={`run-type ${act.type === 'race' ? 'rt-race' : 'rt-run'}`}>{act.type === 'race' ? 'Carrera' : 'Running'}</span>
                        <div className="run-km">{act.distance_km}km</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ACTIVIDAD */}
          {tab === 'actividad' && (
            <div className="activity-card">
              <div className="activity-header"><div className="activity-title">Todas las actividades</div><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{activities.length} registradas</span></div>
              {activities.length === 0 ? (
                <div className="empty-activity">No hay actividades registradas aún.</div>
              ) : (
                <div className="run-list">
                  {activities.map(act => {
                    const date = new Date(act.recorded_at)
                    return (
                      <div key={act.id} className="run-item">
                        <div className="run-date">
                          <div className="run-date-day">{date.getDate()}</div>
                          <div className="run-date-month">{date.toLocaleDateString('es-DO', { month: 'short' })}</div>
                        </div>
                        <div className="run-info">
                          <div className="run-name">{act.name || 'Corrida'}</div>
                          <div className="run-meta">
                            {act.duration_minutes && <span className="run-stat">⏱ {Math.floor(act.duration_minutes / 60)}h {act.duration_minutes % 60}m</span>}
                            {act.pace_avg && <span className="run-stat">⚡ {act.pace_avg}/km</span>}
                          </div>
                        </div>
                        <span className={`run-type ${act.type === 'race' ? 'rt-race' : 'rt-run'}`}>{act.type === 'race' ? 'Carrera' : 'Running'}</span>
                        <div className="run-km">{act.distance_km}km</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* LOGROS */}
          {tab === 'logros' && (
            <div className="activity-card">
              <div className="activity-header"><div className="activity-title">Logros desbloqueados</div><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{achievements.filter(a => !a.locked).length} de {achievements.length}</span></div>
              <div className="achievements-grid">
                {achievements.map((ach, i) => (
                  <div key={i} className={`achievement ${ach.locked ? 'locked' : ''}`}>
                    <div className="ach-icon">{ach.icon}</div>
                    <div className="ach-name">{ach.name}</div>
                    <div className="ach-desc">{ach.desc}</div>
                    <div className="ach-date">{ach.locked ? '🔒 Bloqueado' : ach.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONFIGURACIÓN */}
          {tab === 'configuracion' && (
            <div className="activity-card">
              <div className="activity-header"><div className="activity-title">Configuración de privacidad</div></div>
              <div style={{ padding: '0 18px' }}>
                {[
                  { key: 'show_in_directory', label: 'Perfil visible en el directorio', sub: 'Otros miembros pueden ver tu perfil' },
                  { key: 'show_stats', label: 'Mostrar pace y estadísticas', sub: 'Visible en tu perfil público' },
                  { key: 'show_in_ranking', label: 'Aparecer en el ranking', sub: 'Tu posición visible para el club' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="toggle-row">
                    <div><div className="toggle-label">{label}</div><div className="toggle-sub">{sub}</div></div>
                    <div className={`toggle-sw ${profile[key] === false ? 'off' : ''}`} onClick={() => toggleSetting(key)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITAR */}
      <div className={`modal-overlay ${showEdit ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>Editar perfil</h2>
            <button className="modal-close" onClick={() => setShowEdit(false)}>✕ Cerrar</button>
          </div>
          <label>Nombre completo</label>
          <input value={editForm.full_name} onChange={e => setEditForm((p: any) => ({ ...p, full_name: e.target.value }))} />
          <label>Bio</label>
          <textarea rows={3} value={editForm.bio} onChange={e => setEditForm((p: any) => ({ ...p, bio: e.target.value }))} placeholder="Cuéntanos sobre ti..." />
          <div className="form-row-2">
            <div><label>Sector / Barrio</label><input value={editForm.sector} onChange={e => setEditForm((p: any) => ({ ...p, sector: e.target.value }))} placeholder="Los Jardines" /></div>
            <div><label>Pace objetivo</label><input value={editForm.pace_target} onChange={e => setEditForm((p: any) => ({ ...p, pace_target: e.target.value }))} placeholder="4:45 /km" /></div>
          </div>
          <div className="form-row-2">
            <div><label>Distancia favorita</label>
              <select value={editForm.distance_preference} onChange={e => setEditForm((p: any) => ({ ...p, distance_preference: e.target.value }))}>
                <option value="5K">5K</option>
                <option value="10K">10K</option>
                <option value="21K">21K · Media maratón</option>
                <option value="42K">42K · Maratón</option>
              </select>
            </div>
            <div><label>Talla de camiseta</label>
              <select value={editForm.shirt_size} onChange={e => setEditForm((p: any) => ({ ...p, shirt_size: e.target.value }))}>
                <option value="">—</option>
                {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label>Instagram</label>
          <input value={editForm.instagram} onChange={e => setEditForm((p: any) => ({ ...p, instagram: e.target.value }))} placeholder="@tuusuario" />
          <button className="modal-submit" onClick={saveProfile}>Guardar cambios →</button>
          {saveMsg && <div style={{ marginTop: 12, fontSize: 13, color: '#4ade80', textAlign: 'center' }}>{saveMsg}</div>}
        </div>
      </div>
    </>
  )
}
