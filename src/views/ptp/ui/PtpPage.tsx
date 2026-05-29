"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleCheckIcon, CircleXIcon } from "lucide-react"
import { ptpApi } from "@/entities/ptp/api/ptp-api"
import type { PTPStatus } from "@/entities/ptp/model/types"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { QueryError } from "@/shared/components/ui/query-error"
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
import { Skeleton } from "@/shared/components/ui/skeleton"

const statusLabels: Record<PTPStatus, string> = {
  pending: "Ожидает",
  kept: "Выполнено",
  broken: "Нарушено",
}

const statusVariants: Record<PTPStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  kept: "default",
  broken: "destructive",
}

export function PtpPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<PTPStatus | "all">("all")

  const { data, isLoading, error } = useQuery({
    queryKey: ["ptp", page, status],
    queryFn: () =>
      ptpApi.list({
        page,
        page_size: 20,
        status: status === "all" ? undefined : status,
      }),
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "kept" | "broken" }) =>
      ptpApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ptp"] }),
  })

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Обещания об оплате (PTP)</h1>
          <p className="text-muted-foreground">
            {data ? `Всего: ${data.count}` : "Загрузка..."}
          </p>
        </div>
      </div>

      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v as PTPStatus | "all")
          setPage(1)
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          {Object.entries(statusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Агент</TableHead>
              <TableHead>Обещанная сумма</TableHead>
              <TableHead>Дата обещания</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Нет обещаний
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((ptp) => (
                <TableRow key={ptp.id}>
                  <TableCell>{ptp.agent.username}</TableCell>
                  <TableCell className="font-mono">
                    {ptp.promised_amount.toLocaleString("ru-RU")} сом
                  </TableCell>
                  <TableCell>{ptp.promise_date}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[ptp.status]}>
                      {statusLabels[ptp.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ptp.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-green-600"
                          onClick={() => updateStatus({ id: ptp.id, status: "kept" })}
                        >
                          <CircleCheckIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() => updateStatus({ id: ptp.id, status: "broken" })}
                        >
                          <CircleXIcon className="size-4" />
                        </Button>
                      </div>
                    )}
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
