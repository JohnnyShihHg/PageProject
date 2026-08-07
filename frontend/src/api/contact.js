const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

/**
 * 送出聯絡表單。不重試——Turnstile token 是一次性的，重送等於用同一個 token
 * 再打一次，後端會直接拒絕（siteverify 對同一個 token 第二次驗證會失敗）。
 * 失敗時把後端訊息原樣往上拋，讓畫面顯示具體原因（例如「送出太頻繁」）
 * 而不是統一的「發生錯誤」。
 */
export async function submitContact(payload) {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // 非 JSON 回應（例如上游整個掛掉回 HTML）不該讓畫面顯示亂碼
  }

  if (!res.ok) {
    throw new Error(data?.error ?? `送出失敗 (HTTP ${res.status})`);
  }

  return data;
}
