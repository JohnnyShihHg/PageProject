/**
 * 管理後台路由路徑的唯一來源。
 *
 * 與 frontend 同樣的做法（見 frontend/src/router/paths.js）：vue-router 與
 * Worker 的 404 判斷都讀這一份，避免兩邊各自手寫清單而分岔 —— 分岔的後果是
 * 前端加了新路由但 Worker 把它當 404 擋掉。
 */
export const ROUTE_PATHS = [
  '/',
  '/albums',
  '/albums/:collectionId',
  '/tags',
  '/upload',
  '/content',
]

/** 把 ROUTE_PATHS 的一筆路徑轉成比對用的 RegExp（給 Worker 用） */
export function pathToRegExp(path) {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const withParams = escaped.replace(/:[A-Za-z0-9_]+/g, '[^/]+')
  return path === '/' ? /^\/$/ : new RegExp(`^${withParams}/?$`)
}
