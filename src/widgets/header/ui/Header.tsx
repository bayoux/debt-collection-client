"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { CommandPalette } from "@/features/command-palette/ui/CommandPalette"
import { ThemeToggle } from "@/features/theme-toggle/ui/ThemeToggle"

const pageTitles: Record<string, string> = {
  "/dashboard":     "Дашборд",
  "/debt-cases":    "Дела о задолженности",
  "/debtors":       "Должники",
  "/notifications": "Уведомления",
  "/scheduler":     "Расписание рассылок",
  "/ptp":           "Обещания об оплате",
  "/reports":       "Отчёты",
  "/users":         "Пользователи",
  "/integrations":  "Интеграции",
}

function getBaseTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const base = "/" + pathname.split("/")[1]
  return pageTitles[base] ?? "Debt Collection"
}

function HeaderBreadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) {
    return (
      <span className="text-sm font-medium">{getBaseTitle(pathname)}</span>
    )
  }

  const base     = "/" + segments[0]
  const baseTitle = pageTitles[base] ?? getBaseTitle(base)
  const subId    = segments[1]
  const subLabel = subId.length === 36
    ? `#${subId.slice(0, 8)}`  // UUID → short hash
    : subId.charAt(0).toUpperCase() + subId.slice(1)

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="breadcrumb">
      <Link
        href={base}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {baseTitle}
      </Link>
      <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/40" />
      <span className="font-medium text-foreground">{subLabel}</span>
    </nav>
  )
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
        <HeaderBreadcrumb pathname={pathname} />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <CommandPalette />
      </div>
    </header>
  )
}
