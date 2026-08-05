import { ROUTE_PATHS, pathToRegExp } from '../src/router/paths.js'

/**
 * 這支 Worker 只在「靜態資產找不到對應檔案」時才會被呼叫
 * （wrangler.jsonc 的 assets.not_found_handling 設為 "none"）。
 * 所以圖片、JS、CSS 這些實際存在的檔案完全不經過這裡。
 *
 * 它要解決的問題：先前 not_found_handling 是 "single-page-application"，
 * 任何不存在的網址都會拿到 HTTP 200 + 首頁 HTML，Google 因此把大量垃圾網址
 * 當成有效頁面收錄（soft 404）。
 *
 * 現在改成：路徑符合 ROUTE_PATHS 才回 200（交給 vue-router 前端接手），
 * 否則同樣回首頁 HTML 但帶 404 狀態碼 —— 使用者看到的畫面不變，爬蟲拿到正確語意。
 */
const ROUTE_REGEXPS = ROUTE_PATHS.map(pathToRegExp)

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const isKnownRoute = ROUTE_REGEXPS.some((re) => re.test(url.pathname))

    // 一律取首頁 HTML 當外殼；SPA 由前端路由決定實際畫面。
    const shell = await env.ASSETS.fetch(new URL('/index.html', url))

    const headers = new Headers(shell.headers)
    if (!isKnownRoute) {
      // 404 不該被快取，否則之後真的新增了這條路由還會拿到舊的錯誤結果。
      headers.set('Cache-Control', 'no-store')
    }

    return new Response(shell.body, {
      status: isKnownRoute ? 200 : 404,
      headers,
    })
  },
}
