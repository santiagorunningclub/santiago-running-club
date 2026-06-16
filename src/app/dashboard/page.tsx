''use client'

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
  const [ranking, setRanking] = useState({ position: 0, total: 0, categoryPosition: 0, categoryTotal: 0, nextRunner: null as any })
  const [topRunners, setTopRunners] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (!profileData) { router.push('/login'); return }
    setProfile(profileData)

    const { data: activitiesData } = await supabase.from('activities').select('*').eq('user_id', session.user.id).eq('valid', true).order('recorded_at', { ascending: false }).limit(14)
    setActivities(activitiesData || [])

    const now = new Date()
    const { data: challengesData } = await supabase.from('challenges').select('*, progress:challenge_progress(*)').eq('active', true).eq('month', now.getMonth() + 1).eq('year', now.getFullYear())
    setChallenges(challengesData || [])

    const { data: rankingData } = await supabase.from('profiles').select('id, full_name, total_km, level').eq('plan_status', 'active').order('total_km', { ascending: false })
    if (rankingData) {
      const pos = rankingData.findIndex(r => r.id === session.user.id) + 1
      const nextRunner = pos > 1 ? rankingData[pos - 2] : null
      setRanking({ position: pos, total: rankingData.length, categoryPosition: 0, categoryTotal: 0, nextRunner })
      setTopRunners(rankingData.slice(0, 5))
    }

    const { data: eventsData } = await supabase.from('events').select('*').eq('status', 'active').order('date', { ascending: true }).limit(3)
    setUpcomingEvents(eventsData || [])

    setLoading(false)
  }

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando dashboard...
    </div>
  )

  if (!profile) return null

  const now = new Date()
  const monthKm = activities.filter(a => { const d = new Date(a.recorded_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((sum, a) => sum + a.distance_km, 0)
  const totalHours = activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SRC'

  const levelClass: Record<string, string> = { bronce: 'level-bronce', plata: 'level-plata', oro: 'level-oro', elite: 'level-elite' }
  const levelEmoji: Record<string, string> = { bronce: '🥉', plata: '🥈', oro: '🥇', elite: '⚡' }
  const typeColors: Record<string, string> = { corrida: '#4ade80', carrera: '#fbbf24', track: '#22d3ee', social: '#818cf8' }
  const typePillClass: Record<string, string> = { corrida: 'pill-g', carrera: 'pill-r', track: 'pill-t', social: 'pill-g' }
  const typeEmoji: Record<string, string> = { corrida: '🏃', carrera: '🏅', track: '🏟️', social: '🎉' }

  const avatarColors = ['rgba(74,222,128,0.15)', 'rgba(34,211,238,0.15)', 'rgba(251,191,36,0.15)', 'rgba(129,140,248,0.15)', 'rgba(251,113,133,0.15)']
  const avatarTextColors = ['#4ade80', '#22d3ee', '#fbbf24', '#818cf8', '#fb7185']

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
    nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 0.5px solid rgba(255,255,255,0.07); background: rgba(10,10,10,0.95); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-text { font-size: 14px; font-weight: 600; color: #fff; letter-spacing: 0.02em; font-family: Inter, sans-serif; }
    .logo-text em { font-style: italic; font-weight: 400; }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a { font-size: 13px; color: rgba(255,255,255,0.42); text-decoration: none; }
    .nav-links a:hover { color: rgba(255,255,255,0.8); }
    .nav-active { color: rgba(255,255,255,0.85) !important; }
    .nav-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #0a0a0a; cursor: pointer; flex-shrink: 0; text-decoration: none; }
    .page { display: grid; grid-template-columns: 260px 1fr; min-height: calc(100vh - 65px); }
    .sidebar { border-right: 0.5px solid rgba(255,255,255,0.07); padding: 28px 20px; display: flex; flex-direction: column; gap: 4px; }
    .sidebar-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.2); padding: 16px 12px 8px; }
    .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; font-size: 14px; color: rgba(255,255,255,0.45); cursor: pointer; transition: all .15s; text-decoration: none; }
    .sidebar-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
    .sidebar-item.active { background: rgba(255,255,255,0.08); color: #fff; font-weight: 500; }
    .sidebar-badge { margin-left: auto; font-size: 10px; background: rgba(74,222,128,0.15); color: #4ade80; border-radius: 999px; padding: 2px 8px; font-weight: 600; }
    .sidebar-plan { margin-top: auto; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.09); border-radius: 12px; padding: 14px; }
    .sidebar-plan-label { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 4px; }
    .sidebar-plan-name { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 8px; }
    .sidebar-plan-btn { display: block; text-align: center; font-size: 12px; color: rgba(255,255,255,0.5); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 7px; text-decoration: none; }
    .sidebar-plan-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .main { padding: 32px 36px; overflow-y: auto; }
    .welcome-card { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px 32px; display: flex; align-items: center; gap: 24px; margin-bottom: 28px; position: relative; overflow: hidden; }
    .welcome-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #4ade80, #22d3ee, #818cf8); }
    .runner-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; color: #0a0a0a; flex-shrink: 0; border: 3px solid rgba(255,255,255,0.1); }
    .welcome-info { flex: 1; }
    .welcome-greeting { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 4px; }
    .welcome-name { font-size: 24px; font-weight: 600; margin-bottom: 8px; letter-spacing: -.01em; }
    .welcome-badges { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .level-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 999px; }
    .level-bronce { background: rgba(205,127,50,0.15); color: #cd7f32; border: 0.5px solid rgba(205,127,50,0.3); }
    .level-plata { background: rgba(192,192,192,0.12); color: #c0c0c0; border: 0.5px solid rgba(192,192,192,0.25); }
    .level-oro { background: rgba(255,215,0,0.12); color: #ffd700; border: 0.5px solid rgba(255,215,0,0.25); }
    .level-elite { background: rgba(34,211,238,0.12); color: #22d3ee; border: 0.5px solid rgba(34,211,238,0.25); }
    .plan-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 5px 12px; }
    .welcome-right { text-align: right; }
    .points-label { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 4px; }
    .points-value { font-size: 36px; font-weight: 700; color: #ffd700; letter-spacing: -.02em; line-height: 1; }
    .points-bar-wrap { margin-top: 10px; }
    .points-bar-label { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.25); margin-bottom: 5px; }
    .points-bar-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px; width: 160px; }
    .points-bar-fill { height: 4px; background: linear-gradient(90deg, #ffd700, #fbbf24); border-radius: 999px; }
    .section-title { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 16px; margin-top: 28px; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 4px; }
    .stat-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 16px; }
    .stat-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; font-size: 16px; }
    .icon-green { background: rgba(74,222,128,0.1); color: #4ade80; }
    .icon-blue { background: rgba(34,211,238,0.1); color: #22d3ee; }
    .icon-purple { background: rgba(129,140,248,0.1); color: #818cf8; }
    .icon-amber { background: rgba(251,191,36,0.1); color: #fbbf24; }
    .icon-coral { background: rgba(251,113,133,0.1); color: #fb7185; }
    .stat-value { font-size: 26px; font-weight: 600; color: #fff; letter-spacing: -.02em; line-height: 1; margin-bottom: 4px; }
    .stat-unit { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.4); }
    .stat-label { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 8px; }
    .stat-trend { font-size: 11px; color: #4ade80; }
    .activity-wrap { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; }
    .activity-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .activity-title { font-size: 14px; font-weight: 500; }
    .bars-wrap { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .bar-track { flex: 1; width: 100%; background: rgba(255,255,255,0.05); border-radius: 4px; display: flex; flex-direction: column; justify-content: flex-end; }
    .bar-fill { border-radius: 4px; width: 100%; }
    .bar-fill.run { background: rgba(74,222,128,0.5); }
    .bar-fill.rest { background: rgba(255,255,255,0.03); height: 100%; }
    .bar-label { font-size: 10px; color: rgba(255,255,255,0.2); }
    .streak-wrap { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; }
    .streak-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .streak-title { font-size: 14px; font-weight: 500; }
    .streak-count { font-size: 28px; font-weight: 700; color: #fb7185; }
    .streak-sub { font-size: 12px; color: rgba(255,255,255,0.3); }
    .streak-dots { display: flex; gap: 5px; flex-wrap: wrap; }
    .streak-dot { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: rgba(255,255,255,0.3); }
    .streak-dot.done { background: rgba(74,222,128,0.2); color: #4ade80; font-weight: 600; }
    .streak-dot.today { background: rgba(74,222,128,0.4); color: #4ade80; font-weight: 700; border: 1.5px solid #4ade80; }
    .streak-dot.rest { background: rgba(255,255,255,0.03); }
    .ranking-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ranking-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; }
    .ranking-card-title { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 16px; font-weight: 500; }
    .rank-position { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
    .rank-num { font-size: 48px; font-weight: 700; line-height: 1; letter-spacing: -.03em; }
    .rank-num.normal { color: #fff; }
    .rank-of { font-size: 16px; color: rgba(255,255,255,0.25); }
    .rank-label { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
    .rank-progress-track { height: 4px; background: rgba(255,255,255,0.07); border-radius: 999px; margin-top: 6px; }
    .rank-progress-fill { height: 4px; border-radius: 999px; }
    .fill-green { background: linear-gradient(90deg, #4ade80, #22d3ee); }
    .rank-next { margin-top: 12px; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px 12px; }
    .rank-next-avatar { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); flex-shrink: 0; }
    .rank-next-name { font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 500; }
    .rank-next-gap { font-size: 11px; color: rgba(255,255,255,0.25); }
    .rank-next-km { font-size: 12px; color: #4ade80; font-weight: 600; white-space: nowrap; }
    .top5-wrap { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; }
    .top5-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
    .top5-row:last-child { border-bottom: none; }
    .top5-pos { font-size: 13px; font-weight: 600; width: 24px; text-align: center; flex-shrink: 0; }
    .pos-1 { color: #ffd700; } .pos-2 { color: #c0c0c0; } .pos-3 { color: #cd7f32; } .pos-other { color: rgba(255,255,255,0.3); }
    .top5-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .top5-me { border: 2px solid #4ade80; }
    .top5-name { flex: 1; font-size: 13px; color: rgba(255,255,255,0.7); }
    .top5-name.me { color: #fff; font-weight: 500; }
    .top5-km { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); }
    .top5-km.me { color: #4ade80; }
    .reto-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .reto-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; }
    .reto-card.activo { border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.03); }
    .reto-card.activo::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #fbbf24, #f59e0b); }
    .reto-card.completado { border-color: rgba(74,222,128,0.25); background: rgba(74,222,128,0.03); }
    .reto-card.completado::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #4ade80, #22d3ee); }
    .reto-card.bloqueado { opacity: .55; }
    .reto-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .reto-title-wrap { flex: 1; }
    .reto-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; margin-bottom: 8px; }
    .tag-activo { background: rgba(251,191,36,0.12); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.25); }
    .tag-completado { background: rgba(74,222,128,0.12); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.25); }
    .tag-bloqueado { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); border: 0.5px solid rgba(255,255,255,0.1); }
    .reto-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; line-height: 1.3; }
    .reto-desc { font-size: 12px; color: rgba(255,255,255,0.35); line-height: 1.55; }
    .reto-reward-box { background: rgba(251,191,36,0.08); border: 0.5px solid rgba(251,191,36,0.18); border-radius: 10px; padding: 10px 12px; text-align: center; min-width: 100px; flex-shrink: 0; margin-left: 16px; }
    .reto-reward-icon { font-size: 20px; margin-bottom: 4px; }
    .reto-reward-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: .06em; }
    .reto-reward-value { font-size: 13px; font-weight: 600; color: #fbbf24; margin-top: 2px; }
    .reto-progress-wrap { margin-top: 16px; }
    .reto-progress-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .reto-progress-label { font-size: 12px; color: rgba(255,255,255,0.3); }
    .reto-progress-pct { font-size: 14px; font-weight: 600; color: #fbbf24; }
    .reto-progress-track { height: 8px; background: rgba(255,255,255,0.07); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
    .reto-progress-fill { height: 8px; border-radius: 999px; }
    .reto-fill-amber { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
    .reto-fill-green { background: linear-gradient(90deg, #4ade80, #22d3ee); }
    .reto-progress-meta { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.25); }
    .reto-completado-banner { display: flex; align-items: center; gap: 8px; background: rgba(74,222,128,0.08); border: 0.5px solid rgba(74,222,128,0.2); border-radius: 8px; padding: 8px 12px; margin-top: 12px; font-size: 12px; color: #4ade80; font-weight: 500; }
    .upcoming-list { display: flex; flex-direction: column; gap: 10px; }
    .upcoming-item { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 16px; text-decoration: none; }
    .upcoming-item:hover { border-color: rgba(255,255,255,0.16); }
    .upcoming-date { background: rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 10px; text-align: center; min-width: 44px; flex-shrink: 0; }
    .upcoming-day { font-size: 18px; font-weight: 600; line-height: 1; color: #fff; }
    .upcoming-month { font-size: 9px; text-transform: uppercase; color: rgba(255,255,255,0.3); letter-spacing: .06em; margin-top: 2px; }
    .upcoming-info { flex: 1; }
    .upcoming-title { font-size: 13px; font-weight: 500; margin-bottom: 3px; color: #fff; }
    .upcoming-meta { font-size: 12px; color: rgba(255,255,255,0.3); }
    .upcoming-pill { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
    .pill-g { background: rgba(74,222,128,0.1); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.2); }
    .pill-r { background: rgba(251,191,36,0.1); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.2); }
    .pill-t { background: rgba(34,211,238,0.1); color: #22d3ee; border: 0.5px solid rgba(34,211,238,0.2); }
  `

  // Calcular racha real de días consecutivos con actividad
  function calculateStreak() {
    const datesWithActivity = new Set(
      activities.map(a => new Date(a.recorded_at).toDateString())
    )
    let streak = 0
    const cursor = new Date()
    // Si hoy no hay actividad, empezamos a contar desde ayer (no rompe la racha por no haber corrido aún hoy)
    if (!datesWithActivity.has(cursor.toDateString())) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (datesWithActivity.has(cursor.toDateString())) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  const lastStreakDays = calculateStreak()
  const streakDots = Array.from({ length: 14 }, (_, i) => {
    const dayOffset = 13 - i
    const date = new Date()
    date.setDate(date.getDate() - dayOffset)
    const hasActivity = activities.some(a => new Date(a.recorded_at).toDateString() === date.toDateString())
    const isToday = dayOffset === 0
    return { day: date.getDate(), status: hasActivity ? (isToday ? 'today' : 'done') : 'rest' }
  })

  const recentDays = ['L','M','X','J','V','S','D','L','M','X','J','V','S','D']
  const barHeights = Array.from({ length: 14 }, (_, i) => {
    const dayOffset = 13 - i
    const date = new Date()
    date.setDate(date.getDate() - dayOffset)
    const dayKm = activities.filter(a => new Date(a.recorded_at).toDateString() === date.toDateString()).reduce((sum, a) => sum + a.distance_km, 0)
    return dayKm
  })
  const maxBarKm = Math.max(...barHeights, 1)
  const barHeightsPct = barHeights.map(km => km > 0 ? Math.max(15, (km / maxBarKm) * 100) : 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav>
        <a className="logo" href="/dashboard">
          <span className="logo-text">Santiago<em>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup></span>
        </a>
        <a href="/profile" className="nav-avatar">{initials}</a>
      </nav>

      <div className="page">
        <aside className="sidebar">
          <div className="sidebar-label">Principal</div>
          <a className="sidebar-item active" href="/dashboard">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </a>
          <a className="sidebar-item" href="/profile">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Mi perfil
          </a>
          <a className="sidebar-item" href="/events">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Eventos
            {upcomingEvents.length > 0 && <span className="sidebar-badge">{upcomingEvents.length}</span>}
          </a>
          <a className="sidebar-item" href="/directory">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Directorio
          </a>
          <a className="sidebar-item" href="/gallery">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Galería
          </a>
          <a className="sidebar-item" href="/chat">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Chat del club
          </a>

          <div className="sidebar-label">Beneficios</div>
          <a className="sidebar-item" href="/sponsors">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Descuentos
          </a>

          <div className="sidebar-label">Cuenta</div>
          <a className="sidebar-item" href="/membresia">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Mi membresía
          </a>

          <div className="sidebar-plan">
            <div className="sidebar-plan-label">Plan activo</div>
            <div className="sidebar-plan-name">{profile.plan === 'elite' ? '⚡ Plan Elite' : '🏃 Plan Pace'}</div>
            {profile.plan !== 'elite' && <a href="/membresia" className="sidebar-plan-btn">Actualizar a Elite →</a>}
          </div>
        </aside>

        <main className="main">
          {/* BIENVENIDA */}
          <div className="welcome-card">
            <div className="runner-avatar">{initials}</div>
            <div className="welcome-info">
              <div className="welcome-greeting">¡Bienvenido de vuelta! 🌅</div>
              <div className="welcome-name">{profile.full_name}</div>
              <div className="welcome-badges">
                <span className={`level-badge ${levelClass[profile.level] || 'level-bronce'}`}>
                  {levelEmoji[profile.level]} Nivel {profile.level?.charAt(0).toUpperCase() + profile.level?.slice(1)}
                </span>
                <span className="plan-badge">Plan {profile.plan?.charAt(0).toUpperCase() + profile.plan?.slice(1)}</span>
              </div>
            </div>
            <div className="welcome-right">
              <div className="points-label">Puntos acumulados</div>
              <div className="points-value">{profile.points?.toLocaleString('es-DO') || '0'}</div>
              <div className="points-bar-wrap">
                <div className="points-bar-label"><span>{profile.level}</span><span>siguiente nivel</span></div>
                <div className="points-bar-track">
                  <div className="points-bar-fill" style={{ width: `${Math.min(100, (profile.points % 1000) / 10)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* RESUMEN DEL MES */}
          <div className="section-title">Resumen del mes · {new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon icon-green">🏃</div>
              <div className="stat-value">{monthKm.toFixed(0)}<span className="stat-unit">km</span></div>
              <div className="stat-label">Kilómetros recorridos</div>
              <div className="stat-trend">↑ este mes</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-blue">⏱️</div>
              <div className="stat-value">{Math.floor(totalHours / 60)}<span className="stat-unit">h {totalHours % 60}m</span></div>
              <div className="stat-label">Horas entrenadas</div>
              <div className="stat-trend">↑ total</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-purple">⚡</div>
              <div className="stat-value">{profile.pace_avg || '—'}<span className="stat-unit"> /km</span></div>
              <div className="stat-label">Ritmo promedio</div>
              <div className="stat-trend">↑ pace actual</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-amber">⭐</div>
              <div className="stat-value">{activities.length}</div>
              <div className="stat-label">Actividades</div>
              <div className="stat-trend">↑ registradas</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-coral">🔥</div>
              <div className="stat-value">{lastStreakDays}<span className="stat-unit">días</span></div>
              <div className="stat-label">Racha consecutiva</div>
              <div className="stat-trend">🔥 sigue así</div>
            </div>
          </div>

          {/* ACTIVIDAD + RACHA */}
          <div className="section-title">Actividad reciente</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px' }}>
            <div className="activity-wrap">
              <div className="activity-header">
                <span className="activity-title">Km por día · últimas 2 semanas</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(74,222,128,0.5)' }}></div>Corrida</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}></div>Descanso</div>
                </div>
              </div>
              <div className="bars-wrap">
                {recentDays.map((day, i) => (
                  <div key={i} className="bar-col" title={barHeights[i] > 0 ? `${barHeights[i].toFixed(1)} km` : 'Sin actividad'}>
                    <div className="bar-track">
                      {barHeightsPct[i] > 0
                        ? <div className="bar-fill run" style={{ height: `${barHeightsPct[i]}%` }}></div>
                        : <div className="bar-fill rest"></div>
                      }
                    </div>
                    <div className="bar-label">{day}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="streak-wrap">
              <div className="streak-header">
                <div>
                  <div className="streak-title">🔥 Racha actual</div>
                  <div className="streak-sub">días consecutivos</div>
                </div>
                <div className="streak-count">{lastStreakDays}</div>
              </div>
              <div className="streak-dots">
                {streakDots.map((dot, i) => (
                  <div key={i} className={`streak-dot ${dot.status}`}>{dot.day}</div>
                ))}
              </div>
            </div>
          </div>

          {/* RANKING */}
          <div className="section-title">Ranking del club</div>
          <div className="ranking-grid">
            <div className="ranking-card">
              <div className="ranking-card-title">🏃 Posición general · {new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</div>
              <div className="rank-position">
                <div className="rank-num normal">#{ranking.position || '—'}</div>
                <div className="rank-of">/ {ranking.total}</div>
              </div>
              <div className="rank-label">
                {ranking.position > 0 && ranking.total > 0 ? `Top ${Math.round((ranking.position / ranking.total) * 100)}% del club` : 'Registra actividades para aparecer'}
              </div>
              <div className="rank-progress-track">
                <div className="rank-progress-fill fill-green" style={{ width: ranking.total > 0 ? `${Math.max(5, 100 - (ranking.position / ranking.total) * 100)}%` : '0%' }}></div>
              </div>
              {ranking.nextRunner && (
                <div className="rank-next">
                  <div className="rank-next-avatar">{ranking.nextRunner.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="rank-next-name">{ranking.nextRunner.full_name}</div>
                    <div className="rank-next-gap">Posición #{ranking.position - 1}</div>
                  </div>
                  <div className="rank-next-km">+{((ranking.nextRunner.total_km || 0) - (profile.total_km || 0)).toFixed(1)}km</div>
                </div>
              )}
            </div>
            <div className="ranking-card">
              <div className="ranking-card-title">🏆 Top 5 del club este mes</div>
              {topRunners.map((runner, i) => {
                const isMe = runner.id === profile.id
                const posClass = i === 0 ? 'pos-1' : i === 1 ? 'pos-2' : i === 2 ? 'pos-3' : 'pos-other'
                return (
                  <div key={runner.id} className="top5-row" style={isMe ? { background: 'rgba(74,222,128,0.04)', borderRadius: 8, padding: '10px 8px', margin: '-2px -8px' } : {}}>
                    <div className={`top5-pos ${isMe ? 'pos-other' : posClass}`} style={isMe ? { color: '#4ade80' } : {}}>
                      {isMe ? ranking.position : i + 1}
                    </div>
                    <div className={`top5-avatar ${isMe ? 'top5-me' : ''}`} style={{ background: avatarColors[i % 5], color: avatarTextColors[i % 5] }}>
                      {runner.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className={`top5-name ${isMe ? 'me' : ''}`}>{isMe ? `Tú · ${runner.full_name}` : runner.full_name}</div>
                    <div className={`top5-km ${isMe ? 'me' : ''}`}>{(runner.total_km || 0).toFixed(0)} km</div>
                  </div>
                )
              })}
              {topRunners.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: 16 }}>No hay datos de ranking aún</div>}
            </div>
          </div>

          {/* RETOS */}
          {challenges.length > 0 && (
            <>
              <div className="section-title">Reto del mes · {new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</div>
              <div className="reto-grid">
                {challenges.map(challenge => {
                  const progress = Array.isArray(challenge.progress) ? challenge.progress[0] : challenge.progress
                  const pct = progress ? Math.min(100, (progress.current_value / challenge.goal_value) * 100) : 0
                  const completed = progress?.completed
                  const isElite = challenge.elite_only && profile.plan !== 'elite'
                  const cardClass = isElite ? 'bloqueado' : completed ? 'completado' : 'activo'

                  return (
                    <div key={challenge.id} className={`reto-card ${cardClass}`}>
                      <div className="reto-header">
                        <div className="reto-title-wrap">
                          <div className={`reto-tag ${isElite ? 'tag-bloqueado' : completed ? 'tag-completado' : 'tag-activo'}`}>
                            {isElite ? '🔒 Solo Elite' : completed ? '✓ Completado' : '⚡ En progreso'}
                          </div>
                          <div className="reto-name">{challenge.title}</div>
                          {challenge.description && <div className="reto-desc">{challenge.description}</div>}
                        </div>
                        <div className="reto-reward-box" style={completed ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)' } : {}}>
                          <div className="reto-reward-icon">🏅</div>
                          <div className="reto-reward-label">Recompensa</div>
                          <div className="reto-reward-value" style={completed ? { color: '#4ade80' } : {}}>{challenge.reward_points} pts</div>
                        </div>
                      </div>
                      {!isElite && (
                        <div className="reto-progress-wrap">
                          <div className="reto-progress-top">
                            <span className="reto-progress-label">{progress?.current_value || 0} {challenge.goal_unit} de {challenge.goal_value}</span>
                            <span className="reto-progress-pct" style={completed ? { color: '#4ade80' } : {}}>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="reto-progress-track">
                            <div className={`reto-progress-fill ${completed ? 'reto-fill-green' : 'reto-fill-amber'}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          {completed ? (
                            <div className="reto-completado-banner">✓ ¡Reto completado! · +{challenge.reward_points} puntos acreditados</div>
                          ) : (
                            <div className="reto-progress-meta">
                              <span>Faltan <strong>{challenge.goal_value - (progress?.current_value || 0)} {challenge.goal_unit}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* PRÓXIMOS EVENTOS */}
          {upcomingEvents.length > 0 && (
            <>
              <div className="section-title">Próximos eventos</div>
              <div className="upcoming-list">
                {upcomingEvents.map(event => {
                  const eventDate = event.date ? new Date(event.date) : null
                  const isElite = event.elite_only && profile.plan !== 'elite'
                  return (
                    <a key={event.id} className="upcoming-item" href="/events" style={isElite ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                      <div className="upcoming-date">
                        <div className="upcoming-day">{eventDate ? eventDate.getDate() : '—'}</div>
                        <div className="upcoming-month">{eventDate ? eventDate.toLocaleDateString('es-DO', { month: 'short' }) : ''}</div>
                      </div>
                      <div className="upcoming-info">
                        <div className="upcoming-title">{event.title}</div>
                        <div className="upcoming-meta" style={isElite ? { color: '#22d3ee' } : {}}>
                          {isElite ? '🔒 Solo plan Elite · Actualiza tu plan para acceder' : `${event.location || ''} · ${event.distance || ''}`}
                        </div>
                      </div>
                      <span className={`upcoming-pill ${typePillClass[event.type] || 'pill-g'}`}>
                        {event.elite_only ? 'Elite' : event.type}
                      </span>
                    </a>
                  )
                })}
              </div>
            </>
          )}

          <div style={{ height: 40 }}></div>
        </main>
      </div>
    </>
  )
}
