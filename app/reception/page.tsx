"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ReceptionModule } from "@/components/admin/reception-module"
import Image from "next/image"

function ReceptionContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get("clientId")

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <div>
            <h1 className="font-serif font-bold text-lg gold-gradient">HÔTEL TOURISTE</h1>
            <p className="text-xs text-white/50">Interface Réceptionniste</p>
          </div>
        </div>
        {clientId && <span className="text-sm text-[#D4AF37]">Client ID: {clientId}</span>}
      </div>

      <ReceptionModule onClientAction={() => {}} />
    </div>
  )
}

export default function ReceptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Chargement...</div>}>
      <ReceptionContent />
    </Suspense>
  )
}
