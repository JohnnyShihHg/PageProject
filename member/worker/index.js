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

  // ⚠️ **正式環境一定要走 Service Binding，不能用一般的 fetch()。**
  //
  // member.pageworker.workers.dev 與 pageworker.pageworker.workers.dev 在
  // **同一個 zone**（pageworker.workers.dev）。Cloudflare 禁止 Worker 用全域
  // fetch() 呼叫同 zone 的另一個 Worker，會直接回 `error code: 1042`：
  //   「Worker tried to fetch from another Worker on the same zone, which is
  //     only supported when the global_fetch_strictly_public compatibility flag is used.」
  // 那個相容性旗標對 workers.dev 子網域無效（只對自訂網域有用），所以正解是
  // Service Binding —— 不走公開網路、不額外計費、也不依賴任何旗標。
  //
  // **這個坑到 Phase 6 才爆出來的原因**：本機開發走 127.0.0.1 不受此限制，
  // 而正式環境在設定 ADMIN_TOKEN 之前，上面那段就先回 503 了 ——
  // 「正式 member 打正式 PageWorker」這條路徑從來沒有真的執行過。
  //
  // 本機仍走 HTTP：`.dev.vars` 有設 PAGEWORKER_URL 指向 127.0.0.1:8791，
  // 那條路徑已經驗證可用，不需要為了本機開發去處理 dev registry 的連線問題。
  const base = (env.PAGEWORKER_URL ?? 'https://pageworker.pageworker.workers.dev').replace(/\/$/, '')
  const target = base + url.pathname + url.search

  // 刻意只轉發必要的標頭，不整包原封不動轉發：PageWorker 不需要、也不該收到
  // Johnny 的 Access session（Cf-Access-Jwt-Assertion / CF_Authorization cookie）。
  // 那是給 member 自己驗證用的，往上游送沒有任何好處。
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${env.ADMIN_TOKEN}`)
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)

  const init = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  }

  const res = env.PAGEWORKER_URL
    ? await fetch(target, init)
    : await env.PAGEWORKER.fetch(new Request(target, init))

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
