"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

// ── Wolf states ──────────────────────────────────────────────────────────────
type WolfState = "idle" | "typing" | "watching" | "success" | "angry" | "dead"

// ── Animated Wolf SVG ────────────────────────────────────────────────────────
function WolfHead({ state }: { state: WolfState }) {
  const isDead    = state === "dead"
  const isAngry   = state === "angry"
  const isSuccess = state === "success"
  const isTyping  = state === "typing"
  const isWatching = state === "watching"

  // Eye open/closed states
  const leftEyeOpen  = !isTyping && !isDead
  const rightEyeOpen = (isWatching || isAngry || state === "idle") && !isTyping && !isDead
  const eyeColor     = isAngry ? "#ef4444" : "#ffffff"

  return (
    <svg
      viewBox="0 0 120 120"
      className="w-full h-full"
      style={{
        animation: isAngry   ? "shake 0.4s ease-in-out" :
                   isDead    ? "collapse 0.6s ease-in-out forwards" :
                   isSuccess ? "none" : "none",
      }}
    >
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-5px) rotate(-3deg); }
          30%      { transform: translateX(5px)  rotate(3deg); }
          45%      { transform: translateX(-4px) rotate(-2deg); }
          60%      { transform: translateX(4px)  rotate(2deg); }
          75%      { transform: translateX(-2px) rotate(-1deg); }
          90%      { transform: translateX(2px)  rotate(1deg); }
        }
        @keyframes collapse {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          40%  { transform: translateY(8px) rotate(-15deg); opacity: 0.8; }
          100% { transform: translateY(16px) rotate(-30deg); opacity: 0.5; }
        }
        @keyframes pulse-ring {
          0%,100% { r: 56; opacity: 0.3; }
          50%      { r: 58; opacity: 0.6; }
        }
        @keyframes eye-blink {
          0%,90%,100% { transform: scaleY(1); }
          95%         { transform: scaleY(0.05); }
        }
        @keyframes success-scale {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── SUCCESS: yellow circle + black check ── */}
      {isSuccess ? (
        <g style={{ animation: "success-scale 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
          <circle cx="60" cy="60" r="54" fill="#FCD535" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="#000" strokeWidth="2" opacity="0.1" />
          <polyline
            points="28,62 50,84 92,36"
            fill="none"
            stroke="#000"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <g style={{ animation: isAngry ? "shake 0.4s ease-in-out" : isDead ? "collapse 0.6s ease-in-out forwards" : "none" }}>
          {/* ── Background circle ── */}
          <circle cx="60" cy="60" r="54" fill="#FCD535" />
          {isDead && (
            <circle cx="60" cy="60" r="56" fill="none" stroke="#ef4444" strokeWidth="1.5"
              style={{ animation: "pulse-ring 1s ease-in-out infinite" }} />
          )}

          {/* ── Wolf head (black) ── */}
          {/* Ears */}
          <polygon points="22,42 35,18 46,40" fill="#111" />
          <polygon points="74,40 85,18 98,42" fill="#111" />
          {/* Ear inner */}
          <polygon points="26,40 35,23 44,40" fill="#333" opacity="0.5" />
          <polygon points="76,40 85,23 94,40" fill="#333" opacity="0.5" />

          {/* Head */}
          <ellipse cx="60" cy="65" rx="38" ry="34" fill="#111" />

          {/* Forehead fur detail */}
          <ellipse cx="60" cy="44" rx="22" ry="14" fill="#1a1a1a" />

          {/* Muzzle */}
          <ellipse cx="60" cy="80" rx="18" ry="12" fill="#1c1c1c" />

          {/* Nose */}
          <ellipse cx="60" cy="73" rx="6" ry="4" fill={isAngry ? "#ef4444" : "#444"} />
          {/* Nose shine */}
          <ellipse cx="58" cy="72" rx="1.5" ry="1" fill="rgba(255,255,255,0.3)" />

          {/* ── Angry eyebrows ── */}
          {isAngry && (
            <>
              <line x1="38" y1="52" x2="52" y2="58" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="82" y1="52" x2="68" y2="58" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* ── LEFT EYE ── */}
          {leftEyeOpen ? (
            <g>
              <ellipse cx="44" cy="63" rx="7" ry="7.5" fill={eyeColor} />
              <ellipse cx="45" cy="63" rx="4" ry="4.5" fill={isAngry ? "#900" : "#222"} />
              <ellipse cx="43.5" cy="61.5" rx="1.5" ry="1.5" fill="rgba(255,255,255,0.6)" />
              {isAngry && <ellipse cx="44" cy="63" rx="7" ry="7.5" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.6" />}
            </g>
          ) : (
            /* closed eye — horizontal line */
            <line x1="37" y1="63" x2="51" y2="63" stroke={isAngry ? "#ef4444" : "#444"} strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* ── RIGHT EYE ── */}
          {rightEyeOpen ? (
            <g>
              <ellipse cx="76" cy="63" rx="7" ry="7.5" fill={eyeColor} />
              <ellipse cx="77" cy="63" rx="4" ry="4.5" fill={isAngry ? "#900" : "#222"} />
              <ellipse cx="75.5" cy="61.5" rx="1.5" ry="1.5" fill="rgba(255,255,255,0.6)" />
              {isAngry && <ellipse cx="76" cy="63" rx="7" ry="7.5" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.6" />}
            </g>
          ) : (
            <line x1="69" y1="63" x2="83" y2="63" stroke={isAngry ? "#ef4444" : "#444"} strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* ── Angry mouth / fangs ── */}
          {isAngry && (
            <>
              <path d="M 50 84 Q 60 90 70 84" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <polygon points="55,84 52,91 58,91" fill="white" opacity="0.9" />
              <polygon points="65,84 62,91 68,91" fill="white" opacity="0.9" />
            </>
          )}

          {/* ── Dead X eyes ── */}
          {isDead && (
            <>
              <line x1="38" y1="57" x2="50" y2="69" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="50" y1="57" x2="38" y2="69" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="70" y1="57" x2="82" y2="69" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="82" y1="57" x2="70" y2="69" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* ── Watching: directional gaze ── */}
          {isWatching && !isAngry && !isDead && (
            <>
              {/* Subtle upward gaze hint */}
              <ellipse cx="45" cy="61" rx="1.5" ry="1.5" fill="rgba(255,255,255,0.5)" />
            </>
          )}
        </g>
      )}
    </svg>
  )
}

// ── Main form ────────────────────────────────────────────────────────────────
export function AdminLoginForm() {
  const router = useRouter()

  const [secretKey, setSecretKey]           = useState("")
  const [error, setError]                   = useState("")
  const [isLoading, setIsLoading]           = useState(false)
  const [isChecking, setIsChecking]         = useState(true)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [wolfState, setWolfState]           = useState<WolfState>("idle")
  const [statusMsg, setStatusMsg]           = useState("")
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isSessionValid()) { router.push("/admin"); return }
    const lock = isAccountLocked()
    if (lock.locked) setWolfState("dead")
    setIsChecking(false)
  }, [router])

  // Wolf reacts to typing
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
    typingTimer.current = setTimeout(() => {
      setWolfState("watching")
    }, 900)
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
      setTimeout(() => setWolfState("idle"), 1200)
      return
    }

    setIsLoading(true)
    setWolfState("typing")

    const r = await loginWithSecretKey(secretKey)

    if (r.success) {
      setWolfState("success")
      setStatusMsg("Access Granted")
      setTimeout(() => router.push("/admin"), 1000)
    } else {
      setWolfState("angry")
      setError(r.error || "Invalid Key – Access Denied")
      if (r.attemptsRemaining !== undefined) {
        setRemainingAttempts(r.attemptsRemaining)
        if (r.attemptsRemaining === 0) {
          setTimeout(() => setWolfState("dead"), 800)
        } else {
          setTimeout(() => setWolfState("idle"), 1200)
        }
      } else {
        // Locked
        setTimeout(() => setWolfState("dead"), 800)
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
            className="w-28 h-28 transition-all duration-300"
            style={{ filter: wolfState === "dead" ? "grayscale(0.4)" : "none" }}
          >
            <WolfHead state={wolfState} />
          </div>

          {/* Status label */}
          <div className="h-6 mt-2">
            {wolfState === "idle" && (
              <p className="text-xs text-muted-foreground">Security Guardian Active</p>
            )}
            {wolfState === "typing" && (
              <p className="text-xs text-primary animate-pulse">Receiving key...</p>
            )}
            {wolfState === "watching" && (
              <p className="text-xs text-muted-foreground">Waiting for confirmation...</p>
            )}
            {wolfState === "success" && (
              <p className="text-xs text-green-400 font-semibold">{statusMsg}</p>
            )}
            {wolfState === "angry" && (
              <p className="text-xs text-red-400 font-semibold">Invalid Key – Access Denied</p>
            )}
            {wolfState === "dead" && (
              <p className="text-xs text-red-500 font-semibold">Security Lock Activated</p>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
            <p className="text-xs text-muted-foreground mt-1">OG KAAL TRADER — Restricted Area</p>
          </div>

          {/* Lockout block */}
          {(lock.locked || wolfState === "dead") && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4 text-center">
              <p className="text-sm font-semibold text-red-400">Security Lock Activated</p>
              <p className="text-xs text-red-400/70 mt-1">
                Come back after 24 hours.
                {lock.remainingSeconds ? ` (${Math.ceil(lock.remainingSeconds / 3600)}h remaining)` : ""}
              </p>
            </div>
          )}

          {/* Error message */}
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
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Unlock Admin Panel
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Maximum 5 attempts per day. Failed attempts trigger a 24-hour lockout.
          </p>
        </div>
      </div>
    </div>
  )
}
