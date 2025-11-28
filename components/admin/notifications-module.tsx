"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Check, CheckCheck, User, Bot, AlertCircle, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/types"

export function NotificationsModule() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("notifications").select("*").order("date", { ascending: false })

    setNotifications(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").update({ lu: true }).eq("id", id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)))
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    await supabase.from("notifications").update({ lu: true }).eq("lu", false)
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").delete().eq("id", id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "client_enregistre":
        return User
      case "client_transfere":
        return User
      case "bot_envoi":
        return Bot
      default:
        return AlertCircle
    }
  }

  const unreadCount = notifications.filter((n) => !n.lu).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-serif font-bold gold-gradient">Notifications</h1>
          <p className="text-white/60 mt-1">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </motion.div>

      {/* Notifications list */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="glass-card border-[#D4AF37]/10">
              <CardContent className="p-4">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-white/10 rounded" />
                    <div className="h-3 w-32 bg-white/10 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <Card className="glass-card border-[#D4AF37]/10">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Aucune notification</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification, index) => {
            const Icon = getIcon(notification.type)

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`glass-card border-[#D4AF37]/10 transition-all ${
                    !notification.lu ? "border-l-4 border-l-[#D4AF37]" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          !notification.lu ? "bg-[#D4AF37]/20" : "bg-white/10"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${!notification.lu ? "text-[#D4AF37]" : "text-white/60"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{notification.titre}</h3>
                          {!notification.lu && (
                            <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">Nouveau</Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/60 mt-1">{notification.body}</p>
                        <p className="text-xs text-white/40 mt-2">
                          {new Date(notification.date).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.lu && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            className="text-white/40 hover:text-[#D4AF37]"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
