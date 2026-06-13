'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Step = 1 | 2 | 3
type Plan = 'pace' | 'elite'

export default function MembresiasPage() {
  const [step, setStep] = useState<Step>(1)
  const [plan, setPlan] = useState<Plan>('pace')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    cedula: '', birthdate: '', gender: '', sector: '',
    emergency_contact: '', shirt_size: '', runner_level: '',
    distance_preference: '', instagram: ''
  })

  async function handleRegister() {
    setLoading(true)
    setMsg('')

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) { setMsg('Error: ' + error.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').insert([{
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        cedula: form.cedula,
        birthdate: form.birthdate || null,
        gender: form.gender,
        sector: form.sector,
        emergency_contact: form.emergency_contact,
        shirt_size: form.shirt_size,
        runner_level: form.runner_level,
        distance_preference: form.distance_preference,
        instagram: form.instagram,
        plan,
        plan_status: 'pending',
        level: 'bronce',
        weekly_km: 0,
        total_km: 0,
        points: 0,
        show_in_directory: true,
      }])

      // Enviar email de bienvenida
      await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.full_name, email: form.email, plan })
      })

      setStep(3)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    padding: '0 14px', height: '46px', color: '#fff', fontSize: '14px',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: '14px'
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle, background: '#1a1a1a', cursor: 'pointer'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px'
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0a0a0a', minHeight: '100vh', color: '#fff', padding: '40px 24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
              Santiago<em style={{ fontStyle: 'italic', fontWeight: 400 }}>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup>
            </div>
          </a>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Únete al club de running de Santiago</div>
        </div>

        {/* STEPS */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '36px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, background: step >= s ? '#fff' : 'rgba(255,255,255,0.08)', color: step >= s ? '#0a0a0a' : 'rgba(255,255,255,0.3)' }}>{s}</div>
                <span style={{ fontSize: '12px', color: step >= s ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>{s === 1 ? 'Elige tu plan' : 'Tus datos'}</span>
                {s < 2 && <div style={{ width: 32, height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — PLANES */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '6px', textAlign: 'center' }}>Elige tu plan</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: '28px' }}>Ambos planes incluyen acceso completo al club</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              {/* PACE */}
              <div onClick={() => setPlan('pace')} style={{ background: plan === 'pace' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${plan === 'pace' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.09)'}`, borderRadius: '16px', padding: '24px', cursor: 'pointer', position: 'relative' }}>
                {plan === 'pace' && <div style={{ position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#0a0a0a' }}>✓</div>}
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Pace</div>
                <div style={{ fontSize: '26px', fontWeight: 700, marginBottom: '4px' }}>RD$1,500<span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mes</span></div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>RD$1,250/mes anual</div>
                {['Corridas grupales', 'Dashboard personal', 'Galería y chat', 'Directorio del club', 'Patrocinadores'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '6px' }}>
                    <span style={{ color: '#4ade80' }}>✓</span>{f}
                  </div>
                ))}
              </div>

              {/* ELITE */}
              <div onClick={() => setPlan('elite')} style={{ background: plan === 'elite' ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${plan === 'elite' ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.09)'}`, borderRadius: '16px', padding: '24px', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#22d3ee', color: '#0a0a0a', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '999px' }}>POPULAR</div>
                {plan === 'elite' && <div style={{ position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: '50%', background: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#0a0a0a' }}>✓</div>}
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: '#22d3ee' }}>Elite</div>
                <div style={{ fontSize: '26px', fontWeight: 700, marginBottom: '4px' }}>RD$2,400<span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mes</span></div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>RD$2,000/mes anual</div>
                {['Todo lo del plan Pace', 'Track days exclusivos', 'Canal Elite privado', 'Análisis avanzado', 'Retos exclusivos', 'Prioridad en eventos'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '6px' }}>
                    <span style={{ color: '#22d3ee' }}>✓</span>{f}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} style={{ width: '100%', height: '50px', background: plan === 'elite' ? '#22d3ee' : '#fff', color: '#0a0a0a', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Continuar con plan {plan.charAt(0).toUpperCase() + plan.slice(1)} →
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              ¿Ya tienes cuenta?{' '}
              <a href="/login" style={{ color: '#4ade80', textDecoration: 'none' }}>Inicia sesión</a>
            </div>
          </div>
        )}

        {/* STEP 2 — DATOS */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '6px', textAlign: 'center' }}>Tus datos</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: '28px' }}>
              Plan <strong style={{ color: plan === 'elite' ? '#22d3ee' : '#fff' }}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</strong> · RD${plan === 'elite' ? '2,400' : '1,500'}/mes
            </div>

            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '14px' }}>Datos personales</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Juan Pérez" />
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="juan@correo.com" />
              </div>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="809-000-0000" />
              </div>
              <div>
                <label style={labelStyle}>Cédula / Pasaporte</label>
                <input style={inputStyle} value={form.cedula} onChange={e => setForm(p => ({ ...p, cedula: e.target.value }))} placeholder="000-0000000-0" />
              </div>
              <div>
                <label style={labelStyle}>Fecha de nacimiento</label>
                <input style={inputStyle} type="date" value={form.birthdate} onChange={e => setForm(p => ({ ...p, birthdate: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Género</label>
                <select style={selectStyle} value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sector / Barrio</label>
                <input style={inputStyle} value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} placeholder="Los Jardines, Centro..." />
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: '14px', marginTop: '8px' }}>Perfil de corredor</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Nivel</label>
                <select style={selectStyle} value={form.runner_level} onChange={e => setForm(p => ({ ...p, runner_level: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="competidor">Competidor</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Distancia preferida</label>
                <select style={selectStyle} value={form.distance_preference} onChange={e => setForm(p => ({ ...p, distance_preference: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option value="5K">5K</option>
                  <option value="10K">10K</option>
                  <option value="21K">21K · Media maratón</option>
                  <option value="42K">42K · Maratón completo</option>
                  <option value="ultra">Ultra maratón</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Talla de camiseta</label>
                <select style={selectStyle} value={form.shirt_size} onChange={e => setForm(p => ({ ...p, shirt_size: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Instagram (opcional)</label>
                <input style={inputStyle} value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@tuusuario" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Contacto de emergencia</label>
                <input style={inputStyle} value={form.emergency_contact} onChange={e => setForm(p => ({ ...p, emergency_contact: e.target.value }))} placeholder="Nombre · 809-000-0000" />
              </div>
            </div>

            {msg && (
              <div style={{ background: 'rgba(251,113,133,0.08)', border: '0.5px solid rgba(251,113,133,0.2)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#fb7185', marginBottom: '16px', textAlign: 'center' }}>
                {msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setStep(1)} style={{ flex: '0 0 auto', height: '50px', padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Volver
              </button>
              <button onClick={handleRegister} disabled={loading || !form.full_name || !form.email || !form.password}
                style={{ flex: 1, height: '50px', background: !form.full_name || !form.email || !form.password ? 'rgba(255,255,255,0.2)' : plan === 'elite' ? '#22d3ee' : '#fff', color: '#0a0a0a', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Creando cuenta...' : 'Unirme al club →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — CONFIRMACIÓN */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
            <div style={{ fontSize: '22px', fontWeight: 600, marginBottom: '12px' }}>¡Bienvenido al club!</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '12px', maxWidth: '360px', margin: '0 auto 12px' }}>
              Tu solicitud fue enviada. Un administrador revisará tu registro y activará tu membresía en las próximas 24 horas.
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>
              📧 Te enviamos un correo de bienvenida a <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{form.email}</strong>
            </div>
            <a href="/login" style={{ display: 'inline-block', background: '#fff', color: '#0a0a0a', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Ir al login →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
