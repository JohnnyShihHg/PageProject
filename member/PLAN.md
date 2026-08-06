# member — 管理後台建置計畫

> 這份文件是給接手的人（含未來的 AI session 冷啟動）看的。
> **決策理由比決策本身重要** —— 沒有理由的決定，下一個人只會照著改掉。
> 每完成一項就更新「進度」欄位，不要另外開新檔案記錄。

最後更新：2026-08-05（Phase 0、1 完成後收工）

---

## 交接狀態（接手前先讀這段）

**進度**：Phase 0 ✅、Phase 1 ✅、Phase 2 ✅、Phase 3 ✅（都在 2026-08-06）、Phase 4~6 未開始。
下一步是 Phase 4（站台文案）。

`POST /api/admin/photos/reorder` 已於 2026-08-06 部署到正式 API（version `906124f3`，
前一版 `7639d861` 是退路）。正式站的後台仍然沒有 `ADMIN_TOKEN`，所以瀏覽器那條路徑照舊回 503。

**⚠️ Phase 3 尚未部署。** `POST /api/admin/upload` 與 R2 binding 只存在本機。
部署前先讀 Phase 3 那三段備註 —— 尤其「正式環境第一次先傳 1 張」與
「不要為了試用把 token 放進線上 member」。

**目前線上的東西**

| 位置 | 網址 | 狀態 |
|---|---|---|
| 公開站正式 | `pageproject.pageworker.workers.dev` | SEO/OG、hero srcset、soft 404 都已上線 |
| 公開站預覽 | `dev-pageproject.pageworker.workers.dev` | 同上 |
| API | `pageworker.pageworker.workers.dev` | 已含全部 admin 端點 |
| **後台** | `member.pageworker.workers.dev` | **可瀏覽，但管理功能回 503（刻意的，見 Phase 0 警告）** |

**分支狀態**
- `PageProject`：`dev` 領先 `master` 4 個 commit（member 的全部內容）。**尚未合併 master，刻意的** —— 後台還在裸奔，等 Phase 6 的 Access 上線再上正式站。
- `PageWorker`：`master` 已是最新且已部署。
- `SharpProject`：`master` 已是最新。

**要在本機開發後台，需要同時跑兩個服務**
```
cd G:\PageWorker      && npx wrangler dev --port 8791   # API（用本機 D1，不會動到正式資料）
cd G:\PageProject\member && npx wrangler dev --port 8790   # 後台
```
先把 `member/.dev.vars.example` 複製成 `.dev.vars` 並填入 `ADMIN_TOKEN`
（值同 `G:\SharpProject\.env` 的 `WORKER_ADMIN_TOKEN`），`PAGEWORKER_URL` 填 `http://127.0.0.1:8791`。

**⚠️ 改完 `.dev.vars` 一定要重啟 `wrangler dev`**，它不會熱重載，否則你會測到舊的值（2026-08-05 被騙過一次）。

本機 D1 與正式 D1 是分開的：本機有 4 個相簿 27 張（舊資料），正式有 5 個相簿 33 張。
`wrangler.jsonc` 的 D1 設定是 `"remote": false`，所以本機開發不會動到正式資料 —— 這點已實測確認。

---

---

## 0. 這是什麼

`member/` 是 ZHENDOKU 攝影作品集的**管理後台**，讓 Johnny（站主）用瀏覽器管理相簿、照片、標籤與站台文案，取代目前只能用 CLI（`G:\SharpProject\compress.js`）的流程。

**不是**給訪客或客戶用的。名稱取 `member` 而非 `admin` 是 Johnny 的指定。

## 1. 現況（動工前的起點）

| 元件 | 位置 | 說明 |
|---|---|---|
| 公開站 | `PageProject/frontend` | Vue 3 + Vite，Cloudflare Worker + Static Assets |
| API | `G:\PageWorker`（**獨立 repo**） | Hono + D1 `pageworker-db`，手動 `wrangler deploy` |
| 壓縮上傳 CLI | `G:\SharpProject\compress.js`（**獨立 repo**） | Node + sharp，互動式問答 |
| 圖檔 | Cloudflare R2 | 公開網域 `pub-7f52f0ce64e04ac9b534b404269eb8f3.r2.dev` |

