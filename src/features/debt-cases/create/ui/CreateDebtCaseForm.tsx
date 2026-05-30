"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import { debtorApi } from "@/entities/debtor/api/debtor-api"
import { userApi } from "@/entities/user/api/user-api"
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
  debtor_id: z.string().min(1, "Выберите должника"),
  assigned_agent_id: z.string().optional(),
  amount: z.coerce.number().positive("Введите сумму"),
  due_date: z.string().min(1, "Выберите дату"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function CreateDebtCaseForm({ onSuccess }: Props) {
  const qc = useQueryClient()
  const { data: debtors } = useQuery({
    queryKey: ["debtors", "all"],
    queryFn: () => debtorApi.list({ page_size: 100 }),
  })
  const { data: agents } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => userApi.list({ page_size: 100 }),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: debtCaseApi.create,
    onSuccess: (c) => {
      toast.success("Дело создано", {
        description: `${c.debtor.full_name} — ${c.amount.toLocaleString("ru-RU")} сом`,
      })
      qc.invalidateQueries({ queryKey: ["debt-cases"] })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось создать дело"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { debtor_id: "", assigned_agent_id: "", amount: 0, due_date: "" },
  })

  function onSubmit(values: FormValues) {
    mutate({
      debtor_id: values.debtor_id,
      assigned_agent_id: values.assigned_agent_id || null,
      amount: values.amount,
      due_date: values.due_date,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="debtor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Должник *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите должника" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {debtors?.results.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name} — {d.phone}
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
          name="assigned_agent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Агент</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Не назначен" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agents?.results.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.username}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сумма долга (сом) *</FormLabel>
              <FormControl>
                <Input type="number" placeholder="15000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата погашения *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Создаём..." : "Создать дело"}
        </Button>
      </form>
    </Form>
  )
}
