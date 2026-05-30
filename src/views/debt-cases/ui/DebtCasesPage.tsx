"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import type { DebtCaseStatus } from "@/entities/debt-case/model/types"
import { CreateDebtCaseForm } from "@/features/debt-cases/create/ui/CreateDebtCaseForm"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { QueryError } from "@/shared/components/ui/query-error"
import { StatusCell } from "./StatusCell"

// ─── config ───────────────────────────────────────────────────────────────────

const statusLabels: Record<DebtCaseStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  promised: "Обещано",
  closed: "Закрыто",
  overdue: "Просрочено",
}

export const statusStyles: Record<DebtCaseStatus, string> = {
  new:         "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  promised:    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  closed:      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  overdue:     "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
}

function getDpdStyle(dpd: number): string {
  if (dpd > 60) return "text-destructive font-bold"
  if (dpd > 30) return "text-orange-500 font-semibold"
  if (dpd > 14) return "text-amber-500 font-medium"
  return "text-muted-foreground"
}

function DueDateCell({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr + "T00:00:00")
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86_400_000)

  const formatted = date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <div>
      <div className="text-sm">{formatted}</div>
      {diffDays < 0 && (
        <div className="text-[11px] font-medium text-destructive">
          просрочено {Math.abs(diffDays)} дн.
        </div>
      )}
      {diffDays === 0 && (
        <div className="text-[11px] font-medium text-amber-500">сегодня</div>
      )}
      {diffDays > 0 && diffDays <= 14 && (
        <div className="text-[11px] text-muted-foreground">через {diffDays} дн.</div>
      )}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function DebtCasesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)

  const page   = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const status = (searchParams.get("status") as DebtCaseStatus | "all") ?? "all"

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    if (key !== "page") params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 1) {
      params.delete("page")
    } else {
      params.set("page", String(next))
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const queryKey = ["debt-cases", page, status]

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      debtCaseApi.list({
        page,
        page_size: 20,
        status: status === "all" ? undefined : status,
      }),
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Дела о задолженности</h1>
          <p className="text-muted-foreground">
            {data ? `Всего: ${data.count}` : "Загрузка..."}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1.5 size-4" />
              Создать дело
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новое дело</DialogTitle>
            </DialogHeader>
            <CreateDebtCaseForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Select
          value={status}
          onValueChange={(v) => setParam("status", v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <Badge variant="outline" className={statusStyles[value as DebtCaseStatus]}>
                  {label}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Должник</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>DPD</TableHead>
              <TableHead>Дата погашения</TableHead>
              <TableHead>Агент</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Дела не найдены
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer transition-colors duration-150 hover:bg-primary/5"
                >
                  <TableCell>
                    <Link
                      href={`/debt-cases/${c.id}`}
                      className="font-medium transition-colors hover:text-primary hover:underline"
                    >
                      {c.debtor.full_name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.debtor.phone}</div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {c.amount.toLocaleString("ru-RU")}
                    <span className="ml-0.5 text-xs text-muted-foreground">сом</span>
                  </TableCell>
                  <TableCell>
                    <span className={getDpdStyle(c.dpd)}>{c.dpd}</span>
                  </TableCell>
                  <TableCell>
                    <DueDateCell dateStr={c.due_date} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.assigned_agent?.username ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusCell caseId={c.id} status={c.status} queryKey={queryKey} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > 20 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!data.previous}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={!data.next}
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  )
}
