"use client"

import { Header } from "@/components/header"
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
  broker: string
  platform: string
  accountType: string
  accountSize: number
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
    broker: "XM",
    platform: "MT5",
    accountType: "Funded",
    accountSize: 10000,
  })
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

  // Load data from localStorage
  useEffect(() => {
    const savedOpenTrades = localStorage.getItem("og_open_trades")
    const savedHistory = localStorage.getItem("og_trade_history")
    const savedAccount = localStorage.getItem("og_account_info")

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

    if (savedAccount) {
      setAccountInfo(JSON.parse(savedAccount))
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (openTrades.length > 0 || tradeHistory.length > 0) {
      localStorage.setItem("og_open_trades", JSON.stringify(openTrades))
      localStorage.setItem("og_trade_history", JSON.stringify(tradeHistory))
      localStorage.setItem("og_account_info", JSON.stringify(accountInfo))
    }
  }, [openTrades, tradeHistory, accountInfo])

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

  // Performance data for charts
  const performanceData = useMemo(() => {
    // Profit over time
    const profitByDate: { [key: string]: number } = {}
    let cumulative = 0
    tradeHistory
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((trade) => {
        cumulative += trade.profitLoss || 0
        profitByDate[trade.date] = cumulative
      })

    // Most traded pairs
    const pairCounts: { [key: string]: number } = {}
    tradeHistory.forEach((trade) => {
      pairCounts[trade.pair] = (pairCounts[trade.pair] || 0) + 1
    })

    // Session performance (simplified - based on hour)
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
            <Button
              onClick={() => setShowAddTrade(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Trade
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Balance</span>
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
                  stats.floatingPL >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {stats.floatingPL >= 0 ? "+" : ""}${stats.floatingPL}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Total Trades</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stats.totalTrades}</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Win Rate</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stats.winRate}%</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Daily P/L</span>
              </div>
              <p
                className={`text-xl font-bold ${
                  stats.dailyPL >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {stats.dailyPL >= 0 ? "+" : ""}${stats.dailyPL}
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
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Pair
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Entry
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        SL
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        TP
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Current
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        P/L
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Duration
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-border/50 hover:bg-card/50">
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
                        <td className="py-3 px-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTradeTime(trade.date)}
                          </span>
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
            )}
          </div>

          {/* Performance Analytics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Profit Over Time */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Profit Trend
              </h3>
              <div className="h-24 flex items-end gap-1">
                {Object.entries(performanceData.profitByDate)
                  .slice(-7)
                  .map(([date, value], i) => {
                    const maxVal = Math.max(
                      ...Object.values(performanceData.profitByDate).map(Math.abs)
                    )
                    const height = maxVal > 0 ? (Math.abs(value) / maxVal) * 100 : 0
                    return (
                      <div
                        key={date}
                        className={`flex-1 rounded-t ${
                          value >= 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{ height: `${Math.max(height, 10)}%` }}
                        title={`${date}: $${value}`}
                      />
                    )
                  })}
              </div>
              <p className="text-lg font-bold text-foreground mt-2">
                ${stats.totalPL >= 0 ? "+" : ""}
                {stats.totalPL}
              </p>
            </div>

            {/* Win/Loss Ratio */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                Win vs Loss
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-red-500/30"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${parseFloat(stats.winRate) * 2.2} 220`}
                      className="text-green-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                    {stats.winRate}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-muted-foreground">Wins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Losses</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Traded Pairs */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Top Pairs
              </h3>
              <div className="space-y-2">
                {Object.entries(performanceData.pairCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([pair, count]) => {
                    const maxCount = Math.max(...Object.values(performanceData.pairCounts))
                    const width = (count / maxCount) * 100
                    return (
                      <div key={pair} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground">{pair}</span>
                          <span className="text-muted-foreground">{count} trades</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Session Performance */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Session P/L
              </h3>
              <div className="space-y-2">
                {Object.entries(performanceData.sessionPL).map(([session, pl]) => (
                  <div key={session} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-foreground">{session}</span>
                    <span
                      className={`text-sm font-medium ${
                        pl >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {pl >= 0 ? "+" : ""}${pl}
                    </span>
                  </div>
                ))}
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

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={filterPair}
                    onChange={(e) => setFilterPair(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Pairs</option>
                    {PAIRS.map((pair) => (
                      <option key={pair} value={pair}>
                        {pair}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterResult}
                    onChange={(e) => setFilterResult(e.target.value as "" | "win" | "loss")}
                    className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Results</option>
                    <option value="win">Wins</option>
                    <option value="loss">Losses</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                <button
                  onClick={() => {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground hover:bg-secondary/80"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortBy === "date" ? "Date" : "P/L"}
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <p className="text-muted-foreground">No trades found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Pair
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Entry
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Exit
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        P/L
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Result
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((trade) => (
                      <tr key={trade.id} className="border-b border-border/50 hover:bg-card/50">
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(trade.date).toLocaleDateString()}
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
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.result === "win"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {trade.result?.toUpperCase()}
                          </span>
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
            )}
          </div>

          {/* Account Information */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Account Information
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Account Size</label>
                <p className="text-lg font-medium text-foreground">
                  ${accountInfo.accountSize.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Broker</label>
                <p className="text-lg font-medium text-foreground">{accountInfo.broker}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Platform</label>
                <p className="text-lg font-medium text-foreground">{accountInfo.platform}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Account Type</label>
                <p className="text-lg font-medium text-foreground">{accountInfo.accountType}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Trade Modal */}
      {showAddTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddTrade(false)} />
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl p-6">
            <button
              onClick={() => setShowAddTrade(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-foreground mb-6">Add New Trade</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Pair
                  </label>
                  <select
                    value={newTrade.pair}
                    onChange={(e) => setNewTrade({ ...newTrade, pair: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {PAIRS.map((pair) => (
                      <option key={pair} value={pair}>
                        {pair}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Type
                  </label>
                  <select
                    value={newTrade.type}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, type: e.target.value as "buy" | "sell" })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="buy">BUY</option>
                    <option value="sell">SELL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Entry Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newTrade.entryPrice}
                    onChange={(e) => setNewTrade({ ...newTrade, entryPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1.0850"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Lot Size
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.lotSize}
                    onChange={(e) => setNewTrade({ ...newTrade, lotSize: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newTrade.stopLoss}
                    onChange={(e) => setNewTrade({ ...newTrade, stopLoss: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1.0800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Take Profit
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newTrade.takeProfit}
                    onChange={(e) => setNewTrade({ ...newTrade, takeProfit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1.0950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Trade Status
                </label>
                <select
                  value={newTrade.result}
                  onChange={(e) =>
                    setNewTrade({ ...newTrade, result: e.target.value as "open" | "win" | "loss" })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="open">Open Trade</option>
                  <option value="win">Closed - Win</option>
                  <option value="loss">Closed - Loss</option>
                </select>
              </div>

              {newTrade.result !== "open" && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Exit Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newTrade.exitPrice}
                    onChange={(e) => setNewTrade({ ...newTrade, exitPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1.0900"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  placeholder="Trade notes..."
                />
              </div>

              <Button
                onClick={handleAddTrade}
                disabled={!newTrade.entryPrice || !newTrade.stopLoss || !newTrade.takeProfit}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Trade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
