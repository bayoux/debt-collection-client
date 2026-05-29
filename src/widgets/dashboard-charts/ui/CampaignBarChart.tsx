"use client"

import { useQuery } from "@tanstack/react-query"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { reportApi } from "@/entities/report/api/report-api"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/shared/components/ui/chart"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { TrendingUpIcon } from "lucide-react"

const chartConfig = {
  total_sent: { label: "Отправлено", color: "var(--color-chart-1)" },
  total_delivered: { label: "Доставлено", color: "var(--color-chart-2)" },
  total_ptp: { label: "PTP", color: "var(--color-chart-3)" },
} satisfies ChartConfig

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  })
}

export function CampaignBarChart() {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  const dateFrom = sevenDaysAgo.toISOString().split("T")[0]
  const dateTo = today.toISOString().split("T")[0]

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "campaign", dateFrom, dateTo, "all"],
    queryFn: () =>
      reportApi.campaign({ date_from: dateFrom, date_to: dateTo, channel: "all" }),
    retry: false,
  })

  const totalSent = data?.reduce((s, r) => s + r.total_sent, 0) ?? 0
  const totalDelivered = data?.reduce((s, r) => s + r.total_delivered, 0) ?? 0
  const deliveryRate =
    totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0

  return (
    <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs">
      <CardHeader>
        <CardTitle>Активность кампаний</CardTitle>
        <CardDescription>Последние 7 дней — все каналы</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart
              data={data ?? []}
              margin={{ top: 4, right: 4, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total_sent)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-total_sent)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total_delivered)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-total_delivered)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillPtp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total_ptp)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-total_ptp)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="report_date"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) =>
                      typeof label === "string" ? formatDate(label) : String(label)
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="total_sent"
                stroke="var(--color-total_sent)"
                fill="url(#fillSent)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="total_delivered"
                stroke="var(--color-total_delivered)"
                fill="url(#fillDelivered)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="total_ptp"
                stroke="var(--color-total_ptp)"
                fill="url(#fillPtp)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      {!isLoading && totalSent > 0 && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="flex items-center gap-1.5 font-medium">
            Доставляемость {deliveryRate}%
            <TrendingUpIcon className="size-4 text-primary" />
          </div>
          <div className="text-muted-foreground">
            {totalDelivered.toLocaleString("ru-RU")} из{" "}
            {totalSent.toLocaleString("ru-RU")} доставлено за период
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
