import type { ReactNode } from 'react'
import Script from 'next/script'

export const metadata = { title: 'Founder+ Next.js Starter' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        {children}
        {/* Funnel tracker — loads after interactive, at end of document. */}
        <Script src="https://cdn.founderplus.id/funnel-tracker.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
