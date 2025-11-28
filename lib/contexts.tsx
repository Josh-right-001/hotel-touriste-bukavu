"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "./i18n"

// Theme Context
type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: "dark" as Theme,
      setTheme: () => {},
      resolvedTheme: "dark" as const,
    }
  }
  return context
}

// Language Context
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      language: "fr" as Language,
      setLanguage: () => {},
      t: (key: TranslationKey) => translations.fr[key] || key,
    }
  }
  return context
}

// Admin Profile Context
interface AdminProfile {
  name: string
  phone: string
  avatar?: string
  role: string
}

interface AdminContextType {
  admin: AdminProfile | null
  setAdmin: (admin: AdminProfile | null) => void
  updateProfile: (updates: Partial<AdminProfile>) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    return {
      admin: null,
      setAdmin: () => {},
      updateProfile: () => {},
    }
  }
  return context
}

// Combined Provider
interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [mounted, setMounted] = useState(false)

  // Theme state
  const [theme, setThemeState] = useState<Theme>("dark")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")

  // Language state
  const [language, setLanguageState] = useState<Language>("fr")

  // Admin state
  const [admin, setAdminState] = useState<AdminProfile | null>(null)

  useEffect(() => {
    setMounted(true)

    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const savedTheme = localStorage.getItem("hotelTouristeTheme") as Theme | null
        const savedLanguage = localStorage.getItem("hotelTouristeLanguage") as Language | null
        const savedAdmin = localStorage.getItem("hotelTouristeAdminProfile")

        if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
          setThemeState(savedTheme)
        }
        if (savedLanguage && ["fr", "en"].includes(savedLanguage)) {
          setLanguageState(savedLanguage)
        }
        if (savedAdmin) {
          try {
            const parsed = JSON.parse(savedAdmin)
            if (parsed && typeof parsed.name === "string") {
              setAdminState(parsed)
            }
          } catch {
            // Invalid JSON, ignore
          }
        }
      }
    } catch {
      // localStorage not available
    }
  }, [])

  // Update resolved theme
  useEffect(() => {
    if (!mounted) return

    const updateResolvedTheme = () => {
      try {
        if (theme === "system" && typeof window !== "undefined") {
          const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
          setResolvedTheme(systemDark ? "dark" : "light")
        } else {
          setResolvedTheme(theme === "light" ? "light" : "dark")
        }
      } catch {
        setResolvedTheme("dark")
      }
    }

    updateResolvedTheme()

    if (theme === "system" && typeof window !== "undefined") {
      try {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handler = () => updateResolvedTheme()
        mediaQuery.addEventListener("change", handler)
        return () => mediaQuery.removeEventListener("change", handler)
      } catch {
        // matchMedia not supported
      }
    }
  }, [theme, mounted])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return
    try {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(resolvedTheme)
      }
    } catch {
      // Document not available
    }
  }, [resolvedTheme, mounted])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.setItem("hotelTouristeTheme", newTheme)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.setItem("hotelTouristeLanguage", lang)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language]?.[key] || translations.fr[key] || key
    },
    [language],
  )

  const setAdmin = useCallback((newAdmin: AdminProfile | null) => {
    setAdminState(newAdmin)
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        if (newAdmin) {
          localStorage.setItem("hotelTouristeAdminProfile", JSON.stringify(newAdmin))
        } else {
          localStorage.removeItem("hotelTouristeAdminProfile")
        }
      }
    } catch {
      // localStorage not available
    }
  }, [])

  const updateProfile = useCallback((updates: Partial<AdminProfile>) => {
    setAdminState((current) => {
      if (current) {
        const updatedAdmin = { ...current, ...updates }
        try {
          if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
            localStorage.setItem("hotelTouristeAdminProfile", JSON.stringify(updatedAdmin))
          }
        } catch {
          // localStorage not available
        }
        return updatedAdmin
      }
      return current
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <AdminContext.Provider value={{ admin, setAdmin, updateProfile }}>{children}</AdminContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  )
}
