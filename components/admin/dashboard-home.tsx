"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  BedDouble,
  Calendar,
  TrendingUp,
  UserPlus,
  Building2,
  History,
  Bell,
  Bot,
  Settings,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface DashboardHomeProps {
  onNavigate: (module: string) => void
  onClientAction: (clientId?: string) => void
}

interface Stats {
  totalClients: number
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  activeReservations: number
  todayCheckIns: number
}

const quickActions = [
  {
    id: "reception",
    label: "Réception",
    icon: UserPlus,
    color: "from-emerald-500 to-emerald-600",
    description: "Enregistrer un client",
  },
  { id: "clients", label: "Clients", icon: Users, color: "from-blue-500 to-blue-600", description: "Liste & fidélité" },
  {
    id: "rooms",
    label: "Chambres",
    icon: BedDouble,
    color: "from-purple-500 to-purple-600",
    description: "Gestion & statuts",
  },
  {
    id: "history",
    label: "Historique",
    icon: History,
    color: "from-orange-500 to-orange-600",
    description: "Export JSON/PDF",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "from-red-500 to-red-600",
    description: "Alertes temps réel",
  },
  { id: "bot", label: "Bot Messages", icon: Bot, color: "from-cyan-500 to-cyan-600", description: "Automatisation" },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings,
    color: "from-gray-500 to-gray-600",
    description: "Configuration",
  },
]

export function DashboardHome({ onNavigate, onClientAction }: DashboardHomeProps) {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    activeReservations: 0,
    todayCheckIns: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        // Fetch all stats in parallel
        const [clientsRes, roomsRes, reservationsRes] = await Promise.all([
          supabase.from("clients").select("*", { count: "exact", head: true }),
          supabase.from("rooms").select("*"),
          supabase.from("reservations").select("*").eq("status", "active"),
        ])

        const rooms = roomsRes.data || []
        const availableRooms = rooms.filter((r) => r.status === "Disponible").length
        const occupiedRooms = rooms.filter((r) => r.status === "Occupée").length

        // Today's check-ins
        const today = new Date().toISOString().split("T")[0]
        const { count: todayCheckIns } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("check_in_date", today)

        setStats({
          totalClients: clientsRes.count || 0,
          totalRooms: rooms.length,
          availableRooms,
          occupiedRooms,
          activeReservations: reservationsRes.data?.length || 0,
          todayCheckIns: todayCheckIns || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: "Total Clients", value: stats.totalClients, icon: Users, color: "text-blue-400" },
    { label: "Chambres Disponibles", value: stats.availableRooms, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Chambres Occupées", value: stats.occupiedRooms, icon: BedDouble, color: "text-orange-400" },
    { label: "Réservations Actives", value: stats.activeReservations, icon: Calendar, color: "text-purple-400" },
    { label: "Check-ins Aujourd'hui", value: stats.todayCheckIns, icon: Clock, color: "text-cyan-400" },
    { label: "Total Chambres", value: stats.totalRooms, icon: Building2, color: "text-[#D4AF37]" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold gold-gradient">Bienvenue sur le Dashboard</h1>
            <p className="text-white/60 mt-1">Gérez votre hôtel en toute simplicité</p>
          </div>
          <Button
            onClick={() => onClientAction()}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#F4D03F] hover:to-[#D4AF37] text-[#071428] font-semibold ripple"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nouveau Client
          </Button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  {isLoading ? (
                    <div className="h-6 w-8 bg-white/10 rounded animate-pulse" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  )}
                </div>
                <p className="text-xs text-white/50">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(action.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card rounded-xl p-4 text-left group hover:border-[#D4AF37]/30 transition-all duration-300"
            >
              <div
                className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors">{action.label}</h3>
              <p className="text-xs text-white/50 mt-1">{action.description}</p>
              <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-[#D4AF37] mt-2 transition-all group-hover:translate-x-1" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <Card className="glass-card border-[#D4AF37]/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">Nouveau client enregistré</p>
                  <p className="text-xs text-white/50">Il y a {i * 5} minutes</p>
                </div>
                <AlertCircle className="h-4 w-4 text-white/30" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
