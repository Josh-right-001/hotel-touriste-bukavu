"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserCog, Send, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EnhancedClientForm } from "@/components/admin/enhanced-client-form"
import { useLanguage, useTheme } from "@/lib/contexts"

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string | null
}

export function ClientModal({ isOpen, onClose, clientId }: ClientModalProps) {
  const { t } = useLanguage()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [showForm, setShowForm] = useState(false)

  const handleExecuteSelf = () => {
    setShowForm(true)
  }

  const handleGiveToReceptionist = () => {
    const url = clientId ? `/reception/handling?clientId=${clientId}` : "/reception"
    window.open(url, "_blank")
    onClose()
  }

  const handleFormSuccess = (newClientId: string) => {
    setShowForm(false)
    onClose()
  }

  const cardBgClass = isDark
    ? "glass border-[#D4AF37]/20 hover:border-[#D4AF37]/40"
    : "bg-slate-50 border-slate-200 hover:border-slate-300"

  const textClass = isDark ? "text-white" : "text-slate-900"
  const textMutedClass = isDark ? "text-white/60" : "text-slate-500"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${showForm ? "max-w-4xl max-h-[90vh] overflow-y-auto" : "max-w-md"} ${
          isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className={`text-xl font-serif flex items-center gap-2 ${isDark ? "gold-gradient" : "text-slate-900"}`}
          >
            <User className="h-5 w-5 text-[#D4AF37]" />
            {showForm ? "Enregistrer un nouveau client" : t("whatToDo")}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 mt-4"
            >
              {/* Option A: Execute myself */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExecuteSelf}
                className={`w-full p-4 rounded-xl border transition-all group text-left ${cardBgClass}`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center group-hover:bg-[#D4AF37]/30 transition-colors">
                    <UserCog className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold group-hover:text-[#D4AF37] transition-colors ${textClass}`}>
                      {t("executeSelf")}
                    </h3>
                    <p className={`text-sm mt-1 ${textMutedClass}`}>{t("executeSelfDesc")}</p>
                  </div>
                </div>
              </motion.button>

              {/* Option B: Give to receptionist */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGiveToReceptionist}
                className={`w-full p-4 rounded-xl border transition-all group text-left ${
                  isDark
                    ? "glass border-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center transition-colors ${
                      isDark ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
                    }`}
                  >
                    <Send className={`h-6 w-6 ${isDark ? "text-white/80" : "text-slate-600"}`} />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold transition-colors flex items-center gap-2 ${
                        isDark ? "text-white/90 group-hover:text-white" : "text-slate-700 group-hover:text-slate-900"
                      }`}
                    >
                      {t("giveToReceptionist")}
                      <ExternalLink className="h-4 w-4" />
                    </h3>
                    <p className={`text-sm mt-1 ${textMutedClass}`}>{t("giveToReceptionistDesc")}</p>
                  </div>
                </div>
              </motion.button>

              <div className={`mt-4 pt-4 border-t ${isDark ? "border-white/10" : "border-slate-200"}`}>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className={`w-full ${textMutedClass} ${isDark ? "hover:bg-white/5" : "hover:bg-slate-100"}`}
                >
                  {t("cancel")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-4"
            >
              <EnhancedClientForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
                isReceptionist={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
