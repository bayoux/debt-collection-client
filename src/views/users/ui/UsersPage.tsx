"use client"

import { useState, useRef, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  PlusIcon,
  Trash2Icon,
  SearchIcon,
  UsersIcon,
  ShieldIcon,
  XIcon,
  PencilIcon,
  ChevronRightIcon,
} from "lucide-react"
import { userApi } from "@/entities/user/api/user-api"
import type { User } from "@/entities/user/model/types"
import { CreateUserForm } from "@/features/users/create/ui/CreateUserForm"
import { EditUserForm } from "@/features/users/edit/ui/EditUserForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Input } from "@/shared/components/ui/input"
import { QueryError } from "@/shared/components/ui/query-error"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"

// ─── role colors ──────────────────────────────────────────────────────────────

const rolePalette = [
  "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
  "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
]

const avatarBg = [
  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
]

function hashStr(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function roleColor(name: string) { return rolePalette[hashStr(name) % rolePalette.length] }
function avatarColor(name: string) { return avatarBg[hashStr(name) % avatarBg.length] }

function getInitials(username: string) {
  const parts = username.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return username.slice(0, 2).toUpperCase()
}

// ─── UserSheet ────────────────────────────────────────────────────────────────

function UserSheet({
  user,
  open,
  onClose,
  onDeleted,
}: {
  user: User | null
  open: boolean
  onClose: () => void
  onDeleted: () => void
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [current, setCurrent] = useState<User | null>(user)

  if (user && user !== current && !editing) setCurrent(user)

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: () => userApi.delete(current!.id),
    onSuccess: () => {
      toast.success("Пользователь удалён", { description: current?.username })
      qc.invalidateQueries({ queryKey: ["users"] })
      setConfirmDelete(false)
      onDeleted()
    },
    onError: () => toast.error("Не удалось удалить пользователя"),
  })

  if (!current) return null

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) { setEditing(false); onClose() } }}>
        <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b p-5 pr-12">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-12 shrink-0">
                  <AvatarFallback className={`text-sm font-semibold ${avatarColor(current.username)}`}>
                    {getInitials(current.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{current.username}</SheetTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{current.email}</p>
                </div>
              </div>
              {!editing && (
                <div className="flex shrink-0 items-center gap-1 pt-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setEditing(true)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          {editing ? (
            <div className="p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Редактировать
              </p>
              <EditUserForm
                user={current}
                onSuccess={() => { qc.invalidateQueries({ queryKey: ["users"] }); setEditing(false) }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Info */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Аккаунт
                </p>
                <div className="divide-y rounded-lg border">
                  <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground">Логин</span>
                    <span className="font-medium">{current.username}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground">Email</span>
                    <span className="font-medium truncate">{current.email}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground">Создан</span>
                    <span className="text-muted-foreground">
                      {new Date(current.created_at).toLocaleDateString("ru-RU", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Роли
                </p>
                {current.roles.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-muted-foreground">
                    <ShieldIcon className="size-3.5" />
                    Нет назначенных ролей
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {current.roles.map((role) => (
                      <Badge key={role.id} variant="outline" className={roleColor(role.name)}>
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить пользователя?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Пользователь{" "}
            <span className="font-medium text-foreground">{current.username}</span>{" "}
            будет удалён без возможности восстановления.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => deleteUser()}
            >
              {isDeleting ? "Удаляем..." : "Удалить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export function UsersPage() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  const [page, setPage] = useState(1)
  const [inputValue, setInputValue] = useState(() => searchParams.get("search") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchFromUrl = searchParams.get("search") ?? ""

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInputValue(value)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set("search", value)
      else params.delete("search")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, 350)
  }

  function clearSearch() {
    setInputValue("")
    setPage(1)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Load all users at once for client-side filtering (admin panel, typically <500 users)
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.list({ page_size: 9999 }),
  })

  const filtered = useMemo(() => {
    if (!data?.results) return []
    if (!searchFromUrl.trim()) return data.results
    const q = searchFromUrl.toLowerCase()
    return data.results.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [data?.results, searchFromUrl])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Пользователи</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? searchFromUrl
                ? `${filtered.length} из ${data.count}`
                : `Всего: ${data.count}`
              : "Загрузка..."}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-1.5 size-3.5" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый пользователь</DialogTitle>
            </DialogHeader>
            <CreateUserForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={handleSearchChange}
          placeholder="Поиск по логину или email..."
          className="pl-8 h-9 text-sm"
        />
        {inputValue && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
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
              <TableHead>Пользователь</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роли</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-8 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              ))
            ) : pageSlice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <UsersIcon className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {searchFromUrl ? "Ничего не найдено" : "Пользователи не найдены"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {searchFromUrl ? "Попробуйте изменить запрос" : "Добавьте первого пользователя"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageSlice.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer transition-colors duration-150 hover:bg-primary/5"
                  onClick={() => setSelected(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className={`text-[10px] font-semibold ${avatarColor(user.username)}`}>
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShieldIcon className="size-3" /> Нет ролей
                        </span>
                      ) : (
                        user.roles.map((role) => (
                          <Badge key={role.id} variant="outline" className={`text-xs ${roleColor(role.name)}`}>
                            {role.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("ru-RU", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <ChevronRightIcon className="size-4 text-muted-foreground/40" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Страница {safePage} из {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              Назад
            </Button>
            {totalPages <= 7 &&
              Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "outline"}
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
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}

      {/* ── User sheet ─────────────────────────────────────────────────── */}
      <UserSheet
        user={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onDeleted={() => setSelected(null)}
      />
    </div>
  )
}
