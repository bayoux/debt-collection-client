"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { userApi } from "@/entities/user/api/user-api"
import { roleApi } from "@/entities/role/api/role-api"
import type { User } from "@/entities/user/model/types"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Checkbox } from "@/shared/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"

const schema = z.object({
  email: z.string().email("Неверный email"),
  password: z.string().optional().or(z.literal("")),
  role_ids: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface Props {
  user: User
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditUserForm({ user, onSuccess, onCancel }: Props) {
  const qc = useQueryClient()

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
  })

  const { mutateAsync: updateUser } = useMutation({
    mutationFn: (data: Parameters<typeof userApi.update>[1]) =>
      userApi.update(user.id, data),
  })

  const { mutateAsync: assignRoles } = useMutation({
    mutationFn: (role_ids: string[]) => userApi.assignRoles(user.id, role_ids),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user.email,
      password: "",
      role_ids: user.roles.map((r) => r.id),
    },
  })

  const isPending = form.formState.isSubmitting

  async function onSubmit(values: FormValues) {
    try {
      const updates: Parameters<typeof userApi.update>[1] = {}
      if (values.email !== user.email) updates.email = values.email
      if (values.password) updates.password = values.password

      await Promise.all([
        Object.keys(updates).length > 0 ? updateUser(updates) : Promise.resolve(),
        assignRoles(values.role_ids),
      ])

      toast.success("Пользователь обновлён", { description: user.username })
      qc.invalidateQueries({ queryKey: ["users"] })
      onSuccess?.()
    } catch {
      toast.error("Не удалось обновить пользователя")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
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
              <FormLabel>Новый пароль</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Оставьте пустым, чтобы не менять" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {roles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Роли</p>
            {roles.map((role) => (
              <FormField
                key={role.id}
                control={form.control}
                name="role_ids"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2.5 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, role.id])
                          } else {
                            field.onChange(field.value.filter((id) => id !== role.id))
                          }
                        }}
                      />
                    </FormControl>
                    <div>
                      <p className="text-sm font-medium leading-none">{role.name}</p>
                      {role.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
