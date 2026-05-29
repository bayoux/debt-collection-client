"use client"

import { useQuery } from "@tanstack/react-query"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  RefreshCwIcon,
  BriefcaseIcon,
  TriangleAlertIcon,
  DollarSignIcon,
  HandshakeIcon,
  BellIcon,
} from "lucide-react"
import { reportApi } from "@/entities/report/api/report-api"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Button } from "@/shared/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-24 mt-1" />
      </CardHeader>
      <CardFooter>
        <Skeleton className="h-3 w-36" />
      </CardFooter>
    </Card>
  )
}

export function DashboardSummary() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: reportApi.summary,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : null
    const message = error instanceof Error ? error.message : "Неизвестная ошибка"
    return (
      <Alert variant="destructive">
        <AlertTitle>
          Ошибка загрузки статистики{status ? ` (HTTP ${status})` : ""}
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span className="font-mono text-xs">{message}</span>
          {status === 500 && (
            <span className="text-xs">Внутренняя ошибка сервера — проверьте логи бэкенда.</span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-fit mt-1"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCwIcon className={`mr-1.5 size-3 ${isFetching ? "animate-spin" : ""}`} />
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const isGoodRate = data.collection_rate_percent >= 30
  const isOverdueHigh = data.total_overdue_cases > data.total_open_cases * 0.3

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        className="@container/card animate-fade-up bg-linear-to-t from-blue-50/50 to-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ "--delay": "0ms" } as React.CSSProperties}
      >
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <span className="flex items-center justify-center rounded-md bg-blue-100 p-1 text-blue-600">
              <BriefcaseIcon className="size-3.5" />
            </span>
            Открытые дела
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.total_open_cases.toLocaleString("ru-RU")}
          </CardTitle>
          <CardAction>
            <Badge className={isOverdueHigh
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
            }>
              {isOverdueHigh
                ? <TrendingDownIcon className="size-3" />
                : <TrendingUpIcon className="size-3" />
              }
              {data.total_overdue_cases} просроч.
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Всего дел в работе
            <BriefcaseIcon className="size-4 text-blue-400" />
          </div>
          <div className="text-muted-foreground">
            {data.total_overdue_cases} из {data.total_open_cases} просрочены
          </div>
        </CardFooter>
      </Card>

      <Card
        className="@container/card animate-fade-up bg-linear-to-t from-emerald-50/50 to-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ "--delay": "75ms" } as React.CSSProperties}
      >
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <span className="flex items-center justify-center rounded-md bg-emerald-100 p-1 text-emerald-600">
              <DollarSignIcon className="size-3.5" />
            </span>
            Общий долг
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.total_amount_outstanding.toLocaleString("ru-RU")}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              сом
            </span>
          </CardTitle>
          <CardAction>
            <Badge className={isGoodRate
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
            }>
              {isGoodRate
                ? <TrendingUpIcon className="size-3" />
                : <TriangleAlertIcon className="size-3" />
              }
              {data.collection_rate_percent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            {isGoodRate ? "Хорошая собираемость" : "Низкая собираемость"}
            {isGoodRate
              ? <TrendingUpIcon className="size-4 text-emerald-400" />
              : <TriangleAlertIcon className="size-4 text-amber-400" />
            }
          </div>
          <div className="text-muted-foreground">
            Процент сбора: {data.collection_rate_percent}%
          </div>
        </CardFooter>
      </Card>

      <Card
        className="@container/card animate-fade-up bg-linear-to-t from-amber-50/50 to-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ "--delay": "150ms" } as React.CSSProperties}
      >
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <span className="flex items-center justify-center rounded-md bg-amber-100 p-1 text-amber-600">
              <HandshakeIcon className="size-3.5" />
            </span>
            Обещания (PTP)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.ptp_pending.toLocaleString("ru-RU")}
          </CardTitle>
          <CardAction>
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">
              <TrendingUpIcon className="size-3" />
              {data.ptp_kept_this_month} выполн.
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Ожидают исполнения
            <HandshakeIcon className="size-4 text-amber-400" />
          </div>
          <div className="text-muted-foreground">
            {data.ptp_kept_this_month} выполнено в этом месяце
          </div>
        </CardFooter>
      </Card>

      <Card
        className="@container/card animate-fade-up bg-linear-to-t from-violet-50/50 to-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ "--delay": "225ms" } as React.CSSProperties}
      >
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <span className="flex items-center justify-center rounded-md bg-violet-100 p-1 text-violet-600">
              <BellIcon className="size-3.5" />
            </span>
            Уведомлений сегодня
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.notifications_sent_today.toLocaleString("ru-RU")}
          </CardTitle>
          <CardAction>
            <Badge className="border-violet-200 bg-violet-50 text-violet-700">
              <TrendingUpIcon className="size-3" />
              Активно
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Отправлено сегодня
            <BellIcon className="size-4 text-violet-400" />
          </div>
          <div className="text-muted-foreground">
            Через все каналы коммуникации
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
