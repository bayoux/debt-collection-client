import {
  ShieldCheckIcon,
  BriefcaseIcon,
  BellIcon,
  BarChart3Icon,
  HandshakeIcon,
} from "lucide-react"
import { LoginForm } from "@/features/auth/login/ui/LoginForm"

const features = [
  { icon: BriefcaseIcon,  text: "Мониторинг DPD в реальном времени" },
  { icon: BellIcon,       text: "Автоматические рассылки по всем каналам" },
  { icon: BarChart3Icon,  text: "Детальная аналитика и отчёты" },
  { icon: HandshakeIcon,  text: "Контроль обещаний об оплате (PTP)" },
]

export function LoginPage() {
  return (
    <div className="flex min-h-svh bg-background">

      {/* ── Brand panel (left, desktop only) ─────────────────────────── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-115 xl:w-130 flex-col bg-primary text-primary-foreground">
        {/* Dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(oklch(1 0 0 / 0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow circles */}
        <div className="absolute -top-40 -right-40 size-120 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-120 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex h-full flex-col p-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <ShieldCheckIcon className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Debt Collection
            </span>
          </div>

          {/* Copy */}
          <div className="mt-auto">
            <p className="text-[11px] font-medium uppercase tracking-widest text-primary-foreground/50">
              Платформа взыскания долгов
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-snug tracking-tight">
              Управление задолженностью нового уровня
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/65">
              Единая система для агентов, аналитиков и руководства — DPD, рассылки, PTP и отчёты в одном окне.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/10">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-sm text-primary-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="mt-10 text-xs text-primary-foreground/35">
            © {new Date().getFullYear()} Debt Collection System
          </p>
        </div>
      </aside>

      {/* ── Form panel (right) ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
        {/* Mobile brand (hidden on desktop) */}
        <div className="flex flex-col items-center gap-2 text-center lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShieldCheckIcon className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Система управления задолженностью
          </p>
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
