"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

type WolfState = "idle" | "typing" | "watching" | "success" | "angry" | "dead"

// ─────────────────────────────────────────────────────────────────────────────
// Wolf SVG — sharp geometric minimal style, matches reference image exactly.
// The wolf is drawn as flat black polygons on a yellow circle.
// Eyes are sharp angular diamond/slit shapes that scale on Y-axis to open/close.
// ─────────────────────────────────────────────────────────────────────────────
function WolfHead({ state }: { state: WolfState }) {
  const isTyping   = state === "typing"
  const isAngry    = state === "angry"
  const isDead     = state === "dead"
  const isSuccess  = state === "success"

  const eyeFill   = isAngry ? "#ef4444" : "#ffffff"
  const eyeShadow = isAngry ? "#7f0000" : "#1a1a1a"

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        height: "100%",
        willChange: "transform",
        animation: isAngry
          ? "w-shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both"
          : isDead
          ? "w-slump 0.8s cubic-bezier(0.55,0,1,0.45) forwards"
          : "none",
      }}
    >
      <defs>
        <style>{`
          @keyframes w-shake {
            0%,100% { transform: translateX(0); }
            15%     { transform: translateX(-7px) rotate(-3deg); }
            30%     { transform: translateX(7px)  rotate(3deg); }
            45%     { transform: translateX(-5px) rotate(-2deg); }
            60%     { transform: translateX(5px)  rotate(2deg); }
            75%     { transform: translateX(-2px) rotate(-1deg); }
            90%     { transform: translateX(2px)  rotate(1deg); }
          }
          @keyframes w-slump {
            0%   { transform: translateY(0) rotate(0deg);    opacity: 1; }
            30%  { transform: translateY(4px) rotate(-10deg); opacity: 0.9; }
            65%  { transform: translateY(12px) rotate(-25deg); opacity: 0.6; }
            100% { transform: translateY(18px) rotate(-38deg); opacity: 0.35; }
          }
          @keyframes w-success {
            0%   { transform: scale(0.4) rotate(-15deg); opacity: 0; }
            60%  { transform: scale(1.1) rotate(3deg);   opacity: 1; }
            100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
          }
          @keyframes w-eye-close {
            0%   { transform: scaleY(1); }
            100% { transform: scaleY(0.06); }
          }
          @keyframes w-eye-open {
            0%   { transform: scaleY(0.06); }
            60%  { transform: scaleY(1.1); }
            100% { transform: scaleY(1); }
          }
          .eye-l { transform-origin: 72px 103px; will-change: transform; }
          .eye-r { transform-origin: 128px 103px; will-change: transform; }
          .closing { animation: w-eye-close 0.3s cubic-bezier(0.4,0,0.6,1) forwards; }
          .opening { animation: w-eye-open  0.45s cubic-bezier(0.34,1.4,0.64,1) forwards; }
        `}</style>
      </defs>

      {/* ── SUCCESS: clean check on yellow ── */}
      {isSuccess && (
        <g style={{ animation: "w-success 0.45s cubic-bezier(0.34,1.4,0.64,1) forwards" }}>
          <circle cx="100" cy="100" r="90" fill="#FCD535" />
          <polyline
            points="40,105  82,147  160,57"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* ── WOLF ── */}
      {!isSuccess && (
        <g>
          {/* Yellow base circle — turns faint red overlay when dead */}
          <circle cx="100" cy="100" r="90" fill="#FCD535" />
          {isDead && <circle cx="100" cy="100" r="90" fill="rgba(239,68,68,0.18)" />}

          {/* ════════════════════════════════════════
              WOLF GEOMETRY — traced from reference
              Black fills, no gradients, pure flat.
              ════════════════════════════════════════ */}

          {/* ── Left ear: tall sharp triangle ── */}
          <polygon points="42,84  62,20  82,80" fill="#0d0d0d" />
          {/* Left ear inner: slightly lighter to show ear cavity */}
          <polygon points="50,78  62,30  76,76" fill="#1c1c1c" />

          {/* ── Right ear: tall sharp triangle ── */}
          <polygon points="158,84  138,20  118,80" fill="#0d0d0d" />
          {/* Right ear inner */}
          <polygon points="150,78  138,30  124,76" fill="#1c1c1c" />

          {/* ── Cranium top ── */}
          <polygon points="60,82  100,65  140,82  145,105  100,115  55,105" fill="#0d0d0d" />

          {/* ── Left brow panel — sharp angular wedge driving over eye ── */}
          <polygon points="55,100  68,88  88,98  82,110  58,110" fill="#141414" />

          {/* ── Right brow panel ── */}
          <polygon points="145,100  132,88  112,98  118,110  142,110" fill="#141414" />

          {/* ── Angular angry brow slashes ── */}
          {isAngry && (
            <>
              <line x1="57" y1="97"  x2="86" y2="109" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="143" y1="97" x2="114" y2="109" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}

          {/* ── Cheek planes ── */}
          <polygon points="55,105  68,110  65,132  48,120" fill="#111111" />
          <polygon points="145,105  132,110  135,132  152,120" fill="#111111" />

          {/* ── Muzzle / lower face ── */}
          <polygon points="68,125  82,118  100,122  118,118  132,125  120,150  100,158  80,150" fill="#141414" />

          {/* ── Center nose bridge ── */}
          <polygon points="88,100  100,94  112,100  106,115  100,118  94,115" fill="#0a0a0a" />

          {/* ── Nose diamond ── */}
          <polygon
            points="94,118  100,113  106,118  100,124"
            fill={isAngry ? "#ef4444" : "#2a2a2a"}
            style={{ transition: "fill 0.3s ease" }}
          />

          {/* ── LEFT EYE ── */}
          {!isDead ? (
            <g className={`eye-l ${isTyping ? "closing" : "opening"}`}>
              {/* Eye socket — deep dark recess */}
              <polygon points="59,104  72,97  85,104  80,114  64,114" fill="#050505" />
              {/* Sharp diamond iris */}
              <polygon
                points="65,103  72,97  79,103  72,109"
                fill={eyeFill}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Pupil slit */}
              <polygon
                points="69,103  72,99  75,103  72,107"
                fill={eyeShadow}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Specular highlight */}
              <polygon points="66,101  69,99  70,101  68,103" fill="rgba(255,255,255,0.55)" />
            </g>
          ) : (
            /* Dead X-eye left */
            <g>
              <polygon points="59,104  72,97  85,104  80,114  64,114" fill="#050505" />
              <line x1="62" y1="99" x2="82" y2="113" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="82" y1="99" x2="62" y2="113" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {/* ── RIGHT EYE ── */}
          {!isDead ? (
            <g className={`eye-r ${isTyping ? "closing" : "opening"}`}>
              {/* Eye socket */}
              <polygon points="115,104  128,97  141,104  136,114  120,114" fill="#050505" />
              {/* Sharp diamond iris */}
              <polygon
                points="121,103  128,97  135,103  128,109"
                fill={eyeFill}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Pupil slit */}
              <polygon
                points="125,103  128,99  131,103  128,107"
                fill={eyeShadow}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Specular highlight */}
              <polygon points="122,101  125,99  126,101  124,103" fill="rgba(255,255,255,0.55)" />
            </g>
          ) : (
            /* Dead X-eye right */
            <g>
              <polygon points="115,104  128,97  141,104  136,114  120,114" fill="#050505" />
              <line x1="118" y1="99" x2="138" y2="113" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="138" y1="99" x2="118" y2="113" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {/* ── Angry: bared fangs ── */}
          {isAngry && (
            <g>
              <path
                d="M 80 148 L 90 158 L 100 150 L 110 158 L 120 148"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Left fang */}
              <polygon points="86,149  82,161  92,161" fill="#f8f8f8" />
              {/* Right fang */}
              <polygon points="114,149  108,161  118,161" fill="#f8f8f8" />
            </g>
          )}
        </g>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────
export function AdminLoginForm() {
  const router = useRouter()

  const [secretKey, setSecretKey]   = useState("")
  const [error, setError]           = useState("")
  const [isLoading, setIsLoading]   = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [wolfState, setWolfState]   = useState<WolfState>("idle")
  const [statusMsg, setStatusMsg]   = useState("")
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isSessionValid()) { router.push("/admin"); return }
    const lock = isAccountLocked()
    if (lock.locked) setWolfState("dead")
    setIsChecking(false)
  }, [router])

  const handleKeyChange = (val: string) => {
    setSecretKey(val)
    setError("")
    setStatusMsg("")

    if (!val) {
      setWolfState("idle")
      if (typingTimer.current) clearTimeout(typingTimer.current)
      return
    }

    setWolfState("typing")
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setWolfState("watching"), 900)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRemainingAttempts(null)
    setStatusMsg("")
    if (typingTimer.current) clearTimeout(typingTimer.current)

    if (!secretKey.trim()) {
      setError("Enter the admin secret key")
      setWolfState("angry")
      setTimeout(() => setWolfState("idle"), 1400)
      return
    }

    setIsLoading(true)
    setWolfState("typing")

    const r = await loginWithSecretKey(secretKey)

    if (r.success) {
      setWolfState("success")
      setStatusMsg("Access Granted")
      setTimeout(() => router.push("/admin"), 1100)
    } else {
      setWolfState("angry")
      setError(r.error || "Invalid Key – Access Denied")
      if (r.attemptsRemaining !== undefined) {
        setRemainingAttempts(r.attemptsRemaining)
        setTimeout(() => {
          if (r.attemptsRemaining === 0) setWolfState("dead")
          else setWolfState("idle")
        }, 1400)
      } else {
        setTimeout(() => setWolfState("dead"), 900)
      }
    }

    setIsLoading(false)
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  const lock = isAccountLocked()

  const glowFilter =
    wolfState === "dead"    ? "drop-shadow(0 0 10px rgba(239,68,68,0.5))" :
    wolfState === "success" ? "drop-shadow(0 0 12px rgba(252,213,53,0.7))" :
    wolfState === "angry"   ? "drop-shadow(0 0 10px rgba(239,68,68,0.45))" :
                              "drop-shadow(0 0 8px rgba(252,213,53,0.25))"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-sm">
        {/* Wolf indicator */}
        <div className="flex flex-col items-center mb-6 select-none">
          <div
            className="w-32 h-32"
            style={{ filter: glowFilter, transition: "filter 0.4s ease" }}
          >
            <WolfHead state={wolfState} />
          </div>

          <div className="h-6 mt-3">
            {wolfState === "idle" && (
              <p className="text-xs text-muted-foreground tracking-widest uppercase">Guardian Protocol Active</p>
            )}
            {wolfState === "typing" && (
              <p className="text-xs text-primary tracking-widest uppercase animate-pulse">Reading Key...</p>
            )}
            {wolfState === "watching" && (
              <p className="text-xs text-muted-foreground tracking-widest uppercase">Awaiting Confirmation</p>
            )}
            {wolfState === "success" && (
              <p className="text-xs text-green-400 font-semibold tracking-widest uppercase">{statusMsg}</p>
            )}
            {wolfState === "angry" && (
              <p className="text-xs text-red-400 font-semibold tracking-widest uppercase">Access Denied</p>
            )}
            {wolfState === "dead" && (
              <p className="text-xs text-red-500 font-semibold tracking-widest uppercase">Security Lock Active</p>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
            <p className="text-xs text-muted-foreground mt-1">OG KAAL TRADER — Restricted Area</p>
          </div>

          {(lock.locked || wolfState === "dead") && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4 text-center">
              <p className="text-sm font-semibold text-red-400">Security Lock Activated</p>
              <p className="text-xs text-red-400/70 mt-1">
                Access blocked for 24 hours.
                {lock.remainingSeconds ? ` (${Math.ceil(lock.remainingSeconds / 3600)}h remaining)` : ""}
              </p>
            </div>
          )}

          {error && wolfState !== "dead" && !lock.locked && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
              <p className="text-sm text-red-400">{error}</p>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <p className="text-xs text-red-400/60 mt-1">
                  {remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining before 24-hour lockout
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Admin Secret Key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={secretKey}
                  onChange={e => handleKeyChange(e.target.value)}
                  placeholder="Enter secret key"
                  autoComplete="off"
                  disabled={lock.locked || wolfState === "dead" || wolfState === "success"}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || lock.locked || wolfState === "dead" || wolfState === "success"}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-5"
            >
              {isLoading ? (
                <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Verifying...</>
              ) : (
                <><KeyRound className="w-4 h-4 mr-2" />Unlock Admin Panel</>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Maximum 5 attempts. Failed attempts trigger a 24-hour lockout.
          </p>
        </div>
      </div>
    </div>
  )
}
