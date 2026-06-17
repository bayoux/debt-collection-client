"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { debtorApi } from "@/entities/debtor/api/debtor-api"
import type { Debtor } from "@/entities/debtor/model/types"
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

const schema = z.object({
  full_name: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().min(5, "Введите телефон"),
  email: z.string().email("Неверный email").optional().or(z.literal("")),
  whatsapp_number: z.string().optional(),
  telegram_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  debtor: Debtor
  onSuccess?: (updated: Debtor) => void
  onCancel?: () => void
}

export function EditDebtorForm({ debtor, onSuccess, onCancel }: Props) {
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof debtorApi.update>[1]) =>
      debtorApi.update(debtor.id, data),
    onSuccess: (updated) => {
      toast.success("Данные обновлены", { description: updated.full_name })
      qc.invalidateQueries({ queryKey: ["debtors"] })
      onSuccess?.(updated)
    },
    onError: () => toast.error("Не удалось обновить должника"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name:       debtor.full_name,
      phone:           debtor.phone,
      email:           debtor.email ?? "",
      whatsapp_number: debtor.whatsapp_number ?? "",
      telegram_id:     debtor.telegram_id ?? "",
    },
  })

  function onSubmit(values: FormValues) {
    mutate({
      full_name:       values.full_name,
      phone:           values.phone,
      email:           values.email || undefined,
      whatsapp_number: values.whatsapp_number || undefined,
      telegram_id:     values.telegram_id || undefined,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ФИО *</FormLabel>
              <FormControl>
                <Input placeholder="Иванов Иван Иванович" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Телефон *</FormLabel>
              <FormControl>
                <Input placeholder="+996700123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatsapp_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <Input placeholder="+996700123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telegram_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram ID</FormLabel>
              <FormControl>
                <Input placeholder="@username или ID" {...field} />
              </FormControl>
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
