"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { integrationApi } from "@/entities/integration/api/integration-api"
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

const schema = z.object({
  channel: z.enum(["whatsapp", "sms", "telegram", "email"]),
  provider: z.string().min(1, "Введите провайдера"),
  api_key: z.string().min(1, "Введите API ключ / пароль приложения"),
  webhook_url: z.string().url("Неверный URL").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function IntegrationForm({ onSuccess }: Props) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: integrationApi.create,
    onSuccess: (cfg) => {
      toast.success("Интеграция добавлена", {
        description: `${cfg.channel.toUpperCase()} · ${cfg.provider}`,
      })
      qc.invalidateQueries({ queryKey: ["integrations"] })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось добавить интеграцию"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "sms", provider: "", api_key: "", webhook_url: "" },
  })

  const channel = form.watch("channel")
  const isEmail = channel === "email"
  const isTelegram = channel === "telegram"

  function onSubmit(values: FormValues) {
    mutate({
      channel: values.channel,
      provider: values.provider,
      api_key: values.api_key,
      webhook_url: values.webhook_url || undefined,
      is_active: true,
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
              <FormLabel>Канал</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v)
                  const prev = form.getValues("provider")
                  if (v === "email") {
                    form.setValue("provider", "smtp.gmail.com")
                  } else if (v === "telegram") {
                    form.setValue("provider", "telegram")
                  } else if (prev === "smtp.gmail.com" || prev === "telegram") {
                    form.setValue("provider", "")
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telegram">Telegram (Bot)</SelectItem>
                  <SelectItem value="email">Email (Gmail SMTP)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Провайдер *</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEmail ? "smtp.gmail.com" : isTelegram ? "telegram" : "ch2d"}
                  {...field}
                />
              </FormControl>
              {isEmail && (
                <FormDescription>
                  Для Gmail используйте <code>smtp.gmail.com</code>
                </FormDescription>
              )}
              {isTelegram && (
                <FormDescription>
                  Используйте <code>telegram</code> как идентификатор провайдера
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEmail ? "Пароль приложения Gmail *" : isTelegram ? "Bot Token *" : "API Ключ *"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEmail ? "xxxx xxxx xxxx xxxx" : isTelegram ? "123456789:AAF..." : "sk-..."}
                  {...field}
                />
              </FormControl>
              {isEmail && (
                <FormDescription>
                  Создайте App Password в Google Account → Security → 2-Step Verification
                </FormDescription>
              )}
              {isTelegram && (
                <FormDescription>
                  Получите токен у @BotFather в Telegram: /newbot → скопируйте токен
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEmail && (
          <FormField
            control={form.control}
            name="webhook_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com/webhook" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Сохраняем..." : "Добавить интеграцию"}
        </Button>
      </form>
    </Form>
  )
}
