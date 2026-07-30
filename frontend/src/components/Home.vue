<template>
  <div class="home-container">
    <!-- Premium Header/Navbar -->
    <Navbar @scroll-to="scrollToSection" />

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

      <!-- Scroll Indicator -->
      <div class="scroll-indicator" @click="scrollToFeatures">
        <span class="mouse">
          <span class="wheel"></span>
        </span>
        <span class="scroll-text">向下捲動</span>
      </div>
    </section>

    <!-- Projects Intro -->
    <section id="projects" class="project-page">
      <div class="section-header">
        <h2 class="section-title">項目</h2>
        <p class="section-desc">我們的服務幫你紀錄你的瞬間</p>
      </div>
    </section>

    <!-- Service Pages -->
    <section class="project-page">
      <div class="project-content">
        <div class="project-text">
          <h3>人像</h3>
          <p>捕捉您最真實、動人的瞬間。</p>
        </div>
        <div class="project-image"></div>
      </div>
    </section>

    <section class="project-page">
      <div class="project-content">
        <div class="project-text">
          <h3>短片</h3>
          <p>用動態影像訴說您的故事。</p>
        </div>
        <div class="project-image"></div>
      </div>
    </section>

    <section class="project-page">
      <div class="project-content">
        <div class="project-text">
          <h3>線上相簿</h3>
          <p>隨時隨地，珍藏您的美好回憶。</p>
        </div>
        <div class="project-image"></div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-page">
      <div class="contact-header">
        <h2>聯絡我</h2>
      </div>
      <div class="contact-body">
        <div class="contact-nav">
          <div class="nav-thumb">人像</div>
          <div class="nav-thumb">短片</div>
          <div class="nav-thumb">線上相簿</div>
        </div>
        <div class="contact-info">
          <p>ZHENDOKU | 石佳弘</p>
          <p>聯絡電話：+886 0986056305</p>
          <div class="social-icons">
            <span>Line</span>
            <span>IG</span>
          </div>
        </div>
        <Footer />
      </div>
    </section>
  </div>
</template>

<script setup>
import Navbar from './Navbar.vue';
import Footer from './Footer.vue';
import heroImg from '../assets/hero.jpg';

const scrollToFeatures = () => {
  const element = document.getElementById('projects');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<style>
/* 全域重置，確保沒有頂部空白 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
.home-container {
  width: 100%;
  height: 100vh;
  overflow-y: scroll;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  /* 移除 padding-top，改用 margin-top 確保內容從 Header 下方開始 */
  /* 並且確保不會產生頂部空白 */
  box-sizing: border-box;
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
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
  scroll-snap-align: start;
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

/* Scroll Indicator */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.scroll-indicator:hover {
  opacity: 1;
}

.mouse {
  width: 24px;
  height: 38px;
  border: 2px solid #94a3b8;
  border-radius: 12px;
  position: relative;
  display: block;
}

.wheel {
  width: 4px;
  height: 8px;
  background-color: #6366f1;
  border-radius: 2px;
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  animation: scrollWheel 2s infinite;
}

.scroll-text {
  font-size: 0.75rem;
  color: #000000;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.project-page {
  height: 100vh;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  scroll-snap-align: start;
  box-sizing: border-box;
}

.section-header {
  text-align: center;
}

.section-title {
  font-size: 3rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 1rem;
}

.section-desc {
  font-size: 1.5rem;
  color: #000000;
}

.project-content {
  display: flex;
  width: 100%;
  height: 100%;
}

.project-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem;
}

.project-text h3 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #000000;
}

.project-text p {
  font-size: 1.2rem;
  color: #000000;
}

.project-image {
  flex: 1;
  background-color: #9ca3af;
  border: 1px solid #e5e7eb;
  height: 100%;
}

.contact-page {
  height: 100vh;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
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
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.nav-thumb {
  width: 100px;
  height: 100px;
  background-color: #9ca3af;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  align-items: center;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
  }
}

@keyframes scrollWheel {
  0% {
    opacity: 0;
    top: 6px;
  }
  30% {
    opacity: 1;
  }
  90% {
    opacity: 0;
    top: 22px;
  }
  100% {
    opacity: 0;
    top: 6px;
  }
}
</style>
