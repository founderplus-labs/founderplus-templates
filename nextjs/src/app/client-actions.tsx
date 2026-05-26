'use client'

const btn: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 20px',
  background: '#7f2dbf',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  fontWeight: 600,
  cursor: 'pointer'
}

export function BuyButton({ slug }: { slug: string }) {
  async function buy() {
    const sp = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = sp.get(k)
      if (v) utm[k] = v
    }
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, productType: 'customProduct', utm, landingPage: location.href, referrer: document.referrer || null })
    })
    const d = await r.json()
    if (d.ok && d.url) window.location.href = d.url
    else alert(d.error ?? 'Checkout gagal')
  }
  return <button type="button" onClick={buy} style={btn}>Beli sekarang</button>
}

export function LogoutButton() {
  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/'
  }
  return <button type="button" onClick={logout} style={{ ...btn, background: '#555' }}>Logout</button>
}
