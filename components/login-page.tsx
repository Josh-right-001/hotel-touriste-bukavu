"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Phone, ArrowRight, AlertCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface LoginPageProps {
  onSuccess: (admin: { name: string; phone: string }) => void
}

const AUTHORIZED_NUMBERS = ["+243976938182", "+243974156933"]

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    let digits = value.replace(/\D/g, "")

    // Add + prefix if starts with 243
    if (digits.startsWith("243")) {
      return "+" + digits
    }

    // If starts with 0, replace with +243
    if (digits.startsWith("0")) {
      digits = "243" + digits.slice(1)
      return "+" + digits
    }

    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formattedNumber = formatPhoneNumber(phoneNumber)

    // Check against authorized numbers first (offline check)
    if (!AUTHORIZED_NUMBERS.includes(formattedNumber)) {
      setError("Numéro non autorisé. Accès refusé.")
      setIsLoading(false)
      return
    }

    try {
      // Verify against database
      const supabase = createClient()
      const { data: admin, error: dbError } = await supabase
        .from("admins")
        .select("*")
        .eq("phone_number", formattedNumber)
        .eq("is_active", true)
        .single()

      if (dbError || !admin) {
        setError("Numéro non autorisé. Accès refusé.")
        setIsLoading(false)
        return
      }

      // Success
      onSuccess({ name: admin.name, phone: admin.phone_number })
    } catch {
      // If database check fails, fallback to local check
      if (AUTHORIZED_NUMBERS.includes(formattedNumber)) {
        onSuccess({ name: "Administrateur", phone: formattedNumber })
      } else {
        setError("Erreur de connexion. Veuillez réessayer.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Logo and header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} className="inline-block mb-6">
            <Image src="/logo.png" alt="Hôtel Touriste" width={100} height={100} className="mx-auto" priority />
          </motion.div>
          <h1 className="text-3xl font-serif font-bold gold-gradient mb-2">Connexion</h1>
          <p className="text-white/60 text-sm">Accès Administratif Sécurisé</p>
        </motion.div>

        {/* Login form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6 text-[#D4AF37]">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Connexion WhatsApp sécurisée</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80 font-medium">Numéro WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#D4AF37]/60" />
                <Input
                  type="tel"
                  placeholder="+243 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading || !phoneNumber}
              className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#F4D03F] hover:to-[#D4AF37] text-[#071428] font-semibold transition-all duration-300 ripple"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="h-5 w-5 border-2 border-[#071428] border-t-transparent rounded-full"
                />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Address */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">Hôtel Touriste — Place Mulamba, Réf : 261 Ave Lumumba, Bukavu</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function AnimatePresence({ children, mode }: { children: React.ReactNode; mode?: string }) {
  return <>{children}</>
}
