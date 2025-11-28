"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAdmin } from "@/lib/contexts"

const LoadingScreen = dynamic(
  () => import("@/components/loading-screen").then((mod) => ({ default: mod.LoadingScreen })),
  {
    ssr: false,
  },
)

const LoginPage = dynamic(() => import("@/components/login-page").then((mod) => ({ default: mod.LoginPage })), {
  ssr: false,
})

const AdminDashboard = dynamic(
  () => import("@/components/admin/admin-dashboard").then((mod) => ({ default: mod.AdminDashboard })),
  {
    ssr: false,
  },
)

const InstallPrompt = dynamic(
  () => import("@/components/install-prompt").then((mod) => ({ default: mod.InstallPrompt })),
  {
    ssr: false,
  },
)

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { admin, setAdmin } = useAdmin()

  useEffect(() => {
    setMounted(true)

    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const savedSession = localStorage.getItem("hotelTouristeSession")
        if (savedSession) {
          const session = JSON.parse(savedSession)
          if (session && session.name && session.phone) {
            setAdmin({ name: session.name, phone: session.phone, role: "admin" })
            setIsAuthenticated(true)
          }
        }
      }
    } catch {
      // localStorage not available or invalid JSON
    }
  }, [])

  const handleLoginSuccess = useCallback(
    (adminData: { name: string; phone: string }) => {
      setAdmin({ name: adminData.name, phone: adminData.phone, role: "admin" })
      setIsAuthenticated(true)
      try {
        if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
          localStorage.setItem("hotelTouristeSession", JSON.stringify(adminData))
        }
      } catch {
        // localStorage not available
      }
    },
    [setAdmin],
  )

  const handleLogout = useCallback(() => {
    setAdmin(null)
    setIsAuthenticated(false)
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.removeItem("hotelTouristeSession")
        localStorage.removeItem("hotelTouristeAdminProfile")
      }
    } catch {
      // localStorage not available
    }
  }, [setAdmin])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#071428] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#071428]">
      {isLoading ? (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : !isAuthenticated ? (
        <LoginPage onSuccess={handleLoginSuccess} />
      ) : (
        <AdminDashboard admin={admin || { name: "Admin", phone: "", role: "admin" }} onLogout={handleLogout} />
      )}
      <InstallPrompt />
    </main>
  )
}
