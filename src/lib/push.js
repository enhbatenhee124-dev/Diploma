import { PushNotifications } from '@capacitor/push-notifications'
import { registerDevice, unregisterDevice } from '../data/queries'
import { isNative } from '../config/runtime'

// ============================================================
// Push мэдэгдэл — клиент тал
// ============================================================
// Зөвхөн Android аппад ажиллана. Вэб дээр бүх функц шууд буцна тул
// дуудагч тал `isNative` шалгах шаардлагагүй.
//
// Урсгал:
//   1. Хэрэглэгч нэвтрэх    → зөвшөөрөл асууж, FCM токеныг сервэрт бүртгэнэ
//   2. Мэдэгдэл ирэх        → апп нээлттэй бол Android өөрөө харуулна
//   3. Мэдэгдэл дарах       → апп нээгдэж, `onOpen` дуудагдана
//   4. Хэрэглэгч гарах      → токеныг устгана
//
// ⚠ Push нь БАТАЛГААГҮЙ суваг: зөвшөөрөл өгөөгүй, Google Play үйлчилгээ
//   байхгүй, сүлжээгүй байж болно. Аль ч алдаа аппыг зогсоохгүй — in-app
//   мэдэгдэл (хонхны дүрс) нь үндсэн суваг хэвээр (NFR-6).
// ============================================================

/** Хамгийн сүүлд серверт бүртгэсэн токен — гарах үед устгахад хэрэгтэй. */
let currentToken = null

/** Давхар бүртгэхээс сэргийлнэ (StrictMode нь effect-ийг хоёр удаа дууддаг). */
let listenersReady = false

/**
 * Push-ыг идэвхжүүлнэ. Хэрэглэгч нэвтэрсний ДАРАА дуудна — токен бүртгэхэд
 * нэвтрэлт шаардлагатай.
 *
 * @param {(data: Record<string,string>) => void} onOpen
 *        Мэдэгдэл дарж аппыг нээхэд дуудагдана.
 */
export async function enablePush(onOpen) {
  if (!isNative) return

  try {
    // Android 13-аас (API 33) мэдэгдэл харуулахад ЗӨВШӨӨРӨЛ шаардана.
    // Аль хэдийн шийдсэн бол дахин асуухгүй.
    let status = await PushNotifications.checkPermissions()
    if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
      status = await PushNotifications.requestPermissions()
    }
    if (status.receive !== 'granted') return

    if (!listenersReady) {
      listenersReady = true

      // FCM токен бэлэн болмогц дуудагдана. Токен үе үе шинэчлэгддэг тул
      // энэ нь нэг удаагийн эвент биш.
      await PushNotifications.addListener('registration', async ({ value }) => {
        currentToken = value
        const res = await registerDevice(value)
        if (!res.ok) console.warn('[push] токен бүртгэж чадсангүй:', res.error)
      })

      await PushNotifications.addListener('registrationError', err => {
        // Ихэвчлэн google-services.json дутуу эсвэл Google Play үйлчилгээгүй
        console.warn('[push] бүртгэл амжилтгүй:', err?.error || err)
      })

      // Мэдэгдэл дээр дарж аппыг нээхэд
      await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        onOpen?.(notification?.data || {})
      })
    }

    await PushNotifications.register()
  } catch (err) {
    console.warn('[push] идэвхжүүлж чадсангүй:', err?.message || err)
  }
}

/**
 * Гарах үед токеныг серверээс устгана.
 *
 * ⚠ Нэвтрэлт тасрахААС ӨМНӨ дуудах ёстой — устгах хүсэлт нь хэрэглэгчийн
 *   токеноор баталгаажина.
 */
export async function disablePush() {
  if (!isNative || !currentToken) return

  const token = currentToken
  currentToken = null

  try {
    await unregisterDevice(token)
  } catch (err) {
    console.warn('[push] токен устгаж чадсангүй:', err?.message || err)
  }
}
