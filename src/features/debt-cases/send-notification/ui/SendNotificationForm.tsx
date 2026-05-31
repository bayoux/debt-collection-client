"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { DebtCase } from "@/entities/debt-case/model/types"
import { statusLabels } from "@/entities/debt-case/model/status"
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
import { resolveTemplate } from "@/shared/lib/utils"

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
  debtCase?: DebtCase
  extraVars?: Record<string, string>
  onSuccess?: () => void
}

export function SendNotificationForm({ debtCaseId, debtCase, extraVars, onSuccess }: Props) {
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
  const templateId = form.watch("template_id")
  const selectedTemplate = templates?.find((t) => t.id === templateId)

  const templateVars: Record<string, string> = {
    ...(debtCase
      ? {
          full_name: debtCase.debtor.full_name,
          phone: debtCase.debtor.phone,
          email: debtCase.debtor.email ?? "",
          amount: debtCase.amount.toLocaleString("ru-RU"),
          due_date: new Date(debtCase.due_date + "T00:00:00").toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          dpd: String(debtCase.dpd),
          status: statusLabels[debtCase.status],
        }
      : {}),
    ...extraVars,
  }

  const resolvedBody = selectedTemplate ? resolveTemplate(selectedTemplate.body, templateVars) : null
  const hasVars = selectedTemplate ? /\{\{[^}]+\}\}/.test(selectedTemplate.body) : false

  function onSubmit(values: FormValues) {
    mutate({
      debt_case_id: debtCaseId,
      template_id: values.template_id,
      channel: values.channel,
      recipient_email: values.channel === "email" ? values.recipient_email : undefined,
      subject: values.channel === "email" && values.subject ? values.subject : undefined,
      variables: undefined,
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

        {resolvedBody && (
          <div className="rounded-md border bg-muted/40 px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Предпросмотр сообщения
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{resolvedBody}</p>
            {hasVars && !debtCase && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Переменные будут подставлены при отправке
              </p>
            )}
          </div>
        )}

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
