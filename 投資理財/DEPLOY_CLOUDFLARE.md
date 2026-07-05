# Eric 資產儀表板 Cloudflare Pages 部署筆記

## 建議架構

- `asset-dashboard.html`：主頁面。
- `functions/api/rates.js`：Cloudflare Pages Function，提供 `/api/rates` 即時匯率。
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

建議部署後立刻設定 Cloudflare Access：

1. Cloudflare Dashboard > Zero Trust。
2. Access > Applications > Add an application。
3. 選 Self-hosted。
4. Domain 填 Cloudflare Pages 產生的網址。
5. Policy 設定只允許你的 email 登入。

## 注意

- Cloudflare 版本的 `/api/rates` 會由 `functions/api/rates.js` 提供，不需要 Mac 開機。
- 目前台帳仍存在各瀏覽器自己的 `localStorage`。
- 若要 Mac 和手機同步台帳，下一步要把 localStorage 改成雲端資料庫，例如 Cloudflare D1 或 Supabase。
