"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Command } from "cmdk"
import {
  LayoutDashboardIcon,
  BriefcaseIcon,
  UsersIcon,
  BellIcon,
  BarChart3Icon,
  CalendarIcon,
  HandshakeIcon,
  SettingsIcon,
  UserCheckIcon,
  SearchIcon,
  ArrowRightIcon,
  type LucideIcon,
} from "lucide-react"
import { debtorApi } from "@/entities/debtor/api/debtor-api"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import { Dialog, DialogContent } from "@/shared/components/ui/dialog"
import { Badge } from "@/shared/components/ui/badge"

// ─── nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard",     label: "Дашборд",              icon: LayoutDashboardIcon },
  { href: "/debt-cases",    label: "Дела о задолженности", icon: BriefcaseIcon       },
  { href: "/debtors",       label: "Должники",             icon: UserCheckIcon       },
  { href: "/notifications", label: "Уведомления",          icon: BellIcon            },
  { href: "/ptp",           label: "Обещания (PTP)",       icon: HandshakeIcon       },
  { href: "/scheduler",     label: "Расписание",           icon: CalendarIcon        },
  { href: "/reports",       label: "Отчёты",               icon: BarChart3Icon       },
  { href: "/users",         label: "Пользователи",         icon: UsersIcon           },
  { href: "/integrations",  label: "Интеграции",           icon: SettingsIcon        },
]

// ─── status labels ────────────────────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  new: "Новое", in_progress: "В работе", promised: "Обещано",
  closed: "Закрыто", overdue: "Просрочено",
}
const statusStyles: Record<string, string> = {
  new:         "border-slate-200 bg-slate-50 text-slate-600",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  promised:    "border-amber-200 bg-amber-50 text-amber-700",
  closed:      "border-emerald-200 bg-emerald-50 text-emerald-700",
  overdue:     "border-red-200 bg-red-50 text-red-700",
}

// ─── component ────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) setQuery("")
  }

  const { data: debtors } = useQuery({
    queryKey: ["cmd-debtors", query],
    queryFn: () => debtorApi.list({ search: query, page_size: 5 }),
    enabled: query.length >= 2,
    staleTime: 30_000,
  })

  const { data: cases } = useQuery({
    queryKey: ["cmd-cases", query],
    queryFn: () => debtCaseApi.list({ page_size: 5 }),
    enabled: query.length === 0,
    staleTime: 30_000,
  })

  function go(href: string) {
    router.push(href)
    setOpen(false)
  }

  const filteredNav = query
    ? NAV_ITEMS.filter((n) =>
        n.label.toLowerCase().includes(query.toLowerCase())
      )
    : NAV_ITEMS

  return (
    <>
      {/* Trigger hint — shown in header */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
      >
        <SearchIcon className="size-3.5" />
        <span>Поиск...</span>
        <kbd className="ml-2 rounded border bg-background px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="overflow-hidden p-0 shadow-2xl"
          aria-describedby={undefined}
        >
          <Command className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-item]]:cursor-pointer **:[[cmdk-item]]:rounded-md **:[[cmdk-item]]:px-3 **:[[cmdk-item]]:py-2.5 **:[[cmdk-item][aria-selected=true]]:bg-accent">
            <div className="flex items-center border-b px-3">
              <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Поиск по разделам, должникам, делам..."
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Command.List className="max-h-105 overflow-y-auto p-2">
              <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
                Ничего не найдено по запросу «{query}»
              </Command.Empty>

              {/* Navigation */}
              {filteredNav.length > 0 && (
                <Command.Group heading="Навигация">
                  {filteredNav.map(({ href, label, icon: Icon }) => (
                    <Command.Item
                      key={href}
                      value={label}
                      onSelect={() => go(href)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <span>{label}</span>
                      <ArrowRightIcon className="ml-auto size-3.5 text-muted-foreground/50" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Debtor search results */}
              {query.length >= 2 && debtors && debtors.results.length > 0 && (
                <Command.Group heading="Должники">
                  {debtors.results.map((d) => (
                    <Command.Item
                      key={d.id}
                      value={`debtor-${d.id}`}
                      onSelect={() => go(`/debtors`)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                        <UserCheckIcon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{d.full_name}</div>
                        <div className="text-xs text-muted-foreground">{d.phone}</div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Recent cases (shown when query is empty) */}
              {query.length === 0 && cases && cases.results.length > 0 && (
                <Command.Group heading="Последние дела">
                  {cases.results.slice(0, 5).map((c) => (
                    <Command.Item
                      key={c.id}
                      value={`case-${c.id}`}
                      onSelect={() => go(`/debt-cases/${c.id}`)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                        <BriefcaseIcon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">
                          {c.debtor.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {c.amount.toLocaleString("ru-RU")} сом
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusStyles[c.status]}`}
                      >
                        {statusLabels[c.status]}
                      </Badge>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            <div className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd>
                навигация
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd>
                выбрать
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd>
                закрыть
              </span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
