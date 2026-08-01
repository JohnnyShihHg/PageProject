<template>
  <header class="navbar" ref="navbarRef">
    <nav class="nav-links">
      <router-link to="/" class="nav-link">Home</router-link>
      <span class="nav-link">Event</span>
      <span class="nav-link">Street & Travel</span>
      <span class="nav-link">About</span>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const navbarRef = ref(null);

let resizeObserver = null;

const updateHeaderHeight = () => {
  if (navbarRef.value) {
    const height = navbarRef.value.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  }
};

onMounted(() => {
  updateHeaderHeight();
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
  border: none;
  box-shadow: none;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
  align-items: center;
}

.nav-link {
  color: #000000;
  text-decoration: none;
  font-size: 18px;
  font-weight: 500;
  transition: color 0.3s ease;
  cursor: pointer;
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