**PageWorker 目前只有 4 個路由**，寫入端只有 `POST /api/admin/photos`（只能新增照片）。
**本專案的主要工作量在補齊 API 的 CRUD，不在畫面。**

### 資料表（`PageWorker/migrations/0001_init_schema.sql`）

```
categories(key, display_name, list_kind)
collections(id, category_key, name, person_name, occasion, date, cover_photo_id, created_at)
photos(photo_id, collection_id, filename, url, thumb_url, width, height, order_index, alt, created_at)
tags(id, name UNIQUE)
photo_tags(photo_id, tag_id)
collection_tags(collection_id, tag_id)
```

已知狀態：
- `collections.cover_photo_id` **欄位存在但沒有任何程式在用**。`frontend/src/views/AlbumView.vue` 是**隨機挑一張**當封面。Phase 2 要修掉。
- `photos.filename` 有**全域**唯一索引（migration `0003`）。理由見 §6。
- `tags` / `photo_tags` / `collection_tags` **完全沒有任何 API 能操作**。

---

## 2. 決策紀錄（改動前先讀這段）

### D1. 獨立成一個 Worker，不併進 frontend
管理介面的程式碼不會被打包進公開站 bundle，訪客不會下載到；後台掛掉也不影響作品集。
代價：多一個要部署的 Worker，且**它的網址必須加進 PageWorker 的 `ALLOWED_ORIGINS`**（見 §6 陷阱三）。

### D2. 認證用 Cloudflare Access，先上 Email OTP，保留 OAuth 空間
- **先 OTP**：零設定即可上線，不必先去 GCP 申請 OAuth client。
- **保留 OAuth**：Access 換 IdP 是 Dashboard 設定，**不需要改任何程式碼** —— 前提是 Worker 端只驗 Access 的 JWT，不要對登入方式做任何假設。這是「保留空間」的具體含義，實作時不要為 OTP 寫死任何邏輯。
- **已查證的限制**：Access 登入頁只能改組織名稱、logo、頁首頁尾、背景色，**不能給自訂 HTML**，網址固定是 `<team>.cloudflareaccess.com`。Johnny 知道且接受。
- 入口設計成從自己的頁面按按鈕進入，使用者只在第一次驗證時看到 Cloudflare 的頁面。

### D3. 上傳保留 CLI 與網頁兩條路，不是二選一
| | CLI | 網頁 |
|---|---|---|
| 適合 | 大批（數十張以上） | 少量、臨時補圖 |
| 壓縮 | sharp（Node） | Canvas（瀏覽器） |
| 寫 R2 | 自己用 S3 API | Worker 用 R2 binding |

**⚠️ 兩條路的檔名規則、`photoId` 遞增、唯一性檢查必須共用同一段程式。**
分岔會直接繞過 §6 的資料遺失保護。實作時把 ingest 的驗證與寫入抽成共用函式。

Worker 跑不了 sharp（原生模組），也不為此引入 Cloudflare Images（付費）。
瀏覽器壓縮的實測基準：原圖 1.1–2.5 MB → 主圖 189 KB（2000px q80）+ 縮圖 55 KB（800px q80）。
**Canvas 會丟掉 EXIF**，日期要在壓縮前另外從原檔讀出來。

### D4. About 文案搬進 D1 時必須保留程式碼內的 fallback
目前文案寫死在 `frontend/src/views/AboutView.vue`。搬進 D1 等於給公開站多一個失敗點（API 掛掉 About 頁就空白）。
**保留現有文字當 fallback，抓不到就用它。**

### D5. 刪除功能排最後，且預設只刪 D1 不刪 R2
唯一不可逆的功能。誤刪時 R2 還留著檔案就救得回來。

### D6. 公開站的封面「隨機挑」是刻意保留的，不要改
`frontend/src/views/AlbumView.vue:49` 用 `Math.random()` 從相簿裡挑一張當封面，
所以每次重新整理封面都會換。**2026-08-05 Johnny 明確表示這樣就好，不用調整。**

