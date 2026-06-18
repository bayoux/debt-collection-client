"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  PlusIcon,
  CircleXIcon,
  CalendarIcon,
  ClockIcon,
  CheckCheckIcon,
  XCircleIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  SendIcon,
  type LucideIcon,
} from "lucide-react"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type {
  ScheduledTaskStatus,
  NotificationChannel,
} from "@/entities/notification/model/types"
import { CreateScheduledTaskForm } from "@/features/scheduler/create-task/ui/CreateScheduledTaskForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { QueryError } from "@/shared/components/ui/query-error"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useState } from "react"
import type { ScheduledTask } from "@/entities/notification/model/types"

// ─── config ───────────────────────────────────────────────────────────────────

const statusConfig: Record<
  ScheduledTaskStatus,
  { label: string; cls: string; icon: LucideIcon }
> = {
  pending: {
    label: "Ожидает",
    icon: ClockIcon,
    cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  sent: {
    label: "Отправлено",
    icon: CheckCheckIcon,
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  cancelled: {
    label: "Отменено",
    icon: CircleXIcon,
    cls: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
  },
  failed: {
    label: "Ошибка",
    icon: XCircleIcon,
    cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
}

const channelConfig: Record<
  NotificationChannel,
  { label: string; icon: LucideIcon; badgeCls: string }
> = {
  sms:       { label: "SMS",       icon: MessageSquareIcon, badgeCls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"       },
  whatsapp:  { label: "WhatsApp",  icon: MessageCircleIcon, badgeCls: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300" },
  chat2desk: { label: "Chat2Desk", icon: MessageCircleIcon, badgeCls: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"       },
  telegram:  { label: "Telegram",  icon: SendIcon,          badgeCls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"             },
  email:     { label: "Email",     icon: MailIcon,          badgeCls: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300" },
}

const FILTERS: { value: ScheduledTaskStatus | "all"; label: string; icon: LucideIcon }[] = [
  { value: "all",       label: "Все",        icon: CalendarIcon  },
  { value: "pending",   label: "Ожидает",    icon: ClockIcon     },
  { value: "sent",      label: "Отправлено", icon: CheckCheckIcon },
  { value: "cancelled", label: "Отменено",   icon: CircleXIcon   },
  { value: "failed",    label: "Ошибка",     icon: XCircleIcon   },
]

// ─── sub-components ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const { label, icon: Icon, badgeCls } = channelConfig[channel]
  return (
    <Badge variant="outline" className={badgeCls}>
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}

function ScheduledTimeCell({ dateStr }: { dateStr: string }) {
  const date    = new Date(dateStr)
  const now     = new Date()
  const diffMin = Math.round((date.getTime() - now.getTime()) / 60_000)

  const dateFmt = date.toLocaleDateString("ru-RU", {
    day: "numeric", month: "short", year: "numeric",
  })
  const timeFmt = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit", minute: "2-digit",
  })

  return (
    <div>
      <div className="text-sm">{dateFmt}</div>
      <div className="text-[11px] text-muted-foreground">{timeFmt}</div>
      {diffMin > 0 && diffMin < 60 && (
        <div className="text-[11px] font-medium text-amber-500">
          через {diffMin} мин.
        </div>
      )}
      {diffMin >= 60 && diffMin < 1440 && (
        <div className="text-[11px] text-muted-foreground">
          через {Math.round(diffMin / 60)} ч.
        </div>
      )}
    </div>
  )
}

function EmptyState({ status }: { status: ScheduledTaskStatus | "all" }) {
  return (
    <TableRow>
      <TableCell colSpan={5}>
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CalendarIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {status === "all" ? "Задач нет" : `Нет задач со статусом «${statusConfig[status as ScheduledTaskStatus]?.label ?? status}»`}
          </p>
          <p className="text-xs text-muted-foreground">
            Запланируйте рассылку, нажав кнопку «Запланировать»
          </p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function SchedulerPage() {
  const qc           = useQueryClient()
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<ScheduledTask | null>(null)

  const page       = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const taskStatus = (searchParams.get("status") ?? "all") as ScheduledTaskStatus | "all"

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") params.delete(key)
    else params.set(key, value)
    if (key !== "page") params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 1) params.delete("page")
    else params.set("page", String(next))
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["scheduled-tasks", page, taskStatus],
    queryFn: () =>
      notificationApi.scheduler.list({
        page,
        page_size: 20,
        task_status: taskStatus === "all" ? undefined : taskStatus,
      }),
  })

  const { mutate: cancelTask, isPending: isCancelling } = useMutation({
    mutationFn: notificationApi.scheduler.cancel,
    onSuccess: () => {
      toast.success("Задача отменена")
      qc.invalidateQueries({ queryKey: ["scheduled-tasks"] })
      setCancelTarget(null)
    },
    onError: () => toast.error("Не удалось отменить задачу"),
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Расписание рассылок</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.count.toLocaleString("ru-RU")} задач` : "Загрузка..."}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-1.5 size-3.5" />
              Запланировать
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая задача рассылки</DialogTitle>
            </DialogHeader>
            <CreateScheduledTaskForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-1">
        {FILTERS.map(({ value, label, icon: Icon }) => {
          const active = taskStatus === value
          return (
            <button
              key={value}
              onClick={() => setParam("status", value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              {active && data && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                  {data.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Шаблон</TableHead>
              <TableHead>Канал</TableHead>
              <TableHead>Время отправки</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <EmptyState status={taskStatus} />
            ) : (
              data?.results.map((task) => {
                const sc = statusConfig[task.task_status]
                const StatusIcon = sc.icon
                return (
                  <TableRow
                    key={task.id}
                    className="transition-colors duration-150 hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">
                      {task.template.name}
                    </TableCell>
                    <TableCell>
                      <ChannelBadge channel={task.channel} />
                    </TableCell>
                    <TableCell>
                      <ScheduledTimeCell dateStr={task.scheduled_at} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={sc.cls}>
                        <StatusIcon className="size-3" />
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.task_status === "pending" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-destructive hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-300"
                          onClick={() => setCancelTarget(task)}
                        >
                          <CircleXIcon className="size-3.5" />
                          Отменить
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {data && data.count > 20 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Страница {page} из {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={!data.previous}
            >
              Назад
            </Button>
            {totalPages <= 7 &&
              Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="w-8"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!data.next}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}

      {/* ── Cancel confirmation ─────────────────────────────────────────── */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Отменить задачу?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Задача{" "}
            <span className="font-medium text-foreground">
              {cancelTarget?.template.name}
            </span>{" "}
            будет отменена и не будет отправлена.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
              Назад
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isCancelling}
              onClick={() => cancelTarget && cancelTask(cancelTarget.id)}
            >
              {isCancelling ? "Отменяем..." : "Да, отменить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
