"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { NotificationTemplate } from "@/entities/notification/model/types"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/shared/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

const schema = z.object({
  name:     z.string().min(2, "Минимум 2 символа"),
  channel:  z.enum(["chat2desk", "sms", "telegram", "email", "whatsapp"]),
  subject:  z.string().optional(),
  body:     z.string().min(5, "Введите текст шаблона"),
  language: z.string().default("ru"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  template: NotificationTemplate
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditTemplateForm({ template, onSuccess, onCancel }: Props) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) =>
      notificationApi.templates.update(template.id, {
        ...data,
        subject: data.subject || undefined,
      }),
    onSuccess: (t) => {
      toast.success("Шаблон обновлён", { description: t.name })
      qc.invalidateQueries({ queryKey: ["notification-templates"] })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось обновить шаблон"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name:     template.name,
      channel:  template.channel as FormValues["channel"],
      subject:  template.subject ?? "",
      body:     template.body,
      language: template.language ?? "ru",
    },
  })

  const channel = form.watch("channel")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название *</FormLabel>
              <FormControl>
                <Input placeholder="Напоминание DPD 1-7 дней" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  <SelectItem value="chat2desk">Chat2Desk (WhatsApp)</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {channel === "email" && (
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тема письма</FormLabel>
                <FormControl>
                  <Input placeholder="Уведомление о задолженности" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Текст шаблона *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Уважаемый {{full_name}}, у вас задолженность {{amount}} сом."
                  className="min-h-36"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Авто: {`{{full_name}}, {{phone}}, {{email}}, {{amount}}, {{due_date}}, {{dpd}}, {{status}}, {{promise_date}}, {{promised_amount}}`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
