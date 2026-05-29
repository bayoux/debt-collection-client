"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon, UploadIcon, SearchIcon } from "lucide-react"
import { debtorApi } from "@/entities/debtor/api/debtor-api"
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
import { Badge } from "@/shared/components/ui/badge"
import { QueryError } from "@/shared/components/ui/query-error"

export function DebtorsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["debtors", page, debouncedSearch],
    queryFn: () => debtorApi.list({ page, page_size: 20, search: debouncedSearch }),
  })

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setTimeout(() => setDebouncedSearch(e.target.value), 400)
  }

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Должники</h1>
          <p className="text-muted-foreground">
            {data ? `Всего: ${data.count}` : "Загрузка..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UploadIcon className="mr-1.5 size-4" />
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
              <Button>
                <PlusIcon className="mr-1.5 size-4" />
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

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по ФИО или телефону..."
          className="pl-8"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Telegram</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Должники не найдены
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((debtor) => (
                <TableRow
                  key={debtor.id}
                  className="transition-colors duration-150 hover:bg-primary/5"
                >
                  <TableCell className="font-medium">{debtor.full_name}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {debtor.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {debtor.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    {debtor.whatsapp_number ? (
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-green-700"
                      >
                        ✓ {debtor.whatsapp_number}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {debtor.telegram_id ? (
                      <Badge
                        variant="outline"
                        className="border-sky-200 bg-sky-50 text-sky-700"
                      >
                        {debtor.telegram_id}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.previous}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.next}
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  )
}
