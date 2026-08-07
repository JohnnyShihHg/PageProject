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
import { loadAlbums } from '../api/albums';

const props = defineProps({
  albumId: {
    type: String,
    required: true
  }
});

const RELATED_ALBUMS_LIMIT = 4;

const albumsData = ref(null);
const streetAlbums = computed(() => albumsData.value?.categories.street.albums ?? []);

const album = computed(() =>
  streetAlbums.value.find((a) => a.albumId === props.albumId)
);

const relatedAlbums = computed(() => {
  if (!album.value || !album.value.tags?.length) return [];
  const currentTags = new Set(album.value.tags);
  return streetAlbums.value
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

onMounted(async () => {
  window.scrollTo(0, 0);
  try {
    albumsData.value = await loadAlbums();
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

.header-spacer {
  height: 106px;
}

.masonry-container {
  min-height: 70vh;
}

/*
  間距刻意全部掛在 .related-title 上，不放在 .related-section。

  原本是 .related-section 帶 margin-top: 4rem（64px）、標題只有 margin-bottom: 1rem，
  所以那 64px 是「標題＋相簿牆」整塊的上緣間距，不是標題自己的 ——
  結果標題上方 64px、下方只有 16px，看起來像黏在下面的相簿上。

  改成由標題自己持有上下的 margin，它就成為視覺上獨立的一列，
  之後要調整疏密只要動這一條規則，不必在兩條規則之間換算。

  上 64px、下 48px 是**刻意不對稱**：下方緊接著的 .group-divider 固定 100px 高、
  文字靠上對齊，所以下方本來就自帶一截留白。上下取相同數值的話，
  看起來反而會像下面空一大塊 —— 這裡要的是視覺平衡，不是數值平衡。
*/
.related-title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 4rem 0 3rem;
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
