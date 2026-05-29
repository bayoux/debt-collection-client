"use client"

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from "react"
import { apiClient } from "@/shared/api/client"
import type { User } from "@/entities/user/model/types"

type AuthUser = Pick<User, "id" | "username" | "email">

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState & AuthActions>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
})

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1]
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token)
  if (!payload || typeof payload.exp !== "number") return true
  return payload.exp * 1000 < Date.now()
}

function userFromToken(token: string): AuthUser | null {
  const payload = parseJwt(token)
  if (!payload) return null
  return {
    id: String(payload.user_id ?? payload.sub ?? ""),
    username: String(payload.username ?? payload.name ?? ""),
    email: String(payload.email ?? ""),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with isLoading=true so server and client render identically on first
  // pass (both show skeleton). useLayoutEffect runs only on the client,
  // resolves auth from localStorage before paint, and sets the real state.
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // One-time mount init from localStorage. localStorage is unavailable on the
  // server, so we start with isLoading=true (identical on server and client)
  // and resolve auth before first paint via useLayoutEffect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const token = apiClient.getAccessToken()
    if (!token || isTokenExpired(token)) {
      apiClient.clearTokens()
      setUser(null)
    } else {
      setUser(userFromToken(token))
    }
    setIsLoading(false)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(async (username: string, password: string) => {
    const { access, refresh } = await apiClient.post<{
      access: string
      refresh: string
    }>("/auth/login/", { username, password })
    apiClient.setTokens(access, refresh)
    setUser(userFromToken(access) ?? { id: "", username, email: "" })
  }, [])

  const logout = useCallback(async () => {
    const refresh =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token")
        : null
    if (refresh) {
      await apiClient.post("/auth/logout/", { refresh }).catch(() => {})
    }
    apiClient.clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
