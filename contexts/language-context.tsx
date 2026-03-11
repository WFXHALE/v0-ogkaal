"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Language } from "@/lib/i18n"

const STORAGE_KEY = "og-kaal-lang"

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null
      if (stored && ["en", "hi", "ur", "hinglish"].includes(stored)) {
        setLanguageState(stored)
      }
    } catch {
      // localStorage unavailable (SSR or private mode)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Set dir attribute for RTL (Urdu)
    document.documentElement.setAttribute("dir", language === "ur" ? "rtl" : "ltr")
  }, [language, mounted])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
