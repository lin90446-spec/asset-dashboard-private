from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import socket
import ssl
from urllib.parse import parse_qs, urlparse
import urllib.request


ROOT = Path(__file__).resolve().parent
SSL_CONTEXT = ssl._create_unverified_context()


def tradingview_price(market, tickers):
    if isinstance(tickers, str):
        tickers = [tickers]
    payload = json.dumps({
        "symbols": {"tickers": tickers, "query": {"types": []}},
        "columns": ["close"],
    }).encode("utf-8")
    req = urllib.request.Request(
        f"https://scanner.tradingview.com/{market}/scan",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
        data = json.loads(response.read().decode("utf-8"))
    for row in data.get("data", []):
        value = row.get("d", [None])[0]
        if isinstance(value, (int, float)):
            return float(value)
    raise ValueError(f"No TradingView price for {tickers}")


def yahoo_price(symbol):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1d&interval=1m"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
        data = json.loads(response.read().decode("utf-8"))
    result = data.get("chart", {}).get("result", [{}])[0]
    meta = result.get("meta", {})
    price = meta.get("regularMarketPrice", meta.get("previousClose"))
    if not isinstance(price, (int, float)):
        raise ValueError(f"No Yahoo Finance price for {symbol}")
    return {
        "symbol": symbol,
        "price": float(price),
        "source": "Yahoo Finance chart",
        "exchangeName": meta.get("exchangeName", ""),
        "marketState": meta.get("marketState", ""),
        "regularMarketTime": meta.get("regularMarketTime"),
    }


class AssetHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/rates":
            try:
                usd_twd = tradingview_price("forex", "FX_IDC:USDTWD")
                jpy_twd = tradingview_price("forex", "FX_IDC:JPYTWD")
                btc_usd = tradingview_price(
                    "crypto",
                    ["BITSTAMP:BTCUSD", "COINBASE:BTCUSD", "CRYPTO:BTCUSD"],
                )
                self._json(200, {
                    "source": "TradingView scanner",
                    "usdTwd": usd_twd,
                    "jpyTwd": jpy_twd,
                    "btcUsd": btc_usd,
                    "btcTwd": btc_usd * usd_twd,
                })
            except Exception as exc:
                self._json(502, {"error": str(exc)})
            return
        if parsed.path == "/api/quote":
            try:
                symbol = parse_qs(parsed.query).get("symbol", [""])[0].strip()
                if not symbol:
                    self._json(400, {"error": "Missing symbol"})
                    return
                self._json(200, yahoo_price(symbol))
            except Exception as exc:
                self._json(502, {"error": str(exc)})
            return
        super().do_GET()


def main():
    server = ThreadingHTTPServer(("0.0.0.0", 8765), AssetHandler)
    lan_ip = local_ip()
    print("Asset dashboard server:")
    print("  Mac:   http://127.0.0.1:8765/asset-dashboard.html")
    if lan_ip:
        print(f"  Phone: http://{lan_ip}:8765/asset-dashboard.html")
    print("Use only on a trusted private network.")
    server.serve_forever()


def local_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return ""


if __name__ == "__main__":
    main()
