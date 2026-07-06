# Eric 資產儀表板 Cloudflare Pages 部署筆記

## 建議架構

- `asset-dashboard.html`：主頁面。
- `functions/api/rates.js`：Cloudflare Pages Function，提供 `/api/rates` 即時匯率。
- `functions/api/quote.js`：Cloudflare Pages Function，提供 `/api/quote?symbol=2330.TW` 股票報價代理。
- `asset_server.py`：只給 Mac 本機/區網測試用；部署到 Cloudflare Pages 時不會使用。

## 部署到 Cloudflare Pages

1. 建立一個 GitHub private repository，例如 `asset-dashboard-private`。
2. 把這個資料夾的檔案推到該 repository。
3. 到 Cloudflare Dashboard > Workers & Pages > Create application > Pages。
4. 連接 GitHub repository。
5. Build settings：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `/`
6. 部署完成後，Cloudflare 會產生一個 `*.pages.dev` 網址。
7. 開啟 `https://你的專案.pages.dev/asset-dashboard.html`。

## 隱私設定

這是資產資料，不建議公開裸放。

目前先用 Cloudflare Pages Middleware 加 Basic Auth 密碼保護。密碼不要寫在 GitHub repo，請在 Cloudflare Pages 設定環境變數：

1. Cloudflare Dashboard > Workers & Pages。
2. 選 `asset-dashboard-private` 專案。
3. Settings > Environment variables。
4. 在 Production 新增：
   - `DASHBOARD_USERNAME`
   - `DASHBOARD_PASSWORD`
5. 儲存後重新部署最新 commit。

開啟網站時，瀏覽器會跳出帳號密碼視窗。通過後，`asset-dashboard.html` 和 `/api/rates` 都會一起受保護。

若之後有自己的 root domain，可以再改用 Cloudflare Access：

1. 將自有 domain 加到 Cloudflare。
2. Pages 專案加 custom domain。
3. Zero Trust > Access > Applications > Add an application。
4. 選 Self-hosted。
5. Policy 設定只允許你的 email 登入。

## 注意

- Cloudflare 版本的 `/api/rates` 會由 `functions/api/rates.js` 提供，不需要 Mac 開機。
- Cloudflare 版本的股票即時價會由 `functions/api/quote.js` 代理 Yahoo Finance，避免瀏覽器 CORS 擋住。
- `functions/_middleware.js` 會保護所有線上路由。
- 目前台帳仍存在各瀏覽器自己的 `localStorage`。
- 若要 Mac 和手機同步台帳，下一步要把 localStorage 改成雲端資料庫，例如 Cloudflare D1 或 Supabase。
