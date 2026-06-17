"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3Icon,
  UsersIcon,
  InboxIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  SendIcon,
  DownloadIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { reportApi } from "@/entities/report/api/report-api"
import type { NotificationChannel } from "@/entities/notification/model/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { QueryError } from "@/shared/components/ui/query-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"

// ─── config ───────────────────────────────────────────────────────────────────

const channelConfig: Record<
  NotificationChannel | "all",
  { label: string; icon?: LucideIcon; badgeCls: string }
> = {
  all:       { label: "Все каналы", badgeCls: "" },
  sms:       { label: "SMS",        icon: MessageSquareIcon, badgeCls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"       },
  whatsapp:  { label: "WhatsApp",   icon: MessageCircleIcon, badgeCls: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300" },
  chat2desk: { label: "Chat2Desk",  icon: MessageCircleIcon, badgeCls: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"       },
  telegram:  { label: "Telegram",   icon: SendIcon,          badgeCls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"             },
  email:     { label: "Email",      icon: MailIcon,          badgeCls: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300" },
}

const DATE_PRESETS = [
  { label: "Сегодня", getDates: () => { const d = today(); return { from: d, to: d } } },
  { label: "7 дней",  getDates: () => ({ from: daysAgo(6), to: today() }) },
  { label: "30 дней", getDates: () => ({ from: daysAgo(29), to: today() }) },
  { label: "Месяц",   getDates: () => ({ from: firstOfMonth(), to: today() }) },
]

// ─── date helpers ─────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function firstOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric", month: "short", year: "numeric",
  })
}
function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  }
}
function humanizeAction(action: string) {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: NotificationChannel | "all" }) {
  const cfg = channelConfig[channel]
  if (channel === "all" || !cfg.icon) return <span className="text-sm text-muted-foreground">—</span>
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={cfg.badgeCls}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  )
}

function AgentAvatar({ username }: { username: string }) {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}

