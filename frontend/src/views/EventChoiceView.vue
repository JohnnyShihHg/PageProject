<template>
  <div class="album-page">
    <Navbar />

    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">Event</h1>
      </header>
    </div>

    <div class="album-grid">
      <router-link
        v-for="option in options"
        :key="option.key"
        :to="option.to"
        class="album-card"
      >
        <div
          class="album-cover"
          :style="{ backgroundImage: `url(${option.previewUrl})`, backgroundPosition: option.backgroundPosition }"
        ></div>
        <div class="album-info">
          <h3>{{ option.displayName }}</h3>
          <p>{{ option.count }} 張照片</p>
        </div>
      </router-link>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import { loadAlbums } from '../api/albums';

const options = ref([]);

function isPortraitOrientation(photo) {
  return Boolean(photo && photo.height > photo.width);
}

function buildOption(albumsData, key, to) {
  const category = albumsData.categories[key];
  const photos = category.activities.flatMap(activity => activity.photos);
  const photo = photos.length ? photos[Math.floor(Math.random() * photos.length)] : null;
  return {
    key,
    to,
    displayName: category.displayName,
    count: photos.length,
    previewUrl: photo ? photo.url : '',
    backgroundPosition: isPortraitOrientation(photo) ? '50% 25%' : 'center'
  };
}

onMounted(async () => {
  try {
    const albumsData = await loadAlbums();
    options.value = [
      buildOption(albumsData, 'portrait', '/event/portrait'),
      buildOption(albumsData, 'event', '/event/activity')
    ];
  } catch (err) {
    console.error(err);
  }
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

@media (max-width: 1024px) {
  .content-wrapper {
    max-width: 85%;
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    max-width: 100%;
  }
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.album-card {
  position: relative;
  display: block;
  height: 70vh;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.album-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: #e5e7eb;
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.album-card:hover .album-cover {
  transform: scale(1.05);
}

.album-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2.5rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent);
  color: #ffffff;
  box-sizing: border-box;
}

.album-info h3 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.4rem 0;
}

.album-info p {
  font-size: 0.95rem;
  color: #e5e7eb;
  margin: 0;
}

@media (max-width: 768px) {
  .album-grid {
    grid-template-columns: 1fr;
  }

  .album-card {
    height: 50vh;
  }
}
</style>
