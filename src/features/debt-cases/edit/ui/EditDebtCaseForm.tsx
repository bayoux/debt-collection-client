"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import { userApi } from "@/entities/user/api/user-api"
import type { DebtCase } from "@/entities/debt-case/model/types"
import { statusLabels } from "@/entities/debt-case/model/status"
import type { DebtCaseStatus } from "@/entities/debt-case/model/types"
import { Button } from "@/shared/components/ui/button"
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
  status:            z.enum(["new", "in_progress", "promised", "closed", "overdue"] as const),
  assigned_agent_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  debtCase: DebtCase
  queryKey: unknown[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditDebtCaseForm({ debtCase, queryKey, onSuccess, onCancel }: Props) {
  const qc = useQueryClient()

  const { data: agents } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => userApi.list({ page_size: 100 }),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof debtCaseApi.update>[1]) =>
      debtCaseApi.update(debtCase.id, data),
    onSuccess: () => {
      toast.success("Дело обновлено")
      qc.invalidateQueries({ queryKey })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось обновить дело"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      status:            debtCase.status,
      assigned_agent_id: debtCase.assigned_agent?.id ?? "__none__",
    },
  })

  function onSubmit(values: FormValues) {
    mutate({
      status:            values.status,
      assigned_agent_id: values.assigned_agent_id === "__none__" ? null : values.assigned_agent_id,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Статус</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.entries(statusLabels) as [DebtCaseStatus, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
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
                  <SelectItem value="__none__">Не назначен</SelectItem>
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
