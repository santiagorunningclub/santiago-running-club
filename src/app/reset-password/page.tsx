'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase pone el token en el hash de la URL
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => setReady(true))
      }
    } else {
      setError('Enlace inválido o expirado.')
    }
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError('Error: ' + error.message); setLoading(false); return }
    setMsg('✓ Contraseña actualizada. Redirigiendo...')
    setTimeout(() => router.push('/login'), 2000)
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: '10px',
    padding: '0 14px', height: '46px', color: '#fff', fontSize: '14px',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: '16px'
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#111', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
            Santiago<em style={{ fontStyle: 'italic', fontWeight: 400 }}>Running</em>Club<sup style={{ fontSize: '9px', opacity: 0.5 }}>®</sup>
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Nueva contraseña</div>
        </div>

        {msg && <div style={{ background: 'rgba(74,222,128,0.08)', border: '0.5px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#4ade80', marginBottom: '20px', textAlign: 'center' }}>{msg}</div>}
        {error && <div style={{ background: 'rgba(251,113,133,0.08)', border: '0.5px solid rgba(251,113,133,0.2)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#fb7185', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

        {ready && !msg && (
          <form onSubmit={handleReset}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '7px' }}>Nueva contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required style={inputStyle} />
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '7px' }}>Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" required style={inputStyle} />
            <button type="submit" disabled={loading} style={{ width: '100%', height: '48px', background: loading ? 'rgba(255,255,255,0.3)' : '#fff', color: '#0a0a0a', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar nueva contraseña →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}