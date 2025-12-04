"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Phone, Lock, Loader2, ArrowLeft, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CHATBOT_INTENTS } from "@/lib/bot-messages"
import Image from "next/image"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

interface ClientData {
  id: string
  full_name: string
  nom?: string
  prenom?: string
  whatsapp_number: string
  fidelite_score?: number
  is_vip?: boolean
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+243")
  const [error, setError] = useState("")
  const [client, setClient] = useState<ClientData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    // Check if already authenticated
    if (typeof window !== "undefined") {
      const savedClient = localStorage.getItem("chatbot_client")
      if (savedClient) {
        const parsed = JSON.parse(savedClient)
        setClient(parsed)
        setIsAuthenticated(true)
        // Add welcome back message
        setMessages([
          {
            id: "welcome",
            text: `Rebonjour ${parsed.full_name || parsed.nom} ! 👋 Content de vous revoir. Comment puis-je vous aider aujourd'hui ?`,
            sender: "bot",
            timestamp: new Date(),
          },
        ])
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleAuthenticate = async () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      setError("Veuillez entrer un numéro de téléphone valide")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()
      if (!supabase) {
        setError("Erreur de connexion. Veuillez réessayer.")
        setIsLoading(false)
        return
      }

      // Search for client by WhatsApp number
      const { data: clients, error: dbError } = await supabase
        .from("clients")
        .select("*")
        .or(`whatsapp_number.eq.${phoneNumber},telephone.eq.${phoneNumber},telephone.eq.${countryCode}${phoneNumber}`)
        .limit(1)

      if (dbError) {
        setError("Erreur lors de la vérification. Veuillez réessayer.")
        setIsLoading(false)
        return
      }

      if (!clients || clients.length === 0) {
        setError("Ce numéro n'est pas enregistré chez nous. Veuillez contacter la réception pour vous inscrire.")
        setIsLoading(false)
        return
      }

      const clientData = clients[0]
      setClient(clientData)
      setIsAuthenticated(true)

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("chatbot_client", JSON.stringify(clientData))
      }

      // Add welcome message
      const welcomeMessage = `Bonjour ${clientData.full_name || clientData.nom || "cher client"} ! 👋 
      
Je suis l'assistant virtuel de l'Hôtel Touriste. Je suis ravi de vous retrouver !

${clientData.is_vip ? "✨ En tant que client VIP, vous bénéficiez d'un service prioritaire." : ""}

Comment puis-je vous aider aujourd'hui ?`

      setMessages([
        {
          id: "welcome",
          text: welcomeMessage,
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.")
    }

    setIsLoading(false)
  }

  const findIntent = (text: string): string => {
    const lowerText = text.toLowerCase().trim()

    for (const [intentName, intentData] of Object.entries(CHATBOT_INTENTS)) {
      for (const example of intentData.examples) {
        if (lowerText.includes(example.toLowerCase())) {
          return intentName
        }
      }
    }

    // Check for keywords
    if (lowerText.includes("bonjour") || lowerText.includes("salut") || lowerText.includes("bonsoir")) {
      return "greeting"
    }
    if (lowerText.includes("réserv")) return "make_reservation"
    if (lowerText.includes("disponib") || lowerText.includes("chambre libre")) return "check_availability"
    if (lowerText.includes("wifi") || lowerText.includes("internet")) return "wifi_info"
    if (lowerText.includes("parking") || lowerText.includes("voiture")) return "parking_info"
    if (lowerText.includes("check-in") || lowerText.includes("arrivée")) return "check_in_time"
    if (lowerText.includes("check-out") || lowerText.includes("départ")) return "check_out_time"
    if (lowerText.includes("merci")) return "thanks"
    if (lowerText.includes("au revoir") || lowerText.includes("bye")) return "goodbye"
    if (lowerText.includes("plainte") || lowerText.includes("problème")) return "complaint"
    if (lowerText.includes("fidélité") || lowerText.includes("vip") || lowerText.includes("score"))
      return "loyalty_status"
    if (lowerText.includes("réception") || lowerText.includes("humain") || lowerText.includes("appeler"))
      return "contact_reception"
    if (lowerText.includes("service") || lowerText.includes("piscine") || lowerText.includes("restaurant"))
      return "amenities"
    if (lowerText.includes("chambre") || lowerText.includes("type") || lowerText.includes("suite")) return "room_types"
    if (lowerText.includes("adresse") || lowerText.includes("venir") || lowerText.includes("itinéraire"))
      return "directions"
    if (lowerText.includes("aide") || lowerText.includes("menu") || lowerText.includes("option")) return "help_menu"

    return "fallback"
  }

  const getBotResponse = (intent: string): string => {
    const intentData = CHATBOT_INTENTS[intent as keyof typeof CHATBOT_INTENTS]
    if (!intentData) return CHATBOT_INTENTS.fallback.responses[0]

    // Check if auth is required
    if (intentData.requiresAuth && !client) {
      return "Pour accéder à cette fonctionnalité, vous devez d'abord vous identifier avec votre numéro WhatsApp."
    }

    const responses = intentData.responses
    const randomIndex = Math.floor(Math.random() * responses.length)
    let response = responses[randomIndex]

    // Replace placeholders
    if (client) {
      response = response.replace(/\{\{nom\}\}/g, client.full_name || client.nom || "cher client")
      response = response.replace(/\{\{fidelite\}\}/g, String(client.fidelite_score || 0))
    }

    return response
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simulate bot thinking
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    const intent = findIntent(userMessage.text)
    const response = getBotResponse(intent)

    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      text: response,
      sender: "bot",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, botMessage])
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("chatbot_client")
    }
    setClient(null)
    setIsAuthenticated(false)
    setMessages([])
    setPhoneNumber("")
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#071428] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#071428] via-[#0a1e3c] to-[#071428] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="glass-card border-[#D4AF37]/20 p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-24 h-24 mb-4">
                <Image
                  src="/images/ei-1764279248104-removebg-preview.png"
                  alt="Hôtel Touriste"
                  fill
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl font-serif font-bold gold-gradient">Hôtel Touriste</h1>
              <p className="text-white/60 text-sm mt-2">Assistant virtuel - Chat client</p>
            </div>

