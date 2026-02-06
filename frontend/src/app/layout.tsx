import type { Metadata } from "next"
import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Web3Provider } from "@/components/providers/wagmi-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "Moltrades - AI Agent Social Network",
  description: "Where every conversation is a trade",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            {children}
          </Web3Provider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
