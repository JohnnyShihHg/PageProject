<template>
  <div>
    <h1>總覽</h1>
    <p class="page-intro">
      公開站的相簿開啟與照片點閱次數。資料由訪客瀏覽時累計，可能有幾秒延遲。
    </p>

    <AsyncState :loading="loading" :error="error" :on-retry="load">
      <section class="panel">
        <h2>熱門相簿</h2>
        <p v-if="!data?.topAlbums.length" class="empty">還沒有任何點閱資料。</p>
        <table v-else class="rank">
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th>相簿</th>
              <th class="col-num">開啟</th>
              <th class="col-num">照片點擊</th>
              <th class="col-time">最後活動</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, i) in data.topAlbums" :key="a.collectionId">
              <td class="col-rank">{{ i + 1 }}</td>
              <td>
                <RouterLink :to="`/albums/${encodeURIComponent(a.collectionId)}`">
                  {{ a.albumName ?? a.collectionId }}
                </RouterLink>
                <span class="badge">{{ categoryLabel(a.category) }}</span>
                <span v-if="!a.albumName" class="gone">已刪除</span>
              </td>
              <td class="col-num">{{ a.views || '—' }}</td>
              <td class="col-num">{{ a.photoOpens || '—' }}</td>
              <td class="col-time">{{ relTime(a.lastSeen) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="data?.topAlbums.length" class="foot">
          「開啟」只有街拍相簿會計數（人像／活動沒有獨立頁面）；那兩類看「照片點擊」。
        </p>
      </section>

      <section class="panel">
        <h2>熱門照片</h2>
        <p v-if="!data?.topPhotos.length" class="empty">還沒有任何點閱資料。</p>
        <ul v-else class="photos">
          <li v-for="(p, i) in data.topPhotos" :key="p.photoId">
            <span class="col-rank">{{ i + 1 }}</span>
            <img v-if="p.thumbUrl" :src="p.thumbUrl" :alt="p.alt || p.filename || ''" loading="lazy" />
            <span v-else class="thumb-gone">已刪除</span>
            <div class="pinfo">
              <div class="pfile">{{ p.filename ?? p.photoId }}</div>
              <div class="pmeta">
                <RouterLink :to="`/albums/${encodeURIComponent(p.collectionId)}`">
                  {{ p.albumName ?? p.collectionId }}
                </RouterLink>
                · <span :class="{ noalt: !p.alt }">{{ p.alt || 'alt 未填' }}</span>
              </div>
            </div>
            <div class="pcount">
              <strong>{{ p.opens }}</strong>
              <span class="col-time">{{ relTime(p.lastSeen) }}</span>
            </div>
          </li>
        </ul>
      </section>

      <p v-if="data" class="generated">更新於 {{ relTime(data.generatedAt) }}</p>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AsyncState from '../components/AsyncState.vue'
import { getAnalyticsTop } from '../api/admin'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

const CATEGORY_LABELS = { portrait: '人像', event: '活動', street: '街拍' }
const categoryLabel = (key) => CATEGORY_LABELS[key] ?? key ?? ''

/** SQLite 的 last_seen 是 UTC 的 'YYYY-MM-DD HH:MM:SS'；generatedAt 是 ISO。統一轉相對時間。 */
function relTime(s) {
  if (!s) return ''
  const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return s
  const diff = Date.now() - t
  const min = Math.round(diff / 60000)
  if (min < 1) return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} 小時前`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day} 天前`
  return new Date(iso).toISOString().slice(0, 10)
}

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await getAnalyticsTop()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-intro {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

.panel {
  margin-top: 2rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.panel h2 {
  margin-top: 0;
}

.empty {
  color: var(--muted);
  font-size: 0.9rem;
}

.foot,
.generated {
  margin: 0.75rem 0 0;
  color: var(--muted);
  font-size: 0.78rem;
}

.generated {
  margin-top: 1.5rem;
}

/* --- 相簿表 --- */
.rank {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.rank th,
.rank td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: middle;
}

.rank th {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.8rem;
}

.rank tbody tr:last-child td {
  border-bottom: none;
}

.col-rank {
  width: 2rem;
  color: var(--muted);
  text-align: center;
}

.col-num {
  width: 5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-time {
  width: 6rem;
  color: var(--muted);
  font-size: 0.8rem;
  white-space: nowrap;
}

.badge {
  margin-left: 0.4rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: var(--accent-soft);
  font-size: 0.7rem;
}

.gone,
.thumb-gone {
  margin-left: 0.4rem;
  color: var(--warn-text);
  font-size: 0.72rem;
}

/* --- 照片清單 --- */
.photos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.photos li {
  display: grid;
  grid-template-columns: 2rem 56px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--line);
}

.photos li:last-child {
  border-bottom: none;
}

.photos img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 4px;
  background: var(--surface-hover);
  display: block;
}

.thumb-gone {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 4px;
  background: var(--surface-hover);
  margin: 0;
}

.pinfo {
  min-width: 0;
}

.pfile {
  font-size: 0.85rem;
  word-break: break-all;
}

.pmeta {
  margin-top: 0.15rem;
  color: var(--muted);
  font-size: 0.76rem;
}

.pmeta .noalt {
  color: var(--warn-text);
}

.pcount {
  text-align: right;
  white-space: nowrap;
}

.pcount strong {
  display: block;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}
</style>
