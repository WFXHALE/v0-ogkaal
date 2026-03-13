"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo, useCallback } from "react"
import { getSession } from "@/lib/dash-auth"
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
  platform: TradePlatform
  firmSearch: string
  accountId: string
  password: string
  investorPassword: string
  serverName: string
  serverSearch: string
}

// ─── Funded firm server data ─────────────────────────────────────────────────
interface BrokerServer {
  firm: string
  platform: "MT4" | "MT5" | "both"
  servers: string[]
}

const FUNDED_SERVERS: BrokerServer[] = [
  // ── Top prop firms ────────────────────────────────────────────────────────
  { firm: "FTMO", platform: "both", servers: ["FTMO-Server", "FTMO-Server2", "FTMO-Server3", "FTMO-Server4", "FTMO-Demo", "FTMO-Live"] },
  { firm: "FundedNext", platform: "both", servers: ["FundedNext-Server", "FundedNext-Live", "FundedNext-Demo", "FundedNext-MT5", "FundedNext-MT4-Live"] },
  { firm: "Funding Pips", platform: "MT5", servers: ["FundingPips-Live", "FundingPips-Demo", "FundingPips-MT5", "FundingPips-Server"] },
  { firm: "E8 Markets", platform: "both", servers: ["E8Markets-Live", "E8Markets-Demo", "E8Markets-MT5", "E8Markets-Server"] },
  { firm: "The 5%ers", platform: "MT5", servers: ["The5ers-Live", "The5ers-Demo", "The5ers-MT5", "FivePercentOnline-Server"] },
  { firm: "Alpha Capital", platform: "both", servers: ["AlphaCapital-Live", "AlphaCapital-Demo", "AlphaCapital-MT5", "AlphaCapital-Server"] },
  { firm: "Goat Funded Trader", platform: "MT5", servers: ["GoatFunded-Live", "GoatFunded-Demo", "GoatFunded-MT5", "GoatFunded-Server"] },
  { firm: "Maven Trading", platform: "MT5", servers: ["MavenTrading-Live", "MavenTrading-Demo", "MavenTrading-MT5"] },
  { firm: "Finotive Funding", platform: "MT5", servers: ["Finotive-Live", "Finotive-Demo", "Finotive-MT5"] },
  { firm: "QT Funded", platform: "MT5", servers: ["QTFunded-Live", "QTFunded-Demo"] },
  { firm: "Aqua Funded", platform: "MT5", servers: ["AquaFunded-Live", "AquaFunded-Demo"] },
  { firm: "Top One Trader", platform: "MT5", servers: ["TopOneTrader-Live", "TopOneTrader-Demo"] },
  { firm: "Funded Elite", platform: "MT5", servers: ["FundedElite-Live", "FundedElite-Demo"] },
  { firm: "BrightFunded", platform: "MT5", servers: ["BrightFunded-Live", "BrightFunded-Demo"] },
  { firm: "Blueberry Funded", platform: "both", servers: ["BlueberryFunded-Live", "BlueberryFunded-Demo", "BlueberryMarkets-Live", "BlueberryMarkets-Demo"] },
  { firm: "For Traders", platform: "both", servers: ["ForTraders-Live", "ForTraders-Demo"] },
  { firm: "Breakout", platform: "MT5", servers: ["Breakout-Live", "Breakout-Demo"] },
  { firm: "Think Capital", platform: "MT5", servers: ["ThinkCapital-Live", "ThinkCapital-Demo"] },
  { firm: "Pipstone Capital", platform: "MT5", servers: ["Pipstone-Live", "Pipstone-Demo"] },
  { firm: "Kelvero Funding", platform: "MT5", servers: ["Kelvero-Live", "Kelvero-Demo"] },
  { firm: "Lux Trading", platform: "MT5", servers: ["LuxTradingFirm-Live", "LuxTradingFirm-Demo"] },
  { firm: "The Trading Pit", platform: "both", servers: ["TheTradingPit-Live", "TheTradingPit-Demo"] },
  // ── Retail brokers ────────────────────────────────────────────────────────
  { firm: "IC Markets", platform: "both", servers: ["ICMarkets-Live01", "ICMarkets-Live02", "ICMarkets-Demo", "ICMarketsSC-Live01", "ICMarketsSC-Live02"] },
  { firm: "Pepperstone", platform: "both", servers: ["Pepperstone-Edge-Live", "Pepperstone-Edge-Demo", "PepperstoneFX-Demo01"] },
  { firm: "ThinkMarkets", platform: "both", servers: ["ThinkMarkets-Live", "ThinkMarkets-Demo", "ThinkMarketsMT4-Live"] },
  { firm: "Eightcap", platform: "both", servers: ["Eightcap-Live", "Eightcap-Demo", "EightcapLLC-Live"] },
  { firm: "XM", platform: "both", servers: ["XMGlobal-MT5", "XMGlobal-MT5 2", "XMGlobal-MT5 3", "XMGlobal-MT4", "XMGlobal-MT4 2"] },
  { firm: "OANDA", platform: "MT4", servers: ["OANDA-v20 Live", "OANDA-v20 Practice"] },
  { firm: "Fusion Markets", platform: "both", servers: ["FusionMarkets-Live", "FusionMarkets-Demo"] },
  { firm: "FXCM", platform: "both", servers: ["FXCM-USDReal", "FXCM-EURReal", "FXCM-Practice"] },
]

