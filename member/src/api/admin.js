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

export const listCollections = () => request('/api/admin/collections')

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
