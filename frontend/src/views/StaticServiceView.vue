<template>
  <div class="service-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">靜態攝影</h1>
        <p class="subtitle">寫真 / 人像 / 商業空間 / 專案紀錄</p>
      </header>

      <div class="service-content">
        <div class="service-intro">
          <h2>捕捉您最真實、動人的瞬間</h2>
          <p>我們提供專業的靜態攝影服務，無論是個人寫真、人像創作或商業寫真，都能透過光影與構圖，為您留下永恆的質感影像。</p>
        </div>

        <div class="pricing-section">
          <h3>預約方案與說明</h3>
          <div class="pricing-cards">
            <div class="pricing-card">
              <h4>個人寫真方案</h4>
              <p class="price">NT$ 3,600 起</p>
              <ul>
                <li>拍攝時間：1.5 - 2 小時</li>
                <li>精修照片：10 張</li>
                <li>全數檔案交件</li>
              </ul>
            </div>
            <div class="pricing-card">
              <h4>商業寫真方案</h4>
              <p class="price">洽詢報價</p>
              <ul>
                <li>依專案規模與需求客製化</li>
                <li>商業授權與完整後製</li>
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
