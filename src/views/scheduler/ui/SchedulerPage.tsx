"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, CircleXIcon } from "lucide-react"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { ScheduledTaskStatus } from "@/entities/notification/model/types"
import { CreateScheduledTaskForm } from "@/features/scheduler/create-task/ui/CreateScheduledTaskForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { QueryError } from "@/shared/components/ui/query-error"
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
import { Skeleton } from "@/shared/components/ui/skeleton"

const statusLabels: Record<ScheduledTaskStatus, string> = {
  pending: "Ожидает",
  sent: "Отправлено",
  cancelled: "Отменено",
  failed: "Ошибка",
}

const statusVariants: Record<ScheduledTaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  sent: "default",
  cancelled: "outline",
  failed: "destructive",
}

export function SchedulerPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [taskStatus, setTaskStatus] = useState<ScheduledTaskStatus | "all">("all")
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["scheduled-tasks", page, taskStatus],
    queryFn: () =>
      notificationApi.scheduler.list({
        page,
        page_size: 20,
        task_status: taskStatus === "all" ? undefined : taskStatus,
      }),
  })

  const { mutate: cancelTask } = useMutation({
    mutationFn: notificationApi.scheduler.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled-tasks"] }),
  })

  return (
    <div className="space-y-4">
      {error && <QueryError error={error} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Расписание рассылок</h1>
          <p className="text-muted-foreground">
            {data ? `Всего: ${data.count}` : "Загрузка..."}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1.5 size-4" />
              Запланировать
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая задача рассылки</DialogTitle>
            </DialogHeader>
            <CreateScheduledTaskForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Select
        value={taskStatus}
        onValueChange={(v) => {
          setTaskStatus(v as ScheduledTaskStatus | "all")
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
              <TableHead>Шаблон</TableHead>
              <TableHead>Канал</TableHead>
              <TableHead>Время</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead></TableHead>
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
                  Нет задач
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.template.name}</TableCell>
                  <TableCell>{task.channel.toUpperCase()}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(task.scheduled_at).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[task.task_status]}>
                      {statusLabels[task.task_status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.task_status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => cancelTask(task.id)}
                        className="text-destructive"
                      >
                        <CircleXIcon className="size-4" />
                      </Button>
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
