<template>
  <div class="service-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">動態短片</h1>
        <p class="subtitle">Reels / 形象短片 / 影片剪輯</p>
      </header>

      <div class="service-content">
        <div class="service-intro">
          <h2>用動態影像訴說您的故事</h2>
          <p>我們提供專業的動態短片拍攝與剪輯服務，為您的品牌、活動或個人生活留下極具視覺張力的動態回憶。</p>
        </div>

        <div class="pricing-section">
          <h3>預約方案與說明</h3>
          <div class="pricing-cards">
            <div class="pricing-card">
              <h4>Reels 形象短片方案</h4>
              <p class="price">NT$ 4,500 起</p>
              <ul>
                <li>拍攝與剪輯 1 分鐘內短片</li>
                <li>專業調色與音樂授權</li>
                <li>適合 IG / TikTok / 宣傳</li>
              </ul>
            </div>
            <div class="pricing-card">
              <h4>商業宣傳影片</h4>
              <p class="price">洽詢報價</p>
              <ul>
                <li>依專案規模與腳本客製化</li>
                <li>完整前期企劃與後期製作</li>
              </ul>
            </div>
          </div>
        </div>
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
.service-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: var(--header-height, 80px);
  background-color: #ffffff;
}

.content-wrapper {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
  color: #000;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
}

.service-intro {
  margin-bottom: 3rem;
  text-align: center;
}

.service-intro h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.service-intro p {
  font-size: 1.1rem;
  color: #444;
  line-height: 1.6;
}

.pricing-section h3 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.pricing-cards {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.pricing-card {
  flex: 1;
  border: 1px solid #e5e7eb;
  padding: 2rem;
  border-radius: 8px;
  background: #f9fafb;
  text-align: center;
}

.pricing-card h4 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.8rem;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 1.5rem;
}

.pricing-card ul {
  list-style: none;
  padding: 0;
  color: #555;
  line-height: 2rem;
}
</style>
