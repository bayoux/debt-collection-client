"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { notificationApi } from "@/entities/notification/api/notification-api"
import type { NotificationChannel } from "@/entities/notification/model/types"
import { CreateTemplateForm } from "@/features/notifications/create-template/ui/CreateTemplateForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"
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

const channelColors: Record<NotificationChannel, string> = {
  sms: "bg-blue-100 text-blue-700",
  whatsapp: "bg-green-100 text-green-700",
  telegram: "bg-sky-100 text-sky-700",
  email: "bg-orange-100 text-orange-700",
}

const logStatusVariants = {
  queued: "secondary",
  sent: "outline",
  delivered: "default",
  failed: "destructive",
} as const

export function NotificationsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [logsPage, setLogsPage] = useState(1)

  const { data: templates, isLoading: templatesLoading, error: templatesError } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => notificationApi.templates.list(),
  })

  const { data: logs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ["notification-logs", logsPage],
    queryFn: () => notificationApi.logs.list({ page: logsPage, page_size: 20 }),
  })

  return (
    <div className="space-y-4">
      {(templatesError || logsError) && (
        <QueryError error={templatesError ?? logsError} />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-muted-foreground">Шаблоны и лог отправленных уведомлений</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1.5 size-4" />
              Новый шаблон
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать шаблон</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          <TabsTrigger value="logs">Лог отправок</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead>Язык</TableHead>
                  <TableHead>Текст</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : templates?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Шаблоны не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  templates?.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${channelColors[t.channel]}`}>
                          {t.channel.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{t.language}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                        {t.body}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Шаблон</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Отправлено</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : logs?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Уведомлений ещё нет
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.results.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.template.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${channelColors[log.channel]}`}>
                          {log.channel.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={logStatusVariants[log.status]}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString("ru-RU")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {logs && logs.count > 20 && (
            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setLogsPage((p) => Math.max(1, p - 1))} disabled={!logs.previous}>
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">Страница {logsPage}</span>
              <Button variant="outline" size="sm" onClick={() => setLogsPage((p) => p + 1)} disabled={!logs.next}>
                Вперёд
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
