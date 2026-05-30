import Link from "next/link"
import { ShieldCheckIcon, ArrowLeftIcon } from "lucide-react"
import { LoginForm } from "@/features/auth/login/ui/LoginForm"

export function LoginPage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10 animate-fade-up">
      {/* Brand */}
      <div className="flex flex-col items-center gap-2 text-center">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-foreground transition-opacity hover:opacity-75">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShieldCheckIcon className="size-5" />
          </div>
          <span className="text-lg">Debt Collection</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Система управления дебиторской задолженностью
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        На главную
      </Link>
    </div>
  )
}
