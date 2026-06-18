"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  PencilIcon,
  Trash2Icon,
  DownloadIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { NotificationChannel, NotificationLogStatus, NotificationTemplate } from "@/entities/notification/model/types"
import { CreateTemplateForm } from "@/features/notifications/create-template/ui/CreateTemplateForm"
import { EditTemplateForm } from "@/features/notifications/edit-template/ui/EditTemplateForm"
import { BroadcastForm } from "@/features/notifications/broadcast/ui/BroadcastForm"
import { NikitaDirectSendForm } from "@/features/notifications/nikita-direct/ui/NikitaDirectSendForm"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
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

// ─── channel config ───────────────────────────────────────────────────────────

type ChannelConfig = {
  label: string
  icon: LucideIcon
  badgeCls: string
  iconCls: string
  cardCls: string
}

const channelConfig: Record<NotificationChannel, ChannelConfig> = {
  sms: {
    label:    "SMS",
    icon:     MessageSquareIcon,
    badgeCls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
    iconCls:  "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    cardCls:  "from-blue-50/50 dark:from-blue-950/20",
  },
  whatsapp: {
    label:    "WhatsApp",
    icon:     MessageCircleIcon,
    badgeCls: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
    iconCls:  "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    cardCls:  "from-green-50/50 dark:from-green-950/20",
  },
  chat2desk: {
    label:    "Chat2Desk",
    icon:     MessageCircleIcon,
    badgeCls: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300",
    iconCls:  "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400",
    cardCls:  "from-teal-50/50 dark:from-teal-950/20",
  },
  telegram: {
    label:    "Telegram",
    icon:     SendIcon,
    badgeCls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
    iconCls:  "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400",
    cardCls:  "from-sky-50/50 dark:from-sky-950/20",
  },
  email: {
    label:    "Email",
    icon:     MailIcon,
    badgeCls: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
    iconCls:  "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    cardCls:  "from-orange-50/50 dark:from-orange-950/20",
  },
}

// ─── log status config ────────────────────────────────────────────────────────

type StatusConfig = { label: string; icon: LucideIcon; cls: string }

