'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GalleryPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'oficial' | 'comunidad'>('oficial')
  const [albums, setAlbums] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [lightbox, setLightbox] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadAlbum, setUploadAlbum] = useState('')
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadGallery() }, [])

  async function loadGallery() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(profileData)
    const { data: albumsData } = await supabase.from('albums').select('*, photos(count)').order('date', { ascending: false })
    setAlbums(albumsData || [])
    const { data: photosData } = await supabase.from('photos').select('*, uploader:profiles(full_name, instagram)').eq('approved', true).order('created_at', { ascending: false })
    setPhotos(photosData || [])
    setLoading(false)
  }

  async function handleUpload() {
    if (!uploadFile || !profile) return
    setUploading(true)
    setUploadMsg('')
    const fileExt = uploadFile.name.split('.').pop()
    const fileName = `photo-${Date.now()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from('photos').upload(fileName, uploadFile)
    if (uploadError) { setUploadMsg('Error al subir. Intenta de nuevo.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
    const { error } = await supabase.from('photos').insert([{ album_id: uploadAlbum || null, url: urlData.publicUrl, caption: uploadCaption, uploaded_by: profile.id, approved: false, likes: 0 }])
    if (!error) { setUploadMsg('✓ Foto enviada — te avisamos cuando esté publicada'); setUploading(false); loadGallery(); setTimeout(() => setShowUpload(false), 2000) }
    else { setUploadMsg('Error al guardar. Intenta de nuevo.'); setUploading(false) }
  }

  const officialPhotos = photos.filter(p => {
    const album = albums.find(a => a.id === p.album_id)
    return album?.is_official
  })

  const communityPhotos = photos.filter(p => {
    const album = albums.find(a => a.id === p.album_id)
    return !album?.is_official
  })

  const displayPhotos = tab === 'oficial' ? officialPhotos : communityPhotos
  const bgColors = ['#1a1a2e','#16213e','#0f3460','#1a2a1a','#2a1a1a','#1a2a2a','#2a2a1a','#251a35']

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando galería...
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
    .nav-active { color: rgba(255,255,255,0.85) !important; }
    .nav-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #0a0a0a; text-decoration: none; }
    .hero { padding: 64px 48px 48px; border-bottom: 0.5px solid rgba(255,255,255,0.06); display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
    .hero h1 { font-size: 42px; font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 12px; }
    .hero h1 em { color: rgba(255,255,255,0.22); font-style: normal; }
    .hero p { font-size: 15px; color: rgba(255,255,255,0.36); line-height: 1.65; max-width: 400px; }
    .upload-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border: 0.5px solid rgba(255,255,255,0.16); border-radius: 12px; padding: 0 20px; height: 46px; font-size: 14px; font-weight: 500; color: #fff; cursor: pointer; white-space: nowrap; font-family: inherit; }
    .upload-btn:hover { background: rgba(255,255,255,0.14); }
    .tabs-wrap { padding: 32px 48px 0; display: flex; gap: 4px; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
    .tab { padding: 10px 20px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.38); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -0.5px; display: flex; align-items: center; gap: 8px; }
    .tab:hover { color: rgba(255,255,255,0.7); }
    .tab.active { color: #fff; border-bottom-color: #fff; }
    .tab-count { font-size: 11px; background: rgba(255,255,255,0.08); border-radius: 999px; padding: 2px 8px; font-weight: 400; }
    .tab.active .tab-count { background: rgba(255,255,255,0.15); }
    .content { padding: 0 48px 80px; }
    .date-group { margin-top: 48px; }
    .date-group-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .date-group-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: .06em; display: flex; align-items: center; gap: 12px; }
    .date-group-title::after { content: ''; flex: 1; height: 0.5px; background: rgba(255,255,255,0.07); min-width: 40px; }
    .date-group-count { font-size: 12px; color: rgba(255,255,255,0.22); }
    .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .photo-grid.community { grid-template-columns: repeat(5, 1fr); }
    .photo-item { position: relative; border-radius: 10px; overflow: hidden; cursor: pointer; aspect-ratio: 1; }
    .photo-item:hover { transform: scale(1.02); z-index: 2; }
    .photo-item.wide { grid-column: span 2; aspect-ratio: 2/1; }
    .photo-official-badge { position: absolute; top: 8px; left: 8px; background: rgba(74,222,128,0.85); color: #0a0a0a; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; }
    .photo-likes { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.5); color: rgba(255,255,255,0.8); font-size: 11px; padding: 3px 8px; border-radius: 999px; display: flex; align-items: center; gap: 4px; }
    .photo-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%); opacity: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 12px; }
    .photo-item:hover .photo-overlay { opacity: 1; }
    .photo-caption { font-size: 12px; font-weight: 500; color: #fff; line-height: 1.35; }
    .photo-meta { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 3px; }
    .empty-state { text-align: center; padding: 60px; color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; margin-top: 32px; }
    .empty-state p { font-size: 15px; margin-bottom: 8px; }
    .empty-state span { font-size: 13px; }
    .pending-banner { display: flex; align-items: center; gap: 12px; background: rgba(251,191,36,0.06); border: 0.5px solid rgba(251,191,36,0.15); border-radius: 12px; padding: 14px 18px; margin-top: 32px; }
    .pending-banner p { font-size: 13px; color: rgba(255,255,255,0.5); }
    .pending-banner strong { color: #fbbf24; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; align-items: center; justify-content: center; padding: 24px; }
    .modal-overlay.open { display: flex; }
    .modal { background: #141414; border: 0.5px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 32px; width: 100%; max-width: 480px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .modal h2 { font-size: 18px; font-weight: 600; }
    .modal-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-family: inherit; font-size: 13px; }
    .modal label { display: block; font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
    .modal input, .modal select, .modal textarea { width: 100%; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.11); border-radius: 9px; padding: 0 12px; height: 40px; color: #fff; font-size: 13px; font-family: inherit; outline: none; margin-bottom: 14px; }
    .modal textarea { height: auto; padding: 10px 12px; resize: vertical; }
    .drop-zone { border: 1.5px dashed rgba(255,255,255,0.15); border-radius: 14px; padding: 40px 24px; text-align: center; cursor: pointer; margin-bottom: 20px; }
    .drop-zone:hover { border-color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.04); }
    .drop-title { font-size: 15px; font-weight: 500; margin-bottom: 6px; }
    .drop-sub { font-size: 13px; color: rgba(255,255,255,0.3); }
    .drop-limit { font-size: 12px; color: rgba(255,255,255,0.2); margin-top: 8px; }
    .pending-note { display: flex; align-items: flex-start; gap: 8px; background: rgba(251,191,36,0.06); border: 0.5px solid rgba(251,191,36,0.15); border-radius: 10px; padding: 10px 14px; font-size: 12px; color: rgba(251,191,36,0.7); line-height: 1.55; margin-bottom: 18px; }
    .modal-submit { width: 100%; height: 46px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 300; align-items: center; justify-content: center; }
    .lightbox.open { display: flex; }
    .lightbox-img { max-width: 80vw; max-height: 80vh; border-radius: 12px; overflow: hidden; }
    .lightbox-img img { width: 100%; height: 100%; object-fit: contain; }
    .lightbox-placeholder { max-width: 80vw; max-height: 80vh; width: 500px; height: 400px; border-radius: 12px; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; font-size: 48px; }
    .lightbox-close { position: absolute; top: 24px; right: 24px; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.6); font-size: 18px; }
    .lightbox-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
    .lightbox-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 32px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); }
    .lightbox-caption { font-size: 16px; font-weight: 500; margin-bottom: 4px; }
    .lightbox-meta { font-size: 13px; color: rgba(255,255,255,0.45); }
    footer { border-top: 0.5px solid rgba(255,255,255,0.06); padding: 28px 48px; display: flex; align-items: center; justify-content: space-between; }
    .footer-logo { font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 500; }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a { font-size: 12px; color: rgba(255,255,255,0.22); text-decoration: none; }
  `

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SRC'

  // Group photos by month
  const groupByMonth = (photoList: any[]) => {
    const groups: Record<string, any[]> = {}
    photoList.forEach(p => {
      const date = new Date(p.created_at)
      const key = date.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    })
    return groups
  }

  const photoGroups = groupByMonth(displayPhotos)

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
          <a href="/sponsors">Patrocinadores</a>
        </div>
        <a href="/profile" className="nav-avatar">{profile ? initials(profile.full_name) : 'SRC'}</a>
      </nav>

      <div className="hero">
        <div>
          <h1>Galería<br/><em>del club</em></h1>
          <p>Fotos oficiales del SRC y momentos compartidos por la comunidad. Cada corrida, cada logro, cada recuerdo.</p>
        </div>
        <button className="upload-btn" onClick={() => setShowUpload(true)}>
          ↑ Subir mis fotos
        </button>
      </div>

      <div className="tabs-wrap">
        <div className={`tab ${tab === 'oficial' ? 'active' : ''}`} onClick={() => setTab('oficial')}>
          🛡️ Fotos oficiales SRC
          <span className="tab-count">{officialPhotos.length || 48}</span>
        </div>
        <div className={`tab ${tab === 'comunidad' ? 'active' : ''}`} onClick={() => setTab('comunidad')}>
          👥 Fotos de la comunidad
          <span className="tab-count">{communityPhotos.length || 124}</span>
        </div>
      </div>

      <div className="content">
        {tab === 'comunidad' && (
          <div className="pending-banner">
            <span>⚠️</span>
            <p>Las fotos subidas por miembros son revisadas por el equipo SRC antes de publicarse. <strong>Tiempo de aprobación: 24–48 horas.</strong></p>
          </div>
        )}

        {Object.keys(photoGroups).length === 0 ? (
          <div className="empty-state">
            <p>📸 Aún no hay fotos en esta sección</p>
            <span>{tab === 'oficial' ? 'El equipo SRC publicará fotos de los eventos aquí.' : 'Sé el primero en compartir un momento del club.'}</span>
          </div>
        ) : (
          Object.entries(photoGroups).map(([month, monthPhotos]) => (
            <div key={month} className="date-group">
              <div className="date-group-header">
                <div className="date-group-title">{month}</div>
                <div className="date-group-count">{monthPhotos.length} fotos</div>
              </div>
              <div className={`photo-grid ${tab === 'comunidad' ? 'community' : ''}`}>
                {monthPhotos.map((photo, i) => (
                  <div key={photo.id} className={`photo-item ${i === 0 && tab === 'oficial' ? 'wide' : ''}`}
                    style={{ background: bgColors[i % bgColors.length] }}
                    onClick={() => setLightbox(photo)}>
                    {photo.url ? (
                      <img src={photo.url} alt={photo.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'rgba(255,255,255,0.1)' }}>📸</div>
                    )}
                    {tab === 'oficial' && <div className="photo-official-badge">Oficial SRC</div>}
                    <div className="photo-likes">❤️ {photo.likes || 0}</div>
                    <div className="photo-overlay">
                      <div className="photo-caption">{photo.caption || 'Sin descripción'}</div>
                      <div className="photo-meta">
                        {photo.uploader?.full_name && `Por ${photo.uploader.full_name}`}
                        {photo.uploader?.instagram && ` · @${photo.uploader.instagram}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* MOSTRAR FOTOS DUMMY SI NO HAY DATOS */}
        {Object.keys(photoGroups).length === 0 && tab === 'oficial' && (
          <div className="date-group">
            <div className="date-group-header">
              <div className="date-group-title">Junio 2025</div>
              <div className="date-group-count">Las fotos aparecerán aquí</div>
            </div>
            <div className="photo-grid">
              {['Corrida grupal · Sábado', 'Track Day · Jueves', 'Maratón Santiago 2025', 'Avituallamiento post-corrida'].map((caption, i) => (
                <div key={i} className={`photo-item ${i === 0 ? 'wide' : ''}`} style={{ background: bgColors[i] }}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.1)' }}>📸</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', textAlign: 'center', padding: '0 12px' }}>{caption}</span>
                  </div>
                  <div className="photo-official-badge">Oficial SRC</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer>
        <span className="footer-logo">Santiago<em style={{ fontStyle: 'italic' }}>Running</em>Club® · Santiago, RD</span>
        <div className="footer-links">
          <a href="#">Términos</a><a href="#">Privacidad</a><a href="#">Contacto</a><a href="#">Instagram</a>
        </div>
      </footer>

      {/* UPLOAD MODAL */}
      <div className={`modal-overlay ${showUpload ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
        <div className="modal">
          <div className="modal-header">
            <h2>Subir mis fotos</h2>
            <button className="modal-close" onClick={() => setShowUpload(false)}>✕ Cerrar</button>
          </div>
          <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
            {uploadFile ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                <div className="drop-title">{uploadFile.name}</div>
                <div className="drop-sub">Clic para cambiar</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
                <div className="drop-title">Arrastra tus fotos aquí</div>
                <div className="drop-sub">o haz clic para seleccionar archivos</div>
                <div className="drop-limit">JPG, PNG · máx 20MB por foto</div>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files?.[0] || null)} />
          </div>

          <label>Evento relacionado</label>
          <select value={uploadAlbum} onChange={e => setUploadAlbum(e.target.value)}>
            <option value="">Seleccionar evento...</option>
            {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>

          <label>Descripción (opcional)</label>
          <textarea placeholder="Cuéntanos sobre el momento..." rows={3} value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} />

          <div className="pending-note">
            ⚠️ Tu foto será revisada por el equipo SRC antes de aparecer en la galería. Recibirás una notificación en 24–48 horas.
          </div>

          <button className="modal-submit" onClick={handleUpload} disabled={!uploadFile || uploading}>
            {uploading ? 'Subiendo...' : 'Subir fotos →'}
          </button>
          {uploadMsg && <div style={{ marginTop: 12, fontSize: 13, color: uploadMsg.startsWith('Error') ? '#fb7185' : '#4ade80', textAlign: 'center' }}>{uploadMsg}</div>}
        </div>
      </div>

      {/* LIGHTBOX */}
      <div className={`lightbox ${lightbox ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setLightbox(null)}>
        {lightbox && (
          <>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            {lightbox.url ? (
              <div className="lightbox-img"><img src={lightbox.url} alt={lightbox.caption || ''} /></div>
            ) : (
              <div className="lightbox-placeholder">📸</div>
            )}
            <div className="lightbox-info">
              <div className="lightbox-caption">{lightbox.caption || 'Sin descripción'}</div>
              <div className="lightbox-meta">
                {lightbox.uploader?.full_name && `Por ${lightbox.uploader.full_name}`}
                {' · '}{new Date(lightbox.created_at).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
