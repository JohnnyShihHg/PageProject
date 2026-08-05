<template>
  <!--
    載入中／出錯／憑證未設定 三種狀態的統一呈現。

    公開站的相簿頁在 API 失敗時是 `console.error` 然後整片空白，
    debug 時分不出是載入中、壞了、還是真的沒資料 —— 後台不要重蹈覆轍，
    每一種狀態都要說得出自己是什麼。
  -->
  <div v-if="loading" class="state state-loading">載入中…</div>

  <div v-else-if="error?.isDisabled" class="state state-disabled">
    <strong>管理功能在此環境停用</strong>
    <p>{{ error.message }}</p>
  </div>

  <div v-else-if="error" class="state state-error">
    <strong>載入失敗</strong>
    <p>{{ error.message }}</p>
    <button v-if="onRetry" type="button" @click="onRetry">重試</button>
  </div>

  <slot v-else />
</template>

<script setup>
defineProps({
  loading: Boolean,
  error: { type: Object, default: null },
  onRetry: { type: Function, default: null },
})
</script>

<style scoped>
.state {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  background: var(--surface);
}

.state strong {
  display: block;
  margin-bottom: 0.35rem;
}

.state p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

.state-loading {
  color: var(--muted);
}

.state-disabled {
  border-color: var(--warn-line);
  background: var(--warn-bg);
}

.state-disabled strong {
  color: var(--warn-text);
}

.state-error {
  border-color: #d66;
}

.state-error strong {
  color: #d66;
}

button {
  margin-top: 0.75rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
}

button:hover {
  background: var(--surface-hover);
}
</style>
