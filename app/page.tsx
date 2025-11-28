"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { LoadingScreen } from "@/components/loading-screen"
import { LoginPage } from "@/components/login-page"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { InstallPrompt } from "@/components/install-prompt"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminData, setAdminData] = useState<{ name: string; phone: string } | null>(null)

  useEffect(() => {
    // Check for existing session
    const savedSession = localStorage.getItem("hotelTouristeSession")
    if (savedSession) {
      const session = JSON.parse(savedSession)
      setAdminData(session)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLoginSuccess = (admin: { name: string; phone: string }) => {
    setAdminData(admin)
    setIsAuthenticated(true)
    localStorage.setItem("hotelTouristeSession", JSON.stringify(admin))
  }

  const handleLogout = () => {
    setAdminData(null)
    setIsAuthenticated(false)
    localStorage.removeItem("hotelTouristeSession")
  }

  return (
    <main className="min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" onComplete={() => setIsLoading(false)} />
        ) : !isAuthenticated ? (
          <LoginPage key="login" onSuccess={handleLoginSuccess} />
        ) : (
          <AdminDashboard key="dashboard" admin={adminData!} onLogout={handleLogout} />
        )}
      </AnimatePresence>
      <InstallPrompt />
    </main>
  )
}
