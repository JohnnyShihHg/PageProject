# frontend — 響應式／CSS 調整計畫

> 這份文件是給接手的人（含未來的 AI session 冷啟動）看的。
> 寫法與慣例沿用 `member/PLAN.md`：**決策理由比決策本身重要**。
>
> 適用範圍：公開站 `frontend/`。管理後台的建置計畫在 `member/PLAN.md`（已全部完成）。

最後更新：2026-08-07（T1、T2 已完成並 push 到 dev；T3/T5/T6/T7 待做，碰 DB 前會先停下確認）

---

## 交接狀態

**進度**：**設計討論已全部確認完畢，尚未動手寫任何程式碼**。這是 member 後台
（Phase 0～6）全部完成後的下一個工作項目，範圍比單純 CSS 更大——過程中發現
一項需要動 DB schema、跨三個 repo（PageWorker／compress.js／member）的資料模型
調整（見 T3+T6）。

**開始動工前，直接跳到 §5「確認完畢的 Task List」**，那裡已經是可執行的規格，
不需要重新討論。§1 的實測數據是輔助佐證，不是待辦本身。

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

---

## 5. 確認完畢的 Task List（2026-08-07，Johnny 已逐項確認，可直接動工）

範圍比標題「CSS 調整」大：T3+T6 與 T7 動到 PageWorker 的 schema／API，
以及 SharpProject 的 `compress.js`。**不是只改 `frontend/` 這個資料夾。**

### T1 — Header 手機版改漢堡選單 ✅ 2026-08-07 完成（commit 36eb13c，已 push dev）
`Navbar.vue` 補漢堡按鈕，≤768px 顯示；展開用 overlay，不要撐開 header
（`--header-height` 機制見 §1 問題一的說明，展開時不能讓它跟著變高再把內容往下推）。
本機 headless Chrome + CDP 五種寬度量測驗證過：768px 以下 header 65px（原本 33px 空白）、
900px 以上正常顯示、點漢堡展開選單後 header 高度不變。

### T2 — 首頁四格卡（`.contact-nav`）手機版改直向排列 ✅ 2026-08-07 完成（同 commit）
現在是 `grid-template-columns: repeat(2, 198px)` 固定像素，手機下溢出（見 §1 問題二）。
改成小螢幕 `flex-direction: column`，卡片滿寬、高度自動。
驗證過 375px 下 `contactNavRight` 從原本 440px（溢出 65px）變成在視窗內，
`document.documentElement.scrollWidth` 等於視窗寬度。

### T3 + T6 — 拿掉照片級 tag，統一成相簿級（**跨三個 repo，動到 schema**）

**決策**：照片本身的 `tags` 完全不用了（已確認公開站從沒讀過這個欄位，見 §1 之前的討論記錄），
全部類別改成跟街拍一樣的模式——tag 只掛在**相簿**上，不掛在照片上。

**2026-08-07 查證過的正式資料**（migration 前務必核對這份清單還一致）：

| 相簿 id | 分類 | 現有照片級 tag（要搬去相簿級） |
|---|---|---|
| `act_20260718_test800` | portrait | `["測試"]`（7/7 張一致） |
| `act_20260704_202607社大成果發表` | event | `["吉他","社大"]`（9/9 張一致） |
| `act_20260530_歐美only` | portrait | `["COS","cosplayer","歐美","歐美翁"]`（4/4 張一致） |
| `act_20260713_benz` | event | 已經是空的，不用處理（Johnny 自己用網頁上傳測試時，網頁上傳本來就不寫照片級 tag） |

同一本相簿內每張照片的 tag 都完全相同（`compress.js` 本來就是整批套用同一組，
不是真的逐張不同），所以搬遷是無損的——不是「選一張當代表」，是「反正都一樣，搬過去就好」。

**要動的地方**：
- [x] PageWorker migration `0005_backfill_collection_tags.sql`：把上面三本相簿的 tag 寫進
      `collection_tags`。**2026-08-07 已套用到正式環境**，`collection_tags` 9 → 16 筆（+7），
      內容與上表完全吻合。用 `SELECT DISTINCT` 從現有資料推導、`INSERT OR IGNORE`，可重跑。
- [ ] **`DROP TABLE photo_tags` —— 唯一還沒做的不可逆步驟，等 Johnny 點頭**。
      正式環境原始 41 筆已備份在 `PageWorker/backups/photo_tags_backup_20260807.json`。
      刻意獨立成另一份 migration：現在的程式碼在這張表存在或不存在都能運作，
      所以刪表可以隨時做，也可以先觀察一陣子。
- [x] PageWorker `src/admin.ts`：`PATCH /photos/:photoId` 只剩 `alt`；`tagLinkStatements`
      只服務 `collection_tags`；`GET /tags` 拿掉 `photo_count`
      （**注意：`member/src/views/TagsView.vue:34` 還在顯示 `t.photo_count`，會變成空白，待修**）
- [x] PageWorker `src/ingest.ts`：不再寫照片級 tag。舊版 `compress.js` 送上來的 `p.tags`
      **直接忽略、不報錯** —— 擋下來只會讓還沒更新的 CLI 整批上傳失敗，而那欄位沒有讀取端
