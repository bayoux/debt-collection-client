"use client"

import { Alert, AlertDescription, AlertTitle } from "./alert"

interface Props {
  error: unknown
}

export function QueryError({ error }: Props) {
  const message =
    error instanceof Error
      ? error.message
      : "Неизвестная ошибка"

  const status =
    error instanceof Error && "status" in error
      ? ` (${(error as { status: number }).status})`
      : ""

  return (
    <Alert variant="destructive">
      <AlertTitle>Ошибка загрузки данных{status}</AlertTitle>
      <AlertDescription className="font-mono text-xs break-all">{message}</AlertDescription>
    </Alert>
  )
}
