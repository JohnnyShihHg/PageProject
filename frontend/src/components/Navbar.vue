<template>
  <header class="navbar" ref="navbarRef">
    <nav class="nav-links">
      <span class="nav-link" @click="scrollToSection('projects')">服務項目</span>
      <router-link to="/album" class="nav-link">相簿</router-link>
      <span class="nav-link" @click="scrollToSection('contact')">聯絡我</span>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { nextTick } from 'vue';

const route = useRoute();
const router = useRouter();
const navbarRef = ref(null);

const scrollToSection = async (sectionId) => {
  // 1. 如果當前不在首頁 (/)，先跳轉回首頁
  if (route.path !== '/') {
    await router.push('/');
    await nextTick(); // 等待首頁 DOM 渲染完成
  }

  // 2. 執行平滑滾動到指定區塊
  setTimeout(() => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100); // 微小延遲確保滾動流暢
};
let resizeObserver = null;

const updateHeaderHeight = () => {
  if (navbarRef.value) {
    const height = navbarRef.value.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  }
};

onMounted(() => {
  updateHeaderHeight();
  
  // 使用 ResizeObserver 監聽尺寸變化
  resizeObserver = new ResizeObserver(() => {
    updateHeaderHeight();
  });
  
  if (navbarRef.value) {
    resizeObserver.observe(navbarRef.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1.5rem 4rem;
  padding-right: 20%;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
  background-color: #ffffff;
  /* 移除任何可能的 border-top 或 box-shadow */
  border: none;
  box-shadow: none;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
}

.nav-link {
  color: #000000;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.3s ease;
  cursor: pointer;
}

.nav-link:hover, .nav-link.router-link-active {
  color: #6366f1;
}

@media (max-width: 1024px) {
  .navbar {
    padding: 1.25rem 2rem;
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  .navbar {
    padding: 1rem 1.5rem;
  }
}
</style>
