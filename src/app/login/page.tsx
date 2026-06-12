'use client'

export const dynamic = 'force-dynamic'

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

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    if (adminRole) {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#111', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
            Santiago<em style={{ fontStyle: 'italic', fontWeight: 400 }}>Running</em>Club
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Accede a tu cuenta</div>
        </div>

        {error && (
          <div style={{ background: 'rgba(251,113,133,0.08)', border: '0.5px solid rgba(251,113,133,0.2)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#fb7185', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '7px' }}>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '0 14px', height: '46px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '7px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '0 50px 0 14px', height: '46px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'inherit' }}>
                {showPass ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', height: '48px', background: loading ? 'rgba(255,255,255,0.3)' : '#fff', color: '#0a0a0a', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', paddingTop: '20px', textAlign: 'center' }}>
          <a href="/" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>← Volver al inicio</a>
        </div>
      </div>
    </div>
  )
}