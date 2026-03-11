"use client"

import { Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import type { Language } from "@/lib/i18n"

const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "en",       label: "English",  native: "English"  },
  { value: "hi",       label: "Hindi",    native: "हिन्दी"    },
  { value: "ur",       label: "Urdu",     native: "اردو"     },
  { value: "hinglish", label: "Hinglish", native: "Hinglish" },
]

/**
 * A compact language picker designed to be embedded inside dropdown menus.
 * Shows 4 options in a 2×2 grid with active check marks.
 */
export function LanguagePicker({ onPick }: { onPick?: () => void }) {
  const { language, setLanguage } = useLanguage()

  const pick = (lang: Language) => {
    setLanguage(lang)
    onPick?.()
  }

  return (
    <div className="px-3 py-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 select-none">
        Language
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {LANGUAGES.map((l) => {
          const active = language === l.value
          return (
            <button
              key={l.value}
              onClick={() => pick(l.value)}
              className={[
                "flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors text-left",
                active
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/80",
              ].join(" ")}
            >
              <span>{l.native}</span>
              {active && <Check className="w-3 h-3 shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
