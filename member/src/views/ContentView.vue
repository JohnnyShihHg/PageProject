<template>
  <div>
    <h1>站台文案</h1>
    <p class="page-intro">編輯公開站的文字內容，例如 About 頁的自我介紹。</p>

    <div class="placeholder">
      <h3>Phase 4 尚未實作</h3>
      <ul>
        <li>
          目前 About 的文案<strong>寫死在</strong> <code>frontend/src/views/AboutView.vue</code>
        </li>
        <li>要可編輯就得搬進 D1，並新增 <code>GET /api/content</code> 與 <code>PUT /api/admin/content</code></li>
        <li>
          <strong>搬過去時必須保留程式碼內的原文當 fallback</strong> ——
          否則 API 掛掉時 About 頁會整片空白
        </li>
      </ul>
    </div>
  </div>
</template>
