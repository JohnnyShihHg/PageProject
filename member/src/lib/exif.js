/**
 * 從 JPEG 讀出拍攝日期（EXIF DateTimeOriginal）。
 *
 * **為什麼需要這支**：瀏覽器端用 Canvas 壓縮會把 EXIF 整個丟掉（見 PLAN.md D3），
 * 所以拍攝日必須在壓縮之前先從原檔讀出來，否則就永遠拿不到了。
 *
 * 刻意只做「找 DateTimeOriginal」這一件事，不引入 exif-js 之類的相依：
 * 整個專案的相依只有 vue + vue-router，為了一個欄位加一包函式庫不划算。
 *
 * PNG / WebP 沒有這個欄位，回 null 由呼叫端自己決定要怎麼補（目前是退回檔案的
 * lastModified，再退回今天）。
 */

const TAG_DATETIME_ORIGINAL = 0x9003
const TAG_DATETIME_DIGITIZED = 0x9004
const TAG_DATETIME = 0x0132
const TAG_EXIF_IFD_POINTER = 0x8769

/** EXIF 的日期格式是 "YYYY:MM:DD HH:MM:SS"，取前 10 碼並把冒號換成連字號 */
function toIsoDate(exifDateTime) {
  const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(exifDateTime)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

function readTags(view, tiffStart, dirStart, littleEndian, wanted, out) {
  const entries = view.getUint16(dirStart, littleEndian)
  for (let i = 0; i < entries; i++) {
    const entry = dirStart + 2 + i * 12
    const tag = view.getUint16(entry, littleEndian)
    if (!wanted.has(tag)) continue

    const type = view.getUint16(entry + 2, littleEndian)
    const count = view.getUint32(entry + 4, littleEndian)

    if (tag === TAG_EXIF_IFD_POINTER) {
      const offset = view.getUint32(entry + 8, littleEndian)
      // EXIF IFD 是巢狀的第二層目錄，DateTimeOriginal 就住在裡面
      readTags(view, tiffStart, tiffStart + offset, littleEndian, wanted, out)
      continue
    }

    // 只處理 ASCII（type 2）；日期欄位都是這個型別
    if (type !== 2) continue
    // 長度 <= 4 的值會直接塞在 entry 裡，否則 entry 存的是偏移量
    const valueOffset = count <= 4 ? entry + 8 : tiffStart + view.getUint32(entry + 8, littleEndian)
    let s = ''
    for (let j = 0; j < count; j++) {
      const c = view.getUint8(valueOffset + j)
      if (c === 0) break
      s += String.fromCharCode(c)
    }
    out.set(tag, s)
  }
}

/**
 * @param {File|Blob} file
 * @returns {Promise<string|null>} YYYY-MM-DD，讀不到回 null
 */
export async function readExifDate(file) {
  try {
    // EXIF 一定在檔頭附近，只讀前 128 KB 就夠，不必把整張圖讀進記憶體
    const head = await file.slice(0, 128 * 1024).arrayBuffer()
    const view = new DataView(head)

    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null // 不是 JPEG

    let offset = 2
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) return null // 標記結構壞了，不猜
      const marker = view.getUint8(offset + 1)
      const size = view.getUint16(offset + 2)

      if (marker === 0xe1) {
        // APP1；確認是 "Exif\0\0" 而不是 XMP
        const isExif =
          view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0x0000
        if (!isExif) {
          offset += 2 + size
          continue
        }

        const tiffStart = offset + 10
        const endian = view.getUint16(tiffStart)
        if (endian !== 0x4949 && endian !== 0x4d4d) return null
        const littleEndian = endian === 0x4949

        const ifd0 = tiffStart + view.getUint32(tiffStart + 4, littleEndian)
        const found = new Map()
        readTags(
          view,
          tiffStart,
          ifd0,
          littleEndian,
          new Set([TAG_DATETIME_ORIGINAL, TAG_DATETIME_DIGITIZED, TAG_DATETIME, TAG_EXIF_IFD_POINTER]),
          found
        )

        // 優先序：拍攝時間 > 數位化時間 > 檔案時間
        for (const tag of [TAG_DATETIME_ORIGINAL, TAG_DATETIME_DIGITIZED, TAG_DATETIME]) {
          const raw = found.get(tag)
          const iso = raw && toIsoDate(raw)
          if (iso) return iso
        }
        return null
      }

      if (marker === 0xda) return null // 進到影像資料了，後面不會再有 EXIF
      offset += 2 + size
    }
    return null
  } catch {
    // 讀 EXIF 失敗絕對不該讓整個上傳流程停下來 —— 它只是個「猜日期」的便利功能
    return null
  }
}

/** 讀不到 EXIF 時的退路：檔案修改時間 → 今天 */
export function fallbackDate(file) {
  const d = file?.lastModified ? new Date(file.lastModified) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
