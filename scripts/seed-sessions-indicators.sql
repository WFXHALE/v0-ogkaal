-- Seed 3 Sessions indicators (safe to re-run)
INSERT INTO indicators (name, creator, category, description, tradingview_link, is_published)
SELECT name, creator, category, description, tradingview_link, is_published
FROM (VALUES
  (
    'Sessions (LuxAlgo)',
    'LuxAlgo',
    'Sessions',
    'Highlights active trading sessions on the chart and provides tools to analyze price movement during those sessions. Traders can customize up to four different session time ranges and study how price behaves during specific market hours.',
    'https://www.tradingview.com/script/bkb6vZDz-Sessions-LuxAlgo/',
    true
  ),
  (
    'Sessions on Chart',
    'TradingView Community',
    'Sessions',
    'Visually displays the major forex trading sessions on the chart, helping traders quickly identify when Asian, London, or New York sessions are active and when liquidity and volatility increase.',
    'https://www.tradingview.com/script/nY823NXq-Sessions-on-Chart/',
    true
  ),
  (
    'FX Market Sessions',
    'TradingView Community',
    'Sessions',
    'Highlights forex market sessions directly on the chart and allows traders to visualize session ranges and session highs/lows. Commonly used for session-based trading strategies.',
    'https://www.tradingview.com/script/IijBXaGM-FX-Market-Sessions/',
    true
  )
) AS v(name, creator, category, description, tradingview_link, is_published)
WHERE NOT EXISTS (
  SELECT 1 FROM indicators WHERE indicators.name = v.name
);