- [x] PageWorker `src/albums.ts`：公開 API 的 photo 物件拿掉 `tags` 欄位
- [x] PageWorker `src/upload.ts`：網頁上傳路徑拿掉 photo 級 tags 欄位
- [ ] `SharpProject/compress.js`：現在 `tags: isStreet ? [] : tags` / `tags: isStreet ? tags : []` 這種分岔寫法，
      改成一律 `collection.tags = tags`，邏輯反而變簡單
- [ ] `member/src/views/AlbumDetailView.vue`：拿掉每張照片下面顯示 tag 徽章的部分（`<span v-for="t in p.tags">`）

> **⚠️ 2026-08-07 發現、PLAN 原本沒寫到的落差**：公開 API 的 `activities` 形狀
> （portrait／event）**根本沒有 `tags` 欄位**，只有 street 的 `albums` 有（`albums.ts` 的
> `isAlbums ? {...tags...} : {...}`）。所以回填進去的那 3 本 portrait/event 相簿標籤，
> 目前只有後台看得到，公開站讀不到。
>
> 這**不是退步**（照片級 tag 本來就沒有任何讀取端，公開站一直都看不到），
> 但如果「統一成相簿級」的目的包含讓 portrait/event 也能用標籤做相關相簿／分組顯示，
> 就還要在 `albums.ts` 的 activities 分支補上 `tags`，並決定前端要不要顯示。
> **這是需求決策不是技術問題，先不自作主張。**

### T4 — 略過
Johnny 已確認現有的「相關相簿」區塊（`AlbumDetailView.vue` 公開頁的 `relatedGroups`）
夠用，**不用調整**，不是無縫捲動的形式。

### T5 — 後台相簿標籤輸入要顯示可用清單
`member/AlbumDetailView.vue` 的「相簿標籤」欄位目前是純文字 input，看不到目前有哪些標籤。
改成輸入框下方列出現有標籤（可點選加入），做法比照常見的 tag picker。

### T7 — 刪除確認全部改彈出視窗，並補上批次刪除

**共用元件**：做一個 `ConfirmDialog.vue`（overlay + modal），支援兩種模式：
- 簡單模式：文字 + 取消／確認兩個按鈕
- 打字模式：要打出指定文字，Confirm 按鈕才會啟用

**各處的規則**：

| 對象 | 觸發條件 | 確認方式 |
|---|---|---|
| 標籤刪除 | `collection_count === 0` | 簡單模式，按一下確認 |
| 標籤刪除 | `collection_count > 0` | 打字模式，輸入標籤名稱 |
| 相簿刪除（單一） | 一律 | 打字模式，輸入相簿名稱（沿用現有邏輯，只是從頁面內聯改成彈窗） |
| 相簿內照片刪除（單一） | 一律 | 簡單模式，按一下確認 |
| 相簿列表多選刪除（新功能） | 選取 ≥1 本 | 打字模式，輸入固定文字（例如「刪除」），彈窗列出即將刪除的相簿名稱 |
| 相簿內多選照片刪除（新功能） | 選取 ≥1 張 | 打字模式，輸入固定文字 |

**批次刪除一律走新的交易式端點，不是重複呼叫單筆 API**
（Johnny 2026-08-07 明確要求：「能一次處理不想分多次打避免產生不必要的問題」）：

- [ ] PageWorker 新增 `POST /api/admin/photos/bulk-delete`，body `{ photoIds: [...] }`，
      用 `db.batch()` 一個交易處理完，回傳每筆結果與受影響的 `collectionId`
- [ ] PageWorker 新增 `POST /api/admin/collections/bulk-delete`，body `{ ids: [...] }`，
      同樣用 `db.batch()`，回傳每本相簿的 `photosDeleted`
- [ ] `member/src/api/admin.js` 加對應的 client 函式
- [ ] `member/src/views/AlbumsView.vue` 加多選勾選框 + 「刪除已選取」操作列
- [ ] `member/src/views/AlbumDetailView.vue` 的照片列表加多選勾選框

**已確認的技術背景**（避免重新查證）：
- 刪照片與刪相簿的 SQL **不一樣**：刪照片是單筆 `DELETE` + 條件式清 `cover_photo_id`；
  刪相簿是靠 `ON DELETE CASCADE` 連帶清掉 `photos`／`collection_tags`
- **刪相簿不會刪到 tag 定義本身**，只會刪關聯表的橋接列——`tags` 表裡的名稱永遠留著，
  這是 Phase 5 就驗證過的既有行為，T7 沒有要改變它

---

## 6. 執行順序（建議）

1. PageWorker：migration（含刪 `photo_tags` 表）+ 相關 API 改動，本機測完再部署
2. 正式資料遷移確認（跑 migration 前後都要 diff 一次 §5 那張表）
3. `compress.js` 改動（獨立 repo，改完可以先不部署，本機跑一次確認邏輯對）
4. `member` 前端：T5、T7（ConfirmDialog + 批次刪除 UI）
5. `frontend`（公開站）：T1、T2
6. 全部本機測完 → 部署 → 正式環境驗證（沿用這個 session 一貫的模式：本機先行，
   實測過的東西才上正式站，`error 1042` 那次教訓還記得吧）
