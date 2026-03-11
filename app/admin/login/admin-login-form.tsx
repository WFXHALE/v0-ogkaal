"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { loginWithSecretKey, isSessionValid, isAccountLocked } from "@/lib/admin-auth"

type WolfState = "idle" | "typing" | "watching" | "success" | "angry" | "dead"

// ── Geometric Wolf SVG — matches reference image (angular polygon style) ─────
function WolfHead({ state }: { state: WolfState }) {
  const isTyping  = state === "typing"
  const isWatching = state === "watching" || state === "idle"
  const isAngry   = state === "angry"
  const isDead    = state === "dead"
  const isSuccess = state === "success"

  // Eyes open when not typing and not dead
  const eyesOpen = !isTyping && !isDead

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        height: "100%",
        willChange: "transform",
        // Top-level animation for angry shake or dead collapse
        animation: isAngry
          ? "wolf-shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97)"
          : isDead
          ? "wolf-slump 0.7s cubic-bezier(0.55,0,1,0.45) forwards"
          : "none",
      }}
    >
      <defs>
        <style>{`
          @keyframes wolf-shake {
            0%,100% { transform: translateX(0) rotate(0deg); }
            10%     { transform: translateX(-6px) rotate(-3deg); }
            20%     { transform: translateX(6px)  rotate(3deg); }
            30%     { transform: translateX(-5px) rotate(-2.5deg); }
            40%     { transform: translateX(5px)  rotate(2.5deg); }
            55%     { transform: translateX(-3px) rotate(-1.5deg); }
            70%     { transform: translateX(3px)  rotate(1.5deg); }
            85%     { transform: translateX(-1px) rotate(-0.5deg); }
          }
          @keyframes wolf-slump {
            0%   { transform: translateY(0)   rotate(0deg);   opacity: 1; }
            35%  { transform: translateY(6px)  rotate(-12deg); opacity: 0.9; }
            70%  { transform: translateY(14px) rotate(-28deg); opacity: 0.65; }
            100% { transform: translateY(18px) rotate(-35deg); opacity: 0.45; }
          }
          @keyframes wolf-success-in {
            0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
            55%  { transform: scale(1.08) rotate(2deg);  opacity: 1; }
            100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
          }
          @keyframes eye-close {
            0%   { transform: scaleY(1); }
            100% { transform: scaleY(0.05); }
          }
          @keyframes eye-open {
            0%   { transform: scaleY(0.05); }
            100% { transform: scaleY(1); }
          }
          @keyframes pupil-glow {
            0%,100% { opacity: 1; }
            50%     { opacity: 0.7; }
          }
          @keyframes dead-pulse {
            0%,100% { opacity: 0.3; }
            50%     { opacity: 0.8; }
          }
          .eye-left  { transform-origin: 72px  108px; will-change: transform; }
          .eye-right { transform-origin: 128px 108px; will-change: transform; }
          .eye-close { animation: eye-close 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
          .eye-open  { animation: eye-open  0.45s cubic-bezier(0.34,1.3,0.64,1) forwards; }
        `}</style>
      </defs>

      {/* ── SUCCESS state: yellow circle + thick black check ── */}
      {isSuccess && (
        <g style={{ animation: "wolf-success-in 0.5s cubic-bezier(0.34,1.3,0.64,1) forwards" }}>
          <circle cx="100" cy="100" r="90" fill="#FCD535" />
          {/* Subtle inner ring */}
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
          {/* Check mark */}
          <polyline
            points="42,102  82,142  158,58"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* ── WOLF states: idle / typing / watching / angry / dead ── */}
      {!isSuccess && (
        <g>
          {/* ── Outer glow ring when dead ── */}
          {isDead && (
            <circle
              cx="100" cy="100" r="93"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              style={{ animation: "dead-pulse 1.2s ease-in-out infinite" }}
            />
          )}

          {/* ── Yellow background circle ── */}
          <circle
            cx="100" cy="100" r="90"
            fill="#FCD535"
            style={{
              transition: "fill 0.4s ease",
            }}
          />
          {isDead && (
            <circle cx="100" cy="100" r="90" fill="rgba(239,68,68,0.15)" />
          )}

          {/* ══ GEOMETRIC WOLF HEAD (matches reference) ══ */}
          {/* 
            Reference: angular ears, sharp brow ridge, faceted face panels,
            triangular eye recesses, angular snout pointing down.
          */}

          {/* ── Left ear (outer angular polygon) ── */}
          <polygon
            points="34,90  55,30  78,82"
            fill="#111111"
          />
          {/* Left ear inner face */}
          <polygon
            points="40,85  55,38  72,80"
            fill="#2a2a2a"
            opacity="0.55"
          />

          {/* ── Right ear (outer angular polygon) ── */}
          <polygon
            points="166,90  145,30  122,82"
            fill="#111111"
          />
          {/* Right ear inner face */}
          <polygon
            points="160,85  145,38  128,80"
            fill="#2a2a2a"
            opacity="0.55"
          />

          {/* ── Main head polygon (angular / faceted) ── */}
          {/* Top cranium */}
          <polygon
            points="55,78  100,62  145,78  152,105  130,132  100,150  70,132  48,105"
            fill="#111111"
          />

          {/* ── Forehead center panel ── */}
          <polygon
            points="80,78  100,68  120,78  116,95  100,90  84,95"
            fill="#1e1e1e"
          />

          {/* ── Left brow ridge ── */}
          <polygon
            points="55,88  72,80  84,95  70,100"
            fill="#1a1a1a"
          />
          {/* ── Right brow ridge ── */}
          <polygon
            points="145,88  128,80  116,95  130,100"
            fill="#1a1a1a"
          />

          {/* ── Angry brows ── */}
          {isAngry && (
            <>
              <line x1="56" y1="90"  x2="82" y2="100" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <line x1="144" y1="90" x2="118" y2="100" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            </>
          )}

          {/* ── Cheek panels ── */}
          <polygon points="48,105  70,100  70,125  52,118"  fill="#161616" />
          <polygon points="152,105  130,100  130,125  148,118" fill="#161616" />

          {/* ── Lower face / muzzle ── */}
          <polygon
            points="70,125  100,120  130,125  122,148  100,156  78,148"
            fill="#1a1a1a"
          />

          {/* ── Angular nose ── */}
          <polygon
            points="92,122  100,116  108,122  100,130"
            fill={isAngry ? "#ef4444" : "#3a3a3a"}
            style={{ transition: "fill 0.3s ease" }}
          />
          {/* Nose highlight */}
          <polygon points="94,122  100,117  100,124" fill="rgba(255,255,255,0.2)" />

          {/* ── LEFT EYE ── */}
          {!isDead ? (
            <g
              className={`eye-left ${isTyping ? "eye-close" : "eye-open"}`}
            >
              {/* Eye socket recess */}
              <polygon points="57,102  72,95  87,102  80,116  64,116"  fill="#0d0d0d" />
              {/* Iris */}
              <ellipse
                cx="72" cy="107"
                rx="8" ry="8.5"
                fill={isAngry ? "#ef4444" : "#f0f0f0"}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Pupil */}
              <ellipse
                cx="73" cy="107"
                rx="4.5" ry="5"
                fill={isAngry ? "#7f0000" : "#1a1a1a"}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Corneal highlight */}
              <ellipse cx="71" cy="105" rx="2" ry="2" fill="rgba(255,255,255,0.65)" />
              {isAngry && (
                <ellipse cx="72" cy="107" rx="8" ry="8.5" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
              )}
            </g>
          ) : (
            /* Dead X eye left */
            <g>
              <polygon points="57,102  72,95  87,102  80,116  64,116"  fill="#0d0d0d" />
              <line x1="62" y1="99" x2="82" y2="115" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <line x1="82" y1="99" x2="62" y2="115" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {/* ── RIGHT EYE ── */}
          {!isDead ? (
            <g
              className={`eye-right ${isTyping ? "eye-close" : "eye-open"}`}
            >
              {/* Eye socket recess */}
              <polygon points="113,102  128,95  143,102  136,116  120,116" fill="#0d0d0d" />
              {/* Iris */}
              <ellipse
                cx="128" cy="107"
                rx="8" ry="8.5"
                fill={isAngry ? "#ef4444" : "#f0f0f0"}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Pupil */}
              <ellipse
                cx="129" cy="107"
                rx="4.5" ry="5"
                fill={isAngry ? "#7f0000" : "#1a1a1a"}
                style={{ transition: "fill 0.3s ease" }}
              />
              {/* Corneal highlight */}
              <ellipse cx="127" cy="105" rx="2" ry="2" fill="rgba(255,255,255,0.65)" />
              {isAngry && (
                <ellipse cx="128" cy="107" rx="8" ry="8.5" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
              )}
            </g>
          ) : (
            /* Dead X eye right */
            <g>
              <polygon points="113,102  128,95  143,102  136,116  120,116" fill="#0d0d0d" />
              <line x1="118" y1="99" x2="138" y2="115" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <line x1="138" y1="99" x2="118" y2="115" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {/* ── Angular mouth (angry) / fangs ── */}
          {isAngry && (
            <>
              <path
                d="M 82 146 L 92 155 L 100 148 L 108 155 L 118 146"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Left fang */}
              <polygon points="88,148  84,158  92,158" fill="#ffffff" opacity="0.9" />
              {/* Right fang */}
              <polygon points="112,148  108,158  116,158" fill="#ffffff" opacity="0.9" />
            </>
          )}

          {/* ── Watching: subtle upward pupil shift hint ── */}
          {isWatching && !isAngry && !isDead && !isTyping && (
            <>
              {/* Very subtle second highlight suggesting upward gaze */}
              <ellipse cx="71" cy="103" rx="1.2" ry="1.2" fill="rgba(255,255,255,0.3)" />
              <ellipse cx="127" cy="103" rx="1.2" ry="1.2" fill="rgba(255,255,255,0.3)" />
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
            style={{
              filter: isDead(wolfState) ? "drop-shadow(0 0 8px rgba(239,68,68,0.4))" :
                      wolfState === "success" ? "drop-shadow(0 0 10px rgba(252,213,53,0.6))" :
                      wolfState === "angry" ? "drop-shadow(0 0 8px rgba(239,68,68,0.35))" :
                      "drop-shadow(0 0 6px rgba(252,213,53,0.2))",
              transition: "filter 0.4s ease",
            }}
          >
            <WolfHead state={wolfState} />
          </div>

          <div className="h-6 mt-2">
            {wolfState === "idle" && (
              <p className="text-xs text-muted-foreground tracking-wide">Security Guardian Active</p>
            )}
            {wolfState === "typing" && (
              <p className="text-xs text-primary animate-pulse tracking-wide">Reading key...</p>
            )}
            {wolfState === "watching" && (
              <p className="text-xs text-muted-foreground tracking-wide">Awaiting confirmation...</p>
            )}
            {wolfState === "success" && (
              <p className="text-xs text-green-400 font-semibold tracking-wide">{statusMsg}</p>
            )}
            {wolfState === "angry" && (
              <p className="text-xs text-red-400 font-semibold tracking-wide">Access Denied</p>
            )}
            {wolfState === "dead" && (
              <p className="text-xs text-red-500 font-semibold tracking-wide">Security Lock Active</p>
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

function isDead(s: WolfState) { return s === "dead" }
