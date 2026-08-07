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
                2026-08-07 起三個分類一致：標籤一律掛在相簿上，照片沒有自己的標籤。
                公開站的分組標題會顯示這些標籤。
              </small>
              <!--
                T5：純文字輸入看不到「目前站上有哪些標籤」，很容易打出
                「街拍」與「街拍照」這種同義但不相等的新標籤。列出現有清單讓人用點的，
                點過的會標成已選取，再點一次移除。
              -->
              <div v-if="allTags.length" class="tag-picker">
                <button
                  v-for="t in allTags"
                  :key="t.id"
                  type="button"
                  class="tag-chip"
                  :class="{ on: selectedTags.includes(t.name) }"
                  @click="toggleTag(t.name)"
                >
                  {{ t.name }}
                  <span class="tag-count">{{ t.collection_count }}</span>
                </button>
              </div>
              <small v-else-if="!tagsLoadError" class="dim">尚未建立任何標籤。</small>
              <small v-else class="dim">標籤清單載入失敗，仍可直接在上面輸入。</small>
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

          <!-- T7：多選刪除。有勾選才出現，平常不佔版面也不會誤按 -->
          <div class="select-bar">
            <label class="select-all">
              <input
                type="checkbox"
                :checked="allPhotosSelected"
                :indeterminate.prop="somePhotosSelected && !allPhotosSelected"
                @change="toggleSelectAllPhotos"
              />
              <span>全選</span>
            </label>
            <template v-if="somePhotosSelected">
              <span class="dim">已選取 {{ selectedPhotoIds.length }} 張</span>
              <button type="button" class="danger" @click="photoBulkDialog = true">刪除已選取</button>
              <button type="button" class="ghost" @click="selectedPhotoIds = []">取消選取</button>
            </template>
            <span v-if="photoBulkMsg" :class="['msg', photoBulkMsg.ok ? 'ok' : 'bad']">
              {{ photoBulkMsg.text }}
            </span>
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
                <input
                  v-model="selectedPhotoIds"
                  type="checkbox"
                  class="pick"
                  :value="p.photoId"
                  :aria-label="`選取第 ${i + 1} 張`"
                />
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
                <button
                  type="button"
                  class="danger-link"
                  :disabled="deletingPhoto === p.photoId"
                  @click="photoToDelete = p"
                >
                  {{ deletingPhoto === p.photoId ? '刪除中…' : '刪除這張照片' }}
                </button>
              </div>
            </li>
          </ul>
        </section>

        <section class="panel danger-zone">
          <h2>刪除相簿</h2>
          <p class="hint">
            會刪掉這本相簿與底下全部 {{ col.photos.length }} 張照片的 D1 資料，
            公開站會立刻看不到。<strong>R2 上的圖檔不會被刪除</strong>，
            誤刪的話用原檔名重新上傳即可接回去（見 PLAN.md D5）。這個動作無法在畫面上復原。
          </p>
          <div class="actions">
            <button type="button" class="danger" :disabled="deletingCollection" @click="collectionDialog = true">
              {{ deletingCollection ? '刪除中…' : `刪除「${col.name}」與其 ${col.photos.length} 張照片` }}
            </button>
            <span v-if="collectionDeleteMsg" :class="['msg', collectionDeleteMsg.ok ? 'ok' : 'bad']">
              {{ collectionDeleteMsg.text }}
            </span>
          </div>
        </section>

        <!-- 單張照片：簡單模式。誤刪一張的代價低，而且 R2 的圖檔還在，重新上傳就能接回去 -->
        <ConfirmDialog
          :open="!!photoToDelete"
          title="刪除這張照片？"
          :busy="!!deletingPhoto"
          @cancel="photoToDelete = null"
          @confirm="doDeletePhoto"
        >
          <p>
            將刪除 <strong>{{ photoToDelete?.filename }}</strong> 的 D1 資料。
            R2 上的圖檔會保留，用原檔名重新上傳可以接回去。
          </p>
        </ConfirmDialog>

        <!-- 批次照片：打字模式。一次刪多張，誤按的代價比單張高得多 -->
        <ConfirmDialog
          :open="photoBulkDialog"
          title="批次刪除照片"
          confirm-word="刪除"
          :busy="bulkDeletingPhotos"
          :confirm-label="`刪除 ${selectedPhotoIds.length} 張`"
          @cancel="photoBulkDialog = false"
          @confirm="doBulkDeletePhotos"
        >
          <p>
            將一次刪除以下 <strong>{{ selectedPhotoIds.length }}</strong> 張照片的 D1 資料
            （單一交易，不會只刪一半）。R2 上的圖檔會保留。
          </p>
          <ul>
            <li v-for="p in selectedPhotos" :key="p.photoId">{{ p.filename }}</li>
          </ul>
        </ConfirmDialog>

        <!-- 整本相簿：打字模式，要打出相簿名稱。沿用原本頁面內聯的規則，只是改成彈窗 -->
        <ConfirmDialog
          :open="collectionDialog"
          title="刪除整本相簿"
          :confirm-word="col.name"
          :busy="deletingCollection"
          :confirm-label="`刪除與其 ${col.photos.length} 張照片`"
          @cancel="collectionDialog = false"
          @confirm="doDeleteCollection"
        >
          <p>
            會刪掉 <strong>{{ col.name }}</strong> 與底下全部
            <strong>{{ col.photos.length }}</strong> 張照片的 D1 資料，公開站會立刻看不到。
            R2 上的圖檔不會被刪除，誤刪的話用原檔名重新上傳即可接回去。
            這個動作無法在畫面上復原。
          </p>
        </ConfirmDialog>
      </template>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AsyncState from '../components/AsyncState.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import {
  listCollections,
  listTags,
  updateCollection,
  updatePhoto,
  reorderPhotos,
  deletePhoto,
  deleteCollection,
  bulkDeletePhotos,
} from '../api/admin'

