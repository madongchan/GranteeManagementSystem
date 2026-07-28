import { ParticipantHeader } from '@/components/header'

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParticipantHeader />
      <main className="max-w-[1080px] mx-auto px-5 pt-7 pb-20">{children}</main>
    </>
  )
}
