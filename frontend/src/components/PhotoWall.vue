<template>
  <div class="photo-wall-container">
    <template v-for="group in groups" :key="group.name + group.date">
      <div class="group-divider" :style="{ marginTop: `${gap}px`, marginBottom: `${gap}px` }">
        <span class="group-divider-name">{{ group.name }}</span>
        <span class="group-divider-date">{{ group.date }}</span>
        <span v-if="group.tags && group.tags.length" class="group-divider-tags">{{ group.tags.join('、') }}</span>
      </div>

      <masonry-wall
        :items="group.photos"
        :ssr-columns="1"
        :column-width="columnWidth"
        :max-columns="maxColumns"
        :gap="gap"
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
    </template>

    <div v-if="selectedPhoto" class="lightbox" @click="selectedPhoto = null">
      <button class="lightbox-close" @click="selectedPhoto = null" aria-label="關閉">✕</button>
      <img :src="selectedPhoto.url" :alt="selectedPhoto.alt" class="lightbox-image" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  groups: {
    // Array<{ name: string, date: string, photos: Array }>
    type: Array,
    required: true
  },
  columnWidth: {
    type: Number,
    default: 400
  },
  maxColumns: {
    type: Number,
    default: 4
  },
  gap: {
    type: Number,
    default: 18
  }
});

const selectedPhoto = ref(null);

function handleKeydown(e) {
  if (e.key === 'Escape') selectedPhoto.value = null;
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.group-divider {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.25rem;
  height: 100px;
}

.photo-wall-container > .group-divider:first-child {
  margin-top: 0 !important;
}

.group-divider-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.group-divider-date {
  font-size: 16px;
  color: #999;
  letter-spacing: 0.04em;
}

.group-divider-tags {
  position: absolute;
  right: 0;
  bottom: 0;
  font-size: 14px;
  font-style: italic;
  color: #999;
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
