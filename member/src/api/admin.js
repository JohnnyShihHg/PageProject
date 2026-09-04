/**
 * 後台 API 客戶端。
 *
 * 所有請求都打自己這個 Worker 的 /api/*，由 Worker 代理到 PageWorker 並補上
 * Bearer 憑證。**瀏覽器端不持有任何憑證**，這裡也不該出現 token 相關的程式碼。
 */

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // 任何寫入都可能改動相簿清單 —— 清掉快取，未來新增的寫入端點自動涵蓋。
  if (method !== 'GET') invalidateCollectionsCache()

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // 非 JSON 的錯誤（例如上游掛掉回 HTML）不該讓畫面炸掉
      throw new ApiError(`伺服器回應非預期格式（HTTP ${res.status}）`, res.status)
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.error ?? `請求失敗（HTTP ${res.status}）`, res.status)
  }
  return data
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  /** 503 代表這個環境沒設定憑證（裸奔期的部署版本），要跟真的故障區分開 */
  get isDisabled() {
    return this.status === 503
  }
}

// GET /api/admin/collections 每次呼叫都會掃過全站每一張照片列（rows read 很貴），
// 而 AlbumsView / UploadView 在同一次瀏覽裡會各打一次、上傳後又補一次。用 module
// 層級的 promise 快取讓它們共用同一次請求；任何寫入（request() 裡非 GET 的呼叫，
// 或 uploadPhotos）都會清掉快取，下一次讀就是新的。
let collectionsCache = null

export function invalidateCollectionsCache() {
  collectionsCache = null
}

export function listCollections() {
  if (!collectionsCache) {
    collectionsCache = request('/api/admin/collections').catch((e) => {
      collectionsCache = null // 失敗不留快取，下次進頁面能重試
      throw e
    })
  }
  return collectionsCache
}

/** 單一相簿 + 它的照片與標籤。不掃全站，只讀這一本。 */
export const getCollection = (id) =>
  request(`/api/admin/collections/${encodeURIComponent(id)}`).then((d) => d.collection)

export const updateCollection = (id, patch) =>
  request(`/api/admin/collections/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })

export const updatePhoto = (photoId, patch) =>
  request(`/api/admin/photos/${encodeURIComponent(photoId)}`, { method: 'PATCH', body: patch })

/** 只刪 D1，R2 上的檔案保留（誤刪還救得回來，見 PLAN.md D5） */
export const deletePhoto = (photoId) =>
  request(`/api/admin/photos/${encodeURIComponent(photoId)}`, { method: 'DELETE' })

/** 刪整本相簿，含裡面所有照片；同樣只動 D1。回傳 photosDeleted 供確認用 */
export const deleteCollection = (id) =>
  request(`/api/admin/collections/${encodeURIComponent(id)}`, { method: 'DELETE' })

/**
 * 批次刪除照片／相簿。
 *
 * **刻意走專用端點而不是迴圈呼叫上面的單筆函式**：後端用一個 db.batch() 交易
 * 處理完，整批一起成功或一起失敗。迴圈打 N 次的話中途失敗會留下「刪了一半」
 * 的狀態，畫面與資料庫不一致而且沒有地方記錄哪些成功了。
 *
 * 任何一個 id 不存在，後端會整批拒絕並回 404 列出缺的，不會靜默略過。
 */
export const bulkDeletePhotos = (photoIds) =>
  request('/api/admin/photos/bulk-delete', { method: 'POST', body: { photoIds } })

export const bulkDeleteCollections = (ids) =>
  request('/api/admin/collections/bulk-delete', { method: 'POST', body: { ids } })

/** photoIds 的順序就是新順序，必須是該相簿的完整清單（API 會擋不完整的請求） */
export const reorderPhotos = (collectionId, photoIds) =>
  request('/api/admin/photos/reorder', { method: 'POST', body: { collectionId, photoIds } })

/**
 * 上傳一批已在瀏覽器壓好的照片。
 *
 * 用 multipart 而不是 JSON + base64：base64 會讓傳輸量膨脹約 33%，
 * 而且要先把整批圖讀成字串塞進記憶體。
 *
 * @param {object} meta { category, collection: {...}, photos: [{ filename, width, height, alt, tags }] }
 * @param {Array<{main: Blob, thumb: Blob}>} files 順序必須與 meta.photos 一致
 */
export async function uploadPhotos(meta, files) {
  const form = new FormData()
  form.append('meta', JSON.stringify(meta))
  files.forEach((f, i) => {
    form.append(`main_${i}`, f.main, meta.photos[i].filename)
    form.append(`thumb_${i}`, f.thumb, `thumb_${meta.photos[i].filename}`)
  })

  // 不要自己設 Content-Type：boundary 必須由瀏覽器產生
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  invalidateCollectionsCache() // 這支不走 request()，要自己清

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(`伺服器回應非預期格式（HTTP ${res.status}）`, res.status)
    }
  }
  if (!res.ok) throw new ApiError(data?.error ?? `上傳失敗（HTTP ${res.status}）`, res.status)
  return data
}

/** 回傳 { [key]: value }，例如 content['about.name'] */
export const getContent = () => request('/api/admin/content').then((d) => d.content)

/** patch 是 { [key]: value }，只需要送有改動的欄位 */
export const updateContent = (patch) =>
  request('/api/admin/content', { method: 'PUT', body: patch }).then((d) => d.content)

export const listTags = () => request('/api/admin/tags')

export const createTag = (name) => request('/api/admin/tags', { method: 'POST', body: { name } })

export const renameTag = (id, name) => request('/api/admin/tags', { method: 'POST', body: { id, name } })

export const deleteTag = (id) => request(`/api/admin/tags/${id}`, { method: 'DELETE' })
