"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { useState } from "react"
import { nikitaApi } from "@/entities/nikita/api/nikita-api"
import type { NikitaResult } from "@/entities/nikita/model/types"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"

const schema = z.object({
  phone: z
    .string()
    .min(7, "Введите номер телефона")
    .regex(/^\+?[\d\s\-()]+$/, "Неверный формат номера"),
  text: z
    .string()
    .min(1, "Введите текст сообщения")
    .max(160, "SMS не может быть длиннее 160 символов"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function NikitaDirectSendForm({ onSuccess }: Props) {
  const [result, setResult] = useState<NikitaResult | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      nikitaApi.send({
        phone: values.phone.replace(/\D/g, ""),
        text: values.text,
      }),
    onSuccess: (res) => {
      setResult(res)
      if (res.status === "sent") {
        toast.success("SMS отправлено через Nikita SMSPro")
        onSuccess?.()
      } else {
        toast.error(res.error ?? "Nikita SMSPro не принял сообщение")
      }
    },
    onError: () => toast.error("Ошибка отправки SMS через Nikita"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", text: "" },
  })

  const textValue = form.watch("text")

  function onSubmit(values: FormValues) {
    setResult(null)
    mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер телефона *</FormLabel>
              <FormControl>
                <Input placeholder="996700123456" {...field} />
              </FormControl>
              <FormDescription>
                Цифры без пробелов и символов, например: 996700123456
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Текст SMS *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Добрый день! Напоминаем о задолженности..."
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-right tabular-nums">
                {textValue.length} / 160
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {result && (
          <div
            className={`flex items-start gap-1.5 rounded-md px-3 py-2 text-sm ${
              result.status === "sent"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {result.status === "sent" ? (
              <CheckCircle2Icon className="size-4 shrink-0 mt-0.5" />
            ) : (
              <XCircleIcon className="size-4 shrink-0 mt-0.5" />
            )}
            <span>
              {result.status === "sent"
                ? `Отправлено${result.message_id ? ` · ID: ${result.message_id}` : ""}`
                : (result.error ?? "Не удалось отправить SMS")}
            </span>
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Отправляем..." : "Отправить SMS"}
        </Button>
      </form>
    </Form>
  )
}
