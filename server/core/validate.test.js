import { describe, it, expect } from 'vitest'
import { isUuid, requireUuid, requireText, requireOneOf, requireInt, requireDate, optional } from './validate.js'

// Оролтын шалгалт нь аюулгүй байдлын хил учир нарийн тестлэнэ —
// frontend-ийн шалгалтыг тойрч API руу шууд хүсэлт явуулах боломжтой.

describe('isUuid', () => {
  it('жинхэнэ UUID хүлээн авна', () => {
    expect(isUuid('7c6de661-9132-4517-8336-509794ecb080')).toBe(true)
  })

  it('буруу утгыг татгалзана', () => {
    for (const bad of ['u1', '', null, undefined, 123, 'not-a-uuid', '7c6de661913245178336509794ecb080']) {
      expect(isUuid(bad)).toBe(false)
    }
  })
})

describe('requireUuid', () => {
  it('буруу үед 400 шиднэ', () => {
    expect(() => requireUuid('u1', 'Зарын ID')).toThrowError(/Зарын ID буруу байна/)
  })

  it('зөв үед утгыг буцаана', () => {
    const id = '7c6de661-9132-4517-8336-509794ecb080'
    expect(requireUuid(id)).toBe(id)
  })
})

describe('requireText', () => {
  it('хоосон мөрийг татгалзана', () => {
    expect(() => requireText('   ', 'Гарчиг')).toThrowError(/Гарчиг заавал шаардлагатай/)
  })

  it('хэт уртыг татгалзана', () => {
    expect(() => requireText('a'.repeat(200), 'Гарчиг', { max: 120 }))
      .toThrowError(/хэт урт/)
  })

  it('хоёр талын хоосон зайг арилгана', () => {
    expect(requireText('  Бариста  ', 'Гарчиг')).toBe('Бариста')
  })
})

describe('requireOneOf', () => {
  it('жагсаалтад байхгүй утгыг татгалзана', () => {
    expect(() => requireOneOf('нэрлэшгүй', ['applied', 'approved'], 'Төлөв'))
      .toThrowError(/Төлөв утга буруу байна/)
  })
})

describe('requireInt', () => {
  it('бутархайг татгалзана', () => {
    expect(() => requireInt(1.5, 'Цалин')).toThrowError(/бүхэл тоо/)
  })

  it('хязгаараас гарсныг татгалзана', () => {
    expect(() => requireInt(0, 'Хүний тоо', { min: 1, max: 500 })).toThrowError(/1-500 хооронд/)
  })

  it('тоон мөрийг хүлээн авна', () => {
    expect(requireInt('12000', 'Цалин')).toBe(12000)
  })
})

describe('requireDate', () => {
  it('буруу огноог татгалзана', () => {
    expect(() => requireDate('маргааш', 'Эхлэх хугацаа')).toThrowError(/огноо буруу/)
  })

  it('ISO хэлбэрт хөрвүүлнэ', () => {
    expect(requireDate('2026-08-01T09:00:00Z', 'Эхлэх')).toBe('2026-08-01T09:00:00.000Z')
  })
})

describe('optional', () => {
  it('заагаагүй талбарыг алгасана', () => {
    expect(optional(undefined, () => { throw new Error('дуудагдах ёсгүй') })).toBeUndefined()
  })

  it('заасан талбарыг шалгана', () => {
    expect(() => optional('', v => requireText(v, 'Гарчиг'))).toThrowError()
  })
})
