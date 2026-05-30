"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { userApi } from "@/entities/user/api/user-api"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"

const schema = z.object({
  username: z.string().min(3, "Минимум 3 символа"),
  email: z.string().email("Неверный email"),
  password: z.string().min(6, "Минимум 6 символов"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function CreateUserForm({ onSuccess }: Props) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: userApi.create,
    onSuccess: (user) => {
      toast.success("Пользователь создан", { description: user.username })
      qc.invalidateQueries({ queryKey: ["users"] })
      onSuccess?.()
    },
    onError: () => toast.error("Не удалось создать пользователя"),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "" },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Логин *</FormLabel>
              <FormControl>
                <Input placeholder="agent_ivanov" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Создаём..." : "Создать пользователя"}
        </Button>
      </form>
    </Form>
  )
}