**看起來很像 bug，但不是。** 若未來有人（含 AI）發現 `collections.cover_photo_id`
欄位存在卻沒被公開站使用，請先回頭讀這段再決定，不要當成待修的缺陷。

連帶影響：後台的「設定封面」API（`PATCH /collections/:id` 的 `coverPhotoId`）
已經實作且會驗證照片歸屬，但**目前只影響後台列表的縮圖，不影響公開站**。
要讓它影響公開站，就得推翻這個決定。

---

## 3. 需要新增的 API（都在 PageWorker）

現有：`GET /api/health`、`GET /api/albums`、`POST /api/admin/photos`

```
GET    /api/admin/collections        列出全部（含公開 API 不吐的欄位）
PATCH  /api/admin/collections/:id    name / date / occasion / person_name / cover_photo_id
DELETE /api/admin/collections/:id    刪相簿
PATCH  /api/admin/photos/:id         alt / tags
POST   /api/admin/photos/reorder     批次 order_index
DELETE /api/admin/photos/:id         刪照片
GET    /api/admin/tags               清單 + 使用次數
POST   /api/admin/tags               新增 / 改名
DELETE /api/admin/tags/:id           刪標籤
POST   /api/admin/upload             收壓好的檔 → R2 + D1
GET    /api/content                  站台文案（公開）
PUT    /api/admin/content            編輯文案
```

**所有 `/api/admin/*` 都要驗 Access JWT。** 現有的 `ADMIN_TOKEN` Bearer 保留給 CLI 用 —— CLI 沒有瀏覽器，走不了 Access。

---

## 4. Phase 與 Task

狀態：`[ ]` 未開始 `[~]` 進行中 `[x]` 完成

### Phase 0 — 清場與骨架
- [x] `backend/` 改名為 `member/`，刪除 `go.mod` / `go.sum`（Gin + MongoDB 殘骸，無原始碼；git 有紀錄可救回）
- [x] 寫下這份 PLAN.md
- [x] 建立 Vite + Vue 3 骨架（與 `frontend/` 同技術棧，不另學）
- [x] `member/wrangler.jsonc`：Worker + Static Assets，SPA fallback 沿用 `frontend/worker/index.js` 的做法
- [x] 首次部署 → **https://member.pageworker.workers.dev**
- [ ] member 網址加進 PageWorker 的 `ALLOWED_ORIGINS` 並 `wrangler deploy`（等 Phase 1 真的要呼叫 API 時再做）
- **驗收**：✅ 部署後 6 條合法路由回 200、5 個亂打網址回 404、靜態資產正常、noindex 生效。

> **member 是獨立的 Worker，現有的 Git 整合不會自動部署它。**
> `pageproject` 那個 Cloudflare 專案只綁 `frontend/`。member 目前一律用
> `cd member && npx wrangler deploy` 手動部署（或 `npm run deploy`）。
> 之後要不要幫它也接 Git 整合是 Dashboard 的設定，尚未做。

> **首次部署後新的 workers.dev 子網域會有幾分鐘傳播延遲**，期間所有路徑
> （含靜態資產）都回 `404 + error code: 1042`，看起來像 Worker 壞掉。
> 那是 Worker 還沒被叫用就被邊緣擋掉，**不是程式問題，等 DNS 解析出來就好**。
> 2026-08-05 首次部署踩過一次。

> **⚠️ 認證刻意排到最後（Johnny 2026-08-05 決定）。**
> 開發期間 member Worker 是**沒有任何保護**的公開網址。空殼階段沒有風險，
> 真正的曝險點是「寫入功能接上並部署」的那一刻 —— 屆時任何知道網址的人都能刪照片。
>
> **因此開發期的規則：寫入功能在本機 `wrangler dev` 測試，
> 部署上去的版本不要帶 `ADMIN_TOKEN`（或任何能寫 PageWorker 的憑證）。**
> 等 Phase 6 的 Access 上線後再把憑證放進去。這條規則在 Phase 6 完成前不要拿掉。

