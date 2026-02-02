import { Header } from "@/components/layout/header"

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center overflow-hidden">{children}</main>
    </div>
  )
}
