-- Seed indicators
-- Categories: SMC, ICT, Price Action
-- Upsert by name so re-runs are safe.

INSERT INTO indicators (name, creator, category, description, tradingview_link, is_published)
VALUES

-- ── SMC ──────────────────────────────────────────────────────────────────────

('Smart Money Concepts (LuxAlgo)',
 'LuxAlgo',
 'SMC',
 'Advanced Smart Money Concepts indicator that highlights order blocks, liquidity zones, market structure shifts, and fair value gaps to help traders follow institutional price action.',
 'https://www.tradingview.com/script/CnB3fSph-Smart-Money-Concepts-SMC-LuxAlgo/',
 true),

('SMC Order Block',
 'Truth Indie',
 'SMC',
 'Detects bullish and bearish order blocks where institutional traders place large orders and where price may react strongly.',
 'https://www.tradingview.com/script/1mbs99xL-SMC-Order-Block-Truth-Indie/',
 true),

('SMC Market Structure (MTF)',
 'Community',
 'SMC',
 'Tracks break of structure and change of character across multiple timeframes to help traders understand market direction.',
 'https://www.tradingview.com/script/IkMDE4kF-SMC-Market-Structure-MTF/',
 true),

('Fair Value Gap (FVG)',
 'Nephew Sam',
 'SMC',
 'Automatically identifies imbalance zones where price moved aggressively and may later return.',
 'https://www.tradingview.com/script/G8b8t2er-FVG-Nephew-Sam/',
 true),

('Liquidity Swings',
 'LuxAlgo',
 'SMC',
 'Highlights potential liquidity areas where stop losses may accumulate.',
 'https://www.tradingview.com/script/1S2VOnJP-Liquidity-Swings-LuxAlgo/',
 true),

('Liquidity Sweeps',
 'LuxAlgo',
 'SMC',
 'Identifies liquidity grabs and stop hunts before potential reversals.',
 'https://www.tradingview.com/script/JRqryeJ5-Liquidity-Sweeps-LuxAlgo/',
 true),

('Liquidity Finder',
 'Community',
 'SMC',
 'Helps locate areas where liquidity pools are likely to exist in the market.',
 'https://www.tradingview.com/script/KGhblXLx-Liquidity-Finder/',
 true),

('SMC Highs and Lows',
 'Community',
 'SMC',
 'Marks important swing highs and lows used for identifying liquidity zones.',
 'https://www.tradingview.com/script/g5McCOZh/',
 true),

-- ── ICT ──────────────────────────────────────────────────────────────────────

('ICT HTF Candles',
 'fadi',
 'ICT',
 'Displays higher timeframe candles on lower timeframe charts for better context.',
 'https://www.tradingview.com/script/CfqnRBHd-ICT-HTF-Candles-fadi/',
 true),

('ICT Killzones & Pivots',
 'TFO',
 'ICT',
 'Highlights major ICT trading sessions including London and New York killzones.',
 'https://www.tradingview.com/script/nW5oGfdO-ICT-Killzones-Pivots-TFO/',
 true),

('ICT Concepts (LuxAlgo)',
 'LuxAlgo',
 'ICT',
 'Comprehensive ICT toolkit showing liquidity, structure shifts, and institutional trading models.',
 'https://www.tradingview.com/script/ib4uqBJx-ICT-Concepts-LuxAlgo/',
 true),

('ICT Turtle Soup',
 'Flux Charts',
 'ICT',
 'Identifies Turtle Soup setups based on liquidity sweeps and reversals.',
 'https://www.tradingview.com/script/b67pK4jN-ICT-Turtle-Soup-Flux-Charts/',
 true),

('ICT Unicorn Model',
 'LuxAlgo',
 'ICT',
 'Detects the Unicorn setup combining FVG and breaker structure.',
 'https://www.tradingview.com/script/1Qz7pb91-ICT-Unicorn-Model-LuxAlgo/',
 true),

('ICT Silver Bullet',
 'LuxAlgo',
 'ICT',
 'Highlights Silver Bullet setups during specific ICT trading windows.',
 'https://www.tradingview.com/script/fq4wSUev-ICT-Silver-Bullet-LuxAlgo/',
 true),

('ICT 2022 Mentorship Model',
 'TFO',
 'ICT',
 'Visualizes the ICT 2022 mentorship model structure for entry setups.',
 'https://www.tradingview.com/script/uMi5os2q-ICT-2022-Mentorship-Model-TFO/',
 true),

('AMD / XAMD Model',
 'Community',
 'ICT',
 'Displays AMD accumulation, manipulation, and distribution phases.',
 'https://www.tradingview.com/script/dOMcZekH-AMDX-XAMD-indicator/',
 true),

-- ── Price Action ──────────────────────────────────────────────────────────────

('Support & Resistance Levels',
 'LuxAlgo',
 'Price Action',
 'Automatically plots important support and resistance levels with break detection.',
 'https://www.tradingview.com/script/JDFoWQbL-Support-and-Resistance-Levels-with-Breaks-LuxAlgo/',
 true),

('Price Action Support Resistance',
 'DGT',
 'Price Action',
 'Displays key price action support and resistance zones.',
 'https://www.tradingview.com/script/Z1byay68-Price-Action-Support-Resistance-by-DGT/',
 true),

('Volume Flow Indicator',
 'LazyBear',
 'Price Action',
 'Tracks buying and selling pressure using volume analysis.',
 'https://www.tradingview.com/script/MhlDpfdS-Volume-Flow-Indicator-LazyBear/',
 true)

ON CONFLICT (name) DO UPDATE SET
  creator          = EXCLUDED.creator,
  category         = EXCLUDED.category,
  description      = EXCLUDED.description,
  tradingview_link = EXCLUDED.tradingview_link,
  is_published     = EXCLUDED.is_published,
  updated_at       = now();
