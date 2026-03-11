"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Layers } from "lucide-react"

type Mode = "dark" | "light" | "grey"

const CYCLE: Mode[] = ["dark", "light", "grey"]

const LABELS: Record<Mode, string> = {
  dark:  "Dark mode",
  light: "Light mode",
  grey:  "Soft grey mode",
}

const NEXT_LABEL: Record<Mode, string> = {
  dark:  "Switch to light mode",
  light: "Switch to soft grey mode",
  grey:  "Switch to dark mode",
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden="true" />
  }

  const current = (CYCLE.includes(theme as Mode) ? theme : "dark") as Mode
  const nextMode = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]

  const handleCycle = () => setTheme(nextMode)

  return (
    <button
      onClick={handleCycle}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200 group"
      aria-label={NEXT_LABEL[current]}
      title={`${LABELS[current]} — click to switch`}
    >
      {current === "dark" && (
        <Sun className="w-4 h-4 text-[#FCD535]" />
      )}
      {current === "light" && (
        <Moon className="w-4 h-4" />
      )}
      {current === "grey" && (
        <Layers className="w-4 h-4 text-[#595959]" />
      )}

      {/* Tooltip label on hover */}
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground/90 px-2 py-0.5 text-[10px] font-medium text-background opacity-0 group-hover:opacity-100 transition-opacity z-50">
        {LABELS[current]}
      </span>
    </button>
  )
}
