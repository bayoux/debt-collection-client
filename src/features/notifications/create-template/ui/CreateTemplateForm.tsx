"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
  channel: z.enum(["whatsapp", "sms", "telegram", "email"]),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-templates"] })
      onSuccess?.()
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: "", channel: "sms", body: "", language: "ru" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => mutate(v))}
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
                Переменные: {`{{full_name}}, {{amount}}, {{due_date}}`}
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
