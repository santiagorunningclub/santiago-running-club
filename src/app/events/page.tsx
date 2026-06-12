'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [userPlan, setUserPlan] = useState('pace')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single()
    if (profile) setUserPlan(profile.plan)
    const { data } = await supabase.from('events').select('*').eq('status', 'active').order('date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  const typeColors: Record<string, string> = { corrida: '#4ade80', carrera: '#fbbf24', track: '#22d3ee', social: '#818cf8' }
  const typePillClass: Record<string, string> = { corrida: 'pill-run', carrera: 'pill-race', track: 'pill-track', social: 'pill-social' }
  const typeLabels: Record<string, string> = { corrida: 'Corrida grupal', carrera: 'Carrera oficial', track: 'Track day · Elite', social: 'Actividad social' }
  const typeEmoji: Record<string, string> = { corrida: '🏃', carrera: '🏅', track: '🏟️', social: '🎉' }

  const filtered = events.filter(e => {
    if (filter !== 'todos' && e.type !== filter) return false
    return true
  })

  const featured = events[0]

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
    nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; border-bottom: 0.5px solid rgba(255,255,255,0.07); position: sticky; top: 0; background: rgba(10,10,10,0.92); backdrop-filter: blur(12px); z-index: 100; }
    .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .logo-text { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: 0.02em; font-family: Inter, sans-serif; }
    .logo-text em { font-style: italic; font-weight: 400; }
    .nav-links { display: flex; align-items: center; gap: 28px; }
    .nav-links a { font-size: 14px; color: rgba(255,255,255,0.42); text-decoration: none; }
    .nav-links a:hover { color: rgba(255,255,255,0.8); }
    .nav-active { color: rgba(255,255,255,0.85) !important; }
    .nav-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #0a0a0a; text-decoration: none; }
    .hero { padding: 64px 48px 48px; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
    .hero-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 40px; }
    .hero h1 { font-size: 42px; font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; }
    .hero h1 em { color: rgba(255,255,255,0.22); font-style: normal; }
    .hero-sub { font-size: 15px; color: rgba(255,255,255,0.36); line-height: 1.65; max-width: 420px; margin-top: 12px; }
    .month-nav { display: flex; align-items: center; gap: 8px; }
    .month-btn { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 9px; color: rgba(255,255,255,0.5); font-size: 13px; font-family: inherit; padding: 8px 14px; cursor: pointer; }
    .month-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .month-current { font-size: 15px; font-weight: 500; color: #fff; min-width: 140px; text-align: center; }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 999px; color: rgba(255,255,255,0.45); font-size: 13px; font-family: inherit; padding: 7px 16px; cursor: pointer; white-space: nowrap; }
    .filter-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
    .filter-btn.on { background: #fff; color: #0a0a0a; border-color: #fff; font-weight: 500; }
    .featured-wrap { padding: 48px 48px 0; }
    .featured-label { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 16px; }
    .featured-card { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 32px; display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; position: relative; overflow: hidden; cursor: pointer; }
    .featured-card:hover { border-color: rgba(255,255,255,0.22); }
    .featured-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #4ade80, #22d3ee, #818cf8); }
    .featured-type { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; background: rgba(74,222,128,0.1); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.2); border-radius: 999px; padding: 4px 12px; margin-bottom: 14px; }
    .featured-title { font-size: 26px; font-weight: 600; margin-bottom: 10px; letter-spacing: -.01em; }
    .featured-meta { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 16px; }
    .meta-item { display: flex; align-items: center; gap: 7px; font-size: 14px; color: rgba(255,255,255,0.5); }
    .featured-desc { font-size: 14px; color: rgba(255,255,255,0.38); line-height: 1.65; max-width: 560px; }
    .featured-right { text-align: center; min-width: 140px; }
    .featured-date-num { font-size: 56px; font-weight: 600; line-height: 1; color: #fff; letter-spacing: -.03em; }
    .featured-date-month { font-size: 16px; color: rgba(255,255,255,0.35); margin-top: 4px; letter-spacing: .05em; text-transform: uppercase; }
    .featured-spots { font-size: 12px; color: #4ade80; margin-top: 12px; }
    .events-section { padding: 48px 48px 80px; }
    .section-label { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 20px; }
    .events-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 48px; }
    .event-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 22px; cursor: pointer; position: relative; overflow: hidden; }
    .event-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); }
    .event-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
    .event-date-badge { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 8px 12px; text-align: center; min-width: 52px; }
    .event-date-day { font-size: 22px; font-weight: 600; line-height: 1; }
    .event-date-month { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }
    .event-type-pill { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
    .pill-run { background: rgba(74,222,128,0.1); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.2); }
    .pill-race { background: rgba(251,191,36,0.1); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.2); }
    .pill-social { background: rgba(129,140,248,0.1); color: #818cf8; border: 0.5px solid rgba(129,140,248,0.2); }
    .pill-track { background: rgba(34,211,238,0.1); color: #22d3ee; border: 0.5px solid rgba(34,211,238,0.2); }
    .event-title { font-size: 15px; font-weight: 500; margin-bottom: 8px; line-height: 1.35; }
    .event-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .event-meta-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.38); }
    .event-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 0.5px solid rgba(255,255,255,0.06); }
    .event-spots { font-size: 12px; color: rgba(255,255,255,0.3); }
    .event-spots strong { color: rgba(255,255,255,0.6); }
    .event-arrow { width: 28px; height: 28px; background: rgba(255,255,255,0.06); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .event-card:hover .event-arrow { background: rgba(255,255,255,0.12); }
    .weekly-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
    .day-col { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px 10px; min-height: 100px; }
    .day-col.has-event { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
    .day-name { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 10px; }
    .day-event { background: rgba(74,222,128,0.08); border: 0.5px solid rgba(74,222,128,0.15); border-radius: 7px; padding: 7px 8px; margin-bottom: 6px; }
    .day-event.track { background: rgba(34,211,238,0.07); border-color: rgba(34,211,238,0.15); }
    .day-event.social { background: rgba(129,140,248,0.07); border-color: rgba(129,140,248,0.15); }
    .day-event-name { font-size: 11px; color: rgba(255,255,255,0.6); line-height: 1.35; font-weight: 500; }
    .day-event-time { font-size: 10px; color: rgba(255,255,255,0.25); margin-top: 3px; }
    .drawer-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; }
    .drawer-overlay.open { display: block; }
    .drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 420px; background: #141414; border-left: 0.5px solid rgba(255,255,255,0.1); z-index: 201; overflow-y: auto; transform: translateX(100%); transition: transform .3s ease; padding: 32px; }
    .drawer.open { transform: translateX(0); }
    .drawer-close-btn { background: rgba(255,255,255,0.06); border: none; border-radius: 8px; padding: 8px 12px; color: rgba(255,255,255,0.4); font-size: 13px; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: 24px; }
    .drawer-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .drawer-title { font-size: 24px; font-weight: 600; line-height: 1.2; margin-bottom: 20px; }
    .drawer-meta-block { display: flex; flex-direction: column; gap: 12px; padding: 20px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; margin-bottom: 24px; }
    .drawer-meta-row { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.55); }
    .drawer-meta-row strong { color: #fff; font-weight: 500; }
    .drawer-section { margin-bottom: 24px; }
    .drawer-section h3 { font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 12px; }
    .drawer-section p { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; }
    .drawer-cats { display: flex; flex-wrap: wrap; gap: 8px; }
    .drawer-cat { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 14px; font-size: 13px; color: rgba(255,255,255,0.55); }
    .drawer-divider { border: none; border-top: 0.5px solid rgba(255,255,255,0.07); margin: 20px 0; }
    .drawer-note { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.6; margin-bottom: 20px; }
    .drawer-cta-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 48px; background: #fff; color: #0a0a0a; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer; text-decoration: none; }
    .drawer-cta-btn:hover { opacity: .88; }
    .drawer-cta-btn.internal { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); border: 0.5px solid rgba(255,255,255,0.14); }
    .drawer-cta-btn.elite-lock { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.35); border: 0.5px solid rgba(255,255,255,0.1); cursor: not-allowed; }
    .elite-badge { display: flex; align-items: flex-start; gap: 10px; background: rgba(34,211,238,0.08); border: 0.5px solid rgba(34,211,238,0.2); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: rgba(34,211,238,0.8); margin-top: 12px; }
    .no-events { text-align: center; padding: 48px; color: rgba(255,255,255,0.25); font-size: 14px; }
    footer { border-top: 0.5px solid rgba(255,255,255,0.06); padding: 28px 48px; display: flex; align-items: center; justify-content: space-between; }
    .footer-logo { font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 500; }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a { font-size: 12px; color: rgba(255,255,255,0.22); text-decoration: none; }
  `

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando eventos...
    </div>
  )

  const weeklySchedule = [
    { day: 'Lun', events: [] },
    { day: 'Mar', events: [] },
    { day: 'Mié', events: [] },
    { day: 'Jue', events: events.filter(e => e.type === 'track').slice(0, 1) },
    { day: 'Vie', events: [] },
    { day: 'Sáb', events: events.filter(e => e.type === 'corrida').slice(0, 1) },
    { day: 'Dom', events: events.filter(e => e.type === 'carrera').slice(0, 1) },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav>
        <a className="logo" href="/dashboard">
          <span className="logo-text">Santiago<em>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup></span>
        </a>
        <div className="nav-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/directory">Directorio</a>
          <a href="/gallery">Galería</a>
          <a href="/chat">Chat</a>
          <a href="/sponsors">Patrocinadores</a>
        </div>
        <a href="/profile" className="nav-avatar">JR</a>
      </nav>

      <div className="hero">
        <div className="hero-top">
          <div>
            <h1>Eventos y<br/><em>carreras</em></h1>
            <p className="hero-sub">Corridas grupales, competencias oficiales, track days y actividades sociales. Todo en un solo lugar.</p>
          </div>
          <div className="month-nav">
            <button className="month-btn" onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)}>←</button>
            <span className="month-current">{months[currentMonth]} {currentYear}</span>
            <button className="month-btn" onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)}>→</button>
          </div>
        </div>
        <div className="filters">
          {['todos','corrida','carrera','track','social'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
              {f === 'todos' ? 'Todos' : f === 'corrida' ? 'Corridas grupales' : f === 'carrera' ? 'Carreras oficiales' : f === 'track' ? 'Track day' : 'Actividades sociales'}
            </button>
          ))}
        </div>
      </div>

      {/* EVENTO DESTACADO */}
      {featured && (
        <div className="featured-wrap">
          <div className="featured-label">Próximo evento destacado</div>
          <div className="featured-card" onClick={() => { setSelectedEvent(featured); setDrawerOpen(true) }}>
            <div>
              <div className="featured-type"><span style={{ width: 5, height: 5, background: typeColors[featured.type], borderRadius: '50%', display: 'inline-block' }}></span> {typeLabels[featured.type]}</div>
              <div className="featured-title">{featured.title}</div>
              <div className="featured-meta">
                {featured.date && <div className="meta-item">📅 {new Date(featured.date).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                {featured.location && <div className="meta-item">📍 {featured.location}</div>}
                {featured.distance && <div className="meta-item">🏃 {featured.distance}</div>}
                {featured.max_capacity && <div className="meta-item">👥 {featured.max_capacity} cupos</div>}
              </div>
              {featured.description && <div className="featured-desc">{featured.description}</div>}
            </div>
            <div className="featured-right">
              <div className="featured-date-num">{featured.date ? new Date(featured.date).getDate() : '—'}</div>
              <div className="featured-date-month">{featured.date ? new Date(featured.date).toLocaleDateString('es-DO', { month: 'long' }) : ''}</div>
              <div className="featured-spots">⬤ Cupos disponibles</div>
            </div>
          </div>
        </div>
      )}

      <div className="events-section">
        <div className="section-label">Todos los eventos · {months[currentMonth]} {currentYear}</div>

        {filtered.length === 0 ? (
          <div className="no-events">No hay eventos en esta categoría por ahora.</div>
        ) : (
          <div className="events-grid">
            {filtered.map(event => {
              const eventDate = event.date ? new Date(event.date) : null
              const isEliteOnly = event.elite_only
              const canAccess = !isEliteOnly || userPlan === 'elite'

              return (
                <div key={event.id} className={`event-card ${isEliteOnly ? 'elite-only' : ''}`} onClick={() => { setSelectedEvent(event); setDrawerOpen(true) }}
                  style={!canAccess ? { opacity: 0.7 } : {}}>
                  {event.image_url && (
                    <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                      <img src={event.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="event-card-header">
                    <div className="event-date-badge">
                      <div className="event-date-day">{eventDate ? eventDate.getDate() : '—'}</div>
                      <div className="event-date-month">{eventDate ? eventDate.toLocaleDateString('es-DO', { month: 'short' }) : ''}</div>
                    </div>
                    <span className={`event-type-pill ${typePillClass[event.type] || 'pill-run'}`}>
                      {isEliteOnly ? 'Track day · Elite' : typeLabels[event.type]}
                    </span>
                  </div>
                  <div className="event-title">{event.title}</div>
                  <div className="event-meta">
                    {eventDate && <div className="event-meta-row">⏰ {eventDate.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</div>}
                    {event.location && <div className="event-meta-row">📍 {event.location}</div>}
                    {event.distance && <div className="event-meta-row">🏃 {event.distance}</div>}
                  </div>
                  <div className="event-footer">
                    <span className="event-spots">
                      {event.max_capacity ? <><strong>{event.max_capacity}</strong> cupos</> : 'Entrada libre'}
                    </span>
                    <div className="event-arrow">→</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* RUTINA SEMANAL */}
        <div>
          <div className="section-label">Rutina semanal del club</div>
          <div className="weekly-grid">
            {weeklySchedule.map((day, i) => (
              <div key={i} className={`day-col ${day.events.length > 0 ? 'has-event' : ''}`}>
                <div className="day-name">{day.day}</div>
                {day.events.map((ev: any) => (
                  <div key={ev.id} className={`day-event ${ev.type}`}>
                    <div className="day-event-name">{ev.title}</div>
                    <div className="day-event-time">{ev.type === 'track' ? '6:30 AM · Elite' : '6:00 AM · Todos'}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer>
        <span className="footer-logo">Santiago<em style={{ fontStyle: 'italic' }}>Running</em>Club® · Santiago, RD</span>
        <div className="footer-links">
          <a href="#">Términos</a><a href="#">Privacidad</a><a href="#">Contacto</a><a href="#">Instagram</a>
        </div>
      </footer>

      {/* DRAWER */}
      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        {selectedEvent && (
          <>
            <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)}>✕ Cerrar</button>
            <span className={`event-type-pill ${typePillClass[selectedEvent.type] || 'pill-run'}`} style={{ display: 'inline-flex', marginBottom: 16 }}>
              {typeLabels[selectedEvent.type]}
            </span>
            <div className="drawer-title">{selectedEvent.title}</div>
            <div className="drawer-meta-block">
              {selectedEvent.date && <div className="drawer-meta-row">📅 <strong>{new Date(selectedEvent.date).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>}
              {selectedEvent.location && <div className="drawer-meta-row">📍 {selectedEvent.location}</div>}
              {selectedEvent.distance && <div className="drawer-meta-row">🏃 {selectedEvent.distance}</div>}
              {selectedEvent.max_capacity && <div className="drawer-meta-row">👥 {selectedEvent.max_capacity} cupos máximos</div>}
            </div>
            {selectedEvent.description && (
              <div className="drawer-section">
                <h3>Descripción</h3>
                <p>{selectedEvent.description}</p>
              </div>
            )}
            <div className="drawer-section">
              <h3>Participantes</h3>
              <div className="drawer-cats">
                <span className="drawer-cat">{selectedEvent.elite_only ? 'Solo miembros Elite' : 'Todos los miembros'}</span>
                {selectedEvent.distance && <span className="drawer-cat">{selectedEvent.distance}</span>}
              </div>
            </div>
            <hr className="drawer-divider" />
            <div className="drawer-note">
              💡 Confirma tu asistencia por el chat del club para asegurar tu lugar.
            </div>
            {selectedEvent.elite_only && userPlan !== 'elite' ? (
              <>
                <button className="drawer-cta-btn elite-lock" disabled>🔒 Solo disponible para miembros Elite</button>
                <div className="elite-badge">
                  ⚡ Este evento es exclusivo para miembros <strong style={{ color: '#22d3ee', margin: '0 4px' }}>Elite</strong>.
                  <a href="/membresia" style={{ color: '#22d3ee' }}>Actualiza tu plan</a>
                </div>
              </>
            ) : (
              <a href="/chat" className="drawer-cta-btn internal">Confirmar asistencia en el chat →</a>
            )}
          </>
        )}
      </div>
    </>
  )
}
