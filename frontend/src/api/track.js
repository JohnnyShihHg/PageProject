const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

// 同一次瀏覽（分頁存活期間）同一個事件只送一次：避免使用者反覆開關同一張照片、
// 或 vue-router 重複觸發把數字灌大。重整頁面會重來，這樣「不重複」的粒度剛好。
const sent = new Set();

/**
 * 記錄一個互動事件。**永遠不會 throw，也不回傳任何東西** —— 這是背景 beacon，
 * 失敗了就算了，不能影響瀏覽。
 *
 * @param {'album_view'|'photo_open'} event
 * @param {{collectionId: string, category: string, photoId?: string, filename?: string}} data
 */
export function track(event, data) {
  try {
    if (!data || !data.collectionId) return;
    const dedupeKey = `${event}:${data.photoId || data.collectionId}`;
    if (sent.has(dedupeKey)) return;
    sent.add(dedupeKey);

    const payload = JSON.stringify({ event, ...data });
    const url = `${API_BASE}/api/track`;

    // sendBeacon：不受頁面卸載影響、不需要處理回應。用 text/plain 讓它算「簡單請求」
    // 不觸發 preflight（伺服器端會自己 JSON.parse）。
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'text/plain' }));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // 分析絕不影響使用者
  }
}
