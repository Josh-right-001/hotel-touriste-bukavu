"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { UserPlus, User, Phone, Mail, Globe, FileText, Calendar, BedDouble, Check, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Room, RoomType } from "@/lib/types"

interface ReceptionModuleProps {
  onClientAction: (clientId?: string) => void
}

export function ReceptionModule({ onClientAction }: ReceptionModuleProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    nationality: "",
    idDocument: "",
    numberOfDays: 1,
    roomTypeId: "",
    notes: "",
  })
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [roomsRes, typesRes] = await Promise.all([
        supabase.from("rooms").select("*").eq("status", "Disponible"),
        supabase.from("room_types").select("*"),
      ])

      setRooms(roomsRes.data || [])
      setRoomTypes(typesRes.data || [])
      setAvailableRooms(roomsRes.data || [])
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (formData.roomTypeId) {
      const filtered = rooms.filter((r) => r.room_type_id === formData.roomTypeId)
      setAvailableRooms(filtered)
    } else {
      setAvailableRooms(rooms)
    }
  }, [formData.roomTypeId, rooms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!selectedRoom) {
      setError("Veuillez sélectionner une chambre")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Create client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          email: formData.email || null,
          nationality: formData.nationality || null,
          id_document: formData.idDocument || null,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Get room price
      const room = availableRooms.find((r) => r.id === selectedRoom)
      const roomType = roomTypes.find((t) => t.id === room?.room_type_id)
      const totalPrice = (roomType?.base_price || 0) * formData.numberOfDays

      // Create reservation
      const checkInDate = new Date()
      const checkOutDate = new Date()
      checkOutDate.setDate(checkOutDate.getDate() + formData.numberOfDays)

      const { error: reservationError } = await supabase.from("reservations").insert({
        client_id: client.id,
        room_id: selectedRoom,
        check_in_date: checkInDate.toISOString().split("T")[0],
        check_out_date: checkOutDate.toISOString().split("T")[0],
        number_of_days: formData.numberOfDays,
        total_price: totalPrice,
        status: "active",
        notes: formData.notes || null,
        created_by: "admin",
      })

      if (reservationError) throw reservationError

      // Update room status
      await supabase
        .from("rooms")
        .update({ status: "Occupée", updated_at: new Date().toISOString() })
        .eq("id", selectedRoom)

      // Create notification
      await supabase.from("notifications").insert({
        titre: "Nouveau client enregistré",
        body: `${formData.fullName} a été enregistré dans la chambre ${room?.room_number}`,
        client_id: client.id,
        type: "client_enregistre",
      })

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setFormData({
          fullName: "",
          phoneNumber: "",
          email: "",
          nationality: "",
          idDocument: "",
          numberOfDays: 1,
          roomTypeId: "",
          notes: "",
        })
        setSelectedRoom("")
      }, 3000)
    } catch (err) {
      console.error("Error:", err)
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-serif font-bold gold-gradient">Réception</h1>
          <p className="text-white/60 mt-1">Enregistrer un nouveau client</p>
        </div>
        <Button
          onClick={() => onClientAction()}
          variant="outline"
          className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nouveau Client Rapide
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
          <Card className="glass-card border-[#D4AF37]/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-[#D4AF37]" />
                Formulaire d&apos;enregistrement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Nom complet *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Jean Dupont"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Téléphone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                      <Input
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+243 XXX XXX XXX"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Nationalité</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                      <Input
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        placeholder="RD Congo"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">N° Document d&apos;identité</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                      <Input
                        value={formData.idDocument}
                        onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })}
                        placeholder="Passeport / Carte ID"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Nombre de jours *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                      <Input
                        type="number"
                        min={1}
                        value={formData.numberOfDays}
                        onChange={(e) =>
                          setFormData({ ...formData, numberOfDays: Number.parseInt(e.target.value) || 1 })
                        }
                        className="pl-10 bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Type de chambre</Label>
                    <Select
                      value={formData.roomTypeId}
                      onValueChange={(value) => setFormData({ ...formData, roomTypeId: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-[#D4AF37]/20">
                        <SelectItem value="all">Tous les types</SelectItem>
                        {roomTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} - ${type.base_price}/nuit
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Chambre disponible *</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Sélectionner une chambre" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-[#D4AF37]/20">
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Chambre {room.room_number} - Étage {room.floor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Client enregistré avec succès!</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || success}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#F4D03F] hover:to-[#D4AF37] text-[#071428] font-semibold h-12"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="h-5 w-5 border-2 border-[#071428] border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Enregistrer le client
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available rooms sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-card border-[#D4AF37]/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-[#D4AF37]" />
                Chambres Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableRooms.length === 0 ? (
                  <p className="text-white/50 text-center py-4">Aucune chambre disponible</p>
                ) : (
                  availableRooms.map((room) => {
                    const type = roomTypes.find((t) => t.id === room.room_type_id)
                    return (
                      <motion.button
                        key={room.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRoom(room.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedRoom === room.id
                            ? "bg-[#D4AF37]/20 border border-[#D4AF37]/40"
                            : "bg-white/5 border border-transparent hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">Chambre {room.room_number}</p>
                            <p className="text-xs text-white/50">
                              {type?.name} - Étage {room.floor}
                            </p>
                          </div>
                          <span className="text-sm text-[#D4AF37]">${type?.base_price}/nuit</span>
                        </div>
                      </motion.button>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
