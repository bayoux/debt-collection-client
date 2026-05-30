import type { DebtCaseStatus } from "./types"

export const statusLabels: Record<DebtCaseStatus, string> = {
  new:         "Новое",
  in_progress: "В работе",
  promised:    "Обещано",
  closed:      "Закрыто",
  overdue:     "Просрочено",
}

export const statusStyles: Record<DebtCaseStatus, string> = {
  new:         "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  promised:    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  closed:      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  overdue:     "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
}
