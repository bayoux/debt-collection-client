"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useState } from "react"
import { CheckCircle2Icon, XCircleIcon, SendIcon, AlertTriangleIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { BroadcastResult } from "@/entities/chat2desk/model/types"
import type { NotificationChannel } from "@/entities/notification/model/types"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"

const BROADCAST_CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: "chat2desk", label: "Chat2Desk (WhatsApp)" },
  { value: "sms",       label: "SMS" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "telegram",  label: "Telegram" },
  { value: "email",     label: "Email" },
]

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  chat2desk: "Chat2Desk (WhatsApp)",
  sms:       "SMS",
  whatsapp:  "WhatsApp",
  telegram:  "Telegram",
  email:     "Email",
}

const schema = z.object({
  channel:     z.enum(["chat2desk", "whatsapp", "sms", "telegram", "email"] as const),
  template_id: z.string().min(1, "Выберите шаблон"),
})

type FormValues = z.infer<typeof schema>

// key-value pair for extra variables
type VarPair = { key: string; value: string }

interface Props {
  onSuccess?: () => void
}

export function BroadcastForm({ onSuccess }: Props) {
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof notificationApi.broadcast>[0] | null>(null)
  const [varPairs, setVarPairs] = useState<VarPair[]>([])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof notificationApi.broadcast>[0]) =>
      notificationApi.broadcast(data),
    onSuccess: (res) => {
      setBroadcastResult(res)
      setConfirmOpen(false)
      toast.success("Рассылка завершена", {
        description: `Отправлено: ${res.sent} / ${res.total}, ошибок: ${res.failed}`,
      })
      onSuccess?.()
    },
    onError: () => {
      setConfirmOpen(false)
      toast.error("Ошибка при выполнении рассылки")
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "chat2desk", template_id: "" },
  })

  const channel = form.watch("channel")
  const templateId = form.watch("template_id")

  const { data: templates } = useQuery({
    queryKey: ["notification-templates", channel],
    queryFn: () => notificationApi.templates.list({ channel: channel as NotificationChannel }),
  })

  const selectedTemplate = templates?.find((t) => t.id === templateId)

  function addVarPair() {
    setVarPairs((prev) => [...prev, { key: "", value: "" }])
  }

  function removeVarPair(i: number) {
    setVarPairs((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateVarPair(i: number, field: "key" | "value", val: string) {
    setVarPairs((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }

  function onSubmit(values: FormValues) {
    const variables: Record<string, string> = {}
    for (const { key, value } of varPairs) {
      if (key.trim()) variables[key.trim()] = value
    }
    setPendingPayload({
      template_id: values.template_id,
      channel: values.channel,
      variables: Object.keys(variables).length > 0 ? variables : undefined,
    })
    setConfirmOpen(true)
  }

  function handleConfirm() {
    if (pendingPayload) {
      setBroadcastResult(null)
      mutate(pendingPayload)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Канал рассылки</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v)
                    form.setValue("template_id", "")
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BROADCAST_CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value}>
                        {ch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Шаблон *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите шаблон" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templates?.length === 0 ? (
                      <SelectItem value="__empty__" disabled>
                        Нет шаблонов для этого канала
                      </SelectItem>
                    ) : (
                      templates?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Extra variables as key-value pairs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Дополнительные переменные</p>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addVarPair}>
                <PlusIcon className="mr-1 size-3" />
                Добавить
              </Button>
            </div>
            {varPairs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Авто: {`{{full_name}}, {{phone}}, {{amount}}, {{due_date}}, {{dpd}}`}
              </p>
            ) : (
              <div className="space-y-1.5">
                {varPairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input
                      placeholder="ключ"
                      value={pair.key}
                      onChange={(e) => updateVarPair(i, "key", e.target.value)}
                      className="h-8 text-sm font-mono w-32 shrink-0"
                    />
                    <span className="text-muted-foreground text-xs">=</span>
                    <Input
                      placeholder="значение"
                      value={pair.value}
                      onChange={(e) => updateVarPair(i, "value", e.target.value)}
                      className="h-8 text-sm flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeVarPair(i)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-0.5">
                  Авто: {`{{full_name}}, {{phone}}, {{amount}}, {{due_date}}, {{dpd}}`}
                </p>
              </div>
            )}
          </div>

          {broadcastResult && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-muted-foreground">Всего: {broadcastResult.total}</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2Icon className="size-3.5" />
                  {broadcastResult.sent}
                </span>
                {broadcastResult.failed > 0 && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircleIcon className="size-3.5" />
                    {broadcastResult.failed}
                  </span>
                )}
              </div>
              {broadcastResult.failed > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {broadcastResult.results
                    .filter((r) => r.status === "failed")
                    .map((r) => (
                      <p key={r.debtCaseId} className="text-xs text-red-600 dark:text-red-400">
                        Дело #{r.debtCaseId.slice(0, 8)} — ошибка
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            <SendIcon className="mr-1.5 size-3.5" />
            Запустить рассылку
          </Button>
        </form>
      </Form>

      {/* ── Confirmation dialog ─────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Подтвердите рассылку</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Сообщение будет отправлено по <strong>всем активным делам</strong>. Это действие нельзя отменить.
              </p>
            </div>
            <div className="space-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Шаблон</span>
                <span className="font-medium text-right">{selectedTemplate?.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Канал</span>
                <span className="font-medium">{CHANNEL_LABELS[pendingPayload?.channel as NotificationChannel] ?? ""}</span>
              </div>
              {pendingPayload?.variables && Object.keys(pendingPayload.variables).length > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Переменные</span>
                  <span className="font-medium">{Object.keys(pendingPayload.variables).length} шт.</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" disabled={isPending} onClick={handleConfirm}>
              {isPending ? "Рассылаем..." : "Да, разослать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
