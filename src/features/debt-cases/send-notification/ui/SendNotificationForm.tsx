"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationApi } from "@/entities/notification/api/notification-api"
import { Button } from "@/shared/components/ui/button"
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
  template_id: z.string().min(1, "Выберите шаблон"),
  channel: z.enum(["whatsapp", "sms", "telegram", "email"]),
})

type FormValues = z.infer<typeof schema>

const channelLabels = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  telegram: "Telegram",
  email: "Email",
}

interface Props {
  debtCaseId: string
  onSuccess?: () => void
}

export function SendNotificationForm({ debtCaseId, onSuccess }: Props) {
  const { data: templates } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => notificationApi.templates.list(),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: notificationApi.send,
    onSuccess: (_, vars) => {
      const template = templates?.find((t) => t.id === vars.template_id)
      toast.success("Уведомление поставлено в очередь", {
        description: template
          ? `${template.name} · ${channelLabels[vars.channel]}`
          : channelLabels[vars.channel],
      })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось отправить уведомление"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { template_id: "", channel: "sms" },
  })

  function onSubmit(values: FormValues) {
    mutate({
      debt_case_id: debtCaseId,
      template_id: values.template_id,
      channel: values.channel,
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
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
              <FormLabel>Шаблон</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите шаблон" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Отправляем..." : "Отправить"}
        </Button>
      </form>
    </Form>
  )
}
