"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationApi } from "@/entities/notification/api/notification-api"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
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
  debt_case_id: z.string().min(1, "Выберите дело"),
  template_id: z.string().min(1, "Выберите шаблон"),
  channel: z.enum(["chat2desk", "sms", "telegram", "email"]),
  scheduled_at: z.string().min(1, "Укажите дату и время"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function CreateScheduledTaskForm({ onSuccess }: Props) {
  const qc = useQueryClient()
  const { data: cases } = useQuery({
    queryKey: ["debt-cases", "all"],
    queryFn: () => debtCaseApi.list({ page_size: 100 }),
  })
  const { data: templates } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => notificationApi.templates.list(),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: notificationApi.scheduler.create,
    onSuccess: (task) => {
      const at = new Date(task.scheduled_at).toLocaleString("ru-RU", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })
      toast.success("Рассылка запланирована", { description: at })
      qc.invalidateQueries({ queryKey: ["scheduled-tasks"] })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось запланировать рассылку"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { debt_case_id: "", template_id: "", channel: "sms", scheduled_at: "" },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="debt_case_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дело *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите дело" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cases?.results.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.debtor.full_name} — {c.amount.toLocaleString("ru-RU")} сом
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
        <FormField
          control={form.control}
          name="scheduled_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Время отправки *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Планируем..." : "Запланировать"}
        </Button>
      </form>
    </Form>
  )
}
