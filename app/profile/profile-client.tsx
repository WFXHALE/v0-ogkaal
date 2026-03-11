"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  User, Mail, Phone, AtSign, Camera, Save, CheckCircle, AlertCircle,
  Loader2, BadgeCheck, Clock, XCircle, ChevronRight, Upload, FileCheck, Lock, AtSign as IdIcon,
} from "lucide-react"
import { getSession, setSession } from "@/lib/dash-auth"
import type { DashboardSession } from "@/lib/dash-auth"
import { Header } from "@/components/header"

// ── Avatar circle with initials fallback ─────────────────────────────────────

function AvatarCircle({ name, avatarUrl, size = 80 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div
      className="rounded-full bg-primary flex items-center justify-center overflow-hidden border-4 border-primary/30 shrink-0"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" crossOrigin="anonymous" />
      ) : (
        <span className="font-bold text-primary-foreground" style={{ fontSize: size * 0.32 }}>
          {initials}
        </span>
      )}
    </div>
  )
}

// ── Avatar upload ─────────────────────────────────────────────────────────────

function AvatarUpload({
  name,
  avatarUrl,
  onUploaded,
}: {
  name: string
  avatarUrl?: string | null
  onUploaded: (url: string) => void
}) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState("")
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const displayUrl = localPreview ?? avatarUrl

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadErr("File too large. Max 5 MB."); return }

    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    setUploading(true)
    setUploadErr("")

    const fd = new FormData()
    fd.append("file", file)

    try {
      const res  = await fetch("/api/dashboard/avatar", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) { setUploadErr(json.error ?? "Upload failed."); setLocalPreview(null); return }

      URL.revokeObjectURL(localPreview ?? "")
      setLocalPreview(null)
      onUploaded(json.url)

      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { url: json.url } }))

      if (inputRef.current) inputRef.current.value = ""
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest self-start">
        Profile Picture
      </p>

      <div className="relative group cursor-pointer" onClick={() => !uploading && inputRef.current?.click()}>
        <AvatarCircle name={name || "U"} avatarUrl={displayUrl} size={88} />

        <div className={`absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/50 transition-opacity ${uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-white mb-0.5" />
              <span className="text-[10px] font-semibold text-white">Change</span>
            </>
          )}
        </div>
      </div>

      <div className="text-center space-y-1">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Update Your Profile Picture"}
        </button>
        <p className="text-xs text-muted-foreground">JPG, PNG or GIF &bull; max 5 MB</p>
      </div>

      {uploadErr && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 w-full">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {uploadErr}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
  label, icon: Icon, value, onChange, placeholder, type = "text", readOnly = false,
}: {
  label: string
  icon: React.ElementType
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  readOnly?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${readOnly ? "border-border/50 bg-secondary/30" : "border-border bg-secondary/50 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20"} transition-all`}>
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none read-only:text-muted-foreground"
        />
      </div>
    </div>
  )
}

// ── KYC Verification tab ──────────────────────────────────────────────────────

