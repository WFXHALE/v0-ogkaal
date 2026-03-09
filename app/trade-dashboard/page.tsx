"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Activity,
  Wallet,
  Target,
  PieChart,
  Link2,
  Monitor,
  AlertTriangle,
  Check,
  RefreshCw,
  Shield,
} from "lucide-react"

// Types
interface Trade {
  id: string
  date: string
  pair: string
  type: "buy" | "sell"
  entryPrice: number
  exitPrice?: number
  stopLoss: number
  takeProfit: number
  currentPrice?: number
  profitLoss?: number
  result?: "win" | "loss" | "open"
  lotSize: number
  notes?: string
}

interface AccountInfo {
  balance: number
  equity: number
  floatingPL: number
  marginLevel: number
  freeMargin: number
  broker: string
  platform: string
  accountType: string
  accountId: string
  serverName: string
  isConnected: boolean
  isManualMode: boolean
}

interface ConnectionSettings {
  platform: "MT5" | "MT4" | "Other"
  accountId: string
  investorPassword: string
  serverName: string
}

// Sample data
const SAMPLE_OPEN_TRADES: Trade[] = [
  {
    id: "1",
    date: new Date().toISOString(),
    pair: "EURUSD",
    type: "buy",
    entryPrice: 1.0850,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    currentPrice: 1.0875,
    profitLoss: 25,
    result: "open",
    lotSize: 0.5,
  },
  {
    id: "2",
    date: new Date().toISOString(),
    pair: "XAUUSD",
    type: "sell",
    entryPrice: 2650.00,
    stopLoss: 2680.00,
    takeProfit: 2600.00,
    currentPrice: 2640.00,
    profitLoss: 100,
    result: "open",
    lotSize: 0.2,
  },
]

const SAMPLE_HISTORY: Trade[] = [
  {
    id: "h1",
    date: "2024-03-07",
    pair: "GBPUSD",
    type: "buy",
    entryPrice: 1.2700,
    exitPrice: 1.2780,
    stopLoss: 1.2650,
    takeProfit: 1.2800,
    profitLoss: 80,
    result: "win",
    lotSize: 0.5,
  },
  {
    id: "h2",
    date: "2024-03-06",
    pair: "EURUSD",
    type: "sell",
    entryPrice: 1.0900,
    exitPrice: 1.0850,
    stopLoss: 1.0950,
    takeProfit: 1.0800,
    profitLoss: 50,
    result: "win",
    lotSize: 0.3,
  },
  {
    id: "h3",
    date: "2024-03-05",
    pair: "XAUUSD",
    type: "buy",
    entryPrice: 2620.00,
    exitPrice: 2600.00,
    stopLoss: 2600.00,
    takeProfit: 2680.00,
    profitLoss: -40,
    result: "loss",
    lotSize: 0.1,
  },
  {
    id: "h4",
    date: "2024-03-04",
    pair: "USDJPY",
    type: "sell",
    entryPrice: 150.50,
    exitPrice: 149.80,
    stopLoss: 151.00,
    takeProfit: 149.50,
    profitLoss: 70,
    result: "win",
    lotSize: 0.4,
  },
  {
    id: "h5",
    date: "2024-03-03",
    pair: "GBPJPY",
    type: "buy",
    entryPrice: 191.00,
    exitPrice: 190.50,
    stopLoss: 190.00,
    takeProfit: 192.00,
    profitLoss: -50,
    result: "loss",
    lotSize: 0.2,
  },
]

const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "GBPJPY", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF"]

