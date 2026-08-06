<template>
  <div>
    <h1>站台文案</h1>
    <p class="page-intro">
      編輯公開站的文字內容。<strong>目前只有 About 頁</strong>。
      改完 About 頁最慢 5 分鐘後生效（API 有邊緣快取）。
    </p>

    <AsyncState :loading="loading" :error="error" :on-retry="load">
      <section class="panel">
        <h2>About 頁</h2>
        <p class="hint">
          若 API 讀不到這份文案（例如 D1 暫時故障），公開站會顯示寫死在
          <code>AboutView.vue</code> 裡的備用文字，而不是空白。改這裡不影響那份備用文字。
        </p>

        <form class="form" @submit.prevent="save">
          <label class="wide">
            <span>姓名／開場</span>
            <input v-model="form['about.name']" type="text" required />
          </label>
          <label class="wide">
            <span>自我介紹</span>
            <textarea v-model="form['about.intro']" rows="3" required></textarea>
          </label>
          <label class="wide">
            <span>服務項目</span>
            <input v-model="form['about.services']" type="text" required />
          </label>
          <label class="wide">
            <span>SNS 導引</span>
            <input v-model="form['about.sns']" type="text" required />
          </label>
          <label class="wide">
            <span>頁尾金句</span>
            <input v-model="form['about.quote']" type="text" required />
          </label>

          <div class="actions">
            <button type="submit" :disabled="!dirty || saving">
              {{ saving ? '儲存中…' : '儲存' }}
            </button>
            <button type="button" class="ghost" :disabled="!dirty || saving" @click="reset">還原</button>
            <span v-if="msg" :class="['msg', msg.ok ? 'ok' : 'bad']">{{ msg.text }}</span>
          </div>
        </form>
      </section>
    </AsyncState>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import AsyncState from '../components/AsyncState.vue'
import { getContent, updateContent } from '../api/admin'

const FIELDS = ['about.name', 'about.intro', 'about.services', 'about.sns', 'about.quote']

const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const msg = ref(null)

const form = reactive(Object.fromEntries(FIELDS.map((k) => [k, ''])))
const saved = reactive(Object.fromEntries(FIELDS.map((k) => [k, ''])))

const dirty = computed(() => FIELDS.some((k) => form[k] !== saved[k]))

async function load() {
  loading.value = true
  error.value = null
  try {
    const content = await getContent()
    for (const k of FIELDS) {
      form[k] = content[k] ?? ''
      saved[k] = content[k] ?? ''
    }
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

function reset() {
  for (const k of FIELDS) form[k] = saved[k]
  msg.value = null
}

async function save() {
  saving.value = true
  msg.value = null
  try {
    // 只送有改動的欄位：API 會拒絕空字串，其餘欄位維持原樣不受影響
    const patch = Object.fromEntries(FIELDS.filter((k) => form[k] !== saved[k]).map((k) => [k, form[k]]))
    const content = await updateContent(patch)
    for (const k of FIELDS) {
      form[k] = content[k] ?? form[k]
      saved[k] = content[k] ?? saved[k]
    }
    msg.value = { ok: true, text: '已儲存' }
  } catch (e) {
    msg.value = { ok: false, text: e.message }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.panel {
  margin-top: 1.5rem;
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
  margin-bottom: 1.25rem;
}

.form {
  display: grid;
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

input,
textarea {
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

input:focus,
textarea:focus {
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

button.ghost {
  border-color: transparent;
  color: var(--muted);
}

.actions {
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
</style>
