/**
 * 瀏覽器端壓縮，對齊 SharpProject/compress.js 的輸出規格。
 *
 * | | CLI（sharp） | 這裡（Canvas） |
 * |---|---|---|
 * | 主圖 | `resize({ width: 2000, withoutEnlargement: true })` + webp q80 | 同 |
 * | 縮圖 | `resize({ width: 800, withoutEnlargement: true })` + webp q80 | 同 |
 * | 方向 | `.rotate()`（依 EXIF 轉正） | `createImageBitmap(..., { imageOrientation: 'from-image' })` |
 * | 檔名 | `{原檔名}.webp` / `thumb_{原檔名}.webp` | 同 |
 *
 * **這幾個常數改動時 compress.js 要一起改**，否則同一個相簿裡會混著兩種規格的圖。
 */

export const MAIN_WIDTH = 2000
export const THUMB_WIDTH = 800
export const QUALITY = 0.8

/** 對齊 compress.js 的 supportedFormats */
export const ACCEPTED_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.tiff']

/** `照片.JPG` → `照片.webp`，與 compress.js 的 mainFilename 同一個規則 */
export function toWebpName(originalName) {
  const base = originalName.replace(/\.[^./\\]+$/, '')
  return `${base}.webp`
}

/**
 * `withoutEnlargement` 的意思是「只縮不放」：原圖比目標窄就維持原尺寸。
 * 沒有這個行為的話，小圖會被放大成模糊的 2000px。
 */
function targetSize(srcW, srcH, maxW) {
  if (srcW <= maxW) return { width: srcW, height: srcH }
  return { width: maxW, height: Math.round((srcH / srcW) * maxW) }
}

async function drawToWebp(bitmap, maxWidth) {
  const { width, height } = targetSize(bitmap.width, bitmap.height, maxWidth)
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: QUALITY })
  return { blob, width, height }
}

/**
 * 壓一張圖，回傳主圖與縮圖。
 *
 * `imageOrientation: 'from-image'` 是必要的：手機拍的直式照片 EXIF 帶著旋轉資訊，
 * 不套用的話畫出來會是躺著的。sharp 那邊是靠 `.rotate()` 做同一件事。
 *
 * @returns {{ filename, main: Blob, thumb: Blob, width, height, originalBytes }}
 */
export async function compressImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const main = await drawToWebp(bitmap, MAIN_WIDTH)
    const thumb = await drawToWebp(bitmap, THUMB_WIDTH)
    return {
      filename: toWebpName(file.name),
      main: main.blob,
      thumb: thumb.blob,
      // 寫進 D1 的尺寸必須是主圖的實際尺寸，公開站靠它算 aspect-ratio 佔位
      width: main.width,
      height: main.height,
      originalBytes: file.size,
    }
  } finally {
    bitmap.close()
  }
}
