<template>
  <div class="gallery-page">
    <Navbar />

    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">{{ categoryDisplayName }}</h1>
      </header>

      <div class="masonry-container">
        <masonry-wall
          v-if="!isLoading"
          :items="photos"
          :ssr-columns="1"
          :column-width="300"
          :gap="18"
        >
          <template #default="{ item }">
            <div
              class="photo-item"
              :style="{ aspectRatio: `${item.width} / ${item.height}` }"
              @click="selectedPhoto = item"
            >
              <img :src="item.thumbUrl" :alt="item.alt" loading="lazy" />
            </div>
          </template>
        </masonry-wall>
      </div>
    </div>

    <div v-if="selectedPhoto" class="lightbox" @click="selectedPhoto = null">
      <button class="lightbox-close" @click="selectedPhoto = null" aria-label="關閉">✕</button>
      <img :src="selectedPhoto.url" :alt="selectedPhoto.alt" class="lightbox-image" @click.stop />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import albumsData from '../../../data/albums.json';

const props = defineProps({
  type: {
    type: String,
    required: true
  }
});

const categoryKey = computed(() => (props.type === 'activity' ? 'event' : 'portrait'));
const categoryDisplayName = computed(() => albumsData.categories[categoryKey.value].displayName);

const photos = ref([]);
const isLoading = ref(true);
const selectedPhoto = ref(null);

function handleKeydown(e) {
  if (e.key === 'Escape') selectedPhoto.value = null;
}

onMounted(() => {
  window.scrollTo(0, 0);
  photos.value = albumsData.categories[categoryKey.value].activities.flatMap(activity => activity.photos);
  isLoading.value = false;
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.gallery-page {
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

.masonry-container {
  min-height: 70vh;
}

.photo-item {
  display: block;
  width: 100%;
  cursor: zoom-in;
}

.photo-item img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.photo-item img[src] {
  opacity: 1;
}

.photo-item:hover img {
  transform: scale(1.02);
}

@media (max-width: 1024px) {
  .content-wrapper {
    max-width: 85%;
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    max-width: 100%;
    padding: 2rem 1rem;
  }
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: zoom-out;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  cursor: default;
}

.lightbox-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.5rem;
}
</style>
