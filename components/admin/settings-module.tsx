"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Users,
  Shield,
  Save,
  Plus,
  Trash2,
  Check,
  Sun,
  Moon,
  Monitor,
  Globe,
  User,
  Camera,
  ExternalLink,
  Palette,
  Code,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useLanguage, useTheme, useAdmin } from "@/lib/contexts"
import type { HotelSettings, Admin } from "@/lib/types"

export function SettingsModule() {
  const [settings, setSettings] = useState<HotelSettings | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newAdminPhone, setNewAdminPhone] = useState("")
  const [newAdminName, setNewAdminName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { admin: currentAdmin, updateProfile } = useAdmin()

  const [profileData, setProfileData] = useState({
    name: currentAdmin?.name || "",
    avatar: currentAdmin?.avatar || "",
  })

  useEffect(() => {
    if (currentAdmin) {
      setProfileData({
        name: currentAdmin.name,
        avatar: currentAdmin.avatar || "",
      })
    }
  }, [currentAdmin])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        const [settingsRes, adminsRes] = await Promise.all([
          supabase.from("hotel_settings").select("*").single(),
          supabase.from("admins").select("*").order("created_at"),
        ])

        setSettings(settingsRes.data)
        setAdmins(adminsRes.data || [])
      } catch {
        // Error fetching data
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const saveSettings = async () => {
    if (!settings) return
    setIsSaving(true)

    try {
      const supabase = createClient()
      await supabase
        .from("hotel_settings")
        .update({
          hotel_name: settings.hotel_name,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          currency: settings.currency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // Error saving
    } finally {
      setIsSaving(false)
    }
  }

  const saveProfile = () => {
    updateProfile(profileData)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const addAdmin = async () => {
    if (!newAdminPhone || !newAdminName) return

    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("admins")
        .insert({
          name: newAdminName,
          phone_number: newAdminPhone,
          is_active: true,
        })
        .select()
        .single()

      if (data) {
        setAdmins([...admins, data])
        setNewAdminPhone("")
        setNewAdminName("")
      }
    } catch {
      // Error adding admin
    }
  }

  const toggleAdmin = async (id: string, isActive: boolean) => {
    try {
      const supabase = createClient()
      await supabase.from("admins").update({ is_active: !isActive }).eq("id", id)
      setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !isActive } : a)))
    } catch {
      // Error toggling
    }
  }

  const deleteAdmin = async (id: string) => {
    try {
      const supabase = createClient()
      await supabase.from("admins").delete().eq("id", id)
      setAdmins((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // Error deleting
    }
  }

  const cardClass = resolvedTheme === "light" ? "bg-white border-slate-200 shadow-sm" : "glass-card border-[#D4AF37]/10"
  const inputClass =
    resolvedTheme === "light"
      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
      : "bg-white/5 border-white/10 text-white placeholder:text-white/30"
  const textClass = resolvedTheme === "light" ? "text-slate-900" : "text-white"
  const textMutedClass = resolvedTheme === "light" ? "text-slate-500" : "text-white/60"

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className={cardClass}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className={`h-6 w-48 rounded ${resolvedTheme === "light" ? "bg-slate-200" : "bg-white/10"}`} />
                <div className={`h-10 w-full rounded ${resolvedTheme === "light" ? "bg-slate-200" : "bg-white/10"}`} />
                <div className={`h-10 w-full rounded ${resolvedTheme === "light" ? "bg-slate-200" : "bg-white/10"}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-serif font-bold gold-gradient">{t("settings")}</h1>
        <p className={`mt-1 ${textMutedClass}`}>{t("hotelInfo")}</p>
      </motion.div>

      <Tabs defaultValue="hotel" className="space-y-6">
        <TabsList className={`${resolvedTheme === "light" ? "bg-slate-100" : "bg-white/5"}`}>
          <TabsTrigger value="hotel" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("hotelInfo")}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t("appearance")}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("adminProfile")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t("authorizedNumbers")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Hotel Info Tab */}
        <TabsContent value="hotel">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className={`${textClass} flex items-center gap-2`}>
                <Building2 className="h-5 w-5 text-[#D4AF37]" />
                {t("hotelInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={textMutedClass}>{t("hotelName")}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                    <Input
                      value={settings?.hotel_name || ""}
                      onChange={(e) => setSettings((prev) => (prev ? { ...prev, hotel_name: e.target.value } : null))}
                      className={`pl-10 ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={textMutedClass}>{t("address")}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                    <Input
                      value={settings?.address || ""}
                      onChange={(e) => setSettings((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                      className={`pl-10 ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={textMutedClass}>{t("phone")}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                    <Input
                      value={settings?.phone || ""}
                      onChange={(e) => setSettings((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                      className={`pl-10 ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={textMutedClass}>{t("email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                    <Input
                      type="email"
                      value={settings?.email || ""}
                      onChange={(e) => setSettings((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                      className={`pl-10 ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={textMutedClass}>{t("currency")}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                    <Input
                      value={settings?.currency || ""}
                      onChange={(e) => setSettings((prev) => (prev ? { ...prev, currency: e.target.value } : null))}
                      className={`pl-10 ${inputClass}`}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#071428] font-semibold"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="h-5 w-5 border-2 border-[#071428] border-t-transparent rounded-full"
                  />
                ) : success ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t("save")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("save")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Theme Selection */}
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={`${textClass} flex items-center gap-2`}>
                  <Palette className="h-5 w-5 text-[#D4AF37]" />
                  {t("theme")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", icon: Sun, label: t("lightTheme") },
                    { value: "dark", icon: Moon, label: t("darkTheme") },
                    { value: "system", icon: Monitor, label: t("systemTheme") },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                      className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                        theme === option.value
                          ? "bg-[#D4AF37]/20 border-2 border-[#D4AF37]"
                          : resolvedTheme === "light"
                            ? "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                            : "bg-white/5 border-2 border-transparent hover:border-white/10"
                      }`}
                    >
                      <option.icon
                        className={`h-6 w-6 ${theme === option.value ? "text-[#D4AF37]" : textMutedClass}`}
                      />
                      <span
                        className={`text-xs ${theme === option.value ? "text-[#D4AF37] font-medium" : textMutedClass}`}
                      >
                        {option.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Language Selection */}
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={`${textClass} flex items-center gap-2`}>
                  <Globe className="h-5 w-5 text-[#D4AF37]" />
                  {t("language")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "fr", label: "Français", flag: "🇫🇷" },
                    { value: "en", label: "English", flag: "🇬🇧" },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLanguage(option.value as "fr" | "en")}
                      className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                        language === option.value
                          ? "bg-[#D4AF37]/20 border-2 border-[#D4AF37]"
                          : resolvedTheme === "light"
                            ? "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                            : "bg-white/5 border-2 border-transparent hover:border-white/10"
                      }`}
                    >
                      <span className="text-2xl">{option.flag}</span>
                      <span className={`font-medium ${language === option.value ? "text-[#D4AF37]" : textClass}`}>
                        {option.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className={`${textClass} flex items-center gap-2`}>
                <User className="h-5 w-5 text-[#D4AF37]" />
                {t("adminProfile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-[#D4AF37]/20 flex items-center justify-center overflow-hidden">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar || "/placeholder.svg"}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-[#D4AF37]">
                        {profileData.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#071428] hover:bg-[#F4D03F] transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setProfileData({ ...profileData, avatar: reader.result as string })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </div>
                <p className={`text-sm ${textMutedClass}`}>{t("uploadPhoto")}</p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className={textMutedClass}>{t("name")}</Label>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <Button
                onClick={saveProfile}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#071428] font-semibold"
              >
                <Save className="h-4 w-4 mr-2" />
                {t("save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className={`${textClass} flex items-center gap-2`}>
                <Shield className="h-5 w-5 text-[#D4AF37]" />
                {t("authorizedNumbers")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new admin */}
              <div
                className={`p-4 rounded-lg space-y-3 ${resolvedTheme === "light" ? "bg-slate-50 border border-slate-200" : "bg-white/5 border border-white/10"}`}
              >
                <Input
                  placeholder={t("name")}
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="+243 XXX XXX XXX"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className={inputClass}
                  />
                  <Button
                    onClick={addAdmin}
                    disabled={!newAdminPhone || !newAdminName}
                    className="bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Admin list */}
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      resolvedTheme === "light"
                        ? "bg-slate-50 border border-slate-200"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          admin.is_active ? "bg-emerald-500/20" : "bg-red-500/20"
                        }`}
                      >
                        <Users className={`h-4 w-4 ${admin.is_active ? "text-emerald-400" : "text-red-400"}`} />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${textClass}`}>{admin.name}</p>
                        <p className={`text-xs ${textMutedClass}`}>{admin.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={admin.is_active}
                        onCheckedChange={() => toggleAdmin(admin.id, admin.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAdmin(admin.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className={cardClass}>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-[#D4AF37]" />
              <span className={textMutedClass}>{t("developedBy")}</span>
            </div>
            <motion.a
              href="https://josh-right-congo.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#D4AF37] font-semibold hover:text-[#F4D03F] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Josh R
              <ExternalLink className="h-4 w-4" />
            </motion.a>
            <p className={`text-xs ${textMutedClass} mt-2`}>Hôtel Touriste v1.0 — Place Mulamba, Bukavu</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
