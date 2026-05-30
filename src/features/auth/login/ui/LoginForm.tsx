"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react"
import { useAuth } from "@/features/auth/model/auth-context"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"

const schema = z.object({
  username: z.string().min(1, "Введите имя пользователя"),
  password: z.string().min(1, "Введите пароль"),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await login(values.username, values.password)
      setIsSuccess(true)
      await new Promise((r) => setTimeout(r, 700))
      router.push("/dashboard")
    } catch {
      setServerError("Неверный логин или пароль")
    }
  }

  if (isSuccess) {
    return (
      <Card className="bg-linear-to-b from-card to-primary/5 shadow-md animate-fade-up">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2Icon className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Добро пожаловать!</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Переходим в систему...</p>
          </div>
          <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-linear-to-b from-card to-primary/5 shadow-md">
      <CardHeader>
        <CardTitle>Вход в систему</CardTitle>
        <CardDescription>Управление дебиторской задолженностью</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username">Логин</FieldLabel>
              <Input
                id="username"
                placeholder="agent_ivanov"
                autoComplete="username"
                {...register("username")}
              />
              <FieldError errors={[errors.username]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Пароль</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            {serverError && (
              <p className="text-sm font-medium text-destructive">{serverError}</p>
            )}
            <Field>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? <><LoaderCircleIcon className="mr-2 size-4 animate-spin" />Входим...</>
                  : "Войти"
                }
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
