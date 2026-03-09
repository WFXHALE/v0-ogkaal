"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChevronDown, BookOpen } from "lucide-react"

const SECTIONS = [
  {
    id: "smc",
    title: "SMC Material",
    items: [
      { label: "SMC Basic", href: "/material/smc-basic" },
      { label: "SMC Advanced", href: "/material/smc-advanced" },
    ],
  },
  {
    id: "ict",
    title: "ICT Material",
    items: [
      { label: "ICT Basic", href: "/material/ict-basic" },
      { label: "ICT Advanced", href: "/material/ict-advanced" },
    ],
  },
  {
    id: "price-action",
    title: "Price Action Material",
    items: [
      { label: "Price Action Basic", href: "/material/price-action-basic" },
      { label: "Price Action Advanced", href: "/material/price-action-advanced" },
    ],
  },
]

export default function MaterialPage() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
              Learning Material
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed text-pretty max-w-md mx-auto">
              Select a category to explore the available learning material.
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {SECTIONS.map((section) => {
              const isOpen = openSection === section.id
              return (
                <div
                  key={section.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden"
                >
                  {/* Header button */}
                  <button
                    onClick={() => toggle(section.id)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-foreground">
                      {section.title}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expandable content */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <div className="px-6 pb-5 pt-1 space-y-2 border-t border-border/50">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
