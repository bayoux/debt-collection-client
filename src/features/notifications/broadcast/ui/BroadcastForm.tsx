"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useState } from "react"
import { CheckCircle2Icon, XCircleIcon, SendIcon } from "lucide-react"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { BroadcastResult } from "@/entities/chat2desk/model/types"
import type { NotificationChannel } from "@/entities/notification/model/types"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
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

const BROADCAST_CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: "chat2desk", label: "Chat2Desk (WhatsApp)" },
  { value: "sms",       label: "SMS" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "telegram",  label: "Telegram" },
  { value: "email",     label: "Email" },
]

const schema = z.object({
  channel:    z.enum(["chat2desk", "whatsapp", "sms", "telegram", "email"] as const),
  template_id: z.string().min(1, "Выберите шаблон"),
  variables_json: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function BroadcastForm({ onSuccess }: Props) {
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof notificationApi.broadcast>[0]) =>
      notificationApi.broadcast(data),
    onSuccess: (res) => {
      setBroadcastResult(res)
      toast.success("Рассылка завершена", {
        description: `Отправлено: ${res.sent} / ${res.total}, ошибок: ${res.failed}`,
      })
      onSuccess?.()
    },
    onError: () => toast.error("Ошибка при выполнении рассылки"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "chat2desk", template_id: "", variables_json: "" },
  })

  const channel = form.watch("channel")

  const { data: templates } = useQuery({
    queryKey: ["notification-templates", channel],
    queryFn: () => notificationApi.templates.list({ channel: channel as NotificationChannel }),
  })

  function onSubmit(values: FormValues) {
    let variables: Record<string, string> | undefined
    if (values.variables_json?.trim()) {
      try {
        variables = JSON.parse(values.variables_json)
      } catch {
        form.setError("variables_json", { message: "Неверный JSON" })
        return
      }
    }
    setBroadcastResult(null)
    mutate({
      template_id: values.template_id,
      channel: values.channel,
      variables,
    })
  }

  return (
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

        <FormField
          control={form.control}
          name="variables_json"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дополнительные переменные (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='{"promo": "Скидка 10% до 31 мая"}'
                  className="min-h-20 font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Необязательно. Переопределяет авто-переменные шаблона:{" "}
                {`{{full_name}}, {{phone}}, {{amount}}, {{due_date}}, {{dpd}}`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Рассылка будет отправлена по <strong>всем активным делам</strong>.
          Каждому должнику — одно сообщение.
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
          {isPending ? (
            "Рассылаем..."
          ) : (
            <>
              <SendIcon className="mr-1.5 size-3.5" />
              Запустить рассылку
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
