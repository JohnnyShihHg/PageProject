<template>
  <div>
    <h1>相簿與照片</h1>
    <p class="page-intro">
      共 {{ collections.length }} 個相簿／活動、{{ totalPhotos }} 張照片。點進去可編輯每張照片的 alt。
    </p>

    <AsyncState :loading="loading" :error="error" :on-retry="load">
      <!-- T7：多選刪除操作列。刪除按鈕只在有勾選時出現，平常不會誤按 -->
      <div class="select-bar">
        <label class="select-all">
          <input
            type="checkbox"
            :checked="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
            @change="toggleSelectAll"
          />
          <span>全選</span>
        </label>
        <template v-if="someSelected">
          <span class="dim">
            已選取 {{ selectedIds.length }} 本，共 {{ selectedPhotoCount }} 張照片
          </span>
          <button type="button" class="danger" @click="bulkDialog = true">刪除已選取</button>
          <button type="button" class="ghost" @click="selectedIds = []">取消選取</button>
        </template>
        <span v-if="bulkMsg" :class="['msg', bulkMsg.ok ? 'ok' : 'bad']">{{ bulkMsg.text }}</span>
      </div>

      <div class="list">
        <article
          v-for="col in collections"
          :key="col.id"
          class="card"
          :class="{ picked: selectedIds.includes(col.id) }"
        >
          <div class="pick-col">
            <input
              v-model="selectedIds"
              type="checkbox"
              :value="col.id"
              :aria-label="`選取 ${col.name}`"
            />
          </div>

          <RouterLink :to="`/albums/${encodeURIComponent(col.id)}`" class="thumb">
            <img v-if="col.coverThumbUrl" :src="col.coverThumbUrl" :alt="col.name" loading="lazy" />
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
              <div><dt>照片</dt><dd>{{ col.photoCount }} 張</dd></div>
              <div v-if="col.personName"><dt>人物</dt><dd>{{ col.personName }}</dd></div>
              <div v-if="col.occasion"><dt>說明</dt><dd>{{ col.occasion }}</dd></div>
              <div>
                <dt>alt</dt>
                <dd :class="{ warn: col.emptyAltCount > 0 }">
                  {{ col.emptyAltCount === 0 ? '全部已填' : `${col.emptyAltCount} 張未填` }}
                </dd>
              </div>
            </dl>

            <div v-if="col.tags.length" class="tags">
              <span v-for="t in col.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </article>
      </div>

      <!--
        打字模式，而且要列出即將刪除的相簿名稱與各自的照片數。
        這是整個後台波及範圍最大的操作 —— 使用者必須看得到自己選了什麼再按下去。
      -->
      <ConfirmDialog
        :open="bulkDialog"
        title="批次刪除相簿"
        confirm-word="刪除"
        :busy="bulkDeleting"
        :confirm-label="`刪除 ${selectedIds.length} 本`"
        @cancel="bulkDialog = false"
        @confirm="doBulkDelete"
      >
        <p>
          將一次刪除以下 <strong>{{ selectedIds.length }}</strong> 本相簿與其中全部
          <strong>{{ selectedPhotoCount }}</strong> 張照片的 D1 資料（單一交易，不會只刪一半）。
          <strong>R2 上的圖檔會保留</strong>，用原檔名重新上傳可以接回去。
          這個動作無法在畫面上復原。
        </p>
        <ul>
          <li v-for="col in selectedCollections" :key="col.id">
            {{ col.name }}（{{ col.photoCount }} 張）
          </li>
        </ul>
      </ConfirmDialog>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AsyncState from '../components/AsyncState.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { listCollections, bulkDeleteCollections } from '../api/admin'

const collections = ref([])
const loading = ref(true)
const error = ref(null)

const totalPhotos = computed(() => collections.value.reduce((n, c) => n + c.photoCount, 0))

// --- T7：多選批次刪除 -----------------------------------------------------
// 走 bulkDeleteCollections 這支交易式端點，不是迴圈呼叫單筆 deleteCollection
// （理由見 api/admin.js 的說明）。
const selectedIds = ref([])
const bulkDialog = ref(false)
const bulkDeleting = ref(false)
const bulkMsg = ref(null)

const selectedCollections = computed(() =>
  collections.value.filter((c) => selectedIds.value.includes(c.id))
)
const selectedPhotoCount = computed(() =>
  selectedCollections.value.reduce((n, c) => n + c.photoCount, 0)
)
const someSelected = computed(() => selectedIds.value.length > 0)
const allSelected = computed(
  () => collections.value.length > 0 && selectedIds.value.length === collections.value.length
)

function toggleSelectAll() {
  selectedIds.value = allSelected.value ? [] : collections.value.map((c) => c.id)
}

async function doBulkDelete() {
  bulkDeleting.value = true
  bulkMsg.value = null
  try {
    const res = await bulkDeleteCollections([...selectedIds.value])
    selectedIds.value = []
    bulkDialog.value = false
    bulkMsg.value = { ok: true, text: `已刪除 ${res.deleted} 本、共 ${res.photosDeleted} 張照片` }
    await load()
  } catch (e) {
    bulkMsg.value = { ok: false, text: e.message }
    bulkDialog.value = false
  } finally {
    bulkDeleting.value = false
  }
}

const CATEGORY_LABELS = { portrait: '人像', event: '活動', street: '街拍' }
const categoryLabel = (key) => CATEGORY_LABELS[key] ?? key

// 封面縮圖（col.coverThumbUrl）與未填 alt 數（col.emptyAltCount）由 GET /api/admin/collections
// 直接吐出來 —— 前端不再收完整的 photos 陣列，那會讓後端掃過全站每一張照片列。

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
  grid-template-columns: 1.5rem 160px 1fr;
  gap: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

/* 選取中的卡片要一眼認得出來，否則捲動時很難確認自己選了哪幾本 */
.card.picked {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.pick-col {
  padding-top: 0.15rem;
}

.pick-col input {
  cursor: pointer;
}

.select-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line);
  font-size: 0.85rem;
}

.select-all {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

.select-bar .dim {
  color: var(--muted);
}

.select-bar button {
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.select-bar button.ghost {
  border-color: transparent;
  color: var(--muted);
}

.select-bar button.danger {
  border-color: #c33;
  color: #c33;
}

.select-bar button.danger:hover {
  background: #c33;
  color: #fff;
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
    grid-template-columns: 1.5rem 1fr;
  }

  /* 縮圖與內文疊成一欄，但勾選框仍留在左側自成一欄 */
  .thumb,
  .body {
    grid-column: 2;
  }

  .thumb {
    max-width: 200px;
  }
}
</style>
