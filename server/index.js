import { createApp } from './app.js'
import { PORT, NODE_ENV } from './config.js'
import { isQpayConfigured } from './modules/billing/qpay.js'
import { modules } from './modules/index.js'

const app = createApp()

// ⚠ Портыг өөр процесс эзэлсэн бол `listen` нь ЧИМЭЭГҮЙ унадаг байв.
//   `npm run dev` нь api, web хоёрыг зэрэг асаадаг тул web хэсэг ажиллаж
//   үлдэж, хөгжүүлэгч зөвхөн БҮХ /api дуудлага 500 болохыг л хардаг —
//   жинхэнэ шалтгаан нь дэлгэц дээр хаа нэгтээ алга болсон байдаг.
let failed = false

// ⚠ Windows дээр давхар стектэй (IPv4+IPv6) сокет нь НЭГ гэр бүлд амжилттай
//   холбогдоод НӨГӨӨД нь уначихдаг: `listening` эхэлж, EADDRINUSE ДАРАА нь
//   ирнэ. Тиймээс амжилтын мессежийг шууд хэвлэвэл «асчихлаа» гэж
//   андуурмаар харагдана. Нэг тактаар хойшлуулж, алдаа ирсэн эсэхийг
//   мэдсэний дараа шийднэ.
const server = app.listen(PORT, () => {
  setImmediate(() => {
    if (failed) return
    console.log(`\n🚀 МонголАжил API — http://localhost:${PORT}`)
    console.log(`   Орчин: ${NODE_ENV}`)
    console.log(`   Модуль (${modules.length}): ${modules.map(m => m.basePath.slice(1)).join(', ')}`)
    if (!isQpayConfigured()) {
      console.log('   ⓘ QPay тохируулаагүй — нэхэмжлэл дансаар төлөгдөж, админ гараар баталгаажуулна.')
    }
    console.log('')
  })
})

server.on('error', err => {
  failed = true
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ${PORT} порт аль хэдийн ашиглагдаж байна — API асаагүй.`)
    console.error('   Өөр `npm run dev` ажиллаж байгаа бололтой. Түүнийг хаагаад дахин эхлүүлнэ үү.')
    console.error(`   Эзэмшигчийг олох: netstat -ano | findstr :${PORT}\n`)
  } else {
    console.error('\n❌ API сервер эхэлж чадсангүй:', err.message, '\n')
  }
  process.exit(1)
})

// Илрээгүй алдаанд процесс чимээгүй үхэхээс сэргийлнэ
process.on('unhandledRejection', reason => {
  console.error('[алдаа] Боловсруулаагүй Promise:', reason)
})
