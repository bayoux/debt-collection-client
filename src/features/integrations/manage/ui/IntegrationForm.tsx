"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { integrationApi } from "@/entities/integration/api/integration-api"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Form,
  FormControl,
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
  api_key: z.string().min(1, "Введите API ключ"),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] })
      onSuccess?.()
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "sms", provider: "", api_key: "", webhook_url: "" },
  })

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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
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
                <Input placeholder="ch2d" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Ключ *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="sk-..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Сохраняем..." : "Добавить интеграцию"}
        </Button>
      </form>
    </Form>
  )
}