type TradePlatform =
  | "MT4"
  | "MT5"
  | "cTrader"
  | "DXTrade"
  | "Match-Trader"
  | "TradeLocker"
  | "MagicTrader"
  | "TradingView"
  | "NinjaTrader"
  | "Rithmic"
  | "Quantower"
  | "Other"

const PLATFORMS: { id: TradePlatform; label: string; hasBrokerServer: boolean }[] = [
  { id: "MT5",          label: "MetaTrader 5 (MT5)",            hasBrokerServer: true  },
  { id: "MT4",          label: "MetaTrader 4 (MT4)",            hasBrokerServer: true  },
  { id: "cTrader",      label: "cTrader",                       hasBrokerServer: false },
  { id: "DXTrade",      label: "DXTrade",                       hasBrokerServer: false },
  { id: "Match-Trader", label: "Match-Trader",                  hasBrokerServer: false },
  { id: "TradeLocker",  label: "TradeLocker",                   hasBrokerServer: false },
  { id: "MagicTrader",  label: "MagicTrader",                   hasBrokerServer: false },
  { id: "TradingView",  label: "TradingView Broker Integration", hasBrokerServer: false },
  { id: "NinjaTrader",  label: "NinjaTrader",                   hasBrokerServer: false },
  { id: "Rithmic",      label: "Rithmic",                       hasBrokerServer: false },
  { id: "Quantower",    label: "Quantower",                     hasBrokerServer: false },
  { id: "Other",        label: "Other",                         hasBrokerServer: false },
]

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
    firmSearch: "",
    accountId: "",
    password: "",
    investorPassword: "",
    serverName: "",
    serverSearch: "",
  })
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [dbLoading, setDbLoading] = useState(true)
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  
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

  // Load account + trades from DB on mount
  useEffect(() => {
    const session = getSession()
    const uid = session?.id ?? null
    setDbUserId(uid)
    setMounted(true)

    const load = async () => {
      setDbLoading(true)
      try {
        // Load account info
        const [acctRes, tradesRes] = await Promise.all([
          fetch("/api/trade-account" + (uid ? `?userId=${uid}` : "")),
          fetch("/api/trades" + (uid ? `?userId=${uid}` : "")),
        ])
        const acctJson   = acctRes.ok   ? await acctRes.json()   : { ok: false }
        const tradesJson = tradesRes.ok ? await tradesRes.json() : { ok: false }

        if (acctJson.ok && acctJson.data) {
          const a = acctJson.data as Record<string, unknown>
          setAccountInfo({
            balance:       Number(a.balance      ?? 10000),
            equity:        Number(a.balance      ?? 10000),
            floatingPL:    0,
            marginLevel:   0,
            freeMargin:    Number(a.balance      ?? 10000),
            broker:        String(a.broker       ?? ""),
            platform:      String(a.platform     ?? "MT5"),
            accountType:   String(a.account_type ?? "Funded"),
            accountId:     String(a.account_id   ?? ""),
            serverName:    String(a.server_name  ?? ""),
            isConnected:   Boolean(a.is_connected),
            isManualMode:  Boolean(a.is_manual_mode),
          })
          if (!acctJson.data.is_connected && !acctJson.data.is_manual_mode) {
            setShowConnectionPopup(true)
          }
        } else {
          setShowConnectionPopup(true)
        }

        if (tradesJson.ok && tradesJson.data?.length > 0) {
          // DB columns: status ('open'|'closed'), opened_at, closed_at
          // Trade interface: result ('open'|'win'|'loss'), date
          const all: Trade[] = (tradesJson.data as Record<string, unknown>[]).map(r => {
            const isOpen = String(r.status ?? "open") === "open"
            const result: "open" | "win" | "loss" = isOpen
              ? "open"
              : (Number(r.profit_loss ?? 0) >= 0 ? "win" : "loss")
            return {
              id:           String(r.id),
              date:         String(r.opened_at ?? new Date().toISOString()),
              pair:         String(r.pair),
              type:         r.type as "buy" | "sell",
              entryPrice:   Number(r.entry_price),
              exitPrice:    r.exit_price    != null ? Number(r.exit_price)    : undefined,
              stopLoss:     Number(r.stop_loss),
              takeProfit:   Number(r.take_profit),
              currentPrice: r.current_price != null ? Number(r.current_price) : undefined,
              profitLoss:   r.profit_loss   != null ? Number(r.profit_loss)   : undefined,
              result,
              lotSize:      Number(r.lot_size),
              notes:        r.notes ? String(r.notes) : undefined,
            }
          })
          setOpenTrades(all.filter(t => t.result === "open"))
          setTradeHistory(all.filter(t => t.result !== "open"))
        } else {
          setOpenTrades(SAMPLE_OPEN_TRADES)
          setTradeHistory(SAMPLE_HISTORY)
        }
      } catch {
        setShowConnectionPopup(true)
        setOpenTrades(SAMPLE_OPEN_TRADES)
        setTradeHistory(SAMPLE_HISTORY)
      } finally {
        setDbLoading(false)
      }
    }
    load()
  }, [])

  // Persist account info to DB
  const saveAccount = useCallback(async (info: AccountInfo) => {
    if (!dbUserId) return
    await fetch("/api/trade-account", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId:       dbUserId,
        broker:       info.broker,
        platform:     info.platform,
        accountType:  info.accountType,
        accountId:    info.accountId,
        serverName:   info.serverName,
        balance:      info.balance,
        isConnected:  info.isConnected,
        isManualMode: info.isManualMode,
        dailyProfitTarget: null,
        dailyMaxLoss:      null,
      }),
    }).catch(() => {})
  }, [dbUserId])

  // Handle manual mode selection
  const handleManualMode = () => {
    const updated = { ...accountInfo, isManualMode: true, isConnected: false }
    setAccountInfo(updated)
    saveAccount(updated)
    setShowConnectionPopup(false)
  }

  // Handle broker connection attempt
  const handleConnectBroker = async () => {
    const needsServer = PLATFORMS.find(p => p.id === connectionSettings.platform)?.hasBrokerServer
    if (!connectionSettings.accountId || !connectionSettings.password) {
      setConnectionError("Please fill in Account ID and Password")
      return
    }
    if (needsServer && !connectionSettings.serverName) {
      setConnectionError("Please select or enter a server name")
      return
    }

    setConnectionError("")
    setConnectionStep("connecting")

    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 2000))

    // For demo, we'll show success but note that real MT4/MT5 connection requires a backend
    setConnectionStep("success")
    const updated: AccountInfo = {
      ...accountInfo,
      platform:     connectionSettings.platform,
      accountId:    connectionSettings.accountId,
      serverName:   connectionSettings.serverName,
      isConnected:  true,
      isManualMode: false,
      balance:      25000,
      equity:       25350,
      floatingPL:   350,
      marginLevel:  8500,
      freeMargin:   24000,
    }
    setAccountInfo(updated)
    saveAccount(updated)

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

  // Persist a trade to DB
  const saveTrade = useCallback(async (trade: Trade) => {
    if (!dbUserId) return trade.id
    const res = await fetch("/api/trades", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId:       dbUserId,
        pair:         trade.pair,
        type:         trade.type,
        entryPrice:   trade.entryPrice,
        exitPrice:    trade.exitPrice   ?? null,
        stopLoss:     trade.stopLoss,
        takeProfit:   trade.takeProfit,
        currentPrice: trade.currentPrice ?? null,
        profitLoss:   trade.profitLoss   ?? null,
        result:       trade.result       ?? "open",
        lotSize:      trade.lotSize,
        notes:        trade.notes        ?? null,
        date:         trade.date,
      }),
    }).catch(() => null)
    if (res?.ok) {
      const json = await res.json()
      return String(json.data?.id ?? trade.id)
    }
    return trade.id
  }, [dbUserId])

  // Add new trade
  const handleAddTrade = async () => {
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
      const id = await saveTrade(trade)
      setOpenTrades([...openTrades, { ...trade, id }])
    } else {
      trade.exitPrice = parseFloat(newTrade.exitPrice)
      const pips =
        newTrade.type === "buy"
          ? trade.exitPrice! - trade.entryPrice
          : trade.entryPrice - trade.exitPrice!
      trade.profitLoss = Math.round(pips * 10000 * trade.lotSize)
      trade.result = trade.profitLoss >= 0 ? "win" : "loss"
      const id = await saveTrade(trade)
      setTradeHistory([{ ...trade, id }, ...tradeHistory])
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
  const handleCloseTrade = async (trade: Trade, exitPrice: number) => {
    const pips =
      trade.type === "buy" ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice
    const profitLoss = Math.round(pips * 10000 * trade.lotSize)

    const closedTrade: Trade = {
      ...trade,
      exitPrice,
      profitLoss,
      result: profitLoss >= 0 ? "win" : "loss",
    }

    // Update in DB
    if (dbUserId) {
      await fetch("/api/trades", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:          trade.id,
          userId:      dbUserId,
          exitPrice:   closedTrade.exitPrice,
          profitLoss:  closedTrade.profitLoss,
          result:      closedTrade.result,
        }),
      }).catch(() => {})
    }

    setOpenTrades(openTrades.filter((t) => t.id !== trade.id))
    setTradeHistory([closedTrade, ...tradeHistory])
  }

  // Delete trade
  const handleDeleteTrade = async (id: string, isOpen: boolean) => {
    if (dbUserId) {
      await fetch(`/api/trades?id=${id}&userId=${dbUserId}`, { method: "DELETE" }).catch(() => {})
    }
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

              {connectionStep === "connect" && (() => {
                const activePlatform = PLATFORMS.find(p => p.id === connectionSettings.platform)
                const needsServer = activePlatform?.hasBrokerServer ?? false

                // Filter servers based on platform + search query
                const filteredFirms = FUNDED_SERVERS.filter(b => {
                  const matchesPlatform =
                    b.platform === "both" ||
                    b.platform === connectionSettings.platform
                  const query = connectionSettings.serverSearch.toLowerCase()
                  const matchesSearch =
                    !query ||
                    b.firm.toLowerCase().includes(query) ||
                    b.servers.some(s => s.toLowerCase().includes(query))
                  return matchesPlatform && matchesSearch
                })

                return (
                  <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
                    <button
                      onClick={() => setConnectionStep("choose")}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                      Back
                    </button>

                    {/* Step indicators */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {["Platform", needsServer ? "Server" : null, "Credentials"].filter(Boolean).map((s, i, arr) => (
                        <span key={s} className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground font-medium">{i + 1}. {s}</span>
                          {i < arr.length - 1 && <span>›</span>}
                        </span>
                      ))}
                    </div>

                    {/* Step 1 — Platform */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        1. Select Platform
                      </label>
                      <div className="relative">
                        <select
                          value={connectionSettings.platform}
                          onChange={(e) => setConnectionSettings({
                            ...connectionSettings,
                            platform: e.target.value as TradePlatform,
                            serverName: "",
                            serverSearch: "",
                          })}
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
                        >
                          {PLATFORMS.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Step 2 — Server (MT4/MT5 only) */}
                    {needsServer && (
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          2. Select Server
                        </label>

                        {/* Search input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={connectionSettings.serverSearch}
                            onChange={(e) => {
                              setConnectionSettings({ ...connectionSettings, serverSearch: e.target.value, serverName: "" })
                              setServerDropdownOpen(true)
                            }}
                            onFocus={() => setServerDropdownOpen(true)}
                            placeholder="Search firm or server name..."
                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Selected server badge */}
                        {connectionSettings.serverName && !serverDropdownOpen && (
                          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm text-primary font-medium truncate">{connectionSettings.serverName}</span>
                            <button
                              onClick={() => setConnectionSettings({ ...connectionSettings, serverName: "", serverSearch: "" })}
                              className="ml-auto text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Dropdown results */}
                        {serverDropdownOpen && (
                          <div className="mt-1 rounded-lg border border-border bg-card shadow-xl max-h-56 overflow-y-auto">
                            {filteredFirms.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-muted-foreground">No results</div>
                            ) : (
                              filteredFirms.map(broker => (
                                <div key={broker.firm}>
                                  <div className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {broker.firm}
                                  </div>
                                  {broker.servers.map(server => (
                                    <button
                                      key={server}
                                      onClick={() => {
                                        setConnectionSettings({ ...connectionSettings, serverName: server, serverSearch: server })
                                        setServerDropdownOpen(false)
                                      }}
                                      className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center justify-between ${
                                        connectionSettings.serverName === server ? "text-primary" : "text-foreground"
                                      }`}
                                    >
                                      {server}
                                      {connectionSettings.serverName === server && <Check className="w-3.5 h-3.5 text-primary" />}
                                    </button>
                                  ))}
                                </div>
                              ))
                            )}
                            {/* Custom server option */}
                            {connectionSettings.serverSearch && (
                              <button
                                onClick={() => {
                                  setConnectionSettings({ ...connectionSettings, serverName: connectionSettings.serverSearch })
                                  setServerDropdownOpen(false)
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-primary border-t border-border hover:bg-secondary transition-colors flex items-center gap-2"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Use &quot;{connectionSettings.serverSearch}&quot; as custom server
                              </button>
                            )}
                          </div>
                        )}

                        {/* Dismiss dropdown when clicking outside */}
                        {serverDropdownOpen && (
                          <div className="fixed inset-0 z-[-1]" onClick={() => setServerDropdownOpen(false)} />
                        )}
                      </div>
                    )}

                    {/* Step 3 — Credentials */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        {needsServer ? "3." : "2."} Enter Credentials
                      </label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={connectionSettings.accountId}
                          onChange={(e) => setConnectionSettings({ ...connectionSettings, accountId: e.target.value })}
                          placeholder="Login ID"
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="password"
                          value={connectionSettings.password}
                          onChange={(e) => setConnectionSettings({ ...connectionSettings, password: e.target.value })}
                          placeholder="Password"
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                        <div>
                          <input
                            type="password"
                            value={connectionSettings.investorPassword}
                            onChange={(e) => setConnectionSettings({ ...connectionSettings, investorPassword: e.target.value })}
                            placeholder="Investor Password (optional, read-only)"
                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            We cannot execute trades with read-only access
                          </p>
                        </div>
                      </div>
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
                )
              })()}

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
