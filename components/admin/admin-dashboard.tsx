"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  BedDouble,
  History,
  Settings,
  Bell,
  Bot,
  LogOut,
  Menu,
  ChevronRight,
  UserPlus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useLanguage, useTheme } from "@/lib/contexts"
import { DashboardHome } from "./dashboard-home"
import { ReceptionModule } from "./reception-module"
import { RoomsModule } from "./rooms-module"
import { ClientsModule } from "./clients-module"
import { HistoryModule } from "./history-module"
import { SettingsModule } from "./settings-module"
import { NotificationsModule } from "./notifications-module"
import { BotModule } from "./bot-module"
import { ClientModal } from "./client-modal"
import { MobileNavBar } from "./mobile-nav-bar"

interface AdminDashboardProps {
  admin: { name: string; phone: string; role?: string }
  onLogout: () => void
}

type ModuleType = "dashboard" | "reception" | "clients" | "rooms" | "history" | "notifications" | "bot" | "settings"

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleType>("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [showClientModal, setShowClientModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()
  const { resolvedTheme } = useTheme()

  const menuItems = [
    { id: "dashboard" as const, label: t("dashboard"), icon: LayoutDashboard },
    { id: "reception" as const, label: t("reception"), icon: UserPlus },
    { id: "clients" as const, label: t("clients"), icon: Users },
    { id: "rooms" as const, label: t("rooms"), icon: BedDouble },
    { id: "history" as const, label: t("history"), icon: History },
    { id: "notifications" as const, label: t("notifications"), icon: Bell, badge: true },
    { id: "bot" as const, label: t("botMessages"), icon: Bot },
    { id: "settings" as const, label: t("settings"), icon: Settings },
  ]

  useEffect(() => {
    setMounted(true)

    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768)
      }
    }

    checkMobile()

    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Fetch unread notifications count
  useEffect(() => {
    if (!mounted) return

    const fetchNotifications = async () => {
      try {
        const supabase = createClient()
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("lu", false)

        setUnreadNotifications(count || 0)
      } catch {
        // Error fetching notifications
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [mounted])

  const handleClientAction = (clientId?: string) => {
    setSelectedClientId(clientId || null)
    setShowClientModal(true)
  }

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardHome onNavigate={setActiveModule} onClientAction={handleClientAction} />
      case "reception":
        return <ReceptionModule onClientAction={handleClientAction} />
      case "clients":
        return <ClientsModule onClientAction={handleClientAction} />
      case "rooms":
        return <RoomsModule />
      case "history":
        return <HistoryModule />
      case "notifications":
        return <NotificationsModule />
      case "bot":
        return <BotModule />
      case "settings":
        return <SettingsModule />
      default:
        return <DashboardHome onNavigate={setActiveModule} onClientAction={handleClientAction} />
    }
  }

  const bgClass =
    resolvedTheme === "light"
      ? "bg-gradient-to-br from-slate-50 to-slate-100"
      : "bg-gradient-to-br from-[#071428] via-[#0F2744] to-[#071428]"

  const sidebarBgClass =
    resolvedTheme === "light"
      ? "bg-white border-r border-slate-200 shadow-lg"
      : "glass-card border-r border-[#D4AF37]/10"

  const textClass = resolvedTheme === "light" ? "text-slate-900" : "text-white"
  const textMutedClass = resolvedTheme === "light" ? "text-slate-500" : "text-white/50"

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#071428] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex ${bgClass}`}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <motion.aside
        initial={false}
        animate={{ x: isSidebarOpen || !isMobile ? 0 : "-100%" }}
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 ${sidebarBgClass} flex flex-col`}
      >
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(false)}
          className={`absolute top-4 right-4 md:hidden ${resolvedTheme === "light" ? "text-slate-600" : "text-white/60"} hover:text-[#D4AF37]`}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Header */}
        <div className={`p-6 border-b ${resolvedTheme === "light" ? "border-slate-200" : "border-[#D4AF37]/10"}`}>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Hôtel Touriste" width={48} height={48} className="object-contain" />
            <div>
              <h1 className="font-serif font-bold text-lg gold-gradient">HÔTEL TOURISTE</h1>
              <p className={`text-xs ${textMutedClass}`}>Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeModule === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id)
                  setIsSidebarOpen(false)
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                    : resolvedTheme === "light"
                      ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-[#D4AF37]" : ""}`} />
                <span className="font-medium">{item.label}</span>
                {item.badge && unreadNotifications > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs px-2">{unreadNotifications}</Badge>
                )}
                {isActive && <ChevronRight className="ml-auto h-4 w-4 text-[#D4AF37]" />}
              </motion.button>
            )
          })}
        </nav>

        {/* User info */}
        <div className={`p-4 border-t ${resolvedTheme === "light" ? "border-slate-200" : "border-[#D4AF37]/10"}`}>
          <div className={`rounded-xl p-4 ${resolvedTheme === "light" ? "bg-slate-50" : "glass"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className={`font-medium text-sm ${textClass}`}>{admin.name}</p>
                <p className={`text-xs ${textMutedClass}`}>{admin.phone}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen ${isMobile ? "pb-24" : ""}`}>
        {/* Top bar */}
        <header
          className={`px-4 py-3 flex items-center justify-between md:px-6 ${
            resolvedTheme === "light"
              ? "bg-white border-b border-slate-200 shadow-sm"
              : "glass-card border-b border-[#D4AF37]/10"
          }`}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className={`md:hidden ${resolvedTheme === "light" ? "text-slate-600" : "text-white/70"} hover:text-[#D4AF37]`}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="hidden sm:block">
              <h2 className={`font-semibold ${textClass}`}>
                {menuItems.find((m) => m.id === activeModule)?.label || "Dashboard"}
              </h2>
              <p className={`text-xs ${textMutedClass}`}>Place Mulamba, Bukavu</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveModule("notifications")}
              className={`relative ${resolvedTheme === "light" ? "text-slate-600" : "text-white/70"} hover:text-[#D4AF37]`}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <div className="hidden md:block h-8 w-8">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileNavBar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          unreadNotifications={unreadNotifications}
        />
      )}

      {/* Client Modal */}
      <ClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} clientId={selectedClientId} />
    </div>
  )
}
