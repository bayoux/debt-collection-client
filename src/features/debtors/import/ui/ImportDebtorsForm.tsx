"use client"

import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { UploadIcon } from "lucide-react"
import { debtorApi } from "@/entities/debtor/api/debtor-api"
import { Button } from "@/shared/components/ui/button"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"

interface Props {
  onSuccess?: (taskId: string) => void
}

export function ImportDebtorsForm({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const { mutate, isPending, data, error } = useMutation({
    mutationFn: (file: File) => debtorApi.import(file),
    onSuccess: (res) => onSuccess?.(res.task_id),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  function handleSubmit() {
    const file = inputRef.current?.files?.[0]
    if (file) mutate(file)
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon className="size-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {fileName ?? "Нажмите для выбора файла"}
          </p>
          <p className="text-xs text-muted-foreground">CSV или Excel (.xlsx)</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {data && (
        <Alert>
          <AlertDescription>{data.message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Ошибка импорта. Проверьте формат файла.</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!fileName || isPending}
        className="w-full"
      >
        {isPending ? "Загружаем..." : "Импортировать"}
      </Button>
    </div>
  )
}
