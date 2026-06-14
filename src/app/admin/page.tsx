'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Profile, Sponsor } from '@/lib/types'

type Panel = 'overview' | 'miembros' | 'pagos' | 'eventos' | 'moderacion' | 'chat' | 'foro' | 'admins' | 'preview'

export default function AdminPage() {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel>('overview')
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('SA')

  const [members, setMembers] = useState<Profile[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [threads, setThreads] = useState<any[]>([])
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, pendingContent: 0 })
  const [searchQuery, setSearchQuery] = useState('')

  // Sponsor form
  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [sponsorForm, setSponsorForm] = useState({ name: '', description: '', category: '', website_url: '', instagram: '', whatsapp: '', discount_code: '', discount_desc: '', featured: false, active: true })
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null)
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState('')
  const [sponsorMsg, setSponsorMsg] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Profile | null>(null)
  const [memberForm, setMemberForm] = useState({ full_name: '', email: '', phone: '', plan: 'pace', plan_status: 'active', level: 'bronce' })
  const [memberMsg, setMemberMsg] = useState('')
  const [isNewMember, setIsNewMember] = useState(false)

  // Activities modal
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [activitiesMember, setActivitiesMember] = useState<Profile | null>(null)
  const [memberActivities, setMemberActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [eventForm, setEventForm] = useState({ title: '', description: '', type: 'corrida', date: '', location: '', distance: '', max_capacity: '', elite_only: false, status: 'active', image_url: '' })
  const [eventMsg, setEventMsg] = useState('')
  const [eventImageFile, setEventImageFile] = useState<File | null>(null)
  const [eventImagePreview, setEventImagePreview] = useState('')
  const eventImageRef = useRef<HTMLInputElement>(null)

  // Channel modal
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [channelForm, setChannelForm] = useState({ name: '', emoji: '', elite_only: false })
  const [channelMsg, setChannelMsg] = useState('')

  useEffect(() => { checkAdmin() }, [])
  useEffect(() => { if (!loading) loadData() }, [panel, loading])

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: adminRole } = await supabase.from('admin_roles').select('*').eq('user_id', session.user.id).single()
    if (!adminRole) { setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
    if (profile?.full_name) setAdminName(profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2))
    setLoading(false)
  }

  async function loadData() {
    if (panel === 'overview' || panel === 'miembros' || panel === 'pagos') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      const m = data || []
      setMembers(m)
      setStats(s => ({ ...s, totalMembers: m.length, activeMembers: m.filter((x: any) => x.plan_status === 'active').length }))
    }
    if (panel === 'moderacion') {
      const { data } = await supabase.from('photos').select('*, uploader:profiles(full_name)').eq('approved', false).order('created_at', { ascending: false })
      setPendingPhotos(data || [])
      setStats(s => ({ ...s, pendingContent: (data || []).length }))
    }
    if (panel === 'admins') {
      const { data: sp } = await supabase.from('sponsors').select('*').order('sort_order')
      setSponsors(sp || [])
    }
    if (panel === 'eventos') {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true })
      setEvents(data || [])
    }
    if (panel === 'chat') {
      const { data } = await supabase.from('messages')
        .select('*, profile:profiles(full_name, plan)')
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(100)
      setMessages(data || [])
    }
    if (panel === 'foro') {
      const { data: ch } = await supabase.from('channels').select('*').order('name')
      setChannels(ch || [])
      const { data: th } = await supabase.from('threads').select('*, profile:profiles(full_name)').eq('deleted', false).order('pinned', { ascending: false }).order('created_at', { ascending: false })
      setThreads(th || [])
    }
  }

  async function saveEvent() {
    setEventMsg('')
    let imageUrl = editingEvent?.image_url || ''
    if (eventImageFile) {
      const fileExt = eventImageFile.name.split('.').pop()
      const fileName = `event-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('logos').upload(fileName, eventImageFile)
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    }
    const payload = { ...eventForm, max_capacity: eventForm.max_capacity ? parseInt(eventForm.max_capacity) : null, image_url: imageUrl }
    if (editingEvent) {
      const { error } = await supabase.from('events').update(payload).eq('id', editingEvent.id)
      if (!error) { setEventMsg('✓ Evento actualizado'); loadData(); setTimeout(() => setShowEventModal(false), 1000) }
      else setEventMsg('Error: ' + error.message)
    } else {
      const { error } = await supabase.from('events').insert([payload])
      if (!error) { setEventMsg('✓ Evento creado'); loadData(); setTimeout(() => setShowEventModal(false), 1000) }
      else setEventMsg('Error: ' + error.message)
    }
  }

  async function saveSponsor() {
    setSponsorMsg('')
    let logoUrl = editingSponsor?.logo_url || ''
    if (sponsorLogoFile) {
      const fileExt = sponsorLogoFile.name.split('.').pop()
      const fileName = `sponsor-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('logos').upload(fileName, sponsorLogoFile)
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName)
        logoUrl = urlData.publicUrl
      }
    }
    const payload = { ...sponsorForm, logo_url: logoUrl }
    if (editingSponsor) {
      const { error } = await supabase.from('sponsors').update(payload).eq('id', editingSponsor.id)
      if (!error) { setSponsorMsg('✓ Actualizado'); loadData(); setTimeout(() => setShowSponsorModal(false), 1000) }
    } else {
      const { error } = await supabase.from('sponsors').insert([payload])
      if (!error) { setSponsorMsg('✓ Creado'); loadData(); setTimeout(() => setShowSponsorModal(false), 1000) }
    }
  }

  async function saveMember() {
    setMemberMsg('')
    if (isNewMember) {
      // Create new user in Supabase Auth + profile
      const { data, error } = await supabase.auth.admin?.createUser({ email: memberForm.email, password: 'TempPass123!', email_confirm: true }) as any
      if (error) { setMemberMsg('Error: ' + error.message); return }
      const userId = data?.user?.id
      if (userId) {
        await supabase.from('profiles').insert([{ id: userId, ...memberForm }])
        setMemberMsg('✓ Miembro creado')
        loadData()
        setTimeout(() => setShowMemberModal(false), 1000)
      }
    } else if (editingMember) {
      const { error } = await supabase.from('profiles').update(memberForm).eq('id', editingMember.id)
      if (!error) { setMemberMsg('✓ Actualizado'); loadData(); setTimeout(() => setShowMemberModal(false), 1000) }
    }
  }

  async function saveChannel() {
    setChannelMsg('')
    const { error } = await supabase.from('channels').insert([channelForm])
    if (!error) { setChannelMsg('✓ Canal creado'); loadData(); setTimeout(() => setShowChannelModal(false), 1000) }
    else setChannelMsg('Error: ' + error.message)
  }

  async function deleteChannel(id: string) {
    if (!confirm('¿Eliminar este canal? Se eliminarán todos sus mensajes.')) return
    await supabase.from('messages').delete().eq('channel_id', id)
    await supabase.from('channels').delete().eq('id', id)
    loadData(); toast('✓ Canal eliminado')
  }

  async function updateMemberStatus(id: string, plan_status: string) {
    await supabase.from('profiles').update({ plan_status }).eq('id', id)
    loadData(); toast(`✓ Miembro ${plan_status === 'active' ? 'activado' : 'suspendido'}`)
  }

  async function openMemberActivities(member: Profile) {
    setActivitiesMember(member)
    setShowActivitiesModal(true)
    setActivitiesLoading(true)
    const { data } = await supabase.from('activities').select('*').eq('user_id', member.id).order('recorded_at', { ascending: false }).limit(30)
    setMemberActivities(data || [])
    setActivitiesLoading(false)
  }

  async function toggleActivityValid(activityId: string, currentValid: boolean) {
    await supabase.from('activities').update({ valid: !currentValid }).eq('id', activityId)
    if (activitiesMember) {
      const { data } = await supabase.from('activities').select('*').eq('user_id', activitiesMember.id).order('recorded_at', { ascending: false }).limit(30)
      setMemberActivities(data || [])
      // Recalcular total_km del perfil
      const { data: allActivities } = await supabase.from('activities').select('distance_km').eq('user_id', activitiesMember.id).eq('valid', true)
      const totalKm = (allActivities || []).reduce((sum: number, a: any) => sum + a.distance_km, 0)
      await supabase.from('profiles').update({ total_km: Math.round(totalKm * 100) / 100 }).eq('id', activitiesMember.id)
    }
    toast(currentValid ? '✕ Actividad invalidada' : '✓ Actividad validada')
  }

  async function approvePhoto(id: string) {
    await supabase.from('photos').update({ approved: true }).eq('id', id)
    loadData(); toast('✓ Foto aprobada')
  }

  async function rejectPhoto(id: string) {
    await supabase.from('photos').delete().eq('id', id)
    loadData(); toast('✕ Foto rechazada')
  }

  async function deleteMessage(id: string) {
    await supabase.from('messages').update({ deleted: true }).eq('id', id)
    loadData(); toast('✕ Mensaje eliminado')
  }

  async function pinMessage(id: string, pinned: boolean) {
    await supabase.from('messages').update({ pinned: !pinned }).eq('id', id)
    loadData(); toast(pinned ? 'Desfijado' : '📌 Fijado')
  }

  async function deleteThread(id: string) {
    await supabase.from('threads').update({ deleted: true }).eq('id', id)
    loadData(); toast('✕ Hilo eliminado')
  }

  async function pinThread(id: string, pinned: boolean) {
    await supabase.from('threads').update({ pinned: !pinned }).eq('id', id)
    loadData(); toast(pinned ? 'Desfijado' : '📌 Fijado')
  }

  async function deleteEvent(id: string) {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('events').delete().eq('id', id)
    loadData(); toast('✕ Evento eliminado')
  }

  function openNewEvent() {
    setEditingEvent(null)
    setEventForm({ title: '', description: '', type: 'corrida', date: '', location: '', distance: '', max_capacity: '', elite_only: false, status: 'active', image_url: '' })
    setEventImageFile(null); setEventImagePreview(''); setEventMsg('')
    setShowEventModal(true)
  }

  function openEditEvent(ev: any) {
    setEditingEvent(ev)
    setEventForm({ title: ev.title, description: ev.description || '', type: ev.type, date: ev.date?.split('T')[0] || '', location: ev.location || '', distance: ev.distance || '', max_capacity: ev.max_capacity?.toString() || '', elite_only: ev.elite_only, status: ev.status, image_url: ev.image_url || '' })
    setEventImagePreview(ev.image_url || ''); setEventImageFile(null); setEventMsg('')
    setShowEventModal(true)
  }

  function openEditSponsor(sp: Sponsor) {
    setEditingSponsor(sp)
    setSponsorForm({ name: sp.name, description: sp.description || '', category: sp.category || '', website_url: sp.website_url || '', instagram: sp.instagram || '', whatsapp: sp.whatsapp || '', discount_code: sp.discount_code || '', discount_desc: sp.discount_desc || '', featured: sp.featured, active: sp.active })
    setSponsorLogoPreview(sp.logo_url || ''); setSponsorLogoFile(null); setSponsorMsg('')
    setShowSponsorModal(true)
  }

  function openNewSponsor() {
    setEditingSponsor(null)
    setSponsorForm({ name: '', description: '', category: '', website_url: '', instagram: '', whatsapp: '', discount_code: '', discount_desc: '', featured: false, active: true })
    setSponsorLogoPreview(''); setSponsorLogoFile(null); setSponsorMsg('')
    setShowSponsorModal(true)
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSponsorLogoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setSponsorLogoPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleEventImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setEventImageFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setEventImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  function toast(msg: string) {
    if (typeof document === 'undefined') return
    const t = document.createElement('div')
    t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#fff;color:#0a0a0a;font-size:13px;font-weight:500;padding:10px 20px;border-radius:999px;z-index:9999;white-space:nowrap;font-family:Inter,sans-serif'
    t.textContent = msg
    document.body.appendChild(t)
    setTimeout(() => t.remove(), 3000)
  }

  const filteredMembers = members.filter(m =>
    !searchQuery || m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sitePages = [
    { href: '/', label: 'Landing', badge: 'Pública', color: '#4ade80' },
    { href: '/membresia', label: 'Membresía', badge: 'Pública', color: '#4ade80' },
    { href: '/dashboard', label: 'Dashboard', badge: 'Miembro', color: '#22d3ee' },
    { href: '/profile', label: 'Perfil', badge: 'Miembro', color: '#22d3ee' },
    { href: '/events', label: 'Eventos', badge: 'Miembro', color: '#22d3ee' },
    { href: '/gallery', label: 'Galería', badge: 'Miembro', color: '#22d3ee' },
    { href: '/chat', label: 'Chat', badge: 'Miembro', color: '#22d3ee' },
    { href: '/sponsors', label: 'Patrocinadores', badge: 'Miembro', color: '#22d3ee' },
    { href: '/directory', label: 'Directorio', badge: 'Miembro', color: '#22d3ee' },
  ]

  const eventTypeColors: Record<string, string> = { corrida: '#4ade80', carrera: '#fbbf24', track: '#22d3ee', social: '#818cf8' }

  if (loading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
      Cargando panel...
    </div>
  )

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .admin-wrap { font-family: 'Inter', sans-serif; background: #080808; color: #fff; display: flex; flex-direction: column; overflow: hidden; height: 100vh; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; border-bottom: 0.5px solid rgba(255,255,255,0.07); background: #0d0d0d; flex-shrink: 0; }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .topbar-logo-text { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); font-family: Inter, sans-serif; text-decoration: none; }
    .topbar-sep { color: rgba(255,255,255,0.15); font-size: 16px; }
    .topbar-title { font-size: 14px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 7px; }
    .admin-badge { font-size: 10px; background: rgba(251,191,36,0.15); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.3); border-radius: 999px; padding: 2px 10px; font-weight: 600; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    .topbar-btn { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 7px 14px; font-size: 12px; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; text-decoration: none; }
    .topbar-btn:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.8); }
    .notif-dot { width: 7px; height: 7px; background: #fb7185; border-radius: 50%; }
    .avatar-admin { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #fbbf24, #f59e0b); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #0a0a0a; flex-shrink: 0; }
    .app { display: grid; grid-template-columns: 220px 1fr; flex: 1; overflow: hidden; }
    .sidebar { border-right: 0.5px solid rgba(255,255,255,0.07); background: #0d0d0d; display: flex; flex-direction: column; overflow-y: auto; }
    .sidebar-section { padding: 20px 12px 8px; }
    .sidebar-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.2); padding: 0 8px; margin-bottom: 6px; }
    .nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 8px; cursor: pointer; color: rgba(255,255,255,0.45); font-size: 13px; background: none; border: none; font-family: inherit; width: 100%; text-align: left; transition: all .15s; }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
    .nav-item.active { background: rgba(255,255,255,0.08); color: #fff; font-weight: 500; }
    .nav-badge { margin-left: auto; font-size: 10px; border-radius: 999px; padding: 2px 7px; font-weight: 600; }
    .nb-red { background: rgba(251,113,133,0.15); color: #fb7185; }
    .nb-amber { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .nb-green { background: rgba(74,222,128,0.15); color: #4ade80; }
    .sidebar-footer { margin-top: auto; padding: 16px 12px; border-top: 0.5px solid rgba(255,255,255,0.06); }
    .main { overflow-y: auto; padding: 28px 32px; }
    .main::-webkit-scrollbar { width: 4px; }
    .main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
    .page-title { font-size: 22px; font-weight: 600; letter-spacing: -.01em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); }
    .page-actions { display: flex; gap: 8px; }
    .btn-primary { display: flex; align-items: center; gap: 7px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; padding: 0 18px; height: 40px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .btn-primary:hover { opacity: .88; }
    .btn-secondary { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 16px; height: 40px; font-size: 13px; color: rgba(255,255,255,0.6); font-family: inherit; cursor: pointer; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; }
    .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .kpi-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .ki-green { background: rgba(74,222,128,0.1); color: #4ade80; }
    .ki-blue { background: rgba(34,211,238,0.1); color: #22d3ee; }
    .ki-amber { background: rgba(251,191,36,0.1); color: #fbbf24; }
    .ki-red { background: rgba(251,113,133,0.1); color: #fb7185; }
    .kpi-trend { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    .trend-up { background: rgba(74,222,128,0.1); color: #4ade80; }
    .trend-dn { background: rgba(251,113,133,0.1); color: #fb7185; }
    .kpi-value { font-size: 28px; font-weight: 600; line-height: 1; letter-spacing: -.02em; margin-bottom: 4px; }
    .kpi-label { font-size: 12px; color: rgba(255,255,255,0.3); }
    .table-wrap { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
    .table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
    .table-title { font-size: 14px; font-weight: 500; }
    .table-actions { display: flex; gap: 8px; align-items: center; }
    .search-input { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0 12px; height: 34px; color: #fff; font-size: 13px; font-family: inherit; outline: none; width: 220px; }
    .search-input::placeholder { color: rgba(255,255,255,0.2); }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,0.25); border-bottom: 0.5px solid rgba(255,255,255,0.07); }
    tbody tr { border-bottom: 0.5px solid rgba(255,255,255,0.04); transition: background .15s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: rgba(255,255,255,0.03); }
    tbody tr:hover .row-actions { opacity: 1; }
    td { padding: 12px 16px; font-size: 13px; color: rgba(255,255,255,0.65); }
    .member-cell { display: flex; align-items: center; gap: 10px; }
    .member-av { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
    .member-name { font-size: 13px; font-weight: 500; color: #fff; }
    .member-email { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px; }
    .status-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
    .sp-active { background: rgba(74,222,128,0.1); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.2); }
    .sp-pending { background: rgba(251,191,36,0.1); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.2); }
    .sp-suspended { background: rgba(251,113,133,0.1); color: #fb7185; border: 0.5px solid rgba(251,113,133,0.2); }
    .plan-pill { font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 999px; }
    .pp-pace { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
    .pp-elite { background: rgba(34,211,238,0.1); color: #22d3ee; }
    .row-actions { display: flex; gap: 6px; opacity: 0; transition: opacity .15s; }
    .row-btn { background: rgba(255,255,255,0.06); border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; }
    .row-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .row-btn.danger { color: #fb7185; }
    .row-btn.danger:hover { background: rgba(251,113,133,0.1); }
    .row-btn.success { color: #4ade80; }
    .activity-feed { display: flex; flex-direction: column; }
    .activity-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
    .activity-item:last-child { border-bottom: none; }
    .act-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; }
    .act-body { flex: 1; }
    .act-text { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.45; }
    .act-time { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 3px; }
    .mod-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .mod-item { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; display: flex; gap: 14px; }
    .mod-thumb { width: 72px; height: 72px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .mod-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .mod-info { flex: 1; }
    .mod-type { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 4px; }
    .mod-text { font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
    .mod-meta { font-size: 11px; color: rgba(255,255,255,0.25); margin-bottom: 10px; }
    .mod-btns { display: flex; gap: 6px; }
    .mod-approve { background: rgba(74,222,128,0.1); border: 0.5px solid rgba(74,222,128,0.2); color: #4ade80; border-radius: 7px; padding: 5px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
    .mod-reject { background: rgba(251,113,133,0.08); border: 0.5px solid rgba(251,113,133,0.18); color: #fb7185; border-radius: 7px; padding: 5px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
    .sponsor-list { display: flex; flex-direction: column; gap: 10px; }
    .sponsor-item { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
    .sponsor-logo { width: 48px; height: 48px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; font-size: 18px; }
    .sponsor-logo img { width: 100%; height: 100%; object-fit: contain; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; align-items: center; justify-content: center; padding: 24px; overflow-y: auto; }
    .modal-overlay.open { display: flex; }
    .modal { background: #141414; border: 0.5px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 32px; width: 100%; max-width: 520px; margin: auto; }
    .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .modal h2 { font-size: 18px; font-weight: 600; }
    .modal-close-btn { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-family: inherit; font-size: 13px; }
    .modal label { display: block; font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
    .modal input, .modal select, .modal textarea { width: 100%; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 9px; padding: 0 12px; height: 42px; color: #fff; font-size: 14px; font-family: inherit; outline: none; margin-bottom: 14px; box-sizing: border-box; }
    .modal textarea { height: auto; padding: 10px 12px; resize: vertical; }
    .modal-submit { width: 100%; height: 44px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .upload-area { border: 1.5px dashed rgba(255,255,255,0.15); border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; margin-bottom: 14px; }
    .upload-area:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.03); }
    .upload-preview { width: 100%; height: 120px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; overflow: hidden; }
    .upload-preview img { width: 100%; height: 100%; object-fit: cover; }
    .logo-preview-sm { width: 60px; height: 60px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; overflow: hidden; }
    .logo-preview-sm img { width: 100%; height: 100%; object-fit: contain; }
    .preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .preview-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; text-decoration: none; display: block; }
    .preview-card:hover { border-color: rgba(255,255,255,0.2); }
    .chat-wrap { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; height: 480px; display: flex; flex-direction: column; }
    .chat-header { padding: 14px 20px; border-bottom: 0.5px solid rgba(255,255,255,0.07); font-size: 14px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; }
    .chat-list { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 2px; }
    .chat-msg { padding: 8px 12px; border-radius: 8px; }
    .chat-msg:hover { background: rgba(255,255,255,0.03); }
    .chat-msg:hover .msg-actions { opacity: 1; }
    .chat-msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
    .chat-msg-name { font-size: 13px; font-weight: 500; color: #fff; }
    .chat-msg-time { font-size: 11px; color: rgba(255,255,255,0.2); }
    .chat-msg-content { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; }
    .msg-actions { display: flex; gap: 4px; opacity: 0; margin-top: 4px; }
    .msg-btn { background: rgba(255,255,255,0.06); border: none; border-radius: 5px; padding: 3px 8px; font-size: 11px; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; }
    .msg-btn.danger { color: #fb7185; }
    .channel-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
    .channel-item:last-child { border-bottom: none; }
    .channel-item:hover .row-actions { opacity: 1; }
    .info-note { background: rgba(251,191,36,0.05); border: 0.5px solid rgba(251,191,36,0.15); border-radius: 10px; padding: 12px 14px; font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; margin-top: 16px; }
    .pagos-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 24px; }
    .pagos-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; }
  `

  const activityLog = [
    { text: '<strong>Ana López</strong> se unió al plan Pace', time: 'Hace 12 minutos', icon: '👤', color: 'ki-green' },
    { text: '<strong>Roberto Suárez</strong> renovó su membresía Elite · RD$2,000', time: 'Hace 34 minutos', icon: '💳', color: 'ki-amber' },
    { text: '<strong>3 fotos nuevas</strong> esperan moderación en la galería', time: 'Hace 1 hora', icon: '📸', color: 'ki-red' },
    { text: '<strong>Miguel Rodríguez</strong> publicó un nuevo hilo en el foro', time: 'Hace 2 horas', icon: '💬', color: 'ki-blue' },
    { text: '<strong>Carlos Méndez</strong> canceló su membresía Pace', time: 'Hace 3 horas', icon: '✕', color: 'ki-red' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="admin-wrap">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <a href="/" className="topbar-logo-text">SRC</a>
            <span className="topbar-sep">/</span>
            <div className="topbar-title">Panel de Administración <span className="admin-badge">SUPER ADMIN</span></div>
          </div>
          <div className="topbar-right">
            <a href="/" target="_blank" className="topbar-btn">Ver sitio ↗</a>
            <div className="topbar-btn"><div className="notif-dot"></div>{stats.pendingContent || 5} pendientes</div>
            <div className="avatar-admin">{adminName}</div>
          </div>
        </div>

        <div className="app">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-label">Principal</div>
              <button className={`nav-item ${panel === 'overview' ? 'active' : ''}`} onClick={() => setPanel('overview')}>📊 Overview</button>
            </div>
            <div className="sidebar-section">
              <div className="sidebar-label">Gestión</div>
              <button className={`nav-item ${panel === 'miembros' ? 'active' : ''}`} onClick={() => setPanel('miembros')}>
                👥 Miembros <span className="nav-badge nb-green">{stats.totalMembers}</span>
              </button>
              <button className={`nav-item ${panel === 'pagos' ? 'active' : ''}`} onClick={() => setPanel('pagos')}>💳 Pagos y membresías</button>
              <button className={`nav-item ${panel === 'eventos' ? 'active' : ''}`} onClick={() => setPanel('eventos')}>📅 Eventos</button>
              <button className={`nav-item ${panel === 'admins' ? 'active' : ''}`} onClick={() => setPanel('admins')}>🏷️ Patrocinadores</button>
            </div>
            <div className="sidebar-section">
              <div className="sidebar-label">Comunidad</div>
              <button className={`nav-item ${panel === 'moderacion' ? 'active' : ''}`} onClick={() => setPanel('moderacion')}>
                🛡️ Moderación {stats.pendingContent > 0 && <span className="nav-badge nb-red">{stats.pendingContent}</span>}
              </button>
              <button className={`nav-item ${panel === 'chat' ? 'active' : ''}`} onClick={() => setPanel('chat')}>💬 Chat Comunidad</button>
              <button className={`nav-item ${panel === 'foro' ? 'active' : ''}`} onClick={() => setPanel('foro')}>📝 Foro y canales</button>
            </div>
            <div className="sidebar-section">
              <div className="sidebar-label">Vista Rápida</div>
              <button className={`nav-item ${panel === 'preview' ? 'active' : ''}`} onClick={() => setPanel('preview')}>👁️ Ver todas las páginas</button>
            </div>
            <div className="sidebar-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="avatar-admin" style={{ width: 32, height: 32, fontSize: 12 }}>{adminName}</div>
                <div><div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Super Admin</div><div style={{ fontSize: 11, color: '#fbbf24' }}>⭐ Acceso total</div></div>
              </div>
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', padding: '8px 0', marginTop: 12, display: 'block' }}>
                Cerrar sesión
              </button>
            </div>
          </aside>

          <main className="main">

            {/* OVERVIEW */}
            {panel === 'overview' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Overview</div><div className="page-sub">Resumen general · {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card"><div className="kpi-top"><div className="kpi-icon ki-green">👥</div><span className="kpi-trend trend-up">↑ +12</span></div><div className="kpi-value">{stats.activeMembers || 0}</div><div className="kpi-label">Miembros activos</div></div>
                  <div className="kpi-card"><div className="kpi-top"><div className="kpi-icon ki-amber">💳</div><span className="kpi-trend trend-up">↑ +8%</span></div><div className="kpi-value">RD$<span style={{ fontSize: 20 }}>487K</span></div><div className="kpi-label">Ingresos este mes</div></div>
                  <div className="kpi-card"><div className="kpi-top"><div className="kpi-icon ki-blue">📅</div><span className="kpi-trend trend-up">↑ 2 nuevos</span></div><div className="kpi-value">{events.length || 0}</div><div className="kpi-label">Eventos activos</div></div>
                  <div className="kpi-card"><div className="kpi-top"><div className="kpi-icon ki-red">🛡️</div><span className="kpi-trend trend-dn">{stats.pendingContent} pendientes</span></div><div className="kpi-value">{stats.pendingContent}</div><div className="kpi-label">Contenido por moderar</div></div>
                </div>
                <div className="table-wrap">
                  <div className="table-header"><div className="table-title">Actividad reciente</div></div>
                  <div style={{ padding: '4px 20px 8px' }}>
                    <div className="activity-feed">
                      {activityLog.map((item, i) => (
                        <div key={i} className="activity-item">
                          <div className={`act-icon ${item.color}`}>{item.icon}</div>
                          <div className="act-body">
                            <div className="act-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                            <div className="act-time">{item.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MIEMBROS */}
            {panel === 'miembros' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Miembros</div><div className="page-sub">{stats.totalMembers} total · {stats.activeMembers} activos</div></div>
                  <div className="page-actions">
                    <button className="btn-primary" onClick={() => { setIsNewMember(true); setEditingMember(null); setMemberForm({ full_name: '', email: '', phone: '', plan: 'pace', plan_status: 'active', level: 'bronce' }); setMemberMsg(''); setShowMemberModal(true) }}>+ Agregar miembro</button>
                  </div>
                </div>
                <div className="table-wrap">
                  <div className="table-header">
                    <div className="table-title">Todos los miembros</div>
                    <div className="table-actions">
                      <input className="search-input" placeholder="Buscar nombre o correo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                  <table>
                    <thead><tr><th>Miembro</th><th>Plan</th><th>Estado</th><th>Nivel</th><th>Strava</th><th>Registro</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {filteredMembers.map(m => (
                        <tr key={m.id}>
                          <td><div className="member-cell">
                            <div className="member-av" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>{m.full_name?.charAt(0)?.toUpperCase()}</div>
                            <div><div className="member-name">{m.full_name}</div><div className="member-email">{m.email}</div></div>
                          </div></td>
                          <td><span className={`plan-pill ${m.plan === 'elite' ? 'pp-elite' : 'pp-pace'}`}>{m.plan}</span></td>
                          <td><span className={`status-pill ${m.plan_status === 'active' ? 'sp-active' : m.plan_status === 'pending' ? 'sp-pending' : 'sp-suspended'}`}>● {m.plan_status}</span></td>
                          <td style={{ color: 'rgba(255,255,255,0.5)' }}>{m.level}</td>
                          <td>{m.strava_connected ? <span style={{ color: '#fc4c02', fontSize: 12, fontWeight: 600 }}>🟠 Conectado</span> : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>}</td>
                          <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(m.created_at).toLocaleDateString('es-DO')}</td>
                          <td><div className="row-actions">
                            <button className="row-btn" onClick={() => { setIsNewMember(false); setEditingMember(m); setMemberForm({ full_name: m.full_name || '', email: m.email || '', phone: m.phone || '', plan: m.plan, plan_status: m.plan_status, level: m.level }); setMemberMsg(''); setShowMemberModal(true) }}>Editar</button>
                            <button className="row-btn" onClick={() => openMemberActivities(m)}>🏃 Actividades</button>
                            {m.plan_status === 'pending' && <button className="row-btn success" onClick={() => updateMemberStatus(m.id, 'active')}>Aprobar</button>}
                            {m.plan_status === 'active' && <button className="row-btn danger" onClick={() => updateMemberStatus(m.id, 'suspended')}>Suspender</button>}
                            {m.plan_status === 'suspended' && <button className="row-btn success" onClick={() => updateMemberStatus(m.id, 'active')}>Reactivar</button>}
                          </div></td>
                        </tr>
                      ))}
                      {filteredMembers.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No hay miembros aún</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAGOS */}
            {panel === 'pagos' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Pagos y membresías</div><div className="page-sub">Gestión de cobros y suscripciones</div></div>
                </div>
                <div className="pagos-grid">
                  {[
                    { label: 'Ingresos del mes', value: 'RD$487,500', sub: '+8% vs mes anterior', color: '#4ade80' },
                    { label: 'Membresías activas', value: String(stats.activeMembers), sub: `${members.filter(m => m.plan === 'elite').length} Elite · ${members.filter(m => m.plan === 'pace').length} Pace`, color: '#22d3ee' },
                    { label: 'Pagos pendientes', value: String(members.filter(m => m.plan_status === 'pending').length), sub: 'Requieren verificación', color: '#fbbf24' },
                  ].map((card, i) => (
                    <div key={i} className="pagos-card">
                      <div style={{ fontSize: 28, fontWeight: 700, color: card.color, marginBottom: 6 }}>{card.value}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{card.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{card.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="table-wrap">
                  <div className="table-header"><div className="table-title">Estado de pagos por miembro</div></div>
                  <table>
                    <thead><tr><th>Miembro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td><div className="member-cell">
                            <div className="member-av" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>{m.full_name?.charAt(0)?.toUpperCase()}</div>
                            <div><div className="member-name">{m.full_name}</div><div className="member-email">{m.email}</div></div>
                          </div></td>
                          <td><span className={`plan-pill ${m.plan === 'elite' ? 'pp-elite' : 'pp-pace'}`}>{m.plan}</span></td>
                          <td><span className={`status-pill ${m.plan_status === 'active' ? 'sp-active' : m.plan_status === 'pending' ? 'sp-pending' : 'sp-suspended'}`}>● {m.plan_status}</span></td>
                          <td><div className="row-actions">
                            {m.plan_status === 'pending' && <button className="row-btn success" onClick={() => updateMemberStatus(m.id, 'active')}>Confirmar pago</button>}
                            {m.plan_status === 'active' && <button className="row-btn danger" onClick={() => updateMemberStatus(m.id, 'suspended')}>Suspender</button>}
                            {m.plan_status === 'suspended' && <button className="row-btn success" onClick={() => updateMemberStatus(m.id, 'active')}>Reactivar</button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="info-note">💡 Para pagos automáticos configura STRIPE_SECRET_KEY en el .env.local.</div>
              </div>
            )}

            {/* EVENTOS */}
            {panel === 'eventos' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Eventos</div><div className="page-sub">{events.length} eventos registrados</div></div>
                  <div className="page-actions"><button className="btn-primary" onClick={openNewEvent}>+ Nuevo evento</button></div>
                </div>
                <div className="table-wrap">
                  <div className="table-header"><div className="table-title">Todos los eventos</div></div>
                  <table>
                    <thead><tr><th>Evento</th><th>Tipo</th><th>Fecha</th><th>Ubicación</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {ev.image_url && <img src={ev.image_url} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                              <div>
                                <div className="member-name">{ev.title}</div>
                                {ev.distance && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{ev.distance}</div>}
                              </div>
                            </div>
                          </td>
                          <td><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 999, background: `${eventTypeColors[ev.type] || '#fff'}18`, color: eventTypeColors[ev.type] || '#fff' }}>{ev.type}{ev.elite_only ? ' · Elite' : ''}</span></td>
                          <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{ev.date ? new Date(ev.date).toLocaleDateString('es-DO') : '—'}</td>
                          <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{ev.location || '—'}</td>
                          <td><span className={`status-pill ${ev.status === 'active' ? 'sp-active' : 'sp-suspended'}`}>● {ev.status}</span></td>
                          <td><div className="row-actions">
                            <button className="row-btn" onClick={() => openEditEvent(ev)}>Editar</button>
                            <button className="row-btn danger" onClick={() => deleteEvent(ev.id)}>Eliminar</button>
                          </div></td>
                        </tr>
                      ))}
                      {events.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No hay eventos. Crea el primero.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MODERACIÓN */}
            {panel === 'moderacion' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Moderación de contenido</div><div className="page-sub">Fotos subidas por miembros que esperan aprobación</div></div>
                </div>
                {pendingPhotos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14, fontSize: 14 }}>
                    ✓ No hay contenido pendiente de moderación.<br/>
                    <span style={{ fontSize: 12, marginTop: 8, display: 'block' }}>Cuando los miembros suban fotos a la galería aparecerán aquí para aprobar o rechazar.</span>
                  </div>
                ) : (
                  <div className="mod-grid">
                    {pendingPhotos.map(photo => (
                      <div key={photo.id} className="mod-item">
                        <div className="mod-thumb">{photo.url ? <img src={photo.url} alt="" /> : <span style={{ fontSize: 24 }}>📸</span>}</div>
                        <div className="mod-info">
                          <div className="mod-type">📷 Foto · galería comunidad</div>
                          <div className="mod-text">{photo.caption || 'Sin descripción'}</div>
                          <div className="mod-meta">Por {photo.uploader?.full_name || 'Miembro'} · {new Date(photo.created_at).toLocaleDateString('es-DO')}</div>
                          <div className="mod-btns">
                            <button className="mod-approve" onClick={() => approvePhoto(photo.id)}>✓ Aprobar</button>
                            <button className="mod-reject" onClick={() => rejectPhoto(photo.id)}>✕ Rechazar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHAT COMUNIDAD */}
            {panel === 'chat' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Chat · Comunidad</div><div className="page-sub">{messages.length} mensajes · modera en tiempo real</div></div>
                </div>
                <div className="chat-wrap">
                  <div className="chat-header">
                    💬 Canal Comunidad
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{messages.length} mensajes</span>
                  </div>
                  <div className="chat-list">
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                        No hay mensajes todavía
                      </div>
                    )}
                    {messages.map(msg => (
                      <div key={msg.id} className="chat-msg">
                        <div className="chat-msg-header">
                          <span className="chat-msg-name">{msg.profile?.full_name || 'Miembro'}</span>
                          {msg.profile?.plan === 'elite' && <span style={{ fontSize: 10, color: '#22d3ee', fontWeight: 600 }}>Elite</span>}
                          <span className="chat-msg-time">{new Date(msg.created_at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} · {new Date(msg.created_at).toLocaleDateString('es-DO')}</span>
                          {msg.pinned && <span style={{ fontSize: 10, color: '#fbbf24' }}>📌</span>}
                        </div>
                        <div className="chat-msg-content">{msg.content}</div>
                        <div className="msg-actions">
                          <button className="msg-btn" onClick={() => pinMessage(msg.id, msg.pinned)}>{msg.pinned ? 'Desfijar' : '📌 Fijar'}</button>
                          <button className="msg-btn danger" onClick={() => deleteMessage(msg.id)}>✕ Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="info-note">💡 Los mensajes se actualizan al recargar. Para tiempo real configura Pusher en .env.local</div>
              </div>
            )}

            {/* FORO Y CANALES */}
            {panel === 'foro' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Foro y canales</div><div className="page-sub">{threads.length} hilos · {channels.length} canales</div></div>
                  <div className="page-actions">
                    <button className="btn-secondary" onClick={() => { setChannelForm({ name: '', emoji: '', elite_only: false }); setChannelMsg(''); setShowChannelModal(true) }}>+ Canal</button>
                  </div>
                </div>

                {/* CANALES */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Canales del chat</div>
                  <div className="table-wrap">
                    {channels.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No hay canales. Crea el primero.</div>
                    ) : (
                      channels.map(ch => (
                        <div key={ch.id} className="channel-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{ch.emoji || '#'}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{ch.name}</div>
                              {ch.elite_only && <div style={{ fontSize: 11, color: '#22d3ee' }}>Solo Elite</div>}
                            </div>
                          </div>
                          <div className="row-actions">
                            <button className="row-btn danger" onClick={() => deleteChannel(ch.id)}>Eliminar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* HILOS DEL FORO */}
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Hilos del foro</div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Hilo</th><th>Categoría</th><th>Autor</th><th>Fecha</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {threads.map(thread => (
                        <tr key={thread.id}>
                          <td>
                            <div className="member-name">{thread.pinned && '📌 '}{thread.title}</div>
                            {thread.content && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{thread.content.substring(0, 60)}...</div>}
                          </td>
                          <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{thread.category}</span></td>
                          <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{thread.profile?.full_name || '—'}</td>
                          <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{new Date(thread.created_at).toLocaleDateString('es-DO')}</td>
                          <td><div className="row-actions">
                            <button className="row-btn" onClick={() => pinThread(thread.id, thread.pinned)}>{thread.pinned ? 'Desfijar' : '📌 Fijar'}</button>
                            <button className="row-btn danger" onClick={() => deleteThread(thread.id)}>Eliminar</button>
                          </div></td>
                        </tr>
                      ))}
                      {threads.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No hay hilos en el foro todavía</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PATROCINADORES */}
            {panel === 'admins' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Patrocinadores</div><div className="page-sub">{sponsors.length} registrados</div></div>
                  <div className="page-actions"><button className="btn-primary" onClick={openNewSponsor}>+ Nuevo patrocinador</button></div>
                </div>
                <div className="sponsor-list">
                  {sponsors.map(sp => (
                    <div key={sp.id} className="sponsor-item">
                      <div className="sponsor-logo">{sp.logo_url ? <img src={sp.logo_url} alt={sp.name} /> : <span>🏷️</span>}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{sp.name}</span>
                          {sp.featured && <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '0.5px solid rgba(251,191,36,0.2)', borderRadius: 999, padding: '2px 8px' }}>⭐ Principal</span>}
                          {!sp.active && <span style={{ fontSize: 10, background: 'rgba(251,113,133,0.1)', color: '#fb7185', borderRadius: 999, padding: '2px 8px' }}>Inactivo</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{sp.category && `${sp.category} · `}{sp.discount_code && `Código: ${sp.discount_code} · `}{sp.website_url}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="row-btn" onClick={() => openEditSponsor(sp)}>Editar</button>
                        <button className="row-btn danger" onClick={async () => { await supabase.from('sponsors').update({ active: false }).eq('id', sp.id); loadData(); toast('✓ Desactivado') }}>Desactivar</button>
                      </div>
                    </div>
                  ))}
                  {sponsors.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>No hay patrocinadores. Agrega el primero.</div>}
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {panel === 'preview' && (
              <div>
                <div className="page-header"><div><div className="page-title">Ver sitio completo</div><div className="page-sub">Accede a cualquier página directamente</div></div></div>
                <div className="preview-grid">
                  {sitePages.map(page => (
                    <a key={page.href} href={page.href} target="_blank" rel="noreferrer" className="preview-card">
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 8 }}>{page.label}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: page.color === '#4ade80' ? 'rgba(74,222,128,0.1)' : 'rgba(34,211,238,0.1)', color: page.color }}>{page.badge}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Abrir ↗</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* MODAL EVENTO */}
      <div className={`modal-overlay ${showEventModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowEventModal(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>{editingEvent ? 'Editar evento' : 'Nuevo evento'}</h2>
            <button className="modal-close-btn" onClick={() => setShowEventModal(false)}>✕ Cerrar</button>
          </div>
          <label>Imagen del evento</label>
          <div className="upload-area" onClick={() => eventImageRef.current?.click()}>
            <div className="upload-preview">
              {eventImagePreview ? <img src={eventImagePreview} alt="Preview" /> : <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }}>📸</span>}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Haz clic para subir imagen</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>PNG, JPG · máx 5MB</div>
          </div>
          <input ref={eventImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEventImageChange} />
          <label>Título *</label>
          <input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Corrida grupal · Sábado" />
          <div className="form-grid-2">
            <div><label>Tipo</label>
              <select value={eventForm.type} onChange={e => setEventForm(p => ({ ...p, type: e.target.value }))}>
                <option value="corrida">Corrida grupal</option>
                <option value="carrera">Carrera oficial</option>
                <option value="track">Track day</option>
                <option value="social">Actividad social</option>
              </select>
            </div>
            <div><label>Fecha</label><input type="date" value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div><label>Ubicación</label><input value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} placeholder="Av. Circunvalación" /></div>
            <div><label>Distancia</label><input value={eventForm.distance} onChange={e => setEventForm(p => ({ ...p, distance: e.target.value }))} placeholder="5K, 10K, 21K..." /></div>
            <div><label>Capacidad máxima</label><input type="number" value={eventForm.max_capacity} onChange={e => setEventForm(p => ({ ...p, max_capacity: e.target.value }))} placeholder="50" /></div>
            <div><label>Estado</label>
              <select value={eventForm.status} onChange={e => setEventForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Activo</option>
                <option value="cancelled">Cancelado</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>
          <label>Descripción</label>
          <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción del evento..." rows={3} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="elite_only" checked={eventForm.elite_only} onChange={e => setEventForm(p => ({ ...p, elite_only: e.target.checked }))} style={{ width: 16, height: 16, margin: 0 }} />
            <label htmlFor="elite_only" style={{ marginBottom: 0, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Solo para miembros Elite</label>
          </div>
          <button className="modal-submit" onClick={saveEvent}>{editingEvent ? 'Guardar cambios →' : 'Crear evento →'}</button>
          {eventMsg && <div style={{ marginTop: 12, fontSize: 13, color: eventMsg.startsWith('Error') ? '#fb7185' : '#4ade80', textAlign: 'center' }}>{eventMsg}</div>}
        </div>
      </div>

      {/* MODAL CANAL */}
      <div className={`modal-overlay ${showChannelModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowChannelModal(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>Nuevo canal</h2>
            <button className="modal-close-btn" onClick={() => setShowChannelModal(false)}>✕ Cerrar</button>
          </div>
          <div className="form-grid-2">
            <div><label>Nombre *</label><input value={channelForm.name} onChange={e => setChannelForm(p => ({ ...p, name: e.target.value }))} placeholder="general, eventos..." /></div>
            <div><label>Emoji</label><input value={channelForm.emoji} onChange={e => setChannelForm(p => ({ ...p, emoji: e.target.value }))} placeholder="🏃" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="elite_ch" checked={channelForm.elite_only} onChange={e => setChannelForm(p => ({ ...p, elite_only: e.target.checked }))} style={{ width: 16, height: 16, margin: 0 }} />
            <label htmlFor="elite_ch" style={{ marginBottom: 0, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Solo para miembros Elite</label>
          </div>
          <button className="modal-submit" onClick={saveChannel}>Crear canal →</button>
          {channelMsg && <div style={{ marginTop: 12, fontSize: 13, color: channelMsg.startsWith('Error') ? '#fb7185' : '#4ade80', textAlign: 'center' }}>{channelMsg}</div>}
        </div>
      </div>

      {/* MODAL PATROCINADOR */}
      <div className={`modal-overlay ${showSponsorModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowSponsorModal(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>{editingSponsor ? 'Editar patrocinador' : 'Nuevo patrocinador'}</h2>
            <button className="modal-close-btn" onClick={() => setShowSponsorModal(false)}>✕ Cerrar</button>
          </div>
          <label>Logo</label>
          <div className="upload-area" onClick={() => logoInputRef.current?.click()}>
            <div className="logo-preview-sm">{sponsorLogoPreview ? <img src={sponsorLogoPreview} alt="Logo" /> : <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)' }}>🏷️</span>}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Haz clic para subir logo · PNG, JPG, SVG</div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          <div className="form-grid-2">
            <div><label>Nombre *</label><input value={sponsorForm.name} onChange={e => setSponsorForm(p => ({ ...p, name: e.target.value }))} placeholder="VNS" /></div>
            <div><label>Categoría</label><input value={sponsorForm.category} onChange={e => setSponsorForm(p => ({ ...p, category: e.target.value }))} placeholder="nutricion, ropa..." /></div>
            <div><label>Sitio web</label><input value={sponsorForm.website_url} onChange={e => setSponsorForm(p => ({ ...p, website_url: e.target.value }))} placeholder="https://vns.do" /></div>
            <div><label>Instagram</label><input value={sponsorForm.instagram} onChange={e => setSponsorForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@vnsrd" /></div>
            <div><label>WhatsApp</label><input value={sponsorForm.whatsapp} onChange={e => setSponsorForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="809-000-0000" /></div>
            <div><label>Código descuento</label><input value={sponsorForm.discount_code} onChange={e => setSponsorForm(p => ({ ...p, discount_code: e.target.value }))} placeholder="SRC10" /></div>
          </div>
          <label>Descripción del descuento</label>
          <input value={sponsorForm.discount_desc} onChange={e => setSponsorForm(p => ({ ...p, discount_desc: e.target.value }))} placeholder="10% off + envío gratis" />
          <label>Descripción</label>
          <textarea value={sponsorForm.description} onChange={e => setSponsorForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción..." rows={2} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="featured" checked={sponsorForm.featured} onChange={e => setSponsorForm(p => ({ ...p, featured: e.target.checked }))} style={{ width: 16, height: 16, margin: 0 }} />
            <label htmlFor="featured" style={{ marginBottom: 0, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Patrocinador principal</label>
          </div>
          <button className="modal-submit" onClick={saveSponsor}>{editingSponsor ? 'Guardar cambios →' : 'Crear patrocinador →'}</button>
          {sponsorMsg && <div style={{ marginTop: 12, fontSize: 13, color: '#4ade80', textAlign: 'center' }}>{sponsorMsg}</div>}
        </div>
      </div>

      {/* MODAL MIEMBRO */}
      <div className={`modal-overlay ${showMemberModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>{isNewMember ? 'Agregar miembro' : 'Editar miembro'}</h2>
            <button className="modal-close-btn" onClick={() => setShowMemberModal(false)}>✕ Cerrar</button>
          </div>
          <div className="form-grid-2">
            <div><label>Nombre completo *</label><input value={memberForm.full_name} onChange={e => setMemberForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Juan Pérez" /></div>
            <div><label>Teléfono</label><input value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} placeholder="809-000-0000" /></div>
          </div>
          {isNewMember && (
            <div><label>Correo electrónico *</label><input type="email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} placeholder="juan@correo.com" /></div>
          )}
          <label>Plan</label>
          <select value={memberForm.plan} onChange={e => setMemberForm(p => ({ ...p, plan: e.target.value }))}>
            <option value="pace">Pace · RD$1,500/mes</option>
            <option value="elite">Elite · RD$2,400/mes</option>
          </select>
          <label>Estado</label>
          <select value={memberForm.plan_status} onChange={e => setMemberForm(p => ({ ...p, plan_status: e.target.value }))}>
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="suspended">Suspendido</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <label>Nivel</label>
          <select value={memberForm.level} onChange={e => setMemberForm(p => ({ ...p, level: e.target.value }))}>
            <option value="bronce">🥉 Bronce</option>
            <option value="plata">🥈 Plata</option>
            <option value="oro">🥇 Oro</option>
          </select>
          <button className="modal-submit" onClick={saveMember}>{isNewMember ? 'Crear miembro →' : 'Guardar cambios →'}</button>
          {memberMsg && <div style={{ marginTop: 12, fontSize: 13, color: memberMsg.startsWith('Error') ? '#fb7185' : '#4ade80', textAlign: 'center' }}>{memberMsg}</div>}
        </div>
      </div>

      {/* MODAL ACTIVIDADES STRAVA */}
      <div className={`modal-overlay ${showActivitiesModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowActivitiesModal(false)}>
        <div className="modal" style={{ maxWidth: 640 }}>
          <div className="modal-head">
            <h2>Actividades · {activitiesMember?.full_name}</h2>
            <button className="modal-close-btn" onClick={() => setShowActivitiesModal(false)}>✕ Cerrar</button>
          </div>
          {activitiesMember?.strava_connected ? (
            <div style={{ fontSize: 12, color: '#fc4c02', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>🟠 Conectado a Strava</div>
          ) : (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Sin Strava conectado</div>
          )}
          {activitiesLoading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Cargando...</div>
          ) : memberActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Sin actividades registradas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
              {memberActivities.map(act => (
                <div key={act.id} style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${act.valid ? 'rgba(255,255,255,0.08)' : 'rgba(251,113,133,0.25)'}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{act.name || 'Corrida'} {!act.valid && <span style={{ color: '#fb7185', fontSize: 11, fontWeight: 600 }}>· INVÁLIDA</span>}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                      <span>{new Date(act.recorded_at).toLocaleDateString('es-DO')}</span>
                      <span>{act.distance_km} km</span>
                      {act.duration_minutes && <span>⏱ {Math.floor(act.duration_minutes/60)}h {act.duration_minutes%60}m</span>}
                      {act.pace_avg && <span>⚡ {act.pace_avg}/km</span>}
                      {act.avg_heartrate && <span>❤️ {Math.round(act.avg_heartrate)} bpm</span>}
                      {act.avg_cadence && <span>👟 {act.avg_cadence} spm</span>}
                      {act.elevation_gain && <span>⛰️ {Math.round(act.elevation_gain)}m</span>}
                      {act.strava_activity_id && <span style={{ color: '#fc4c02' }}>🟠 Strava</span>}
                    </div>
                  </div>
                  <button className={`row-btn ${act.valid ? 'danger' : 'success'}`} onClick={() => toggleActivityValid(act.id, act.valid)}>
                    {act.valid ? 'Invalidar' : 'Validar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </>
  )
}
