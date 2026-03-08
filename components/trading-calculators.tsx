"use client"

import { useState } from "react"
import { 
  Calculator, TrendingUp, TrendingDown, Target, Shield, 
  Clock, Percent, AlertTriangle, DollarSign, BarChart3,
  Zap, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"

type RiskMode = "low" | "medium" | "high"

interface CalculatorCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function CalculatorCard({ title, icon, children }: CalculatorCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function BreachWarning({ message }: { message: string }) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </div>
  )
}

export function TradingCalculators() {
  // PIP Calculator
  const [pipCalc, setPipCalc] = useState({
    instrument: "forex",
    pair: "EURUSD",
    entryPrice: "",
    exitPrice: "",
    lotSize: ""
  })
  const [pipResult, setPipResult] = useState<{ pips: number; profitLoss: number } | null>(null)

  // Loss Calculator
  const [lossCalc, setLossCalc] = useState({
    accountSize: "",
    riskPercent: "",
    stopLossPips: ""
  })
  const [lossResult, setLossResult] = useState<number | null>(null)
  const [lossWarning, setLossWarning] = useState("")

  // Target Calculator
  const [targetCalc, setTargetCalc] = useState({
    accountSize: "",
    targetPercent: ""
  })
  const [targetResult, setTargetResult] = useState<number | null>(null)

  // Percentage Calculator
  const [percentCalc, setPercentCalc] = useState({
    profitAmount: "",
    accountSize: ""
  })
  const [percentResult, setPercentResult] = useState<number | null>(null)

  // Challenge Pass Time Calculator
  const [challengeCalc, setChallengeCalc] = useState({
    accountSize: "",
    targetPercent: "",
    dailyProfit: ""
  })
  const [challengeResult, setChallengeResult] = useState<number | null>(null)
  const [challengeWarning, setChallengeWarning] = useState("")

  // Compounding Calculator
  const [compoundCalc, setCompoundCalc] = useState({
    startingBalance: "",
    riskPerTrade: "",
    dailyProfitGoal: ""
  })
  const [compoundResult, setCompoundResult] = useState<{ days: number; finalBalance: number }[] | null>(null)

  // Risk Mode
  const [riskMode, setRiskMode] = useState<RiskMode>("low")

  // PIP Calculator Logic
  const calculatePips = () => {
    const entry = parseFloat(pipCalc.entryPrice)
    const exit = parseFloat(pipCalc.exitPrice)
    const lots = parseFloat(pipCalc.lotSize)
    
    if (isNaN(entry) || isNaN(exit) || isNaN(lots)) return

    let pipValue = 0
    let pips = 0
    
    if (pipCalc.instrument === "forex") {
      // Standard forex pairs (4 decimal places)
      pips = (exit - entry) * 10000
      pipValue = lots * 10 // Standard lot = $10 per pip
    } else if (pipCalc.instrument === "gold") {
      // Gold (XAUUSD) - 1 pip = $0.01
      pips = (exit - entry) * 10
      pipValue = lots * 1 // Per pip for gold with 0.01 lot = $0.10
    } else if (pipCalc.instrument === "indices") {
      // Indices - 1 point = $1
      pips = exit - entry
      pipValue = lots * 1
    }
    
    const profitLoss = pips * pipValue * (lots / 1)
    setPipResult({ pips: Math.round(pips * 10) / 10, profitLoss: Math.round(profitLoss * 100) / 100 })
  }

  // Loss Calculator Logic
  const calculateLoss = () => {
    const account = parseFloat(lossCalc.accountSize)
    const risk = parseFloat(lossCalc.riskPercent)
    const slPips = parseFloat(lossCalc.stopLossPips)
    
    if (isNaN(account) || isNaN(risk) || isNaN(slPips)) return

    const maxLoss = (account * risk) / 100
    setLossResult(maxLoss)

    // Breach warning
    if (risk > 5) {
      setLossWarning("This trade setup may breach daily drawdown rules. Most prop firms limit daily loss to 5%.")
    } else if (risk > 2) {
      setLossWarning("Higher risk detected. Consider reducing position size for better risk management.")
    } else {
      setLossWarning("")
    }
  }

  // Target Calculator Logic
  const calculateTarget = () => {
    const account = parseFloat(targetCalc.accountSize)
    const target = parseFloat(targetCalc.targetPercent)
    
    if (isNaN(account) || isNaN(target)) return

    setTargetResult((account * target) / 100)
  }

  // Percentage Calculator Logic
  const calculatePercentage = () => {
    const profit = parseFloat(percentCalc.profitAmount)
    const account = parseFloat(percentCalc.accountSize)
    
    if (isNaN(profit) || isNaN(account) || account === 0) return

    setPercentResult((profit / account) * 100)
  }

  // Challenge Pass Time Calculator Logic
  const calculateChallengeTime = () => {
    const account = parseFloat(challengeCalc.accountSize)
    const target = parseFloat(challengeCalc.targetPercent)
    const daily = parseFloat(challengeCalc.dailyProfit)
    
    if (isNaN(account) || isNaN(target) || isNaN(daily) || daily === 0) return

    const targetAmount = (account * target) / 100
    const days = Math.ceil(targetAmount / daily)
    setChallengeResult(days)

    // Warning for inconsistent profits
    const dailyPercent = (daily / account) * 100
    if (dailyPercent > 2) {
      setChallengeWarning("If daily profits are inconsistent, the prop firm consistency rule may fail. Consider more conservative targets.")
    } else {
      setChallengeWarning("")
    }
  }

  // Compounding Calculator Logic
  const calculateCompounding = () => {
    const starting = parseFloat(compoundCalc.startingBalance)
    const riskPer = parseFloat(compoundCalc.riskPerTrade)
    const dailyGoal = parseFloat(compoundCalc.dailyProfitGoal)
    
    if (isNaN(starting) || isNaN(riskPer) || isNaN(dailyGoal)) return

    const results: { days: number; finalBalance: number }[] = []
    let balance = starting
    
    for (let day = 1; day <= 30; day++) {
      const dailyGain = (balance * dailyGoal) / 100
      balance += dailyGain
      if (day === 7 || day === 14 || day === 21 || day === 30) {
        results.push({ days: day, finalBalance: Math.round(balance * 100) / 100 })
      }
    }
    
    setCompoundResult(results)
  }

  // Risk Mode descriptions
  const riskModeInfo = {
    low: {
      label: "Low Risk",
      description: "Consistent trading (around 10 days to pass challenge)",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30"
    },
    medium: {
      label: "Medium Risk",
      description: "Moderate risk (around 5 days to pass)",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30"
    },
    high: {
      label: "High Risk",
      description: "Aggressive trading (possible 1-day pass but high breach risk)",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30"
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Trading Calculators</h2>
          <p className="text-sm text-muted-foreground">Essential tools for risk management and planning</p>
        </div>
      </div>

      {/* Risk Mode Selector */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Risk Mode Selector</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["low", "medium", "high"] as RiskMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setRiskMode(mode)}
              className={`p-4 rounded-lg border-2 transition-all ${
                riskMode === mode 
                  ? `${riskModeInfo[mode].bgColor} ${riskModeInfo[mode].borderColor}` 
                  : "bg-secondary border-border hover:border-primary/30"
              }`}
            >
              <p className={`font-bold mb-1 ${riskMode === mode ? riskModeInfo[mode].color : "text-foreground"}`}>
                {riskModeInfo[mode].label}
              </p>
              <p className="text-xs text-muted-foreground">{riskModeInfo[mode].description}</p>
            </button>
          ))}
        </div>
        {riskMode === "high" && (
          <BreachWarning message="High risk mode selected. This strategy may result in account breach if trades go against you. Use with extreme caution." />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* PIP Calculator */}
        <CalculatorCard title="PIP Calculator" icon={<TrendingUp className="w-5 h-5 text-primary" />}>
          <div className="space-y-3">
            <select
              value={pipCalc.instrument}
              onChange={(e) => setPipCalc({ ...pipCalc, instrument: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="forex">Forex</option>
              <option value="gold">Gold (XAUUSD)</option>
              <option value="indices">Indices</option>
            </select>
            <input
              type="text"
              placeholder="Entry Price"
              value={pipCalc.entryPrice}
              onChange={(e) => setPipCalc({ ...pipCalc, entryPrice: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Exit Price"
              value={pipCalc.exitPrice}
              onChange={(e) => setPipCalc({ ...pipCalc, exitPrice: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Lot Size"
              value={pipCalc.lotSize}
              onChange={(e) => setPipCalc({ ...pipCalc, lotSize: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={calculatePips} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              Calculate
            </Button>
            {pipResult && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">Total Pips</p>
                <p className={`text-xl font-bold ${pipResult.pips >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {pipResult.pips >= 0 ? "+" : ""}{pipResult.pips} pips
                </p>
                <p className="text-sm text-muted-foreground mt-1">Profit/Loss</p>
                <p className={`text-lg font-bold ${pipResult.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${pipResult.profitLoss >= 0 ? "+" : ""}{pipResult.profitLoss.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </CalculatorCard>

        {/* Loss Calculator */}
        <CalculatorCard title="Loss Calculator" icon={<Shield className="w-5 h-5 text-primary" />}>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Account Size ($)"
              value={lossCalc.accountSize}
              onChange={(e) => setLossCalc({ ...lossCalc, accountSize: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Risk Percentage (%)"
              value={lossCalc.riskPercent}
              onChange={(e) => setLossCalc({ ...lossCalc, riskPercent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Stop Loss (pips)"
              value={lossCalc.stopLossPips}
              onChange={(e) => setLossCalc({ ...lossCalc, stopLossPips: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={calculateLoss} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              Calculate
            </Button>
            {lossResult !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">Maximum Loss Amount</p>
                <p className="text-xl font-bold text-red-500">${lossResult.toFixed(2)}</p>
              </div>
            )}
            {lossWarning && <BreachWarning message={lossWarning} />}
          </div>
        </CalculatorCard>

        {/* Target Calculator */}
        <CalculatorCard title="Target Calculator" icon={<Target className="w-5 h-5 text-primary" />}>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Account Size ($)"
              value={targetCalc.accountSize}
              onChange={(e) => setTargetCalc({ ...targetCalc, accountSize: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Profit Target (%)"
              value={targetCalc.targetPercent}
              onChange={(e) => setTargetCalc({ ...targetCalc, targetPercent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={calculateTarget} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              Calculate
            </Button>
            {targetResult !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">Target Profit</p>
                <p className="text-xl font-bold text-green-500">${targetResult.toFixed(2)}</p>
              </div>
            )}
          </div>
        </CalculatorCard>

        {/* Percentage Calculator */}
        <CalculatorCard title="Percentage Calculator" icon={<Percent className="w-5 h-5 text-primary" />}>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Profit Amount ($)"
              value={percentCalc.profitAmount}
              onChange={(e) => setPercentCalc({ ...percentCalc, profitAmount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Account Size ($)"
              value={percentCalc.accountSize}
              onChange={(e) => setPercentCalc({ ...percentCalc, accountSize: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={calculatePercentage} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              Calculate
            </Button>
            {percentResult !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">Profit Percentage</p>
                <p className={`text-xl font-bold ${percentResult >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {percentResult.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </CalculatorCard>

        {/* Challenge Pass Time Calculator */}
        <CalculatorCard title="Challenge Pass Time" icon={<Clock className="w-5 h-5 text-primary" />}>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Account Size ($)"
              value={challengeCalc.accountSize}
              onChange={(e) => setChallengeCalc({ ...challengeCalc, accountSize: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Target Percentage (%)"
              value={challengeCalc.targetPercent}
              onChange={(e) => setChallengeCalc({ ...challengeCalc, targetPercent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Daily Profit Goal ($)"
              value={challengeCalc.dailyProfit}
              onChange={(e) => setChallengeCalc({ ...challengeCalc, dailyProfit: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={calculateChallengeTime} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              Calculate
            </Button>
            {challengeResult !== null && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">Estimated Days to Pass</p>
                <p className="text-xl font-bold text-primary">{challengeResult} days</p>
              </div>
            )}
            {challengeWarning && <BreachWarning message={challengeWarning} />}
          </div>
        </CalculatorCard>

        {/* Compounding Calculator */}
        <CalculatorCard title="Compounding Calculator" icon={<BarChart3 className="w-5 h-5 text-primary" />}>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Starting Balance ($)"
              value={compoundCalc.startingBalance}
              onChange={(e) => setCompoundCalc({ ...compoundCalc, startingBalance: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Risk Per Trade (%)"
              value={compoundCalc.riskPerTrade}
              onChange={(e) => setCompoundCalc({ ...compoundCalc, riskPerTrade: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Daily Profit Goal (%)"
              value={compoundCalc.dailyProfitGoal}
              onChange={(e) => setCompoundCalc({ ...compoundCalc, dailyProfitGoal: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={calculateCompounding} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              Calculate
            </Button>
            {compoundResult && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground mb-2">Growth Timeline</p>
                <div className="space-y-1">
                  {compoundResult.map((r) => (
                    <div key={r.days} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Day {r.days}:</span>
                      <span className="font-bold text-green-500">${r.finalBalance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CalculatorCard>
      </div>
    </div>
  )
}
