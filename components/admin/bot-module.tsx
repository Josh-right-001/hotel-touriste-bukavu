"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MessageSquare,
  Send,
  Plus,
  Phone,
  Mail,
  CheckCircle,
  Sparkles,
  AtSign,
  Link,
  Copy,
  ExternalLink,
} from "lucide-react"
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
import { useTheme, useLanguage } from "@/lib/contexts"
import { getSmartMessage, addChatbotLinkToMessage, BOT_MESSAGES } from "@/lib/bot-messages"

export function BotModule() {
  const { resolvedTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = resolvedTheme === "dark"

  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedChannel, setSelectedChannel] = useState<"whatsapp" | "email">("whatsapp")
  const [selectedCategory, setSelectedCategory] = useState<string>("auto")
  const [includeChatbotLink, setIncludeChatbotLink] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  // Email configuration
  const [emailConfig, setEmailConfig] = useState({
    senderEmail: "",
    recipientEmail: "",
  })

  // WhatsApp configuration
  const [whatsappSender, setWhatsappSender] = useState("")

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    trigger: "manuel" as MessageTemplate["trigger"],
    days_threshold: 30,
    is_active: true,
  })

  // Generated message preview
  const [generatedMessage, setGeneratedMessage] = useState("")

  // Get chatbot URL
  const chatbotUrl = typeof window !== "undefined" ? `${window.location.origin}/chat` : "/chat"

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      if (!supabase) {
        setIsLoading(false)
        return
      }

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

  // Generate intelligent message based on client and category
  const generateMessage = (clientData: Client | undefined, category: string) => {
    if (!clientData) return ""

    let message = ""

    if (category === "auto") {
      // Smart selection based on client data
      message = getSmartMessage(clientData)
    } else {
      // Use specific category
      const categoryKey = category as keyof typeof BOT_MESSAGES
      if (BOT_MESSAGES[categoryKey]) {
        const messages = BOT_MESSAGES[categoryKey]
        const randomIndex = Math.floor(Math.random() * messages.length)
        const baseMessage = messages[randomIndex]
        const clientName = clientData.full_name || clientData.nom || "Client"
        message = `Cher(e) ${clientName}, ${baseMessage.charAt(0).toLowerCase()}${baseMessage.slice(1)}`
      }
    }

    // Add chatbot link if enabled
    if (includeChatbotLink) {
      message = addChatbotLinkToMessage(message, chatbotUrl)
    }

    return message
  }

  useEffect(() => {
    const client = clients.find((c) => c.id === selectedClient)
    if (client) {
      setGeneratedMessage(generateMessage(client, selectedCategory))
    }
  }, [selectedClient, selectedCategory, includeChatbotLink, clients])

  const copyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(chatbotUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const saveTemplate = async () => {
    const supabase = createClient()
    if (!supabase) return

    if (selectedTemplate) {
      await supabase.from("message_templates").update(newTemplate).eq("id", selectedTemplate.id)
    } else {
      await supabase.from("message_templates").insert(newTemplate)
    }

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
    if (!supabase) return
    await supabase.from("message_templates").delete().eq("id", id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const sendMessage = async () => {
    if (!selectedClient || !generatedMessage) return

    const supabase = createClient()
    if (!supabase) return

    const client = clients.find((c) => c.id === selectedClient)

    // For email, open email dialog first
    if (selectedChannel === "email") {
      setShowEmailDialog(true)
      return
    }

    // Log the message
    await supabase.from("message_logs").insert({
      client_id: selectedClient,
      template_id: selectedTemplate?.id || null,
      canal: selectedChannel,
      statut: "sent",
    })

    // Create notification
    await supabase.from("notifications").insert({
      titre: "Message WhatsApp envoyé",
      body: `Message envoyé à ${client?.full_name} via WhatsApp`,
      client_id: selectedClient,
      type: "bot_envoi",
    })

    // Open WhatsApp link
    const whatsappNumber =
      `${client?.whatsapp_country_code || "+243"}${client?.whatsapp_number || client?.telephone}`.replace(/\D/g, "")
    const encodedMessage = encodeURIComponent(generatedMessage)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank")

    // Refresh logs
    const { data } = await supabase.from("message_logs").select("*").order("date", { ascending: false }).limit(50)
    setLogs(data || [])
    setShowSendDialog(false)
  }

  const sendEmail = async () => {
    if (!selectedClient || !generatedMessage || !emailConfig.senderEmail || !emailConfig.recipientEmail) return

    const supabase = createClient()
    if (!supabase) return

    const client = clients.find((c) => c.id === selectedClient)

    // Log the message
    await supabase.from("message_logs").insert({
      client_id: selectedClient,
      template_id: selectedTemplate?.id || null,
      canal: "email",
      statut: "sent",
      sender_email: emailConfig.senderEmail,
      recipient_email: emailConfig.recipientEmail,
    })

    // Create notification
    await supabase.from("notifications").insert({
      titre: "Email envoyé",
      body: `Email envoyé à ${client?.full_name} (${emailConfig.recipientEmail})`,
      client_id: selectedClient,
      type: "bot_envoi",
    })

    // Open mailto link
    const subject = encodeURIComponent(`Hôtel Touriste - Message pour ${client?.full_name}`)
    const body = encodeURIComponent(generatedMessage)
    window.open(`mailto:${emailConfig.recipientEmail}?subject=${subject}&body=${body}`, "_blank")

    // Refresh logs
    const { data } = await supabase.from("message_logs").select("*").order("date", { ascending: false }).limit(50)
    setLogs(data || [])
    setShowEmailDialog(false)
    setShowSendDialog(false)
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "remerciement":
        return "Remerciement après séjour"
      case "rappel":
        return "Rappel après absence"
      case "vip":
        return "Client VIP / Fidèle"
      case "bienvenue":
        return "Bienvenue"
      case "doublon":
        return "Client récurrent"
      case "invitation":
        return "Invitation à revenir"
      case "anniversaire":
        return "Anniversaire"
      default:
        return "Sélection automatique"
    }
  }

  const cardClass = isDark ? "glass-card border-[#D4AF37]/10" : "bg-white border-slate-200 shadow-sm"
  const textClass = isDark ? "text-white" : "text-slate-900"
  const mutedClass = isDark ? "text-white/60" : "text-slate-500"
  const inputClass = isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className={`text-2xl font-serif font-bold ${isDark ? "gold-gradient" : "text-slate-900"}`}>
            Bot Messages Intelligent
          </h1>
          <p className={mutedClass}>600+ messages personnalisés avec lien chatbot</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Chatbot Link Card */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-white/5 border border-white/10" : "bg-slate-100"}`}
          >
            <Link className="h-4 w-4 text-[#D4AF37]" />
            <span className={`text-sm ${mutedClass}`}>Chatbot:</span>
            <code className={`text-xs ${textClass}`}>/chat</code>
            <Button variant="ghost" size="sm" onClick={copyLink} className="h-6 w-6 p-0">
              {copiedLink ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(chatbotUrl, "_blank")} className="h-6 w-6 p-0">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>

          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#071428]">
                <Send className="h-4 w-4 mr-2" />
                Envoyer un message
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`max-w-lg ${isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}`}
            >
              <DialogHeader>
                <DialogTitle className={isDark ? "gold-gradient" : "text-slate-900"}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                    Envoyer un message intelligent
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className={textClass}>Client</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <span>{client.full_name || client.nom}</span>
                            {client.is_vip && <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">VIP</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={textClass}>Catégorie de message</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Sélection automatique" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                          Sélection automatique (intelligent)
                        </div>
                      </SelectItem>
                      <SelectItem value="bienvenue">Bienvenue</SelectItem>
                      <SelectItem value="remerciement">Remerciement après séjour</SelectItem>
                      <SelectItem value="rappel">Rappel après absence</SelectItem>
                      <SelectItem value="vip">Client VIP / Fidèle</SelectItem>
                      <SelectItem value="doublon">Client récurrent</SelectItem>
                      <SelectItem value="invitation">Invitation à revenir</SelectItem>
                      <SelectItem value="anniversaire">Anniversaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={textClass}>Canal d&apos;envoi</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={selectedChannel === "whatsapp" ? "default" : "outline"}
                      onClick={() => setSelectedChannel("whatsapp")}
                      className={selectedChannel === "whatsapp" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant={selectedChannel === "email" ? "default" : "outline"}
                      onClick={() => setSelectedChannel("email")}
                      className={selectedChannel === "email" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </div>

                {/* Include chatbot link toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-[#D4AF37]" />
                    <Label className={textClass}>Inclure lien vers chatbot</Label>
                  </div>
                  <Switch checked={includeChatbotLink} onCheckedChange={setIncludeChatbotLink} />
                </div>

                {/* Generated message preview */}
                {selectedClient && (
                  <div
                    className={`p-4 rounded-lg border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                      <Label className={textClass}>Message généré</Label>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(selectedCategory)}
                      </Badge>
                    </div>
                    <p className={`text-sm ${mutedClass} whitespace-pre-wrap`}>{generatedMessage}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const client = clients.find((c) => c.id === selectedClient)
                        if (client) {
                          setGeneratedMessage(generateMessage(client, selectedCategory))
                        }
                      }}
                      className="mt-2 text-[#D4AF37] hover:text-[#F4D03F]"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Regénérer
                    </Button>
                  </div>
                )}

                <Button
                  onClick={sendMessage}
                  disabled={!selectedClient || !generatedMessage}
                  className="w-full bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {selectedChannel === "whatsapp" ? "Ouvrir WhatsApp" : "Configurer l'email"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Email configuration dialog */}
          <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
            <DialogContent
              className={`max-w-md ${isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}`}
            >
              <DialogHeader>
                <DialogTitle className={isDark ? "gold-gradient" : "text-slate-900"}>
                  <div className="flex items-center gap-2">
                    <AtSign className="h-5 w-5 text-[#D4AF37]" />
                    Configuration Email
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className={textClass}>Email expéditeur</Label>
                  <Input
                    type="email"
                    value={emailConfig.senderEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                    placeholder="votre-email@exemple.com"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={textClass}>Email destinataire</Label>
                  <Input
                    type="email"
                    value={emailConfig.recipientEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, recipientEmail: e.target.value })}
                    placeholder="client@exemple.com"
                    className={inputClass}
                  />
                </div>
                <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <p className={`text-sm ${mutedClass} whitespace-pre-wrap`}>
                    <strong>Message:</strong> {generatedMessage}
                  </p>
                </div>
                <Button
                  onClick={sendEmail}
                  disabled={!emailConfig.senderEmail || !emailConfig.recipientEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Ouvrir client email
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={isDark ? "border-[#D4AF37]/30 text-[#D4AF37] bg-transparent" : ""}
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
            <DialogContent className={isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}>
              <DialogHeader>
                <DialogTitle className={isDark ? "gold-gradient" : "text-slate-900"}>
                  {selectedTemplate ? "Modifier le template" : "Nouveau template"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className={textClass}>Nom du template</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Ex: Remerciement VIP"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={textClass}>Contenu</Label>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Utilisez {{nom}} pour le nom du client"
                    rows={4}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={textClass}>Déclencheur</Label>
                  <Select
                    value={newTemplate.trigger}
                    onValueChange={(v) => setNewTemplate({ ...newTemplate, trigger: v as MessageTemplate["trigger"] })}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}>
                      <SelectItem value="manuel">Manuel</SelectItem>
                      <SelectItem value="bienvenue">Bienvenue</SelectItem>
                      <SelectItem value="post_checkout">Après check-out</SelectItem>
                      <SelectItem value="inactif">Client inactif</SelectItem>
                      <SelectItem value="anniversaire">Anniversaire</SelectItem>
                      <SelectItem value="vip_100">VIP 100%</SelectItem>
                      <SelectItem value="doublon">Client récurrent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className={textClass}>Actif</Label>
                  <Switch
                    checked={newTemplate.is_active}
                    onCheckedChange={(v) => setNewTemplate({ ...newTemplate, is_active: v })}
                  />
                </div>
                <Button onClick={saveTemplate} className="w-full bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428]">
                  Sauvegarder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={cardClass}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                  <MessageSquare className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textClass}`}>600+</p>
                  <p className={`text-sm ${mutedClass}`}>Messages disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={cardClass}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textClass}`}>{logs.filter((l) => l.statut === "sent").length}</p>
                  <p className={`text-sm ${mutedClass}`}>Messages envoyés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={cardClass}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Link className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textClass}`}>Actif</p>
                  <p className={`text-sm ${mutedClass}`}>Chatbot client</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className={cardClass}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textClass}`}>{templates.filter((t) => t.is_active).length}</p>
                  <p className={`text-sm ${mutedClass}`}>Templates actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Message Categories Preview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={textClass}>Catégories de messages (600+)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: "remerciement", label: "Remerciements", count: 100, color: "emerald" },
                { key: "rappel", label: "Rappels absence", count: 100, color: "orange" },
                { key: "vip", label: "Clients VIP", count: 100, color: "amber" },
                { key: "bienvenue", label: "Bienvenue", count: 100, color: "blue" },
                { key: "doublon", label: "Clients récurrents", count: 100, color: "purple" },
                { key: "invitation", label: "Invitations", count: 100, color: "pink" },
              ].map((cat) => (
                <div
                  key={cat.key}
                  className={`p-4 rounded-lg border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${textClass}`}>{cat.label}</span>
                    <Badge className={`bg-${cat.color}-500/20 text-${cat.color}-500`}>{cat.count}</Badge>
                  </div>
                  <p className={`text-xs ${mutedClass}`}>
                    {BOT_MESSAGES[cat.key as keyof typeof BOT_MESSAGES]?.[0]?.substring(0, 60)}...
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Logs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={textClass}>Historique des envois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className={`text-center py-8 ${mutedClass}`}>Aucun message envoyé</p>
              ) : (
                logs.slice(0, 10).map((log) => {
                  const client = clients.find((c) => c.id === log.client_id)
                  return (
                    <div
                      key={log.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        {log.canal === "whatsapp" ? (
                          <Phone className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-500" />
                        )}
                        <div>
                          <p className={`font-medium ${textClass}`}>{client?.full_name || client?.nom || "Client"}</p>
                          <p className={`text-xs ${mutedClass}`}>
                            {new Date(log.date).toLocaleDateString("fr-FR")} - {log.canal}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          log.statut === "sent" ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                        }
                      >
                        {log.statut === "sent" ? "Envoyé" : "Échec"}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
