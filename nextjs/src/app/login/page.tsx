'use client'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const d = await r.json()
    if (d.ok) window.location.href = '/'
    else {
      setError(d.error ?? 'Login gagal')
      setBusy(false)
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: '0 20px' }}>
      <h1>Masuk Founder+</h1>
      <form onSubmit={submit}>
        <label htmlFor="email" style={label}>Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={input} />
        <label htmlFor="password" style={label}>Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required style={input} />
        {error && <p style={{ color: '#c0392b', fontSize: 14 }}>{error}</p>}
        <button type="submit" disabled={busy} style={btn}>{busy ? 'Memproses…' : 'Login'}</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        Belum punya akun? <a href="https://academy.founderplus.id/register" target="_blank" rel="noopener noreferrer">Daftar di Founder+</a>
      </p>
    </main>
  )
}

const label: React.CSSProperties = { display: 'block', marginTop: 16, marginBottom: 4, fontSize: 14, fontWeight: 600 }
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }
const btn: React.CSSProperties = { marginTop: 20, width: '100%', padding: 11, background: '#7f2dbf', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }
