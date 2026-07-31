<template>
  <div class="home-container">
    <!-- Premium Header/Navbar -->
    <Navbar />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-image-container">
        <img :src="heroImg" alt="Hero Background" class="hero-image" />
      </div>
      <div class="hero-bg-overlay"></div>
      
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="white-title">您好我是</span><br>
          <span class="retro-title">ZHENDOKU</span>
        </h1>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-page">
      <div class="contact-header">
        <h2>聯絡我</h2>
      </div>
      <div class="contact-body">
        <div class="contact-nav">
          <div class="nav-thumb" @click="$router.push('/services/photography')">靜態攝影</div>
          <div class="nav-thumb" @click="$router.push('/services/video')">動態短片</div>
          <div class="nav-thumb" @click="$router.push('/album')">相簿</div>
        </div>
        <div class="contact-info">
          <p>ZHENDOKU | 石佳弘</p>
          <p>聯絡電話：+886 0986056305</p>
          <div class="social-icons">
            <span>Line</span>
            <span>IG</span>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from './Navbar.vue';
import Footer from './Footer.vue';
import heroImg from '../assets/hero.jpg';
</script>

<style>
/* 全域重置，確保沒有頂部空白 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  min-height: 100vh;
  margin-top: 0;
  padding-top: var(--header-height, 80px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  background-color: transparent;
  overflow: hidden;
}

.hero-image-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 94%;
  height: 88vh;
  z-index: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 850px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-title {
  font-size: 5rem;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 2px;
  margin-bottom: 0;
}

.white-title {
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.retro-title {
  color: #fbbf24;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.contact-page {
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
}

.contact-header {
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.contact-header h2 {
  font-size: 4rem;
  color: #000000;
}

.contact-body {
  height: 50%;
  display: flex;
  padding: 2rem;
  gap: 2rem;
}

.contact-nav {
  flex: 2;
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  align-items: center;
}

.nav-thumb {
  width: 120px;
  height: 100px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.nav-thumb:hover {
  background-color: #e5e7eb;
  transform: scale(1.05);
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

</style>
