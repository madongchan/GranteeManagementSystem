import { AdminHeader } from '@/components/header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader />
      <main className="max-w-[1080px] mx-auto px-5 pt-7 pb-20">{children}</main>
    </>
  )
}
