"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { UserCog, Send, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string | null
}

export function ClientModal({ isOpen, onClose, clientId }: ClientModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExecuteSelf = () => {
    setIsLoading(true)
    // Navigate to client page or reception
    window.location.href = clientId ? `/admin/client/${clientId}` : "/admin/reception"
    onClose()
  }

  const handleGiveToReceptionist = () => {
    // Open receptionist page in new tab with client context
    const url = clientId ? `/reception/handling?clientId=${clientId}` : "/reception"
    window.open(url, "_blank")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-[#D4AF37]/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif gold-gradient flex items-center gap-2">
            <User className="h-5 w-5 text-[#D4AF37]" />
            Que voulez-vous faire pour ce client ?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Option A: Execute myself */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExecuteSelf}
            disabled={isLoading}
            className="w-full p-4 rounded-xl glass border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center group-hover:bg-[#D4AF37]/30 transition-colors">
                <UserCog className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                  Exécuter moi-même
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Accéder directement à la page client pour éditer, voir l&apos;historique et gérer toutes les
                  fonctions.
                </p>
              </div>
            </div>
          </motion.button>

          {/* Option B: Give to receptionist */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGiveToReceptionist}
            className="w-full p-4 rounded-xl glass border border-white/10 hover:border-white/20 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Send className="h-6 w-6 text-white/80" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors flex items-center gap-2">
                  Donner au réceptionniste
                  <ExternalLink className="h-4 w-4" />
                </h3>
                <p className="text-sm text-white/50 mt-1">
                  Ouvre une nouvelle page pour le réceptionniste. Une notification sera envoyée après traitement.
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} className="w-full text-white/60 hover:text-white hover:bg-white/5">
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
