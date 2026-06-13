'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase.from('profiles').select('plan_status').eq('id', data.user.id).single()
    const { data: adminRole } = await supabase.from('admin_roles').select('role').eq('user_id', data.user.id).single()

    if (adminRole) { router.push('/admin'); return }
    if (profile?.plan_status === 'active') { router.push('/dashboard') }
    else { router.push('/membresia?reason=inactive') }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true)
    setResetMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { setResetMsg('Error: ' + error.message) }
    else { setResetMsg('✓ Te enviamos un correo con el enlace para restablecer tu contraseña.') }
    setResetLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px',
    padding: '0 14px', height: '46px', color: '#fff', fontSize: '14px',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: '400px', background: '#111', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px 36px' }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
            Santiago<em style={{ fontStyle: 'italic', fontWeight: 400 }}>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup>
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            {mode === 'login' ? 'Accede a tu cuenta' : 'Recuperar contraseña'}
          </div>
        </div>

        {/* LOGIN */}
        {mode === 'login' && (
          <>
            {error && (
              <div style={{ background: 'rgba(251,113,133,0.08)', border: '0.5px solid rgba(251,113,133,0.2)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#fb7185', marginBottom: '20px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '7px' }}>Correo electrónico</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '7px' }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, padding: '0 44px 0 14px' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'inherit' }}>
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

             ¿Olvidaste tu contraseña?
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button type="button" onClick={() => setMode('reset')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', height: '48px', background: loading ? 'rgba(255,255,255,0.3)' : '#fff', color: '#0a0a0a', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
                {loading ? 'Entrando...' : 'Entrar →'}
              </button>
            </form>

            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', paddingTop: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
                ¿No tienes cuenta?{' '}
                <a href="/membresia" style={{ color: '#4ade80', textDecoration: 'none' }}>Únete al club</a>
              </p>
              <a href="/" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>← Volver al inicio</a>
            </div>
          </>
        )}

        {/* RECUPERAR CONTRASEÑA */}
        {mode === 'reset' && (
          <>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '24px', textAlign: 'center' }}>
              Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            {resetMsg && (
              <div style={{ background: resetMsg.startsWith('Error') ? 'rgba(251,113,133,0.08)' : 'rgba(74,222,128,0.08)', border: `0.5px solid ${resetMsg.startsWith('Error') ? 'rgba(251,113,133,0.2)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: resetMsg.startsWith('Error') ? '#fb7185' : '#4ade80', marginBottom: '20px', textAlign: 'center', lineHeight: 1.5 }}>
                {resetMsg}
              </div>
            )}
            <form onSubmit={handleReset}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '7px' }}>Correo electrónico</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required style={inputStyle} />
              </div>
              <button type="submit" disabled={resetLoading} style={{ width: '100%', height: '48px', background: resetLoading ? 'rgba(255,255,255,0.3)' : '#fff', color: '#0a0a0a', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginBottom: '16px' }}>
                {resetLoading ? 'Enviando...' : 'Enviar enlace →'}
              </button>
            </form>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Volver al login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

