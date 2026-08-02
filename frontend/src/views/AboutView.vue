<template>
  <div class="about-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">About</h1>
      </header>

      <div class="about-content">
        <p>ZHENDOKU | 石佳弘</p>
        <p>用鏡頭記錄每一個值得被留下的瞬間，無論是靜謐專注的人像，或是熱鬧真實的活動現場，都希望能捕捉最自然的情緒與光影，為你留下有溫度的畫面。</p>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';

onMounted(() => {
  window.scrollTo(0, 0);
});
</script>

<style scoped>
.about-page {
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

.title {
  font-size: 2.5rem;
  font-weight: 700;
}

.about-content {
  text-align: center;
}

.about-content p {
  font-size: 1rem;
  line-height: 1.9;
  color: #4b5563;
  margin: 0 0 1rem 0;
}

.about-content p:first-child {
  font-weight: 600;
  color: #000000;
  font-size: 1.1rem;
}
</style>
