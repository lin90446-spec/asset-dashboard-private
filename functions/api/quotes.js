const yahooPrice = async symbol => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.chart?.result?.[0];
  const meta = result?.meta;
  const price = meta?.regularMarketPrice ?? meta?.previousClose;
  if (!Number.isFinite(price)) {
    throw new Error(`No Yahoo Finance price for ${symbol}`);
  }

  return {
    symbol,
    price,
    source: "Yahoo Finance chart",
    exchangeName: meta.exchangeName || "",
    marketState: meta.marketState || "",
    regularMarketTime: meta.regularMarketTime || null,
  };
};

export const onRequestGet = async context => {
  const url = new URL(context.request.url);
  const symbols = (url.searchParams.get("symbols") || "")
    .split(",")
    .map(symbol => symbol.trim())
    .filter(Boolean);

  if (!symbols.length) {
    return Response.json({ error: "Missing symbols" }, { status: 400 });
  }

  const uniqueSymbols = [...new Set(symbols)].slice(0, 50);
  const results = await Promise.all(uniqueSymbols.map(async symbol => {
    try {
      return await yahooPrice(symbol);
    } catch (error) {
      return {
        symbol,
        error: error.message || "Failed to fetch quote",
      };
    }
  }));

  return Response.json({
    source: "Yahoo Finance chart",
    quotes: results,
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
};
