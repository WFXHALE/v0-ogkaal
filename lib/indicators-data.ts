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
    tradingview_link: "https://www.tradingview.com/script/CnB3fSph-Smart-Money-Concepts-SMC-LuxAlgo/",
  },
  {
    id: "smc-2",
    name: "Order Block Detector",
    category: "SMC",
    description: "Automatically marks bullish and bearish order blocks on any timeframe. Highlights the most recent unmitigated OBs for precision entries.",
    tradingview_link: "https://www.tradingview.com/script/LukvAOdW-Order-Block-Zones-Multi-Retest-Highlight-Invalidation/",
  },
  {
    id: "smc-3",
    name: "Break of Structure & CHoCH",
    category: "SMC",
    description: "Labels every BOS and CHoCH swing on the chart in real time, allowing traders to track market structure shifts and trend reversals clearly.",
    tradingview_link: "https://www.tradingview.com/script/WDj0Ynb5-Market-Structure-BOS-Choch-Line-Bar-Chart/",
  },
  {
    id: "smc-4",
    name: "Fair Value Gap (FVG) Finder",
    category: "SMC",
    description: "Scans and highlights bullish and bearish fair value gaps. Tracks whether each FVG has been filled or remains open as a potential reaction zone.",
    tradingview_link: "https://www.tradingview.com/scripts/fairvaluegaps/",
  },
  {
    id: "smc-5",
    name: "Premium & Discount Zones",
    category: "SMC",
    description: "Draws the 50% equilibrium line with shaded premium (sell zone) and discount (buy zone) areas based on the current swing range.",
    tradingview_link: "https://www.tradingview.com/script/ZGl2xWym-LuxAlgo-Price-Action-Concepts/",
  },
  {
    id: "smc-6",
    name: "Supply & Demand Zones",
    category: "SMC",
    description: "Automatically detects and draws fresh supply and demand zones from significant price impulses. Updates dynamically as price mitigates each zone.",
    tradingview_link: "https://www.tradingview.com/script/I0o8N7VW-Supply-and-Demand-Zones-BigBeluga/",
  },
  {
    id: "smc-7",
    name: "Multi-TF Market Structure",
    category: "SMC",
    description: "Pulls higher timeframe market structure onto your current chart, giving context for where you are in the larger trend without switching timeframes.",
    tradingview_link: "https://www.tradingview.com/script/Skw4cLUD-Advanced-SMC-Market-Structure-Analyzer/",
  },
  {
    id: "smc-8",
    name: "Inducement & Liquidity Sweep",
    category: "SMC",
    description: "Identifies inducement levels and marks confirmed liquidity sweeps. Helps traders avoid traps and enter after stops have been cleared.",
    tradingview_link: "https://www.tradingview.com/script/7UJG3ZDh-TehThomas-ICT-Liquidity-sweeps/",
  },
  // ── ICT ───────────────────────────────────────────────────────────────────────
  {
    id: "ict-1",
    name: "ICT Concepts — All-in-One",
    category: "ICT",
    description: "Combines ICT killzones, dealing ranges, OTEs, liquidity pools, and daily bias tools in a single script inspired by ICT's core methodology.",
    tradingview_link: "https://www.tradingview.com/script/ib4uqBJx-ICT-Concepts-LuxAlgo/",
  },
  {
    id: "ict-2",
    name: "ICT Killzones & Sessions",
    category: "ICT",
    description: "Highlights the four ICT killzone windows — London Open, London Close, New York Open, and New York Close — as shaded overlays on the chart.",
    tradingview_link: "https://www.tradingview.com/script/9kY5NlHJ-ICT-Killzones-Toolkit-LuxAlgo/",
  },
  {
    id: "ict-3",
    name: "Optimal Trade Entry (OTE)",
    category: "ICT",
    description: "Plots the ICT OTE retracement levels (61.8%, 70.5%, 79%) within the current swing, marking the high-probability pullback entry zone.",
    tradingview_link: "https://www.tradingview.com/script/FpMfCnbO-BOS-CHoCH-and-CISD-theEccentricTrader/",
  },
  {
    id: "ict-4",
    name: "Consequent Encroachment (CE)",
    category: "ICT",
    description: "Marks the 50% midpoint of every fair value gap, known as the consequent encroachment — a key ICT target and reaction level.",
    tradingview_link: "https://www.tradingview.com/script/144G5ymP-Math-by-Thomas-SMC-Structure-Toolkit-OB-FVG-CHoCH-BoS/",
  },
  {
    id: "ict-5",
    name: "Power of Three (AMD)",
    category: "ICT",
    description: "Visualises the Accumulation, Manipulation, and Distribution phases of each session, helping traders anticipate the daily directional move.",
    tradingview_link: "https://www.tradingview.com/script/6tMyGoUE-FibAlgo-ICT-Power-of-3/",
  },
  {
    id: "ict-6",
    name: "Previous Day High/Low",
    category: "ICT",
    description: "Draws the previous day's high, low, and close as horizontal lines. Essential for identifying daily dealing range boundaries and liquidity above/below.",
    tradingview_link: "https://www.tradingview.com/script/NXgQEbZi-Market-Structure-ZigZag-Break-of-Structure-Order-Blocks/",
  },
  {
    id: "ict-7",
    name: "New York Midnight Open",
    category: "ICT",
    description: "Marks the New York midnight open price as a horizontal level. Price often revisits this level before the major directional move of the day.",
    tradingview_link: "https://www.tradingview.com/script/InMPCLO7-ICT-Killzones-and-Sessions-W-Silver-Bullet-Macros/",
  },
  {
    id: "ict-8",
    name: "ICT Silver Bullet",
    category: "ICT",
    description: "Plots the three ICT Silver Bullet windows (10:00–11:00, 14:00–15:00, 20:00–21:00 NY time) as shaded areas for high-probability FVG setups.",
    tradingview_link: "https://www.tradingview.com/script/InMPCLO7-ICT-Killzones-and-Sessions-W-Silver-Bullet-Macros/",
  },
  // ── Liquidity ─────────────────────────────────────────────────────────────────
  {
    id: "liq-1",
    name: "Liquidity Finder",
    category: "Liquidity",
    description: "Identifies key liquidity zones — equal highs, equal lows, and stop clusters — where institutional orders are likely resting above or below price.",
    tradingview_link: "https://www.tradingview.com/script/Ian8gdjt-FibAlgo-ICT-Liquidity-Levels/",
  },
  {
    id: "liq-2",
    name: "Equal Highs & Equal Lows",
    category: "Liquidity",
    description: "Automatically detects and marks equal highs and equal lows on the chart. These levels represent resting liquidity targeted by smart money.",
    tradingview_link: "https://www.tradingview.com/script/EuXueiJN-Pure-Price-Action-Structures-LuxAlgo/",
  },
  {
    id: "liq-3",
    name: "Buy-Side / Sell-Side Liquidity",
    category: "Liquidity",
    description: "Labels buy-side liquidity (BSL) above swing highs and sell-side liquidity (SSL) below swing lows, giving clear targets for institutional sweeps.",
    tradingview_link: "https://www.tradingview.com/script/Qk4vBbfL-Buyside-Sellside-Liquidity-LuxAlgo/",
  },
  // ── Sessions ──────────────────────────────────────────────────────────────────
  {
    id: "ses-1",
    name: "Sessions by LuxAlgo",
    category: "Sessions",
    description: "Highlights the Asia, London, and New York sessions as shaded background zones with customisable colours and optional range boxes.",
    tradingview_link: "https://www.tradingview.com/script/bkb6vZDz-Sessions-LuxAlgo/",
  },
  {
    id: "ses-2",
    name: "Session Sweeps",
    category: "Sessions",
    description: "Draws clean session range boxes for the Asian, London, and New York windows and automatically marks sweeps of each session's high and low.",
    tradingview_link: "https://www.tradingview.com/script/KdOv0Dfq-Session-Sweeps-LuxAlgo/",
  },
  {
    id: "ses-3",
    name: "ICT Killzones & Sessions",
    category: "Sessions",
    description: "Displays ICT killzones, session boxes, and Silver Bullet windows as coloured overlays. Combines session awareness with ICT timing concepts.",
    tradingview_link: "https://www.tradingview.com/script/InMPCLO7-ICT-Killzones-and-Sessions-W-Silver-Bullet-Macros/",
  },
  // ── Price Action ──────────────────────────────────────────────────────────────
  {
    id: "pa-1",
    name: "Price Action Concepts",
    category: "Price Action",
    description: "All-in-one LuxAlgo price action suite covering swing structure, premium/discount zones, BOS, CHoCH, equal highs/lows, and FVGs.",
    tradingview_link: "https://www.tradingview.com/script/ZGl2xWym-LuxAlgo-Price-Action-Concepts/",
  },
  {
    id: "pa-2",
    name: "Pure Price Action Structures",
    category: "Price Action",
    description: "Marks significant swing highs and lows, higher highs/lows, lower highs/lows, and equal H/L labels. Clean structure analysis without indicators.",
    tradingview_link: "https://www.tradingview.com/script/EuXueiJN-Pure-Price-Action-Structures-LuxAlgo/",
  },
  {
    id: "pa-3",
    name: "Market Structure BOS/CHoCH",
    category: "Price Action",
    description: "Draws Higher Highs, Lower Lows, BOS, and CHoCH labels on every swing, making trend identification and reversal detection instant and clear.",
    tradingview_link: "https://www.tradingview.com/script/WDj0Ynb5-Market-Structure-BOS-Choch-Line-Bar-Chart/",
  },
]
