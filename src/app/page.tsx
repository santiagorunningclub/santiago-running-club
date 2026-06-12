import Link from 'next/link'

export default function LandingPage() {
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
    .nav-cta { font-size: 13px !important; font-weight: 500; color: #fff !important; background: rgba(255,255,255,0.08); border: 0.5px solid rgba(255,255,255,0.16); border-radius: 9px; padding: 8px 18px; }
    .nav-cta:hover { background: rgba(255,255,255,0.15) !important; }
    .hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 100px 24px 0; }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 6px 18px; font-size: 12px; color: rgba(255,255,255,0.48); margin-bottom: 36px; letter-spacing: 0.03em; }
    .badge-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; flex-shrink: 0; animation: pulse 2.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    h1 { font-size: 64px; font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; max-width: 640px; margin-bottom: 24px; font-family: Inter, sans-serif; }
    h1 em { color: rgba(255,255,255,0.22); font-style: normal; }
    .subtitle { font-size: 17px; color: rgba(255,255,255,0.38); line-height: 1.7; max-width: 420px; margin-bottom: 48px; }
    .cta-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 16px; }
    .cta-btn-primary { background: #fff; color: #0a0a0a; border: none; border-radius: 12px; height: 52px; padding: 0 28px; font-size: 16px; font-weight: 600; font-family: inherit; cursor: pointer; text-decoration: none; display: flex; align-items: center; }
    .cta-btn-primary:hover { opacity: .88; }
    .cta-hint { font-size: 13px; color: rgba(255,255,255,0.2); }
    .tease-grid { width: 100%; max-width: 900px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.06); margin-top: 72px; }
    .tease-cell { background: #0a0a0a; padding: 32px 28px 36px; }
    .tease-cell:hover { background: #111; }
    .tease-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.04); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 18px; }
    .tease-label { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65); margin-bottom: 8px; }
    .tease-desc { font-size: 13px; color: rgba(255,255,255,0.2); line-height: 1.6; filter: blur(3.5px); user-select: none; margin-bottom: 14px; }
    .lock-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.2); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 999px; padding: 3px 10px; }
    .proof { width: 100%; max-width: 900px; display: flex; align-items: center; justify-content: center; gap: 48px; padding: 40px 28px; border-top: 0.5px solid rgba(255,255,255,0.06); }
    .proof-item { text-align: center; }
    .proof-num { font-size: 28px; font-weight: 600; color: #fff; display: block; }
    .proof-label { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 4px; }
    .proof-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.08); }
    footer { border-top: 0.5px solid rgba(255,255,255,0.06); padding: 28px 48px; display: flex; align-items: center; justify-content: space-between; }
    .footer-logo { font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 500; }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a { font-size: 12px; color: rgba(255,255,255,0.22); text-decoration: none; }
    .footer-links a:hover { color: rgba(255,255,255,0.5); }
  `

  const features = [
    { icon: '🏃', label: 'Rutas exclusivas', desc: 'Santiago, Puerto Plata, Jarabacoa, Punta Cana y más destinos especiales de la isla', lock: 'Solo miembros' },
    { icon: '💧', label: 'Avituallamiento sábados', desc: 'Agua, geles y frutas en cada corrida grupal del sábado para todos los miembros', lock: 'Solo miembros' },
    { icon: '🏷️', label: 'Descuentos exclusivos', desc: 'VNS · tiendas locales · servicios de salud y nutrición deportiva', lock: 'Solo miembros' },
    { icon: '👥', label: 'Directorio de corredores', desc: 'Conecta con corredores de tu nivel, tu zona y tus objetivos en la comunidad', lock: 'Solo miembros' },
    { icon: '📅', label: 'Track day los jueves', desc: 'Sesiones de pista guiadas por el coach oficial · velocidad · intervalos · técnica', lock: 'Solo Elite' },
    { icon: '💬', label: 'Chat y foro', desc: 'Conversaciones en tiempo real, debates, consejos y soporte de la comunidad', lock: 'Solo miembros' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav>
        <a className="logo" href="/">
          <span className="logo-text">Santiago<em>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup></span>
        </a>
        <div className="nav-links">
          <a href="/events">Eventos</a>
          <a href="/directory">Directorio</a>
          <a href="/sponsors">Patrocinadores</a>
          <a href="/login">Iniciar sesión</a>
          <a href="/membresia" className="nav-cta">Unirse al club</a>
        </div>
      </nav>

      <section className="hero">
        <div className="badge"><span className="badge-dot"></span> Temporada 2025 · Santiago, República Dominicana</div>

        <h1>Corre más lejos.<br/><em>Junto a quienes</em><br/>lo entienden.</h1>
        <p className="subtitle">Una comunidad privada de corredores de Santiago. Rutas, retos, eventos exclusivos y todo lo que necesitas para correr mejor.</p>

        <div className="cta-wrap">
          <a href="/membresia" className="cta-btn-primary">Ver planes y unirme →</a>
          <span className="cta-hint">Desde RD$1,500/mes · Sin compromiso de permanencia</span>
        </div>

        <div className="tease-grid">
          {features.map((f, i) => (
            <div key={i} className="tease-cell">
              <div className="tease-icon">{f.icon}</div>
              <div className="tease-label">{f.label}</div>
              <div className="tease-desc">{f.desc}</div>
              <span className="lock-tag">🔒 {f.lock}</span>
            </div>
          ))}
        </div>

        <div className="proof">
          <div className="proof-item"><span className="proof-num">+340</span><div className="proof-label">Corredores activos</div></div>
          <div className="proof-divider" />
          <div className="proof-item"><span className="proof-num">62</span><div className="proof-label">Eventos realizados</div></div>
          <div className="proof-divider" />
          <div className="proof-item"><span className="proof-num">1</span><div className="proof-label">Patrocinadores</div></div>
          <div className="proof-divider" />
          <div className="proof-item"><span className="proof-num">2019</span><div className="proof-label">Año de fundación</div></div>
        </div>
      </section>

      <footer>
        <span className="footer-logo">Santiago<em style={{ fontStyle: 'italic' }}>Running</em>Club® · Santiago, RD</span>
        <div className="footer-links">
          <a href="#">Términos</a>
          <a href="#">Privacidad</a>
          <a href="#">Contacto</a>
          <a href="#">Instagram</a>
        </div>
      </footer>
    </>
  )
}
