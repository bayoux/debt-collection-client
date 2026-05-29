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

const statusVariants: Record<DebtCaseStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "secondary",
  in_progress: "default",
  promised: "outline",
  closed: "outline",
  overdue: "destructive",
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
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/debt-cases/${c.id}`} className="font-medium hover:underline">
                      {c.debtor.full_name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.debtor.phone}</div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {c.amount.toLocaleString("ru-RU")} сом
                  </TableCell>
                  <TableCell>
                    <span className={c.dpd > 30 ? "text-destructive font-medium" : ""}>
                      {c.dpd}
                    </span>
                  </TableCell>
                  <TableCell>{c.due_date}</TableCell>
                  <TableCell>{c.assigned_agent?.username ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[c.status]}>
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
