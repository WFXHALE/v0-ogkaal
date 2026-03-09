"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { TradingCalculators } from "@/components/trading-calculators"
import { MarketFundamentals } from "@/components/market-fundamentals"
import { useState, useEffect } from "react"
import { 
  TrendingUp, TrendingDown, Plus, X, LogOut, User, 
  Target, Shield, BarChart3, Calendar, DollarSign,
  ArrowUp, ArrowDown, Minus, Edit2, Trash2, Save
} from "lucide-react"

// Types
interface UserData {
  fullName: string
  email: string
  telegramUsername: string
}

interface FundedAccount {
  id: string
  propFirm: string
  customPropFirm?: string
  accountSize: string
  accountType: string
  platform: string
  maxDailyLoss: number
  maxOverallLoss: number
}

interface Trade {
  id: string
  date: string
  pair: string
  direction: "buy" | "sell"
  entryPrice: number
  stopLoss: number
  takeProfit: number
  result: "win" | "loss" | "breakeven"
  profitLoss: number
  notes: string
}

const PROP_FIRMS = [
  "FTMO",
  "FundedNext",
  "The5ers",
  "MyFundedFX",
  "E8 Funding",
  "True Forex Funds",
  "TopStep",
  "Lux Trading Firm",
  "Alpha Capital",
  "FundingPips",
  "Other"
]

const ACCOUNT_SIZES = ["$5,000", "$10,000", "$25,000", "$50,000", "$100,000", "$200,000"]
const ACCOUNT_TYPES = ["Instant Funding", "One-Step Challenge", "Two-Step Challenge"]
const PLATFORMS = ["MT4", "MT5", "cTrader"]

