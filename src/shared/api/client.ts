const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

export type Params = Record<string, string | number | boolean | undefined | null>

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

function setTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh =
    typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null
  if (!refresh) return null

  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) {
    clearTokens()
    return null
  }

  const data = await res.json()
  localStorage.setItem("access_token", data.access)
  return data.access
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  params?: Params
  headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: extraHeaders = {}, ...init } = options

  // Build URL with query params
  let url = `${BASE_URL}${path}`
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        qs.set(k, String(v))
      }
    }
    const str = qs.toString()
    if (str) url += `?${str}`
  }

  const token = getAccessToken()
  const headers: Record<string, string> = { ...extraHeaders }

  if (token) headers["Authorization"] = `Bearer ${token}`

  // Only set Content-Type for requests that carry a body
  if (init.body !== undefined && init.body !== null) {
    if (!(init.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }
    // FormData: browser sets Content-Type with boundary automatically
  }

  let res = await fetch(url, { ...init, headers })

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      res = await fetch(url, { ...init, headers })
    } else {
      if (typeof window !== "undefined") window.location.href = "/login"
      throw new Error("Unauthorized")
    }
  }

  // No content
  if (res.status === 204) return undefined as T

  // Parse response body (may not be JSON on error pages)
  let json: unknown
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    json = await res.json()
  } else {
    const text = await res.text()
    json = { detail: text || `HTTP ${res.status}` }
  }

  if (!res.ok) {
    const err = new Error(
      (json as Record<string, unknown>)?.detail as string ?? "Request failed"
    )
    Object.assign(err, { status: res.status, data: json })
    throw err
  }

  return json as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),

  setTokens,
  clearTokens,
  getAccessToken,
}
