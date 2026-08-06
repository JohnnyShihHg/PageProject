<template>
  <header class="navbar" ref="navbarRef">
    <nav class="nav-links">
      <router-link to="/" class="nav-link" :class="{ active: isHomeActive }">Home</router-link>
      <router-link to="/event" class="nav-link" :class="{ active: isEventActive }">Event</router-link>
      <router-link to="/album" class="nav-link" :class="{ active: isStreetActive }">Street & Travel</router-link>
      <router-link to="/about" class="nav-link" :class="{ active: isAboutActive }">About</router-link>
      <router-link to="/contact" class="nav-link" :class="{ active: isContactActive }">Contact</router-link>
    </nav>
    <button
      class="nav-toggle"
      type="button"
      :aria-expanded="isMenuOpen"
      aria-label="Toggle navigation menu"
      @click="isMenuOpen = !isMenuOpen"
    >
      <span class="nav-toggle-bar" :class="{ open: isMenuOpen }"></span>
      <span class="nav-toggle-bar" :class="{ open: isMenuOpen }"></span>
      <span class="nav-toggle-bar" :class="{ open: isMenuOpen }"></span>
    </button>
    <transition name="nav-mobile-fade">
      <nav v-if="isMenuOpen" class="nav-links-mobile" @click="isMenuOpen = false">
        <router-link to="/" class="nav-link" :class="{ active: isHomeActive }">Home</router-link>
        <router-link to="/event" class="nav-link" :class="{ active: isEventActive }">Event</router-link>
        <router-link to="/album" class="nav-link" :class="{ active: isStreetActive }">Street & Travel</router-link>
        <router-link to="/about" class="nav-link" :class="{ active: isAboutActive }">About</router-link>
        <router-link to="/contact" class="nav-link" :class="{ active: isContactActive }">Contact</router-link>
      </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isHomeActive = computed(() => route.path === '/');
const isEventActive = computed(() => route.path.startsWith('/event'));
const isStreetActive = computed(() => route.path.startsWith('/album'));
const isAboutActive = computed(() => route.path.startsWith('/about'));
const isContactActive = computed(() => route.path.startsWith('/contact'));

const navbarRef = ref(null);
const isMenuOpen = ref(false);

watch(() => route.path, () => {
  isMenuOpen.value = false;
});

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
  border-bottom: 1px solid #e5e7eb;
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

.nav-link:hover,
.nav-link.active {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .navbar {
    padding: 1.25rem 2rem;
  }
}

.nav-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.nav-toggle-bar {
  display: block;
  width: 24px;
  height: 2px;
  background-color: #000000;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.nav-toggle-bar.open:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.nav-toggle-bar.open:nth-child(2) {
  opacity: 0;
}

.nav-toggle-bar.open:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.nav-links-mobile {
  display: none;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  .navbar {
    padding: 1rem 1.5rem;
    justify-content: flex-end;
  }
  .nav-toggle {
    display: flex;
  }
  .nav-links-mobile {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 0.5rem 1.5rem 1rem;
    box-sizing: border-box;
    gap: 1rem;
  }
}

.nav-mobile-fade-enter-active,
.nav-mobile-fade-leave-active {
  transition: opacity 0.15s ease;
}

.nav-mobile-fade-enter-from,
.nav-mobile-fade-leave-to {
  opacity: 0;
}
</style>
