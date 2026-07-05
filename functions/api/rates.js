const tradingViewPrice = async (market, tickers) => {
  const tickerList = Array.isArray(tickers) ? tickers : [tickers];
  const response = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      symbols: { tickers: tickerList, query: { types: [] } },
      columns: ["close"],
    }),
  });

  if (!response.ok) {
    throw new Error(`TradingView HTTP ${response.status}`);
  }

  const data = await response.json();
  for (const row of data.data || []) {
    const value = row.d?.[0];
    if (Number.isFinite(value)) return value;
  }

  throw new Error(`No TradingView price for ${tickerList.join(", ")}`);
};

export const onRequestGet = async () => {
  try {
    const usdTwd = await tradingViewPrice("forex", "FX_IDC:USDTWD");
    const jpyTwd = await tradingViewPrice("forex", "FX_IDC:JPYTWD");
    const btcUsd = await tradingViewPrice("crypto", [
      "BITSTAMP:BTCUSD",
      "COINBASE:BTCUSD",
      "CRYPTO:BTCUSD",
    ]);

    return Response.json({
      source: "TradingView scanner",
      usdTwd,
      jpyTwd,
      btcUsd,
      btcTwd: btcUsd * usdTwd,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json({
      error: error.message || "Failed to fetch rates",
    }, {
      status: 502,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
};
