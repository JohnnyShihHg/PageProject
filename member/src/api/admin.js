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

export const listTags = () => request('/api/admin/tags')

export const createTag = (name) => request('/api/admin/tags', { method: 'POST', body: { name } })

export const renameTag = (id, name) => request('/api/admin/tags', { method: 'POST', body: { id, name } })

export const deleteTag = (id) => request(`/api/admin/tags/${id}`, { method: 'DELETE' })
