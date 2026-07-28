<template>
  <div class="album-page">
    <!-- 頂部導航 (假設 App.vue 有全域導航，這裡僅做頁面內容) -->
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
          <div class="album-cover"></div>
          <div class="album-info">
            <h3>{{ album.name }}</h3>
            <p>{{ album.count }} 張照片</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 瀑布流內容區塊 -->
    <div class="masonry-grid">
      <div v-for="n in 10" :key="n" class="photo-item">
        <!-- 圖片佔位 -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selectedAlbumId = ref(1);
const albums = ref([
  { id: 1, name: '旅行日記', count: 24 },
  { id: 2, name: '城市街拍', count: 18 },
  { id: 3, name: '人像攝影', count: 32 },
  { id: 4, name: '自然風光', count: 15 },
  { id: 5, name: '黑白影像', count: 20 },
]);
</script>

<style scoped>
.album-page {
  max-width: 60%;
  margin: 0 auto;
  padding: 2rem 0;
  color: #000;
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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  margin-bottom: 4rem;
}

.album-carousel-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.album-carousel {
  display: flex;
  gap: 1.5rem;
  padding-bottom: 1rem;
}

.album-card {
  flex: 0 0 200px;
  cursor: pointer;
  transition: transform 0.2s;
}

.album-card:hover {
  transform: translateY(-5px);
}

.album-cover {
  width: 100%;
  height: 150px;
  background-color: #e5e7eb;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
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
.masonry-grid {
  column-count: 3;
  column-gap: 1rem;
}

.photo-item {
  break-inside: avoid;
  margin-bottom: 1rem;
  background-color: #e5e7eb;
  border: 1px solid #e5e7eb;
  height: 200px; /* 模擬不同高度 */
}

.photo-item:nth-child(even) {
  height: 300px;
}
</style>
