export type IndicatorCategory = "SMC" | "ICT" | "Liquidity" | "Sessions" | "Price Action" | "Tools"

export interface Indicator {
  id: string
  name: string
  category: IndicatorCategory
  description: string
  tradingview_link: string
}

export const INDICATORS: Indicator[] = [
  // ── SMC ───────────────────────────────────────────────────────────────────────
  {
    id: "smc-1",
    name: "SMC Smart Money Concepts",
    category: "SMC",
    description: "Identifies order blocks, break of structure (BOS), change of character (CHoCH), and fair value gaps directly on the chart. The go-to all-in-one SMC indicator.",
    tradingview_link: "https://www.tradingview.com/script/nFbF79oG-SMC-Smart-Money-Concepts/",
  },
  {
    id: "smc-2",
    name: "Order Block Detector",
    category: "SMC",
    description: "Automatically marks bullish and bearish order blocks on any timeframe. Highlights the most recent unmitigated OBs for precision entries.",
    tradingview_link: "https://www.tradingview.com/script/JtQNnxG4-Order-Blocks/",
  },
  {
    id: "smc-3",
    name: "Break of Structure & CHoCH",
    category: "SMC",
    description: "Labels every BOS and CHoCH swing on the chart in real time, allowing traders to track market structure shifts and trend reversals clearly.",
    tradingview_link: "https://www.tradingview.com/script/NmBQHhXq-BOS-CHoCH-Break-of-Structure-Change-of-Character/",
  },
  {
    id: "smc-4",
    name: "Fair Value Gap (FVG) Finder",
    category: "SMC",
    description: "Scans and highlights bullish and bearish fair value gaps. Tracks whether each FVG has been filled or remains open as a potential reaction zone.",
    tradingview_link: "https://www.tradingview.com/script/vE5RkFCp-Fair-Value-Gaps-FVG/",
  },
  {
    id: "smc-5",
    name: "Premium & Discount Zones",
    category: "SMC",
    description: "Draws the 50% equilibrium line with shaded premium (sell zone) and discount (buy zone) areas based on the current swing range.",
    tradingview_link: "https://www.tradingview.com/script/JjpVivtO-Premium-and-Discount-Zones/",
  },
  {
    id: "smc-6",
    name: "Supply & Demand Zones",
    category: "SMC",
    description: "Automatically detects and draws fresh supply and demand zones from significant price impulses. Updates dynamically as price mitigates each zone.",
    tradingview_link: "https://www.tradingview.com/script/4J1x5mDc-Supply-and-Demand-Zones/",
  },
  {
    id: "smc-7",
    name: "Multi-TF Market Structure",
    category: "SMC",
    description: "Pulls higher timeframe market structure onto your current chart, giving context for where you are in the larger trend without switching timeframes.",
    tradingview_link: "https://www.tradingview.com/script/bHLQkG5C-Multi-Timeframe-Market-Structure/",
  },
  {
    id: "smc-8",
    name: "Inducement & Liquidity Sweep",
    category: "SMC",
    description: "Identifies inducement levels and marks confirmed liquidity sweeps. Helps traders avoid traps and enter after stops have been cleared.",
    tradingview_link: "https://www.tradingview.com/script/IHuIwE9R-Liquidity-Sweep-Inducement/",
  },
  // ── ICT ───────────────────────────────────────────────────────────────────────
  {
    id: "ict-1",
    name: "ICT Concepts — All-in-One",
    category: "ICT",
    description: "Combines ICT killzones, dealing ranges, OTEs, liquidity pools, and daily bias tools in a single script inspired by ICT's core methodology.",
    tradingview_link: "https://www.tradingview.com/script/m4xBRQOf-ICT-Concepts/",
  },
  {
    id: "ict-2",
    name: "ICT Killzones & Sessions",
    category: "ICT",
    description: "Highlights the four ICT killzone windows — London Open, London Close, New York Open, and New York Close — as shaded overlays on the chart.",
    tradingview_link: "https://www.tradingview.com/script/bLzUxXOA-ICT-Kill-Zones/",
  },
  {
    id: "ict-3",
    name: "Optimal Trade Entry (OTE)",
    category: "ICT",
    description: "Plots the ICT OTE retracement levels (61.8%, 70.5%, 79%) within the current swing, marking the high-probability pullback entry zone.",
    tradingview_link: "https://www.tradingview.com/script/rS9gCkBw-ICT-OTE-Optimal-Trade-Entry/",
  },
  {
    id: "ict-4",
    name: "Consequent Encroachment (CE)",
    category: "ICT",
    description: "Marks the 50% midpoint of every fair value gap, known as the consequent encroachment — a key ICT target and reaction level.",
    tradingview_link: "https://www.tradingview.com/script/8hZMJyV5-ICT-Consequent-Encroachment/",
  },
  {
    id: "ict-5",
    name: "Power of Three (AMD)",
    category: "ICT",
    description: "Visualises the Accumulation, Manipulation, and Distribution phases of each session, helping traders anticipate the daily directional move.",
    tradingview_link: "https://www.tradingview.com/script/YBiKMDqX-Power-of-Three-AMD/",
  },
  {
    id: "ict-6",
    name: "Previous Day High/Low",
    category: "ICT",
    description: "Draws the previous day's high, low, and close as horizontal lines. Essential for identifying daily dealing range boundaries and liquidity above/below.",
    tradingview_link: "https://www.tradingview.com/script/rh4kk46v-Previous-Day-High-Low/",
  },
  {
    id: "ict-7",
    name: "New York Midnight Open",
    category: "ICT",
    description: "Marks the New York midnight open price as a horizontal level. Price often revisits this level before the major directional move of the day.",
    tradingview_link: "https://www.tradingview.com/script/fEtpjKfl-New-York-Midnight-Open/",
  },
  {
    id: "ict-8",
    name: "ICT Silver Bullet",
    category: "ICT",
    description: "Plots the three ICT Silver Bullet windows (10:00–11:00, 14:00–15:00, 20:00–21:00 NY time) as shaded areas for high-probability FVG setups.",
    tradingview_link: "https://www.tradingview.com/script/lBlgQBGc-ICT-Silver-Bullet/",
  },
  // ── Liquidity ─────────────────────────────────────────────────────────────────
  {
    id: "liq-1",
    name: "Liquidity Finder",
    category: "Liquidity",
    description: "Identifies key liquidity zones — equal highs, equal lows, and stop clusters — where institutional orders are likely resting above or below price.",
    tradingview_link: "https://www.tradingview.com/script/BKe7DH32-Liquidity-Finder/",
  },
  {
    id: "liq-2",
    name: "Equal Highs & Equal Lows",
    category: "Liquidity",
    description: "Automatically detects and marks equal highs and equal lows on the chart. These levels represent resting liquidity targeted by smart money.",
    tradingview_link: "https://www.tradingview.com/script/vLLSFvUX-Equal-Highs-and-Lows-EQH-EQL/",
  },
  {
    id: "liq-3",
    name: "Buy-Side / Sell-Side Liquidity",
    category: "Liquidity",
    description: "Labels buy-side liquidity (BSL) above swing highs and sell-side liquidity (SSL) below swing lows, giving clear targets for institutional sweeps.",
    tradingview_link: "https://www.tradingview.com/script/2y4G6gxv-Buy-Side-Sell-Side-Liquidity/",
  },
  // ── Sessions ──────────────────────────────────────────────────────────────────
  {
    id: "ses-1",
    name: "Sessions by LuxAlgo",
    category: "Sessions",
    description: "Highlights the Asia, London, and New York sessions as shaded background zones with customisable colours and optional range boxes.",
    tradingview_link: "https://www.tradingview.com/script/Ij8MFxsV-Sessions-by-LuxAlgo/",
  },
  {
    id: "ses-2",
    name: "Sessions on Chart",
    category: "Sessions",
    description: "Draws clean session range boxes for the Asian, London, and New York windows, making it easy to see which session created each swing.",
    tradingview_link: "https://www.tradingview.com/script/5ZHRIqOI-Sessions-on-Chart/",
  },
  {
    id: "ses-3",
    name: "FX Market Sessions",
    category: "Sessions",
    description: "Displays coloured vertical bands for all major Forex trading sessions with live clock overlays, helping traders stay aware of open/close times.",
    tradingview_link: "https://www.tradingview.com/script/rl3DG4S0-FX-Market-Sessions/",
  },
  // ── Price Action ──────────────────────────────────────────────────────────────
  {
    id: "pa-1",
    name: "Candle Patterns Finder",
    category: "Price Action",
    description: "Detects and labels over 20 classic candlestick patterns — pin bars, engulfing, doji, hammers — directly on the chart with optional alerts.",
    tradingview_link: "https://www.tradingview.com/script/OpwHVGjH-Candle-Patterns/",
  },
  {
    id: "pa-2",
    name: "Swing High / Swing Low",
    category: "Price Action",
    description: "Marks significant swing highs and lows using a configurable lookback period. The foundation for reading clean price action and market structure.",
    tradingview_link: "https://www.tradingview.com/script/kXuFzECy-Swing-High-Low/",
  },
  {
    id: "pa-3",
    name: "Market Structure (Price Action)",
    category: "Price Action",
    description: "Draws clean Higher Highs, Lower Lows, Higher Lows, and Lower Highs labels on each swing, making trend and reversal identification instant.",
    tradingview_link: "https://www.tradingview.com/script/w6wnMQ4m-Market-Structure/",
  },
]
