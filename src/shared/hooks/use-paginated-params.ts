"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function usePaginatedParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    if (key !== "page") params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 1) {
      params.delete("page")
    } else {
      params.set("page", String(next))
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function getParam(key: string): string | null {
    return searchParams.get(key)
  }

  return { page, setPage, setParam, getParam, searchParams }
}
