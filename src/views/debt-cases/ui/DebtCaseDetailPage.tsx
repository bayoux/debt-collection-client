"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  BellIcon,
  HandshakeIcon,
  DollarSignIcon,
  CalendarIcon,
  TrendingDownIcon,
  PhoneIcon,
  MailIcon,
  MessageCircleIcon,
  UserCheckIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  XCircleIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  MessageSquareIcon,
  SendIcon,
} from "lucide-react"
import Link from "next/link"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import { statusLabels, statusStyles } from "@/entities/debt-case/model/status"
import type { DebtCaseStatus, DPDSnapshot } from "@/entities/debt-case/model/types"
import { ptpApi } from "@/entities/ptp/api/ptp-api"
import type { PTPRecord, PTPStatus } from "@/entities/ptp/model/types"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { NotificationChannel, NotificationLogStatus } from "@/entities/notification/model/types"
import { SendNotificationForm } from "@/features/debt-cases/send-notification/ui/SendNotificationForm"
import { CreatePtpForm } from "@/features/ptp/create/ui/CreatePtpForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Skeleton } from "@/shared/components/ui/skeleton"

// ─── status configs ───────────────────────────────────────────────────────────

const ptpStatusConfig: Record<PTPStatus, { label: string; cls: string }> = {
  pending: { label: "Ожидает",   cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  kept:    { label: "Выполнено", cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  broken:  { label: "Нарушено",  cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300" },
}

const notifLogStatusConfig: Record<NotificationLogStatus, { label: string; cls: string }> = {
  queued:    { label: "В очереди",  cls: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400" },
  sent:      { label: "Отправлено", cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  delivered: { label: "Доставлено", cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  failed:    { label: "Ошибка",     cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300" },
}

const channelIcons: Record<NotificationChannel, React.ElementType> = {
  sms:      MessageSquareIcon,
  whatsapp: MessageCircleIcon,
  telegram: SendIcon,
  email:    MailIcon,
}

const channelLabels: Record<NotificationChannel, string> = {
  sms: "SMS", whatsapp: "WhatsApp", telegram: "Telegram", email: "Email",
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function dpdTheme(dpd: number) {
  if (dpd > 60)
    return {
      card: "from-red-50/50 dark:from-red-950/30",
      icon: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
      value: "text-destructive",
    }
  if (dpd > 30)
    return {
      card: "from-orange-50/50 dark:from-orange-950/30",
      icon: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
      value: "text-orange-500",
    }
  if (dpd > 14)
    return {
      card: "from-amber-50/50 dark:from-amber-950/30",
      icon: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
      value: "text-amber-500",
    }
  return {
    card: "from-emerald-50/50 dark:from-emerald-950/30",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    value: "",
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {getInitials(name)}
    </div>
  )
}

function DpdChart({ history }: { history: DPDSnapshot[] }) {
  if (!history.length)
    return <p className="text-sm text-muted-foreground">Нет данных</p>

  const bars = history.slice(0, 14).reverse()
  const max = Math.max(...bars.map((d) => d.dpd_value), 1)

  return (
    <div className="space-y-4">
      <div className="flex h-20 items-end gap-0.5">
        {bars.map((snap, i) => {
          const pct = Math.max(6, (snap.dpd_value / max) * 100)
          const color =
            snap.dpd_value > 60
              ? "bg-destructive/70"
              : snap.dpd_value > 30
                ? "bg-orange-400/70"
                : "bg-primary/40"
          return (
            <div
              key={snap.id ?? i}
              title={`${snap.snapshot_date}: ${snap.dpd_value} дн.`}
              className={`flex-1 rounded-sm transition-all ${color}`}
              style={{ height: `${pct}%` }}
            />
          )
        })}
      </div>
      <div className="divide-y">
        {history.slice(0, 6).map((snap) => (
          <div key={snap.id} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">
              {new Date(snap.snapshot_date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span
              className={`font-medium tabular-nums ${
                snap.dpd_value > 60
                  ? "text-destructive"
                  : snap.dpd_value > 30
                    ? "text-orange-500"
                    : ""
              }`}
            >
              {snap.dpd_value} дн.
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PtpRow({
  ptp,
  onUpdate,
}: {
  ptp: PTPRecord
  onUpdate: (id: string, status: "kept" | "broken") => void
}) {
  const cfg = ptpStatusConfig[ptp.status]
  const date = new Date(ptp.promise_date + "T00:00:00")
  const formatted = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono tabular-nums font-medium">
            {ptp.promised_amount.toLocaleString("ru-RU")} сом
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">{formatted}</span>
        </div>
        <div className="text-xs text-muted-foreground">агент: {ptp.agent.username}</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cfg.cls}>{cfg.label}</Badge>
        {ptp.status === "pending" && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1 px-2 text-[11px] text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950"
              onClick={() => onUpdate(ptp.id, "kept")}
            >
              <CircleCheckIcon className="size-3" />
              Выполнено
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1 px-2 text-[11px] text-destructive hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-800 dark:hover:bg-red-950"
              onClick={() => onUpdate(ptp.id, "broken")}
            >
              <CircleXIcon className="size-3" />
              Нарушено
            </Button>
          </div>
        )}
        {ptp.status === "kept" && <CheckCircle2Icon className="size-4 text-emerald-500" />}
        {ptp.status === "broken" && <XCircleIcon className="size-4 text-destructive" />}
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

interface Props {
  id: string
}

export function DebtCaseDetailPage({ id }: Props) {
  const qc = useQueryClient()
  const [sendOpen, setSendOpen] = useState(false)
  const [ptpOpen, setPtpOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["debt-cases", id],
    queryFn: () => debtCaseApi.get(id),
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: (status: DebtCaseStatus) => debtCaseApi.update(id, { status }),
    onSuccess: (c) => {
      toast.success(`Статус изменён: ${statusLabels[c.status]}`)
      qc.invalidateQueries({ queryKey: ["debt-cases", id] })
    },
    onError: () => toast.error("Не удалось изменить статус"),
  })

  const { data: dpdHistory } = useQuery({
    queryKey: ["debt-cases", id, "dpd-history"],
    queryFn: () => debtCaseApi.dpdHistory(id),
    enabled: !!data,
  })

  const { data: ptpData } = useQuery({
    queryKey: ["ptp", "case", id],
    queryFn: () => ptpApi.list({ debt_case_id: id, page_size: 50 }),
    enabled: !!data,
  })

  const { data: notifLogs } = useQuery({
    queryKey: ["notif-logs", "case", id],
    queryFn: () => notificationApi.logs.list({ debt_case_id: id, page_size: 50 }),
    enabled: !!data,
  })

  const { mutate: updatePtpStatus } = useMutation({
    mutationFn: ({ ptpId, status }: { ptpId: string; status: "kept" | "broken" }) =>
      ptpApi.updateStatus(ptpId, status),
    onSuccess: (_, { status }) => {
      toast.success(status === "kept" ? "PTP выполнено" : "PTP нарушено")
      qc.invalidateQueries({ queryKey: ["ptp", "case", id] })
    },
    onError: () => toast.error("Не удалось обновить статус PTP"),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">Дело не найдено.</p>

  const dpd = dpdTheme(data.dpd)
  const dueDate = new Date(data.due_date + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
  const dueDateFormatted = dueDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const createdFormatted = new Date(data.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const contactRows = [
    { icon: UserCheckIcon,    label: "ФИО",      value: data.debtor.full_name },
    { icon: PhoneIcon,        label: "Телефон",  value: data.debtor.phone },
    { icon: MailIcon,         label: "Email",    value: data.debtor.email ?? "—" },
    { icon: MessageCircleIcon,label: "WhatsApp", value: data.debtor.whatsapp_number ?? "—" },
    { icon: MessageCircleIcon,label: "Telegram", value: data.debtor.telegram_id ?? "—" },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Link href="/debt-cases">
          <Button variant="ghost" size="icon-sm" className="mt-1 shrink-0">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>

        <Avatar name={data.debtor.full_name} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {data.debtor.full_name}
            </h1>
            <Badge variant="outline" className={statusStyles[data.status]}>
              {statusLabels[data.status]}
            </Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
            <span>{data.debtor.phone}</span>
            <span>Создано: {createdFormatted}</span>
            {data.assigned_agent && (
              <span className="flex items-center gap-1">
                <UserCheckIcon className="size-3" />
                {data.assigned_agent.username}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">Статус:</span>
        <Select
          value={data.status}
          onValueChange={(v) => updateStatus(v as DebtCaseStatus)}
        >
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <Badge
                  variant="outline"
                  className={`${statusStyles[value as DebtCaseStatus]} text-xs`}
                >
                  {label}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Dialog open={sendOpen} onOpenChange={setSendOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BellIcon className="mr-1.5 size-3.5" />
                Уведомление
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Отправить уведомление</DialogTitle>
              </DialogHeader>
              <SendNotificationForm
                debtCaseId={id}
                onSuccess={() => setSendOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={ptpOpen} onOpenChange={setPtpOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <HandshakeIcon className="mr-1.5 size-3.5" />
                Зафиксировать PTP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Обещание об оплате</DialogTitle>
              </DialogHeader>
              <CreatePtpForm debtCaseId={id} onSuccess={() => setPtpOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Metric cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card className="bg-linear-to-t from-emerald-50/50 to-card shadow-xs dark:from-emerald-950/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Сумма долга
              </CardTitle>
              <span className="flex items-center justify-center rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                <DollarSignIcon className="size-3.5" />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {data.amount.toLocaleString("ru-RU")}
              <span className="ml-1 text-sm font-normal text-muted-foreground">сом</span>
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-linear-to-t ${dpd.card} to-card shadow-xs`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">DPD</CardTitle>
              <span className={`flex items-center justify-center rounded-md p-1.5 ${dpd.icon}`}>
                <TrendingDownIcon className="size-3.5" />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${dpd.value}`}>
              {data.dpd}
              <span className="ml-1 text-sm font-normal text-muted-foreground">дней</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-t from-blue-50/50 to-card shadow-xs dark:from-blue-950/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Дата погашения
              </CardTitle>
              <span className="flex items-center justify-center rounded-md bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                <CalendarIcon className="size-3.5" />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold leading-snug">{dueDateFormatted}</p>
            {diffDays < 0 && (
              <p className="mt-0.5 text-xs font-medium text-destructive">
                просрочено {Math.abs(diffDays)} дн.
              </p>
            )}
            {diffDays === 0 && (
              <p className="mt-0.5 text-xs font-medium text-amber-500">срок сегодня</p>
            )}
            {diffDays > 0 && diffDays <= 30 && (
              <p className="mt-0.5 text-xs text-muted-foreground">через {diffDays} дн.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-linear-to-t from-violet-50/50 to-card shadow-xs dark:from-violet-950/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Агент</CardTitle>
              <span className="flex items-center justify-center rounded-md bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900 dark:text-violet-400">
                <UserCheckIcon className="size-3.5" />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {data.assigned_agent ? (
              <p className="truncate text-base font-bold">
                {data.assigned_agent.username}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Не назначен</p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Tabs: info / PTP / notifications ───────────────────────────── */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Должник</TabsTrigger>
          <TabsTrigger value="dpd">
            История DPD
          </TabsTrigger>
          <TabsTrigger value="ptp">
            PTP
            {ptpData && ptpData.count > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                {ptpData.count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Уведомления
            {notifLogs && notifLogs.count > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                {notifLogs.count}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Debtor info tab ──────────────────────────────────────────── */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex items-center justify-center rounded-md bg-muted p-1">
                  <UserCheckIcon className="size-3.5 text-muted-foreground" />
                </span>
                Должник
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              {contactRows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2 text-sm">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
                  <span className="truncate font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DPD history tab ──────────────────────────────────────────── */}
        <TabsContent value="dpd" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex items-center justify-center rounded-md bg-muted p-1">
                  <BarChart3Icon className="size-3.5 text-muted-foreground" />
                </span>
                История DPD
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!dpdHistory ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <DpdChart history={dpdHistory} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PTP history tab ──────────────────────────────────────────── */}
        <TabsContent value="ptp" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex items-center justify-center rounded-md bg-muted p-1">
                  <HandshakeIcon className="size-3.5 text-muted-foreground" />
                </span>
                Обещания об оплате
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!ptpData ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : ptpData.results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <HandshakeIcon className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Обещаний ещё нет</p>
                </div>
              ) : (
                <div className="divide-y">
                  {ptpData.results.map((ptp) => (
                    <PtpRow
                      key={ptp.id}
                      ptp={ptp}
                      onUpdate={(ptpId, status) => updatePtpStatus({ ptpId, status })}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notification log tab ─────────────────────────────────────── */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex items-center justify-center rounded-md bg-muted p-1">
                  <BellIcon className="size-3.5 text-muted-foreground" />
                </span>
                История уведомлений
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!notifLogs ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : notifLogs.results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <BellIcon className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Уведомлений ещё не было</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifLogs.results.map((log) => {
                    const Icon = channelIcons[log.channel]
                    const cfg = notifLogStatusConfig[log.status]
                    const sentAt = log.sent_at
                      ? new Date(log.sent_at).toLocaleString("ru-RU", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })
                      : null
                    return (
                      <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Icon className="size-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{log.template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {channelLabels[log.channel]}
                              {sentAt && <> · {sentAt}</>}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[11px] ${cfg.cls}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
