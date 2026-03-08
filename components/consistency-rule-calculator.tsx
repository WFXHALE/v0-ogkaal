"use client"

import { useState, useEffect } from "react"
import { Calculator, AlertTriangle, CheckCircle, XCircle, TrendingUp, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

const CONSISTENCY_OPTIONS = ["10%", "15%", "20%", "25%", "30%", "35%", "40%", "50%"]

interface DailyProfit {
  day: number
  profit: number
  isBreached: boolean
}

export function ConsistencyRuleCalculator() {
  const [accountSize, setAccountSize] = useState<number>(10000)
  const [profitTarget, setProfitTarget] = useState<number>(10)
  const [consistencyRule, setConsistencyRule] = useState<number>(20)
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(5)
  const [maxOverallDrawdown, setMaxOverallDrawdown] = useState<number>(10)
  const [minTradingDays, setMinTradingDays] = useState<number>(5)
  const [weekendHolding, setWeekendHolding] = useState<"allowed" | "not_allowed">("not_allowed")
  
  const [dailyProfits, setDailyProfits] = useState<DailyProfit[]>(
    Array.from({ length: 10 }, (_, i) => ({ day: i + 1, profit: 0, isBreached: false }))
  )
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculations
  const totalProfitTarget = accountSize * (profitTarget / 100)
  const maxDailyProfitAllowed = totalProfitTarget * (consistencyRule / 100)
  const maxDailyLossAmount = accountSize * (maxDailyLoss / 100)
  const maxOverallDrawdownAmount = accountSize * (maxOverallDrawdown / 100)
  
  // Check daily profits against consistency rule
  const updatedDailyProfits = dailyProfits.map(day => ({
    ...day,
    isBreached: day.profit > maxDailyProfitAllowed
  }))
  
  const totalProfit = dailyProfits.reduce((sum, day) => sum + day.profit, 0)
  const activeTradingDays = dailyProfits.filter(day => day.profit !== 0).length
  const hasConsistencyBreach = updatedDailyProfits.some(day => day.isBreached)
  const hasMinDaysReached = activeTradingDays >= minTradingDays
  const targetReached = totalProfit >= totalProfitTarget
  
  // Overall status
  const getOverallStatus = () => {
    if (hasConsistencyBreach) return { status: "BREACH", color: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" }
    if (!hasMinDaysReached && targetReached) return { status: "WARNING", color: "text-yellow-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" }
    if (targetReached && hasMinDaysReached && !hasConsistencyBreach) return { status: "PASS", color: "text-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" }
    return { status: "IN PROGRESS", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30" }
  }
  
  const overallStatus = getOverallStatus()
  
  const handleDailyProfitChange = (dayIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0
    setDailyProfits(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, profit: numValue } : day
    ))
  }
  
  const resetSimulation = () => {
    setDailyProfits(Array.from({ length: 10 }, (_, i) => ({ day: i + 1, profit: 0, isBreached: false })))
  }

  if (!mounted) return null

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Consistency Rule Calculator</h3>
            <p className="text-sm text-muted-foreground">Calculate and simulate prop firm consistency rules</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full ${overallStatus.bgColor} ${overallStatus.borderColor} border`}>
          <span className={`font-bold ${overallStatus.color}`}>{overallStatus.status}</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Account Size */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Account Size ($)</label>
          <input
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        
        {/* Profit Target */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Profit Target (%)</label>
          <input
            type="number"
            value={profitTarget}
            onChange={(e) => setProfitTarget(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        
        {/* Consistency Rule */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Consistency Rule (%)</label>
          <select
            value={`${consistencyRule}%`}
            onChange={(e) => setConsistencyRule(parseFloat(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary"
          >
            {CONSISTENCY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        
        {/* Min Trading Days */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Minimum Trading Days</label>
          <input
            type="number"
            value={minTradingDays}
            onChange={(e) => setMinTradingDays(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Additional Rules */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Max Daily Loss (%)</label>
          <input
            type="number"
            value={maxDailyLoss}
            onChange={(e) => setMaxDailyLoss(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Max Overall Drawdown (%)</label>
          <input
            type="number"
            value={maxOverallDrawdown}
            onChange={(e) => setMaxOverallDrawdown(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Weekend Holding</label>
          <select
            value={weekendHolding}
            onChange={(e) => setWeekendHolding(e.target.value as "allowed" | "not_allowed")}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary"
          >
            <option value="allowed">Allowed</option>
            <option value="not_allowed">Not Allowed</option>
          </select>
        </div>
      </div>

      {/* Calculated Results */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm text-muted-foreground mb-1">Total Profit Target</p>
          <p className="text-2xl font-bold text-primary">${totalProfitTarget.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary border border-border">
          <p className="text-sm text-muted-foreground mb-1">Max Daily Profit Allowed</p>
          <p className="text-2xl font-bold text-foreground">${maxDailyProfitAllowed.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-muted-foreground mb-1">Max Daily Loss</p>
          <p className="text-2xl font-bold text-red-500">${maxDailyLossAmount.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-muted-foreground mb-1">Max Overall Drawdown</p>
          <p className="text-2xl font-bold text-red-500">${maxOverallDrawdownAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Daily Profit Simulation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Daily Profit Simulation
          </h4>
          <Button variant="outline" size="sm" onClick={resetSimulation}>
            Reset
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {updatedDailyProfits.map((day, index) => (
            <div key={day.day} className={`p-3 rounded-lg border ${day.isBreached ? 'bg-red-500/10 border-red-500/50' : 'bg-secondary border-border'}`}>
              <label className="block text-xs text-muted-foreground mb-1">Day {day.day}</label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">$</span>
                <input
                  type="number"
                  value={day.profit || ""}
                  onChange={(e) => handleDailyProfitChange(index, e.target.value)}
                  placeholder="0"
                  className={`w-full bg-transparent border-none text-foreground focus:outline-none font-medium ${day.isBreached ? 'text-red-500' : ''}`}
                />
              </div>
              {day.isBreached && (
                <p className="text-xs text-red-500 mt-1">Exceeds limit!</p>
              )}
            </div>
          ))}
        </div>
        
        {hasConsistencyBreach && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-500 font-medium">Consistency rule breach risk detected. One or more days exceed the maximum allowed daily profit.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-secondary border border-border">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Rule Check Summary
        </h4>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            {totalProfit >= totalProfitTarget ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Profit Target</p>
              <p className="font-medium text-foreground">${totalProfit.toFixed(2)} / ${totalProfitTarget}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!hasConsistencyBreach ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Consistency Rule</p>
              <p className={`font-medium ${hasConsistencyBreach ? 'text-red-500' : 'text-foreground'}`}>
                {hasConsistencyBreach ? 'Breached' : 'Respected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasMinDaysReached ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-yellow-500" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Min Trading Days</p>
              <p className="font-medium text-foreground">{activeTradingDays} / {minTradingDays}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-medium text-foreground">{((totalProfit / totalProfitTarget) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