const router = useRouter()

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

// --- T5：可點選的既有標籤清單 ---------------------------------------------
// 標籤清單載入失敗不該讓整個編輯頁掛掉 —— 沒有清單還是能手打，
// 所以這裡的錯誤只記在 tagsLoadError，不丟進頁面層的 error。
const allTags = ref([])
const tagsLoadError = ref(false)

// parseTags 定義在下面的儲存區塊，共用同一份解析規則 ——
// 兩邊各寫一份的話，「點選」與「儲存」對逗號空白的認定遲早會不一致。
const selectedTags = computed(() => parseTags(form.tags))

function toggleTag(name) {
  const current = selectedTags.value
  const next = current.includes(name) ? current.filter((t) => t !== name) : [...current, name]
  form.tags = next.join(', ')
}

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

// --- 刪除照片 -------------------------------------------------------------
// T7 起改用 ConfirmDialog 取代原本「再按一次以確認」的兩段式按鈕。
// 兩段式在單張刪除還算堪用，但批次刪除時使用者看不到自己選了什麼就得按下去，
// 所以統一成彈窗：單張是簡單模式，批次要打字。
const deletingPhoto = ref(null)
const photoToDelete = ref(null)

/** 把一張照片從畫面上的各份狀態移除。單張與批次刪除共用，免得漏掉其中一份 */
function forgetPhoto(photoId) {
  col.value.photos = col.value.photos.filter((x) => x.photoId !== photoId)
  photoOrder.value = photoOrder.value.filter((id) => id !== photoId)
  savedOrder.value = savedOrder.value.filter((id) => id !== photoId)
  selectedPhotoIds.value = selectedPhotoIds.value.filter((id) => id !== photoId)
  delete altDrafts[photoId]
  delete photoMsg[photoId]
  // 若剛好刪到封面，D1 那邊已經把 cover_photo_id 清成 null（見 admin.ts 的說明），
  // 這裡同步畫面上的欄位，避免之後設定新封面時比對到過期的值。
  if (col.value.coverPhotoId === photoId) col.value.coverPhotoId = null
}

