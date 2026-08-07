<template>
  <div class="about-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">About</h1>
      </header>

      <div class="about-content">
        <p class="about-name">{{ content['about.name'] }}</p>
        <p>{{ content['about.intro'] }}</p>
        <p class="about-services">{{ content['about.services'] }}</p>
        <p>{{ content['about.sns'] }}</p>
        <p class="about-quote">{{ content['about.quote'] }}</p>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import { loadContent } from '../api/content';

/**
 * 這份 fallback 是原本寫死在這個檔案裡的文字，一字不改地留在這裡。
 * D4 決策：抓不到 D1 的文案時用這個，絕不能讓 About 頁空白。
 * 後台改文案不會動到這裡 —— 這是「API 掛掉時」的最後一道防線，不是預設值。
 */
const FALLBACK = {
  'about.name': 'HI,我是石佳弘',
  'about.intro': '做過不少事情、幹過不少鳥事，同時帶著各位到處走走，攝影這件事情總能把這些瞬間記錄下來。',
  'about.services': '人像攝影 / 活動紀錄 / 旅行隨團攝影',
  'about.sns': '歡迎到我的SNS觀看其他照片。',
  'about.quote': 'Per aspera ad astra.',
};

const content = reactive({ ...FALLBACK });

onMounted(async () => {
  try {
    const data = await loadContent();
    // 逐欄覆蓋而不是整包取代：就算 API 只回了部分欄位（或多了未知欄位），
    // 其餘欄位仍然是 fallback，不會因為一個欄位缺漏就讓整段變成 undefined。
    for (const key of Object.keys(FALLBACK)) {
      if (typeof data[key] === 'string' && data[key].trim()) content[key] = data[key];
    }
  } catch (err) {
    // 抓不到就是抓不到，畫面已經是 FALLBACK，不需要額外處理，
    // 但留一筆 log 方便之後從 Cloudflare 的 observability 查有沒有異常。
    console.error('載入站台文案失敗，顯示內建文字:', err);
  }
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
