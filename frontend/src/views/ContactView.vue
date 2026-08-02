<template>
  <div class="contact-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">Contact</h1>
      </header>

      <div class="contact-info">
        <p>ZHENDOKU | 石佳弘</p>
        <p>聯絡電話：+886 0986056305</p>
        <div class="social-icons">
          <span>LINE：shallreturn</span>
          <span>INSTAGRAM：<a class="social-link" href="https://www.instagram.com/j_zh_fc/" target="_blank" rel="noopener noreferrer">j_zh_fc</a></span>
          <span>THREADS：<a class="social-link" href="https://www.threads.com/@j_zh_fc" target="_blank" rel="noopener noreferrer">j_zh_fc</a></span>
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
.contact-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: var(--header-height, 80px);
  background-color: #ffffff;
}

.content-wrapper {
  flex: 1;
  max-width: 700px;
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
  font-size: 2.5rem;
  font-weight: 700;
}

.contact-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #000000;
  text-align: center;
}

.contact-info p {
  margin: 0;
}

.social-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.social-link,
.social-link:link,
.social-link:visited,
.social-link:hover,
.social-link:active {
  color: #000000;
  text-decoration: none;
}
</style>
