import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '함께일하는재단 통합관리시스템',
  description: '공모사업 신청·심사·정산·사후관리 통합관리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
