import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'

/**
 * Root layout. The funnel-tracker script is loaded from the Founder+ CDN at
 * the END of <body> (after Scripts) — it captures UTM params and wires any
 * [data-product-slug] click to the Founder+ checkout.
 *
 * Set your project id in .env (FOUNDERPLUS_PROJECT_ID) and it is injected
 * below. The tracker is first-party (cdn.founderplus.id) so no SRI hash is
 * pinned; if you proxy it elsewhere, add integrity + crossorigin.
 */
const PROJECT_ID =
  // biome-ignore lint/suspicious/noExplicitAny: build-time env
  ((import.meta as any).env?.FOUNDERPLUS_PROJECT_ID as string | undefined) ?? ''

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Founder+ Fullstack Starter' }
    ]
  }),
  component: RootComponent
})

function RootComponent() {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
        {/* Funnel tracker — must be last in <body>. */}
        <script
          src="https://cdn.founderplus.id/funnel-tracker.js"
          {...(PROJECT_ID ? { 'data-project-id': PROJECT_ID } : {})}
          defer
        />
      </body>
    </html>
  )
}