### Phase 1 — 讀取與文字編輯（風險最低，先有用再說）
- [x] `GET /api/admin/collections`
- [x] 後台列出所有相簿與照片（含 alt 未填數量提示）
- [x] `PATCH /api/admin/collections/:id` + 表單（名稱 / 日期 / occasion / person_name / 標籤 / 封面）
- [x] `PATCH /api/admin/photos/:id` + 逐張編輯 alt
- [x] 標籤 CRUD（`GET`/`POST`/`DELETE /api/admin/tags`）
- [x] **認證改成 `/api/admin/*` 中介層**，新端點預設就被保護，不會有人漏加
- **驗收**：✅ API 27/27 測試通過；瀏覽器實測改 alt 後資料落到 D1 並反映到公開 API。

> **憑證流向（Phase 6 之後也維持這個形狀）：**
> 瀏覽器 → member Worker（在這裡補上 `Authorization: Bearer`）→ PageWorker。
> **瀏覽器端永遠不持有憑證**，`member/src/api/admin.js` 裡不該出現任何 token 相關的程式碼。
> Access 負責「誰能進來」，Worker 持有憑證負責「能做什麼」，兩者分工。
>
> 沒設定 `ADMIN_TOKEN` 時代理回 503 並附說明，畫面上顯示「管理功能在此環境停用」——
> 裸奔期的部署版本就是這個狀態，是預期行為不是故障。
>
> 本機開發：複製 `.dev.vars.example` 為 `.dev.vars`（已 gitignore）。
> **改 `.dev.vars` 後 `wrangler dev` 不會熱重載，必須重啟**，否則會測到舊的值。

### Phase 2 — 排序
- [x] `POST /api/admin/photos/reorder`（批次更新 `order_index`）
- [x] 後台拖曳排序
- ~~修 `AlbumView.vue` 的隨機封面~~ → **刻意不做，見 D6**
- ~~設定 `cover_photo_id`~~ → API 已在 Phase 1 實作完，但依 D6 不影響公開站
- **驗收**：✅ API 10/10（含 6 種不合法輸入）；瀏覽器實測拖曳與 ↑↓ 後按儲存，
  順序落到 D1，繞快取的公開 API 也跟著改變。

> Phase 2 因為 D6 縮小到只剩「排序」一項，是所有 Phase 裡最小的一塊。

> **reorder 刻意要求送出整個相簿的完整清單**（不多不少不重複），而不是只送有動到的幾筆。
> 少送一張的話那張的 `order_index` 會與別人重複，排序就變成未定義；前端本來就握有
> 完整清單，整份送回來是最不容易出錯的介面。不符合直接回 400 並說明差在哪。
>
> 目前 `(collection_id, order_index)` **沒有**唯一約束，所以可以直接依序覆寫。
> 若之後補上唯一索引，`admin.ts` 那段就得改成兩階段更新（先挪到暫時值），否則會撞約束。

> **拖曳的 `dragstart` 一定要寫 `dataTransfer.setData()`。** 沒寫的話 Chrome 還是會動，
> **Firefox 則完全不會開始拖曳** —— 本機測試時就是靠 CDP 攔截到「拖曳項目數 = 0」才發現。
> 排序實際上是用 `dragSourceId` 算的，setData 的內容只是為了讓拖曳成立。

> **HTML5 拖曳在手機上不管用**，所以每一列另外給了 ↑ ↓ 按鈕；那組按鈕同時也是鍵盤操作的路徑。
> 之後若做 Phase 3 的上傳排序，沿用同一組互動。

### Phase 3 — 上傳（最大一塊）
- [x] 把 PageWorker 的 ingest 驗證／寫入邏輯抽成共用函式（CLI 與網頁共用，見 D3）
- [x] `POST /api/admin/upload`：收主圖 + 縮圖 → R2 binding 寫入 → 呼叫共用 ingest
- [x] 瀏覽器端：選檔 → 讀 EXIF 拍攝日 → Canvas 壓 WebP（2000px / 800px, q80）→ 預覽 + 顯示壓縮後大小 → 確認才送
- [x] 表單涵蓋 CLI 的所有欄位：分類 / 名稱 / slug / occasion / 日期 / 標籤 / alt
- [ ] **先用 1 張實測**再開放整批（compress.js 首次正式環境實跑的教訓）
      → 本機已用 2 張實測；**正式環境的第一次仍然要照這條走**，見下方部署備註。
