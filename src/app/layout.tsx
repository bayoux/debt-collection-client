import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/shared/providers/query-provider"
import { ThemeProvider } from "@/shared/providers/theme-provider"
import { AuthProvider } from "@/features/auth/model/auth-context"
import { TooltipProvider } from "@/shared/components/ui/tooltip"
import { Toaster } from "@/shared/components/ui/sonner"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Debt Collection",
  description: "Автоматизированная система управления дебиторской задолженностью",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider>
                {children}
                <Toaster richColors position="bottom-right" />
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
