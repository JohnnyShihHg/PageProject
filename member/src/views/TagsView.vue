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
            <!-- 2026-08-07 起標籤只掛相簿，API 不再回 photo_count，「照片」欄一併拿掉 -->
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
                @click="tagToDelete = t"
              >
                刪除
              </button>
              <span v-if="rowMsg[t.id]" :class="['msg', rowMsg[t.id].ok ? 'ok' : 'bad']">
                {{ rowMsg[t.id].text }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!--
        T7：確認強度依「有沒有在用」而定。沒有任何相簿使用的標籤刪掉幾乎沒有影響，
        要求打字只是白費工；有在使用的一刪就會讓公開站上那些相簿的標籤消失，
        所以要打出標籤名稱才放行。
      -->
      <ConfirmDialog
        :open="!!tagToDelete"
        title="刪除標籤"
        :confirm-word="tagToDelete?.collection_count > 0 ? tagToDelete.name : ''"
        :busy="busy === tagToDelete?.id"
        @cancel="tagToDelete = null"
        @confirm="doDeleteTag"
      >
        <p v-if="tagToDelete?.collection_count > 0">
          <strong>{{ tagToDelete.name }}</strong> 目前有
          <strong>{{ tagToDelete.collection_count }}</strong> 本相簿在使用。
          刪掉之後這些相簿就不再帶有這個標籤，公開站上也會跟著消失。
        </p>
        <p v-else>
          <strong>{{ tagToDelete?.name }}</strong> 目前沒有任何相簿在使用，可以安全刪除。
        </p>
      </ConfirmDialog>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AsyncState from '../components/AsyncState.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { listTags, createTag, renameTag, deleteTag } from '../api/admin'

const tags = ref([])
const loading = ref(true)
const error = ref(null)
const drafts = reactive({})
const rowMsg = reactive({})
const busy = ref(null)
const tagToDelete = ref(null)
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
 * 刪除標籤會連帶移除所有關聯（schema 有 ON DELETE CASCADE），而且救不回來。
 * 確認彈窗的強度由 collection_count 決定，見 template 裡 ConfirmDialog 的說明。
 */
async function doDeleteTag() {
  const t = tagToDelete.value
  if (!t) return
  busy.value = t.id
  delete rowMsg[t.id]
  try {
    await deleteTag(t.id)
    tagToDelete.value = null
    await load()
  } catch (e) {
    rowMsg[t.id] = { ok: false, text: e.message }
    tagToDelete.value = null
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
