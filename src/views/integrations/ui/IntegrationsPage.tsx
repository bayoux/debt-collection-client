"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, Trash2Icon, TestTubeIcon } from "lucide-react"
import { integrationApi } from "@/entities/integration/api/integration-api"
import { IntegrationForm } from "@/features/integrations/manage/ui/IntegrationForm"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { QueryError } from "@/shared/components/ui/query-error"

export function IntegrationsPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)

  const { data, isLoading, error: listError } = useQuery({
    queryKey: ["integrations"],
    queryFn: integrationApi.list,
  })

  const { mutate: deleteIntegration } = useMutation({
    mutationFn: integrationApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  })

  const { mutate: testIntegration } = useMutation({
    mutationFn: integrationApi.test,
    onSuccess: (res, id) => setTestResult({ id, ...res }),
  })

  return (
    <div className="space-y-4">
      {listError && <QueryError error={listError} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Интеграции</h1>
          <p className="text-muted-foreground">Конфигурация каналов уведомлений</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1.5 size-4" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая интеграция</DialogTitle>
            </DialogHeader>
            <IntegrationForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Канал</TableHead>
              <TableHead>Провайдер</TableHead>
              <TableHead>Webhook URL</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Интеграции не добавлены
                </TableCell>
              </TableRow>
            ) : (
              data?.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell className="font-medium">
                    {integration.channel.toUpperCase()}
                  </TableCell>
                  <TableCell>{integration.provider}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {integration.webhook_url ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={integration.is_active ? "default" : "secondary"}>
                      {integration.is_active ? "Активна" : "Неактивна"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => testIntegration(integration.id)}
                        title="Тест соединения"
                      >
                        <TestTubeIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={() => deleteIntegration(integration.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
