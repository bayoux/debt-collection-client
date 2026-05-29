import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/shared/providers/query-provider"
import { AuthProvider } from "@/features/auth/model/auth-context"
import { TooltipProvider } from "@/shared/components/ui/tooltip"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Debt Manager",
  description: "Автоматизированная система управления дебиторской задолженностью",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
