"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  PlusIcon,
  UploadIcon,
  SearchIcon,
  XIcon,
  UsersIcon,
  PhoneIcon,
  MailIcon,
  MessageCircleIcon,
  SendIcon,
} from "lucide-react"
import { debtorApi } from "@/entities/debtor/api/debtor-api"
import type { Debtor } from "@/entities/debtor/model/types"
import { CreateDebtorForm } from "@/features/debtors/create/ui/CreateDebtorForm"
import { ImportDebtorsForm } from "@/features/debtors/import/ui/ImportDebtorsForm"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { QueryError } from "@/shared/components/ui/query-error"

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {getInitials(name)}
    </div>
  )
}

function ChannelBadges({ debtor }: { debtor: Debtor }) {
  const channels = [
    {
      active: !!debtor.whatsapp_number,
      icon: MessageCircleIcon,
      label: "WhatsApp",
      cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    },
    {
      active: !!debtor.telegram_id,
      icon: SendIcon,
      label: "Telegram",
      cls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    },
    {
      active: !!debtor.email,
      icon: MailIcon,
      label: "Email",
      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    },
  ]

  const active = channels.filter((c) => c.active)
  if (!active.length)
    return <span className="text-sm text-muted-foreground">—</span>

  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map(({ icon: Icon, label, cls }) => (
        <span
          key={label}
          title={label}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
        >
          <Icon className="size-3" />
          {label}
        </span>
      ))}
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <TableRow>
      <TableCell colSpan={4}>
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <UsersIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {query ? `Ничего не найдено по «${query}»` : "Должники не найдены"}
          </p>
          <p className="text-xs text-muted-foreground">
            {query
              ? "Попробуйте другой запрос"
              : "Добавьте первого должника или импортируйте список"}
          </p>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function DebtorsPage() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const page          = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const searchFromUrl = searchParams.get("search") ?? ""

  const [inputValue, setInputValue] = useState(() => searchFromUrl)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    queryKey: ["debtors", page, searchFromUrl],
    queryFn: () =>
      debtorApi.list({ page, page_size: 20, search: searchFromUrl }),
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 1

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Должники</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.count.toLocaleString("ru-RU")} записей`
              : "Загрузка..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UploadIcon className="mr-1.5 size-3.5" />
                Импорт
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Импорт должников</DialogTitle>
              </DialogHeader>
              <ImportDebtorsForm onSuccess={() => setImportOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="mr-1.5 size-3.5" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый должник</DialogTitle>
              </DialogHeader>
              <CreateDebtorForm onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по ФИО или телефону..."
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

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Должник</TableHead>
              <TableHead>
                <span className="flex items-center gap-1.5">
                  <MailIcon className="size-3.5" />
                  Email
                </span>
              </TableHead>
              <TableHead>Каналы</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-3.5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <EmptyState query={searchFromUrl} />
            ) : (
              data?.results.map((debtor) => (
                <TableRow
                  key={debtor.id}
                  className="transition-colors duration-150 hover:bg-primary/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={debtor.full_name} />
                      <div className="min-w-0">
                        <div className="font-medium">{debtor.full_name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <PhoneIcon className="size-3 shrink-0" />
                          <span className="tabular-nums">{debtor.phone}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {debtor.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <ChannelBadges debtor={debtor} />
                  </TableCell>
                  <TableCell />
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
