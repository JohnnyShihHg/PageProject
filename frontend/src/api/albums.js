const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

let pending = null;

/**
 * 取得完整相簿資料，結構與舊的 data/albums.json 相同。
 *
 * 五個頁面共用同一個 promise，所以同一次瀏覽只會實際發出一次請求；
 * 換頁時直接拿快取，不會重打 API。
 */
export function loadAlbums() {
  if (!pending) {
    pending = fetch(`${API_BASE}/api/albums`)
      .then((res) => {
        if (!res.ok) throw new Error(`載入相簿資料失敗 (HTTP ${res.status})`);
        return res.json();
      })
      .catch((err) => {
        // 失敗不留快取，讓使用者重新進頁面時能再試一次
        pending = null;
        throw err;
      });
  }
  return pending;
}
