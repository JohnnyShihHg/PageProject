<template>
  <div>
    <h1>標籤</h1>
    <p class="page-intro">管理標籤本身，以及它們掛在哪些相簿與照片上。</p>

    <div class="placeholder">
      <h3>Phase 1 尚未實作</h3>
      <ul>
        <li>
          <code>tags</code> / <code>photo_tags</code> / <code>collection_tags</code>
          三張表都已存在，但<strong>目前沒有任何 API 能操作它們</strong>，要從零補。
        </li>
        <li>需要 <code>GET / POST / DELETE /api/admin/tags</code></li>
        <li>
          注意 album-schema 的規則：street 的標籤掛在<strong>相簿</strong>上，
          portrait / event 掛在<strong>每張照片</strong>上。
        </li>
      </ul>
    </div>
  </div>
</template>
