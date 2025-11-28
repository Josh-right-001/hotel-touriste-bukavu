"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Send, Plus, Edit, Trash2, Phone, Mail, Clock, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { MessageTemplate, MessageLog, Client } from "@/lib/types"

export function BotModule() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedChannel, setSelectedChannel] = useState<"whatsapp" | "email">("whatsapp")

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    trigger: "manuel" as const,
    days_threshold: 30,
    is_active: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [templatesRes, logsRes, clientsRes] = await Promise.all([
        supabase.from("message_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("message_logs").select("*").order("date", { ascending: false }).limit(50),
        supabase.from("clients").select("*").order("full_name"),
      ])

      setTemplates(templatesRes.data || [])
      setLogs(logsRes.data || [])
      setClients(clientsRes.data || [])
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const saveTemplate = async () => {
    const supabase = createClient()

    if (selectedTemplate) {
      await supabase.from("message_templates").update(newTemplate).eq("id", selectedTemplate.id)
    } else {
      await supabase.from("message_templates").insert(newTemplate)
    }

    // Refresh templates
    const { data } = await supabase.from("message_templates").select("*").order("created_at", { ascending: false })
    setTemplates(data || [])
    setShowTemplateDialog(false)
    setSelectedTemplate(null)
    setNewTemplate({
      name: "",
      content: "",
      trigger: "manuel",
      days_threshold: 30,
      is_active: true,
    })
  }

  const deleteTemplate = async (id: string) => {
    const supabase = createClient()
    await supabase.from("message_templates").delete().eq("id", id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const sendMessage = async () => {
    if (!selectedClient || !selectedTemplate) return

    const supabase = createClient()
    const client = clients.find((c) => c.id === selectedClient)

    // Log the message (simulation)
    await supabase.from("message_logs").insert({
      client_id: selectedClient,
      template_id: selectedTemplate.id,
      canal: selectedChannel,
      statut: "sent",
    })

    // Create notification
    await supabase.from("notifications").insert({
      titre: "Message envoyé",
      body: `Message "${selectedTemplate.name}" envoyé à ${client?.full_name} via ${selectedChannel}`,
      client_id: selectedClient,
      type: "bot_envoi",
    })

    // Refresh logs
    const { data } = await supabase.from("message_logs").select("*").order("date", { ascending: false }).limit(50)
    setLogs(data || [])
    setShowSendDialog(false)
  }

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case "post_checkout":
        return "Après check-out"
      case "inactif":
        return "Client inactif"
      case "anniversaire":
        return "Anniversaire"
      default:
        return "Manuel"
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
          <h1 className="text-2xl font-serif font-bold gold-gradient">Bot Messages</h1>
          <p className="text-white/60 mt-1">Automatisation des messages clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#071428]">
                <Send className="h-4 w-4 mr-2" />
                Envoyer un message
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-[#D4AF37]/20 text-white">
              <DialogHeader>
                <DialogTitle className="gold-gradient">Envoyer un message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-[#D4AF37]/20">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select
                    value={selectedTemplate?.id || ""}
                    onValueChange={(v) => setSelectedTemplate(templates.find((t) => t.id === v) || null)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-[#D4AF37]/20">
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedChannel === "whatsapp" ? "default" : "outline"}
                      onClick={() => setSelectedChannel("whatsapp")}
                      className={selectedChannel === "whatsapp" ? "bg-emerald-600" : ""}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant={selectedChannel === "email" ? "default" : "outline"}
                      onClick={() => setSelectedChannel("email")}
                      className={selectedChannel === "email" ? "bg-blue-600" : ""}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </div>
                {selectedTemplate && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-white/80">{selectedTemplate.content}</p>
                  </div>
                )}
                <Button
                  onClick={sendMessage}
                  disabled={!selectedClient || !selectedTemplate}
                  className="w-full bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-[#D4AF37]/30 text-[#D4AF37] bg-transparent"
                onClick={() => {
                  setSelectedTemplate(null)
                  setNewTemplate({
                    name: "",
                    content: "",
                    trigger: "manuel",
                    days_threshold: 30,
                    is_active: true,
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau template
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-[#D4AF37]/20 text-white">
              <DialogHeader>
                <DialogTitle className="gold-gradient">
                  {selectedTemplate ? "Modifier le template" : "Nouveau template"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nom du template</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Ex: Message de bienvenue"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contenu (utilisez {"{{nom}}"} pour le nom du client)</Label>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Bonjour {{nom}}, merci d'avoir choisi l'Hôtel Touriste..."
                    className="bg-white/5 border-white/10 min-h-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Déclencheur</Label>
                  <Select
                    value={newTemplate.trigger}
                    onValueChange={(v: "post_checkout" | "inactif" | "anniversaire" | "manuel") =>
                      setNewTemplate({ ...newTemplate, trigger: v })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-[#D4AF37]/20">
                      <SelectItem value="manuel">Manuel</SelectItem>
                      <SelectItem value="post_checkout">Après check-out</SelectItem>
                      <SelectItem value="inactif">Client inactif</SelectItem>
                      <SelectItem value="anniversaire">Anniversaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newTemplate.trigger === "inactif" && (
                  <div className="space-y-2">
                    <Label>Jours d&apos;inactivité</Label>
                    <Input
                      type="number"
                      value={newTemplate.days_threshold}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, days_threshold: Number.parseInt(e.target.value) })
                      }
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label>Actif</Label>
                  <Switch
                    checked={newTemplate.is_active}
                    onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, is_active: checked })}
                  />
                </div>
                <Button onClick={saveTemplate} className="w-full bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428]">
                  {selectedTemplate ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Templates */}
        <Card className="glass-card border-[#D4AF37]/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#D4AF37]" />
              Templates de messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{template.name}</h3>
                      <Badge
                        className={
                          template.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"
                        }
                      >
                        {template.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/50 mt-1 line-clamp-2">{template.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs text-[#D4AF37] border-[#D4AF37]/30">
                        {getTriggerLabel(template.trigger)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setNewTemplate({
                          name: template.name,
                          content: template.content,
                          trigger: template.trigger,
                          days_threshold: template.days_threshold || 30,
                          is_active: template.is_active,
                        })
                        setShowTemplateDialog(true)
                      }}
                      className="text-white/40 hover:text-[#D4AF37]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="glass-card border-[#D4AF37]/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#D4AF37]" />
              Journal d&apos;envoi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-white/50 py-8">Aucun message envoyé</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      log.statut === "delivered"
                        ? "bg-emerald-500/20"
                        : log.statut === "failed"
                          ? "bg-red-500/20"
                          : "bg-blue-500/20"
                    }`}
                  >
                    {log.statut === "delivered" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : log.statut === "failed" ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Send className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.canal === "whatsapp" ? (
                          <Phone className="h-3 w-3 mr-1" />
                        ) : (
                          <Mail className="h-3 w-3 mr-1" />
                        )}
                        {log.canal}
                      </Badge>
                      <span className="text-xs text-white/40">{new Date(log.date).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
