"use client"

import { useState, useRef } from "react"
import { X, Upload, CheckCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import type { DashboardSession } from "@/lib/dash-auth"

interface KycModalProps {
  session: DashboardSession
  onClose: () => void
  onSubmitted: () => void
}

export function KycModal({ session, onClose, onSubmitted }: KycModalProps) {
  const [phone,     setPhone]     = useState(session.phone ?? "")
  const [telegram,  setTelegram]  = useState("")
  const [instagram, setInstagram] = useState("")
  const [address,   setAddress]   = useState("")
  const [selfie,    setSelfie]    = useState<File | null>(null)
  const [idFront,   setIdFront]   = useState<File | null>(null)
  const [idBack,    setIdBack]    = useState<File | null>(null)

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState("")
  const [success,   setSuccess]   = useState(false)

  const selfieRef  = useRef<HTMLInputElement>(null)
  const frontRef   = useRef<HTMLInputElement>(null)
  const backRef    = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!phone) { setError("Phone number is required."); return }
    if (!selfie)  { setError("Please upload a selfie."); return }
    if (!idFront) { setError("Please upload the front of your ID."); return }

    setLoading(true)
    const fd = new FormData()
    fd.append("userId",     session.id)           // dashboard_users.id (uuid primary key)
    fd.append("numericUid", session.userId ?? "")  // dashboard_users.user_id (text)
    fd.append("email",      session.email ?? "")
    fd.append("fullName",   session.fullName)
    fd.append("phone",      phone)
    fd.append("telegram",   telegram)
    fd.append("instagram",  instagram)
    fd.append("address",    address)
    fd.append("selfie",     selfie)
    fd.append("idFront",    idFront)
    if (idBack) fd.append("idBack", idBack)

    try {
      const res  = await fetch("/api/kyc/submit", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || !json.ok) { setError(json.error ?? "Submission failed."); return }
      setSuccess(true)
      onSubmitted()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const FileField = ({
    label, hint, file, onFile, inputRef,
  }: {
    label: string; hint: string
    file: File | null; onFile: (f: File) => void
    inputRef: React.RefObject<HTMLInputElement>
  }) => (
    <div>
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed transition-colors
          ${file ? "border-primary bg-primary/5 text-primary" : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
      >
        <Upload className="w-5 h-5" />
        <p className="text-xs font-medium">{file ? file.name : hint}</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-sm">Identity Verification (KYC)</h2>
            <p className="text-[10px] text-muted-foreground">Verify your identity to unlock all features</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[75vh]">
          {success ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-bold text-foreground text-lg">Submitted Successfully</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your KYC request has been submitted and is under review.<br />
                We will notify you once it is processed.
              </p>
              <button onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Personal info */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name</label>
                  <input readOnly value={session.fullName}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border text-sm text-muted-foreground cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                    placeholder="+91 99999 99999"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/20 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Telegram Username</label>
                  <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/20 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Instagram Handle</label>
                  <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)}
                    placeholder="@handle"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/20 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
                    placeholder="Your full address"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/20 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                </div>
              </div>

              {/* Document uploads */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Documents</p>
                <FileField label="Selfie with ID *" hint="Tap to upload selfie"
                  file={selfie} onFile={setSelfie} inputRef={selfieRef} />
                <FileField label="ID / Aadhaar – Front *" hint="Tap to upload front side"
                  file={idFront} onFile={setIdFront} inputRef={frontRef} />
                <FileField label="ID / Aadhaar – Back" hint="Tap to upload back side"
                  file={idBack} onFile={setIdBack} inputRef={backRef} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : "Submit KYC"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
