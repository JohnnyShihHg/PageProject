import { ROUTE_PATHS, pathToRegExp } from '../src/router/paths.js'

/**
 * 這支 Worker 只在「靜態資產找不到對應檔案」時才會被呼叫
 * （wrangler.jsonc 的 assets.not_found_handling 設為 "none"），
 * 做法與公開站的 frontend/worker/index.js 一致。
 *
 * ⚠️ 目前**沒有任何認證**。Cloudflare Access 排在 Phase 6（Johnny 決定），
 * 在那之前這個網址是公開的。因此：
 *   - 部署版本不要帶 ADMIN_TOKEN 或任何能寫 PageWorker 的憑證
 *   - 寫入功能請在本機 `wrangler dev` 測試
 * Phase 6 完成後，這裡要加上 Cf-Access-Jwt-Assertion 的驗證，
 * 並且只驗 JWT、不要對登入方式（OTP / Google）做任何假設。
 */
const ROUTE_REGEXPS = ROUTE_PATHS.map(pathToRegExp)

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
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
