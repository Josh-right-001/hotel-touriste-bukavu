"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Search,
  FileJson,
  Printer,
  User,
  BedDouble,
  FileSpreadsheet,
  FileText,
  Download,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useLanguage, useTheme } from "@/lib/contexts"
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
  const { t } = useLanguage()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const fetchHistory = async () => {
      try {
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
      } catch {
        // Error fetching data
      } finally {
        setIsLoading(false)
      }
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

  const exportJSON = useCallback(() => {
    const dataStr = JSON.stringify(filteredReservations, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historique_hotel_touriste_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredReservations])

  const exportExcel = useCallback(() => {
    const headers = ["Client", "Chambre", "Check-in", "Check-out", "Durée (nuits)", "Total ($)", "Statut"]
    const rows = filteredReservations.map((res) => [
      res.client?.full_name || "N/A",
      res.room?.room_number || "N/A",
      new Date(res.check_in_date).toLocaleDateString("fr-FR"),
      new Date(res.check_out_date).toLocaleDateString("fr-FR"),
      res.number_of_days,
      res.total_price,
      res.status === "active" ? "Active" : res.status === "completed" ? "Terminée" : "Annulée",
    ])

    const csvContent =
      "\uFEFF" + // BOM for UTF-8
      headers.join(";") +
      "\n" +
      rows.map((row) => row.join(";")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historique_hotel_touriste_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredReservations])

  const exportPDF = useCallback(() => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Historique - Hôtel Touriste</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #071428; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }
            .info { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #071428; color: #D4AF37; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .status-active { color: #10b981; }
            .status-completed { color: #3b82f6; }
            .status-cancelled { color: #ef4444; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Historique des Réservations - Hôtel Touriste</h1>
          <p class="info">Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
          <p class="info">Total: ${filteredReservations.length} réservation(s)</p>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Chambre</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Durée</th>
                <th>Total</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReservations
                .map(
                  (res) => `
                <tr>
                  <td>${res.client?.full_name || "N/A"}</td>
                  <td>${res.room?.room_number || "N/A"}</td>
                  <td>${new Date(res.check_in_date).toLocaleDateString("fr-FR")}</td>
                  <td>${new Date(res.check_out_date).toLocaleDateString("fr-FR")}</td>
                  <td>${res.number_of_days} nuit(s)</td>
                  <td>$${res.total_price}</td>
                  <td class="status-${res.status}">${res.status === "active" ? "Active" : res.status === "completed" ? "Terminée" : "Annulée"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Hôtel Touriste — Place Mulamba, Réf: 261 Ave Lumumba, Bukavu</p>
            <p>Développé par Josh R</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }, [filteredReservations])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: t("active"), color: "bg-emerald-500/20 text-emerald-400" }
      case "completed":
        return { label: t("completed"), color: "bg-blue-500/20 text-blue-400" }
      case "cancelled":
        return { label: t("cancelled"), color: "bg-red-500/20 text-red-400" }
      default:
        return { label: status, color: "bg-white/10 text-white/60" }
    }
  }

  const cardClass = resolvedTheme === "light" ? "bg-white border-slate-200 shadow-sm" : "glass-card border-[#D4AF37]/10"
  const inputClass =
    resolvedTheme === "light"
      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
      : "bg-white/5 border-white/10 text-white placeholder:text-white/30"
  const textClass = resolvedTheme === "light" ? "text-slate-900" : "text-white"
  const textMutedClass = resolvedTheme === "light" ? "text-slate-500" : "text-white/60"
  const headerBgClass = resolvedTheme === "light" ? "bg-slate-50" : "bg-white/5"
  const rowHoverClass = resolvedTheme === "light" ? "hover:bg-slate-50" : "hover:bg-white/5"
  const borderClass = resolvedTheme === "light" ? "border-slate-200" : "border-white/5"

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-serif font-bold gold-gradient">{t("history")}</h1>
          <p className={`mt-1 ${textMutedClass}`}>
            {reservations.length} {t("reservations")}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={cardClass}>
            <DropdownMenuItem onClick={exportJSON} className="cursor-pointer">
              <FileJson className="h-4 w-4 mr-2 text-blue-500" />
              <span className={textClass}>Export JSON</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel} className="cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
              <span className={textClass}>Export Excel (CSV)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2 text-red-500" />
              <span className={textClass}>Export PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer">
              <Printer className="h-4 w-4 mr-2 text-[#D4AF37]" />
              <span className={textClass}>{t("print")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Search & Filters */}
      <Card className={cardClass}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
              <Input
                placeholder={`${t("search")}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${inputClass}`}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className={`w-40 ${inputClass}`}>
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent className={cardClass}>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="completed">{t("completed")}</SelectItem>
                <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History list */}
      <Card className={`${cardClass} overflow-hidden print:bg-white print:text-black`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={headerBgClass}>
              <tr>
                <th className={`text-left p-4 text-sm font-medium ${textMutedClass}`}>{t("client")}</th>
                <th className={`text-left p-4 text-sm font-medium ${textMutedClass}`}>{t("rooms")}</th>
                <th className={`text-left p-4 text-sm font-medium ${textMutedClass}`}>{t("checkIn")}</th>
                <th className={`text-left p-4 text-sm font-medium ${textMutedClass}`}>{t("checkOut")}</th>
                <th className={`text-left p-4 text-sm font-medium ${textMutedClass}`}>{t("duration")}</th>
                <th className={`text-left p-4 text-sm font-medium ${textMutedClass}`}>{t("total")}</th>
                <th className={`text-left p-4 text-sm font-medium ${textMutedClass}`}>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div
                        className={`animate-pulse h-4 rounded w-full ${resolvedTheme === "light" ? "bg-slate-200" : "bg-white/10"}`}
                      />
                    </td>
                  </tr>
                ))
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`p-8 text-center ${textMutedClass}`}>
                    {t("noNotifications")}
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
                      className={`border-t ${borderClass} ${rowHoverClass}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#D4AF37]" />
                          <span className={textClass}>{res.client?.full_name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-[#D4AF37]" />
                          <span className={textClass}>{res.room?.room_number || "N/A"}</span>
                        </div>
                      </td>
                      <td className={`p-4 ${textMutedClass}`}>
                        {new Date(res.check_in_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className={`p-4 ${textMutedClass}`}>
                        {new Date(res.check_out_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className={`p-4 ${textMutedClass}`}>
                        {res.number_of_days} {t("nights")}
                      </td>
                      <td className="p-4 text-[#D4AF37] font-medium">${res.total_price}</td>
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
