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
          <h2>照片順序與 alt</h2>
          <p class="hint">
            拖曳左側把手可調整順序，手機或鍵盤請用 ↑ ↓ 按鈕。
            <strong>順序要按「儲存順序」才會寫入</strong>；alt 則是逐張即時送出。
            兩者在公開站都最慢 5 分鐘後生效（API 有邊緣快取）。
          </p>

          <div class="order-bar">
            <button type="button" :disabled="!orderDirty || savingOrder" @click="saveOrder">
              {{ savingOrder ? '儲存中…' : '儲存順序' }}
            </button>
            <button type="button" class="ghost" :disabled="!orderDirty || savingOrder" @click="resetOrder">
              還原
            </button>
            <span v-if="orderMsg" :class="['msg', orderMsg.ok ? 'ok' : 'bad']">{{ orderMsg.text }}</span>
            <span v-else-if="orderDirty" class="msg dim">順序已變更，尚未儲存</span>
          </div>

          <ul class="photos">
            <li
              v-for="(p, i) in orderedPhotos"
              :key="p.photoId"
              class="photo"
              :class="{ dragging: dragSourceId === p.photoId, over: dragOverId === p.photoId }"
              :draggable="dragArmedId === p.photoId"
              @dragstart="onDragStart(p, $event)"
              @dragover.prevent="dragOverId = p.photoId"
              @dragleave="onDragLeave(p)"
              @drop.prevent="onDrop(p)"
              @dragend="onDragEnd"
            >
              <div class="order-col">
                <span class="pos">{{ i + 1 }}</span>
                <button
                  type="button"
                  class="handle"
                  :aria-label="`第 ${i + 1} 張，拖曳可調整順序`"
                  @pointerdown="dragArmedId = p.photoId"
                  @pointerup="dragArmedId = null"
                >
                  ⠿
                </button>
                <button type="button" class="nudge" :disabled="i === 0" aria-label="上移" @click="move(i, -1)">
                  ↑
                </button>
                <button
                  type="button"
                  class="nudge"
                  :disabled="i === orderedPhotos.length - 1"
                  aria-label="下移"
                  @click="move(i, 1)"
                >
                  ↓
                </button>
              </div>
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
import { listCollections, updateCollection, updatePhoto, reorderPhotos } from '../api/admin'

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

// --- 排序 ---------------------------------------------------------------
// 畫面上的順序只是一份 photoId 的草稿，按下儲存才寫進 D1。照片本身仍然存在
// col.photos 裡，這樣拖曳時不會動到 alt 草稿與各自的儲存狀態。
const photoOrder = ref([]) // 目前畫面上的順序
const savedOrder = ref([]) // 已經寫進 D1 的順序
const savingOrder = ref(false)
const orderMsg = ref(null)
const dragSourceId = ref(null)
const dragOverId = ref(null)
// 只有從把手按下去才把 li 設成可拖曳 —— 否則整列可拖，行內的文字輸入框會沒辦法選字
const dragArmedId = ref(null)

const photoById = computed(() =>
  Object.fromEntries((col.value?.photos ?? []).map((p) => [p.photoId, p]))
)
const orderedPhotos = computed(() => photoOrder.value.map((id) => photoById.value[id]))
const orderDirty = computed(() => photoOrder.value.join('\n') !== savedOrder.value.join('\n'))

function moveId(list, from, to) {
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= photoOrder.value.length) return
  photoOrder.value = moveId(photoOrder.value, index, target)
  orderMsg.value = null
}

function onDragStart(p, e) {
  dragSourceId.value = p.photoId
  orderMsg.value = null
  // 一定要寫入 dataTransfer：Firefox 沒有資料就不會真的開始拖曳。
  // 實際的排序是靠 dragSourceId 算的，這裡的內容只是為了讓拖曳成立。
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', p.photoId)
}

function onDragLeave(p) {
  if (dragOverId.value === p.photoId) dragOverId.value = null
}

function onDrop(target) {
  const from = photoOrder.value.indexOf(dragSourceId.value)
  const to = photoOrder.value.indexOf(target.photoId)
  if (from !== -1 && to !== -1 && from !== to) {
    photoOrder.value = moveId(photoOrder.value, from, to)
  }
  onDragEnd()
}

function onDragEnd() {
  dragSourceId.value = null
  dragOverId.value = null
  dragArmedId.value = null
}

function resetOrder() {
  photoOrder.value = [...savedOrder.value]
  orderMsg.value = null
}

async function saveOrder() {
  savingOrder.value = true
  orderMsg.value = null
  try {
    const ids = [...photoOrder.value]
    const byId = photoById.value
    await reorderPhotos(col.value.id, ids)
    savedOrder.value = ids
    // 讓 col.photos 跟著新順序走，並更新每張的 orderIndex，
    // 否則畫面上的資料會跟 D1 不一致，下次比對 dirty 就會判斷錯誤。
    col.value.photos = ids.map((id, i) => Object.assign(byId[id], { orderIndex: i + 1 }))
    orderMsg.value = { ok: true, text: '順序已儲存' }
  } catch (e) {
    orderMsg.value = { ok: false, text: e.message }
  } finally {
    savingOrder.value = false
  }
}

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
    // API 已依 order_index 排好，直接沿用
    photoOrder.value = found.photos.map((p) => p.photoId)
    savedOrder.value = [...photoOrder.value]
    orderMsg.value = null
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

.order-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.msg.dim {
  color: var(--muted);
}

button.ghost {
  border-color: transparent;
  color: var(--muted);
}

.photo {
  display: grid;
  grid-template-columns: 2.25rem 96px 1fr;
  gap: 1rem;
  align-items: start;
  border-radius: 6px;
}

.photo.dragging {
  opacity: 0.4;
}

/* 放開會插在這一列的位置，用上緣的線標示落點 */
.photo.over {
  box-shadow: inset 0 2px 0 0 var(--accent);
}

.order-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.pos {
  font-size: 0.75rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.handle {
  padding: 0.1rem 0.35rem;
  border-color: transparent;
  color: var(--muted);
  cursor: grab;
  line-height: 1;
  touch-action: none;
}

.handle:active {
  cursor: grabbing;
}

.nudge {
  padding: 0.1rem 0.35rem;
  line-height: 1;
  font-size: 0.8rem;
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