function DocUpload({
  label, hint, file, onChange,
}: {
  label: string
  hint: string
  file: File | null
  onChange: (f: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
          file
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-dashed border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
        }`}
      >
        {file ? (
          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0">
          {file ? (
            <p className="text-xs font-medium text-emerald-400 truncate">{file.name}</p>
          ) : (
            <>
              <p className="text-xs font-medium text-foreground">Click to upload</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
            </>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(null) }}
            className="ml-auto text-muted-foreground hover:text-red-400 text-[10px] shrink-0"
          >
            Remove
          </button>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={e => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

function KycTab({ session }: { session: DashboardSession }) {
  const [aadhaar,      setAadhaar]   = useState("")
  const [pan,          setPan]       = useState("")
  const [phone,        setKycPhone]  = useState("")
  const [aadhaarFront, setAF]        = useState<File | null>(null)
  const [aadhaarBack,  setAB]        = useState<File | null>(null)
  const [panDoc,       setPanDoc]    = useState<File | null>(null)
  const [loading,      setLoading]   = useState(false)
  const [progress,     setProgress]  = useState("")
  const [success,      setSuccess]   = useState(false)
  const [error,        setError]     = useState("")
  const [kycStatus,    setKycStatus] = useState(session.kycStatus ?? "none")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setSuccess(false)

    const hasText = aadhaar || pan || phone
    const hasDocs = aadhaarFront || aadhaarBack || panDoc
    if (!hasText && !hasDocs) {
      setError("Please fill in at least one field or upload at least one document.")
      return
    }

    setLoading(true)
    setProgress(hasDocs ? "Uploading documents..." : "Submitting...")

    const fd = new FormData()
    fd.append("userId", session.id)
    if (aadhaar)      fd.append("aadhaarNumber", aadhaar)
    if (pan)          fd.append("panNumber",     pan)
    if (phone)        fd.append("kycPhone",      phone)
    if (aadhaarFront) fd.append("aadhaarFront",  aadhaarFront)
    if (aadhaarBack)  fd.append("aadhaarBack",   aadhaarBack)
    if (panDoc)       fd.append("panDoc",        panDoc)

    const res  = await fetch("/api/dashboard/kyc", { method: "POST", body: fd })
    const json = await res.json()
    setLoading(false)
    setProgress("")

    if (!res.ok) { setError(json.error ?? "Submission failed."); return }
    setKycStatus("pending")
    setSuccess(true)
  }

  if (session.isVerified) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col items-center gap-3 text-center">
        <BadgeCheck className="w-12 h-12 text-emerald-400" />
        <h3 className="text-base font-bold text-foreground">Identity Verified</h3>
        <p className="text-sm text-muted-foreground">Your account is fully verified. You have access to all member features.</p>
      </div>
    )
  }

  if (kycStatus === "pending") {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col items-center gap-3 text-center">
        <Clock className="w-12 h-12 text-amber-400" />
        <h3 className="text-base font-bold text-foreground">Verification Pending</h3>
        <p className="text-sm text-muted-foreground">Your details have been submitted and are under review. This usually takes 1–2 business days.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Identity Verification</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Upload your documents or enter your details to unlock the Verified badge and full member access.
          Your data is encrypted and kept private.
        </p>
      </div>

      {kycStatus === "rejected" && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Verification Rejected</p>
            <p className="text-xs mt-0.5 text-red-400/80">Your previous submission was rejected. Please re-submit with correct details and clear document photos.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" /> Submitted! Your details are under review.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Details</p>
          <Field label="Aadhaar Number" icon={User} value={aadhaar}
            onChange={v => setAadhaar(v.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar number" />
          <Field label="PAN Number" icon={User} value={pan}
            onChange={v => setPan(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} placeholder="e.g. ABCDE1234F" />
          <Field label="Phone Number" icon={Phone} value={phone}
            onChange={setKycPhone} placeholder="+91 00000 00000" type="tel" />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Documents</p>
          <DocUpload label="Aadhaar Card — Front" hint="JPG, PNG or PDF · max 5 MB" file={aadhaarFront} onChange={setAF} />
          <DocUpload label="Aadhaar Card — Back"  hint="JPG, PNG or PDF · max 5 MB" file={aadhaarBack}  onChange={setAB} />
          <DocUpload label="PAN Card"              hint="JPG, PNG or PDF · max 5 MB" file={panDoc}       onChange={setPanDoc} />
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-secondary/30 border border-border">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            By submitting, you confirm all details and documents are accurate. OG KAAL will review your submission within 1–2 business days. Your data is never shared with third parties.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />{progress}</>
          ) : (
            <><ChevronRight className="w-4 h-4" />Submit for Verification</>
          )}
        </button>
      </form>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export default function ProfileClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [session, setSessionState] = useState<DashboardSession | null>(null)
  const [activeTab, setActiveTab]  = useState<"profile" | "verify">("profile")

  const [fullName,  setFullName]  = useState("")
  const [phone,     setPhone]     = useState("")
  const [username,  setUsername]  = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState("")
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "verify") setActiveTab("verify")
  }, [searchParams])

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace("/dashboard"); return }
    setSessionState(s)
    fetch(`/api/dashboard/profile?id=${s.id}`)
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) return
        setFullName(user.full_name ?? "")
        setPhone(user.phone ?? "")
        setUsername(user.username ?? "")
        setAvatarUrl(user.avatar_url ?? "")
      })
      .finally(() => setBooting(false))
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setLoading(true); setError(""); setSuccess(false)

    const res = await fetch("/api/dashboard/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: session.id, fullName, phone, username, avatarUrl }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error ?? "Failed to save."); return }

    if (session) {
      const updated = { ...session, fullName, avatarUrl: avatarUrl || undefined } as DashboardSession & { avatarUrl?: string }
      setSession(updated)
      setSessionState(updated)
    }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (booting) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center pt-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-xl mx-auto px-4">

          <div className="flex rounded-xl border border-border bg-secondary/30 p-1 gap-1 mb-5">
            {([
              { id: "profile", label: "My Profile" },
              { id: "verify",  label: session?.isVerified ? "Verified" : "Get Verified" },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {id === "verify" && !session?.isVerified && session?.kycStatus === "pending" && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 align-middle" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "verify" && session && <KycTab session={session} />}

          {activeTab === "profile" && (
            <>
              <div className="relative rounded-2xl border border-border bg-card overflow-hidden mb-6">
                <div className="h-1.5 bg-primary w-full" />
                <div className="flex items-center gap-5 px-6 py-6">
                  <div className="relative shrink-0">
                    <AvatarCircle name={fullName || "U"} avatarUrl={avatarUrl} size={72} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-foreground truncate">{fullName || "Your Profile"}</h1>
                    <p className="text-sm text-muted-foreground truncate">{session?.email}</p>
                    {username && <p className="text-xs text-primary mt-0.5">@{username}</p>}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card px-6 py-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground">Edit Profile</h2>

                <AvatarUpload
                  name={fullName || session?.fullName || "U"}
                  avatarUrl={avatarUrl}
                  onUploaded={(url) => {
                    setAvatarUrl(url)
                    if (session) {
                      const updated = { ...session, avatarUrl: url }
                      setSession(updated)
                      setSessionState(updated)
                    }
                  }}
                />

                <div className="border-t border-border/50" />

                <Field label="Email"   icon={Mail}    value={session?.email  ?? ""} readOnly />
                <Field label="User ID" icon={IdIcon}  value={session?.userId ?? ""} readOnly />

                <Field label="Full Name" icon={User}   value={fullName} onChange={setFullName} placeholder="Your full name" />
                <Field label="Username"  icon={AtSign} value={username}
                  onChange={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="your_username" />
                <Field label="Phone" icon={Phone} value={phone} onChange={setPhone} placeholder="+1 234 567 890" type="tel" />

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 shrink-0" /> Profile saved successfully.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </>
          )}

        </div>
      </main>
    </>
  )
}
