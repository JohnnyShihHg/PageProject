---
name: album-schema
description: 規定 PageProject 專案中 albums.json 的資料結構標準與 compress.js 的寫入規範。
---

# 相簿資料結構與自動寫入規範 (Album Schema Specification)

本文件定義 `G:\PageProject\data\albums.json` 的核心資料模型與 `compress.js` 腳本的處理邏輯。任何針對此專案的修改均須 100% 遵守以下規則。

## 1. 核心 JSON 資料結構 (Data Schema)

`albums.json` 必須為一個相簿物件陣列，每個相簿物件包含以下欄位：

- `id`(數字):相簿遞增 ID
- `name`(字串):相簿顯示名稱，例如 "20260327老弟追櫻花"
- `slug`(字串):英文/數字/減號組合，例如 "20260327-sakura"
- `coverUrl`(字串):必須與 `photos[0].url` 完全一致
- `createdAt`(字串):建立日期，格式 YYYY-MM-DD
- `photos`(陣列):相簿內的照片清單，每個 photo 物件包含：
  - `id`(數字):相簿內照片遞增 ID
  - `title`(字串):原始中文檔名，未編碼，例如 "202607_社大成發ZJS00355"
  - `category`(字串):與該相簿的 `slug` 相同
  - `url`(字串):必須經過 `encodeURIComponent` 編碼的 R2 網址

**純淨、可直接驗證的範例(不含任何註解，複製這段去跑 JSON.parse 應該要成功)：**

```json
[
  {
    "id": 1,
    "name": "20260327老弟追櫻花",
    "slug": "20260327-sakura",
    "coverUrl": "https://pub-xxx.r2.dev/encoded-filename.webp",
    "createdAt": "2026-03-27",
    "photos": [
      {
        "id": 1,
        "title": "202607_社大成發ZJS00355",
        "category": "20260327-sakura",
        "url": "https://pub-xxx.r2.dev/encoded-filename.webp"
      }
    ]
  }
]
```

## 2. 寫入規範 (Write Rules)

任何對 `albums.json` 的修改，完成後必須依序執行：

1. **格式驗證**:修改後立即用 `JSON.parse()` 讀取整個檔案，確認語法合法，才能回報「已完成」。如果驗證失敗，必須自己修正到驗證通過為止，絕對不可以在未驗證的狀態下告訴使用者已修改完成。

2. **禁止非法語法**:JSON 檔案內容絕對不能出現 `//` 或 `/* */` 這類註解語法，即使只是暫時性的說明或除錯用途。

3. **URL 格式檢查**:所有 `url` 與 `coverUrl` 欄位必須是純網址字串，禁止出現 markdown 超連結語法（例如 `[文字](網址)`），也必須確認網址已經過 `encodeURIComponent` 正確編碼。

4. **coverUrl 同步規則**:`coverUrl` 必須永遠等於該相簿 `photos[0].url`。如果程式邏輯改動了 `photos` 陣列的順序或內容，必須同步檢查並更新 `coverUrl`。

5. **ID 遞增規則**:新增相簿或照片前，必須先讀取現有資料中的最大 `id`，新項目的 `id` = 最大值 + 1，不可以憑空指定或猜測數字，也不可以出現重複 id。

6. **修改前備份**:對 `albums.json` 做任何寫入操作前，建議先複製一份備份（例如 `albums.json.bak`），避免寫入失敗時原始資料遺失。

## 3. compress.js 相關規範

- 圖片壓縮/轉檔完成後，寫入 `albums.json` 的 `url` 欄位前，必須確認檔名已完成 `encodeURIComponent` 編碼。
- 每次執行 `compress.js` 處理新照片後，必須依照上述第 5 點的 ID 遞增規則，正確計算新照片的 `id`，不可以覆蓋既有照片的 `id`。
