"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
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
  Palette,
  ExternalLink,
  Code2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import type { HotelSettings, Admin } from "@/lib/types"

export function SettingsModule() {
  const [settings, setSettings] = useState<HotelSettings | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newAdminPhone, setNewAdminPhone] = useState("")
  const [newAdminName, setNewAdminName] = useState("")

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [settingsRes, adminsRes] = await Promise.all([
        supabase.from("hotel_settings").select("*").single(),
        supabase.from("admins").select("*").order("created_at"),
      ])

      setSettings(settingsRes.data)
      setAdmins(adminsRes.data || [])
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const saveSettings = async () => {
    if (!settings) return
    setIsSaving(true)

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

    setIsSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const addAdmin = async () => {
    if (!newAdminPhone || !newAdminName) return

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
  }

  const toggleAdmin = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase.from("admins").update({ is_active: !isActive }).eq("id", id)
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !isActive } : a)))
  }

  const deleteAdmin = async (id: string) => {
    const supabase = createClient()
    await supabase.from("admins").delete().eq("id", id)
    setAdmins((prev) => prev.filter((a) => a.id !== id))
  }

  const themeOptions = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
    { value: "system", label: "Système", icon: Monitor },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="glass-card border-[#D4AF37]/10">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-48 bg-foreground/10 rounded" />
                <div className="h-10 w-full bg-foreground/10 rounded" />
                <div className="h-10 w-full bg-foreground/10 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-serif font-bold gold-gradient">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Configuration de l&apos;hôtel</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hotel info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-card border-[#D4AF37]/10">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#D4AF37]" />
                Informations de l&apos;hôtel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nom de l&apos;hôtel</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.hotel_name || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, hotel_name: e.target.value } : null))}
                    className="pl-10 bg-background/50 border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.address || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                    className="pl-10 bg-background/50 border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.phone || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                    className="pl-10 bg-background/50 border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    type="email"
                    value={settings?.email || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                    className="pl-10 bg-background/50 border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Devise</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.currency || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, currency: e.target.value } : null))}
                    className="pl-10 bg-background/50 border-border text-foreground"
                  />
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
                    Enregistré
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admins */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-card border-[#D4AF37]/10">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#D4AF37]" />
                Numéros autorisés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new admin */}
              <div className="p-4 rounded-lg bg-background/50 border border-border space-y-3">
                <Input
                  placeholder="Nom"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="+243 XXX XXX XXX"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
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
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          admin.is_active ? "bg-emerald-500/20" : "bg-muted"
                        }`}
                      >
                        <Users
                          className={`h-4 w-4 ${admin.is_active ? "text-emerald-400" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">{admin.phone_number}</p>
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
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-[#D4AF37]/10">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#D4AF37]" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label className="text-muted-foreground">Thème de l&apos;application</Label>
              <div className="grid grid-cols-3 gap-3">
                {mounted &&
                  themeOptions.map((option) => {
                    const Icon = option.icon
                    const isActive = theme === option.value
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                          isActive
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                            : "bg-background/50 border-border text-muted-foreground hover:border-[#D4AF37]/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${isActive ? "text-[#D4AF37]" : ""}`} />
                        <span className="text-sm font-medium">{option.label}</span>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 h-3 w-3 bg-[#D4AF37] rounded-full"
                          />
                        )}
                      </motion.button>
                    )
                  })}
              </div>
              <p className="text-xs text-muted-foreground">
                Le thème &quot;Système&quot; s&apos;adapte automatiquement aux préférences de votre appareil.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card border-[#D4AF37]/10">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Code2 className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm">Développé par</span>
              </div>
              <a
                href="https://josh-right-congo.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2"
              >
                <motion.span whileHover={{ scale: 1.05 }} className="font-serif font-bold text-lg gold-gradient">
                  Josh
                </motion.span>
                <motion.div
                  whileHover={{ x: 3 }}
                  className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-4 w-4" />
                </motion.div>
              </a>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              © {new Date().getFullYear()} Hôtel Touriste Bukavu. Tous droits réservés.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
