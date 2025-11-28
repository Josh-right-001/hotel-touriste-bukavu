"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    if (isStandalone) return

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Show iOS prompt after delay
    if (isIOSDevice && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 5000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem("installPromptDismissed", "true")
  }

  // Check if dismissed
  useEffect(() => {
    if (sessionStorage.getItem("installPromptDismissed")) {
      setShowPrompt(false)
    }
  }, [])

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
        >
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
                <Smartphone className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm">Installer l&apos;application</h3>
                <p className="text-xs text-white/60 mt-1">
                  {isIOS
                    ? "Appuyez sur Partager puis 'Sur l'écran d'accueil'"
                    : "Accédez rapidement à Hôtel Touriste depuis votre écran d'accueil"}
                </p>
              </div>
              <button onClick={handleDismiss} className="text-white/40 hover:text-white/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isIOS && deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="w-full mt-3 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428] font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Installer
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
