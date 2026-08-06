# frontend — 響應式／CSS 調整計畫

> 這份文件是給接手的人（含未來的 AI session 冷啟動）看的。
> 寫法與慣例沿用 `member/PLAN.md`：**決策理由比決策本身重要**。
>
> 適用範圍：公開站 `frontend/`。管理後台的建置計畫在 `member/PLAN.md`（已全部完成）。

最後更新：2026-08-07（建立，尚未動工）

---

## 交接狀態

**進度**：尚未動工。這是 member 後台（Phase 0～6）全部完成後的下一個工作項目，
由 Johnny 於 2026-08-07 指定：「調整 CSS，目前部分頁面手機點開來有奇怪的跑版，
例如 header 他會因為擠壓消失」。

**動工前先讀 §2 的實測數據** —— 問題已經定位到具體檔案與行為，不需要重新摸索。

---

## 1. 已確認的問題（2026-08-07 在正式站實測）

### ⚠️ 問題一：手機版導覽列整個消失，且沒有任何替代方案（最嚴重）

`frontend/src/components/Navbar.vue` 的樣式裡有這段：

```css
@media (max-width: 768px) {
  .nav-links { display: none; }
  .navbar { padding: 1rem 1.5rem; }
}
```

**五個導覽連結在 ≤768px 直接被隱藏，而且沒有做漢堡選單或任何替代入口。**
結果是手機使用者**完全無法在站內導覽** —— 只能靠改網址列。

實測數據（正式站 `pageproject.pageworker.workers.dev`，headless Chrome）：

| 視窗寬度 | header 高度 | `.nav-links` display | 使用者看得到的連結 |
|---|---|---|---|
| 1200px | 71px | flex | 5 個 |
| 900px | 63px | flex | 5 個 |
| **768px** | **33px** | **none** | **0 個** |
| 500px | 33px | none | 0 個 |
| 375px | 33px | none | 0 個 |

Johnny 描述的「header 因為擠壓消失」就是這一格：**63px → 33px**，
剩下的 33px 是一條只有白底與底線、什麼都沒有的空白條。

> **不是 bug 是未完成**：`display: none` 是有人刻意寫的，推測當初打算之後補漢堡選單但沒做。
> 修的時候要做的是「補上手機版導覽」，不是「把 display:none 刪掉」——
> 直接刪掉會讓五個連結在 375px 擠成一團，那是另一種壞掉。

**修的時候要注意 `--header-height`**：`Navbar.vue` 用 `ResizeObserver` 把實際高度寫進
CSS 變數 `--header-height`，各頁面靠它做 `padding-top` 避免內容被固定的 header 蓋住
（例如 `AboutView.vue` 的 `.about-page { padding-top: var(--header-height, 80px) }`）。
**加了漢堡選單後 header 高度會變，那個機制本身會自動跟上，但展開選單時要確認
不會把內容往下推**（選單應該用 overlay 或 absolute，不要撐開 header 本身）。

### ⚠️ 問題二：首頁的 `.contact-nav` 在 375px 下超出視窗

375px 寬時，`.contact-nav` 這個元素的右邊界落在 **440px**，超出視窗 65px。
`document.documentElement.scrollWidth` 沒有跟著變大（沒有出現橫向捲軸），
代表它被某層 `overflow` 裁掉了 —— **內容可能是被切掉而不是被縮排**，要進去確認
是不是有文字或連結看不到。

其餘四頁（`/about`、`/event`、`/album`、`/contact`）在 375px 下都沒有溢出。

---

## 2. 實測方法（要重現數據就照這個做）

Chrome 擴充功能常常沒連上，用 headless Chrome + CDP 驅動（Node 內建 WebSocket，零相依）。
完整做法見 memory 的 `project-browser-testing`。要點：

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --remote-debugging-port=9333 "about:blank" &
```

然後用 CDP 的 `Emulation.setDeviceMetricsOverride` 切換視窗尺寸，
`Runtime.evaluate` 讀 `getComputedStyle` 與 `getBoundingClientRect` 取得實際數值。
**不要靠肉眼看截圖判斷有沒有溢出**，量出來的數字才有辦法比對修改前後。

---

## 3. 尚未確認的事（Johnny 說「部分頁面」，可能不只上面兩項）

- [ ] 逐頁在 375px / 414px / 768px 三種尺寸下實際看過畫面（目前只量了數值，沒有逐頁看版面）
- [ ] 照片牆 `PhotoWall.vue` 的 masonry 在窄螢幕的行為（用了 `@yeger/vue-masonry-wall`）
- [ ] 燈箱（lightbox）在手機上的操作與關閉方式
- [ ] `/contact` 的表單欄位在窄螢幕是否好按

---

## 4. 與公開站有關、但**不屬於**這次 CSS 工作的既有決策

改動前先讀，不要順手「修掉」：

- **相簿封面是隨機挑的**（`AlbumView.vue` 用 `Math.random()`），
  每次重新整理都會換。**2026-08-05 Johnny 明確表示這樣就好**，看起來像 bug 但不是。
  詳見 `member/PLAN.md` 的 D6。
- **About 頁的文字有兩份**：正常情況從 `GET /api/content`（D1）抓，
  但 `AboutView.vue` 裡保留了一份寫死的 `FALLBACK` 常數，API 掛掉時才用。
  **改文案要去後台改，不是改那份 fallback** —— 那是最後一道防線不是預設值。
  詳見 `member/PLAN.md` 的 D4。
- **照片 alt 目前是佔位值**（同一相簿內每張都是相簿名稱），
  真正的逐張描述要 Johnny 自己寫，是內容決策不是技術問題。
