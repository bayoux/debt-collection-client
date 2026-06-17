"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  PlusIcon,
  Trash2Icon,
  FlaskConicalIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  SendIcon,
  PlugZapIcon,
  CheckCircle2Icon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react"
import { Chat2DeskDirectSendForm } from "@/features/notifications/chat2desk-direct/ui/Chat2DeskDirectSendForm"
import { integrationApi } from "@/entities/integration/api/integration-api"
import type { IntegrationConfig } from "@/entities/integration/model/types"
import type { NotificationChannel } from "@/entities/notification/model/types"
import { IntegrationForm } from "@/features/integrations/manage/ui/IntegrationForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { QueryError } from "@/shared/components/ui/query-error"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"

// ─── channel config ───────────────────────────────────────────────────────────

type ChannelConfig = {
  label: string
  icon: LucideIcon
  iconCls: string
  cardCls: string
  badgeCls: string
}

const channelConfig: Record<NotificationChannel, ChannelConfig> = {
  sms: {
    label:    "SMS",
    icon:     MessageSquareIcon,
    iconCls:  "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    cardCls:  "from-blue-50/50 dark:from-blue-950/20",
    badgeCls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  whatsapp: {
    label:    "WhatsApp",
    icon:     MessageCircleIcon,
    iconCls:  "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    cardCls:  "from-green-50/50 dark:from-green-950/20",
    badgeCls: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
  },
  chat2desk: {
    label:    "Chat2Desk",
    icon:     MessageCircleIcon,
    iconCls:  "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400",
    cardCls:  "from-teal-50/50 dark:from-teal-950/20",
    badgeCls: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300",
  },
  telegram: {
    label:    "Telegram",
    icon:     SendIcon,
    iconCls:  "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400",
    cardCls:  "from-sky-50/50 dark:from-sky-950/20",
    badgeCls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  email: {
    label:    "Email",
    icon:     MailIcon,
    iconCls:  "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    cardCls:  "from-orange-50/50 dark:from-orange-950/20",
    badgeCls: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
}

// ─── sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center col-span-full">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <PlugZapIcon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Интеграции не добавлены</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Настройте канал уведомлений — SMS, WhatsApp, Telegram или Email
        </p>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-3 w-48" />
      </CardContent>
    </Card>
  )
}

type TestState = { success: boolean; message: string } | null

function IntegrationCard({
  integration,
  onDelete,
  onTest,
  testResult,
  isTesting,
}: {
  integration: IntegrationConfig
  onDelete: () => void
  onTest: () => void
  testResult: TestState
  isTesting: boolean
}) {
  const [directSendOpen, setDirectSendOpen] = useState(false)
  const ch = channelConfig[integration.channel]
  const Icon = ch.icon
  const isChat2Desk = integration.channel === "chat2desk"

  return (
    <Card className={`bg-linear-to-t ${ch.cardCls} to-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${ch.iconCls}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold leading-tight">{ch.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{integration.provider}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  integration.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 shrink-0"
                }
              >
                {integration.is_active ? "Активна" : "Неактивна"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {integration.webhook_url ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="truncate text-xs text-muted-foreground cursor-default">
                {integration.webhook_url}
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs break-all">
              {integration.webhook_url}
            </TooltipContent>
          </Tooltip>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">Webhook не задан</p>
        )}

        {testResult && (
          <div
            className={`flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
              testResult.success
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {testResult.success
              ? <CheckCircle2Icon className="size-3.5 shrink-0 mt-0.5" />
              : <XCircleIcon className="size-3.5 shrink-0 mt-0.5" />
            }
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={onTest}
                  disabled={isTesting}
                >
                  <FlaskConicalIcon className="size-3.5" />
                  {isTesting ? "Тест..." : "Тест"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Проверить соединение</TooltipContent>
            </Tooltip>

            {isChat2Desk && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setDirectSendOpen(true)}
                >
                  <SendIcon className="size-3.5" />
                  Отправить
                </Button>
                <Dialog open={directSendOpen} onOpenChange={setDirectSendOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Отправить сообщение через Chat2Desk</DialogTitle>
                    </DialogHeader>
                    <Chat2DeskDirectSendForm onSuccess={() => setDirectSendOpen(false)} />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<IntegrationConfig | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestState>>({})
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ["integrations"],
    queryFn: integrationApi.list,
  })

  const { mutate: deleteIntegration, isPending: isDeleting } = useMutation({
    mutationFn: integrationApi.delete,
    onSuccess: () => {
      const label = deleteTarget
        ? `${channelConfig[deleteTarget.channel].label} · ${deleteTarget.provider}`
        : undefined
      toast.success("Интеграция удалена", { description: label })
      qc.invalidateQueries({ queryKey: ["integrations"] })
      setDeleteTarget(null)
    },
    onError: () => toast.error("Не удалось удалить интеграцию"),
  })

  const { mutate: testIntegration } = useMutation({
    mutationFn: integrationApi.test,
    onMutate: (id) => setTestingIds((s) => new Set(s).add(id)),
    onSettled: (_, __, id) =>
      setTestingIds((s) => { const n = new Set(s); n.delete(id); return n }),
    onSuccess: (res, id) => {
      setTestResults((prev) => ({ ...prev, [id]: res }))
      if (res.success) toast.success("Соединение успешно", { description: res.message })
      else toast.error("Тест не прошёл", { description: res.message })
    },
    onError: (_, id) => {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, message: "Ошибка соединения" } }))
      toast.error("Ошибка соединения")
    },
  })

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Интеграции</h1>
          <p className="text-sm text-muted-foreground">
            Конфигурация каналов уведомлений
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-1.5 size-3.5" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая интеграция</DialogTitle>
            </DialogHeader>
            <IntegrationForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Cards grid ─────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : data?.length === 0 ? (
          <EmptyState />
        ) : (
          data?.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              testResult={testResults[integration.id] ?? null}
              isTesting={testingIds.has(integration.id)}
              onTest={() => testIntegration(integration.id)}
              onDelete={() => setDeleteTarget(integration)}
            />
          ))
        )}
      </div>

      {/* ── Delete confirmation dialog ──────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить интеграцию?</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-muted-foreground">
              Интеграция{" "}
              <span className="font-medium text-foreground">
                {channelConfig[deleteTarget.channel].label} / {deleteTarget.provider}
              </span>{" "}
              будет удалена без возможности восстановления.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => deleteTarget && deleteIntegration(deleteTarget.id)}
            >
              {isDeleting ? "Удаляем..." : "Удалить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