export default function TradeDashboardPage() {
  const [openTrades, setOpenTrades] = useState<Trade[]>([])
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    balance: 10000,
    equity: 10125,
    floatingPL: 125,
    marginLevel: 5000,
    freeMargin: 9500,
    broker: "XM",
    platform: "MT5",
    accountType: "Funded",
    accountId: "",
    serverName: "",
    isConnected: false,
    isManualMode: false,
  })
  
  // Connection popup state
  const [showConnectionPopup, setShowConnectionPopup] = useState(false)
  const [connectionStep, setConnectionStep] = useState<"choose" | "connect" | "connecting" | "success">("choose")
  const [connectionSettings, setConnectionSettings] = useState<ConnectionSettings>({
    platform: "MT5",
    accountId: "",
    investorPassword: "",
    serverName: "",
  })
  const [connectionError, setConnectionError] = useState("")
  const [mounted, setMounted] = useState(false)
  
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [filterPair, setFilterPair] = useState("")
  const [filterResult, setFilterResult] = useState<"" | "win" | "loss">("")
  const [sortBy, setSortBy] = useState<"date" | "profitLoss">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // New trade form state
  const [newTrade, setNewTrade] = useState({
    pair: "EURUSD",
    type: "buy" as "buy" | "sell",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    lotSize: "0.1",
    exitPrice: "",
    result: "open" as "win" | "loss" | "open",
    notes: "",
  })

  // Set mounted state for client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper function to format date consistently
  const formatDate = (dateString: string) => {
    if (!mounted) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const getCurrentDate = () => {
    if (!mounted) return ""
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // Check if account is connected on load
  useEffect(() => {
    const savedAccount = localStorage.getItem("og_account_info")
    const savedOpenTrades = localStorage.getItem("og_open_trades")
    const savedHistory = localStorage.getItem("og_trade_history")
    
    if (savedAccount) {
      const account = JSON.parse(savedAccount)
      setAccountInfo(account)
      if (!account.isConnected && !account.isManualMode) {
        setShowConnectionPopup(true)
      }
    } else {
      setShowConnectionPopup(true)
    }

    if (savedOpenTrades) {
      setOpenTrades(JSON.parse(savedOpenTrades))
    } else {
      setOpenTrades(SAMPLE_OPEN_TRADES)
    }

    if (savedHistory) {
      setTradeHistory(JSON.parse(savedHistory))
    } else {
      setTradeHistory(SAMPLE_HISTORY)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (openTrades.length > 0 || tradeHistory.length > 0) {
      localStorage.setItem("og_open_trades", JSON.stringify(openTrades))
      localStorage.setItem("og_trade_history", JSON.stringify(tradeHistory))
    }
    localStorage.setItem("og_account_info", JSON.stringify(accountInfo))
  }, [openTrades, tradeHistory, accountInfo])

  // Handle manual mode selection
  const handleManualMode = () => {
    setAccountInfo({
      ...accountInfo,
      isManualMode: true,
      isConnected: false,
    })
    setShowConnectionPopup(false)
  }

  // Handle broker connection attempt
  const handleConnectBroker = async () => {
    if (!connectionSettings.accountId || !connectionSettings.investorPassword || !connectionSettings.serverName) {
      setConnectionError("Please fill in all fields")
      return
    }

    setConnectionError("")
    setConnectionStep("connecting")

    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 2000))

    // For demo, we'll show success but note that real MT4/MT5 connection requires a backend
    setConnectionStep("success")
    setAccountInfo({
      ...accountInfo,
      platform: connectionSettings.platform,
      accountId: connectionSettings.accountId,
      serverName: connectionSettings.serverName,
      isConnected: true,
      isManualMode: false,
      // Simulated account data
      balance: 25000,
      equity: 25350,
      floatingPL: 350,
      marginLevel: 8500,
      freeMargin: 24000,
    })

    setTimeout(() => {
      setShowConnectionPopup(false)
      setConnectionStep("choose")
    }, 2000)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTrades = tradeHistory.length
    const wins = tradeHistory.filter((t) => t.result === "win").length
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0"
    const totalPL = tradeHistory.reduce((sum, t) => sum + (t.profitLoss || 0), 0)
    const floatingPL = openTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)
    const todayTrades = tradeHistory.filter(
      (t) => new Date(t.date).toDateString() === new Date().toDateString()
    )
    const dailyPL = todayTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)

    return { totalTrades, winRate, totalPL, floatingPL, dailyPL }
  }, [tradeHistory, openTrades])

  // Risk statistics
  const riskStats = useMemo(() => {
    const totalRiskExposure = openTrades.reduce((sum, t) => {
      const riskPerTrade = Math.abs(t.entryPrice - t.stopLoss) * t.lotSize * 10000
      return sum + riskPerTrade
    }, 0)
    
    const avgRiskPerTrade = openTrades.length > 0 
      ? (totalRiskExposure / openTrades.length).toFixed(2) 
      : "0"

    return {
      totalRiskExposure: totalRiskExposure.toFixed(2),
      numberOfOpenTrades: openTrades.length,
      avgRiskPerTrade,
    }
  }, [openTrades])

  // Performance data for charts
  const performanceData = useMemo(() => {
    const profitByDate: { [key: string]: number } = {}
    let cumulative = 0
    tradeHistory
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((trade) => {
        cumulative += trade.profitLoss || 0
        profitByDate[trade.date] = cumulative
      })

    const pairCounts: { [key: string]: number } = {}
    tradeHistory.forEach((trade) => {
      pairCounts[trade.pair] = (pairCounts[trade.pair] || 0) + 1
    })

    const sessionPL = { asia: 0, london: 0, newyork: 0 }
    tradeHistory.forEach((trade) => {
      const hour = new Date(trade.date).getHours()
      if (hour >= 0 && hour < 8) sessionPL.asia += trade.profitLoss || 0
      else if (hour >= 8 && hour < 14) sessionPL.london += trade.profitLoss || 0
      else sessionPL.newyork += trade.profitLoss || 0
    })

    return { profitByDate, pairCounts, sessionPL }
  }, [tradeHistory])

  // Filtered and sorted history
  const filteredHistory = useMemo(() => {
    let result = [...tradeHistory]

    if (filterPair) {
      result = result.filter((t) => t.pair === filterPair)
    }

    if (filterResult) {
      result = result.filter((t) => t.result === filterResult)
    }

    result.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        return sortOrder === "desc"
          ? (b.profitLoss || 0) - (a.profitLoss || 0)
          : (a.profitLoss || 0) - (b.profitLoss || 0)
      }
    })

    return result
  }, [tradeHistory, filterPair, filterResult, sortBy, sortOrder])

  // Calculate trade duration
  const getTradeTime = (dateStr: string) => {
    const start = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  // Add new trade
  const handleAddTrade = () => {
    const trade: Trade = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pair: newTrade.pair,
      type: newTrade.type,
      entryPrice: parseFloat(newTrade.entryPrice),
      stopLoss: parseFloat(newTrade.stopLoss),
      takeProfit: parseFloat(newTrade.takeProfit),
      lotSize: parseFloat(newTrade.lotSize),
      notes: newTrade.notes,
      result: newTrade.result,
    }

    if (newTrade.result === "open") {
      trade.currentPrice = trade.entryPrice
      trade.profitLoss = 0
      setOpenTrades([...openTrades, trade])
    } else {
      trade.exitPrice = parseFloat(newTrade.exitPrice)
      const pips =
        newTrade.type === "buy"
          ? trade.exitPrice! - trade.entryPrice
          : trade.entryPrice - trade.exitPrice!
      trade.profitLoss = Math.round(pips * 10000 * trade.lotSize)
      trade.result = trade.profitLoss >= 0 ? "win" : "loss"
      setTradeHistory([trade, ...tradeHistory])
    }

    setNewTrade({
      pair: "EURUSD",
      type: "buy",
      entryPrice: "",
      stopLoss: "",
      takeProfit: "",
      lotSize: "0.1",
      exitPrice: "",
      result: "open",
      notes: "",
    })
    setShowAddTrade(false)
  }

  // Close open trade
  const handleCloseTrade = (trade: Trade, exitPrice: number) => {
    const pips =
      trade.type === "buy" ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice
    const profitLoss = Math.round(pips * 10000 * trade.lotSize)

    const closedTrade: Trade = {
      ...trade,
      exitPrice,
      profitLoss,
      result: profitLoss >= 0 ? "win" : "loss",
    }

    setOpenTrades(openTrades.filter((t) => t.id !== trade.id))
    setTradeHistory([closedTrade, ...tradeHistory])
  }

  // Delete trade
  const handleDeleteTrade = (id: string, isOpen: boolean) => {
    if (isOpen) {
      setOpenTrades(openTrades.filter((t) => t.id !== id))
    } else {
      setTradeHistory(tradeHistory.filter((t) => t.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Account Connection Popup */}
      {showConnectionPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Connect Trading Account</h2>
                  <p className="text-sm text-muted-foreground">Link your broker for automatic tracking</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {connectionStep === "choose" && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm mb-6">
                    Choose how you want to track your trades:
                  </p>

                  {/* Option 1: Connect Broker */}
                  <button
                    onClick={() => setConnectionStep("connect")}
                    className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Monitor className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Connect Broker Account</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect your MT4/MT5 account for automatic trade tracking and real-time data
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">Recommended</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Manual Mode */}
                  <button
                    onClick={handleManualMode}
                    className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                        <Edit2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Manual Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          Add and manage your trades manually without connecting a broker
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {connectionStep === "connect" && (
                <div className="space-y-4">
                  <button
                    onClick={() => setConnectionStep("choose")}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back
                  </button>

                  {/* Platform Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Broker Platform
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["MT5", "MT4", "Other"] as const).map((platform) => (
                        <button
                          key={platform}
                          onClick={() => setConnectionSettings({ ...connectionSettings, platform })}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            connectionSettings.platform === platform
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account ID */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account ID
                    </label>
                    <input
                      type="text"
                      value={connectionSettings.accountId}
                      onChange={(e) => setConnectionSettings({ ...connectionSettings, accountId: e.target.value })}
                      placeholder="Enter your trading account ID"
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Investor Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Investor Password (Read-Only)
                    </label>
                    <input
                      type="password"
                      value={connectionSettings.investorPassword}
                      onChange={(e) => setConnectionSettings({ ...connectionSettings, investorPassword: e.target.value })}
                      placeholder="Enter investor password"
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Read-only access - we cannot execute trades
                    </p>
                  </div>

                  {/* Server Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={connectionSettings.serverName}
                      onChange={(e) => setConnectionSettings({ ...connectionSettings, serverName: e.target.value })}
                      placeholder="e.g., XMGlobal-MT5"
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  {connectionError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-500 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {connectionError}
                    </div>
                  )}

                  <Button
                    onClick={handleConnectBroker}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6"
                  >
                    Connect Account
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By connecting, you agree to our terms of service
                  </p>
                </div>
              )}

              {connectionStep === "connecting" && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Connecting to Broker</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we establish a connection...
                  </p>
                </div>
              )}

              {connectionStep === "success" && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Connected Successfully!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your trading account has been linked. Loading your data...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Trade Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor your trading activity and performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <button
                onClick={() => setShowConnectionPopup(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                  accountInfo.isConnected
                    ? "border-green-500/30 bg-green-500/10 text-green-500"
                    : accountInfo.isManualMode
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {accountInfo.isConnected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Connected to {accountInfo.platform}
                  </>
                ) : accountInfo.isManualMode ? (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Manual Mode
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Connect Account
                  </>
                )}
              </button>
              
              <Button
                onClick={() => setShowAddTrade(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Trade
              </Button>
            </div>
          </div>

          {/* Account Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Account Balance</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                ${accountInfo.balance.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Equity</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                ${accountInfo.equity.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Floating P/L</span>
              </div>
              <p
                className={`text-xl font-bold ${
                  accountInfo.floatingPL >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {accountInfo.floatingPL >= 0 ? "+" : ""}${accountInfo.floatingPL}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Margin Level</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {accountInfo.marginLevel.toLocaleString()}%
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Free Margin</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                ${accountInfo.freeMargin.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Open Trades Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Open Trades
              <span className="text-sm font-normal text-muted-foreground">
                ({openTrades.length})
              </span>
            </h2>

            {openTrades.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <p className="text-muted-foreground">No open trades</p>
                <Button
                  onClick={() => setShowAddTrade(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Trade
                </Button>
              </div>
            ) : (
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pair</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lot Size</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Entry</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SL</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">TP</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Current</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">P/L</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openTrades.map((trade) => (
                        <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/20">
                          <td className="py-3 px-4 font-medium text-foreground">{trade.pair}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                trade.type === "buy"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}
                            >
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">{trade.lotSize}</td>
                          <td className="py-3 px-4 text-foreground">{trade.entryPrice}</td>
                          <td className="py-3 px-4 text-red-500">{trade.stopLoss}</td>
                          <td className="py-3 px-4 text-green-500">{trade.takeProfit}</td>
                          <td className="py-3 px-4 text-foreground">{trade.currentPrice}</td>
                          <td
                            className={`py-3 px-4 font-medium ${
                              (trade.profitLoss || 0) >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {(trade.profitLoss || 0) >= 0 ? "+" : ""}${trade.profitLoss}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  const exitPrice = prompt("Enter exit price:")
                                  if (exitPrice) {
                                    handleCloseTrade(trade, parseFloat(exitPrice))
                                  }
                                }}
                              >
                                Close
                              </Button>
                              <button
                                onClick={() => handleDeleteTrade(trade.id, true)}
                                className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Risk Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Risk Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Total Risk Exposure</span>
                </div>
                <p className="text-xl font-bold text-foreground">${riskStats.totalRiskExposure}</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Number of Open Trades</span>
                </div>
                <p className="text-xl font-bold text-foreground">{riskStats.numberOfOpenTrades}</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Average Risk Per Trade</span>
                </div>
                <p className="text-xl font-bold text-foreground">${riskStats.avgRiskPerTrade}</p>
              </div>
            </div>
          </div>

          {/* Trade History */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Trade History
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={filterPair}
                  onChange={(e) => setFilterPair(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="">All Pairs</option>
                  {PAIRS.map((pair) => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value as "" | "win" | "loss")}
                  className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="">All Results</option>
                  <option value="win">Wins</option>
                  <option value="loss">Losses</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pair</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Entry</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Exit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">P/L</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((trade) => (
                      <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/20">
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {formatDate(trade.date)}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{trade.pair}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.type === "buy"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {trade.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground">{trade.entryPrice}</td>
                        <td className="py-3 px-4 text-foreground">{trade.exitPrice}</td>
                        <td
                          className={`py-3 px-4 font-medium ${
                            (trade.profitLoss || 0) >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {(trade.profitLoss || 0) >= 0 ? "+" : ""}${trade.profitLoss}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteTrade(trade.id, false)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Win Rate Breakdown */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                Win vs Loss
              </h3>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {tradeHistory.filter((t) => t.result === "win").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {tradeHistory.filter((t) => t.result === "loss").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Win Rate
              </h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.winRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalTrades} total trades
                </p>
              </div>
            </div>

            {/* Total P/L */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Total P/L
              </h3>
              <div className="text-center">
                <p className={`text-3xl font-bold ${stats.totalPL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {stats.totalPL >= 0 ? "+" : ""}${stats.totalPL}
                </p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
            </div>

            {/* Daily P/L */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Today&apos;s P/L
              </h3>
              <div className="text-center">
                <p className={`text-3xl font-bold ${stats.dailyPL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {stats.dailyPL >= 0 ? "+" : ""}${stats.dailyPL}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getCurrentDate()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Trade Modal */}
      {showAddTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddTrade(false)} />
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Add New Trade</h3>
              <button
                onClick={() => setShowAddTrade(false)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Trade Status */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Trade Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewTrade({ ...newTrade, result: "open" })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      newTrade.result === "open"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground"
                    }`}
                  >
                    Open Trade
                  </button>
                  <button
                    onClick={() => setNewTrade({ ...newTrade, result: "win" })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      newTrade.result !== "open"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground"
                    }`}
                  >
                    Closed Trade
                  </button>
                </div>
              </div>

              {/* Pair Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Pair</label>
                <select
                  value={newTrade.pair}
                  onChange={(e) => setNewTrade({ ...newTrade, pair: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground"
                >
                  {PAIRS.map((pair) => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>

              {/* Trade Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewTrade({ ...newTrade, type: "buy" })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      newTrade.type === "buy"
                        ? "border-green-500 bg-green-500/10 text-green-500"
                        : "border-border text-foreground"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setNewTrade({ ...newTrade, type: "sell" })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      newTrade.type === "sell"
                        ? "border-red-500 bg-red-500/10 text-red-500"
                        : "border-border text-foreground"
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              {/* Price Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Entry Price</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={newTrade.entryPrice}
                    onChange={(e) => setNewTrade({ ...newTrade, entryPrice: e.target.value })}
                    placeholder="0.00000"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.lotSize}
                    onChange={(e) => setNewTrade({ ...newTrade, lotSize: e.target.value })}
                    placeholder="0.10"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Stop Loss</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={newTrade.stopLoss}
                    onChange={(e) => setNewTrade({ ...newTrade, stopLoss: e.target.value })}
                    placeholder="0.00000"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Take Profit</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={newTrade.takeProfit}
                    onChange={(e) => setNewTrade({ ...newTrade, takeProfit: e.target.value })}
                    placeholder="0.00000"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground"
                  />
                </div>
              </div>

              {/* Exit Price (for closed trades) */}
              {newTrade.result !== "open" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Exit Price</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={newTrade.exitPrice}
                    onChange={(e) => setNewTrade({ ...newTrade, exitPrice: e.target.value })}
                    placeholder="0.00000"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                  placeholder="Trade notes..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground resize-none"
                />
              </div>

              <Button
                onClick={handleAddTrade}
                disabled={!newTrade.entryPrice || !newTrade.stopLoss || !newTrade.takeProfit}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6"
              >
                Add Trade
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
