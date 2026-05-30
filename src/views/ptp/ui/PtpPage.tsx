"use client"

import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  CircleCheckIcon,
  CircleXIcon,
  HandshakeIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react"
import { ptpApi } from "@/entities/ptp/api/ptp-api"
import type { PTPStatus, PTPRecord } from "@/entities/ptp/model/types"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { QueryError } from "@/shared/components/ui/query-error"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Skeleton } from "@/shared/components/ui/skeleton"

// ─── constants ────────────────────────────────────────────────────────────────

const statusConfig: Record<PTPStatus, { label: string; cls: string }> = {
  pending: {
    label: "Ожидает",
    cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  kept: {
    label: "Выполнено",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  broken: {
    label: "Нарушено",
    cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
}

const FILTERS: { value: PTPStatus | "all"; label: string; icon: LucideIcon }[] = [
  { value: "all",     label: "Все",       icon: HandshakeIcon    },
  { value: "pending", label: "Ожидает",   icon: ClockIcon        },
  { value: "kept",    label: "Выполнено", icon: CheckCircle2Icon },
  { value: "broken",  label: "Нарушено",  icon: XCircleIcon      },
]

// ─── sub-components ───────────────────────────────────────────────────────────

function AgentAvatar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase()
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {initials}
    </div>
  )
}

function PromiseDateCell({
  dateStr,
  status,
}: {
  dateStr: string
  status: PTPStatus
}) {
  const date = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000)
  const formatted = date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <div>
      <div className="text-sm">{formatted}</div>
      {status === "pending" && (
        <>
          {diff < 0 && (
            <div className="mt-0.5 text-[11px] font-medium text-destructive">
              просрочено {Math.abs(diff)} дн.
            </div>
          )}
          {diff === 0 && (
            <div className="mt-0.5 text-[11px] font-medium text-amber-500">
              сегодня
            </div>
          )}
          {diff > 0 && diff <= 7 && (
            <div className="mt-0.5 text-[11px] text-amber-500">
              через {diff} дн.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RowActions({
  ptp,
  onUpdate,
}: {
  ptp: PTPRecord
  onUpdate: (id: string, status: "kept" | "broken") => void
}) {
  if (ptp.status !== "pending") {
    return (
      <div className="flex items-center gap-1.5">
        {ptp.status === "kept" ? (
          <CheckCircle2Icon className="size-4 text-emerald-500" />
        ) : (
          <XCircleIcon className="size-4 text-destructive" />
        )}
        <span className="text-xs text-muted-foreground">
          {ptp.status === "kept" ? "Выполнено" : "Нарушено"}
        </span>
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
        onClick={() => onUpdate(ptp.id, "kept")}
      >
        <CircleCheckIcon className="size-3.5" />
        Выполнено
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-destructive hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-300"
        onClick={() => onUpdate(ptp.id, "broken")}
      >
        <CircleXIcon className="size-3.5" />
        Нарушено
      </Button>
    </div>
  )
}

function EmptyState({ status }: { status: PTPStatus | "all" }) {
  const label =
    status === "all"
      ? "Обещаний нет"
      : `Нет обещаний со статусом «${statusConfig[status as PTPStatus]?.label ?? status}»`
  return (
    <TableRow>
      <TableCell colSpan={5}>
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <HandshakeIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            Обещания создаются со страницы дела
          </p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function PtpPage() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const qc           = useQueryClient()

  const page   = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const status = (searchParams.get("status") ?? "all") as PTPStatus | "all"

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") {
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
    onSuccess: (_, { status }) => {
      toast.success(status === "kept" ? "PTP выполнено" : "PTP нарушено")
      qc.invalidateQueries({ queryKey: ["ptp"] })
    },
    onError: () => toast.error("Не удалось обновить статус PTP"),
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Обещания об оплате</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.count.toLocaleString("ru-RU")} записей` : "Загрузка..."}
          </p>
        </div>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-1">
        {FILTERS.map(({ value, label, icon: Icon }) => {
          const active = status === value
          return (
            <button
              key={value}
              onClick={() => setParam("status", value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              {active && data && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                  {data.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Агент</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Дата обещания</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-32" /></TableCell>
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <EmptyState status={status} />
            ) : (
              data?.results.map((ptp) => (
                <TableRow
                  key={ptp.id}
                  className="transition-colors duration-150 hover:bg-primary/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AgentAvatar username={ptp.agent.username} />
                      <div>
                        <div className="text-sm font-medium">{ptp.agent.username}</div>
                        <Link
                          href={`/debt-cases/${ptp.debt_case_id}`}
                          className="text-[11px] text-muted-foreground hover:text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Дело #{ptp.debt_case_id.slice(0, 8)}
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {ptp.promised_amount.toLocaleString("ru-RU")}
                    <span className="ml-0.5 text-xs text-muted-foreground">сом</span>
                  </TableCell>
                  <TableCell>
                    <PromiseDateCell
                      dateStr={ptp.promise_date}
                      status={ptp.status}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusConfig[ptp.status].cls}
                    >
                      {statusConfig[ptp.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RowActions
                      ptp={ptp}
                      onUpdate={(id, s) => updateStatus({ id, status: s })}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {data && data.count > 20 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Страница {page} из {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={!data.previous}
            >
              Назад
            </Button>
            {totalPages <= 7 &&
              Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="w-8"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!data.next}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
