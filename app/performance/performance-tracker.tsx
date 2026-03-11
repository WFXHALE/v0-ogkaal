"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  getPerformanceStats,
  getUserPerformanceOverride,
  getCertificates,
} from "@/lib/membership-store"
import type { PerformanceStat, UserPerformanceOverride, Certificate } from "@/lib/membership-store"
import {
  BarChart2, TrendingUp, Target, Award, ChevronDown,
  CheckCircle, XCircle, DollarSign, Percent, BookOpen, Image,
} from "lucide-react"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, LineChart, Line, CartesianGrid,
} from "recharts"
import { getSession } from "@/lib/community-utils"

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, positive, icon: Icon,
}: {
  label: string; value: string; sub?: string
  positive?: boolean; icon?: React.ElementType
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Custom Chart Tooltip ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className={`font-bold ${val >= 0 ? "text-green-400" : "text-red-400"}`}>
        {val >= 0 ? "+" : ""}{val}%
      </p>
    </div>
  )
}

// ── Collapsible Section ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-6 pt-2">{children}</div>}
    </div>
  )
}

// ── Certificate Card ───────────────────────────────────────────────────────────
function CertCard({ cert }: { cert: Certificate }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="group rounded-xl border border-border bg-secondary/30 overflow-hidden hover:border-primary/50 transition-colors text-left w-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cert.imageUrl}
          alt={cert.title}
          className="w-full aspect-video object-cover group-hover:opacity-90 transition-opacity"
        />
        <div className="p-3">
          <p className="font-semibold text-foreground text-sm">{cert.title}</p>
          {cert.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cert.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(cert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="max-w-3xl w-full bg-card rounded-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cert.imageUrl} alt={cert.title} className="w-full object-contain max-h-[70vh]" />
            <div className="p-4">
              <p className="font-bold text-foreground">{cert.title}</p>
              {cert.description && <p className="text-sm text-muted-foreground mt-1">{cert.description}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PerformanceTracker() {
  const [stats, setStats] = useState<PerformanceStat[]>([])
  const [override, setOverride] = useState<UserPerformanceOverride | null>(null)
  const [certs, setCerts] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    const uid = session?.id ?? null
    setUserId(uid)

    Promise.all([
      getPerformanceStats(),
      uid ? getUserPerformanceOverride(uid) : Promise.resolve(null),
      uid ? getCertificates(uid) : Promise.resolve([]),
    ]).then(([s, o, c]) => {
      setStats(s)
      setOverride(o)
      setCerts(c)
      setLoading(false)
    })
  }, [])

  const chartData = stats.map(s => ({
    name: s.monthLabel.split(" ")[0].slice(0, 3),
    profit: s.profitPercent,
    winRate: s.winRate,
  }))

  const totalProfit = stats.reduce((sum, s) => sum + s.profitPercent, 0)
  const avgWinRate  = stats.length
    ? Math.round(stats.reduce((sum, s) => sum + s.winRate, 0) / stats.length)
    : 0
  const totalTrades = stats.reduce((sum, s) => sum + s.totalTrades, 0)
  const bestMonth   = stats.length
    ? stats.reduce((best, s) => s.profitPercent > best.profitPercent ? s : best, stats[0])
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 px-4 py-10 max-w-5xl mx-auto w-full space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-secondary/50 animate-pulse" />
          ))}
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10 max-w-5xl mx-auto w-full space-y-6">

        <div>
          <div className="flex items-center gap-3 mb-1">
            <BarChart2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Performance Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm">Monthly trading results and funded account progress</p>
        </div>

        {stats.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No performance data available yet.</div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Return"
                value={`${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(1)}%`}
                sub={`Over ${stats.length} months`}
                positive={totalProfit >= 0}
                icon={TrendingUp}
              />
              <StatCard label="Avg Win Rate" value={`${avgWinRate}%`} sub="Per month average" icon={Target} />
              <StatCard label="Total Trades" value={String(totalTrades)} sub="Across all periods" icon={BarChart2} />
              <StatCard
                label="Best Month"
                value={bestMonth ? `+${bestMonth.profitPercent}%` : "—"}
                sub={bestMonth?.monthLabel ?? ""}
                positive={true}
                icon={Award}
              />
            </div>

            <Section title="Monthly Profit" icon={BarChart2}>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title="Win Rate Trend" icon={TrendingUp}>
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Win Rate"]}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="winRate" stroke="#FCD535" strokeWidth={2.5} dot={{ fill: "#FCD535", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title="Monthly Breakdown" icon={BookOpen}>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Month", "Profit", "Win Rate", "Trades", "W / L"].map(h => (
                        <th key={h} className={`py-3 text-xs font-semibold text-muted-foreground ${h === "Month" ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats].reverse().map(s => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 font-medium text-foreground">{s.monthLabel}</td>
                        <td className={`py-3 text-right font-bold ${s.profitPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {s.profitPercent >= 0 ? "+" : ""}{s.profitPercent}%
                        </td>
                        <td className="py-3 text-right text-foreground">{s.winRate}%</td>
                        <td className="py-3 text-right text-foreground">{s.totalTrades}</td>
                        <td className="py-3 text-right">
                          <span className="text-green-400">{s.winningTrades}W</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-red-400">{s.losingTrades}L</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {override && (
          <Section title="Funded Account Progress" icon={DollarSign}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-2">
              {[
                { icon: CheckCircle, label: "Funded Accounts Passed", value: String(override.fundedAccountsPassed), color: "text-green-400", bg: "bg-green-500/10" },
                { icon: XCircle,     label: "Accounts Breached",       value: String(override.fundedAccountsBreached), color: "text-red-400",   bg: "bg-red-500/10"   },
                { icon: DollarSign,  label: "Total Payouts",           value: `$${override.totalPayouts.toLocaleString()}`, color: "text-foreground", bg: "bg-primary/10" },
                { icon: Percent,     label: "Total Return",            value: `${override.totalReturn >= 0 ? "+" : ""}${override.totalReturn}%`, color: override.totalReturn >= 0 ? "text-green-400" : "text-red-400", bg: "bg-primary/10" },
                { icon: Target,      label: "Win Rate",                value: `${override.winRate}%`, color: "text-foreground", bg: "bg-primary/10" },
                { icon: BarChart2,   label: "Total Trades",            value: String(override.totalTrades), color: "text-foreground", bg: "bg-primary/10" },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="rounded-xl border border-border bg-secondary/30 p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {certs.length > 0 && (
          <Section title="Certificates & Achievements" icon={Award}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-2">
              {certs.map(cert => <CertCard key={cert.id} cert={cert} />)}
            </div>
          </Section>
        )}

        {!userId && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Image className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold mb-1">Sign in to view your personal stats</p>
            <p className="text-muted-foreground text-sm">Your funded account progress and certificates will appear here after you log in.</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pb-2">
          Past performance is not indicative of future results. Trading involves significant risk of loss.
        </p>
      </main>
      <Footer />
    </div>
  )
}