            {/* Auth form */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/10 mb-4">
                  <Lock className="h-8 w-8 text-[#D4AF37]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Identification requise</h2>
                <p className="text-white/60 text-sm">
                  Entrez le numéro WhatsApp que vous avez donné à la réception pour accéder au chat.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  >
                    <option value="+243">🇨🇩 +243</option>
                    <option value="+250">🇷🇼 +250</option>
                    <option value="+257">🇧🇮 +257</option>
                    <option value="+256">🇺🇬 +256</option>
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                  <Input
                    type="tel"
                    placeholder="Numéro WhatsApp"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  onClick={handleAuthenticate}
                  disabled={isLoading || !phoneNumber}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#071428] hover:opacity-90"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                  {isLoading ? "Vérification..." : "Accéder au chat"}
                </Button>
              </div>

              <p className="text-center text-white/40 text-xs">
                Seuls les clients enregistrés peuvent accéder à ce service.
                <br />
                Contactez la réception au +243 976 938 182 pour vous inscrire.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071428] via-[#0a1e3c] to-[#071428] flex flex-col">
      {/* Header */}
      <header className="glass-card border-b border-[#D4AF37]/20 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/images/ei-1764279248104-removebg-preview.png"
                alt="Hôtel Touriste"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-serif font-bold text-white">Hôtel Touriste</h1>
              <p className="text-xs text-[#D4AF37]">Assistant virtuel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-2">
              <p className="text-sm text-white">{client?.full_name || client?.nom}</p>
              {client?.is_vip && <span className="text-xs text-[#D4AF37]">✨ VIP</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/60 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.sender === "user"
                      ? "bg-[#D4AF37] text-[#071428]"
                      : "glass-card border-[#D4AF37]/20 text-white"
                  }`}
                >
                  {message.sender === "bot" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-[#D4AF37]" />
                      <span className="text-xs text-[#D4AF37]">Assistant</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-2 ${message.sender === "user" ? "text-[#071428]/60" : "text-white/40"}`}>
                    {message.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass-card border-[#D4AF37]/20 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#D4AF37]" />
                  <div className="flex gap-1">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-[#D4AF37]"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-[#D4AF37]"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass-card border-t border-[#D4AF37]/20 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#071428]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-white/30 text-xs mt-2">Powered by Hôtel Touriste • Place Mulamba, Bukavu</p>
      </div>
    </div>
  )
}
