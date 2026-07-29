import { describe, it, expect } from 'vitest'
import { canTransition, STATUSES } from './service.js'

// ============================================================
// Хүсэлтийн урсгал (FR-6.3)
// ============================================================
// Энэ бол платформын гол бизнес дүрэм. RLS нь "мөрийг засаж чадах уу"
// гэдгийг л шалгадаг бөгөөд дарааллыг МЭДЭХГҮЙ — тиймээс энд тестлэнэ.
// ============================================================

describe('canTransition — ажил олгогч', () => {
  it('ирсэн хүсэлтийг зөвшөөрнө', () => {
    expect(canTransition('employer', 'applied', 'approved')).toBe(true)
  })

  it('зөвшөөрсний дараа ажлыг эхлүүлнэ', () => {
    expect(canTransition('employer', 'approved', 'in-progress')).toBe(true)
  })

  it('эхэлсэн ажлыг дуусгана', () => {
    expect(canTransition('employer', 'in-progress', 'completed')).toBe(true)
  })

  it('алхам алгасаж шууд дуусгаж ЧАДАХГҮЙ', () => {
    // Эс тэгвээс ажил хийгдээгүй байж "дууссан" болж, үнэлгээ өгөх
    // боломжтой болно — итгэлийн системийг эвдэнэ.
    expect(canTransition('employer', 'applied', 'completed')).toBe(false)
  })

  it('дууссан ажлыг буцааж чадахгүй', () => {
    expect(canTransition('employer', 'completed', 'in-progress')).toBe(false)
    expect(canTransition('employer', 'completed', 'cancelled')).toBe(false)
  })
})

describe('canTransition — ажилтан', () => {
  it('илгээсэн хүсэлтээ цуцална', () => {
    expect(canTransition('employee', 'applied', 'cancelled')).toBe(true)
  })

  it('ӨӨРИЙГӨӨ зөвшөөрч ЧАДАХГҮЙ', () => {
    expect(canTransition('employee', 'applied', 'approved')).toBe(false)
  })

  it('ажлаа дууссан гэж тэмдэглэж болно', () => {
    expect(canTransition('employee', 'in-progress', 'completed')).toBe(true)
  })
})

describe('canTransition — админ', () => {
  it('аль ч төлвөөс аль ч төлөв рүү шилжүүлнэ', () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        expect(canTransition('admin', from, to)).toBe(true)
      }
    }
  })
})

describe('canTransition — тодорхойгүй утга', () => {
  it('мэдэгдэхгүй дүрийг татгалзана', () => {
    expect(canTransition('хэн_нэгэн', 'applied', 'approved')).toBe(false)
  })

  it('мэдэгдэхгүй төлвийг татгалзана', () => {
    expect(canTransition('employer', 'нэрлэшгүй', 'approved')).toBe(false)
  })
})
