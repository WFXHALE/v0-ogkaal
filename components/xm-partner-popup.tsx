"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Copy, Check } from "lucide-react"

const XM_AFFILIATE_LINK = "https://clicks.pipaffiliates.com/c?c=1090940&l=en&p=1"
const PARTNER_CODE = "XV3F9"

interface XmPartnerPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function XmPartnerPopup({ isOpen, onClose }: XmPartnerPopupProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PARTNER_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = () => {
    window.open(XM_AFFILIATE_LINK, "_blank")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl shadow-primary/10 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <span className="text-2xl font-bold text-primary">XM</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Recommended Broker: <span className="text-primary">XM</span>
            </h3>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-sm sm:text-base text-foreground text-center leading-relaxed">
              Please use partner code{" "}
              <span className="font-bold text-primary">XV3F9</span>{" "}
              while creating your account to qualify for the funded account group and VIP access.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Partner Code:</span>
              <span className="font-mono font-bold text-primary text-lg">{PARTNER_CODE}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="border-primary/50 hover:bg-primary/10"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleConfirm}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6 text-base"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open XM Account
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useXmPartnerPopup() {
  const [isOpen, setIsOpen] = useState(false)
  
  const openPopup = () => setIsOpen(true)
  const closePopup = () => setIsOpen(false)
  
  return { isOpen, openPopup, closePopup }
}
