<template>
  <div>
    <h1>相簿與照片</h1>
    <p class="page-intro">
      共 {{ collections.length }} 個相簿／活動、{{ totalPhotos }} 張照片。點進去可編輯每張照片的 alt。
    </p>

    <AsyncState :loading="loading" :error="error" :on-retry="load">
      <div class="list">
        <article v-for="col in collections" :key="col.id" class="card">
          <RouterLink :to="`/albums/${encodeURIComponent(col.id)}`" class="thumb">
            <img v-if="cover(col)" :src="cover(col)" :alt="col.name" loading="lazy" />
            <span v-else class="thumb-empty">無照片</span>
          </RouterLink>

          <div class="body">
            <div class="head">
              <h3>{{ col.name }}</h3>
              <span class="badge">{{ categoryLabel(col.category) }}</span>
            </div>

            <dl class="meta">
              <div><dt>ID</dt><dd><code>{{ col.id }}</code></dd></div>
              <div><dt>日期</dt><dd>{{ col.date }}</dd></div>
              <div><dt>照片</dt><dd>{{ col.photos.length }} 張</dd></div>
              <div v-if="col.personName"><dt>人物</dt><dd>{{ col.personName }}</dd></div>
              <div v-if="col.occasion"><dt>說明</dt><dd>{{ col.occasion }}</dd></div>
              <div>
                <dt>alt</dt>
                <dd :class="{ warn: emptyAltCount(col) > 0 }">
                  {{ emptyAltCount(col) === 0 ? '全部已填' : `${emptyAltCount(col)} 張未填` }}
                </dd>
              </div>
            </dl>

            <div v-if="col.tags.length" class="tags">
              <span v-for="t in col.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </article>
      </div>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AsyncState from '../components/AsyncState.vue'
import { listCollections } from '../api/admin'

const collections = ref([])
const loading = ref(true)
const error = ref(null)

const totalPhotos = computed(() => collections.value.reduce((n, c) => n + c.photos.length, 0))

const CATEGORY_LABELS = { portrait: '人像', event: '活動', street: '街拍' }
const categoryLabel = (key) => CATEGORY_LABELS[key] ?? key

/** 有設封面就用封面，否則用第一張 —— 與 Phase 2 要修的公開站行為保持一致（不隨機） */
function cover(col) {
  if (!col.photos.length) return null
  const picked = col.coverPhotoId && col.photos.find((p) => p.photoId === col.coverPhotoId)
  return (picked ?? col.photos[0]).thumbUrl
}

const emptyAltCount = (col) => col.photos.filter((p) => !p.alt.trim()).length

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await listCollections()
    collections.value = data.collections
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.thumb {
  display: block;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-hover);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--muted);
  font-size: 0.8rem;
}

.head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.head h3 {
  margin: 0;
  font-size: 1.05rem;
}

.badge {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--accent-soft);
  font-size: 0.72rem;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.2rem 1rem;
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
}

.meta > div {
  display: flex;
  gap: 0.4rem;
}

.meta dt {
  color: var(--muted);
  min-width: 2.5em;
}

.meta dd {
  margin: 0;
}

.meta dd.warn {
  color: #c07000;
  font-weight: 600;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

@media (max-width: 640px) {
  .card {
    grid-template-columns: 1fr;
  }

  .thumb {
    max-width: 200px;
  }
}
</style>
