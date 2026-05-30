"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon, SearchIcon, XIcon, ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import { statusLabels, statusStyles } from "@/entities/debt-case/model/status"
import type { DebtCaseStatus } from "@/entities/debt-case/model/types"
import { CreateDebtCaseForm } from "@/features/debt-cases/create/ui/CreateDebtCaseForm"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
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

// ─── types ────────────────────────────────────────────────────────────────────

type SortKey = "amount" | "dpd" | "due_date"
type SortDir = "asc" | "desc"

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDownIcon className="ml-1 inline size-3.5 text-muted-foreground/40" />
  return sortDir === "asc"
    ? <ArrowUpIcon className="ml-1 inline size-3.5 text-foreground" />
    : <ArrowDownIcon className="ml-1 inline size-3.5 text-foreground" />
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function DebtCasesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [inputValue, setInputValue] = useState(() => searchParams.get("search") ?? "")
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const page   = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const status = (searchParams.get("status") as DebtCaseStatus | "all") ?? "all"
  const searchFromUrl = searchParams.get("search") ?? ""

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

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, 400)
  }

  function clearSearch() {
    setInputValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const queryKey = ["debt-cases", page, status, searchFromUrl]

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      debtCaseApi.list({
        page,
        page_size: 20,
        status: status === "all" ? undefined : status,
        search: searchFromUrl || undefined,
      }),
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  const sortedResults = data?.results
    ? [...data.results].sort((a, b) => {
        if (!sortKey) return 0
        let av: number, bv: number
        if (sortKey === "amount") { av = a.amount; bv = b.amount }
        else if (sortKey === "dpd") { av = a.dpd; bv = b.dpd }
        else { av = new Date(a.due_date).getTime(); bv = new Date(b.due_date).getTime() }
        return sortDir === "asc" ? av - bv : bv - av
      })
    : data?.results

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

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1 sm:flex-none sm:w-64">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по должнику..."
            className="pl-8 pr-8"
            value={inputValue}
            onChange={handleSearchChange}
          />
          {inputValue && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Очистить поиск"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <Select value={status} onValueChange={(v) => setParam("status", v)}>
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
              <TableHead>
                <button
                  className="flex items-center font-medium hover:text-foreground"
                  onClick={() => toggleSort("amount")}
                >
                  Сумма
                  <SortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-medium hover:text-foreground"
                  onClick={() => toggleSort("dpd")}
                >
                  DPD
                  <SortIcon col="dpd" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-medium hover:text-foreground"
                  onClick={() => toggleSort("due_date")}
                >
                  Дата погашения
                  <SortIcon col="due_date" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
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
            ) : sortedResults?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {searchFromUrl ? `Ничего не найдено по «${searchFromUrl}»` : "Дела не найдены"}
                </TableCell>
              </TableRow>
            ) : (
              sortedResults?.map((c) => (
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
