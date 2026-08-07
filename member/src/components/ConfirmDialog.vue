<template>
  <!--
    刪除確認的共用彈窗。兩種模式：

    - `confirmWord` 沒給 → 簡單模式，按一下「確認」就執行
    - `confirmWord` 有給 → 打字模式，要一字不差打出那個字串才會啟用按鈕

    為什麼不用瀏覽器內建的 `confirm()`：那個彈窗擋住整個分頁、無法顯示
    「即將刪除哪幾本」這種清單，也沒辦法做打字確認。

    取代掉的舊做法是「再按一次以確認」的兩段式按鈕。那個做法在單筆刪除還行，
    但批次刪除時使用者看不到自己到底選了什麼就得按下去，風險太高。
  -->
  <teleport to="body">
    <div v-if="open" class="overlay" @click.self="cancel">
      <div
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @keydown.esc="cancel"
      >
        <h2 :id="titleId" class="title">{{ title }}</h2>

        <div class="body">
          <slot />
        </div>

        <label v-if="confirmWord" class="typed">
          <span>
            請輸入「<code>{{ confirmWord }}</code>」以啟用刪除
          </span>
          <input
            ref="inputRef"
            v-model="typed"
            type="text"
            :placeholder="confirmWord"
            autocomplete="off"
            @keyup.enter="canConfirm && confirm()"
          />
        </label>

        <div class="actions">
          <button type="button" class="ghost" :disabled="busy" @click="cancel">取消</button>
          <button type="button" class="danger" :disabled="!canConfirm || busy" @click="confirm">
            {{ busy ? '處理中…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, useId } from 'vue'

const props = defineProps({
  open: Boolean,
  title: { type: String, required: true },
  /** 有給就是打字模式，使用者必須一字不差打出來 */
  confirmWord: { type: String, default: '' },
  confirmLabel: { type: String, default: '刪除' },
  /** 由父層控制：送出中時鎖住兩顆按鈕，避免重複送出 */
  busy: Boolean,
})

const emit = defineEmits(['confirm', 'cancel'])

const titleId = useId()
const typed = ref('')
const inputRef = ref(null)

const canConfirm = computed(() => !props.confirmWord || typed.value === props.confirmWord)

// 每次開啟都清空並聚焦。不清空的話上一次打的字還留著，
// 下一次開啟時「確認」按鈕會直接是啟用狀態 —— 那就完全失去打字確認的意義了。
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    typed.value = ''
    await nextTick()
    inputRef.value?.focus()
  }
)

function cancel() {
  if (props.busy) return
  emit('cancel')
}

function confirm() {
  if (!canConfirm.value || props.busy) return
  emit('confirm')
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.45);
}

.dialog {
  width: 100%;
  max-width: 460px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}

.title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}

.body {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

.body :deep(ul) {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
  max-height: 30vh;
  overflow-y: auto;
}

.body :deep(strong) {
  color: var(--text);
}

.typed {
  display: block;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.typed code {
  color: var(--text);
  font-size: 0.9em;
}

.typed input {
  display: block;
  width: 100%;
  margin-top: 0.4rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.actions button {
  padding: 0.45rem 1rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}

.actions button:hover:not(:disabled) {
  background: var(--surface-hover);
}

.actions .danger {
  border-color: #c33;
  color: #c33;
}

.actions .danger:hover:not(:disabled) {
  background: #c33;
  color: #fff;
}

.actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
