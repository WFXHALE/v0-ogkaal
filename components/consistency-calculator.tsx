"use client"

import { useState } from "react"
import { RotateCcw, CheckCircle, AlertTriangle, Percent, DollarSign, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

const CONSISTENCY_PRESETS = [25, 30, 40]

function ResultRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  )
}

export function ConsistencyCalculator() {
  const [accountSize, setAccountSize] = useState("")
  const [profitTarget, setProfitTarget] = useState("")
  const [bestDayProfit, setBestDayProfit] = useState("")
  const [consistencyLimit, setConsistencyLimit] = useState(30)

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })

  const pct = (n: number) => `${n.toFixed(2)}%`

  const size = parseFloat(accountSize) || 0
  const targetPct = parseFloat(profitTarget) || 0
  const bestDay = parseFloat(bestDayProfit) || 0

  const targetProfit = size * (targetPct / 100)
  const bestDayLimit = consistencyLimit / 100 * targetProfit
  const consistencyScore = targetProfit > 0 ? (bestDay / targetProfit) * 100 : 0
  const profitNeeded = Math.max(0, targetProfit - bestDay)
  const isViolation = bestDay > bestDayLimit && bestDayLimit > 0
  const hasValues = size > 0 && targetPct > 0 && bestDay > 0

  const handleReset = () => {
    setAccountSize("")
    setProfitTarget("")
    setBestDayProfit("")
    setConsistencyLimit(30)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Consistency Calculator</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Check if your best trading day violates prop firm consistency rules
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-foreground">Consistency Rule Checker</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            {/* Account Size */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Account Size ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  value={accountSize}
                  onChange={(e) => setAccountSize(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            {/* Profit Target */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Profit Target (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={profitTarget}
                  onChange={(e) => setProfitTarget(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            {/* Highest Daily Profit */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Highest Daily Profit ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  value={bestDayProfit}
                  onChange={(e) => setBestDayProfit(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            {/* Consistency Limit slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">
                  Consistency Limit (%)
                </label>
                <span className="text-sm font-bold text-primary">{consistencyLimit}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="1"
                value={consistencyLimit}
                onChange={(e) => setConsistencyLimit(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              {/* Quick presets */}
              <div className="flex gap-2 mt-2">
                {CONSISTENCY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setConsistencyLimit(preset)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      consistencyLimit === preset
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full border-border text-muted-foreground hover:text-foreground text-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Results */}
          <div className="flex flex-col">
            <div className="bg-secondary rounded-lg p-4 flex-1">
              {hasValues ? (
                <>
                  <ResultRow label="Target Profit" value={fmt(targetProfit)} accent />
                  <ResultRow label="Best Day Limit" value={fmt(bestDayLimit)} />
                  <ResultRow label="Your Best Day" value={fmt(bestDay)} />
                  <ResultRow label="Consistency Score" value={pct(consistencyScore)} />
                  <ResultRow label="Profit Needed to Stay Within Rule" value={fmt(profitNeeded)} />

                  {/* Status indicator */}
                  <div
                    className={`mt-4 flex items-center gap-3 p-3 rounded-lg border ${
                      isViolation
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-green-500/10 border-green-500/30"
                    }`}
                  >
                    {isViolation ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isViolation ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {isViolation ? "Violation Risk" : "Within Limit"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isViolation
                          ? `Your best day exceeds the ${consistencyLimit}% consistency rule by ${fmt(bestDay - bestDayLimit)}`
                          : `Your best day is within the ${consistencyLimit}% consistency rule`}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
                  <Target className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Enter your account details to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
