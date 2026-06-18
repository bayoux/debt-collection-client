"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ptpApi } from "@/entities/ptp/api/ptp-api"
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
  promise_date: z.string().min(1, "Выберите дату"),
  promised_amount: z.coerce.number().positive("Введите сумму"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  debtCaseId?: string
  onSuccess?: () => void
}

export function CreatePtpForm({ debtCaseId, onSuccess }: Props) {
  const qc = useQueryClient()

  const { data: cases } = useQuery({
    queryKey: ["debt-cases-select"],
    queryFn: () => debtCaseApi.list({ page_size: 200, status: "in_progress" }),
    enabled: !debtCaseId,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: ptpApi.create,
    onSuccess: (ptp) => {
      const date = new Date(ptp.promise_date).toLocaleDateString("ru-RU", {
        day: "numeric", month: "long",
      })
      toast.success("PTP зафиксировано", {
        description: `${ptp.promised_amount.toLocaleString("ru-RU")} сом · ${date}`,
      })
      qc.invalidateQueries({ queryKey: ["ptp"] })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось зафиксировать PTP"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      debt_case_id: debtCaseId ?? "",
      promise_date: "",
      promised_amount: 0,
    },
  })

  function onSubmit(values: FormValues) {
    mutate({
      debt_case_id: values.debt_case_id,
      promise_date: values.promise_date,
      promised_amount: values.promised_amount,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!debtCaseId && (
          <FormField
            control={form.control}
            name="debt_case_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дело *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите дело..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cases?.results.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="font-medium">{c.debtor.full_name}</span>
                        <span className="ml-2 text-muted-foreground">
                          {c.amount.toLocaleString("ru-RU")} сом
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="promise_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата обещания *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="promised_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Обещанная сумма (сом) *</FormLabel>
              <FormControl>
                <Input type="number" placeholder="5000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Сохраняем..." : "Зафиксировать PTP"}
        </Button>
      </form>
    </Form>
  )
}
