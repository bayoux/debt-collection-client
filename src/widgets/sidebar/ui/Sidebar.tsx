"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboardIcon,
  UsersIcon,
  UserCheckIcon,
  BriefcaseIcon,
  BellIcon,
  CalendarIcon,
  HandshakeIcon,
  BarChart3Icon,
  SettingsIcon,
  ShieldCheckIcon,
  LogOutIcon,
} from "lucide-react"
import { useAuth } from "@/features/auth/model/auth-context"
import { reportApi } from "@/entities/report/api/report-api"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number }

const navMain: NavItem[] = [
  { href: "/dashboard",  label: "Дашборд",         icon: LayoutDashboardIcon },
  { href: "/debt-cases", label: "Дела",             icon: BriefcaseIcon },
  { href: "/debtors",    label: "Должники",         icon: UserCheckIcon },
  { href: "/ptp",        label: "Обещания (PTP)",   icon: HandshakeIcon },
]

const navOps: NavItem[] = [
  { href: "/notifications", label: "Уведомления", icon: BellIcon },
  { href: "/scheduler",     label: "Расписание",  icon: CalendarIcon },
  { href: "/reports",       label: "Отчёты",      icon: BarChart3Icon },
]

const navAdmin: NavItem[] = [
  { href: "/users",        label: "Пользователи", icon: UsersIcon },
  { href: "/integrations", label: "Интеграции",   icon: SettingsIcon },
]

function NavBadge({ count, variant = "muted" }: { count: number; variant?: "danger" | "warn" | "muted" }) {
  if (!count) return null
  const cls =
    variant === "danger"
      ? "bg-destructive/15 text-destructive"
      : variant === "warn"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-muted text-muted-foreground"
  return (
    <span className={`ml-auto rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums ${cls}`}>
      {count > 99 ? "99+" : count}
    </span>
  )
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string
  items: NavItem[]
  pathname: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ href, label, icon: Icon, badge }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href))
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={active} tooltip={label}>
                  <Link href={href}>
                    <Icon />
                    <span>{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <NavBadge
                        count={badge}
                        variant={
                          href === "/debt-cases" ? "danger"
                          : href === "/ptp" ? "warn"
                          : "muted"
                        }
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const { data: summary } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: reportApi.summary,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const mainWithBadges: NavItem[] = navMain.map((item) => {
    if (item.href === "/debt-cases") return { ...item, badge: summary?.total_overdue_cases }
    if (item.href === "/ptp")        return { ...item, badge: summary?.ptp_pending }
    return item
  })

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "U"

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Debt Collection</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Управление долгами
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Основное" items={mainWithBadges} pathname={pathname} />
        <NavGroup label="Операции" items={navOps} pathname={pathname} />
        <NavGroup label="Система" items={navAdmin} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.username ?? "Пользователь"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email ?? ""}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                sideOffset={4}
                className="min-w-48"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="grid text-sm">
                    <span className="font-medium">{user?.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOutIcon className="mr-2 size-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
