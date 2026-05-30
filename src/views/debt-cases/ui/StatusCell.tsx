"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckIcon, ChevronDownIcon, LoaderIcon } from "lucide-react"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import type { DebtCase, DebtCaseStatus } from "@/entities/debt-case/model/types"
import type { Pagination } from "@/shared/types/pagination"
import { Badge } from "@/shared/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { statusLabels, statusStyles } from "@/entities/debt-case/model/status"

const ALL_STATUSES = Object.keys(statusLabels) as DebtCaseStatus[]

interface Props {
  caseId: string
  status: DebtCaseStatus
  queryKey: unknown[]
}

export function StatusCell({ caseId, status, queryKey }: Props) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (next: DebtCaseStatus) =>
      debtCaseApi.update(caseId, { status: next }),

    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<Pagination<DebtCase>>(queryKey)
      queryClient.setQueryData<Pagination<DebtCase>>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          results: old.results.map((c) =>
            c.id === caseId ? { ...c, status: next } : c
          ),
        }
      })
      setOpen(false)
      return { prev }
    },

    onSuccess: (_data, next) => {
      toast.success(`Статус изменён: ${statusLabels[next]}`)
    },

    onError: (_err, _next, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
      toast.error("Не удалось изменить статус")
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="group flex items-center gap-0.5 rounded transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Изменить статус"
        >
          <Badge variant="outline" className={statusStyles[status]}>
            {mutation.isPending ? (
              <LoaderIcon className="size-3 animate-spin" />
            ) : null}
            {statusLabels[status]}
          </Badge>
          <ChevronDownIcon className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-40 p-1" align="start" side="bottom">
        <div className="flex flex-col gap-0.5">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
              onClick={() => mutation.mutate(s)}
              disabled={mutation.isPending || s === status}
            >
              <Badge variant="outline" className={`${statusStyles[s]} text-xs`}>
                {statusLabels[s]}
              </Badge>
              {s === status && <CheckIcon className="size-3.5 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
