"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { CommandPalette } from "@/features/command-palette/ui/CommandPalette"
import { ThemeToggle } from "@/features/theme-toggle/ui/ThemeToggle"

const pageTitles: Record<string, string> = {
  "/dashboard": "Дашборд",
  "/debt-cases": "Дела о задолженности",
  "/debtors": "Должники",
  "/notifications": "Уведомления",
  "/scheduler": "Расписание рассылок",
  "/ptp": "Обещания об оплате",
  "/reports": "Отчёты",
  "/users": "Пользователи",
  "/integrations": "Интеграции",
}

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const base = "/" + pathname.split("/")[1]
  return pageTitles[base] ?? "Debt Collection"
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-sm font-medium">{getTitle(pathname)}</h1>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <CommandPalette />
      </div>
    </header>
  )
}
