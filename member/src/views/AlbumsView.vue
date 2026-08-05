<template>
  <div>
    <h1>相簿與照片</h1>
    <p class="page-intro">列出所有相簿，編輯名稱、日期、occasion 與每張照片的 alt。</p>

    <div class="placeholder">
      <h3>Phase 1 尚未實作</h3>
      <ul>
        <li>需要 <code>GET /api/admin/collections</code>（PageWorker 目前沒有這個端點）</li>
        <li>需要 <code>PATCH /api/admin/collections/:id</code></li>
        <li>需要 <code>PATCH /api/admin/photos/:id</code>（改 alt 與標籤）</li>
      </ul>
    </div>
  </div>
</template>
