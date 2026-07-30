<template>
  <div class="album-page">
    <Navbar />
    
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">相簿</h1>
      </header>

    <!-- 相簿選擇器 -->
    <div class="album-carousel-container">
      <div class="album-carousel">
        <div 
          v-for="album in albums" 
          :key="album.id" 
          class="album-card"
          :class="{ 'active': selectedAlbumId === album.id }"
          @click="selectedAlbumId = album.id"
        >
          <div class="album-cover" :style="{ backgroundImage: `url(${album.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
          <div class="album-info">
            <h3>{{ album.name }}</h3>
            <p>{{ album.count }} 張照片</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 瀑布流內容區塊 -->
    <div class="masonry-container">
      <masonry-wall 
        v-if="!isLoading"
        :items="selectedAlbum?.photos ?? []" 
        :ssr-columns="1"
        :column-width="300" 
        :gap="18"
      >
        <template #default="{ item }">
          <div 
            class="photo-item"
            :style="{ aspectRatio: `${item.width} / ${item.height}` }"
          >
            <img :src="item.url" :alt="item.title" loading="lazy" />
          </div>
        </template>
      </masonry-wall>
    </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import albumsData from '../../../data/albums.json';

const albums = ref([]);
const selectedAlbumId = ref(null);
const isLoading = ref(true);

onMounted(() => {
  albums.value = albumsData.map(album => ({
    ...album,
    count: album.photos.length
  }));
  if (albums.value.length > 0) {
    selectedAlbumId.value = albums.value[0].id;
    isLoading.value = false;
  }
});

watch(selectedAlbumId, async () => {
  isLoading.value = true;
  await nextTick();
  // 模擬載入延遲，確保 DOM 更新後顯示
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
});

const selectedAlbum = computed(() => 
  albums.value.find(a => a.id === selectedAlbumId.value)
);
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

/* Carousel */
.album-carousel-container {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-bottom: 4rem;
  white-space: nowrap;
}

.album-carousel-container::-webkit-scrollbar {
  display: none;
}

.album-carousel {
  display: flex;
  gap: 1.5rem;
  padding-bottom: 1rem;
}

.album-card {
  flex: 0 0 200px;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.album-card {
  flex: 0 0 200px;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.album-card:hover {
  transform: scale(1.03);
}

.album-card:not(.active) {
  opacity: 0.6;
  filter: brightness(0.7) grayscale(30%);
}

.album-cover {
  width: 100%;
  height: 150px;
  background-color: #e5e7eb;
  overflow: hidden;
  margin-bottom: 0.5rem;
  transition: transform 0.2s ease;
}

.album-info h3 {
  font-size: 1rem;
  font-weight: 600;
}

.album-info p {
  font-size: 0.85rem;
  color: #666;
}

/* Masonry */
.masonry-container {
  min-height: 70vh;
}

.photo-item {
  /* 確保圖片容器不會強制限制高度 */
  display: block;
  width: 100%;
}

.photo-item img {
  width: 100%;
  height: auto;
  display: block;
  /* 移除 object-fit 屬性，讓圖片依據寬度自動調整高度 */
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.photo-item img[src] {
  opacity: 1;
}

.photo-item:hover img {
  transform: scale(1.02);
}

/* Skeleton */
.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
