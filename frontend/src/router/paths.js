/**
 * 全站路由路徑的唯一來源。
 *
 * vue-router（./index.js）與 Cloudflare Worker（../../worker/index.js）都從這裡取用。
 * 兩邊各自手寫一份清單遲早會分岔，屆時前端加了新路由但 Worker 白名單沒更新，
 * 合法網址會被判成 404 擋掉 —— 那比原本的 soft 404 嚴重得多。
 *
 * 動態片段一律寫成 `:param`，Worker 會轉成 `[^/]+` 比對。
 * 新增路由只改這裡，然後在 ./index.js 補上對應的元件。
 */
export const ROUTE_PATHS = [
  '/',
  '/album',
  '/album/:albumId',
  '/event',
  '/event/portrait',
  '/event/activity',
  '/about',
  '/contact',
]

/**
 * 把 ROUTE_PATHS 的一筆路徑轉成比對用的 RegExp。
 * 給 Worker 用；放這裡是為了讓轉換規則和路徑定義待在同一個檔案。
 */
export function pathToRegExp(path) {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const withParams = escaped.replace(/:[A-Za-z0-9_]+/g, '[^/]+')
  // 根路徑不加可選斜線，否則 `//` 也會被視為合法
  return path === '/' ? /^\/$/ : new RegExp(`^${withParams}/?$`)
}
