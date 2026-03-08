"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Shield, LogOut, RefreshCw, Trash2, CheckCircle, Clock, 
  DollarSign, Users, GraduationCap, FileText, MapPin, Globe,
  ChevronDown, ChevronUp, Filter
} from "lucide-react"
import { isSessionValid, logout, getSession } from "@/lib/admin-auth"

interface Submission {
  id: string
  type: "usdt_p2p" | "funded_account" | "mentorship" | "other"
  name: string
  email?: string
  telegram?: string
  phone?: string
  details: Record<string, unknown>
  status: "pending" | "completed"
  ipAddress: string
  location: string
  createdAt: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "usdt_p2p" | "funded_account" | "mentorship" | "other">("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkAuth()
    loadSubmissions()
  }, [])

  const checkAuth = () => {
    if (!isSessionValid()) {
      router.push("/admin/login")
      return
    }
    
    const session = getSession()
    if (session) {
      setAdminEmail(session.email)
    }
    setIsAuthenticated(true)
    setIsLoading(false)
  }

  const loadSubmissions = () => {
    const stored = localStorage.getItem("og_admin_submissions")
    if (stored) {
      setSubmissions(JSON.parse(stored))
    } else {
      // Initialize with demo data
      const demoData: Submission[] = [
        {
          id: "1",
          type: "usdt_p2p",
          name: "John Doe",
          telegram: "@johndoe",
          phone: "+91 98765 43210",
          details: { action: "buy", amount: "500 USDT", paymentMethod: "UPI" },
          status: "pending",
          ipAddress: "103.45.67.89",
          location: "Mumbai, India",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          type: "funded_account",
          name: "Jane Smith",
          email: "jane@example.com",
          telegram: "@janesmith",
          phone: "+91 87654 32109",
          details: { accountSize: "$50K", propFirm: "FTMO" },
          status: "pending",
          ipAddress: "182.73.45.12",
          location: "Delhi, India",
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          type: "mentorship",
          name: "Rahul Kumar",
          email: "rahul@example.com",
          telegram: "@rahulk",
          phone: "+91 76543 21098",
          details: { program: "Mentorship 2.0", experience: "Beginner" },
          status: "completed",
          ipAddress: "49.207.89.123",
          location: "Bangalore, India",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      setSubmissions(demoData)
      localStorage.setItem("og_admin_submissions", JSON.stringify(demoData))
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  const updateStatus = (id: string, status: "pending" | "completed") => {
    const updated = submissions.map(sub => 
      sub.id === id ? { ...sub, status } : sub
    )
    setSubmissions(updated)
    localStorage.setItem("og_admin_submissions", JSON.stringify(updated))
  }

  const deleteSubmission = (id: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      const updated = submissions.filter(sub => sub.id !== id)
      setSubmissions(updated)
      localStorage.setItem("og_admin_submissions", JSON.stringify(updated))
    }
  }

  const filteredSubmissions = submissions
    .filter(sub => activeTab === "all" || sub.type === activeTab)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "usdt_p2p": return "USDT P2P"
      case "funded_account": return "Funded Account"
      case "mentorship": return "Mentorship"
      default: return "Other"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "usdt_p2p": return "bg-green-500/10 text-green-400 border-green-500/30"
      case "funded_account": return "bg-blue-500/10 text-blue-400 border-blue-500/30"
      case "mentorship": return "bg-purple-500/10 text-purple-400 border-purple-500/30"
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/30"
    }
  }

  const formatDate = (dateString: string) => {
    if (!mounted) return ""
    const date = new Date(dateString)
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    completed: submissions.filter(s => s.status === "completed").length,
    usdt: submissions.filter(s => s.type === "usdt_p2p").length,
    funded: submissions.filter(s => s.type === "funded_account").length,
    mentorship: submissions.filter(s => s.type === "mentorship").length
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
<h1 className="font-bold text-foreground">Admin Dashboard</h1>
  <p className="text-xs text-muted-foreground">{adminEmail || "OG KAAL TRADER"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={loadSubmissions}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">USDT P2P</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.usdt}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Funded</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.funded}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Mentorship</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.mentorship}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Requests" },
              { key: "usdt_p2p", label: "USDT P2P" },
              { key: "funded_account", label: "Funded Account" },
              { key: "mentorship", label: "Mentorship" },
              { key: "other", label: "Other" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-sm"
          >
            <Filter className="w-4 h-4" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
            {sortOrder === "newest" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Submissions Table */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Contact</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Details</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Location</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Date & Time</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map(submission => (
                    <tr key={submission.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{submission.name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {submission.telegram && (
                            <p className="text-sm text-foreground">{submission.telegram}</p>
                          )}
                          {submission.phone && (
                            <p className="text-xs text-muted-foreground">{submission.phone}</p>
                          )}
                          {submission.email && (
                            <p className="text-xs text-muted-foreground">{submission.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(submission.type)}`}>
                          {getTypeLabel(submission.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-muted-foreground max-w-[200px]">
                          {Object.entries(submission.details).map(([key, value]) => (
                            <p key={key} className="truncate">
                              <span className="capitalize">{key}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-foreground">{submission.location}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {submission.ipAddress}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(submission.createdAt)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          submission.status === "completed"
                            ? "bg-green-500/10 text-green-400 border border-green-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}>
                          {submission.status === "completed" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {submission.status === "completed" ? "Completed" : "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {submission.status === "pending" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(submission.id, "completed")}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(submission.id, "pending")}
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSubmission(submission.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
