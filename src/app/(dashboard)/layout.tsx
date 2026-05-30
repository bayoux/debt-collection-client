"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheckIcon } from "lucide-react"
import { useAuth } from "@/features/auth/model/auth-context"
import { AppSidebar } from "@/widgets/sidebar/ui/Sidebar"
import { Header } from "@/widgets/header/ui/Header"
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar"
import { PageTransition } from "@/shared/components/ui/page-transition"

function AppLoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-5 bg-background animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <ShieldCheckIcon className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Debt Collection</span>
      </div>
      <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return <AppLoadingScreen />
  if (!isAuthenticated) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
