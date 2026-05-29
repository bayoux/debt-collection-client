"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  PlusIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  SendIcon,
  ClockIcon,
  CheckCheckIcon,
  XCircleIcon,
  BellOffIcon,
  InboxIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { NotificationChannel, NotificationLogStatus } from "@/entities/notification/model/types"
import { CreateTemplateForm } from "@/features/notifications/create-template/ui/CreateTemplateForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { QueryError } from "@/shared/components/ui/query-error"

// ─── channel config ──────────────────────────────────────────────────────────

type ChannelConfig = { label: string; icon: LucideIcon; className: string }

const channelConfig: Record<NotificationChannel, ChannelConfig> = {
  sms:      { label: "SMS",      icon: MessageSquareIcon, className: "border-blue-200   bg-blue-50   text-blue-700"   },
  whatsapp: { label: "WhatsApp", icon: MessageCircleIcon, className: "border-green-200  bg-green-50  text-green-700"  },
  telegram: { label: "Telegram", icon: SendIcon,          className: "border-sky-200    bg-sky-50    text-sky-700"    },
  email:    { label: "Email",    icon: MailIcon,          className: "border-orange-200 bg-orange-50 text-orange-700" },
}

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const { label, icon: Icon, className } = channelConfig[channel]
  return (
    <Badge variant="outline" className={className}>
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}

// ─── log status config ───────────────────────────────────────────────────────

type StatusConfig = { label: string; icon: LucideIcon; className: string }

const statusConfig: Record<NotificationLogStatus, StatusConfig> = {
  queued:    { label: "В очереди",  icon: ClockIcon,      className: "border-slate-200   bg-slate-50   text-slate-600"   },
  sent:      { label: "Отправлено", icon: SendIcon,        className: "border-blue-200    bg-blue-50    text-blue-700"    },
  delivered: { label: "Доставлено", icon: CheckCheckIcon,  className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failed:    { label: "Ошибка",     icon: XCircleIcon,     className: "border-red-200     bg-red-50     text-red-700"     },
}

function StatusBadge({ status }: { status: NotificationLogStatus }) {
  const { label, icon: Icon, className } = statusConfig[status]
  return (
    <Badge variant="outline" className={className}>
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}

// ─── date helper ─────────────────────────────────────────────────────────────

function formatLogDate(dateStr: string | null): { primary: string; secondary?: string } {
  if (!dateStr) return { primary: "—" }

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })

  if (diffDays === 0) return { primary: timeStr, secondary: "сегодня" }
  if (diffDays === 1) return { primary: timeStr, secondary: "вчера" }
  if (diffDays < 7)   return { primary: timeStr, secondary: `${diffDays} дн. назад` }

  return {
    primary: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    secondary: timeStr,
  }
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

// ─── template card ────────────────────────────────────────────────────────────

function TemplateCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-4/5 mb-1" />
        <Skeleton className="h-3 w-3/5" />
      </CardContent>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [logsPage, setLogsPage] = useState(1)

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => notificationApi.templates.list(),
  })

  const {
    data: logs,
    isLoading: logsLoading,
    error: logsError,
  } = useQuery({
    queryKey: ["notification-logs", logsPage],
    queryFn: () => notificationApi.logs.list({ page: logsPage, page_size: 20 }),
  })

  const templateCount = templates?.length ?? 0
  const logCount = logs?.count ?? 0

  return (
    <div className="space-y-4">
      {(templatesError || logsError) && (
        <QueryError error={templatesError ?? logsError} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-muted-foreground">
            Шаблоны и лог отправленных уведомлений
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1.5 size-4" />
              Новый шаблон
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать шаблон</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            Шаблоны
            {!templatesLoading && templateCount > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {templateCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs">
            Лог отправок
            {!logsLoading && logCount > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {logCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Templates tab ── */}
        <TabsContent value="templates" className="mt-4">
          {templatesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TemplateCardSkeleton key={i} />
              ))}
            </div>
          ) : templates?.length === 0 ? (
            <EmptyState
              icon={BellOffIcon}
              title="Шаблоны не найдены"
              description="Создайте первый шаблон уведомления"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusIcon className="mr-1.5 size-3.5" />
                  Создать шаблон
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates?.map((t) => (
                <Card
                  key={t.id}
                  className="animate-fade-up transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">
                        {t.name}
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <ChannelBadge channel={t.channel} />
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-slate-500 text-[11px]"
                        >
                          {t.language.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="line-clamp-3 cursor-default text-xs text-muted-foreground">
                          {t.body}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="max-w-xs whitespace-pre-wrap text-xs"
                      >
                        {t.body}
                      </TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Logs tab ── */}
        <TabsContent value="logs" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Шаблон</TableHead>
                  <TableHead>Дело</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Отправлено</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : logs?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={InboxIcon}
                        title="Уведомлений ещё нет"
                        description="Отправленные уведомления появятся здесь"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.results.map((log) => {
                    const { primary, secondary } = formatLogDate(log.sent_at)
                    return (
                      <TableRow
                        key={log.id}
                        className="transition-colors duration-150 hover:bg-primary/5"
                      >
                        <TableCell className="font-medium">
                          {log.template.name}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/debt-cases/${log.debt_case_id}`}
                            className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                          >
                            #{log.debt_case_id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ChannelBadge channel={log.channel} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{primary}</div>
                          {secondary && (
                            <div className="text-[11px] text-muted-foreground">
                              {secondary}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {logs && logs.count > 20 && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                disabled={!logs.previous}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                Страница {logsPage} из {Math.ceil(logs.count / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogsPage((p) => p + 1)}
                disabled={!logs.next}
              >
                Вперёд
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
