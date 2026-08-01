---
name: album-schema
description: 規定 PageProject 專案中 albums.json 的資料結構標準（categories/activities/albums 巢狀格式）與 compress.js 的寫入規範。
---

# 相簿資料結構與自動寫入規範 (Album Schema Specification)

本文件定義 `G:\PageProject\data\albums.json` 的核心資料模型與 `G:\SharpProject\compress.js` 腳本的處理邏輯。任何針對此專案的修改均須 100% 遵守以下規則。

## 1. 核心 JSON 資料結構 (Data Schema)

`albums.json` 的根節點必須是 `categories` 物件，固定包含三個分類鍵值：`portrait`（人像攝影）、`event`（活動紀錄）、`street`（旅遊街拍）。

- `portrait` 與 `event` 底下是 `activities` 陣列（「活動」導向）。
- `street` 底下是 `albums` 陣列（「相簿」導向），結構與 activities 不同。

```json
{
  "categories": {
    "portrait": {
      "displayName": "人像攝影",
      "activities": [
        {
          "activityId": "act_20260315_zoe",
          "activityName": "Zoe 個人寫真",
          "personName": "Zoe",
          "date": "2026-03-15",
          "photos": [
            {
              "photoId": "p_0001",
              "filename": "zoe_001.jpg",
              "url": "/photos/portrait/act_20260315_zoe/zoe_001.jpg",
              "thumbUrl": "/photos/portrait/act_20260315_zoe/thumb_zoe_001.jpg",
              "width": 4000,
              "height": 6000,
              "orderIndex": 1,
              "alt": "",
              "tags": ["寫真", "戶外"]
            }
          ]
        }
      ]
    },
    "event": {
      "displayName": "活動紀錄",
      "activities": [
        {
          "activityId": "act_20260420_wedding_amy",
          "activityName": "Amy 婚禮紀錄",
          "personName": null,
          "date": "2026-04-20",
          "photos": []
        }
      ]
    },
    "street": {
      "displayName": "旅遊街拍",
      "albums": [
        {
          "albumId": "album_2026_tokyo",
          "albumName": "東京散策",
          "occasion": "2026 東京旅行",
          "date": "2026-01-10",
          "tags": ["日本", "街拍"],
          "coverPhotoId": "p_1001",
          "photos": [
            {
              "photoId": "p_1001",
              "filename": "tokyo_001.jpg",
              "url": "/photos/street/album_2026_tokyo/tokyo_001.jpg",
              "thumbUrl": "/photos/street/album_2026_tokyo/thumb_tokyo_001.jpg",
              "width": 6000,
              "height": 4000,
              "orderIndex": 1,
              "alt": "",
              "tags": ["夜景"]
            }
          ]
        }
      ]
    }
  }
}
```

### 欄位說明

- `activityId`(字串):格式 `act_{YYYYMMDD}_{slug}`，例如 `act_20260315_zoe`。
- `albumId`(字串):格式 `album_{YYYY}_{slug}`，例如 `album_2026_tokyo`。
- `activityName` / `albumName`(字串):顯示名稱。
- `personName`(字串或 null):僅 `portrait` 有意義；`event` 一律為 `null`。
- `occasion`(字串或 null):僅 `street` 相簿使用，描述旅行/場合。
- `date`(字串):格式 `YYYY-MM-DD`。
- `tags`(陣列):字串標籤陣列，可為空陣列 `[]`。
- `coverPhotoId`(字串或 null):僅 `street` 相簿使用，必須等於 `photos` 中某一筆的 `photoId`（預設為第一張）。
- `photoId`(字串):格式 `p_{4位數零填充流水號}`，例如 `p_0001`。**全域遞增**（跨整份 JSON、跨所有分類共用一個計數器），不可分類各自從 1 開始, 不可重複。
- `filename`(字串):壓縮輸出後的檔名（含副檔名，未編碼）。
- `url` / `thumbUrl`(字串):必須是 `r2BaseUrl + encodeURIComponent(filename)` 組成的完整網址，`thumbUrl` 對應縮圖檔名（`thumb_` 前綴）。
- `width` / `height`(數字):主圖（非縮圖）的實際輸出尺寸，來自 compress.js 執行時 sharp 的真實輸出結果。
- `orderIndex`(數字):同一個 activity/album 內從 1 開始遞增，決定顯示順序。
- `alt`(字串):替代文字，預設空字串 `""`。

## 2. R2 網址與中文檔名編碼規則

