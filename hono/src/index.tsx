/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { createAuthClient, evaluateGate } from './founderplus-auth'
import { buildCheckoutUrl, type CheckoutInput } from './founderplus-checkout'

type Env = {
  FOUNDERPLUS_API_BASE?: string
  FOUNDERPLUS_PRODUCT_SLUG?: string
  AUTH_DEV_BYPASS?: string
}

const app = new Hono<{ Bindings: Env }>()

function clientFor(env: Env) {
  return createAuthClient({
    apiBase: env.FOUNDERPLUS_API_BASE ?? 'https://academy.founderplus.id/api/dev'
  })
}

function appendCookies(c: { header: (k: string, v: string, o?: { append?: boolean }) => void }, setCookies: string[]) {
  for (const sc of setCookies) c.header('Set-Cookie', sc, { append: true })
}

const Page = (props: { children: unknown }) => (
  <html lang="id">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Founder+ Hono Starter</title>
    </head>
    <body style="font-family:system-ui,sans-serif;max-width:560px;margin:64px auto;padding:0 20px;line-height:1.6">
      {props.children}
      <script src="https://cdn.founderplus.id/funnel-tracker.js" defer />
    </body>
  </html>
)

const btn = 'display:inline-block;margin-top:16px;padding:10px 20px;background:#7f2dbf;color:#fff;border:none;border-radius:12px;font-weight:600;cursor:pointer;text-decoration:none'

app.get('/', async (c) => {
  const slug = c.env.FOUNDERPLUS_PRODUCT_SLUG ?? ''
  const devBypass = c.env.AUTH_DEV_BYPASS === 'true'
  const result = await evaluateGate(clientFor(c.env), c.req.header('cookie') ?? '', {
    requireProductSlugs: slug ? [slug] : [],
    allowOwner: true,
    bypass: devBypass
  })
  appendCookies(c, result.refreshedCookies)

  if (result.kind === 'login') {
    return c.html(<Page><main><h1>Masuk dulu</h1><p>Konten ini butuh akun Founder+.</p><a href="/login" style={btn}>Login</a></main></Page>)
  }
  if (result.kind === 'pay') {
    return c.html(
      <Page>
        <main>
          <h1>Konten terkunci</h1>
          <p>Hai {result.profile.name ?? 'kamu'}, beli produk ini untuk membuka akses.</p>
          <button id="buy" type="button" style={btn}>Beli sekarang</button>
          <script
            // biome-ignore lint: inline handler
            dangerouslySetInnerHTML={{
              __html: `document.getElementById('buy').onclick=async()=>{const sp=new URLSearchParams(location.search);const utm={};['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k=>{const v=sp.get(k);if(v)utm[k]=v});const r=await fetch('/api/buy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:${JSON.stringify(slug)},productType:'customProduct',utm,landingPage:location.href,referrer:document.referrer||null})});const d=await r.json();if(d.ok&&d.url)location.href=d.url;else alert(d.error||'Checkout gagal')}`
            }}
          />
        </main>
      </Page>
    )
  }
  return c.html(
    <Page>
      <main>
        <h1>Halo, {result.profile.name ?? 'kamu'} 👋</h1>
        <p>Akses terbuka [{result.reason}]{result.reason === 'owner' ? ' — kamu pembuat produk ini.' : ''}</p>
        <section style="margin-top:24px"><h2>Konten produk kamu</h2><p>Ganti dengan fitur asli appmu.</p></section>
        <form method="post" action="/api/logout"><button type="submit" style={btn}>Logout</button></form>
      </main>
    </Page>
  )
})

app.get('/login', (c) =>
  c.html(
    <Page>
      <main>
        <h1>Masuk Founder+</h1>
        <form id="f">
          <label for="email" style="display:block;margin-top:16px;font-weight:600">Email</label>
          <input id="email" type="email" required style="width:100%;padding:10px;border-radius:10px;border:1px solid #ddd;box-sizing:border-box" />
          <label for="password" style="display:block;margin-top:16px;font-weight:600">Password</label>
          <input id="password" type="password" required style="width:100%;padding:10px;border-radius:10px;border:1px solid #ddd;box-sizing:border-box" />
          <p id="err" style="color:#c0392b;font-size:14px" hidden />
          <button type="submit" style={btn}>Login</button>
        </form>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById('f').onsubmit=async(e)=>{e.preventDefault();const err=document.getElementById('err');err.hidden=true;const email=document.getElementById('email').value;const password=document.getElementById('password').value;const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(d.ok)location.href='/';else{err.textContent=d.error||'Login gagal';err.hidden=false}}`
          }}
        />
      </main>
    </Page>
  )
)

app.post('/api/login', async (c) => {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ ok: false, error: 'invalid body' }, 400)
  }
  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return c.json({ ok: false, error: 'email + password required' }, 400)
  }
  const r = await clientFor(c.env).loginWithCredentials(body.email.trim(), body.password)
  if (r.ok) appendCookies(c, r.setCookie)
  return c.json({ ok: r.ok, error: r.error }, r.ok ? 200 : 401)
})

app.post('/api/logout', async (c) => {
  const r = await clientFor(c.env).logoutSession(c.req.header('cookie') ?? '')
  appendCookies(c, r.setCookie)
  return c.redirect('/', 303)
})

app.post('/api/buy', async (c) => {
  let input: CheckoutInput
  try {
    input = (await c.req.json()) as CheckoutInput
  } catch {
    return c.json({ ok: false, error: 'invalid body' }, 400)
  }
  const result = await buildCheckoutUrl(input)
  return c.json(result, result.ok ? 200 : 400)
})

export default app
