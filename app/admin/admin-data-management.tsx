"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, Download, Trash2, Image as ImageIcon,
  ArrowDownLeft, ArrowUpRight, Users, FileText,
  UserCheck, Filter, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ─────────────────────────────────────────────────────────────────────

type Dataset = "usdt-buy" | "usdt-sell" | "mentorship-1" | "mentorship-2" | "mentorship-crypto" | "vip" | "users"

interface DataTab {
  key:   Dataset
  label: string
  icon:  typeof Search
  group?: string
}

const TABS: DataTab[] = [
  { key: "users",             label: "Users",              icon: Users,        group: "Users"       },
  { key: "vip",               label: "VIP Group",          icon: FileText,     group: "VIP"         },
  { key: "mentorship-1",      label: "Mentorship 1.0",     icon: UserCheck,    group: "Mentorship"  },
  { key: "mentorship-2",      label: "Mentorship 2.0",     icon: UserCheck,    group: "Mentorship"  },
  { key: "mentorship-crypto", label: "Crypto Mentorship",  icon: UserCheck,    group: "Mentorship"  },
  { key: "usdt-buy",          label: "USDT Buy",           icon: ArrowDownLeft, group: "USDT"       },
  { key: "usdt-sell",         label: "USDT Sell",          icon: ArrowUpRight,  group: "USDT"       },
]

type RecordRow = Record<string, unknown>

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status?: string) {
  if (!status) return null
  const map: Record<string, string> = {
    pending:    "bg-amber-500/10 text-amber-400 border-amber-500/30",
    approved:   "bg-green-500/10 text-green-400 border-green-500/30",
    accepted:   "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled:  "bg-orange-500/10 text-orange-400 border-orange-500/30",
    rejected:   "bg-red-500/10 text-red-400 border-red-500/30",
    processing: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  }
  const cls = map[status] ?? "bg-secondary text-foreground border-border"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  )
}

