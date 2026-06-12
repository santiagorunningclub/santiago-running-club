'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DirectoryPage() {
  const router = useRouter()
  const [members, setMembers] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')

  useEffect(() => { loadDirectory() }, [])

  async function loadDirectory() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(profileData)
    const { data } = await supabase.from('profiles').select('*').eq('plan_status', 'active').eq('show_in_directory', true).order('total_km', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const avatarColors = ['rgba(74,222,128,0.15)', 'rgba(34,211,238,0.15)', 'rgba(251,191,36,0.15)', 'rgba(129,140,248,0.15)', 'rgba(251,113,133,0.15)', 'rgba(255,215,0,0.12)']
  const avatarTextColors = ['#4ade80', '#22d3ee', '#fbbf24', '#818cf8', '#fb7185', '#ffd700']
  const colorIndex = (str: string) => str ? str.charCodeAt(0) % 6 : 0

  const top3 = members.slice(0, 3)
  const top3Colors = [{ card: 'gold', emoji: '🥇', km: '#ffd700' }, { card: 'silver', emoji: '🥈', km: '#c0c0c0' }, { card: 'bronze', emoji: '🥉', km: '#cd7f32' }]

  const filtered = members.filter(m => {
    const matchSearch = !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.sector?.toLowerCase().includes(search.toLowerCase())
    let matchFilter = true
    if (filter === 'oro') matchFilter = m.level === 'oro'
    else if (filter === 'plata') matchFilter = m.level === 'plata'
    else if (filter === 'bronce') matchFilter = m.level === 'bronce'
    else if (filter === 'elite') matchFilter = m.plan === 'elite'
    else if (filter === 'pace') matchFilter = m.plan === 'pace'
    else if (filter === '5k') matchFilter = m.distance_preference === '5K'
    else if (filter === '10k') matchFilter = m.distance_preference === '10K'
    else if (filter === '21k') matchFilter = m.distance_preference === '21K'
    else if (filter === '42k') matchFilter = m.distance_preference === '42K'
    return matchSearch && matchFilter
  })

  const levelClass: Record<string, string> = { bronce: 'rtag-level-bronce', plata: 'rtag-level-plata', oro: 'rtag-level-oro' }
  const levelEmoji: Record<string, string> = { bronce: '🥉', plata: '🥈', oro: '🥇' }

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando directorio...
    </div>
  )

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
    .nav-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#4ade80,#22d3ee); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #0a0a0a; text-decoration: none; flex-shrink: 0; }
    .hero { padding: 56px 48px 40px; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
    .hero h1 { font-size: 38px; font-weight: 600; line-height: 1.1; letter-spacing: -.02em; margin-bottom: 10px; }
    .hero h1 em { color: rgba(255,255,255,0.22); font-style: normal; }
    .hero p { font-size: 14px; color: rgba(255,255,255,0.35); line-height: 1.65; max-width: 440px; margin-bottom: 28px; }
    .search-bar { display: flex; gap: 10px; align-items: center; max-width: 560px; margin-bottom: 20px; }
    .search-input-wrap { flex: 1; position: relative; }
    .search-input { width: 100%; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 14px 0 36px; height: 42px; color: #fff; font-size: 14px; font-family: inherit; outline: none; }
    .search-input::placeholder { color: rgba(255,255,255,0.22); }
    .search-input:focus { border-color: rgba(255,255,255,0.28); }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; color: rgba(255,255,255,0.25); pointer-events: none; }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 999px; color: rgba(255,255,255,0.4); font-size: 12px; font-family: inherit; padding: 6px 14px; cursor: pointer; }
    .filter-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); }
    .filter-btn.on { background: #fff; color: #0a0a0a; border-color: #fff; font-weight: 500; }
    .content { padding: 36px 48px 80px; }
    .section-label { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 16px; }
    .top3-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 48px; }
    .top3-card { border-radius: 16px; padding: 22px; position: relative; overflow: hidden; cursor: pointer; }
    .top3-card:hover { filter: brightness(1.08); }
    .top3-card.gold { background: linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03)); border: 1px solid rgba(255,215,0,0.25); }
    .top3-card.silver { background: linear-gradient(135deg,rgba(192,192,192,0.07),rgba(192,192,192,0.02)); border: 0.5px solid rgba(192,192,192,0.2); }
    .top3-card.bronze { background: linear-gradient(135deg,rgba(205,127,50,0.07),rgba(205,127,50,0.02)); border: 0.5px solid rgba(205,127,50,0.2); }
    .top3-rank { position: absolute; top: 16px; right: 16px; font-size: 24px; }
    .top3-avatar { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; margin-bottom: 14px; border: 2px solid rgba(255,255,255,0.1); }
    .top3-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .top3-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
    .top3-km { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
    .top3-km-lbl { font-size: 11px; color: rgba(255,255,255,0.3); }
    .privacy-note { display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px 18px; margin-bottom: 28px; font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.6; }
    .runners-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
    .runner-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; cursor: pointer; position: relative; }
    .runner-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); transform: translateY(-2px); }
    .runner-card.is-me { border-color: rgba(74,222,128,0.25); background: rgba(74,222,128,0.03); }
    .runner-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
    .runner-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.08); }
    .runner-rank-badge { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); border-radius: 999px; padding: 3px 9px; }
    .runner-rank-badge.top { color: #4ade80; background: rgba(74,222,128,0.1); }
    .me-badge { position: absolute; top: 12px; left: 12px; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: rgba(74,222,128,0.15); color: #4ade80; border-radius: 999px; padding: 2px 8px; }
    .runner-name { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
    .runner-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px; }
    .rtag { font-size: 10px; font-weight: 600; padding: 2px 9px; border-radius: 999px; }
    .rtag-level-plata { background: rgba(192,192,192,0.1); color: #c0c0c0; border: 0.5px solid rgba(192,192,192,0.2); }
    .rtag-level-oro { background: rgba(255,215,0,0.1); color: #ffd700; border: 0.5px solid rgba(255,215,0,0.2); }
    .rtag-level-bronce { background: rgba(205,127,50,0.1); color: #cd7f32; border: 0.5px solid rgba(205,127,50,0.2); }
    .rtag-pace { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
    .rtag-elite { background: rgba(34,211,238,0.1); color: #22d3ee; }
    .runner-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .runner-stat { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px 10px; }
    .runner-stat-val { font-size: 14px; font-weight: 600; margin-bottom: 1px; }
    .runner-stat-lbl { font-size: 10px; color: rgba(255,255,255,0.28); }
    .runner-dist { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .dist-pill { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: rgba(129,140,248,0.1); color: #818cf8; border: 0.5px solid rgba(129,140,248,0.18); }
    .runner-btn { width: 100%; height: 36px; background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 9px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.55); cursor: pointer; font-family: inherit; }
    .runner-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .runner-card.is-me .runner-btn { background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.2); color: #4ade80; }
    .empty-state { text-align: center; padding: 48px; color: rgba(255,255,255,0.25); font-size: 14px; }
    footer { border-top: 0.5px solid rgba(255,255,255,0.06); padding: 24px 48px; display: flex; align-items: center; justify-content: space-between; }
    .footer-logo { font-size: 13px; color: rgba(255,255,255,0.28); }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a { font-size: 12px; color: rgba(255,255,255,0.22); text-decoration: none; }
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
          <a href="/gallery">Galería</a>
          <a href="/chat">Chat</a>
          <a href="/profile">Mi perfil</a>
        </div>
        <a href="/profile" className="nav-avatar">{profile ? initials(profile.full_name) : 'SRC'}</a>
      </nav>

      <div className="hero">
        <h1>Directorio de<br/><em>corredores</em></h1>
        <p>Conoce a los {members.length} miembros del Santiago Running Club. Conecta con corredores de tu nivel, sector y distancia favorita.</p>
        <div className="search-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Buscar por nombre o sector..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="filters">
          {[['todos','Todos'],['oro','🥇 Oro'],['plata','🥈 Plata'],['bronce','🥉 Bronce'],['elite','⚡ Elite'],['pace','Plan Pace'],['5k','5K'],['10k','10K'],['21k','21K'],['42k','Maratón']].map(([val, label]) => (
            <button key={val} className={`filter-btn ${filter === val ? 'on' : ''}`} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="content">
        {/* TOP 3 */}
        {top3.length > 0 && (
          <>
            <div className="section-label">🏆 Top 3 del mes · {new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</div>
            <div className="top3-row">
              {top3.map((m, i) => {
                const idx = colorIndex(m.full_name)
                const { card, emoji, km: kmColor } = top3Colors[i]
                return (
                  <div key={m.id} className={`top3-card ${card}`} onClick={() => router.push('/profile')}>
                    <div className="top3-rank">{emoji}</div>
                    <div className="top3-avatar" style={{ background: avatarColors[idx], color: avatarTextColors[idx] }}>{initials(m.full_name)}</div>
                    <div className="top3-name">{m.full_name}</div>
                    <div className="top3-badges">
                      {m.level && <span className={`rtag ${levelClass[m.level]}`}>{levelEmoji[m.level]} {m.level.charAt(0).toUpperCase() + m.level.slice(1)}</span>}
                      <span className={`rtag ${m.plan === 'elite' ? 'rtag-elite' : 'rtag-pace'}`}>{m.plan === 'elite' ? 'Elite' : 'Pace'}</span>
                      {m.distance_preference && <span className="dist-pill">{m.distance_preference}</span>}
                    </div>
                    <div className="top3-km" style={{ color: kmColor }}>{m.total_km || 0}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}> km</span></div>
                    <div className="top3-km-lbl">total acumulado</div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* PRIVACIDAD */}
        <div className="privacy-note">
          🛡️ Solo aparecen los corredores que tienen activada la opción "Visible en el directorio" en su perfil. Puedes cambiar tu visibilidad desde Configuración.
        </div>

        {/* GRID */}
        <div className="section-label">Corredores · {filtered.length} miembro{filtered.length !== 1 ? 's' : ''}</div>
        {filtered.length === 0 ? (
          <div className="empty-state">No hay corredores que coincidan con el filtro.</div>
        ) : (
          <div className="runners-grid">
            {filtered.map((m, i) => {
              const isMe = m.id === profile?.id
              const idx = colorIndex(m.full_name)
              const rank = members.findIndex(x => x.id === m.id) + 1
              return (
                <div key={m.id} className={`runner-card ${isMe ? 'is-me' : ''}`}>
                  {isMe && <span className="me-badge">Tú</span>}
                  <div className="runner-card-top">
                    <div className="runner-avatar" style={{ background: isMe ? 'rgba(74,222,128,0.15)' : avatarColors[idx], color: isMe ? '#4ade80' : avatarTextColors[idx], marginTop: isMe ? 14 : 0 }}>
                      {initials(m.full_name)}
                    </div>
                    <span className={`runner-rank-badge ${rank <= 10 ? 'top' : ''}`}>#{rank}</span>
                  </div>
                  <div className="runner-name">{m.full_name}</div>
                  <div className="runner-tags">
                    {m.level && <span className={`rtag ${levelClass[m.level]}`}>{levelEmoji[m.level]} {m.level.charAt(0).toUpperCase() + m.level.slice(1)}</span>}
                    <span className={`rtag ${m.plan === 'elite' ? 'rtag-elite' : 'rtag-pace'}`}>{m.plan === 'elite' ? 'Elite' : 'Pace'}</span>
                  </div>
                  <div className="runner-stats">
                    <div className="runner-stat">
                      <div className="runner-stat-val" style={isMe ? { color: '#4ade80' } : {}}>{m.weekly_km || 0}km</div>
                      <div className="runner-stat-lbl">esta semana</div>
                    </div>
                    <div className="runner-stat">
                      <div className="runner-stat-val">{m.pace_avg || '—'}</div>
                      <div className="runner-stat-lbl">pace avg</div>
                    </div>
                  </div>
                  {m.distance_preference && (
                    <div className="runner-dist"><span className="dist-pill">{m.distance_preference}</span></div>
                  )}
                  <button className="runner-btn" onClick={() => router.push(isMe ? '/profile' : '/directory')}>
                    {isMe ? 'Ver mi perfil →' : 'Ver perfil →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer>
        <span className="footer-logo">Santiago<em style={{ fontStyle: 'italic' }}>Running</em>Club® · {members.length} corredores activos</span>
        <div className="footer-links">
          <a href="#">Términos</a><a href="#">Privacidad</a><a href="#">Contacto</a>
        </div>
      </footer>
    </>
  )
}
