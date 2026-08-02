<template>
  <div class="album-page">
    <Navbar />

    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">{{ categoryDisplayName }}</h1>
      </header>

      <!-- 相簿選擇網格 -->
      <div class="album-grid">
        <router-link
          v-for="album in albums"
          :key="album.albumId"
          :to="`/album/${album.albumId}`"
          class="album-card"
        >
          <div
            class="album-cover"
            :style="{ backgroundImage: `url(${album.previewUrl})` }"
          ></div>
          <div class="album-info">
            <h3>{{ album.albumName }}</h3>
            <p>{{ album.photos.length }} 張照片</p>
          </div>
        </router-link>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import albumsData from '../../../data/albums.json';

const albums = ref([]);
const categoryDisplayName = computed(() => albumsData.categories.street.displayName);

onMounted(() => {
  window.scrollTo(0, 0);
  albums.value = albumsData.categories.street.albums.map(album => ({
    ...album,
    previewUrl: album.photos[Math.floor(Math.random() * album.photos.length)]?.thumbUrl ?? ''
  }));
});
</script>

<style scoped>
.album-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: var(--header-height, 80px);
}

.content-wrapper {
  flex: 1;
  max-width: 60%;
  margin: 0 auto;
  padding: 2rem 0;
  color: #000;
  width: 100%;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
}

/* 相簿選擇網格：一行四個，相簿數量增加時自動往下多行 */
.album-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.album-card {
  display: block;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.album-card:hover {
  transform: scale(1.03);
}

.album-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #e5e7eb;
  background-size: cover;
  background-position: center;
  margin-bottom: 0.5rem;
}

.album-info h3 {
  font-size: 1rem;
  font-weight: 600;
}

.album-info p {
  font-size: 0.85rem;
  color: #666;
  font-family: 'Noto Sans TC', sans-serif;
}

@media (max-width: 1024px) {
  .content-wrapper {
    max-width: 85%;
  }

  .album-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    max-width: 100%;
    padding: 2rem 1rem;
  }

  .album-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
