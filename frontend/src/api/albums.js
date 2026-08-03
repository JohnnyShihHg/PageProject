const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

let pending = null;

/**
 * 偶發的網路/後端抖動重試一次就好。實測正式環境出現過一次 503，
 * 沒有重試的話使用者就會看到空白的照片牆直到自己重新整理。
 */
async function fetchAlbums(attempts = 2, delayMs = 300) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${API_BASE}/api/albums`);
      if (!res.ok) throw new Error(`載入相簿資料失敗 (HTTP ${res.status})`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

/**
 * 取得完整相簿資料，結構與舊的 data/albums.json 相同。
 *
 * 五個頁面共用同一個 promise，所以同一次瀏覽只會實際發出一次請求；
 * 換頁時直接拿快取，不會重打 API。
 */
export function loadAlbums() {
  if (!pending) {
    pending = fetchAlbums().catch((err) => {
      // 失敗不留快取，讓使用者重新進頁面時能再試一次
      pending = null;
      throw err;
    });
  }
  return pending;
}
