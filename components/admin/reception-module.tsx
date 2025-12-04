"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  UserPlus,
  User,
  Phone,
  Mail,
  Globe,
  FileText,
  Calendar,
  BedDouble,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useTheme, useLanguage } from "@/lib/contexts"
import { EnhancedClientForm } from "./enhanced-client-form"
import type { Room, RoomType } from "@/lib/types"

interface ReceptionModuleProps {
  onClientAction: (clientId?: string) => void
}

export function ReceptionModule({ onClientAction }: ReceptionModuleProps) {
  const { resolvedTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = resolvedTheme === "dark"

  const [activeTab, setActiveTab] = useState("quick")
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
      if (!supabase) return

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
    if (formData.roomTypeId && formData.roomTypeId !== "all") {
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
      setError(t("selectRoom"))
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      if (!supabase) throw new Error("Supabase not available")

      // Generate matricule
      const date = new Date()
      const year = date.getFullYear().toString().slice(-2)
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      const matricule = `HT${year}${month}-${random}`

      // Create client with new fields
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          whatsapp_number: formData.phoneNumber,
          whatsapp_country_code: "+243",
          email: formData.email || null,
          nationality: formData.nationality || null,
          pays_origine: formData.nationality || null,
          id_document: formData.idDocument || null,
          matricule,
          total_sejours: 1,
          total_nuits: formData.numberOfDays,
          fidelite_score: 10,
          tags: [],
          statut: "actif",
          attribue_par: "admin",
          is_vip: false,
          is_duplicate: false,
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
        titre: t("newClientRegistered"),
        body: `${formData.fullName} ${t("registeredInRoom")} ${room?.room_number}`,
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
      setError(t("errorOccurred"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnhancedFormSuccess = (clientId: string) => {
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setActiveTab("quick")
    }, 2000)
  }

  const inputClass = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/30"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"

  const labelClass = isDark ? "text-white/80" : "text-slate-700"

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className={`text-2xl font-serif font-bold ${isDark ? "gold-gradient" : "text-[#D4AF37]"}`}>
            {t("reception")}
          </h1>
          <p className={isDark ? "text-white/60 mt-1" : "text-slate-500 mt-1"}>{t("registerNewClient")}</p>
        </div>
        <Button
          onClick={() => onClientAction()}
          variant="outline"
          className={
            isDark
              ? "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              : "border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
          }
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {t("quickNewClient")}
        </Button>
      </motion.div>

      {/* Tabs for Quick vs Enhanced form */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full max-w-md grid-cols-2 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
          <TabsTrigger
            value="quick"
            className={isDark ? "data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#071428]" : ""}
          >
            <User className="h-4 w-4 mr-2" />
            {t("quickForm")}
          </TabsTrigger>
          <TabsTrigger
            value="enhanced"
            className={isDark ? "data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#071428]" : ""}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("completeForm")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Quick Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
              <Card className={isDark ? "glass-card border-[#D4AF37]/10" : "bg-white border-slate-200 shadow-lg"}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <User className="h-5 w-5 text-[#D4AF37]" />
                    {t("registrationForm")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={labelClass}>{t("fullName")} *</Label>
                        <div className="relative">
                          <User
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                          />
                          <Input
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Jean Dupont"
                            className={`pl-10 ${inputClass}`}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>{t("phone")} *</Label>
                        <div className="relative">
                          <Phone
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                          />
                          <Input
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="+243 XXX XXX XXX"
                            className={`pl-10 ${inputClass}`}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>{t("email")}</Label>
                        <div className="relative">
                          <Mail
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                          />
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            className={`pl-10 ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>{t("nationality")}</Label>
                        <div className="relative">
                          <Globe
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                          />
                          <Input
                            value={formData.nationality}
                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                            placeholder="RD Congo"
                            className={`pl-10 ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>{t("idDocument")}</Label>
                        <div className="relative">
                          <FileText
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                          />
                          <Input
                            value={formData.idDocument}
                            onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })}
                            placeholder="Passeport / Carte ID"
                            className={`pl-10 ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>{t("numberOfDays")} *</Label>
                        <div className="relative">
                          <Calendar
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                          />
                          <Input
                            type="number"
                            min={1}
                            value={formData.numberOfDays}
                            onChange={(e) =>
                              setFormData({ ...formData, numberOfDays: Number.parseInt(e.target.value) || 1 })
                            }
                            className={`pl-10 ${inputClass}`}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={labelClass}>{t("roomType")}</Label>
                        <Select
                          value={formData.roomTypeId}
                          onValueChange={(value) => setFormData({ ...formData, roomTypeId: value })}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder={t("allTypes")} />
                          </SelectTrigger>
                          <SelectContent
                            className={isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}
                          >
                            <SelectItem value="all">{t("allTypes")}</SelectItem>
                            {roomTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name} - ${type.base_price}/{t("night")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>{t("availableRoom")} *</Label>
                        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder={t("selectRoom")} />
                          </SelectTrigger>
                          <SelectContent
                            className={isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}
                          >
                            {availableRooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {t("room")} {room.room_number} - {t("floor")} {room.floor}
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
                        <span className="text-sm">{t("clientRegisteredSuccess")}</span>
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
                          {t("registerClient")}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Available rooms sidebar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className={isDark ? "glass-card border-[#D4AF37]/10" : "bg-white border-slate-200 shadow-lg"}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <BedDouble className="h-5 w-5 text-[#D4AF37]" />
                    {t("availableRooms")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableRooms.length === 0 ? (
                      <p className={`text-center py-4 ${isDark ? "text-white/50" : "text-slate-400"}`}>
                        {t("noRoomsAvailable")}
                      </p>
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
                                : isDark
                                  ? "bg-white/5 border border-transparent hover:bg-white/10"
                                  : "bg-slate-50 border border-transparent hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {t("room")} {room.room_number}
                                </p>
                                <p className={`text-xs ${isDark ? "text-white/50" : "text-slate-400"}`}>
                                  {type?.name} - {t("floor")} {room.floor}
                                </p>
                              </div>
                              <span className="text-sm text-[#D4AF37]">
                                ${type?.base_price}/{t("night")}
                              </span>
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
        </TabsContent>

        <TabsContent value="enhanced" className="mt-6">
          <EnhancedClientForm onSuccess={handleEnhancedFormSuccess} onCancel={() => setActiveTab("quick")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
