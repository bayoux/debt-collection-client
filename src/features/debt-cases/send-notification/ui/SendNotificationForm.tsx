"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationApi } from "@/entities/notification/api/notification-api"
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

const schema = z
  .object({
    template_id: z.string().min(1, "Выберите шаблон"),
    channel: z.enum(["whatsapp", "sms", "telegram", "email"]),
    recipient_email: z.string().optional(),
    subject: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "email") {
      if (!data.recipient_email || !z.string().email().safeParse(data.recipient_email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Введите корректный email получателя",
          path: ["recipient_email"],
        })
      }
    }
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
    defaultValues: { template_id: "", channel: "sms", recipient_email: "", subject: "" },
  })

  const channel = form.watch("channel")

  function onSubmit(values: FormValues) {
    mutate({
      debt_case_id: debtCaseId,
      template_id: values.template_id,
      channel: values.channel,
      recipient_email: values.channel === "email" ? values.recipient_email : undefined,
      subject: values.channel === "email" && values.subject ? values.subject : undefined,
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
        {channel === "telegram" && (
          <FormDescription className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300">
            Сообщение будет отправлено на Telegram ID, указанный в профиле должника
          </FormDescription>
        )}
        {channel === "email" && (
          <>
            <FormField
              control={form.control}
              name="recipient_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email получателя *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="debtor@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тема письма</FormLabel>
                  <FormControl>
                    <Input placeholder="Из шаблона (если задана)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Отправляем..." : "Отправить"}
        </Button>
      </form>
    </Form>
  )
}
