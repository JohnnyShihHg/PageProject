<template>
  <nav class="navbar">
    <router-link to="/" class="nav-link">首頁</router-link>
    <router-link to="/album" class="nav-link">相簿</router-link>
  </nav>
  <router-view />
</template>

<style>
.navbar {
  padding: 1.5rem 2rem;
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.nav-link {
  text-decoration: none;
  color: #000;
  font-weight: 500;
}

.nav-link:hover {
  color: #666;
}
</style>
