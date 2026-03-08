"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

const marketData = [
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    price: "1.0847",
    change: "+0.12%",
    isPositive: true,
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    price: "1.2654",
    change: "-0.08%",
    isPositive: false,
  },
  {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    price: "2,342.50",
    change: "+0.45%",
    isPositive: true,
  },
]

export function MarketOverview() {
  return (
    <section className="py-8 px-4 border-y border-border/50 bg-card/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Market Overview</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketData.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-base font-semibold text-foreground">{item.symbol}</span>
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-base font-bold text-foreground">{item.price}</span>
                <div className={`flex items-center gap-1 ${item.isPositive ? "text-green-500" : "text-red-500"}`}>
                  {item.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-xs font-medium">{item.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
