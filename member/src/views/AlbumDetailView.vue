<template>
  <div>
    <p class="crumb"><RouterLink to="/albums">← 相簿列表</RouterLink></p>

    <AsyncState :loading="loading" :error="error" :on-retry="load">
      <template v-if="col">
        <h1>{{ col.name }}</h1>
        <p class="page-intro">
          <code>{{ col.id }}</code> · {{ categoryLabel }} · {{ col.date }} · {{ col.photos.length }} 張
        </p>

        <section class="panel">
          <h2>相簿資訊</h2>
          <form class="form" @submit.prevent="saveCollection">
            <label>
              <span>名稱</span>
              <input v-model="form.name" type="text" required />
            </label>
            <label>
              <span>日期</span>
              <input v-model="form.date" type="date" required />
            </label>
            <label v-if="col.category === 'street'">
              <span>說明 occasion</span>
              <input v-model="form.occasion" type="text" placeholder="可留空" />
            </label>
            <label v-if="col.category === 'portrait'">
              <span>人物名稱</span>
              <input v-model="form.personName" type="text" placeholder="可留空" />
            </label>
            <label class="wide">
              <span>相簿標籤</span>
              <input v-model="form.tags" type="text" placeholder="用逗號分隔，可留空" />
              <small>
                依 album-schema 的慣例：街拍的標籤掛在相簿上，人像／活動掛在每張照片上。
                掛錯位置不會出錯，但公開站上會出現在預期外的地方。
              </small>
            </label>

            <div class="actions">
              <button type="submit" :disabled="savingCollection">
                {{ savingCollection ? '儲存中…' : '儲存相簿資訊' }}
              </button>
              <span v-if="collectionMsg" :class="['msg', collectionMsg.ok ? 'ok' : 'bad']">
                {{ collectionMsg.text }}
              </span>
            </div>
          </form>
        </section>

        <section class="panel">
          <h2>照片 alt</h2>
          <p class="hint">
            alt 是給搜尋引擎與螢幕報讀軟體看的替代文字。改完會即時送出，
            公開站最慢 5 分鐘後生效（API 有邊緣快取）。
          </p>

          <ul class="photos">
            <li v-for="p in col.photos" :key="p.photoId" class="photo">
              <img :src="p.thumbUrl" :alt="p.alt || p.filename" loading="lazy" />
              <div class="photo-body">
                <div class="photo-meta">
                  <code>{{ p.photoId }}</code>
                  <span class="dim">{{ p.width }}×{{ p.height }}</span>
                  <span v-if="col.coverPhotoId === p.photoId" class="badge">封面</span>
                </div>
                <div class="filename">{{ p.filename }}</div>
                <div class="alt-row">
                  <input
                    v-model="altDrafts[p.photoId]"
                    type="text"
                    placeholder="尚未填寫替代文字"
                    @keyup.enter="saveAlt(p)"
                  />
                  <button
                    type="button"
                    :disabled="!isAltDirty(p) || savingPhoto === p.photoId"
                    @click="saveAlt(p)"
                  >
                    {{ savingPhoto === p.photoId ? '儲存中…' : '儲存' }}
                  </button>
                </div>
                <div v-if="photoMsg[p.photoId]" :class="['msg', photoMsg[p.photoId].ok ? 'ok' : 'bad']">
                  {{ photoMsg[p.photoId].text }}
                </div>
                <div v-if="p.tags.length" class="tags">
                  <span v-for="t in p.tags" :key="t" class="tag">{{ t }}</span>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AsyncState from '../components/AsyncState.vue'
import { listCollections, updateCollection, updatePhoto } from '../api/admin'

const props = defineProps({
  collectionId: { type: String, required: true },
})

const col = ref(null)
const loading = ref(true)
const error = ref(null)

const form = reactive({ name: '', date: '', occasion: '', personName: '', tags: '' })
const altDrafts = reactive({})
const savingCollection = ref(false)
const savingPhoto = ref(null)
const collectionMsg = ref(null)
const photoMsg = reactive({})

const CATEGORY_LABELS = { portrait: '人像', event: '活動', street: '街拍' }
const categoryLabel = computed(() => CATEGORY_LABELS[col.value?.category] ?? col.value?.category)

const isAltDirty = (p) => (altDrafts[p.photoId] ?? '') !== p.alt

async function load() {
  loading.value = true
  error.value = null
  try {
    // 目前只有「取全部」這個端點。相簿數量還很少（個位數），為了單一相簿再開一支
    // API 不划算；等數量成長到讓這件事變慢時再加 GET /collections/:id。
    const data = await listCollections()
    const found = data.collections.find((c) => c.id === props.collectionId)
    if (!found) {
      throw Object.assign(new Error(`找不到相簿 ${props.collectionId}`), { status: 404 })
    }
    col.value = found
    form.name = found.name
    form.date = found.date
    form.occasion = found.occasion ?? ''
    form.personName = found.personName ?? ''
    form.tags = found.tags.join(', ')
    for (const p of found.photos) altDrafts[p.photoId] = p.alt
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

const parseTags = (s) => s.split(',').map((t) => t.trim()).filter(Boolean)

async function saveCollection() {
  savingCollection.value = true
  collectionMsg.value = null
  try {
    const patch = { name: form.name, date: form.date, tags: parseTags(form.tags) }
    // 空字串代表清空，要送 null 而不是 ""
    if (col.value.category === 'street') patch.occasion = form.occasion.trim() || null
    if (col.value.category === 'portrait') patch.personName = form.personName.trim() || null

    await updateCollection(col.value.id, patch)
    Object.assign(col.value, {
      name: patch.name,
      date: patch.date,
      tags: patch.tags,
      occasion: patch.occasion ?? col.value.occasion,
      personName: patch.personName ?? col.value.personName,
    })
    collectionMsg.value = { ok: true, text: '已儲存' }
  } catch (e) {
    collectionMsg.value = { ok: false, text: e.message }
  } finally {
    savingCollection.value = false
  }
}

async function saveAlt(p) {
  savingPhoto.value = p.photoId
  delete photoMsg[p.photoId]
  try {
    const alt = (altDrafts[p.photoId] ?? '').trim()
    await updatePhoto(p.photoId, { alt })
    p.alt = alt
    altDrafts[p.photoId] = alt
    photoMsg[p.photoId] = { ok: true, text: '已儲存' }
  } catch (e) {
    photoMsg[p.photoId] = { ok: false, text: e.message }
  } finally {
    savingPhoto.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.crumb {
  font-size: 0.875rem;
  margin-bottom: 1rem;
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

.hint {
  color: var(--muted);
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
}

.form label.wide {
  grid-column: 1 / -1;
}

.form small {
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.6;
}

input {
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
}

input:focus {
  outline: 2px solid var(--accent-soft);
  outline-offset: 1px;
}

button {
  padding: 0.45rem 1rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  white-space: nowrap;
}

button:hover:not(:disabled) {
  background: var(--surface-hover);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.msg {
  font-size: 0.82rem;
}

.msg.ok {
  color: #2a8a4a;
}

.msg.bad {
  color: #d66;
}

.photos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.photo {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 1rem;
  align-items: start;
}

.photo img {
  width: 96px;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
  display: block;
  background: var(--surface-hover);
}

.photo-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  margin-bottom: 0.15rem;
}

.dim {
  color: var(--muted);
}

.filename {
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.4rem;
  word-break: break-all;
}

.alt-row {
  display: flex;
  gap: 0.5rem;
}

.alt-row input {
  flex: 1;
  min-width: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.4rem;
}
</style>
