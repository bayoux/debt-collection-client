"use client"

import { useQuery } from "@tanstack/react-query"
import { PieChart, Pie, Cell, Label } from "recharts"
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
  type ChartConfig,
} from "@/shared/components/ui/chart"
import { Skeleton } from "@/shared/components/ui/skeleton"

const chartConfig = {
  normal: { label: "В работе", color: "var(--color-chart-2)" },
  overdue: { label: "Просроченные", color: "var(--color-destructive)" },
} satisfies ChartConfig

export function CasesDonutChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: reportApi.summary,
    retry: false,
  })

  const normal = data
    ? Math.max(0, data.total_open_cases - data.total_overdue_cases)
    : 0
  const overdue = data?.total_overdue_cases ?? 0
  const total = data?.total_open_cases ?? 0

  const chartData = data
    ? [
        { name: "normal", label: "В работе", value: normal, fill: "var(--color-chart-2)" },
        { name: "overdue", label: "Просроченные", value: overdue, fill: "var(--color-destructive)" },
      ]
    : []

  const overdueRate =
    total > 0 ? Math.round((overdue / total) * 100) : 0

  return (
    <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs">
      <CardHeader>
        <CardTitle>Структура дел</CardTitle>
        <CardDescription>Просроченные vs в работе</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {isLoading ? (
          <Skeleton className="mx-auto h-48 w-48 rounded-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-50"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="label" hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {total.toLocaleString("ru-RU")}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 20}
                            className="fill-muted-foreground text-[11px]"
                          >
                            дел открыто
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      {data && (
        <CardFooter className="mt-4 flex justify-around border-t pt-4 text-sm">
          <div className="text-center">
            <div className="font-semibold tabular-nums">
              {normal.toLocaleString("ru-RU")}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-(--color-chart-2)" />
              В работе
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold tabular-nums text-destructive">
              {overdue.toLocaleString("ru-RU")}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-destructive" />
              Просрочено ({overdueRate}%)
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