- **驗收**：✅ API 14/14；瀏覽器實測 2 張 1.1 MB JPEG → 186 KB 主圖 + 60 KB 縮圖（省 84%，
  與 D3 的基準相符）；D1 逐欄與 CLI 寫入的資料比對一致（欄位、型別、URL 編碼規則、`thumb_` 前綴）。

> **寫入順序是刻意的，不要調換**（`upload.ts`）：
> `查撞名 → 查 R2 是否已有同名物件 → 寫 R2 → 寫 D1`，且 **ingest 失敗要把剛寫的 R2 物件刪掉**。
> 反過來（先寫 R2 再驗）的話，撞名時 R2 上既有的圖檔已經被覆蓋，回幾號錯誤都救不回來 ——
> 那正是 §6 陷阱一。回收路徑正常流程碰不到，是用故障注入實測過的。
>
> 另外多擋一種狀況：**R2 有、D1 沒有**（前一次失敗的殘留）。這時候能不能覆蓋沒人知道，
> 所以不猜，直接回 409 要人去看。

> **R2 binding 是新的權限面。** `wrangler.jsonc` 多了 `r2_buckets`（`my-page-photo`）與
> `R2_PUBLIC_URL_BASE`。那個 URL **必須與 `SharpProject/.env` 的 `R2_PUBLIC_URL_BASE` 一字不差**，
> 兩邊分岔的話同一個 bucket 會產生兩種 url 寫進 D1，公開站上就會有一部分照片連到不存在的網址。

> **網頁上傳在正式環境還不能用，要等 Phase 6。** 線上 member 沒有 `ADMIN_TOKEN`（Phase 0 的規則），
> 所以瀏覽器那條路徑會回 503。PageWorker 端的 `/api/admin/upload` 部署後就存在，但只有拿得到
> token 的人（CLI）打得到。**這是刻意的，不要為了試用而把 token 放進線上 member。**

> **上傳頁的「加進現有相簿」下拉選單（2026-08-06 Johnny 要求）。**
> 沒有它的話，使用者只能靠記憶把 slug 與日期打對，**打錯一個字就默默開一本新相簿**、
> 而且不會有任何提示。選了現有相簿後分類／slug／日期會鎖住，改了就會指到另一本。
>
> 選單要從相簿 id 反推 slug（`album_{YYYY}_` 或 `act_{YYYYMMDD}_` 剝前綴，
> **不能用 `split('_')`，slug 本身可能含底線**）。反推錯的後果正好就是要防的那件事，
> 所以另外加了一道 `idMismatch`：組出來的 id 必須與選到的相簿完全相同，否則擋住不讓送。
> 現有 4 本相簿（含 2 個中文 slug 與 1 本街拍）都實測反推一致。

> **slug 沒有任何格式驗證，中文可以用**（正式資料裡 `老弟日本追櫻花`、`歐美only` 都是中文）。
> 2026-08-06 Johnny 決定維持這樣、不強制英數 —— 強制的收益（網址好看）遠小於遷移主鍵的風險，
> 因為街拍相簿的 id 會直接出現在公開站網址上，改 id 等於讓舊連結失效。
> 欄位標籤原本寫「英數」是誤導，已改成說明用途並建議英文。

> **測試多媒體上傳時不要用 Git Bash 的 `curl -F` 送含中文的欄位。**
> Git Bash 會把命令列參數轉成 CP950 才交給原生的 `curl.exe`，中文在進 curl 之前就壞了，
> 存進 D1 會變成 `%EF%BF%BD`（U+FFFD）。看起來像編碼 bug，其實是測試工具的問題。
> 用 Node 的 `fetch` + `FormData` 送才是瀏覽器的真實行為。

