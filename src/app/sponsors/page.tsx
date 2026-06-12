'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SponsorsPage() {
  const router = useRouter()
  const [sponsors, setSponsors] = useState<any[]>([])
  const [filter, setFilter] = useState('todos')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { loadSponsors() }, [])

  async function loadSponsors() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(profileData)
    const { data } = await supabase.from('sponsors').select('*').eq('active', true).order('featured', { ascending: false }).order('sort_order')
    setSponsors(data || [])
    setLoading(false)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    setToast(`Código "${code}" copiado ✓`)
    setTimeout(() => setToast(''), 2500)
  }

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SRC'

  const featured = sponsors.find(s => s.featured)
  const allSponsors = sponsors

  const filteredSponsors = allSponsors.filter(s => filter === 'todos' || s.category?.toLowerCase().includes(filter))

  const comingSoon = [
    { label: 'Nutrición', category: 'Suplementos · Geles · Nutrición deportiva' },
    { label: 'Tecnología', category: 'Relojes · GPS · Wearables' },
    { label: 'Salud', category: 'Fisioterapia · Medicina deportiva' },
    { label: 'Running gear', category: 'Calzado · Ropa técnica · Accesorios' },
  ]

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando patrocinadores...
    </div>
  )

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
    .nav-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #0a0a0a; text-decoration: none; }
    .hero { padding: 72px 48px 56px; border-bottom: 0.5px solid rgba(255,255,255,0.06); display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
    .hero h1 { font-size: 42px; font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 14px; }
    .hero h1 em { color: rgba(255,255,255,0.22); font-style: normal; }
    .hero p { font-size: 15px; color: rgba(255,255,255,0.36); line-height: 1.65; max-width: 420px; }
    .hero-stat-num { font-size: 48px; font-weight: 600; color: #fff; letter-spacing: -.03em; line-height: 1; text-align: right; }
    .hero-stat-label { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 6px; text-align: right; }
    .member-notice { margin: 32px 48px; background: rgba(74,222,128,0.06); border: 0.5px solid rgba(74,222,128,0.18); border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; }
    .member-notice p { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.55; }
    .member-notice strong { color: #4ade80; }
    .filters-wrap { padding: 0 48px 32px; display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 999px; color: rgba(255,255,255,0.45); font-size: 13px; font-family: inherit; padding: 7px 16px; cursor: pointer; }
    .filter-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
    .filter-btn.on { background: #fff; color: #0a0a0a; border-color: #fff; font-weight: 500; }
    .featured-wrap { padding: 0 48px 48px; }
    .section-label { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 16px; }
    .featured-sponsor { background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.18); border-radius: 20px; padding: 36px; display: grid; grid-template-columns: 200px 1fr auto; gap: 40px; align-items: center; position: relative; overflow: hidden; }
    .featured-sponsor::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #4ade80, #22d3ee); }
    .featured-sponsor:hover { border-color: rgba(255,255,255,0.28); }
    .sponsor-logo-box { background: #fff; border-radius: 14px; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100px; }
    .sponsor-logo-box img { max-width: 160px; max-height: 80px; object-fit: contain; display: block; }
    .sponsor-logo-text { font-size: 28px; font-weight: 700; color: #0a0a0a; letter-spacing: -.02em; }
    .sponsor-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; background: rgba(74,222,128,0.1); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.2); border-radius: 999px; padding: 4px 12px; margin-bottom: 14px; }
    .sponsor-name { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    .sponsor-category { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 12px; }
    .sponsor-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.65; max-width: 480px; margin-bottom: 20px; }
    .sponsor-benefit { display: flex; align-items: center; gap: 8px; font-size: 14px; color: rgba(255,255,255,0.6); }
    .sponsor-cta { display: flex; flex-direction: column; align-items: center; gap: 12px; min-width: 180px; }
    .code-box { background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 16px 20px; text-align: center; width: 100%; cursor: pointer; position: relative; }
    .code-box:hover { background: rgba(255,255,255,0.1); }
    .code-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 6px; }
    .code-value { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: .08em; font-family: monospace; }
    .code-hint { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 6px; }
    .sponsor-link { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 42px; background: #fff; color: #0a0a0a; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; }
    .sponsor-link:hover { opacity: .88; }
    .grid-wrap { padding: 0 48px 80px; }
    .sponsors-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .sponsor-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.09); border-radius: 18px; padding: 24px; }
    .sponsor-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); }
    .sponsor-card.coming-soon { opacity: .5; pointer-events: none; }
    .card-logo-box { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; display: flex; align-items: center; justify-content: center; height: 72px; margin-bottom: 18px; overflow: hidden; }
    .card-logo-box img { max-height: 44px; max-width: 100%; object-fit: contain; }
    .card-logo-text { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.8); }
    .card-name { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
    .card-category { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 12px; }
    .card-benefit { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 16px; display: flex; align-items: flex-start; gap: 7px; line-height: 1.45; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 0.5px solid rgba(255,255,255,0.06); gap: 10px; }
    .card-code { background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.7); font-family: monospace; letter-spacing: .06em; cursor: pointer; flex-shrink: 0; }
    .card-code:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .card-link { display: flex; align-items: center; gap: 5px; font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; }
    .card-link:hover { color: #fff; }
    .coming-label { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.2); text-align: center; padding: 12px; border: 0.5px dashed rgba(255,255,255,0.1); border-radius: 10px; }
    .cta-section { margin: 0 48px 80px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 48px; text-align: center; }
    .cta-section h2 { font-size: 26px; font-weight: 600; margin-bottom: 12px; }
    .cta-section p { font-size: 15px; color: rgba(255,255,255,0.38); line-height: 1.7; max-width: 440px; margin: 0 auto 28px; }
    .contact-btn { display: inline-flex; align-items: center; gap: 8px; background: #fff; color: #0a0a0a; border-radius: 12px; padding: 0 24px; height: 48px; font-size: 15px; font-weight: 600; text-decoration: none; }
    .contact-btn:hover { opacity: .88; }
    .toast-bar { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(20px); background: #fff; color: #0a0a0a; font-size: 13px; font-weight: 500; padding: 10px 20px; border-radius: 999px; opacity: 0; transition: all .3s; pointer-events: none; z-index: 300; white-space: nowrap; font-family: Inter, sans-serif; }
    .toast-bar.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    footer { border-top: 0.5px solid rgba(255,255,255,0.06); padding: 28px 48px; display: flex; align-items: center; justify-content: space-between; }
    .footer-logo { font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 500; }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a { font-size: 12px; color: rgba(255,255,255,0.22); text-decoration: none; }
    .no-sponsors { text-align: center; padding: 48px; color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; }
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
          <a href="/membresia">Membresía</a>
        </div>
        <a href="/profile" className="nav-avatar">{profile ? initials(profile.full_name) : 'SRC'}</a>
      </nav>

      <div className="hero">
        <div>
          <h1>Patrocinadores<br/><em>y descuentos</em></h1>
          <p>Beneficios exclusivos negociados por el club para todos los miembros. Copia el código y úsalo directamente en la tienda.</p>
        </div>
        <div>
          <div className="hero-stat-num">{sponsors.filter(s => s.active).length || 1}</div>
          <div className="hero-stat-label">patrocinador{sponsors.length !== 1 ? 'es' : ''} activo{sponsors.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="member-notice">
        <span style={{ fontSize: 20 }}>🛡️</span>
        <p>Estos descuentos son <strong>exclusivos para miembros activos</strong> del Santiago Running Club. Los códigos son personales — no los compartas fuera del club.</p>
      </div>

      <div className="filters-wrap">
        {['todos','nutricion','ropa','tecnologia','salud','local'].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'todos' ? 'Todos' : f === 'nutricion' ? 'Nutrición' : f === 'ropa' ? 'Ropa y accesorios' : f === 'tecnologia' ? 'Tecnología' : f === 'salud' ? 'Salud y bienestar' : 'Negocios locales'}
          </button>
        ))}
      </div>

      {/* PATROCINADOR PRINCIPAL */}
      {featured && (
        <div className="featured-wrap">
          <div className="section-label">Patrocinador principal</div>
          <div className="featured-sponsor">
            <div className="sponsor-logo-box" style={{ background: '#000' }}>
              {featured.logo_url
                ? <img src={featured.logo_url} alt={featured.name} />
                : <span className="sponsor-logo-text">{featured.name}</span>
              }
            </div>
            <div>
              <div className="sponsor-tag">⭐ Patrocinador principal</div>
              <div className="sponsor-name">{featured.name}</div>
              <div className="sponsor-category">{featured.category}</div>
              {featured.description && <div className="sponsor-desc">{featured.description}</div>}
              {featured.discount_desc && (
                <div className="sponsor-benefit">
                  <span style={{ color: '#4ade80' }}>✓</span>
                  {featured.discount_desc}
                </div>
              )}
            </div>
            <div className="sponsor-cta">
              {featured.discount_code && (
                <div className="code-box" onClick={() => copyCode(featured.discount_code)}>
                  <div className="code-label">Tu código</div>
                  <div className="code-value">{featured.discount_code}</div>
                  <div className="code-hint">Clic para copiar</div>
                </div>
              )}
              {featured.website_url && (
                <a href={featured.website_url} target="_blank" rel="noreferrer" className="sponsor-link">
                  Visitar sitio ↗
                </a>
              )}
              {featured.instagram && (
                <a href={`https://instagram.com/${featured.instagram.replace('@','')}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
                  {featured.instagram}
                </a>
              )}
              {featured.whatsapp && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>WhatsApp: {featured.whatsapp}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GRID */}
      <div className="grid-wrap">
        <div className="section-label">Todos los patrocinadores</div>
        <div className="sponsors-grid">
          {filteredSponsors.length === 0 && filter === 'todos' && (
            <div className="no-sponsors" style={{ gridColumn: 'span 3' }}>
              No hay patrocinadores registrados aún. Agrega el primero desde el panel admin.
            </div>
          )}
          {filteredSponsors.map(sp => (
            <div key={sp.id} className="sponsor-card">
              <div className="card-logo-box" style={sp.logo_url ? { background: '#000' } : {}}>
                {sp.logo_url
                  ? <img src={sp.logo_url} alt={sp.name} />
                  : <span className="card-logo-text">{sp.name}</span>
                }
              </div>
              <div className="card-name">{sp.name}</div>
              <div className="card-category">{sp.category}</div>
              {sp.discount_desc && (
                <div className="card-benefit"><span style={{ color: '#4ade80' }}>✓</span>{sp.discount_desc}</div>
              )}
              <div className="card-footer">
                {sp.discount_code && (
                  <span className="card-code" onClick={() => copyCode(sp.discount_code)}>{sp.discount_code}</span>
                )}
                {sp.website_url && (
                  <a href={sp.website_url} target="_blank" rel="noreferrer" className="card-link">
                    {sp.website_url.replace('https://','').replace('http://','').split('/')[0]} ↗
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* COMING SOON */}
          {comingSoon.map((cs, i) => (
            <div key={i} className="sponsor-card coming-soon">
              <div className="card-logo-box">
                <span className="card-logo-text">{cs.label}</span>
              </div>
              <div className="card-name">Próximamente</div>
              <div className="card-category">{cs.category}</div>
              <div className="coming-label">En negociación</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2>¿Quieres patrocinar el club?</h2>
        <p>Llega a más de 340 corredores activos en Santiago. Ofrece un descuento exclusivo y aparece en nuestra plataforma, eventos y comunicaciones.</p>
        <a href="mailto:hola@santiagorunningclub.com" className="contact-btn">
          ✉ Contáctanos para ser sponsor
        </a>
      </div>

      <footer>
        <span className="footer-logo">Santiago<em style={{ fontStyle: 'italic' }}>Running</em>Club® · Santiago, RD</span>
        <div className="footer-links">
          <a href="#">Términos</a><a href="#">Privacidad</a><a href="#">Contacto</a><a href="#">Instagram</a>
        </div>
      </footer>

      <div className={`toast-bar ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