export default function FundedToolsPage() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  
  // Form states
  const [signUpForm, setSignUpForm] = useState({ fullName: "", email: "", password: "", telegramUsername: "" })
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  
  // Funded account state
  const [fundedAccount, setFundedAccount] = useState<FundedAccount | null>(null)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [accountForm, setAccountForm] = useState({
    propFirm: "",
    customPropFirm: "",
    accountSize: "",
    accountType: "",
    platform: "",
    maxDailyLoss: 5,
    maxOverallLoss: 10
  })
  
  // Trade journal state
  const [trades, setTrades] = useState<Trade[]>([])
  const [showTradeForm, setShowTradeForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [tradeForm, setTradeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: "",
    direction: "buy" as "buy" | "sell",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    result: "win" as "win" | "loss" | "breakeven",
    profitLoss: "",
    notes: ""
  })

  // Load data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("fundedTools_user")
    const storedAccount = localStorage.getItem("fundedTools_account")
    const storedTrades = localStorage.getItem("fundedTools_trades")
    
    if (storedUser) {
      setUserData(JSON.parse(storedUser))
      setIsLoggedIn(true)
    }
    if (storedAccount) {
      setFundedAccount(JSON.parse(storedAccount))
    }
    if (storedTrades) {
      setTrades(JSON.parse(storedTrades))
    }
  }, [])

  // Save trades to localStorage
  useEffect(() => {
    if (trades.length > 0) {
      localStorage.setItem("fundedTools_trades", JSON.stringify(trades))
    }
  }, [trades])

  // Auth handlers
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    const user: UserData = {
      fullName: signUpForm.fullName,
      email: signUpForm.email,
      telegramUsername: signUpForm.telegramUsername
    }
    localStorage.setItem("fundedTools_user", JSON.stringify(user))
    localStorage.setItem("fundedTools_password", signUpForm.password)
    setUserData(user)
    setIsLoggedIn(true)
    setSignUpForm({ fullName: "", email: "", password: "", telegramUsername: "" })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const storedUser = localStorage.getItem("fundedTools_user")
    const storedPassword = localStorage.getItem("fundedTools_password")
    
    if (storedUser && storedPassword === loginForm.password) {
      const user = JSON.parse(storedUser)
      if (user.email === loginForm.email) {
        setUserData(user)
        setIsLoggedIn(true)
        setLoginForm({ email: "", password: "" })
        return
      }
    }
    alert("Invalid email or password")
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
  }

  // Account handlers
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault()
    const account: FundedAccount = {
      id: Date.now().toString(),
      propFirm: accountForm.propFirm,
      customPropFirm: accountForm.customPropFirm,
      accountSize: accountForm.accountSize,
      accountType: accountForm.accountType,
      platform: accountForm.platform,
      maxDailyLoss: accountForm.maxDailyLoss,
      maxOverallLoss: accountForm.maxOverallLoss
    }
    localStorage.setItem("fundedTools_account", JSON.stringify(account))
    setFundedAccount(account)
    setShowAccountForm(false)
  }

  // Trade handlers
  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault()
    const newTrade: Trade = {
      id: editingTrade?.id || Date.now().toString(),
      date: tradeForm.date,
      pair: tradeForm.pair.toUpperCase(),
      direction: tradeForm.direction,
      entryPrice: parseFloat(tradeForm.entryPrice),
      stopLoss: parseFloat(tradeForm.stopLoss),
      takeProfit: parseFloat(tradeForm.takeProfit),
      result: tradeForm.result,
      profitLoss: parseFloat(tradeForm.profitLoss),
      notes: tradeForm.notes
    }
    
    if (editingTrade) {
      setTrades(trades.map(t => t.id === editingTrade.id ? newTrade : t))
    } else {
      setTrades([newTrade, ...trades])
    }
    
    resetTradeForm()
  }

  const resetTradeForm = () => {
    setTradeForm({
      date: new Date().toISOString().split('T')[0],
      pair: "",
      direction: "buy",
      entryPrice: "",
      stopLoss: "",
      takeProfit: "",
      result: "win",
      profitLoss: "",
      notes: ""
    })
    setShowTradeForm(false)
    setEditingTrade(null)
  }

  const handleEditTrade = (trade: Trade) => {
    setTradeForm({
      date: trade.date,
      pair: trade.pair,
      direction: trade.direction,
      entryPrice: trade.entryPrice.toString(),
      stopLoss: trade.stopLoss.toString(),
      takeProfit: trade.takeProfit.toString(),
      result: trade.result,
      profitLoss: trade.profitLoss.toString(),
      notes: trade.notes
    })
    setEditingTrade(trade)
    setShowTradeForm(true)
  }

  const handleDeleteTrade = (id: string) => {
    if (confirm("Are you sure you want to delete this trade?")) {
      const updatedTrades = trades.filter(t => t.id !== id)
      setTrades(updatedTrades)
      localStorage.setItem("fundedTools_trades", JSON.stringify(updatedTrades))
    }
  }

  // Calculate stats
  const totalTrades = trades.length
  const winTrades = trades.filter(t => t.result === "win").length
  const lossTrades = trades.filter(t => t.result === "loss").length
  const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : "0"
  const totalProfitLoss = trades.reduce((sum, t) => sum + t.profitLoss, 0)
  const avgRisk = trades.length > 0 
    ? (trades.reduce((sum, t) => sum + Math.abs(t.profitLoss), 0) / trades.length).toFixed(2)
    : "0"

  // Daily P&L for consistency tracking
  const todaysTrades = trades.filter(t => t.date === new Date().toISOString().split('T')[0])
  const todaysPL = todaysTrades.reduce((sum, t) => sum + t.profitLoss, 0)
  const dailyLossPercent = fundedAccount ? (Math.abs(Math.min(0, todaysPL)) / parseFloat(fundedAccount.accountSize.replace(/[$,]/g, '')) * 100) : 0
  const overallLossPercent = fundedAccount ? (Math.abs(Math.min(0, totalProfitLoss)) / parseFloat(fundedAccount.accountSize.replace(/[$,]/g, '')) * 100) : 0

  // Auth screens
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-md mx-auto">
            {/* Introduction */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Funded Tools</h1>
              <p className="text-muted-foreground">
                Designed to help traders manage risk, maintain consistency rules, and track trading performance for funded prop firm accounts.
              </p>
            </div>

            {/* Auth Card */}
            <div className="bg-card rounded-2xl border border-border p-6">
              {showSignUp ? (
                <>
                  <h2 className="text-xl font-bold text-foreground mb-6">Create Account</h2>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={signUpForm.fullName}
                        onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                      <input
                        type="password"
                        required
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Create a password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Telegram Username</label>
                      <input
                        type="text"
                        required
                        value={signUpForm.telegramUsername}
                        onChange={(e) => setSignUpForm({ ...signUpForm, telegramUsername: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="@username"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3">
                      Sign Up
                    </Button>
                  </form>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{" "}
                    <button onClick={() => setShowSignUp(false)} className="text-primary hover:underline">
                      Login
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-foreground mb-6">Login</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                      <input
                        type="password"
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter your password"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3">
                      Login
                    </Button>
                  </form>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {"Don't have an account? "}
                    <button onClick={() => setShowSignUp(true)} className="text-primary hover:underline">
                      Sign Up
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Funded Tools Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {userData?.fullName}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{userData?.email}</span>
              </div>
              <Button onClick={handleLogout} variant="outline" className="border-border">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Account Setup */}
          {!fundedAccount && !showAccountForm ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center mb-8">
              <Target className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Set Up Your Funded Account</h2>
              <p className="text-muted-foreground mb-6">Add your funded account details to start tracking your performance</p>
              <Button onClick={() => setShowAccountForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Funded Account
              </Button>
            </div>
          ) : showAccountForm ? (
            <div className="bg-card rounded-2xl border border-border p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Funded Account Details</h2>
                <button onClick={() => setShowAccountForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Prop Firm</label>
                  <select
                    required
                    value={accountForm.propFirm}
                    onChange={(e) => setAccountForm({ ...accountForm, propFirm: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Prop Firm</option>
                    {PROP_FIRMS.map(firm => (
                      <option key={firm} value={firm}>{firm}</option>
                    ))}
                  </select>
                </div>
                {accountForm.propFirm === "Other" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Prop Firm Name</label>
                    <input
                      type="text"
                      required
                      value={accountForm.customPropFirm}
                      onChange={(e) => setAccountForm({ ...accountForm, customPropFirm: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter prop firm name"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Account Size</label>
                  <select
                    required
                    value={accountForm.accountSize}
                    onChange={(e) => setAccountForm({ ...accountForm, accountSize: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Size</option>
                    {ACCOUNT_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Account Type</label>
                  <select
                    required
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Type</option>
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Platform</label>
                  <select
                    required
                    value={accountForm.platform}
                    onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Platform</option>
                    {PLATFORMS.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Max Daily Loss (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={accountForm.maxDailyLoss}
                    onChange={(e) => setAccountForm({ ...accountForm, maxDailyLoss: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Max Overall Loss (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={accountForm.maxOverallLoss}
                    onChange={(e) => setAccountForm({ ...accountForm, maxOverallLoss: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3">
                    <Save className="w-4 h-4 mr-2" />
                    Save Account
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Account Info Bar */}
          {fundedAccount && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="px-4 py-2 rounded-lg bg-primary/10">
                    <span className="text-sm text-muted-foreground">Prop Firm</span>
                    <p className="font-bold text-foreground">{fundedAccount.propFirm === "Other" ? fundedAccount.customPropFirm : fundedAccount.propFirm}</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Account Size</span>
                    <p className="font-bold text-foreground">{fundedAccount.accountSize}</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <p className="font-bold text-foreground">{fundedAccount.accountType}</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Platform</span>
                    <p className="font-bold text-foreground">{fundedAccount.platform}</p>
                  </div>
                </div>
                <Button onClick={() => setShowAccountForm(true)} variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Account
                </Button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-sm text-muted-foreground">Total Trades</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalTrades}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-sm text-muted-foreground">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{winRate}%</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalProfitLoss >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <DollarSign className={`w-5 h-5 ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <span className="text-sm text-muted-foreground">Total P&L</span>
              </div>
              <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Avg Risk</span>
              </div>
              <p className="text-2xl font-bold text-foreground">${avgRisk}</p>
            </div>
          </div>

          {/* Trading Calculators */}
          <TradingCalculators />

          {/* Market Fundamentals & Economic Calendar */}
          <MarketFundamentals />

          {/* Consistency Tracker */}
          {fundedAccount && (
            <div className="bg-card rounded-2xl border border-border p-6 mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Consistency Rule Tracker
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Daily Loss</span>
                    <span className={`text-sm font-medium ${dailyLossPercent > fundedAccount.maxDailyLoss ? 'text-red-500' : 'text-green-500'}`}>
                      {dailyLossPercent.toFixed(2)}% / {fundedAccount.maxDailyLoss}%
                    </span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${dailyLossPercent > fundedAccount.maxDailyLoss ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min((dailyLossPercent / fundedAccount.maxDailyLoss) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Maximum daily loss limit</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Loss</span>
                    <span className={`text-sm font-medium ${overallLossPercent > fundedAccount.maxOverallLoss ? 'text-red-500' : 'text-green-500'}`}>
                      {overallLossPercent.toFixed(2)}% / {fundedAccount.maxOverallLoss}%
                    </span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${overallLossPercent > fundedAccount.maxOverallLoss ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min((overallLossPercent / fundedAccount.maxOverallLoss) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Maximum overall loss limit</p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Chart */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Performance Overview
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-green-500/10">
                <p className="text-3xl font-bold text-green-500">{winTrades}</p>
                <p className="text-sm text-muted-foreground">Wins</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-500/10">
                <p className="text-3xl font-bold text-red-500">{lossTrades}</p>
                <p className="text-sm text-muted-foreground">Losses</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary">
                <p className="text-3xl font-bold text-muted-foreground">{trades.filter(t => t.result === "breakeven").length}</p>
                <p className="text-sm text-muted-foreground">Breakeven</p>
              </div>
            </div>
            {/* Simple bar visualization */}
            {totalTrades > 0 && (
              <div className="h-8 bg-secondary rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(winTrades / totalTrades) * 100}%` }}
                />
                <div 
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(lossTrades / totalTrades) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Trade Journal */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Trade Journal
              </h2>
              <Button onClick={() => setShowTradeForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Trade
              </Button>
            </div>

            {/* Trade Form Modal */}
            {showTradeForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80" onClick={resetTradeForm} />
                <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground">{editingTrade ? 'Edit Trade' : 'Add New Trade'}</h3>
                    <button onClick={resetTradeForm} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddTrade} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                        <input
                          type="date"
                          required
                          value={tradeForm.date}
                          onChange={(e) => setTradeForm({ ...tradeForm, date: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Pair / Instrument</label>
                        <input
                          type="text"
                          required
                          value={tradeForm.pair}
                          onChange={(e) => setTradeForm({ ...tradeForm, pair: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="EURUSD"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Direction</label>
                      <div className="flex gap-4">
                        <label className="flex-1">
                          <input
                            type="radio"
                            name="direction"
                            value="buy"
                            checked={tradeForm.direction === "buy"}
                            onChange={() => setTradeForm({ ...tradeForm, direction: "buy" })}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${tradeForm.direction === "buy" ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-secondary border-border text-muted-foreground'}`}>
                            <ArrowUp className="w-5 h-5 mx-auto mb-1" />
                            Buy
                          </div>
                        </label>
                        <label className="flex-1">
                          <input
                            type="radio"
                            name="direction"
                            value="sell"
                            checked={tradeForm.direction === "sell"}
                            onChange={() => setTradeForm({ ...tradeForm, direction: "sell" })}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${tradeForm.direction === "sell" ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-secondary border-border text-muted-foreground'}`}>
                            <ArrowDown className="w-5 h-5 mx-auto mb-1" />
                            Sell
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Entry Price</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={tradeForm.entryPrice}
                          onChange={(e) => setTradeForm({ ...tradeForm, entryPrice: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="1.0850"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Stop Loss</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={tradeForm.stopLoss}
                          onChange={(e) => setTradeForm({ ...tradeForm, stopLoss: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="1.0800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Take Profit</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={tradeForm.takeProfit}
                          onChange={(e) => setTradeForm({ ...tradeForm, takeProfit: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="1.0950"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Result</label>
                      <div className="flex gap-3">
                        {(["win", "loss", "breakeven"] as const).map((result) => (
                          <label key={result} className="flex-1">
                            <input
                              type="radio"
                              name="result"
                              value={result}
                              checked={tradeForm.result === result}
                              onChange={() => setTradeForm({ ...tradeForm, result })}
                              className="sr-only"
                            />
                            <div className={`p-3 rounded-lg border text-center cursor-pointer transition-colors capitalize ${
                              tradeForm.result === result 
                                ? result === 'win' ? 'bg-green-500/20 border-green-500 text-green-500'
                                : result === 'loss' ? 'bg-red-500/20 border-red-500 text-red-500'
                                : 'bg-primary/20 border-primary text-primary'
                                : 'bg-secondary border-border text-muted-foreground'
                            }`}>
                              {result === 'win' && <TrendingUp className="w-5 h-5 mx-auto mb-1" />}
                              {result === 'loss' && <TrendingDown className="w-5 h-5 mx-auto mb-1" />}
                              {result === 'breakeven' && <Minus className="w-5 h-5 mx-auto mb-1" />}
                              {result}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Profit/Loss Amount ($)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={tradeForm.profitLoss}
                        onChange={(e) => setTradeForm({ ...tradeForm, profitLoss: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="150.00 or -75.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Notes / Trade Reasoning</label>
                      <textarea
                        value={tradeForm.notes}
                        onChange={(e) => setTradeForm({ ...tradeForm, notes: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={3}
                        placeholder="Add your trade analysis notes..."
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3">
                      {editingTrade ? 'Update Trade' : 'Add Trade'}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Trades Table */}
            {trades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No trades recorded yet. Add your first trade to start tracking.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Pair</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Direction</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Entry</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">SL</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">TP</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Result</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">P&L</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-2 text-sm text-foreground">{trade.date}</td>
                        <td className="py-3 px-2 text-sm font-medium text-foreground">{trade.pair}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${trade.direction === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {trade.direction === 'buy' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {trade.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-foreground">{trade.entryPrice}</td>
                        <td className="py-3 px-2 text-sm text-foreground">{trade.stopLoss}</td>
                        <td className="py-3 px-2 text-sm text-foreground">{trade.takeProfit}</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                            trade.result === 'win' ? 'bg-green-500/20 text-green-500'
                            : trade.result === 'loss' ? 'bg-red-500/20 text-red-500'
                            : 'bg-secondary text-muted-foreground'
                          }`}>
                            {trade.result}
                          </span>
                        </td>
                        <td className={`py-3 px-2 text-sm font-medium ${trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.profitLoss >= 0 ? '+' : ''}{trade.profitLoss.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditTrade(trade)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTrade(trade.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
