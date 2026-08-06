const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

let pending = null;

/**
 * 站台文案（目前只有 About 頁）。**呼叫端一定要自己接住失敗**並退回內建的
 * fallback 文字（見 member/PLAN.md 的 D4）——這裡刻意不重試到底、不吞錯誤，
 * 失敗就是失敗，決定要不要顯示 fallback 是呼叫端的責任。
 */
async function fetchContent(attempts = 2, delayMs = 300) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${API_BASE}/api/content`);
      if (!res.ok) throw new Error(`載入文案失敗 (HTTP ${res.status})`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

/** 回傳 { [key]: value } 的文案物件，例如 content['about.name'] */
export function loadContent() {
  if (!pending) {
    pending = fetchContent().catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
}
