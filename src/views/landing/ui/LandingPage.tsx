"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ShieldCheckIcon,
  BriefcaseIcon,
  MessageSquareIcon,
  HandshakeIcon,
  BarChart3Icon,
  CalendarIcon,
  ZapIcon,
  ArrowRightIcon,
  CheckIcon,
  UsersIcon,
  BellIcon,
  MenuIcon,
  XIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { ThemeToggle } from "@/features/theme-toggle/ui/ThemeToggle"

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-4" />
          </div>
          Debt Collection
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Возможности
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            Как работает
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/login">
              Начать бесплатно
              <ArrowRightIcon className="ml-1 size-3.5" />
            </Link>
          </Button>
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Меню"
          >
            {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
              Возможности
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
              Как работает
            </a>
            <div className="flex gap-2 border-t pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link href="/login">Начать</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

// ─── App mockup ───────────────────────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ring-border/50">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2.5">
        <div className="size-2.5 rounded-full bg-red-400" />
        <div className="size-2.5 rounded-full bg-amber-400" />
        <div className="size-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[11px] text-muted-foreground">
          Debt Collection — Дашборд
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {[
          { label: "Открытые дела",  value: "1 248",   bg: "bg-blue-100",   fg: "text-blue-600"   },
          { label: "Общий долг",     value: "4.2M сом", bg: "bg-emerald-100", fg: "text-emerald-600" },
          { label: "Обещания (PTP)", value: "83",       bg: "bg-amber-100",  fg: "text-amber-600"  },
          { label: "Уведомлений",    value: "342",      bg: "bg-violet-100", fg: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-2.5 shadow-xs">
            <div className={`mb-1.5 inline-flex rounded-md p-1 ${s.bg}`}>
              <TrendingUpIcon className={`size-2.5 ${s.fg}`} />
            </div>
            <div className="text-sm font-semibold tabular-nums">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="mx-3 mb-2 rounded-lg border bg-card p-2.5 shadow-xs">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium">Активность кампаний</span>
          <span className="text-[10px] text-muted-foreground">7 дней</span>
        </div>
        <div className="flex items-end gap-0.5" style={{ height: 36 }}>
          {[35, 55, 42, 78, 50, 88, 68].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/25 transition-all"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Mini table */}
      <div className="mx-3 mb-3 overflow-hidden rounded-lg border shadow-xs">
        <div className="grid grid-cols-3 bg-muted/50 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span>Должник</span>
          <span className="text-right">Сумма</span>
          <span className="text-right">Статус</span>
        </div>
        {[
          { name: "Иванов А.П.",   amount: "45 000", status: "В работе",   cls: "bg-blue-50 text-blue-700"   },
          { name: "Смирнова К.",   amount: "12 500", status: "Обещано",    cls: "bg-amber-50 text-amber-700"  },
          { name: "Петров Д.С.",   amount: "89 000", status: "Просрочено", cls: "bg-red-50 text-red-700"     },
        ].map((row, i) => (
          <div key={i} className="grid grid-cols-3 items-center border-t px-2.5 py-1.5 text-[10px]">
            <span className="truncate font-medium">{row.name}</span>
            <span className="text-right tabular-nums text-muted-foreground">{row.amount}</span>
            <div className="flex justify-end">
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${row.cls}`}>
                {row.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up space-y-6">
            <Badge className="border-primary/20 bg-primary/8 text-primary">
              <ZapIcon className="size-3" />
              Автоматизация взыскания долгов
            </Badge>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-[52px]">
              Управляйте долгами{" "}
              <span className="text-primary">умно и эффективно</span>
            </h1>

            <p className="text-lg leading-relaxed text-muted-foreground">
              Централизованная платформа для управления портфелем должников,
              мультиканальных уведомлений и контроля обещаний об оплате.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Войти в систему
                  <ArrowRightIcon className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">Как это работает</a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {[
                "Без настройки с нуля",
                "SMS, WhatsApp, Telegram",
                "Аналитика в реальном времени",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-primary" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div
            className="animate-fade-up"
            style={{ "--delay": "150ms" } as React.CSSProperties}
          >
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-primary/5 blur-2xl" />
              <AppMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function Stats() {
  const items = [
    { value: "95%", label: "Доставляемость уведомлений" },
    { value: "3×",  label: "Ускорение сбора долгов" },
    { value: "50%", label: "Снижение просрочек" },
    { value: "24/7", label: "Автоматический контроль" },
  ]

  return (
    <section className="border-y bg-muted/25 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {items.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-primary">{value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES: {
  icon: LucideIcon
  title: string
  description: string
  iconCls: string
}[] = [
  {
    icon: BriefcaseIcon,
    title: "Управление делами",
    description:
      "Централизованная база должников с историей взаимодействий, статусами и назначенными агентами.",
    iconCls: "bg-blue-50 text-blue-600",
  },
  {
    icon: MessageSquareIcon,
    title: "Мультиканальные уведомления",
    description:
      "Отправляйте уведомления через SMS, WhatsApp, Telegram и Email из единого интерфейса.",
    iconCls: "bg-green-50 text-green-600",
  },
  {
    icon: HandshakeIcon,
    title: "Контроль обещаний (PTP)",
    description:
      "Отслеживайте обещания об оплате и автоматически напоминайте должникам о взятых обязательствах.",
    iconCls: "bg-amber-50 text-amber-600",
  },
  {
    icon: BarChart3Icon,
    title: "Аналитика и отчёты",
    description:
      "Дашборд с ключевыми метриками: собираемость, доставляемость, динамика кампаний.",
    iconCls: "bg-violet-50 text-violet-600",
  },
  {
    icon: CalendarIcon,
    title: "Планировщик рассылок",
    description:
      "Настраивайте отложенные рассылки и автоматические кампании с гибким планировщиком задач.",
    iconCls: "bg-sky-50 text-sky-600",
  },
  {
    icon: ZapIcon,
    title: "Интеграции",
    description:
      "Подключайте внешние CRM и финансовые системы через готовые интеграции или REST API.",
    iconCls: "bg-orange-50 text-orange-600",
  },
]

function Features() {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <Badge className="mb-3 border-primary/20 bg-primary/5 text-primary">
            Возможности
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Всё необходимое для взыскания
          </h2>
          <p className="mt-3 max-w-lg mx-auto text-muted-foreground">
            Комплексный инструментарий для управления дебиторской задолженностью
            в одном месте
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, iconCls }) => (
            <div
              key={title}
              className="group rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`mb-3 inline-flex rounded-lg p-2 ${iconCls}`}>
                <Icon className="size-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS: { number: string; title: string; description: string; icon: LucideIcon }[] = [
  {
    number: "01",
    icon: UsersIcon,
    title: "Загрузите базу должников",
    description:
      "Импортируйте список из CSV или добавляйте вручную. Система автоматически структурирует данные и связывает их с делами.",
  },
  {
    number: "02",
    icon: BellIcon,
    title: "Настройте уведомления",
    description:
      "Создайте шаблоны сообщений для каждого канала и настройте расписание автоматических рассылок под ваш процесс.",
  },
  {
    number: "03",
    icon: TrendingUpIcon,
    title: "Контролируйте результаты",
    description:
      "Отслеживайте статусы, обещания об оплате и эффективность кампаний на едином дашборде в реальном времени.",
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/20 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <Badge className="mb-3 border-primary/20 bg-primary/5 text-primary">
            Как работает
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Три шага до результата
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, description }, i) => (
            <div key={number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute left-full top-10 hidden w-6 border-t border-dashed border-border md:block" />
              )}
              <div className="rounded-xl border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary/25 tabular-nums">
                    {number}
                  </span>
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="size-4" />
                  </div>
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl bg-foreground px-8 py-14 text-center shadow-lg">
          <Badge className="mb-4 border-white/10 bg-white/10 text-white">
            Начните сегодня
          </Badge>
          <h2 className="mb-3 text-3xl font-bold text-background">
            Готовы автоматизировать взыскание?
          </h2>
          <p className="mb-7 text-background/60">
            Войдите в систему и начните управлять портфелем долгов прямо сейчас
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">
                Войти в систему
                <ArrowRightIcon className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-background/70 hover:bg-white/10 hover:text-background"
            >
              <a href="#features">Узнать больше</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t bg-muted/20 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheckIcon className="size-3.5" />
            </div>
            Debt Collection
          </Link>

          <div className="flex gap-5 text-xs text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">
              Возможности
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              Как работает
            </a>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Войти
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 Debt Collection
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  )
}
