<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-name">ZHENDOKU</span>
        <span class="brand-sub">管理後台</span>
      </div>

      <nav class="nav">
        <RouterLink to="/" class="nav-item">總覽</RouterLink>
        <RouterLink to="/albums" class="nav-item">相簿與照片</RouterLink>
        <RouterLink to="/tags" class="nav-item">標籤</RouterLink>
        <RouterLink to="/upload" class="nav-item">上傳</RouterLink>
        <RouterLink to="/content" class="nav-item">站台文案</RouterLink>
      </nav>

      <!--
        這裡原本有一個「未啟用認證」的警告框，用來在 Cloudflare Access 上線之前
        提醒不要把寫入憑證放進部署版本。2026-08-06 Phase 6 完成、Access 正式生效後移除 ——
        留著會變成錯誤資訊，比沒有更糟。
      -->
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.75rem 1.25rem;
  border-right: 1px solid var(--line);
  background: var(--surface);
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.brand-name {
  font-weight: 700;
  letter-spacing: 1px;
}

.brand-sub {
  font-size: 0.8rem;
  color: var(--muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  padding: 0.55rem 0.7rem;
  border-radius: 6px;
  color: var(--text);
  text-decoration: none;
  font-size: 0.925rem;
}

.nav-item:hover {
  background: var(--surface-hover);
}

.nav-item.router-link-exact-active {
  background: var(--accent-soft);
  font-weight: 600;
}

.content {
  padding: 2.5rem 3rem;
  min-width: 0;
}

@media (max-width: 800px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .content {
    padding: 1.5rem 1.25rem;
  }
}
</style>
