"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, FileJson, Printer, User, BedDouble } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Reservation, Client, Room } from "@/lib/types"

interface ReservationWithDetails extends Reservation {
  client?: Client
  room?: Room
}

export function HistoryModule() {
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = createClient()

      const { data: reservationsData } = await supabase
        .from("reservations")
        .select(`
          *,
          client:clients(*),
          room:rooms(*)
        `)
        .order("created_at", { ascending: false })

      setReservations(reservationsData || [])
      setIsLoading(false)
    }

    fetchHistory()
  }, [])

  const filteredReservations = reservations
    .filter((res) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return res.client?.full_name?.toLowerCase().includes(query) || res.room?.room_number?.includes(query)
      }
      return true
    })
    .filter((res) => {
      if (filterStatus !== "all") return res.status === filterStatus
      return true
    })

  const exportData = (format: "json" | "pdf") => {
    if (format === "json") {
      const dataStr = JSON.stringify(filteredReservations, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `historique_hotel_touriste_${new Date().toISOString().split("T")[0]}.json`
      a.click()
    } else {
      // For PDF, open print dialog
      window.print()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Active", color: "bg-emerald-500/20 text-emerald-400" }
      case "completed":
        return { label: "Terminée", color: "bg-blue-500/20 text-blue-400" }
      case "cancelled":
        return { label: "Annulée", color: "bg-red-500/20 text-red-400" }
      default:
        return { label: status, color: "bg-white/10 text-white/60" }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-serif font-bold gold-gradient">Historique</h1>
          <p className="text-white/60 mt-1">{reservations.length} réservations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData("json")}
            className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            <FileJson className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData("pdf")}
            className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <Card className="glass-card border-[#D4AF37]/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
              <Input
                placeholder="Rechercher par client ou chambre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="glass-card border-[#D4AF37]/20">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History list */}
      <Card className="glass-card border-[#D4AF37]/10 overflow-hidden print:bg-white print:text-black">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 print:bg-gray-100">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-white/60 print:text-gray-600">Client</th>
                <th className="text-left p-4 text-sm font-medium text-white/60 print:text-gray-600">Chambre</th>
                <th className="text-left p-4 text-sm font-medium text-white/60 print:text-gray-600">Check-in</th>
                <th className="text-left p-4 text-sm font-medium text-white/60 print:text-gray-600">Check-out</th>
                <th className="text-left p-4 text-sm font-medium text-white/60 print:text-gray-600">Durée</th>
                <th className="text-left p-4 text-sm font-medium text-white/60 print:text-gray-600">Total</th>
                <th className="text-left p-4 text-sm font-medium text-white/60 print:text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div className="animate-pulse h-4 bg-white/10 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/50">
                    Aucune réservation trouvée
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res, index) => {
                  const badge = getStatusBadge(res.status)

                  return (
                    <motion.tr
                      key={res.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-t border-white/5 hover:bg-white/5 print:border-gray-200"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#D4AF37] print:text-gray-600" />
                          <span className="text-white print:text-black">{res.client?.full_name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-[#D4AF37] print:text-gray-600" />
                          <span className="text-white print:text-black">{res.room?.room_number || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white/70 print:text-gray-600">
                        {new Date(res.check_in_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4 text-white/70 print:text-gray-600">
                        {new Date(res.check_out_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4 text-white/70 print:text-gray-600">
                        {res.number_of_days} nuit{res.number_of_days > 1 ? "s" : ""}
                      </td>
                      <td className="p-4 text-[#D4AF37] font-medium print:text-gray-800">${res.total_price}</td>
                      <td className="p-4">
                        <Badge className={badge.color}>{badge.label}</Badge>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
