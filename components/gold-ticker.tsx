"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ForexItem {
  symbol: string
  price: string
  change: string
  isPositive: boolean
}

export function GoldTicker() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data } = useSWR<{ success: boolean; data: ForexItem[] }>(
    mounted ? "/api/intelligence/forex" : null,
    fetcher,
    { refreshInterval: 15000 }
  )

  const gold = data?.data?.find(d => d.symbol === "XAUUSD")

  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          {/* Title */}
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
            Live Price
          </p>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            XAUUSD <span className="text-primary">/ GOLD</span>
          </h2>

          {/* Price */}
          <div suppressHydrationWarning>
            {!mounted || !gold ? (
              <div className="space-y-3">
                <div className="h-14 w-48 bg-muted rounded-lg animate-pulse mx-auto" />
                <div className="h-6 w-28 bg-muted rounded animate-pulse mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-5xl font-bold text-foreground tracking-tight mb-3">
                  {gold.price}
                </p>
                <p className={`text-xl font-semibold ${gold.isPositive ? "text-green-500" : "text-red-500"}`}>
                  {gold.change}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
