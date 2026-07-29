import { createApp } from './app.js'
import { PORT, NODE_ENV } from './config.js'
import { isQpayConfigured } from './modules/billing/qpay.js'
import { modules } from './modules/index.js'

const app = createApp()

app.listen(PORT, () => {
  console.log(`\n🚀 МонголАжил API — http://localhost:${PORT}`)
  console.log(`   Орчин: ${NODE_ENV}`)
  console.log(`   Модуль (${modules.length}): ${modules.map(m => m.basePath.slice(1)).join(', ')}`)
  if (!isQpayConfigured()) {
    console.log('   ⓘ QPay тохируулаагүй — нэхэмжлэл дансаар төлөгдөж, админ гараар баталгаажуулна.')
  }
  console.log('')
})

// Илрээгүй алдаанд процесс чимээгүй үхэхээс сэргийлнэ
process.on('unhandledRejection', reason => {
  console.error('[алдаа] Боловсруулаагүй Promise:', reason)
})
