"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { TrendingDownIcon, HandshakeIcon } from "lucide-react"
import { useAuth } from "@/features/auth/model/auth-context"
import { reportApi } from "@/entities/report/api/report-api"

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Доброе утро"
  if (h < 18) return "Добрый день"
  return "Добрый вечер"
}

function formatDate(): string {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function DashboardWelcome() {
  const { user } = useAuth()

  const { data: summary } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: reportApi.summary,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {user?.username ?? "агент"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground capitalize">
          {formatDate()}
        </p>
      </div>

      {summary && (summary.total_overdue_cases > 0 || summary.ptp_pending > 0) && (
        <div className="flex items-center gap-2">
          {summary.total_overdue_cases > 0 && (
            <Link
              href="/debt-cases?status=overdue"
              className="flex items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/12"
            >
              <TrendingDownIcon className="size-3.5" />
              <span className="font-medium">
                {summary.total_overdue_cases} просроч.
              </span>
            </Link>
          )}
          {summary.ptp_pending > 0 && (
            <Link
              href="/ptp"
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950"
            >
              <HandshakeIcon className="size-3.5" />
              <span className="font-medium">{summary.ptp_pending} PTP</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
