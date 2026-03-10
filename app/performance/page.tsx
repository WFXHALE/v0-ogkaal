"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getPerformanceStats } from "@/lib/membership-store"
import type { PerformanceStat } from "@/lib/membership-store"
import { TrendingUp, TrendingDown, BarChart2, Target, Award } from "lucide-react"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, LineChart, Line, CartesianGrid,
} from "recharts"

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold ${positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className={`font-bold ${val >= 0 ? "text-green-400" : "text-red-400"}`}>{val >= 0 ? "+" : ""}{val}%</p>
    </div>
  )
}

export default function PerformancePage() {
  const [stats, setStats] = useState<PerformanceStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPerformanceStats().then(s => { setStats(s); setLoading(false) })
  }, [])

  const chartData = stats.map(s => ({
    name: s.monthLabel.split(" ")[0].slice(0, 3), // "Jan"
    profit: s.profitPercent,
    winRate: s.winRate,
  }))

  const totalProfit = stats.reduce((sum, s) => sum + s.profitPercent, 0)
  const avgWinRate = stats.length ? Math.round(stats.reduce((sum, s) => sum + s.winRate, 0) / stats.length) : 0
  const totalTrades = stats.reduce((sum, s) => sum + s.totalTrades, 0)
  const bestMonth = stats.reduce((best, s) => s.profitPercent > (best?.profitPercent ?? -Infinity) ? s : best, stats[0])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <BarChart2 className="w-6 h-6 text-[#FCD535]" />
            <h1 className="text-2xl font-bold text-foreground">Performance Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm">Monthly trading statistics and results</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-secondary/50 animate-pulse" />)}
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No performance data available yet.</div>
        ) : (
          <div className="space-y-8">
            {/* Summary cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Return" value={`${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(1)}%`} sub={`Over ${stats.length} months`} positive={totalProfit >= 0} />
              <StatCard label="Avg Win Rate" value={`${avgWinRate}%`} sub="Per month average" />
              <StatCard label="Total Trades" value={String(totalTrades)} sub="Across all periods" />
              <StatCard label="Best Month" value={bestMonth ? `+${bestMonth.profitPercent}%` : "—"} sub={bestMonth?.monthLabel ?? ""} positive={true} />
            </div>

            {/* Profit bar chart */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Monthly Profit (%)</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Win rate line chart */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Win Rate (%)</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Win Rate"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="winRate" stroke="#FCD535" strokeWidth={2.5} dot={{ fill: "#FCD535", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Monthly Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Month</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Profit</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Win Rate</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Trades</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">W / L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats].reverse().map(s => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">{s.monthLabel}</td>
                        <td className={`px-5 py-3 text-right font-bold ${s.profitPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {s.profitPercent >= 0 ? "+" : ""}{s.profitPercent}%
                        </td>
                        <td className="px-5 py-3 text-right text-foreground">{s.winRate}%</td>
                        <td className="px-5 py-3 text-right text-foreground">{s.totalTrades}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-green-400">{s.winningTrades}W</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-red-400">{s.losingTrades}L</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              Past performance is not indicative of future results. Trading involves significant risk of loss.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
