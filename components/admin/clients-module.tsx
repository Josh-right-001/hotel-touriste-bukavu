"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Search, Star, Download, TrendingUp, Phone, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Client } from "@/lib/types"

interface ClientsModuleProps {
  onClientAction: (clientId?: string) => void
}

export function ClientsModule({ onClientAction }: ClientsModuleProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterTag, setFilterTag] = useState("all")

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

      // Calculate loyalty score for each client
      const clientsWithScore = (data || []).map((client) => ({
        ...client,
        fidelite_score: calculateLoyaltyScore(client),
        tags: client.tags || [],
      }))

      setClients(clientsWithScore)
      setIsLoading(false)
    }

    fetchClients()
  }, [])

  const calculateLoyaltyScore = (client: Client): number => {
    const sejours = client.total_sejours || 0
    const nuits = client.total_nuits || 0

    // Simple scoring: 50% visits + 30% nights + 20% engagement
    const sejoursScore = Math.min(sejours * 10, 50)
    const nuitsScore = Math.min(nuits * 2, 30)
    const engagementScore = client.email ? 20 : 10

    return Math.min(sejoursScore + nuitsScore + engagementScore, 100)
  }

  const filteredClients = clients
    .filter((client) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          client.full_name.toLowerCase().includes(query) ||
          client.phone_number?.includes(query) ||
          client.email?.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter((client) => {
      if (filterTag === "vip") return (client.fidelite_score || 0) >= 70
      if (filterTag === "fidele") return (client.fidelite_score || 0) >= 40
      return true
    })
    .sort((a, b) => {
      if (sortBy === "loyalty") return (b.fidelite_score || 0) - (a.fidelite_score || 0)
      if (sortBy === "name") return a.full_name.localeCompare(b.full_name)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const exportClients = (format: "json" | "pdf") => {
    if (format === "json") {
      const dataStr = JSON.stringify(filteredClients, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clients_hotel_touriste_${new Date().toISOString().split("T")[0]}.json`
      a.click()
    }
  }

  const getLoyaltyColor = (score: number) => {
    if (score >= 70) return "text-[#D4AF37]"
    if (score >= 40) return "text-emerald-400"
    return "text-white/60"
  }

  const getLoyaltyBadge = (score: number) => {
    if (score >= 70) return { label: "VIP", color: "bg-[#D4AF37]/20 text-[#D4AF37]" }
    if (score >= 40) return { label: "Fidèle", color: "bg-emerald-500/20 text-emerald-400" }
    return { label: "Nouveau", color: "bg-white/10 text-white/60" }
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
          <h1 className="text-2xl font-serif font-bold gold-gradient">Liste des Clients</h1>
          <p className="text-white/60 mt-1">{clients.length} clients enregistrés</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportClients("json")}
            className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
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
                placeholder="Rechercher par nom, téléphone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent className="glass-card border-[#D4AF37]/20">
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="loyalty">Fidélité</SelectItem>
                <SelectItem value="name">Nom A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent className="glass-card border-[#D4AF37]/20">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="vip">VIP (70%+)</SelectItem>
                <SelectItem value="fidele">Fidèles (40%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients list */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="glass-card border-[#D4AF37]/10">
              <CardContent className="p-4">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-48 bg-white/10 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredClients.length === 0 ? (
          <Card className="glass-card border-[#D4AF37]/10">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Aucun client trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client, index) => {
            const badge = getLoyaltyBadge(client.fidelite_score || 0)

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className="glass-card border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer group"
                  onClick={() => onClientAction(client.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar with loyalty indicator */}
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-[#D4AF37]">
                            {client.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {(client.fidelite_score || 0) >= 70 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-[#D4AF37] rounded-full flex items-center justify-center">
                            <Star className="h-3 w-3 text-[#071428]" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate group-hover:text-[#D4AF37] transition-colors">
                            {client.full_name}
                          </h3>
                          <Badge className={badge.color}>{badge.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                          {client.phone_number && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone_number}
                            </span>
                          )}
                          {client.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Loyalty score */}
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`h-4 w-4 ${getLoyaltyColor(client.fidelite_score || 0)}`} />
                          <span className={`text-lg font-bold ${getLoyaltyColor(client.fidelite_score || 0)}`}>
                            {client.fidelite_score || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-white/40">Fidélité</p>
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
