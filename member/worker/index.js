import { ROUTE_PATHS, pathToRegExp } from '../src/router/paths.js'
import { verifyAccessJwt } from './access.js'

/**
 * 這支 Worker 只在「靜態資產找不到對應檔案」時才會被呼叫
 * （wrangler.jsonc 的 assets.not_found_handling 設為 "none"），
 * 做法與公開站的 frontend/worker/index.js 一致。
 *
 * **Access 的驗證見 access.js**，這裡只負責在請求進來時呼叫它。
 * 真正擋人的是 Cloudflare 邊緣的 Access Application，這裡的檢查是防禦縱深，
 * 不是主要防線 —— 詳見 access.js 開頭的說明。
 *
 * `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` 沒填的時候（Access 還沒在 Dashboard 設定好），
 * 驗證會直接跳過，行為維持跟 Phase 6 之前一樣。**部署版本不要帶 ADMIN_TOKEN**，
 * 除非已經確認 Access 真的擋得住沒登入的請求 —— 見 PLAN.md Phase 6 的部署順序。
 */
const ROUTE_REGEXPS = ROUTE_PATHS.map(pathToRegExp)

/**
 * 代理到 PageWorker，並在這裡補上 Bearer 憑證。
 *
 * 憑證只存在 Worker 端，**瀏覽器永遠拿不到** —— 這也是 Phase 6 上 Access 之後
 * 的正確樣子：Access 擋在前面決定「誰能進來」，Worker 持有憑證決定「能做什麼」。
 *
 * 沒設定 ADMIN_TOKEN 時回 503 而不是靜默失敗。裸奔期間部署版本刻意不設這個
 * secret，所以線上後台會看到明確的「未設定憑證」而不是一堆看不懂的錯誤。
 */
async function proxyToApi(request, env, url) {
  if (!env.ADMIN_TOKEN) {
    return Response.json(
      {
        error:
          '此環境未設定 ADMIN_TOKEN，管理功能停用。這是預期行為：在 Cloudflare Access 上線前，部署版本刻意不帶寫入憑證。請在本機 wrangler dev 操作。',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const base = (env.PAGEWORKER_URL ?? 'https://pageworker.pageworker.workers.dev').replace(/\/$/, '')
  const target = base + url.pathname + url.search

  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${env.ADMIN_TOKEN}`)
  // Host 必須讓 fetch 自己決定，沿用原本的會被上游拒絕
  headers.delete('host')

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  })

  const out = new Headers(res.headers)

  // Workers 的 fetch 會自動解壓縮回應主體，但標頭裡仍留著上游的 Content-Encoding。
  // 原封不動轉發的話，瀏覽器會對「已經解壓過的資料」再解一次 —— 拿到的是亂碼。
  // Content-Length 同理，解壓後長度已經不同。兩個都必須拿掉，讓執行環境重算。
  out.delete('content-encoding')
  out.delete('content-length')
  out.delete('transfer-encoding')

  // 管理資料一律不快取：後台改完要立刻看得到結果
  out.set('Cache-Control', 'no-store')

  return new Response(res.body, { status: res.status, headers: out })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const access = await verifyAccessJwt(request, env)
    if (!access.ok) {
      return Response.json({ error: access.reason }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
    }

    if (url.pathname.startsWith('/api/')) {
      return proxyToApi(request, env, url)
    }

    const isKnownRoute = ROUTE_REGEXPS.some((re) => re.test(url.pathname))

    const shell = await env.ASSETS.fetch(new URL('/index.html', url))

    const headers = new Headers(shell.headers)
    // 後台不該被收錄。注意這個標頭只會出現在「有經過 Worker」的請求上 ——
    // `/` 對應到實體檔案 index.html，由資產層直接送出、不進 Worker，所以沒有這個標頭。
    // 那個缺口由 index.html 裡的 <meta name="robots"> 補上，兩者是互補而非重複。
    headers.set('X-Robots-Tag', 'noindex, nofollow')
    if (!isKnownRoute) {
      headers.set('Cache-Control', 'no-store')
    }

    return new Response(shell.body, {
      status: isKnownRoute ? 200 : 404,
      headers,
    })
  },
}
