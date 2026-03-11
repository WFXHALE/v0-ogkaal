import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/i18n"
import type { Translations } from "@/lib/i18n"

/**
 * Returns a typed translation accessor function.
 * Usage:  const t = useT()
 *         t.hero.title  or  t.buttons.enroll
 */
export function useT(): Translations {
  const { language } = useLanguage()
  return translations[language]
}