async function doDeletePhoto() {
  const p = photoToDelete.value
  if (!p) return
  deletingPhoto.value = p.photoId
  try {
    await deletePhoto(p.photoId)
    forgetPhoto(p.photoId)
    photoToDelete.value = null
  } catch (e) {
    photoMsg[p.photoId] = { ok: false, text: e.message }
    photoToDelete.value = null
  } finally {
    deletingPhoto.value = null
  }
}

// --- 批次刪除照片 ---------------------------------------------------------
// 走 bulkDeletePhotos 這支交易式端點，不是迴圈呼叫 deletePhoto ——
// 中途失敗會留下「刪了一半」的狀態，畫面與 D1 對不起來（見 api/admin.js 的說明）。
const selectedPhotoIds = ref([])
const photoBulkDialog = ref(false)
const bulkDeletingPhotos = ref(false)
const photoBulkMsg = ref(null)

const selectedPhotos = computed(() =>
  selectedPhotoIds.value.map((id) => photoById.value[id]).filter(Boolean)
)
const somePhotosSelected = computed(() => selectedPhotoIds.value.length > 0)
const allPhotosSelected = computed(
  () => photoOrder.value.length > 0 && selectedPhotoIds.value.length === photoOrder.value.length
)

function toggleSelectAllPhotos() {
  selectedPhotoIds.value = allPhotosSelected.value ? [] : [...photoOrder.value]
}

async function doBulkDeletePhotos() {
  bulkDeletingPhotos.value = true
  photoBulkMsg.value = null
  try {
    const ids = [...selectedPhotoIds.value]
    const res = await bulkDeletePhotos(ids)
    for (const id of ids) forgetPhoto(id)
    selectedPhotoIds.value = []
    photoBulkDialog.value = false
    photoBulkMsg.value = { ok: true, text: `已刪除 ${res.deleted} 張` }
  } catch (e) {
    photoBulkMsg.value = { ok: false, text: e.message }
    photoBulkDialog.value = false
  } finally {
    bulkDeletingPhotos.value = false
  }
}

// --- 刪除相簿 -------------------------------------------------------------
// 這個動作會連帶刪掉底下所有照片的 D1 資料，是後台唯一「一次動作波及一批東西」
// 的操作，所以確認方式比刪單張照片更重 ——要求打出完整相簿名稱才能啟用按鈕，
// 而不是點兩下就好。
const collectionDialog = ref(false)
const deletingCollection = ref(false)
const collectionDeleteMsg = ref(null)

async function doDeleteCollection() {
  deletingCollection.value = true
  collectionDeleteMsg.value = null
  try {
    await deleteCollection(col.value.id)
    router.push('/albums')
  } catch (e) {
    collectionDeleteMsg.value = { ok: false, text: e.message }
    collectionDialog.value = false
    deletingCollection.value = false
  }
}

async function loadTags() {
  try {
    allTags.value = (await listTags()).tags
    tagsLoadError.value = false
  } catch {
    tagsLoadError.value = true
  }
}

onMounted(() => {
  load()
  loadTags()
})
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

/* T5：可點選的既有標籤 */
.tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  color: var(--muted);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.tag-chip:hover {
  background: var(--surface-hover);
}

/* 已加入的標籤要一眼看得出來，否則點了沒反應的錯覺很強 */
.tag-chip.on {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--text);
}

.tag-count {
  font-size: 0.7rem;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

/* T7：多選操作列 */
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

.select-bar button.danger {
  border-color: #c33;
  color: #c33;
}

.select-bar button.danger:hover {
  background: #c33;
  color: #fff;
}

.pick {
  margin: 0 0 0.15rem;
  cursor: pointer;
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

.danger-link {
  display: block;
  margin-top: 0.5rem;
  padding: 0;
  border: none;
  background: none;
  color: #c33;
  font-size: 0.75rem;
  text-decoration: underline;
  cursor: pointer;
}

.danger-link:hover:not(:disabled) {
  color: #a11;
}

.danger-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-zone {
  border-color: #c33;
}

.danger-zone h2 {
  color: #c33;
}

button.danger {
  border-color: #c33;
  color: #c33;
}

button.danger:hover:not(:disabled) {
  background: #c33;
  color: #fff;
}
</style>
