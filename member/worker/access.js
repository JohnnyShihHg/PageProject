// Cloudflare Access 的 JWT 驗證。
//
// **邊緣層才是真正擋人的地方**：Access Application 設定好之後，沒通過驗證的
// 請求根本不會被轉發到這支 Worker。這裡再驗一次是防禦縱深——防的是 Access
// Application 設定被改壞、或哪天多開了一條沒被涵蓋到的路徑，不是主要防線。
//
// 只驗 JWT 本身（簽章 / aud / exp / iss），刻意不檢查任何跟登入方式有關的東西
// （OTP、Google OAuth 都一樣）—— 這是 D2 的要求：以後換 IdP 只是 Dashboard 設定，
// 這支程式碼不用跟著改。
//
// ⚠️ ACCESS_TEAM_DOMAIN / ACCESS_AUD 沒設定時，驗證直接跳過（回傳 true）——
// 這是刻意的過渡狀態：在 Johnny 完成 Dashboard 設定、把這兩個值填進
// wrangler.jsonc 之前，行為要維持跟現在一樣（沒有這層保護，因為根本還沒建置好），
// 不能讓半成品的程式碼把還沒設定 Access 的部署版本直接鎖死。
// 兩個值都是公開資訊（AUD 單獨存在時不能拿來做任何事，見 PLAN.md 的討論），
// 進 wrangler.jsonc 的 vars 就好，不當 secret。

import { createRemoteJWKSet, jwtVerify } from 'jose'

// JWKS 端點在同一個 team domain 底下的固定路徑，不需要另外設定。
function jwksUrl(teamDomain) {
  return `https://${teamDomain}/cdn-cgi/access/certs`
}

// createRemoteJWKSet 內建快取 + 自動重試（首次找不到對應 kid 時重抓一次，
// 應付金鑰輪替），不需要自己再做一層快取。但它是模組層級的變數，換句話說
// 快取活在同一個 isolate 的生命週期內，重啟 Worker（重新部署）會自然清空。
let jwks = null
let jwksTeamDomain = null

function getJwks(teamDomain) {
  if (jwks && jwksTeamDomain === teamDomain) return jwks
  jwks = createRemoteJWKSet(new URL(jwksUrl(teamDomain)))
  jwksTeamDomain = teamDomain
  return jwks
}

/**
 * 驗證請求帶的 Access JWT。
 *
 * @returns {Promise<{ok: true, email: string} | {ok: false, reason: string}>}
 *   刻意不 throw ——呼叫端需要區分「沒設定 Access（跳過）」「沒有 JWT」
 *   「JWT 驗證失敗」這幾種狀況，分別給不同的錯誤訊息。
 */
export async function verifyAccessJwt(request, env) {
  const teamDomain = env.ACCESS_TEAM_DOMAIN
  const aud = env.ACCESS_AUD

  if (!teamDomain || !aud) {
    // 見檔案開頭的說明：Access 還沒設定完成時，維持「沒有這層保護」的現狀。
    return { ok: true, email: null, skipped: true }
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) {
    return { ok: false, reason: '缺少 Cf-Access-Jwt-Assertion（未經過 Access 驗證）' }
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
    })
    // email 只用來顯示「以 xxx 身份登入」，不能拿來做任何授權判斷 ——
    // 授權早在 Access 的 Policy 那一關就決定過了，JWT 能驗證通過本身就代表
    // 「這個人被允許進來」，這裡不應該再重複判斷一次名單。
    return { ok: true, email: typeof payload.email === 'string' ? payload.email : null }
  } catch (err) {
    return { ok: false, reason: `JWT 驗證失敗：${err.message}` }
  }
}