const statusConfig: Record<NotificationLogStatus, StatusConfig> = {
  queued:    { label: "В очереди",  icon: ClockIcon,      cls: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"       },
  sent:      { label: "Отправлено", icon: SendIcon,        cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"             },
  delivered: { label: "Доставлено", icon: CheckCheckIcon,  cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  failed:    { label: "Ошибка",     icon: XCircleIcon,     cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"                   },
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TemplateBody({ body }: { body: string }) {
  const parts = body.split(/(\{\{[^}]+\}\})/g)
  return (
    <>
      {parts.map((part, i) =>
        /^\{\{[^}]+\}\}$/.test(part) ? (
          <span
            key={i}
            className="rounded bg-primary/10 px-0.5 font-mono text-[10px] text-primary"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  )
}

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const { label, icon: Icon, badgeCls } = channelConfig[channel]
  return (
    <Badge variant="outline" className={badgeCls}>
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: NotificationLogStatus }) {
  const { label, icon: Icon, cls } = statusConfig[status]
  return (
    <Badge variant="outline" className={cls}>
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}

function formatLogDate(dateStr: string | null) {
  if (!dateStr) return { primary: "—" }
  const date = new Date(dateStr)
  const now   = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  const timeStr  = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 0) return { primary: timeStr,  secondary: "сегодня" }
  if (diffDays === 1) return { primary: timeStr,  secondary: "вчера"   }
  if (diffDays < 7)   return { primary: timeStr,  secondary: `${diffDays} дн. назад` }
  return {
    primary:   date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    secondary: timeStr,
  }
}

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
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
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

function TemplateCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="size-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

function downloadLogsCsv(logs: ReturnType<typeof Array.prototype.map>) {
  const rows = [
    ["Шаблон", "Дело", "Канал", "Статус", "Отправлено"],
    ...(logs as { template: { name: string }; debt_case_id: string; channel: string; status: string; sent_at: string | null }[]).map((l) => [
      l.template.name,
      l.debt_case_id,
      l.channel,
      l.status,
      l.sent_at ?? "",
    ]),
  ]
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "notification-logs.csv"; a.click()
  URL.revokeObjectURL(url)
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const [createOpen,    setCreateOpen]    = useState(false)
  const [editTarget,    setEditTarget]    = useState<NotificationTemplate | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<NotificationTemplate | null>(null)
  const [logsPage,      setLogsPage]      = useState(1)
  const [logChannel,    setLogChannel]    = useState<NotificationChannel | "all">("all")
  const [logStatus,     setLogStatus]     = useState<NotificationLogStatus | "all">("all")

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => notificationApi.templates.list(),
  })

  const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => notificationApi.templates.delete(id),
    onSuccess: () => {
      toast.success("Шаблон удалён", { description: deleteTarget?.name })
      qc.invalidateQueries({ queryKey: ["notification-templates"] })
      setDeleteTarget(null)
    },
    onError: () => toast.error("Не удалось удалить шаблон"),
  })

  const {
    data: logs,
    isLoading: logsLoading,
    error: logsError,
  } = useQuery({
    queryKey: ["notification-logs", logsPage, logChannel, logStatus],
    queryFn: () =>
      notificationApi.logs.list({
        page:     logsPage,
        page_size: 20,
        channel: logChannel === "all" ? undefined : logChannel,
        status:  logStatus  === "all" ? undefined : logStatus,
      }),
  })

  const templateCount = templates?.length ?? 0
  const logCount      = logs?.count ?? 0
  const totalLogPages = logs ? Math.ceil(logs.count / 20) : 1

  function handleLogChannel(v: string) {
    setLogChannel(v as NotificationChannel | "all")
    setLogsPage(1)
  }
  function handleLogStatus(v: string) {
    setLogStatus(v as NotificationLogStatus | "all")
    setLogsPage(1)
  }

  return (
    <div className="space-y-4">
      {(templatesError || logsError) && (
        <QueryError error={templatesError ?? logsError} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-sm text-muted-foreground">
            Шаблоны и лог отправленных уведомлений
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-1.5 size-3.5" />
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
          <TabsTrigger value="broadcast">Рассылка</TabsTrigger>
          <TabsTrigger value="nikita">SMS (Nikita)</TabsTrigger>
          <TabsTrigger value="logs">
            Лог отправок
            {!logsLoading && logCount > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {logCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Templates tab ──────────────────────────────────────────── */}
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
                <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                  <PlusIcon className="mr-1.5 size-3.5" />
                  Создать шаблон
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates?.map((t) => {
                const ch = channelConfig[t.channel]
                const Icon = ch.icon
                return (
                  <Card
                    key={t.id}
                    className={`bg-linear-to-t ${ch.cardCls} to-card animate-fade-up shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${ch.iconCls}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-sm font-medium leading-tight">
                              {t.name}
                            </span>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-6 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditTarget(t)}
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-6 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteTarget(t)}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-1">
                            <ChannelBadge channel={t.channel} />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="line-clamp-2 cursor-default text-xs text-muted-foreground">
                            <TemplateBody body={t.body} />
                          </p>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-xs text-xs"
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">
                            <TemplateBody body={t.body} />
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Broadcast tab ──────────────────────────────────────────── */}
        <TabsContent value="broadcast" className="mt-4">
          <div className="mx-auto max-w-md">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Массовая рассылка</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Отправьте уведомление сразу по всем активным делам
              </p>
            </div>
            <BroadcastForm />
          </div>
        </TabsContent>

        {/* ── Nikita SMS tab ─────────────────────────────────────────── */}
        <TabsContent value="nikita" className="mt-4">
          <div className="mx-auto max-w-md">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Прямая отправка SMS</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Отправить SMS напрямую через Nikita SMSPro (nikita.kg)
              </p>
            </div>
            <NikitaDirectSendForm />
          </div>
        </TabsContent>

        {/* ── Logs tab ───────────────────────────────────────────────── */}
        <TabsContent value="logs" className="mt-4 space-y-3">

          {/* Filters + export */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={logChannel} onValueChange={handleLogChannel}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="Все каналы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все каналы</SelectItem>
                {(Object.keys(channelConfig) as NotificationChannel[]).map((ch) => (
                  <SelectItem key={ch} value={ch}>
                    <ChannelBadge channel={ch} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={logStatus} onValueChange={handleLogStatus}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {(Object.keys(statusConfig) as NotificationLogStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <StatusBadge status={s} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(logChannel !== "all" || logStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground"
                onClick={() => { setLogChannel("all"); setLogStatus("all"); setLogsPage(1) }}
              >
                <XCircleIcon className="mr-1 size-3.5" />
                Сбросить
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 ml-auto"
              disabled={!logs?.results.length}
              onClick={() => logs && downloadLogsCsv(logs.results)}
            >
              <DownloadIcon className="mr-1.5 size-3.5" />
              CSV
            </Button>
          </div>

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
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : logs?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={InboxIcon}
                        title="Уведомлений нет"
                        description={
                          logChannel !== "all" || logStatus !== "all"
                            ? "Попробуйте изменить фильтры"
                            : "Отправленные уведомления появятся здесь"
                        }
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

          {/* Pagination */}
          {logs && logs.count > 20 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Страница {logsPage} из {totalLogPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={!logs.previous}
                >
                  Назад
                </Button>
                {totalLogPages <= 7 &&
                  Array.from({ length: totalLogPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === logsPage ? "default" : "outline"}
                      size="sm"
                      className="w-8"
                      onClick={() => setLogsPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogsPage((p) => p + 1)}
                  disabled={!logs.next}
                >
                  Вперёд
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Edit template dialog ────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать шаблон</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <EditTemplateForm
              template={editTarget}
              onSuccess={() => setEditTarget(null)}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete template confirmation ────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить шаблон?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Шаблон{" "}
            <span className="font-medium text-foreground">{deleteTarget?.name}</span>{" "}
            будет удалён без возможности восстановления.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => deleteTarget && deleteTemplate(deleteTarget.id)}
            >
              {isDeleting ? "Удаляем..." : "Удалить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
