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
  try {
    const url = new URL(context.request.url);
    const symbol = (url.searchParams.get("symbol") || "").trim();
    if (!symbol) {
      return Response.json({ error: "Missing symbol" }, { status: 400 });
    }

    const quote = await yahooPrice(symbol);
    return Response.json(quote, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json({
      error: error.message || "Failed to fetch quote",
    }, {
      status: 502,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
};
