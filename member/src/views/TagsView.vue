<template>
  <div>
    <h1>標籤</h1>
    <p class="page-intro">
      共 {{ tags.length }} 個標籤。使用次數為 0 的可以安全刪除；有在使用的刪掉後，
      公開站上對應的標籤會一併消失。
    </p>

    <AsyncState :loading="loading" :error="error" :on-retry="load">
      <form class="new" @submit.prevent="add">
        <input v-model="newName" type="text" placeholder="新標籤名稱" required />
        <button type="submit" :disabled="adding">{{ adding ? '新增中…' : '新增' }}</button>
        <span v-if="addMsg" :class="['msg', addMsg.ok ? 'ok' : 'bad']">{{ addMsg.text }}</span>
      </form>

      <table class="tags">
        <thead>
          <tr>
            <th>名稱</th>
            <th class="num">照片</th>
            <th class="num">相簿</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tags" :key="t.id">
            <td>
              <input
                v-model="drafts[t.id]"
                type="text"
                @keyup.enter="rename(t)"
              />
            </td>
            <td class="num" :class="{ zero: t.photo_count === 0 }">{{ t.photo_count }}</td>
            <td class="num" :class="{ zero: t.collection_count === 0 }">{{ t.collection_count }}</td>
            <td class="ops">
              <button
                type="button"
                :disabled="drafts[t.id] === t.name || busy === t.id"
                @click="rename(t)"
              >
                改名
              </button>
              <button
                type="button"
                class="danger"
                :disabled="busy === t.id"
                @click="remove(t)"
              >
                {{ confirming === t.id ? '再按一次確認' : '刪除' }}
              </button>
              <span v-if="rowMsg[t.id]" :class="['msg', rowMsg[t.id].ok ? 'ok' : 'bad']">
                {{ rowMsg[t.id].text }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AsyncState from '../components/AsyncState.vue'
import { listTags, createTag, renameTag, deleteTag } from '../api/admin'

const tags = ref([])
const loading = ref(true)
const error = ref(null)
const drafts = reactive({})
const rowMsg = reactive({})
const busy = ref(null)
const confirming = ref(null)
const newName = ref('')
const adding = ref(false)
const addMsg = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await listTags()
    tags.value = data.tags
    for (const t of data.tags) drafts[t.id] = t.name
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

async function add() {
  adding.value = true
  addMsg.value = null
  try {
    await createTag(newName.value.trim())
    newName.value = ''
    addMsg.value = { ok: true, text: '已新增' }
    await load()
  } catch (e) {
    addMsg.value = { ok: false, text: e.message }
  } finally {
    adding.value = false
  }
}

async function rename(t) {
  busy.value = t.id
  delete rowMsg[t.id]
  try {
    await renameTag(t.id, drafts[t.id].trim())
    t.name = drafts[t.id].trim()
    rowMsg[t.id] = { ok: true, text: '已改名' }
  } catch (e) {
    rowMsg[t.id] = { ok: false, text: e.message }
  } finally {
    busy.value = null
  }
}

/**
 * 刪除要按兩次。標籤刪掉會連帶移除所有關聯（schema 有 ON DELETE CASCADE），
 * 而且救不回來 —— 單擊就刪太容易誤觸。
 */
async function remove(t) {
  if (confirming.value !== t.id) {
    confirming.value = t.id
    setTimeout(() => {
      if (confirming.value === t.id) confirming.value = null
    }, 4000)
    return
  }
  confirming.value = null
  busy.value = t.id
  delete rowMsg[t.id]
  try {
    await deleteTag(t.id)
    await load()
  } catch (e) {
    rowMsg[t.id] = { ok: false, text: e.message }
  } finally {
    busy.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.new {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

table.tags {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: middle;
}

th {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 500;
}

.num {
  text-align: right;
  width: 4.5rem;
  font-variant-numeric: tabular-nums;
}

.num.zero {
  color: var(--muted);
}

.ops {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}

input {
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.875rem;
  width: 100%;
  max-width: 20rem;
}

button {
  padding: 0.32rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  white-space: nowrap;
}

button:hover:not(:disabled) {
  background: var(--surface-hover);
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button.danger:hover:not(:disabled) {
  border-color: #d66;
  color: #d66;
}

.msg {
  font-size: 0.78rem;
}

.msg.ok {
  color: #2a8a4a;
}

.msg.bad {
  color: #d66;
}
</style>
