"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, Grid3X3, List, CheckCircle, XCircle, Clock, AlertTriangle, Wrench, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import type { Room, RoomType } from "@/lib/types"

const statusConfig = {
  Disponible: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  Occupée: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
  Nettoyage: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  Réservée: { icon: AlertTriangle, color: "text-blue-400", bg: "bg-blue-500/20" },
  Maintenance: { icon: Wrench, color: "text-gray-400", bg: "bg-gray-500/20" },
}

export function RoomsModule() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterFloor, setFilterFloor] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  const fetchRooms = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const [roomsRes, typesRes] = await Promise.all([
      supabase.from("rooms").select("*").order("room_number"),
      supabase.from("room_types").select("*"),
    ])

    setRooms(roomsRes.data || [])
    setRoomTypes(typesRes.data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const updateRoomStatus = async (roomId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from("rooms").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", roomId)

    setRooms((prev) =>
      prev.map((room) => (room.id === roomId ? { ...room, status: newStatus as Room["status"] } : room)),
    )
  }

  const filteredRooms = rooms.filter((room) => {
    if (filterStatus !== "all" && room.status !== filterStatus) return false
    if (filterFloor !== "all" && room.floor !== Number.parseInt(filterFloor)) return false
    if (filterType !== "all" && room.room_type_id !== filterType) return false
    return true
  })

  const floors = [...new Set(rooms.map((r) => r.floor))].sort()

  const stats = {
    total: rooms.length,
    disponible: rooms.filter((r) => r.status === "Disponible").length,
    occupee: rooms.filter((r) => r.status === "Occupée").length,
    nettoyage: rooms.filter((r) => r.status === "Nettoyage").length,
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
          <h1 className="text-2xl font-serif font-bold gold-gradient">Gestion des Chambres</h1>
          <p className="text-white/60 mt-1">
            {stats.disponible} disponibles sur {stats.total} chambres
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchRooms} className="text-white/60 hover:text-white">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <div className="flex rounded-lg overflow-hidden border border-[#D4AF37]/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`rounded-none ${viewMode === "grid" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/60"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-none ${viewMode === "list" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/60"}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig)
          .slice(0, 4)
          .map(([status, config], index) => {
            const count = rooms.filter((r) => r.status === status).length
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`glass-card border-[#D4AF37]/10 cursor-pointer hover:border-[#D4AF37]/30 transition-all ${filterStatus === status ? "border-[#D4AF37]/50" : ""}`}
                  onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                      <config.icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-xs text-white/50">{status}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
      </div>

      {/* Filters */}
      <Card className="glass-card border-[#D4AF37]/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-sm text-white/60">Filtres:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="glass-card border-[#D4AF37]/20">
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.keys(statusConfig).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterFloor} onValueChange={setFilterFloor}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Étage" />
              </SelectTrigger>
              <SelectContent className="glass-card border-[#D4AF37]/20">
                <SelectItem value="all">Tous les étages</SelectItem>
                {floors.map((floor) => (
                  <SelectItem key={floor} value={floor.toString()}>
                    Étage {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="glass-card border-[#D4AF37]/20">
                <SelectItem value="all">Tous les types</SelectItem>
                {roomTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterStatus !== "all" || filterFloor !== "all" || filterType !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus("all")
                  setFilterFloor("all")
                  setFilterType("all")
                }}
                className="text-[#D4AF37] hover:text-[#F4D03F]"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rooms grid/list */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {filteredRooms.map((room, index) => {
              const type = roomTypes.find((t) => t.id === room.room_type_id)
              const config = statusConfig[room.status] || statusConfig.Disponible

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Card
                        className={`glass-card border-[#D4AF37]/10 cursor-pointer hover:border-[#D4AF37]/30 transition-all group`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xl font-bold text-white">{room.room_number}</span>
                            <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                              <config.icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                          </div>
                          <p className="text-xs text-white/50 mb-1">{type?.name || "Standard"}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`text-xs ${config.color} border-current`}>
                              {room.status}
                            </Badge>
                            <span className="text-xs text-white/40">Étage {room.floor}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="glass-card border-[#D4AF37]/20">
                      <DropdownMenuItem
                        onClick={() => updateRoomStatus(room.id, "Disponible")}
                        className="text-emerald-400 focus:text-emerald-400"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer Disponible
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateRoomStatus(room.id, "Nettoyage")}
                        className="text-yellow-400 focus:text-yellow-400"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Marquer Nettoyage
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateRoomStatus(room.id, "Maintenance")}
                        className="text-gray-400 focus:text-gray-400"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Bloquer Maintenance
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="glass-card border-[#D4AF37]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-white/60">Chambre</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">Type</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">Étage</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">Statut</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room) => {
                      const type = roomTypes.find((t) => t.id === room.room_type_id)
                      const config = statusConfig[room.status] || statusConfig.Disponible

                      return (
                        <tr key={room.id} className="border-t border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <span className="font-medium text-white">{room.room_number}</span>
                          </td>
                          <td className="p-4 text-white/70">{type?.name || "Standard"}</td>
                          <td className="p-4 text-white/70">{room.floor}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={`${config.color} border-current`}>
                              {room.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-white/60">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="glass-card border-[#D4AF37]/20">
                                <DropdownMenuItem onClick={() => updateRoomStatus(room.id, "Disponible")}>
                                  Marquer Disponible
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateRoomStatus(room.id, "Nettoyage")}>
                                  Marquer Nettoyage
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateRoomStatus(room.id, "Maintenance")}>
                                  Bloquer Maintenance
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
