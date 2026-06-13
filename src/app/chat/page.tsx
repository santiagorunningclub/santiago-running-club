'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [threads, setThreads] = useState<any[]>([])
  const [mode, setMode] = useState<'chat' | 'foro'>('chat')
  const [foroFilter, setForoFilter] = useState('todos')
  const [inputText, setInputText] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [communityChannel, setCommunityChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNewThread, setShowNewThread] = useState(false)
  const [threadForm, setThreadForm] = useState({ title: '', content: '', category: 'pregunta' })
  const [threadMsg, setThreadMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadChat() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!communityChannel) return
    const subscription = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${communityChannel.id}`
      }, async (payload: any) => {
        const { data: newMsg } = await supabase
          .from('messages')
          .select('*, profile:profiles(full_name, plan, level)')
          .eq('id', payload.new.id)
          .single()
        if (newMsg) setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(subscription) }
  }, [communityChannel])

  async function loadChat() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(profileData)

    let { data: channel } = await supabase.from('channels').select('*').ilike('name', 'comunidad').single()
    if (!channel) {
      const { data: newChannel } = await supabase.from('channels').insert([{ name: 'comunidad', emoji: '💬', elite_only: false }]).select().single()
      channel = newChannel
    }
    setCommunityChannel(channel)

    if (channel) {
      const { data } = await supabase.from('messages').select('*, profile:profiles(full_name, plan, level)').eq('channel_id', channel.id).eq('deleted', false).order('created_at', { ascending: true }).limit(100)
      setMessages(data || [])
    }

    loadThreads()
    setLoading(false)
  }

  async function loadThreads() {
    const { data } = await supabase.from('threads').select('*, profile:profiles(full_name)').eq('deleted', false).order('pinned', { ascending: false }).order('created_at', { ascending: false })
    setThreads(data || [])
  }

  async function sendMessage() {
    if (!inputText.trim() || !communityChannel || !profile) return
    const content = inputText.trim()
    setInputText('')
    await supabase.from('messages').insert([{ channel_id: communityChannel.id, user_id: profile.id, content }])
  }

  async function submitThread() {
    if (!threadForm.title.trim() || !profile) return
    const { error } = await supabase.from('threads').insert([{ title: threadForm.title, content: threadForm.content, category: threadForm.category, user_id: profile.id }])
    if (!error) { setThreadMsg('✓ Hilo publicado'); loadThreads(); setTimeout(() => { setShowNewThread(false); setThreadMsg('') }, 1000) }
  }

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SRC'
  const avatarColors = ['rgba(74,222,128,0.15)', 'rgba(34,211,238,0.15)', 'rgba(251,191,36,0.15)', 'rgba(129,140,248,0.15)', 'rgba(251,113,133,0.15)']
  const avatarTextColors = ['#4ade80', '#22d3ee', '#fbbf24', '#818cf8', '#fb7185']
  const colorIndex = (str: string) => str ? str.charCodeAt(0) % 5 : 0

  const filteredThreads = threads.filter(t => {
    if (foroFilter === 'todos') return true
    if (foroFilter === 'preguntas') return t.category === 'pregunta'
    if (foroFilter === 'tips') return t.category === 'tip'
    if (foroFilter === 'anuncios') return t.category === 'anuncio'
    if (foroFilter === 'social') return t.category === 'social'
    return true
  })

  const tagClass: Record<string, string> = { pregunta: 'tag-pregunta', tip: 'tag-tip', anuncio: 'tag-anuncio', social: 'tag-social' }
  const tagLabel: Record<string, string> = { pregunta: 'Pregunta', tip: 'Tip', anuncio: 'Anuncio', social: 'Social' }

  if (loading) return (
    <div style={{ background: '#0a0a0a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      Cargando chat...
    </div>
  )

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #fff; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 0.5px solid rgba(255,255,255,0.07); background: rgba(10,10,10,0.95); flex-shrink: 0; z-index: 100; }
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-text { font-size: 14px; font-weight: 600; color: #fff; letter-spacing: 0.02em; font-family: Inter, sans-serif; }
    .logo-text em { font-style: italic; font-weight: 400; }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a { font-size: 13px; color: rgba(255,255,255,0.42); text-decoration: none; }
    .nav-links a:hover { color: rgba(255,255,255,0.8); }
    .nav-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22d3ee); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #0a0a0a; text-decoration: none; flex-shrink: 0; }
    .app { display: grid; grid-template-columns: 200px 1fr; flex: 1; overflow: hidden; }
    .sidebar { border-right: 0.5px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; overflow: hidden; padding: 16px 10px; gap: 4px; }
    .sidebar-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.2); padding: 8px 10px 4px; }
    .mode-btn { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 8px; cursor: pointer; color: rgba(255,255,255,0.45); font-size: 13px; background: none; border: none; font-family: inherit; width: 100%; text-align: left; }
    .mode-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
    .mode-btn.active { background: rgba(255,255,255,0.08); color: #fff; font-weight: 500; }
    .sidebar-footer { margin-top: auto; padding: 12px 10px; border-top: 0.5px solid rgba(255,255,255,0.06); }
    .online-count { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.3); }
    .online-dot { width: 7px; height: 7px; background: #4ade80; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .content { display: flex; flex-direction: column; overflow: hidden; }
    .chat-header { padding: 14px 24px; border-bottom: 0.5px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .chat-header-left { display: flex; align-items: center; gap: 10px; }
    .chat-header-name { font-size: 15px; font-weight: 600; }
    .chat-header-sub { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 1px; }
    .realtime-badge { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #4ade80; background: rgba(74,222,128,0.08); border: 0.5px solid rgba(74,222,128,0.2); border-radius: 999px; padding: 3px 10px; }
    .messages { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 2px; }
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    .date-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0 8px; }
    .date-divider span { font-size: 11px; color: rgba(255,255,255,0.2); white-space: nowrap; }
    .date-divider::before, .date-divider::after { content: ''; flex: 1; height: 0.5px; background: rgba(255,255,255,0.07); }
    .msg { display: flex; gap: 10px; padding: 4px 8px; border-radius: 8px; }
    .msg:hover { background: rgba(255,255,255,0.02); }
    .msg-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; margin-top: 2px; }
    .msg-body { flex: 1; min-width: 0; }
    .msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
    .msg-name { font-size: 13px; font-weight: 600; }
    .msg-time { font-size: 11px; color: rgba(255,255,255,0.2); }
    .msg-plan { font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 999px; }
    .plan-pace { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); }
    .plan-elite { background: rgba(34,211,238,0.12); color: #22d3ee; }
    .msg-text { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.55; }
    .msg.me .msg-name { color: #4ade80; }
    .chat-input-wrap { padding: 16px 24px; border-top: 0.5px solid rgba(255,255,255,0.07); flex-shrink: 0; }
    .chat-input-box { display: flex; align-items: flex-end; gap: 10px; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 10px 14px; }
    .chat-input-box:focus-within { border-color: rgba(255,255,255,0.25); }
    .chat-input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 14px; font-family: inherit; resize: none; max-height: 120px; line-height: 1.5; }
    .chat-input::placeholder { color: rgba(255,255,255,0.2); }
    .send-btn { background: #fff; border: none; border-radius: 9px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; font-size: 14px; }
    .send-btn:hover { opacity: .88; }
    .foro-header { padding: 14px 24px; border-bottom: 0.5px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .foro-header-left h2 { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
    .foro-header-left p { font-size: 12px; color: rgba(255,255,255,0.3); }
    .new-thread-btn { display: flex; align-items: center; gap: 7px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .foro-filters { padding: 12px 24px; border-bottom: 0.5px solid rgba(255,255,255,0.06); display: flex; gap: 6px; flex-wrap: wrap; }
    .foro-filter { background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 999px; color: rgba(255,255,255,0.4); font-size: 12px; font-family: inherit; padding: 5px 14px; cursor: pointer; }
    .foro-filter.on { background: #fff; color: #0a0a0a; border-color: #fff; font-weight: 500; }
    .threads-list { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; }
    .threads-list::-webkit-scrollbar { width: 4px; }
    .threads-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    .thread-item { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; cursor: pointer; }
    .thread-item:hover { border-color: rgba(255,255,255,0.16); background: rgba(255,255,255,0.05); }
    .thread-item.pinned { border-color: rgba(251,191,36,0.2); background: rgba(251,191,36,0.03); }
    .thread-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
    .thread-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
    .thread-main { flex: 1; }
    .thread-tags { display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
    .thread-tag { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: 2px 9px; border-radius: 999px; }
    .tag-pregunta { background: rgba(129,140,248,0.12); color: #818cf8; border: 0.5px solid rgba(129,140,248,0.2); }
    .tag-anuncio { background: rgba(251,191,36,0.12); color: #fbbf24; border: 0.5px solid rgba(251,191,36,0.2); }
    .tag-tip { background: rgba(74,222,128,0.1); color: #4ade80; border: 0.5px solid rgba(74,222,128,0.2); }
    .tag-social { background: rgba(251,113,133,0.1); color: #fb7185; border: 0.5px solid rgba(251,113,133,0.2); }
    .tag-pin { background: rgba(251,191,36,0.1); color: #fbbf24; font-size: 11px; }
    .thread-title { font-size: 15px; font-weight: 500; margin-bottom: 5px; line-height: 1.3; }
    .thread-preview { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .thread-footer { display: flex; align-items: center; gap: 16px; }
    .thread-stat { display: flex; align-items: center; gap: 5px; font-size: 12px; color: rgba(255,255,255,0.28); }
    .thread-author { font-size: 12px; color: rgba(255,255,255,0.28); margin-left: auto; }
    .thread-author strong { color: rgba(255,255,255,0.5); }
    .no-msgs { text-align: center; padding: 32px; color: rgba(255,255,255,0.2); font-size: 13px; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; align-items: center; justify-content: center; padding: 24px; }
    .modal-overlay.open { display: flex; }
    .modal { background: #141414; border: 0.5px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 32px; width: 100%; max-width: 540px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .modal h2 { font-size: 18px; font-weight: 600; }
    .modal-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-size: 13px; font-family: inherit; }
    .modal label { display: block; font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
    .modal input, .modal select, .modal textarea { width: 100%; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.11); border-radius: 9px; padding: 0 12px; height: 42px; color: #fff; font-size: 14px; font-family: inherit; outline: none; margin-bottom: 16px; }
    .modal textarea { height: auto; padding: 12px; resize: vertical; }
    .modal-submit { width: 100%; height: 46px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; }
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
          <a href="/gallery">Galería</a>
          <a href="/profile">Mi perfil</a>
        </div>
        <a href="/profile" className="nav-avatar">{profile ? initials(profile.full_name) : 'SRC'}</a>
      </nav>

      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-label">Comunidad</div>
          <button className={`mode-btn ${mode === 'chat' ? 'active' : ''}`} onClick={() => setMode('chat')}>💬 Chat</button>
          <button className={`mode-btn ${mode === 'foro' ? 'active' : ''}`} onClick={() => setMode('foro')}>📝 Foro</button>
          <div className="sidebar-footer">
            <div className="online-count">
              <div className="online-dot"></div>
              <span style={{ color: '#4ade80', fontWeight: 500 }}>18</span>&nbsp;en línea
            </div>
          </div>
        </aside>

        {mode === 'chat' && (
          <div className="content">
            <div className="chat-header">
              <div className="chat-header-left">
                <span style={{ fontSize: 20 }}>💬</span>
                <div>
                  <div className="chat-header-name">Comunidad</div>
                  <div className="chat-header-sub">Canal general del club · {messages.length} mensajes</div>
                </div>
              </div>
              <div className="realtime-badge">
                <div className="online-dot"></div>
                En vivo
              </div>
            </div>

            <div className="messages">
              <div className="date-divider"><span>Hoy · {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
              {messages.length === 0 && <div className="no-msgs">No hay mensajes aún. ¡Sé el primero en escribir!</div>}
              {messages.map(msg => {
                const isMe = msg.user_id === profile?.id
                const name = msg.profile?.full_name || 'Miembro'
                const idx = colorIndex(name)
                return (
                  <div key={msg.id} className={`msg ${isMe ? 'me' : ''}`}>
                    <div className="msg-avatar" style={{ background: isMe ? 'rgba(74,222,128,0.2)' : avatarColors[idx], color: isMe ? '#4ade80' : avatarTextColors[idx] }}>
                      {initials(name)}
                    </div>
                    <div className="msg-body">
                      <div className="msg-header">
                        <span className="msg-name">{isMe ? `Tú · ${name}` : name}</span>
                        <span className={`msg-plan ${msg.profile?.plan === 'elite' ? 'plan-elite' : 'plan-pace'}`}>{msg.profile?.plan || 'pace'}</span>
                        <span className="msg-time">{new Date(msg.created_at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="msg-text">{msg.content}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrap">
              <div className="chat-input-box">
                <textarea className="chat-input" value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje en Comunidad..." rows={1}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
                <button className="send-btn" onClick={sendMessage}>➤</button>
              </div>
            </div>
          </div>
        )}

        {mode === 'foro' && (
          <div className="content">
            <div className="foro-header">
              <div className="foro-header-left">
                <h2>Foro del club</h2>
                <p>Preguntas, consejos, anuncios y debates</p>
              </div>
              <button className="new-thread-btn" onClick={() => setShowNewThread(true)}>+ Nuevo hilo</button>
            </div>
            <div className="foro-filters">
              {[['todos','Todos'],['preguntas','Preguntas'],['tips','Tips'],['anuncios','Anuncios'],['social','Social']].map(([val, label]) => (
                <button key={val} className={`foro-filter ${foroFilter === val ? 'on' : ''}`} onClick={() => setForoFilter(val)}>{label}</button>
              ))}
            </div>
            <div className="threads-list">
              {filteredThreads.length === 0 && <div className="no-msgs">No hay hilos en esta categoría aún.</div>}
              {filteredThreads.map(thread => {
                const name = thread.profile?.full_name || 'Miembro'
                const idx = colorIndex(name)
                return (
                  <div key={thread.id} className={`thread-item ${thread.pinned ? 'pinned' : ''}`}>
                    <div className="thread-top">
                      <div className="thread-avatar" style={{ background: avatarColors[idx], color: avatarTextColors[idx] }}>{initials(name)}</div>
                      <div className="thread-main">
                        <div className="thread-tags">
                          {thread.pinned && <span className="thread-tag tag-pin">📌 Fijado</span>}
                          <span className={`thread-tag ${tagClass[thread.category] || 'tag-pregunta'}`}>{tagLabel[thread.category] || thread.category}</span>
                        </div>
                        <div className="thread-title">{thread.title}</div>
                        {thread.content && <div className="thread-preview">{thread.content}</div>}
                      </div>
                    </div>
                    <div className="thread-footer">
                      <div className="thread-stat">💬 {thread.replies_count || 0}</div>
                      <div className="thread-stat">👁 {thread.views || 0}</div>
                      <div className="thread-author">por <strong>{name}</strong> · {new Date(thread.created_at).toLocaleDateString('es-DO')}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className={`modal-overlay ${showNewThread ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setShowNewThread(false)}>
        <div className="modal">
          <div className="modal-header">
            <h2>Nuevo hilo</h2>
            <button className="modal-close" onClick={() => setShowNewThread(false)}>✕ Cerrar</button>
          </div>
          <label>Categoría</label>
          <select value={threadForm.category} onChange={e => setThreadForm(p => ({ ...p, category: e.target.value }))}>
            <option value="pregunta">Pregunta</option>
            <option value="tip">Tip y consejo</option>
            <option value="anuncio">Anuncio</option>
            <option value="social">Social / Logro</option>
          </select>
          <label>Título</label>
          <input type="text" value={threadForm.title} onChange={e => setThreadForm(p => ({ ...p, title: e.target.value }))} placeholder="¿Cuál es tu pregunta o tema?" />
          <label>Contenido</label>
          <textarea rows={5} value={threadForm.content} onChange={e => setThreadForm(p => ({ ...p, content: e.target.value }))} placeholder="Escribe aquí el contenido..." />
          <button className="modal-submit" onClick={submitThread}>Publicar hilo →</button>
          {threadMsg && <div style={{ marginTop: 12, fontSize: 13, color: '#4ade80', textAlign: 'center' }}>{threadMsg}</div>}
        </div>
      </div>
    </>
  )
}
