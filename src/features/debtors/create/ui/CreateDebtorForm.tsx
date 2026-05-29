"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { debtorApi } from "@/entities/debtor/api/debtor-api"
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
  onSuccess?: () => void
}

export function CreateDebtorForm({ onSuccess }: Props) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: debtorApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debtors"] })
      onSuccess?.()
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      whatsapp_number: "",
      telegram_id: "",
    },
  })

  function onSubmit(values: FormValues) {
    mutate({
      full_name: values.full_name,
      phone: values.phone,
      email: values.email || undefined,
      whatsapp_number: values.whatsapp_number || undefined,
      telegram_id: values.telegram_id || undefined,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Сохраняем..." : "Создать должника"}
        </Button>
      </form>
    </Form>
  )
}
