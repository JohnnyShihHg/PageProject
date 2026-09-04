<template>
  <div>
    <h1>上傳</h1>
    <p class="page-intro">
      在瀏覽器壓縮後上傳，取代開終端機跑 <code>compress.js</code> 的流程。
      <strong>CLI 不會被移除</strong> —— 大批上傳仍然用它比較快，這裡一次上限
      {{ MAX_PHOTOS }} 張。
    </p>

    <section class="panel">
      <h2>1. 選照片</h2>
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="ACCEPTED_TYPES.join(',')"
        @change="onPick"
      />
      <p class="hint">
        壓縮全部在你的瀏覽器完成：主圖 {{ MAIN_WIDTH }}px、縮圖 {{ THUMB_WIDTH }}px、
        品質 {{ QUALITY * 100 }}（與 <code>compress.js</code> 相同）。原檔不會被上傳。
      </p>

      <p v-if="compressing" class="msg">壓縮中… {{ items.length }} / {{ pickedCount }}</p>

      <ul v-if="items.length" class="picked">
        <li v-for="(it, i) in items" :key="it.filename" class="pick">
          <img :src="it.previewUrl" :alt="it.filename" />
          <div class="pick-body">
            <div class="filename">{{ it.filename }}</div>
            <div class="dim">
              {{ it.width }}×{{ it.height }} ·
              {{ kb(it.originalBytes) }} → <strong>{{ kb(it.main.size) }}</strong>
              + 縮圖 {{ kb(it.thumb.size) }}
              <span class="saving">省 {{ savingPct(it) }}%</span>
            </div>
            <div v-if="it.exifDate" class="dim">EXIF 拍攝日：{{ it.exifDate }}</div>
            <div v-else class="dim warn">讀不到 EXIF 拍攝日，已用檔案時間 {{ it.fallbackDate }}</div>
            <input v-model="it.alt" type="text" placeholder="替代文字 alt（可留空）" />
          </div>
          <button type="button" class="remove" aria-label="移除" @click="removeAt(i)">✕</button>
        </li>
      </ul>

      <p v-if="pickErrors.length" class="msg bad">
        以下檔案略過：{{ pickErrors.join('、') }}
      </p>
    </section>

    <section class="panel">
      <h2>2. 相簿資訊</h2>

      <div class="mode">
        <label class="radio">
          <input v-model="mode" type="radio" value="existing" :disabled="collections.length === 0" />
          <span>加進現有相簿</span>
        </label>
        <label class="radio">
          <input v-model="mode" type="radio" value="new" />
          <span>開一本新相簿</span>
        </label>
      </div>

      <p v-if="loadError" class="msg bad">
        讀不到現有相簿清單（{{ loadError }}），只能開新相簿。
      </p>

      <template v-if="mode === 'existing'">
        <label class="pick-album">
          <span>選擇相簿</span>
          <select v-model="selectedId">
            <option value="">請選擇…</option>
            <optgroup v-for="g in groupedCollections" :key="g.key" :label="g.label">
              <option v-for="c in g.items" :key="c.id" :value="c.id">
                {{ c.name }}（{{ c.date }}・{{ c.photoCount }} 張）
              </option>
            </optgroup>
          </select>
        </label>
        <p class="hint">
          分類、slug、日期會沿用這本相簿，不能改 —— 改了就會變成另一本。
          要修改相簿本身的資訊請到
          <RouterLink v-if="selectedId" :to="`/albums/${encodeURIComponent(selectedId)}`">該相簿的編輯頁</RouterLink>
          <span v-else>相簿的編輯頁</span>。
        </p>
      </template>

      <p v-else class="hint">
        欄位與 <code>compress.js</code> 的提問一致。
        <strong>分類 + slug + 日期會組成相簿 id</strong>，若剛好和現有相簿相同，
        照片會附加進去而不是另開一本 —— 下面會即時告訴你是哪一種。
      </p>

      <form class="form" @submit.prevent="submit">
        <label>
          <span>分類</span>
          <select v-model="form.category" :disabled="locked">
            <option value="portrait">人像 portrait</option>
            <option value="event">活動 event</option>
            <option value="street">街拍 street</option>
          </select>
        </label>
        <label>
          <span>名稱</span>
          <input v-model="form.name" type="text" required placeholder="例如 東京櫻花" />
        </label>
        <label>
          <span>slug</span>
          <input v-model="form.slug" type="text" required :disabled="locked" placeholder="例如 tokyo" />
          <small v-if="!locked">
            會變成相簿 id 的一部分，街拍相簿還會直接出現在公開站網址裡。
            中文可以用（現有相簿就有），但網址會變成一長串編碼，建議用英文。
          </small>
        </label>
        <label>
          <span>日期</span>
          <input v-model="form.date" type="date" required :disabled="locked" />
        </label>
        <label v-if="form.category === 'portrait'">
          <span>人物名稱</span>
          <input v-model="form.personName" type="text" placeholder="可留空" />
        </label>
        <label v-if="form.category === 'street'">
          <span>說明 occasion</span>
          <input v-model="form.occasion" type="text" placeholder="可留空" />
        </label>
        <label class="wide">
          <span>相簿標籤</span>
          <input v-model="form.tags" type="text" placeholder="用逗號分隔，可留空" />
          <small>
            依 album-schema 的慣例：街拍的標籤掛在相簿上，人像／活動掛在每張照片上。
          </small>
        </label>

        <div class="preview-id wide">
          <template v-if="previewCollectionId">
            將寫入的相簿 id：<code>{{ previewCollectionId }}</code>
            <span v-if="matchedExisting" class="append">
              → 會<strong>附加</strong>到現有的「{{ matchedExisting.name }}」（目前 {{ matchedExisting.photoCount }} 張）
            </span>
            <span v-else class="fresh">→ 會<strong>新建</strong>一本相簿</span>
          </template>
          <template v-else>將寫入的相簿 id：（填完 slug 與日期後顯示）</template>
        </div>

        <!--
          反推 slug 出錯的話，結果會是默默開一本新相簿 —— 正是這個下拉選單要防的事。
          所以組出來的 id 一定要與選到的相簿一致，不一致就擋住並講清楚。
        -->
        <p v-if="idMismatch" class="msg bad wide">
          組出來的 id（<code>{{ previewCollectionId }}</code>）與選到的相簿
          （<code>{{ selectedId }}</code>）不一致，為避免誤開新相簿已擋下。
          請改用「開一本新相簿」，或回報這個狀況。
        </p>

        <div class="actions">
          <button type="submit" :disabled="!canSubmit">
            {{ uploading ? '上傳中…' : `上傳 ${items.length} 張` }}
          </button>
          <span v-if="msg" :class="['msg', msg.ok ? 'ok' : 'bad']">{{ msg.text }}</span>
        </div>
      </form>
    </section>

    <section v-if="result" class="panel">
      <h2>3. 結果</h2>
      <p class="msg ok">
        寫入相簿 <code>{{ result.collectionId }}</code>（{{ result.created ? '新建' : '附加到既有相簿' }}），
        共 {{ result.photos.length }} 張、R2 物件 {{ result.uploaded }} 個。
      </p>
      <p v-if="result.overwritten" class="dim">
        其中 {{ result.overwritten }} 個 R2 物件覆蓋了先前刪除相簿留下的殘留檔案。
      </p>
      <ul class="assigned">
        <li v-for="p in result.photos" :key="p.photoId">
          <code>{{ p.photoId }}</code> · 順序 {{ p.orderIndex }} · {{ p.filename }}
        </li>
      </ul>
      <p class="hint">
        公開站最慢 5 分鐘後才看得到（API 有邊緣快取）。要立刻確認請用
        <RouterLink :to="`/albums/${result.collectionId}`">後台的相簿頁</RouterLink>。
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ACCEPTED_TYPES,
  MAIN_WIDTH,
  THUMB_WIDTH,
  QUALITY,
  compressImage,
} from '../lib/imageCompress'
import { readExifDate, fallbackDate } from '../lib/exif'
import { uploadPhotos, listCollections } from '../api/admin'

