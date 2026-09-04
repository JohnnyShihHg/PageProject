<template>
  <div class="gallery-page">
    <Navbar />

    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">{{ categoryDisplayName }}</h1>
      </header>

      <div class="masonry-container">
        <PhotoWall v-if="!isLoading" :groups="groups" />
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
import { loadAlbums } from '../api/albums';

const props = defineProps({
  type: {
    type: String,
    required: true
  }
});

const categoryKey = computed(() => (props.type === 'activity' ? 'event' : 'portrait'));

const albumsData = ref(null);
const categoryDisplayName = computed(
  () => albumsData.value?.categories[categoryKey.value].displayName ?? ''
);

const groups = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    albumsData.value = await loadAlbums();
    // tags 跟 street 的相簿傳一樣的形狀，PhotoWall 才會在兩邊畫出相同的分組標題
    groups.value = albumsData.value.categories[categoryKey.value].activities.map((activity) => ({
      name: activity.activityName,
      date: activity.date,
      photos: activity.photos,
      tags: activity.tags,
      // 點閱統計用。portrait/event 沒有獨立頁，所以不記 album_view，
      // 相簿層級的熱門度由 photo_open 累計出來。
      collectionId: activity.activityId,
      category: categoryKey.value
    }));
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
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
  height: 58px;
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
