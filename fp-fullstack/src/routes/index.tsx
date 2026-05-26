import { createFileRoute, useRouter } from '@tanstack/react-router'
import { checkGate, productSlugConfigured } from '../lib/auth-server'
import { initiateCheckout } from '../lib/buy-server'

/**
 * Home — gated content demo. The loader runs checkGate() server-side, so the
 * paywall decision never reaches the client as bypassable state. Three states:
 *   allow → show the protected content (reason: owner | staff | purchased | open)
 *   login → prompt to log in
 *   pay   → prompt to buy (button starts Founder+ checkout)
 */
export const Route = createFileRoute('/')({
  loader: async () => {
    const gate = await checkGate()
    return { gate, slug: productSlugConfigured }
  },
  component: Home
})

function Home() {
  const { gate, slug } = Route.useLoaderData()
  const router = useRouter()

  async function buy() {
    const utm: Record<string, string> = {}
    const sp = new URLSearchParams(window.location.search)
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = sp.get(k)
      if (v) utm[k] = v
    }
    const res = await initiateCheckout({
      data: {
        slug,
        productType: 'customProduct',
        utm,
        referrer: document.referrer || null,
        landingPage: window.location.href
      }
    })
    if (res.ok && res.url) window.location.href = res.url
    else alert(res.error ?? 'Checkout gagal')
  }

  if (gate.kind === 'login') {
    return (
      <main style={wrap}>
        <h1>Masuk dulu</h1>
        <p>Konten ini butuh akun Founder+.</p>
        <a href="/login" style={btn}>Login</a>
      </main>
    )
  }

  if (gate.kind === 'pay') {
    return (
      <main style={wrap}>
        <h1>Konten terkunci</h1>
        <p>Hai {gate.profile.name ?? 'kamu'}, beli produk ini untuk membuka akses.</p>
        <button type="button" onClick={buy} style={btn}>Beli sekarang</button>
        <p style={{ marginTop: 24, fontSize: 13, color: '#666' }}>
          Sudah beli tapi masih terkunci? <button type="button" onClick={() => router.invalidate()} style={linkBtn}>Muat ulang</button>
        </p>
      </main>
    )
  }

  // allow
  return (
    <main style={wrap}>
      <h1>Halo, {gate.profile.name ?? 'kamu'} 👋</h1>
      <p>
        Akses terbuka{' '}
        <span style={badge}>{gate.reason}</span>
        {gate.reason === 'owner' && ' — kamu pembuat produk ini.'}
      </p>
      <section style={{ marginTop: 24 }}>
        <h2>Konten produk kamu</h2>
        <p>Ganti bagian ini dengan fitur asli appmu (dashboard, tool, materi…).</p>
      </section>
      <form
        method="post"
        action="/_server"
        onSubmit={(e) => {
          e.preventDefault()
          import('../lib/auth-server').then(({ logoutAction }) =>
            logoutAction().then(() => router.invalidate())
          )
        }}
      >
        <button type="submit" style={{ ...linkBtn, marginTop: 24 }}>Logout</button>
      </form>
    </main>
  )
}

const wrap: React.CSSProperties = {
  maxWidth: 560,
  margin: '64px auto',
  padding: '0 20px',
  fontFamily: 'system-ui, sans-serif',
  lineHeight: 1.6
}
const btn: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 16,
  padding: '10px 20px',
  background: '#7F2DBF',
  color: '#fff',
  borderRadius: 12,
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none'
}
const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#7F2DBF',
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0,
  font: 'inherit'
}
const badge: React.CSSProperties = {
  fontSize: 12,
  background: '#f0e7fa',
  color: '#7F2DBF',
  padding: '2px 8px',
  borderRadius: 999,
  fontWeight: 600
}
