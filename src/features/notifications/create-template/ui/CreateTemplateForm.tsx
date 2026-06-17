"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationApi } from "@/entities/notification/api/notification-api"
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
  name: z.string().min(2, "Минимум 2 символа"),
  channel: z.enum(["chat2desk", "sms", "telegram", "email"]),
  subject: z.string().optional(),
  body: z.string().min(5, "Введите текст шаблона"),
  language: z.string().default("ru"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function CreateTemplateForm({ onSuccess }: Props) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: notificationApi.templates.create,
    onSuccess: (t) => {
      toast.success("Шаблон создан", { description: t.name })
      qc.invalidateQueries({ queryKey: ["notification-templates"] })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось создать шаблон"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: "", channel: "sms", subject: "", body: "", language: "ru" },
  })

  const channel = form.watch("channel")

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) =>
          mutate({ ...v, subject: v.subject || undefined })
        )}
        className="space-y-4"
      >
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
                  className="min-h-30"
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
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Сохраняем..." : "Создать шаблон"}
        </Button>
      </form>
    </Form>
  )
}
