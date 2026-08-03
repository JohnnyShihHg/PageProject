<template>
  <div class="about-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">About</h1>
      </header>

      <div class="about-content">
        <p class="about-name">HI,我是石佳弘</p>
        <p>做過不少事情、幹過不少鳥事，同時帶著各位到處走走，攝影這件事情總能把這些瞬間記錄下來。</p>
        <p class="about-services">人像攝影 / 活動紀錄 / 旅行隨團攝影</p>
        <p>歡迎到我的SNS觀看其他照片。</p>
        <p class="about-quote">Per aspera ad astra.</p>
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
  text-align: left;
}

.about-content p {
  font-size: 16px;
  line-height: 1.9;
  color: #000000;
  margin: 0 0 1rem 0;
}

.about-name {
  font-weight: 600;
  color: #000000;
  font-size: 18px;
}

.about-quote {
  font-style: italic;
}
</style>