function DeliveryRate({ sent, delivered }: { sent: number; delivered: number }) {
  if (!sent) return <span className="text-muted-foreground">—</span>
  const pct = Math.round((delivered / sent) * 100)
  const cls =
    pct >= 80
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : pct >= 50
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
  return (
    <Badge variant="outline" className={cls}>
      {pct}%
    </Badge>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <TableRow>
      <TableCell colSpan={99}>
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

const initFrom = firstOfMonth()
const initTo   = today()

export function ReportsPage() {
  const [dateFrom,      setDateFrom]      = useState(initFrom)
  const [dateTo,        setDateTo]        = useState(initTo)
  const [channel,       setChannel]       = useState<string>("all")
  const [activityPage,  setActivityPage]  = useState(1)
  const [query, setQuery] = useState({ dateFrom: initFrom, dateTo: initTo, channel: "all" })

  function applyPreset(preset: (typeof DATE_PRESETS)[number]) {
    const { from, to } = preset.getDates()
    setDateFrom(from)
    setDateTo(to)
    setQuery({ dateFrom: from, dateTo: to, channel })
  }

  function applyFilters() {
    setQuery({ dateFrom, dateTo, channel })
  }

  const { data: campaign, isLoading: campaignLoading, error: campaignError } = useQuery({
    queryKey: ["reports", "campaign", query],
    queryFn: () =>
      reportApi.campaign({
        date_from: query.dateFrom,
        date_to:   query.dateTo,
        channel:   query.channel === "all" ? undefined : query.channel,
      }),
  })

  const { data: activity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ["reports", "activity", activityPage],
    queryFn: () => reportApi.agentActivity({ page: activityPage, page_size: 20 }),
  })

  // campaign totals
  const totals = campaign?.reduce(
    (acc, r) => ({
      sent:      acc.sent      + r.total_sent,
      delivered: acc.delivered + r.total_delivered,
      ptp:       acc.ptp       + r.total_ptp,
      collected: acc.collected + r.collected_amount,
    }),
    { sent: 0, delivered: 0, ptp: 0, collected: 0 }
  )

  const activityTotalPages = activity ? Math.ceil(activity.count / 20) : 1

  return (
    <div className="space-y-4">
      {(campaignError || activityError) && (
        <QueryError error={campaignError ?? activityError} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Отчёты</h1>
        <p className="text-sm text-muted-foreground">
          Аналитика кампаний и активность агентов
        </p>
      </div>

      <Tabs defaultValue="campaign">
        <TabsList>
          <TabsTrigger value="campaign">Кампании</TabsTrigger>
          <TabsTrigger value="activity">Активность агентов</TabsTrigger>
        </TabsList>

        {/* ── Campaign tab ───────────────────────────────────────────── */}
        <TabsContent value="campaign" className="mt-4 space-y-4">

          {/* Filters */}

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="rounded-md border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Date + channel + apply */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Дата от</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 w-36 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Дата до</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 w-36 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Канал</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="h-8 w-40 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все каналы</SelectItem>
                    {(["sms", "whatsapp", "telegram", "email"] as NotificationChannel[]).map((ch) => (
                      <SelectItem key={ch} value={ch}>
                        <ChannelBadge channel={ch} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="h-8" onClick={applyFilters}>
                Применить
              </Button>
            </div>
          </div>

          {/* Table header with export */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {campaign ? `${campaign.length} строк` : ""}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={!campaign?.length}
              onClick={() => {
                if (!campaign) return
                downloadCsv(`campaign-${query.dateFrom}-${query.dateTo}.csv`, [
                  ["Дата", "Канал", "Отправлено", "Доставлено", "PTP", "Собрано (сом)"],
                  ...campaign.map((r) => [
                    r.report_date,
                    channelConfig[r.channel]?.label ?? r.channel,
                    String(r.total_sent),
                    String(r.total_delivered),
                    String(r.total_ptp),
                    String(r.collected_amount),
                  ]),
                ])
              }}
            >
              <DownloadIcon className="mr-1.5 size-3.5" />
              Экспорт CSV
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead className="text-right">Отправлено</TableHead>
                  <TableHead className="text-right">Доставлено</TableHead>
                  <TableHead className="text-right">Доставляемость</TableHead>
                  <TableHead className="text-right">PTP</TableHead>
                  <TableHead className="text-right">Собрано (сом)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !campaign?.length ? (
                  <EmptyState
                    icon={BarChart3Icon}
                    title="Нет данных за период"
                    description="Попробуйте изменить диапазон дат или канал"
                  />
                ) : (
                  <>
                    {campaign.map((row, i) => (
                      <TableRow key={i} className="transition-colors hover:bg-primary/5">
                        <TableCell className="text-sm">{fmtDate(row.report_date)}</TableCell>
                        <TableCell>
                          <ChannelBadge channel={row.channel} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.total_sent.toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.total_delivered.toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeliveryRate sent={row.total_sent} delivered={row.total_delivered} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.total_ptp.toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.collected_amount.toLocaleString("ru-RU")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    {totals && campaign.length > 1 && (
                      <TableRow className="border-t-2 bg-muted/30 font-semibold">
                        <TableCell className="text-sm text-muted-foreground" colSpan={2}>
                          Итого
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totals.sent.toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totals.delivered.toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeliveryRate sent={totals.sent} delivered={totals.delivered} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totals.ptp.toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {totals.collected.toLocaleString("ru-RU")}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Activity tab ───────────────────────────────────────────── */}
        <TabsContent value="activity" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!activity?.results.length}
              onClick={() => {
                if (!activity) return
                downloadCsv("agent-activity.csv", [
                  ["Агент", "Действие", "Дело", "Время", "Примечание"],
                  ...activity.results.map((log) => [
                    log.agent.username,
                    log.action_type,
                    log.debt_case_id ?? "",
                    log.performed_at,
                    log.note ?? "",
                  ]),
                ])
              }}
            >
              <DownloadIcon className="mr-1.5 size-3.5" />
              Экспорт CSV
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Агент</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Дело</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Примечание</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-7 rounded-full" />
                          <Skeleton className="h-3.5 w-20" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : !activity?.results.length ? (
                  <EmptyState
                    icon={UsersIcon}
                    title="Активности нет"
                    description="Действия агентов появятся здесь"
                  />
                ) : (
                  activity.results.map((log) => {
                    const { date, time } = fmtDateTime(log.performed_at)
                    return (
                      <TableRow
                        key={log.id}
                        className="transition-colors duration-150 hover:bg-primary/5"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AgentAvatar username={log.agent.username} />
                            <span className="text-sm font-medium">{log.agent.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                          >
                            {humanizeAction(log.action_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.debt_case_id ? (
                            <Link
                              href={`/debt-cases/${log.debt_case_id}`}
                              className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                            >
                              #{log.debt_case_id.slice(0, 8)}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{date}</div>
                          <div className="text-[11px] text-muted-foreground">{time}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.note ?? "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {activity && activity.count > 20 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Страница {activityPage} из {activityTotalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  disabled={!activity.previous}
                >
                  Назад
                </Button>
                {activityTotalPages <= 7 &&
                  Array.from({ length: activityTotalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === activityPage ? "default" : "outline"}
                      size="sm"
                      className="w-8"
                      onClick={() => setActivityPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivityPage((p) => p + 1)}
                  disabled={!activity.next}
                >
                  Вперёд
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
