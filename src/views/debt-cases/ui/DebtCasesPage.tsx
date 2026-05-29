"use client"

import { useState } from "react"
import Link from "next/link"
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

const statusLabels: Record<DebtCaseStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  promised: "Обещано",
  closed: "Закрыто",
  overdue: "Просрочено",
}

const statusStyles: Record<DebtCaseStatus, string> = {
  new: "border-slate-200 bg-slate-50 text-slate-600",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  promised: "border-amber-200 bg-amber-50 text-amber-700",
  closed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
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

export function DebtCasesPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<DebtCaseStatus | "all">("all")
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["debt-cases", page, status],
    queryFn: () =>
      debtCaseApi.list({
        page,
        page_size: 20,
        status: status === "all" ? undefined : status,
      }),
  })

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
          onValueChange={(v) => {
            setStatus(v as DebtCaseStatus | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                    <Badge variant="outline" className={statusStyles[c.status]}>
                      {statusLabels[c.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > 20 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.previous}>
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">Страница {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!data.next}>
            Вперёд
          </Button>
        </div>
      )}
    </div>
  )
}
