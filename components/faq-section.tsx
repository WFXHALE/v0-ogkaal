"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, HelpCircle } from "lucide-react"
import { faqs } from "@/app/faq/page"

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section className="py-20 px-4 border-t border-border/50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">FAQ</p>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Quick answers to common questions. Click any question to expand.
        </p>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={faq.slug} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-medium text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    See the full answer on the{" "}
                    <Link
                      href={`/faq/${faq.slug}`}
                      className="text-primary underline underline-offset-2 font-medium"
                    >
                      FAQ page
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            View All FAQs
          </Link>
        </div>
      </div>
    </section>
  )
}
