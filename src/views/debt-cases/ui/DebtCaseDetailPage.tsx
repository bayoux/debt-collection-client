"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftIcon, BellIcon, HandshakeIcon } from "lucide-react"
import Link from "next/link"
import { debtCaseApi } from "@/entities/debt-case/api/debt-case-api"
import type { DebtCaseStatus } from "@/entities/debt-case/model/types"
import { SendNotificationForm } from "@/features/debt-cases/send-notification/ui/SendNotificationForm"
import { CreatePtpForm } from "@/features/ptp/create/ui/CreatePtpForm"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
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
import { Skeleton } from "@/shared/components/ui/skeleton"

const statusLabels: Record<DebtCaseStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  promised: "Обещано",
  closed: "Закрыто",
  overdue: "Просрочено",
}

interface Props {
  id: string
}

export function DebtCaseDetailPage({ id }: Props) {
  const qc = useQueryClient()
  const [sendOpen, setSendOpen] = useState(false)
  const [ptpOpen, setPtpOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["debt-cases", id],
    queryFn: () => debtCaseApi.get(id),
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: (status: DebtCaseStatus) => debtCaseApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debt-cases", id] }),
  })

  const { data: dpdHistory } = useQuery({
    queryKey: ["debt-cases", id, "dpd-history"],
    queryFn: () => debtCaseApi.dpdHistory(id),
    enabled: !!data,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">Дело не найдено.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/debt-cases">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.debtor.full_name}
          </h1>
          <p className="text-muted-foreground text-sm">{data.debtor.phone}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={data.status}
          onValueChange={(v) => updateStatus(v as DebtCaseStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <BellIcon className="mr-1.5 size-4" />
              Отправить уведомление
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Отправить уведомление</DialogTitle>
            </DialogHeader>
            <SendNotificationForm debtCaseId={id} onSuccess={() => setSendOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={ptpOpen} onOpenChange={setPtpOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <HandshakeIcon className="mr-1.5 size-4" />
              Зафиксировать PTP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Обещание об оплате</DialogTitle>
            </DialogHeader>
            <CreatePtpForm debtCaseId={id} onSuccess={() => setPtpOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Сумма долга</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{data.amount.toLocaleString("ru-RU")} сом</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">DPD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${data.dpd > 30 ? "text-destructive" : ""}`}>
              {data.dpd} дней
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Дата погашения</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{data.due_date}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Статус</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{statusLabels[data.status]}</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Должник</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">ФИО:</span> {data.debtor.full_name}</p>
            <p><span className="text-muted-foreground">Телефон:</span> {data.debtor.phone}</p>
            <p><span className="text-muted-foreground">Email:</span> {data.debtor.email ?? "—"}</p>
            <p><span className="text-muted-foreground">WhatsApp:</span> {data.debtor.whatsapp_number ?? "—"}</p>
            <p><span className="text-muted-foreground">Telegram:</span> {data.debtor.telegram_id ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">История DPD</CardTitle>
          </CardHeader>
          <CardContent>
            {dpdHistory?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <div className="space-y-1">
                {dpdHistory?.slice(0, 10).map((snap) => (
                  <div key={snap.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{snap.snapshot_date}</span>
                    <span className="font-medium">{snap.dpd_value} дн.</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
