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
        認證刻意排在最後一個 Phase（Johnny 決定）。在 Cloudflare Access 上線之前，
        這個後台是沒有任何保護的公開網址，所以這裡放一個明顯的提示，
        避免有人（包括未來的我）誤以為它已經受保護而把寫入憑證放進部署版本。
      -->
      <div class="warn">
        <strong>未啟用認證</strong>
        <p>Cloudflare Access 尚未設定，此站台目前無保護。部署版本不應帶任何寫入憑證。</p>
      </div>
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

.warn {
  margin-top: auto;
  padding: 0.75rem;
  border: 1px solid var(--warn-line);
  border-radius: 6px;
  background: var(--warn-bg);
  font-size: 0.78rem;
  line-height: 1.6;
}

.warn strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--warn-text);
}

.warn p {
  margin: 0;
  color: var(--muted);
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

  .warn {
    margin-top: 0;
  }

  .content {
    padding: 1.5rem 1.25rem;
  }
}
</style>
