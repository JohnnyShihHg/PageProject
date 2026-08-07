<template>
  <div class="home-container">
    <!-- Premium Header/Navbar -->
    <Navbar />

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="content-wrapper">
        <div class="hero-image-container">
          <!--
            四個尺寸由 src/assets/hero.webp（2400x1600 母片）以 sharp q80 產生。
            上限鎖在 1600：加更大的候選會讓高解析桌機下載得比原本更多，LCP 反而退步。
            sizes 對應 .content-wrapper 的三段斷點（100% / 85% / 60%），略為高估以求安全。
            ⚠️ 改這裡的 srcset/sizes 時，index.html 的 preload 必須同步改，
               不然 preload 會抓到不同的檔案，變成下載兩張圖。
          -->
          <img
            src="/hero.webp"
            srcset="/hero-768.webp 768w, /hero-1024.webp 1024w, /hero-1280.webp 1280w, /hero.webp 1600w"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 60vw"
            alt="夜晚街頭人群的黑白攝影作品"
            class="hero-image"
            fetchpriority="high"
          />
          <div class="hero-bg-overlay"></div>

          <div class="hero-content">
            <h1 class="hero-title">
              <span class="white-title">HI, I'm</span><br>
              <span class="retro-title">ZHENDOKU</span>
            </h1>
          </div>
        </div>
      </div>
    </section>

    <!-- Intro Section -->
    <section class="intro-section">
      <div class="content-wrapper">
        <p class="intro-text">用鏡頭記錄每一個值得被留下的瞬間，無論是靜謐專注的人像，或是熱鬧真實的活動現場，都希望能為你捕捉最自然的情緒與光影，留下有溫度的畫面。</p>
      </div>
    </section>

    <!-- Services Section -->
    <section id="projects" class="services-section">
      <div class="content-wrapper">
        <div class="service-panel">
          <div class="service-text">
            <h3 class="service-link" @click="$router.push('/event/portrait')">人像寫真</h3>
            <p>捕捉自然神韻與獨特氣質，提供個人形象、生活寫真、閨蜜、情侶與婚紗等人像攝影服務，用鏡頭留下最真實的自己。</p>
          </div>
          <div
            v-if="portraitPhoto"
            class="service-placeholder has-photo service-link"
            @click="$router.push('/event/portrait')"
          >
            <img
              :src="portraitPhoto.url"
              :alt="portraitPhoto.alt || '人像寫真'"
              :class="{ 'crop-top': isPortraitOrientation(portraitPhoto) }"
              loading="lazy"
            />
          </div>
          <div v-else class="service-placeholder service-link" @click="$router.push('/event/portrait')">照片準備中</div>
        </div>
        <div class="service-panel">
          <div class="service-text">
            <h3 class="service-link" @click="$router.push('/event/activity')">活動紀錄</h3>
            <p>忠實記錄現場每一刻精彩瞬間，提供婚禮紀錄、講座論壇、企業活動、展演側錄等專業攝影與剪輯服務，讓回憶完整保存。</p>
          </div>
          <div
            v-if="eventPhoto"
            class="service-placeholder has-photo service-link"
            @click="$router.push('/event/activity')"
          >
            <img
              :src="eventPhoto.url"
              :alt="eventPhoto.alt || '活動紀錄'"
              :class="{ 'crop-top': isPortraitOrientation(eventPhoto) }"
              loading="lazy"
            />
          </div>
          <div v-else class="service-placeholder service-link" @click="$router.push('/event/activity')">照片準備中</div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-page">
      <div class="content-wrapper">
        <div class="contact-body">
          <div class="contact-nav">
            <div class="nav-thumb" @click="$router.push('/event/portrait')">Portrait</div>
            <div class="nav-thumb" @click="$router.push('/event/activity')">Event</div>
            <div class="nav-thumb" @click="$router.push('/album')">Street & Travel</div>
            <div class="nav-thumb" @click="$router.push('/about')">About</div>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Navbar from './Navbar.vue';
import Footer from './Footer.vue';
import { loadAlbums } from '../api/albums';

function pickRandomPhoto(category) {
  const photos = category.activities.flatMap(activity => activity.photos);
  return photos.length ? photos[Math.floor(Math.random() * photos.length)] : null;
}

const portraitPhoto = ref(null);
const eventPhoto = ref(null);

onMounted(async () => {
  try {
    const data = await loadAlbums();
    portraitPhoto.value = pickRandomPhoto(data.categories.portrait);
    eventPhoto.value = pickRandomPhoto(data.categories.event);
  } catch (err) {
    // 取不到資料時維持「照片準備中」佔位，不讓整頁掛掉
    console.error(err);
  }
});

function isPortraitOrientation(photo) {
  return Boolean(photo && photo.height > photo.width);
}
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

.content-wrapper {
  max-width: 60%;
  margin: 0 auto;
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

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  margin-top: 0;
  padding: calc(var(--header-height, 80px) + 5rem) 2rem 0;
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
  position: relative;
  height: 51vh;
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
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  z-index: 10;
  max-width: 850px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.hero-title {
  font-size: 2.5rem;
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
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

/* Intro Section */
.intro-section {
  width: 100%;
  padding: 5rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  box-sizing: border-box;
}

.intro-text {
  max-width: 700px;
  text-align: center;
  font-size: 14px;
  line-height: 1.9;
  color: #4b5563;
  margin: 0 auto;
}

/* Services Section */
.services-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.service-panel {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.service-panel:first-child {
  border-top: 1px solid #e5e7eb;
}

.service-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem;
  box-sizing: border-box;
}

.service-text h3 {
  font-size: 18px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 1rem 0;
}

.service-link {
  cursor: pointer;
}

.service-text h3.service-link:hover {
  text-decoration: underline;
}

.service-text p {
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
  max-width: 480px;
  margin: 0;
}

.service-placeholder {
  flex: 1;
  height: 400px;
  background-color: #f3f4f6;
  border: 1px dashed #d1d5db;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #9ca3af;
  font-size: 0.95rem;
  box-sizing: border-box;
  overflow: hidden;
}

.service-placeholder.has-photo {
  border: none;
  background-color: transparent;
  padding: 0;
}

.service-placeholder.has-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.service-placeholder.has-photo img.crop-top {
  object-position: 50% 25%;
}

@media (max-width: 768px) {
  .service-panel {
    flex-direction: column;
  }

  .service-text {
    padding: 2.5rem 1.5rem;
  }

  .service-placeholder {
    height: 280px;
  }
}

.contact-page {
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 4rem 0;
  box-sizing: border-box;
}

.contact-body {
  display: flex;
  padding: 2rem;
  gap: 2rem;
}

.contact-nav {
  flex: 2;
  display: grid;
  grid-template-columns: repeat(2, 198px);
  grid-template-rows: repeat(2, 165px);
  gap: 0.75rem;
  justify-content: center;
  align-content: center;
}

.nav-thumb {
  width: 198px;
  height: 165px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #000000;
  font-size: 17px;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.nav-thumb:hover {
  background-color: #e5e7eb;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .contact-body {
    padding: 1.5rem;
  }

  .contact-nav {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .nav-thumb {
    width: 100%;
    height: auto;
    padding: 1.5rem;
    box-sizing: border-box;
  }
}

</style>
