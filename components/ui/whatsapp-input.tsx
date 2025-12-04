"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, AlertCircle, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COUNTRY_CODES, type CountryCode } from "@/lib/types"
import { useTheme } from "@/lib/contexts"

interface WhatsAppInputProps {
  value: string
  countryCode: string
  onChange: (number: string, countryCode: string, isValid: boolean) => void
  required?: boolean
  label?: string
}

export function WhatsAppInput({
  value,
  countryCode,
  onChange,
  required = true,
  label = "Numéro WhatsApp",
}: WhatsAppInputProps) {
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find((c) => c.dial_code === countryCode) || COUNTRY_CODES[0],
  )
  const [localValue, setLocalValue] = useState(value)
  const [isValid, setIsValid] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  useEffect(() => {
    // Validate number length
    const cleanNumber = localValue.replace(/\D/g, "")
    const valid = cleanNumber.length >= selectedCountry.min_length && cleanNumber.length <= selectedCountry.max_length
    setIsValid(valid)
    onChange(cleanNumber, selectedCountry.dial_code, valid)
  }, [localValue, selectedCountry, onChange])

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "")
    setLocalValue(input)
    if (!isTouched) setIsTouched(true)
  }

  const getValidationState = () => {
    if (!isTouched) return "neutral"
    if (isValid) return "valid"
    return "invalid"
  }

  const validationState = getValidationState()
  const isDark = resolvedTheme === "dark"

  return (
    <div className="space-y-2">
      <Label className={isDark ? "text-white/80" : "text-slate-700"}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        {/* Country selector */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-28 justify-between ${
                isDark
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-1">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dial_code}</span>
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={`w-56 p-0 ${isDark ? "glass-card border-[#D4AF37]/20" : "bg-white border-slate-200"}`}
          >
            <div className="max-h-60 overflow-y-auto">
              {COUNTRY_CODES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    isDark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-900"
                  } ${selectedCountry.code === country.code ? (isDark ? "bg-[#D4AF37]/20" : "bg-slate-100") : ""}`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="flex-1 text-sm">{country.name}</span>
                  <span className={`text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}>{country.dial_code}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Number input */}
        <div className="relative flex-1">
          <Input
            value={localValue}
            onChange={handleInputChange}
            onBlur={() => setIsTouched(true)}
            placeholder={`${"0".repeat(selectedCountry.min_length)}`}
            className={`pr-10 transition-all ${
              isDark
                ? "bg-white/5 text-white placeholder:text-white/30"
                : "bg-white text-slate-900 placeholder:text-slate-400"
            } ${
              validationState === "valid"
                ? "border-emerald-500 focus:border-emerald-500"
                : validationState === "invalid"
                  ? "border-red-500 focus:border-red-500"
                  : isDark
                    ? "border-white/10"
                    : "border-slate-200"
            }`}
            required={required}
          />
          <AnimatePresence>
            {validationState !== "neutral" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {validationState === "valid" ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Validation message */}
      <AnimatePresence>
        {isTouched && !isValid && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-500"
          >
            Le numéro doit contenir {selectedCountry.min_length} chiffres pour {selectedCountry.name}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
