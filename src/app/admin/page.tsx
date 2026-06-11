'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Profile, Sponsor } from '@/lib/types'

type Panel = 'overview' | 'miembros' | 'pagos' | 'eventos' | 'moderacion' | 'estadisticas' | 'admins' | 'preview'

interface ActivityLog {
  text: string
  time: string
  icon: string
  color: string
}

export default function AdminPage() {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel>('overview')
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('SA')

  // Data
  const [members, setMembers] = useState<Profile[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([])
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, revenue: 0, events: 0, pendingContent: 0 })
  const [searchQuery, setSearchQuery] = useState('')

  // Sponsor form
  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [sponsorForm, setSponsorForm] = useState({ name: '', description: '', category: '', website_url: '', instagram: '', whatsapp: '', discount_code: '', discount_desc: '', featured: false, active: true })
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null)
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState<string>('')
  const [sponsorMsg, setSponsorMsg] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Profile | null>(null)
  const [memberForm, setMemberForm] = useState({ full_name: '', email: '', phone: '', plan: 'pace', plan_status: 'active', level: 'bronce' })
  const [memberMsg, setMemberMsg] = useState('')

  // Admin modal
  const [showAdminModal, setShowAdminModal] = useState(false)

  const activityLog: ActivityLog[] = [
    { text: '<strong>Ana López</strong> se unió al plan Pace', time: 'Hace 12 minutos', icon: '👤', color: 'ki-green' },
    { text: '<strong>Roberto Suárez</strong> renovó su membresía Elite · RD$2,000', time: 'Hace 34 minutos', icon: '💳', color: 'ki-amber' },
    { text: '<strong>3 fotos nuevas</strong> esperan moderación en la galería', time: 'Hace 1 hora', icon: '📸', color: 'ki-red' },
    { text: '<strong>Miguel Rodríguez</strong> publicó un nuevo hilo en el foro', time: 'Hace 2 horas', icon: '💬', color: 'ki-blue' },
    { text: '<strong>Carlos Méndez</strong> canceló su membresía Pace', time: 'Hace 3 horas', icon: '✕', color: 'ki-red' },
    { text: '<strong>Track Day · Jueves 12</strong> confirmado · 14 corredores Elite', time: 'Hace 5 horas', icon: '✓', color: 'ki-green' },
  ]

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
    if (panel === 'overview' || panel === 'miembros') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      const m = data || []
      setMembers(m)
      setStats(s => ({ ...s, totalMembers: m.length, activeMembers: m.filter(x => x.plan_status === 'active').length }))
    }
    if (panel === 'moderacion') {
      const { data } = await supabase.from('photos').select('*, uploader:profiles(full_name)').eq('approved', false).order('created_at', { ascending: false })
      setPendingPhotos(data || [])
      setStats(s => ({ ...s, pendingContent: (data || []).length }))
    }
    if (panel === 'admins' || panel === 'overview') {
      const { data: sp } = await supabase.from('sponsors').select('*').order('sort_order')
      setSponsors(sp || [])
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
      if (!error) { setSponsorMsg('✓ Patrocinador actualizado'); loadData(); setTimeout(() => setShowSponsorModal(false), 1000) }
    } else {
      const { error } = await supabase.from('sponsors').insert([payload])
      if (!error) { setSponsorMsg('✓ Patrocinador creado'); loadData(); setTimeout(() => setShowSponsorModal(false), 1000) }
    }
  }

  async function deleteSponsor(id: string) {
    if (!confirm('¿Desactivar este patrocinador?')) return
    await supabase.from('sponsors').update({ active: false }).eq('id', id)
    loadData()
    toast('✓ Patrocinador desactivado')
  }

  async function updateMemberStatus(id: string, plan_status: string) {
    await supabase.from('profiles').update({ plan_status }).eq('id', id)
    loadData()
    toast(`✓ Miembro ${plan_status === 'active' ? 'activado' : plan_status === 'suspended' ? 'suspendido' : 'actualizado'}`)
  }

  async function saveMember() {
    setMemberMsg('')
    if (editingMember) {
      const { error } = await supabase.from('profiles').update(memberForm).eq('id', editingMember.id)
      if (!error) { setMemberMsg('✓ Miembro actualizado'); loadData(); setTimeout(() => setShowMemberModal(false), 1000) }
    }
  }

  async function approvePhoto(id: string) {
    await supabase.from('photos').update({ approved: true }).eq('id', id)
    loadData()
    toast('✓ Foto aprobada y publicada')
  }

  async function rejectPhoto(id: string) {
    await supabase.from('photos').delete().eq('id', id)
    loadData()
    toast('✕ Foto rechazada y eliminada')
  }

  function openEditSponsor(sp: Sponsor) {
    setEditingSponsor(sp)
    setSponsorForm({ name: sp.name, description: sp.description || '', category: sp.category || '', website_url: sp.website_url || '', instagram: sp.instagram || '', whatsapp: sp.whatsapp || '', discount_code: sp.discount_code || '', discount_desc: sp.discount_desc || '', featured: sp.featured, active: sp.active })
    setSponsorLogoPreview(sp.logo_url || '')
    setSponsorLogoFile(null)
    setShowSponsorModal(true)
  }

  function openNewSponsor() {
    setEditingSponsor(null)
    setSponsorForm({ name: '', description: '', category: '', website_url: '', instagram: '', whatsapp: '', discount_code: '', discount_desc: '', featured: false, active: true })
    setSponsorLogoPreview('')
    setSponsorLogoFile(null)
    setSponsorMsg('')
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

  if (loading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
      Cargando panel...
    </div>
  )

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; }
    .admin-wrap { font-family: 'Inter', sans-serif; background: #080808; min-height: 100vh; color: #fff; display: flex; flex-direction: column; overflow: hidden; height: 100vh; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; border-bottom: 0.5px solid rgba(255,255,255,0.07); background: #0d0d0d; flex-shrink: 0; }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .topbar-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .topbar-logo-text { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); font-family: Inter, sans-serif; }
    .topbar-sep { color: rgba(255,255,255,0.15); font-size: 16px; }
    .topbar-title { font-size: 14px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 7px; }
    .admin-badge { font-size: 10px; background: rgba(251,191,36,0.15); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.3); border-radius: 999px; padding: 2px 10px; font-weight: 600; letter-spacing: .04em; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    .topbar-btn { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 7px 14px; font-size: 12px; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; transition: all .15s; text-decoration: none; }
    .topbar-btn:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.8); }
    .notif-dot { width: 7px; height: 7px; background: #fb7185; border-radius: 50%; }
    .avatar-admin { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #fbbf24, #f59e0b); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #0a0a0a; }
    .app { display: grid; grid-template-columns: 220px 1fr; flex: 1; overflow: hidden; }
    .sidebar { border-right: 0.5px solid rgba(255,255,255,0.07); background: #0d0d0d; display: flex; flex-direction: column; overflow-y: auto; }
    .sidebar-section { padding: 20px 12px 8px; }
    .sidebar-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.2); padding: 0 8px; margin-bottom: 6px; }
    .nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 8px; cursor: pointer; transition: all .15s; color: rgba(255,255,255,0.45); font-size: 13px; background: none; border: none; font-family: inherit; width: 100%; text-align: left; }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
    .nav-item.active { background: rgba(255,255,255,0.08); color: #fff; font-weight: 500; }
    .nav-item svg { width: 16px; height: 16px; stroke: currentColor; flex-shrink: 0; }
    .nav-badge { margin-left: auto; font-size: 10px; border-radius: 999px; padding: 2px 7px; font-weight: 600; }
    .nb-red { background: rgba(251,113,133,0.15); color: #fb7185; }
    .nb-amber { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .nb-green { background: rgba(74,222,128,0.15); color: #4ade80; }
    .sidebar-footer { margin-top: auto; padding: 16px 12px; border-top: 0.5px solid rgba(255,255,255,0.06); }
    .sidebar-user { display: flex; align-items: center; gap: 8px; }
    .sidebar-user-name { font-size: 13px; font-weight: 500; color: #fff; }
    .sidebar-user-role { font-size: 11px; color: #fbbf24; }
    .main { overflow-y: auto; padding: 28px 32px; }
    .main::-webkit-scrollbar { width: 4px; }
    .main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
    .page-title { font-size: 22px; font-weight: 600; letter-spacing: -.01em; margin-bottom: 4px; }
    .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); }
    .page-actions { display: flex; gap: 8px; }
    .btn-primary { display: flex; align-items: center; gap: 7px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; padding: 0 18px; height: 40px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: opacity .15s; }
    .btn-primary:hover { opacity: .88; }
    .btn-secondary { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 16px; height: 40px; font-size: 13px; color: rgba(255,255,255,0.6); font-family: inherit; cursor: pointer; transition: all .15s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; }
    .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .kpi-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
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
    .row-btn { background: rgba(255,255,255,0.06); border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; transition: all .15s; }
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
    .mod-info { flex: 1; min-width: 0; }
    .mod-type { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 4px; }
    .mod-text { font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 4px; line-height: 1.4; }
    .mod-meta { font-size: 11px; color: rgba(255,255,255,0.25); margin-bottom: 10px; }
    .mod-btns { display: flex; gap: 6px; }
    .mod-approve { background: rgba(74,222,128,0.1); border: 0.5px solid rgba(74,222,128,0.2); color: #4ade80; border-radius: 7px; padding: 5px 12px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .mod-approve:hover { background: rgba(74,222,128,0.2); }
    .mod-reject { background: rgba(251,113,133,0.08); border: 0.5px solid rgba(251,113,133,0.18); color: #fb7185; border-radius: 7px; padding: 5px 12px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .mod-reject:hover { background: rgba(251,113,133,0.15); }
    .sponsor-list { display: flex; flex-direction: column; gap: 10px; }
    .sponsor-item { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
    .sponsor-logo { width: 48px; height: 48px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; font-size: 18px; }
    .sponsor-logo img { width: 100%; height: 100%; object-fit: contain; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; align-items: center; justify-content: center; padding: 24px; overflow-y: auto; }
    .modal-overlay.open { display: flex; }
    .modal { background: #141414; border: 0.5px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 32px; width: 100%; max-width: 520px; margin: auto; }
    .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .modal h2 { font-size: 18px; font-weight: 600; }
    .modal-close-btn { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-family: inherit; font-size: 13px; display: flex; align-items: center; gap: 4px; }
    .modal label { display: block; font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
    .modal input, .modal select, .modal textarea { width: 100%; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 9px; padding: 0 12px; height: 42px; color: #fff; font-size: 14px; font-family: inherit; outline: none; margin-bottom: 14px; box-sizing: border-box; }
    .modal textarea { height: auto; padding: 10px 12px; resize: vertical; }
    .modal input:focus, .modal select:focus, .modal textarea:focus { border-color: rgba(255,255,255,0.25); }
    .modal-submit { width: 100%; height: 44px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .modal-submit:hover { opacity: .9; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .logo-upload-area { border: 1.5px dashed rgba(255,255,255,0.15); border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; transition: all .2s; margin-bottom: 14px; }
    .logo-upload-area:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.03); }
    .logo-preview { width: 80px; height: 80px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; overflow: hidden; }
    .logo-preview img { width: 100%; height: 100%; object-fit: contain; }
    .preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .preview-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; text-decoration: none; display: block; transition: border-color .2s; }
    .preview-card:hover { border-color: rgba(255,255,255,0.2); }
    .info-note { display: flex; align-items: flex-start; gap: 8px; background: rgba(251,191,36,0.05); border: 0.5px solid rgba(251,191,36,0.15); border-radius: 10px; padding: 12px 14px; font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; margin-top: 16px; }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="admin-wrap">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <a href="/" className="topbar-logo">
              <span className="topbar-logo-text">SRC</span>
            </a>
            <span className="topbar-sep">/</span>
            <div className="topbar-title">
              Panel de Administración
              <span className="admin-badge">SUPER ADMIN</span>
            </div>
          </div>
          <div className="topbar-right">
            <a href="/" target="_blank" className="topbar-btn">Ver sitio ↗</a>
            <div className="topbar-btn">
              <div className="notif-dot"></div>
              {stats.pendingContent || 5} pendientes
            </div>
            <div className="avatar-admin">{adminName}</div>
          </div>
        </div>

        <div className="app">

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-label">Principal</div>
              <button className={`nav-item ${panel === 'overview' ? 'active' : ''}`} onClick={() => setPanel('overview')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                Overview
              </button>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Gestión</div>
              <button className={`nav-item ${panel === 'miembros' ? 'active' : ''}`} onClick={() => setPanel('miembros')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                Miembros
                <span className="nav-badge nb-green">{stats.totalMembers}</span>
              </button>
              <button className={`nav-item ${panel === 'admins' ? 'active' : ''}`} onClick={() => setPanel('admins')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Patrocinadores
              </button>
              <button className={`nav-item ${panel === 'eventos' ? 'active' : ''}`} onClick={() => setPanel('eventos')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Eventos
              </button>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Moderación</div>
              <button className={`nav-item ${panel === 'moderacion' ? 'active' : ''}`} onClick={() => setPanel('moderacion')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Contenido
                {stats.pendingContent > 0 && <span className="nav-badge nb-red">{stats.pendingContent}</span>}
              </button>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Vista Rápida</div>
              <button className={`nav-item ${panel === 'preview' ? 'active' : ''}`} onClick={() => setPanel('preview')}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Ver todas las páginas
              </button>
            </div>

            <div className="sidebar-footer">
              <div className="sidebar-user">
                <div className="avatar-admin" style={{ width: 32, height: 32, fontSize: 12 }}>{adminName}</div>
                <div>
                  <div className="sidebar-user-name">Super Admin</div>
                  <div className="sidebar-user-role">⭐ Acceso total</div>
                </div>
              </div>
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', padding: '8px 0', marginTop: 12, display: 'block' }}>
                Cerrar sesión
              </button>
            </div>
          </aside>

          {/* MAIN */}
          <main className="main">

            {/* OVERVIEW */}
            {panel === 'overview' && (
              <div>
                <div className="page-header">
                  <div>
                    <div className="page-title">Overview</div>
                    <div className="page-sub">Resumen general del club · {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon ki-green"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div><span className="kpi-trend trend-up">↑ +12</span></div>
                    <div className="kpi-value">{stats.activeMembers || 340}</div><div className="kpi-label">Miembros activos</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon ki-amber"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div><span className="kpi-trend trend-up">↑ +8%</span></div>
                    <div className="kpi-value">RD$<span style={{ fontSize: 20 }}>487K</span></div><div className="kpi-label">Ingresos este mes</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon ki-blue"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><span className="kpi-trend trend-up">↑ 2 nuevos</span></div>
                    <div className="kpi-value">8</div><div className="kpi-label">Eventos este mes</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon ki-red"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><span className="kpi-trend trend-dn">{stats.pendingContent || 5} pendientes</span></div>
                    <div className="kpi-value">{stats.pendingContent || 5}</div><div className="kpi-label">Contenido por moderar</div>
                  </div>
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
                  <div><div className="page-title">Miembros</div><div className="page-sub">{stats.totalMembers} miembros · {stats.activeMembers} activos</div></div>
                  <div className="page-actions">
                    <button className="btn-secondary">📥 Exportar CSV</button>
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
                    <thead><tr><th>Miembro</th><th>Plan</th><th>Estado</th><th>Nivel</th><th>Registro</th><th>Acciones</th></tr></thead>
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
                          <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(m.created_at).toLocaleDateString('es-DO')}</td>
                          <td><div className="row-actions">
                            <button className="row-btn" onClick={() => { setEditingMember(m); setMemberForm({ full_name: m.full_name || '', email: m.email || '', phone: m.phone || '', plan: m.plan, plan_status: m.plan_status, level: m.level }); setShowMemberModal(true) }}>Editar</button>
                            {m.plan_status === 'pending' && <button className="row-btn success" onClick={() => updateMemberStatus(m.id, 'active')}>Aprobar</button>}
                            {m.plan_status === 'active' && <button className="row-btn danger" onClick={() => updateMemberStatus(m.id, 'suspended')}>Suspender</button>}
                            {m.plan_status === 'suspended' && <button className="row-btn success" onClick={() => updateMemberStatus(m.id, 'active')}>Reactivar</button>}
                          </div></td>
                        </tr>
                      ))}
                      {filteredMembers.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No hay miembros aún</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PATROCINADORES */}
            {panel === 'admins' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Patrocinadores</div><div className="page-sub">{sponsors.length} patrocinadores registrados</div></div>
                  <div className="page-actions">
                    <button className="btn-primary" onClick={openNewSponsor}>+ Nuevo patrocinador</button>
                  </div>
                </div>
                <div className="sponsor-list">
                  {sponsors.map(sp => (
                    <div key={sp.id} className="sponsor-item">
                      <div className="sponsor-logo">
                        {sp.logo_url ? <img src={sp.logo_url} alt={sp.name} /> : <span style={{ fontSize: 24 }}>🏷️</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{sp.name}</span>
                          {sp.featured && <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '0.5px solid rgba(251,191,36,0.2)', borderRadius: 999, padding: '2px 8px' }}>⭐ Principal</span>}
                          {!sp.active && <span style={{ fontSize: 10, background: 'rgba(251,113,133,0.1)', color: '#fb7185', borderRadius: 999, padding: '2px 8px' }}>Inactivo</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                          {sp.category && `${sp.category} · `}{sp.discount_code && `Código: ${sp.discount_code} · `}{sp.website_url}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="row-btn" onClick={() => openEditSponsor(sp)}>Editar</button>
                        <button className="row-btn danger" onClick={() => deleteSponsor(sp.id)}>Desactivar</button>
                      </div>
                    </div>
                  ))}
                  {sponsors.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                      No hay patrocinadores. Agrega el primero con el botón de arriba.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODERACIÓN */}
            {panel === 'moderacion' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Moderación de contenido</div><div className="page-sub">{pendingPhotos.length} fotos pendientes de revisión</div></div>
                </div>
                {pendingPhotos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                    ✓ No hay contenido pendiente de moderación
                  </div>
                ) : (
                  <div className="mod-grid">
                    {pendingPhotos.map(photo => (
                      <div key={photo.id} className="mod-item">
                        <div className="mod-thumb">
                          {photo.url ? <img src={photo.url} alt="" /> : <span style={{ fontSize: 24 }}>📸</span>}
                        </div>
                        <div className="mod-info">
                          <div className="mod-type">📷 Foto · comunidad</div>
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
                <div className="info-note" style={{ marginTop: 24 }}>
                  💡 Los hilos del foro reportados aparecerán aquí cuando los miembros los reporten. El chat en tiempo real requiere configurar Pusher.
                </div>
              </div>
            )}

            {/* EVENTOS */}
            {panel === 'eventos' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Gestión de eventos</div><div className="page-sub">Crea y gestiona los eventos del club</div></div>
                  <div className="page-actions">
                    <button className="btn-primary">+ Nuevo evento</button>
                  </div>
                </div>
                <div className="info-note">
                  💡 Los eventos se crean aquí y aparecen automáticamente en la página de Eventos de los miembros. Próximamente con inscripciones en tiempo real.
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {panel === 'preview' && (
              <div>
                <div className="page-header">
                  <div><div className="page-title">Ver sitio completo</div><div className="page-sub">Accede a cualquier página directamente</div></div>
                </div>
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

      {/* MODAL PATROCINADOR */}
      <div className={`modal-overlay ${showSponsorModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowSponsorModal(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>{editingSponsor ? 'Editar patrocinador' : 'Nuevo patrocinador'}</h2>
            <button className="modal-close-btn" onClick={() => setShowSponsorModal(false)}>✕ Cerrar</button>
          </div>

          {/* Logo upload */}
          <label>Logo del patrocinador</label>
          <div className="logo-upload-area" onClick={() => logoInputRef.current?.click()}>
            <div className="logo-preview">
              {sponsorLogoPreview ? <img src={sponsorLogoPreview} alt="Logo" /> : <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.2)' }}>🏷️</span>}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Haz clic para subir logo</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>PNG, JPG o SVG · máx 2MB</div>
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
          <textarea value={sponsorForm.description} onChange={e => setSponsorForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción del patrocinador..." rows={3} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="featured" checked={sponsorForm.featured} onChange={e => setSponsorForm(p => ({ ...p, featured: e.target.checked }))} style={{ width: 16, height: 16, margin: 0 }} />
            <label htmlFor="featured" style={{ marginBottom: 0, cursor: 'pointer' }}>Patrocinador principal (destacado)</label>
          </div>
          <button className="modal-submit" onClick={saveSponsor}>
            {editingSponsor ? 'Guardar cambios →' : 'Crear patrocinador →'}
          </button>
          {sponsorMsg && <div style={{ marginTop: 12, fontSize: 13, color: '#4ade80', textAlign: 'center' }}>{sponsorMsg}</div>}
        </div>
      </div>

      {/* MODAL EDITAR MIEMBRO */}
      <div className={`modal-overlay ${showMemberModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>Editar miembro</h2>
            <button className="modal-close-btn" onClick={() => setShowMemberModal(false)}>✕ Cerrar</button>
          </div>
          <div className="form-grid-2">
            <div><label>Nombre completo</label><input value={memberForm.full_name} onChange={e => setMemberForm(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div><label>Teléfono</label><input value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <label>Plan</label>
          <select value={memberForm.plan} onChange={e => setMemberForm(p => ({ ...p, plan: e.target.value }))}>
            <option value="pace">Pace</option>
            <option value="elite">Elite</option>
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
            <option value="bronce">Bronce</option>
            <option value="plata">Plata</option>
            <option value="oro">Oro</option>
          </select>
          <button className="modal-submit" onClick={saveMember}>Guardar cambios →</button>
          {memberMsg && <div style={{ marginTop: 12, fontSize: 13, color: '#4ade80', textAlign: 'center' }}>{memberMsg}</div>}
        </div>
      </div>

    </>
  )
}
