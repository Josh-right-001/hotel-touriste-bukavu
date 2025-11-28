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
  ChevronRight,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { DashboardHome } from "./dashboard-home"
import { ReceptionModule } from "./reception-module"
import { RoomsModule } from "./rooms-module"
import { ClientsModule } from "./clients-module"
import { HistoryModule } from "./history-module"
import { SettingsModule } from "./settings-module"
import { NotificationsModule } from "./notifications-module"
import { BotModule } from "./bot-module"
import { ClientModal } from "./client-modal"

interface AdminDashboardProps {
  admin: { name: string; phone: string }
  onLogout: () => void
}

type ModuleType = "dashboard" | "reception" | "clients" | "rooms" | "history" | "notifications" | "bot" | "settings"

const menuItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "reception" as const, label: "Réception", icon: UserPlus },
  { id: "clients" as const, label: "Clients", icon: Users },
  { id: "rooms" as const, label: "Chambres", icon: BedDouble },
  { id: "history" as const, label: "Historique", icon: History },
  { id: "notifications" as const, label: "Notifications", icon: Bell, badge: true },
  { id: "bot" as const, label: "Bot Messages", icon: Bot },
  { id: "settings" as const, label: "Paramètres", icon: Settings },
]

const mobileNavItems = [
  { id: "dashboard" as const, label: "Accueil", icon: LayoutDashboard },
  { id: "reception" as const, label: "Réception", icon: UserPlus },
  { id: "rooms" as const, label: "Chambres", icon: BedDouble },
  { id: "notifications" as const, label: "Alertes", icon: Bell, badge: true },
  { id: "settings" as const, label: "Plus", icon: Settings },
]

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleType>("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [showClientModal, setShowClientModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      const supabase = createClient()
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("lu", false)

      setUnreadNotifications(count || 0)
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

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

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : "-100%",
        }}
        className={`fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-50 w-72 glass-card border-r border-[#D4AF37]/10 flex-col hidden lg:flex`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#D4AF37]/10">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Hôtel Touriste" width={48} height={48} className="object-contain" />
            <div>
              <h1 className="font-serif font-bold text-lg gold-gradient">HÔTEL TOURISTE</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
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
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <div className="p-4 border-t border-[#D4AF37]/10">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{admin.name}</p>
                <p className="text-xs text-muted-foreground">{admin.phone}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar */}
        <header className="glass-card border-b border-[#D4AF37]/10 px-4 py-3 flex items-center justify-between lg:px-6">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
              <span className="font-serif font-bold text-sm gold-gradient">HÔTEL TOURISTE</span>
            </div>
            <div className="hidden lg:block">
              <h2 className="font-semibold text-foreground">
                {menuItems.find((m) => m.id === activeModule)?.label || "Dashboard"}
              </h2>
              <p className="text-xs text-muted-foreground">Place Mulamba, Bukavu</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveModule("notifications")}
              className="relative text-muted-foreground hover:text-foreground hidden lg:flex"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="lg:hidden text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <div className="hidden md:block h-8 w-8">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
          </div>
        </header>

        {/* Content - Added padding bottom for mobile nav */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-24 lg:pb-6">
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

        <motion.nav initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
          {/* Glassmorphism background */}
          <div className="mx-3 mb-3 rounded-2xl overflow-hidden">
            <div
              className="flex items-center justify-around py-2 px-1"
              style={{
                background: "rgba(15, 39, 68, 0.85)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(212, 175, 55, 0.2)",
                boxShadow: "0 -4px 30px rgba(0, 0, 0, 0.3), 0 0 40px rgba(212, 175, 55, 0.1)",
              }}
            >
              {mobileNavItems.map((item) => {
                const isActive = activeModule === item.id
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    whileTap={{ scale: 0.9 }}
                    className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200"
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-[#D4AF37]/20 rounded-xl"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Icon with notification badge */}
                    <div className="relative">
                      <item.icon
                        className={`h-5 w-5 transition-colors duration-200 ${
                          isActive ? "text-[#D4AF37]" : "text-white/60"
                        }`}
                      />
                      {item.badge && unreadNotifications > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                        >
                          {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </motion.span>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[10px] font-medium transition-colors duration-200 ${
                        isActive ? "text-[#D4AF37]" : "text-white/60"
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -bottom-0.5 w-1 h-1 bg-[#D4AF37] rounded-full"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Client Modal */}
      <ClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} clientId={selectedClientId} />
    </div>
  )
}