### Phase 4 — 站台文案
- [ ] 新增 D1 表存文案（key-value 或 page-section 皆可）
- [ ] `GET /api/content`（公開）、`PUT /api/admin/content`
- [ ] `AboutView.vue` 改 runtime 抓，**保留現有文字當 fallback**（D4）
- [ ] 後台文案編輯畫面
- **驗收**：把 API 打掛，About 頁仍顯示 fallback 文字而非空白。

### Phase 5 — 刪除（功能面最後）
- [ ] `DELETE /api/admin/photos/:id`、`DELETE /api/admin/collections/:id`
- [ ] 二次確認 UI
- [ ] **預設只刪 D1，R2 檔案保留**（D5）
- **驗收**：刪除後公開站不再顯示，但 R2 檔案仍在、可還原。

### Phase 6 — 認證（Johnny 指定排在最後）
- [ ] Cloudflare Access 設定（**Johnny 在 Dashboard 操作，我無法代勞**）：建立 Zero Trust 組織、加 Email OTP、把 member Worker 網址設為 Access 應用
- [ ] Worker 端驗 `Cf-Access-Jwt-Assertion`（驗簽章、`aud`、`exp`；**不要對登入方式做假設**，見 D2）
- [ ] 把 `ADMIN_TOKEN` 等憑證放進部署版本（在此之前刻意不放，見 Phase 0 的警告）
- [ ] 從公開站放一個進入後台的入口
- **驗收**：未登入者被擋在 Access；登入後所有功能正常。

---

## 5. 部署

| 專案 | 分支／方式 |
|---|---|
| `PageProject`（frontend + member） | `dev` = 預覽自動部署、`master` = 正式自動部署 |
| `PageWorker` | 無 Git 整合，一律手動 `npx wrangler deploy` |
| `SharpProject` | 本機 CLI，不部署 |

常態開發往 `dev`，確認後 `dev` → `master` fast-forward。
**commit 前先 `git branch --show-current`** —— 曾經因為指令鏈結尾停在別的分支而 commit 錯地方。

---

## 6. 已知陷阱（踩過的，不要再踩）

**陷阱一：`photos.filename` 必須全域唯一，不能只在相簿內唯一。**
R2 的物件名稱就是 `{filename}`，**沒有 collection 前綴**（`compress.js` 的 `mainFilename` / `toR2Url`）。兩個相簿若有同名來源檔，第二次上傳會**直接覆蓋 R2 上第一張的圖檔**，兩筆 D1 指向同一張圖 = 靜默弄丟照片。
已用 migration `0003` 的唯一索引 + ingest 事前檢查（回 409）擋住。
**若之後想允許同名，必須先讓 R2 的 key 帶 collection 前綴。**

**陷阱二：驗證資料改動時，先繞快取確認 API，再重載頁面確認畫面。**
`GET /api/albums` 是 `public, max-age=60, s-maxage=300, stale-while-revalidate=3600`。
2026-08-05 一天內因此誤判三次（「CORS 沒生效」「整頁空白」「6 張只顯示 2 張」），三次都不是 bug。
用 `?cb=<亂數>` 繞過快取確認資料，再重載頁面確認畫面。**做完管理功能後這個坑會更常遇到，因為改資料的頻率變高了。**

**陷阱三：新的 Worker 網址記得加進 `ALLOWED_ORIGINS`。**
在 `PageWorker/wrangler.jsonc` 的 `vars`，改完要 `wrangler deploy` 才生效。
dev 預覽站就是因為漏加，相簿一直顯示「照片準備中」。

**陷阱四：處理完的原始照片要移出 `SharpProject/input/`。**
已有 `input_done/`（在 .gitignore 內）。唯一索引現在會擋，但擋下來時 R2 已經被重新上傳過了，只是內容相同所以無害。

---

## 7. 需要 Johnny 本人操作的事（我不能代勞）

- Cloudflare Zero Trust 組織與 Access 應用設定
- 之後若要換成 Google OAuth：到 GCP 申請 OAuth client（client ID / secret）
- 任何正式環境金鑰的填寫