function formatDate(val: string) {
  if (!val) return "—"
  const d = new Date(val)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function isImageUrl(val: unknown): val is string {
  if (typeof val !== "string") return false
  return /\.(jpg|jpeg|png|webp|gif|bmp)($|\?)/i.test(val) ||
    val.includes("supabase") || val.includes("blob") || val.includes("/storage/")
}

function downloadCSV(rows: RecordRow[], filename: string) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv  = [
    keys.join(","),
    ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
  Object.assign(document.createElement("a"), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}

// ─── Column configs per dataset ────────────────────────────────────────────────

const MENTORSHIP_COLS: { key: string; label: string }[] = [
  { key: "created_at",    label: "Date / Time"  },
  { key: "user_id",       label: "User ID"       },
  { key: "name",          label: "Name"          },
  { key: "email",         label: "Email"         },
  { key: "phone",         label: "Phone"         },
  { key: "telegram",      label: "Telegram"      },
  { key: "amount_paid",   label: "Amount Paid"   },
  { key: "payment_method",label: "Payment"       },
  { key: "status",        label: "Status"        },
  { key: "screenshot_url",label: "Screenshot"    },
]

const COLUMNS: Record<Dataset, { key: string; label: string }[]> = {
  "usdt-buy": [
    { key: "created_at",    label: "Date / Time"  },
    { key: "user_id",       label: "User ID"       },
    { key: "name",          label: "Name"          },
    { key: "email",         label: "Email"         },
    { key: "phone",         label: "Phone"         },
    { key: "amount_usdt",   label: "USDT Amount"   },
    { key: "inr_equivalent",label: "INR Equivalent"},
    { key: "amount_paid",   label: "Amount Paid"   },
    { key: "wallet_address",label: "Wallet"        },
    { key: "transaction_id",label: "Tx ID"         },
    { key: "status",        label: "Status"        },
    { key: "screenshot_url",label: "Screenshot"    },
  ],
  "usdt-sell": [
    { key: "created_at",    label: "Date / Time"  },
    { key: "user_id",       label: "User ID"       },
    { key: "name",          label: "Name"          },
    { key: "email",         label: "Email"         },
    { key: "phone",         label: "Phone"         },
    { key: "amount_usdt",   label: "USDT Amount"   },
    { key: "upi_id",        label: "UPI ID"        },
    { key: "wallet_address",label: "Wallet"        },
    { key: "transaction_id",label: "Tx ID"         },
    { key: "status",        label: "Status"        },
    { key: "screenshot_url",label: "Screenshot"    },
  ],
  "mentorship-1":      MENTORSHIP_COLS,
  "mentorship-2":      MENTORSHIP_COLS,
  "mentorship-crypto": MENTORSHIP_COLS,
  "vip": [
    { key: "created_at",    label: "Date / Time"  },
    { key: "user_id",       label: "User ID"       },
    { key: "name",          label: "Name"          },
    { key: "email",         label: "Email"         },
    { key: "phone",         label: "Phone"         },
    { key: "telegram",      label: "Telegram"      },
    { key: "amount_paid",   label: "Amount Paid"   },
    { key: "payment_method",label: "Payment"       },
    { key: "status",        label: "Status"        },
    { key: "screenshot_url",label: "Screenshot"    },
  ],
  "users": [
    { key: "created_at",   label: "Joined"       },
    { key: "user_id",      label: "User ID"      },
    { key: "full_name",    label: "Full Name"    },
    { key: "email",        label: "Email"        },
    { key: "phone",        label: "Phone"        },
    { key: "username",     label: "Username"     },
    { key: "trading_level",label: "Level"        },
    { key: "kyc_status",   label: "KYC"          },
    { key: "is_verified",  label: "Verified"     },
  ],
}

const ACTION_DATASETS: Dataset[] = ["usdt-buy", "usdt-sell", "mentorship-1", "mentorship-2", "mentorship-crypto", "vip"]

// ─── Cell renderer ─────────────────────────────────────────────────────────────

function CellValue({
  colKey, value, onImageClick,
}: {
  colKey: string
  value: unknown
  onImageClick: (url: string) => void
}) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>

  if (colKey === "status") return statusBadge(String(value))

  if (colKey === "created_at" || colKey === "trade_date") {
    return <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(String(value))}</span>
  }

  if (isImageUrl(value)) {
    return (
      <button
        onClick={() => onImageClick(String(value))}
        className="flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        View
      </button>
    )
  }

  if (typeof value === "boolean") {
    return value
      ? <span className="text-green-400 text-xs font-semibold">Yes</span>
      : <span className="text-red-400 text-xs font-semibold">No</span>
  }

  if (Array.isArray(value)) {
    return <span className="text-xs">{value.join(", ") || "—"}</span>
  }

  const str = String(value)
  if (str.length > 60) {
    return (
      <span className="text-xs" title={str}>
        {str.slice(0, 60)}…
      </span>
    )
  }
  return <span className="text-xs">{str}</span>
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AdminDataManagement() {
  const [activeTab,    setActiveTab]    = useState<Dataset>("usdt-buy")
  const [rows,         setRows]         = useState<RecordRow[]>([])
  const [loading,      setLoading]      = useState(false)
  const [search,       setSearch]       = useState("")
  const [dateFrom,     setDateFrom]     = useState("")
  const [dateTo,       setDateTo]       = useState("")
  const [imageModal,   setImageModal]   = useState<string | null>(null)
  const [actionLoading,setActionLoading]= useState<string | null>(null)
  const [actionMsg,    setActionMsg]    = useState<{ id: string; text: string; ok: boolean } | null>(null)
  const [expandedRow,  setExpandedRow]  = useState<string | null>(null)
  const [filterOpen,   setFilterOpen]   = useState(false)

  const fetchData = useCallback(async (tab: Dataset, s: string, from: string, to: string) => {
    setLoading(true)
    setRows([])
    try {
      const params = new URLSearchParams({ dataset: tab })
      if (s)    params.set("search", s)
      if (from) params.set("from",   from)
      if (to)   params.set("to",     to)
      const res  = await fetch(`/api/admin/data?${params}`)
      const data = await res.json() as { ok: boolean; data?: RecordRow[] }
      if (data.ok) setRows(data.data ?? [])
    } catch (err) {
      console.error("[data-management] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reload when tab changes
  useEffect(() => {
    fetchData(activeTab, "", "", "")
    setSearch("")
    setDateFrom("")
    setDateTo("")
    setActionMsg(null)
  }, [activeTab, fetchData])

  const handleSearch = () => fetchData(activeTab, search, dateFrom, dateTo)
  const handleClear  = () => {
    setSearch(""); setDateFrom(""); setDateTo("")
    fetchData(activeTab, "", "", "")
  }

  // ── Admin action (approve / reject / complete) ──────────────────────────────
  const handleAction = async (row: RecordRow, status: string) => {
    const id = String(row.id ?? "")
    if (!id) return
    setActionLoading(id + status)
    try {
      // 1. Update status in DB
      const patchRes = await fetch("/api/admin/data", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, dataset: activeTab, status }),
      })
      if (!patchRes.ok) throw new Error("Status update failed")

      // 2. Send notification (Telegram + email)
      await fetch("/api/admin/notify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status,
          userName:     String(row.name ?? row.full_name ?? ""),
          userEmail:    String(row.email ?? ""),
          userTelegram: String(row.telegram ?? ""),
          requestType:  activeTab,
          amount:       String(row.amount_usdt ?? row.amount_paid ?? ""),
        }),
      })

      // 3. Update row locally
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      setActionMsg({ id, text: `Status updated to ${status}`, ok: true })
      setTimeout(() => setActionMsg(null), 3000)
    } catch (err) {
      setActionMsg({ id, text: "Failed to update status", ok: false })
    } finally {
      setActionLoading(null)
    }
  }

  // ── Delete row ────────────────────────────────────────────────────────────────
  const handleDelete = async (row: RecordRow) => {
    const id = String(row.id ?? "")
    if (!id || !confirm("Delete this record permanently?")) return
    setActionLoading(id + "delete")
    try {
      await fetch("/api/admin/data", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, dataset: activeTab }),
      })
      setRows(prev => prev.filter(r => r.id !== id))
    } finally {
      setActionLoading(null)
    }
  }

  const cols    = COLUMNS[activeTab]
  const hasActions = ACTION_DATASETS.includes(activeTab)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage all platform data from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(rows, `${activeTab}-export.csv`)}
            disabled={!rows.length}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(activeTab, search, dateFrom, dateTo)}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dataset tabs — grouped */}
      <div className="space-y-2">
        {["Users", "VIP", "Mentorship", "USDT"].map(group => {
          const groupTabs = TABS.filter(t => t.group === group)
          return (
            <div key={group} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest w-20 shrink-0">{group}</span>
              {groupTabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    activeTab === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {/* Search & filter bar */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search by ID, email, name, phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <Button size="sm" onClick={handleSearch} className="px-4">Search</Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterOpen(f => !f)}
            className="gap-1.5"
          >
            <Filter className="w-4 h-4" />
            Date Filter
            {filterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          {(search || dateFrom || dateTo) && (
            <Button size="sm" variant="outline" onClick={handleClear} className="gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {filterOpen && (
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={handleSearch} className="gap-1.5">
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${rows.length} record${rows.length !== 1 ? "s" : ""} found`}
        </p>
        {actionMsg && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
            actionMsg.ok
              ? "bg-green-500/10 text-green-400 border-green-500/30"
              : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}>
            {actionMsg.text}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading data...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <FileText className="w-8 h-8 opacity-30" />
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
                  {cols.map(c => (
                    <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  {hasActions && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  )}
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rowId    = String(row.id ?? i)
                  const expanded = expandedRow === rowId
                  return [
                    <tr
                      key={rowId}
                      className={`border-b border-border/50 transition-colors hover:bg-secondary/20 ${expanded ? "bg-secondary/30" : ""}`}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                      {cols.map(c => (
                        <td key={c.key} className="px-4 py-3 max-w-[200px]">
                          <CellValue
                            colKey={c.key}
                            value={row[c.key]}
                            onImageClick={setImageModal}
                          />
                        </td>
                      ))}
                      {hasActions && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleAction(row, "approved")}
                              disabled={!!actionLoading}
                              title="Approve"
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors disabled:opacity-40"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAction(row, "rejected")}
                              disabled={!!actionLoading}
                              title="Reject"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-40"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAction(row, "completed")}
                              disabled={!!actionLoading}
                              title="Complete"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-40"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              disabled={!!actionLoading}
                              title="Delete"
                              className="p-1.5 rounded-lg bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 border border-zinc-500/20 transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-2 py-3">
                        <button
                          onClick={() => setExpandedRow(expanded ? null : rowId)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Show all fields"
                        >
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>,
                    // Expanded detail row
                    expanded && (
                      <tr key={rowId + "_expanded"} className="bg-secondary/10 border-b border-border/50">
                        <td colSpan={cols.length + (hasActions ? 3 : 2)} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Object.entries(row).map(([k, v]) => (
                              <div key={k} className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium truncate">{k}</p>
                                <div className="mt-0.5">
                                  <CellValue colKey={k} value={v} onImageClick={setImageModal} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image modal */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageModal}
              alt="Document preview"
              className="w-full max-h-[80vh] object-contain rounded-xl border border-border"
            />
            <a
              href={imageModal}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open full size
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
