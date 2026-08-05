<template>
  <div>
    <h1>相簿內容</h1>
    <p class="page-intro">
      collectionId：<code>{{ collectionId }}</code>
    </p>

    <div class="placeholder">
      <h3>Phase 1 / 2 尚未實作</h3>
      <ul>
        <li>照片縮圖牆與逐張 alt 編輯（Phase 1）</li>
        <li>拖曳排序，需要 <code>POST /api/admin/photos/reorder</code>（Phase 2）</li>
        <li>
          設定封面（<code>cover_photo_id</code>）。此欄位在 schema 已存在但沒有任何程式在用，
          公開站的 <code>AlbumView.vue</code> 目前是<strong>隨機</strong>挑一張當封面，Phase 2 一併修掉。
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
  collectionId: { type: String, required: true },
})
</script>