const MAX_PHOTOS = 20

const fileInput = ref(null)
const items = ref([])
const pickedCount = ref(0)
const compressing = ref(false)
const pickErrors = ref([])
const uploading = ref(false)
const msg = ref(null)
const result = ref(null)

const form = reactive({
  category: 'portrait',
  name: '',
  slug: '',
  date: '',
  personName: '',
  occasion: '',
  tags: '',
})

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`
const savingPct = (it) => Math.max(0, Math.round((1 - it.main.size / it.originalBytes) * 100))

// --- 現有相簿 ----------------------------------------------------------
// 沒有這份清單的話，使用者只能靠記憶把 slug 與日期打對，打錯一個字就默默開了
// 一本新相簿而不會有任何提示 —— 那是這頁最容易造成災難的地方。
const mode = ref('existing')
const collections = ref([])
const selectedId = ref('')
const loadError = ref(null)

const CATEGORY_LABELS = { portrait: '人像', event: '活動', street: '街拍' }

const groupedCollections = computed(() =>
  ['portrait', 'event', 'street']
    .map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      items: collections.value.filter((c) => c.category === key),
    }))
    .filter((g) => g.items.length > 0)
)

const selectedCollection = computed(
  () => collections.value.find((c) => c.id === selectedId.value) ?? null
)

/** 選了現有相簿時，分類／slug／日期不能改 —— 改了就會指到另一本 */
const locked = computed(() => mode.value === 'existing' && !!selectedCollection.value)

/**
 * 從相簿 id 反推 slug。id 的組成是 `album_{YYYY}_{slug}` 或 `act_{YYYYMMDD}_{slug}`
 * （見 PageWorker 的 buildCollectionId）。slug 本身可能含底線，所以只能剝前綴，
 * 不能用 split('_')。
 *
 * 反推錯了會默默開新相簿，所以下面還有一道 idMismatch 的檢查把關。
 */
function slugFromId(id, category) {
  return category === 'street' ? id.replace(/^album_\d{4}_/, '') : id.replace(/^act_\d{8}_/, '')
}

watch(selectedCollection, (c) => {
  if (!c) return
  form.category = c.category
  form.slug = slugFromId(c.id, c.category)
  form.date = c.date
  form.name = c.name
  form.personName = c.personName ?? ''
  form.occasion = c.occasion ?? ''
  form.tags = (c.tags ?? []).join(', ')
})

// 切回「開新相簿」時把沿用的值清掉，否則會以為自己在開新的、其實填著舊相簿的資料
watch(mode, (m) => {
  if (m === 'new') {
    selectedId.value = ''
    form.slug = ''
    form.name = ''
    form.personName = ''
    form.occasion = ''
    form.tags = ''
  }
})

/** 與 PageWorker 的 buildCollectionId 同一套規則，只是先在畫面上預告 */
const previewCollectionId = computed(() => {
  const { category, slug, date } = form
  if (!slug.trim() || !date) return ''
  return category === 'street'
    ? `album_${date.slice(0, 4)}_${slug.trim()}`
    : `act_${date.replace(/-/g, '')}_${slug.trim()}`
})

/** 手動填的內容剛好撞到現有相簿時，也要即時告訴使用者會附加而不是新建 */
const matchedExisting = computed(
  () => collections.value.find((c) => c.id === previewCollectionId.value) ?? null
)

const idMismatch = computed(
  () =>
    mode.value === 'existing' &&
    !!selectedCollection.value &&
    previewCollectionId.value !== selectedCollection.value.id
)

const canSubmit = computed(
  () =>
    !uploading.value &&
    !compressing.value &&
    !idMismatch.value &&
    items.value.length > 0 &&
    form.name.trim() &&
    form.slug.trim() &&
    form.date &&
    (mode.value === 'new' || !!selectedCollection.value)
)

onMounted(async () => {
  try {
    const data = await listCollections()
    collections.value = data.collections
    // 沒有任何相簿時「加進現有」沒有意義，直接切到新增
    if (collections.value.length === 0) mode.value = 'new'
  } catch (e) {
    // 讀不到清單不該讓整頁不能用 —— 線上環境沒有憑證時就是這個狀況（503）
    loadError.value = e.message
    collections.value = []
    mode.value = 'new'
  }
})

async function onPick(e) {
  const files = [...e.target.files]
  e.target.value = '' // 讓同一批檔案可以重選
  if (files.length === 0) return

  pickErrors.value = []
  const room = MAX_PHOTOS - items.value.length
  if (files.length > room) {
    pickErrors.value.push(`超過上限，只取前 ${room} 張`)
  }

  compressing.value = true
  pickedCount.value = Math.min(files.length, room)

  for (const file of files.slice(0, room)) {
    try {
      // EXIF 一定要在壓縮之前讀 —— Canvas 會把它整個丟掉
      const exifDate = await readExifDate(file)
      const compressed = await compressImage(file)

      if (items.value.some((it) => it.filename === compressed.filename)) {
        pickErrors.value.push(`${compressed.filename}（本批已有同名）`)
        continue
      }

      items.value.push({
        ...compressed,
        exifDate,
        fallbackDate: fallbackDate(file),
        alt: '',
        previewUrl: URL.createObjectURL(compressed.thumb),
      })

      // 日期沿用第一張讀到的 EXIF，省得手動填
      if (!form.date) form.date = exifDate ?? fallbackDate(file)
    } catch {
      pickErrors.value.push(`${file.name}（無法讀取或壓縮）`)
    }
  }

  compressing.value = false
}

function removeAt(i) {
  URL.revokeObjectURL(items.value[i].previewUrl)
  items.value.splice(i, 1)
}

function revokeAll() {
  for (const it of items.value) URL.revokeObjectURL(it.previewUrl)
}
onBeforeUnmount(revokeAll)

const parseTags = (s) => s.split(',').map((t) => t.trim()).filter(Boolean)

async function submit() {
  uploading.value = true
  msg.value = null
  result.value = null
  try {
    const meta = {
      category: form.category,
      collection: {
        slug: form.slug.trim(),
        name: form.name.trim(),
        date: form.date,
        tags: parseTags(form.tags),
      },
      photos: items.value.map((it) => ({
        filename: it.filename,
        width: it.width,
        height: it.height,
        alt: it.alt.trim(),
        tags: [],
      })),
    }
    // 依 album-schema：personName 只有 portrait 有意義，occasion 只有 street 有意義
    if (form.category === 'portrait') meta.collection.personName = form.personName.trim() || null
    if (form.category === 'street') meta.collection.occasion = form.occasion.trim() || null

    const files = items.value.map((it) => ({ main: it.main, thumb: it.thumb }))
    result.value = await uploadPhotos(meta, files)

    msg.value = { ok: true, text: '上傳完成' }
    revokeAll()
    items.value = []

    // 重讀清單，讓張數與新相簿立刻反映在下拉選單上
    try {
      collections.value = (await listCollections()).collections
      if (mode.value === 'existing' && !selectedId.value) selectedId.value = result.value.collectionId
    } catch {
      // 只是重整清單，失敗不影響剛才那次上傳的結果
    }
  } catch (e) {
    msg.value = { ok: false, text: e.message }
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
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
  line-height: 1.7;
}

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
}

.form label.wide,
.wide {
  grid-column: 1 / -1;
}

.form small {
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.6;
}

input,
select {
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
}

input:focus,
select:focus {
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

.picked {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.pick {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 1rem;
  align-items: start;
}

.pick img {
  width: 96px;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
  display: block;
  background: var(--surface-hover);
}

.pick-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.filename {
  font-size: 0.85rem;
  word-break: break-all;
}

.dim {
  color: var(--muted);
  font-size: 0.75rem;
}

.dim.warn {
  color: #c88;
}

.saving {
  margin-left: 0.4rem;
}

.remove {
  padding: 0.2rem 0.5rem;
  line-height: 1;
}

.preview-id {
  font-size: 0.8rem;
  color: var(--muted);
}

.append {
  color: #2a8a4a;
}

.fresh {
  color: var(--text);
}

.mode {
  display: flex;
  gap: 1.25rem;
  margin: 0.75rem 0 1rem;
}

.radio {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.radio input {
  cursor: pointer;
}

.radio input:disabled + span {
  opacity: 0.45;
}

.pick-album {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  max-width: 520px;
}

select:disabled,
input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.assigned {
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.9;
}
</style>
