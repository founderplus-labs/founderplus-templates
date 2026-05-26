import Link from 'next/link'
import { gate, PRODUCT_SLUG } from '../lib/auth'
import { BuyButton, LogoutButton } from './client-actions'

// Server Component — gate decision runs server-side, never shipped as
// bypassable client state.
export default async function Home() {
  const result = await gate()

  if (result.kind === 'login') {
    return (
      <main style={wrap}>
        <h1>Masuk dulu</h1>
        <p>Konten ini butuh akun Founder+.</p>
        <Link href="/login" style={btn}>Login</Link>
      </main>
    )
  }

  if (result.kind === 'pay') {
    return (
      <main style={wrap}>
        <h1>Konten terkunci</h1>
        <p>Hai {result.profile.name ?? 'kamu'}, beli produk ini untuk membuka akses.</p>
        <BuyButton slug={PRODUCT_SLUG} />
      </main>
    )
  }

  return (
    <main style={wrap}>
      <h1>Halo, {result.profile.name ?? 'kamu'} 👋</h1>
      <p>
        Akses terbuka <span style={badge}>{result.reason}</span>
        {result.reason === 'owner' && ' — kamu pembuat produk ini.'}
      </p>
      <section style={{ marginTop: 24 }}>
        <h2>Konten produk kamu</h2>
        <p>Ganti bagian ini dengan fitur asli appmu.</p>
      </section>
      <LogoutButton />
    </main>
  )
}

const wrap: React.CSSProperties = { maxWidth: 560, margin: '64px auto', padding: '0 20px', lineHeight: 1.6 }
const btn: React.CSSProperties = { display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#7f2dbf', color: '#fff', borderRadius: 12, fontWeight: 600, textDecoration: 'none' }
const badge: React.CSSProperties = { fontSize: 12, background: '#f0e7fa', color: '#7f2dbf', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }
