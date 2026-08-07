<template>
  <div class="notfound-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="code">404</h1>
        <p class="title">找不到這個頁面</p>
      </header>

      <div class="notfound-content">
        <p>你輸入的網址不存在，或是這個頁面已經被移動了。</p>
        <p class="actions">
          <a href="#" @click.prevent="$router.push('/')">回首頁</a>
          <span class="sep">·</span>
          <a href="#" @click.prevent="$router.push('/album')">看相簿</a>
          <span class="sep">·</span>
          <a href="#" @click.prevent="$router.push('/contact')">聯絡我</a>
        </p>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
</script>

<style scoped>
.notfound-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: var(--header-height, 80px);
  background-color: #ffffff;
}

.content-wrapper {
  flex: 1;
  max-width: 60%;
  margin: 0 auto;
  padding: 3rem 2rem;
  color: #000;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .content-wrapper {
    max-width: 85%;
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    max-width: 100%;
  }
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.code {
  font-size: 5rem;
  font-weight: 900;
  line-height: 1;
  margin: 0 0 0.5rem 0;
  letter-spacing: 2px;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.notfound-content {
  text-align: center;
}

.notfound-content p {
  font-size: 16px;
  line-height: 1.9;
  color: #000000;
  margin: 0 0 1rem 0;
}

.actions {
  margin-top: 2rem;
}

.actions a {
  color: #000000;
  text-decoration: underline;
  cursor: pointer;
}

.actions a:hover {
  opacity: 0.6;
}

.sep {
  margin: 0 0.75rem;
  color: #999;
}
</style>