- 目前**暫時**使用的 R2 base URL 前綴固定為：`https://pub-7f52f0ce64e04ac9b534b404269eb8f3.r2.dev/`（之後正式網址確定後才可更換，更換時需同步更新 `compress.js` 的 `r2BaseUrl` 常數與本文件）。
- 原始照片檔名可能包含中文字（例如「歐美翊」），組成 `url`/`thumbUrl` 時一律必須對檔名執行 `encodeURIComponent`，讓中文與空白字元正確轉換為百分號編碼（例如空白 → `%20`、中文字 → `%E6%AD%90%E7%BE%8E%E7%BF%81` 這類 UTF-8 百分號編碼）。
- 禁止手動拼接未編碼的中文網址，也禁止對已編碼字串重複編碼。

## 3. 寫入規範 (Write Rules)

任何對 `albums.json` 的修改，完成後必須依序執行：

1. **格式驗證**:修改後立即用 `JSON.parse()` 讀取整個檔案，確認語法合法，才能回報「已完成」。如果驗證失敗，必須自己修正到驗證通過為止，絕對不可以在未驗證的狀態下告訴使用者已修改完成。

2. **禁止非法語法**:JSON 檔案內容絕對不能出現 `//` 或 `/* */` 這類註解語法，即使只是暫時性的說明或除錯用途。

3. **URL 格式檢查**:所有 `url` 與 `thumbUrl` 欄位必須是純網址字串，禁止出現 markdown 超連結語法（例如 `[文字](網址)`），也必須確認網址已經過 `encodeURIComponent` 正確編碼（見第 2 節）。

4. **coverPhotoId 同步規則**（僅 `street`）:`coverPhotoId` 必須永遠等於該相簿 `photos` 陣列中某一筆的 `photoId`（預設第一張）。如果程式邏輯改動了 `photos` 陣列的順序或內容，必須同步檢查並更新 `coverPhotoId`。

5. **photoId 全域遞增規則**:新增照片前，必須先讀取整份 `albums.json` 中所有分類、所有 activities/albums 內出現過的最大 `photoId` 數字部分，新照片的 `photoId` = 最大值 + 1（4 位數零填充），不可以憑空指定或猜測數字，也不可以跨分類重複。

6. **orderIndex 規則**:同一個 activity/album 內新增照片時，`orderIndex` 必須接續該 activity/album 現有的最大值 + 1，不可從 1 重新開始（除非該 activity/album 是全新建立）。

7. **activityId / albumId 一致性**:同一個 slug + date（activities）或同一個 slug + 年份（albums）再次執行時，必須視為同一筆 activity/album，將新照片附加進其 `photos` 陣列，不可產生重複的 activity/album 項目。

8. **修改前備份**:對 `albums.json` 做任何寫入操作前，必須先複製一份備份（`albums.json.bak`），避免寫入失敗時原始資料遺失。

## 4. compress.js 相關規範

- 每次執行需先詢問分類（`portrait` / `event` / `street`），依分類決定要收集的欄位：
  - `portrait`:活動名稱、代碼 slug、人物名稱（可留空 → `null`）、日期、標籤。
  - `event`:活動名稱、代碼 slug、日期，`personName` 固定為 `null`。
  - `street`:相簿名稱、代碼 slug、occasion、日期、標籤。
- 圖片壓縮完成後，必須同時產生**主圖**（寬度 2000px）與**縮圖**（寬度 800px，檔名前綴 `thumb_`）兩份 webp 輸出，兩者都要各自組出 `url` / `thumbUrl`。
- 寫入 `albums.json` 的 `url` / `thumbUrl` 欄位前，必須確認檔名已完成 `encodeURIComponent` 編碼。
- 每次執行處理新照片後，必須依照上述第 5 點的 photoId 全域遞增規則與第 6 點的 orderIndex 規則，正確計算新照片的 `photoId` 與 `orderIndex`，不可以覆蓋既有照片的欄位。

### R2 自動上傳

- `compress.js` 會讀取 `G:\SharpProject\.env`（範本見 `.env.example`）內的 `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME`，透過 S3 相容 API（endpoint `https://{account_id}.r2.cloudflarestorage.com`）自動把主圖與縮圖上傳到 R2，上傳用的 Key 為**未編碼**的原始檔名（`filename` / `thumb_檔名`），與寫入 JSON 的 `url`（已 `encodeURIComponent` 編碼）分開處理，不可混用。
- 若 `.env` 缺少任一必要變數，腳本會印出警告並跳過上傳，僅完成壓縮與寫入 `albums.json`，此時使用者需自行手動上傳 `output` 內的檔案到 R2。
- `.env` 內含機密憑證，絕對不可提交到 git（已在 `.gitignore` 中排除），也不可以在對話或程式碼註解中明文寫出真實的 Access Key / Secret Key。

## 5. 前端注意事項

前端頁面（例如 `Home.vue`、相簿頁面）若仍以舊版扁平陣列格式讀取 `albums.json`，在改用本規範的巢狀 `categories` 結構後將讀不到資料，需另行改寫前端讀取邏輯以配合新結構（非本文件範疇，修改前端時需一併確認）。
