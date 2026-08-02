<template>
  <div class="gallery-page">
    <Navbar />

    <div class="content-wrapper">
      <div class="header-spacer"></div>

      <div class="masonry-container">
        <PhotoWall v-if="!isLoading && groups.length" :groups="groups" />
      </div>

      <div v-if="relatedGroups.length" class="related-section">
        <h2 class="related-title">相關相簿</h2>
        <PhotoWall :groups="relatedGroups" />
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import PhotoWall from '../components/PhotoWall.vue';
import albumsData from '../../../data/albums.json';

const props = defineProps({
  albumId: {
    type: String,
    required: true
  }
});

const RELATED_ALBUMS_LIMIT = 4;

const album = computed(() =>
  albumsData.categories.street.albums.find((a) => a.albumId === props.albumId)
);

const relatedAlbums = computed(() => {
  if (!album.value || !album.value.tags?.length) return [];
  const currentTags = new Set(album.value.tags);
  return albumsData.categories.street.albums
    .filter((a) => a.albumId !== album.value.albumId)
    .filter((a) => (a.tags || []).some((tag) => currentTags.has(tag)))
    .slice(0, RELATED_ALBUMS_LIMIT);
});

const relatedGroups = computed(() =>
  relatedAlbums.value.map((a) => ({
    name: a.albumName,
    date: a.date,
    photos: a.photos,
    tags: a.tags
  }))
);

const groups = ref([]);
const isLoading = ref(true);

onMounted(() => {
  window.scrollTo(0, 0);
  if (album.value) {
    groups.value = [
      {
        name: album.value.albumName,
        date: album.value.date,
        photos: album.value.photos,
        tags: album.value.tags
      }
    ];
  }
  isLoading.value = false;
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

.header-spacer {
  height: 106px;
}

.masonry-container {
  min-height: 70vh;
}

.related-section {
  margin-top: 4rem;
}

.related-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

@media (min-width: 1600px) and (max-width: 2200px) {
  .content-wrapper {
    max-width: 68%;
  }
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
</style>
