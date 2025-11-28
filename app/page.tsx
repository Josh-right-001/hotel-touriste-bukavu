"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { LoadingScreen } from "@/components/loading-screen"
import { LoginPage } from "@/components/login-page"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { InstallPrompt } from "@/components/install-prompt"
import { useAdmin } from "@/lib/contexts"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { admin, setAdmin } = useAdmin()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined") {
      try {
        const savedSession = localStorage.getItem("hotelTouristeSession")
        if (savedSession) {
          const session = JSON.parse(savedSession)
          setAdmin({ name: session.name, phone: session.phone, role: "admin" })
          setIsAuthenticated(true)
        }
      } catch (e) {
        // Invalid session, ignore
      }
    }
  }, []) // Remove setAdmin from dependencies to prevent infinite loop

  const handleLoginSuccess = useCallback(
    (adminData: { name: string; phone: string }) => {
      setAdmin({ name: adminData.name, phone: adminData.phone, role: "admin" })
      setIsAuthenticated(true)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("hotelTouristeSession", JSON.stringify(adminData))
        } catch (e) {}
      }
    },
    [setAdmin],
  )

  const handleLogout = useCallback(() => {
    setAdmin(null)
    setIsAuthenticated(false)
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("hotelTouristeSession")
        localStorage.removeItem("hotelTouristeAdminProfile")
      } catch (e) {}
    }
  }, [setAdmin])

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#071428] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" onComplete={() => setIsLoading(false)} />
        ) : !isAuthenticated ? (
          <LoginPage key="login" onSuccess={handleLoginSuccess} />
        ) : (
          <AdminDashboard
            key="dashboard"
            admin={admin || { name: "Admin", phone: "", role: "admin" }}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
      <InstallPrompt />
    </main>
  )
}
