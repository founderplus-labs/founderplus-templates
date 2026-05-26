import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'

// SSR on Cloudflare — required because auth runs server-side (cookie proxy).
export default defineConfig({
  output: 'server',
  adapter: cloudflare()
})
