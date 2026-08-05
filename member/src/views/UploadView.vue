<template>
  <div>
    <h1>上傳</h1>
    <p class="page-intro">
      在瀏覽器壓縮後上傳，取代開終端機跑 <code>compress.js</code> 的流程。
      <strong>CLI 不會被移除</strong> —— 大批上傳仍然用它比較快。
    </p>

    <div class="placeholder">
      <h3>Phase 3 尚未實作</h3>
      <ul>
        <li>瀏覽器端用 Canvas 壓成 WebP：主圖 2000px、縮圖 800px、q80（對齊 compress.js）</li>
        <li>
          <strong>Canvas 會丟掉 EXIF</strong>，拍攝日期必須在壓縮前先從原檔讀出來
        </li>
        <li>需要 <code>POST /api/admin/upload</code>，由 Worker 用 R2 binding 寫入</li>
        <li>
          寫入邏輯<strong>必須與 CLI 共用同一段程式</strong>，否則會繞過 filename
          的全域唯一保護（撞名會靜默覆蓋 R2 上的圖檔）
        </li>
        <li>表單欄位對齊 CLI：分類 / 名稱 / slug / occasion / 日期 / 標籤 / alt</li>
      </ul>
    </div>
  </div>
</template>
