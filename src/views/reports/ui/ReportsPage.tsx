"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { reportApi } from "@/entities/report/api/report-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { QueryError } from "@/shared/components/ui/query-error"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Label } from "@/shared/components/ui/label"

const now = new Date()
const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const defaultTo = now.toISOString().slice(0, 10)

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)
  const [channel, setChannel] = useState("all")
  const [activityPage, setActivityPage] = useState(1)
  const [query, setQuery] = useState({ dateFrom: defaultFrom, dateTo: defaultTo, channel: "all" })

  const { data: campaign, isLoading: campaignLoading, error: campaignError } = useQuery({
    queryKey: ["reports", "campaign", query],
    queryFn: () =>
      reportApi.campaign({
        date_from: query.dateFrom,
        date_to: query.dateTo,
        channel: query.channel as "all",
      }),
  })

  const { data: activity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ["reports", "activity", activityPage],
    queryFn: () => reportApi.agentActivity({ page: activityPage, page_size: 20 }),
  })

  return (
    <div className="space-y-4">
      {(campaignError || activityError) && (
        <QueryError error={campaignError ?? activityError} />
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Отчёты</h1>
        <p className="text-muted-foreground">Аналитика кампаний и активность агентов</p>
      </div>

      <Tabs defaultValue="campaign">
        <TabsList>
          <TabsTrigger value="campaign">Кампании</TabsTrigger>
          <TabsTrigger value="activity">Активность агентов</TabsTrigger>
        </TabsList>

        <TabsContent value="campaign" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                  <Label>Дата от</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Дата до</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Канал</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setQuery({ dateFrom, dateTo, channel })}
                >
                  Применить
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead>Отправлено</TableHead>
                  <TableHead>Доставлено</TableHead>
                  <TableHead>PTP</TableHead>
                  <TableHead>Собрано (сом)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : campaign?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Нет данных за указанный период
                    </TableCell>
                  </TableRow>
                ) : (
                  campaign?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.report_date}</TableCell>
                      <TableCell>{row.channel.toUpperCase()}</TableCell>
                      <TableCell>{row.total_sent}</TableCell>
                      <TableCell>{row.total_delivered}</TableCell>
                      <TableCell>{row.total_ptp}</TableCell>
                      <TableCell className="font-mono">
                        {row.collected_amount.toLocaleString("ru-RU")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Агент</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Примечание</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : activity?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Нет данных
                    </TableCell>
                  </TableRow>
                ) : (
                  activity?.results.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.agent.username}</TableCell>
                      <TableCell className="font-mono text-xs">{log.action_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.performed_at).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-sm">{log.note ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {activity && activity.count > 20 && (
            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setActivityPage((p) => Math.max(1, p - 1))} disabled={!activity.previous}>
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">Страница {activityPage}</span>
              <Button variant="outline" size="sm" onClick={() => setActivityPage((p) => p + 1)} disabled={!activity.next}>
                Вперёд
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
