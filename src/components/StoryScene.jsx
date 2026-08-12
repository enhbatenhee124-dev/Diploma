// ------------------------------
// Гүйлгэлтийн түүхийн дүрс
// ------------------------------
// `ScrollStory`-гийн timeline энэ дүрсний хэсгүүдийг класс нэрээр нь олж
// хөдөлгөнө. Тиймээс энд ЗӨВХӨН геометр, класс нэрс байна — анимац бүхэлдээ
// `ScrollStory.jsx` дотор нэг timeline-д цуглуулагдсан. Ингэснээр аль хэсэг
// нь хэдийд хөдлөхийг НЭГ газраас уншиж болно.
// ------------------------------

const VB = 440
const CX = VB / 2
const CY = VB / 2

// Ажлын зарын карт
const CARD = { x: 120, y: 150, w: 200, h: 140, r: 16 }

/** Картын булан бүрийн L хэлбэрийн хаалт. Угсрахдаа гаднаас ниснэ. */
const BRACKET = 34
const CORNERS = [
  { id: 'tl', d: `M ${CARD.x} ${CARD.y + BRACKET} L ${CARD.x} ${CARD.y} L ${CARD.x + BRACKET} ${CARD.y}`, dx: -70, dy: -70 },
  { id: 'tr', d: `M ${CARD.x + CARD.w - BRACKET} ${CARD.y} L ${CARD.x + CARD.w} ${CARD.y} L ${CARD.x + CARD.w} ${CARD.y + BRACKET}`, dx: 70, dy: -70 },
  { id: 'br', d: `M ${CARD.x + CARD.w} ${CARD.y + CARD.h - BRACKET} L ${CARD.x + CARD.w} ${CARD.y + CARD.h} L ${CARD.x + CARD.w - BRACKET} ${CARD.y + CARD.h}`, dx: 70, dy: 70 },
  { id: 'bl', d: `M ${CARD.x + BRACKET} ${CARD.y + CARD.h} L ${CARD.x} ${CARD.y + CARD.h} L ${CARD.x} ${CARD.y + CARD.h - BRACKET}`, dx: -70, dy: 70 },
]

// Картын доторх «текст» мөрүүд
const CARD_LINES = [
  { y: CARD.y + 44, w: 120 },
  { y: CARD.y + 72, w: 152 },
  { y: CARD.y + 96, w: 96 },
]

/** Туйлын координат — 0° нь дээд цэг. */
function polar(r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

// Хүсэлт илгээгч ажилчид — картыг тойрсон цагираг дээр
const APPLICANT_R = 186
const APPLICANT_ANGLES = [18, 90, 162, 234, 306]

// 3 дахь нь «тохирсон» ажилтан. Индексийг нэг газар зарлаж, бусад код
// үүнээс уншина — эс бөгөөс аль нь тодрохыг хоёр газар засах шаардлагатай.
export const MATCHED_INDEX = 2

export const APPLICANTS = APPLICANT_ANGLES.map((deg, i) => {
  const [x, y] = polar(APPLICANT_R, deg)
  // Гаднаас нисэж ирэхийн тулд эхлэх цэг нь илүү хол
  const [fx, fy] = polar(APPLICANT_R + 150, deg)
  return { i, x, y, fromX: fx - x, fromY: fy - y, matched: i === MATCHED_INDEX }
})

/** Ажилтнаас карт руу татсан бага зэрэг нуман холбоос. */
const LINKS = APPLICANTS.map(a => {
  // Төгсгөлийн радиус нь картын ирмэгт хүрэх ёстой — хэт том байвал шугам
  // картаас тасарч, холболт мэдрэгдэхээ болино.
  const [ex, ey] = polar(104, APPLICANT_ANGLES[a.i])
  // Хяналтын цэгийг замын дундаас хажуу тийш түлхэж нум үүсгэнэ
  const mx = (a.x + ex) / 2
  const my = (a.y + ey) / 2
  const nx = -(ey - a.y) * 0.18
  const ny = (ex - a.x) * 0.18
  return { i: a.i, d: `M ${a.x} ${a.y} Q ${mx + nx} ${my + ny} ${ex} ${ey}`, matched: a.matched }
})

export default function StoryScene() {
  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      className="w-full h-auto max-w-[26rem] mx-auto"
      role="img"
      aria-label="Ажил зарлахаас цалин авах хүртэлх урсгалыг харуулсан хөдөлгөөнт дүрс"
    >
      {/* ⚠ Бүх өнгө нь БАРААН Mufi дэвсгэрт (#150E21 карт) зориулагдсан:
          цайвар зураас, тод аяг. Өнгө нь загварын хос акцентээс —
          ягаан #B884FF ба улбар шар #FF9D4A. `ScrollStory`-гийн алхмын
          өнгөтэй тааруулсан. */}
      <defs>
        <linearGradient id="scene-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B884FF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FF9D4A" stopOpacity="0.10" />
        </linearGradient>
        <filter id="scene-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 4-р алхам: туршлагын цагираг. Картыг тойрч зурагдана. */}
      <circle
        className="scene-ring"
        cx={CX}
        cy={CY}
        r={158}
        fill="none"
        stroke="#F0803F"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0"
        filter="url(#scene-glow)"
      />

      {/* 3-р алхам: холбоосууд */}
      <g fill="none" strokeWidth="2.2">
        {LINKS.map(link => (
          <path
            key={link.i}
            className={`scene-link scene-link-${link.i}`}
            d={link.d}
            stroke={link.matched ? '#FF9D4A' : '#8E88A0'}
            opacity="0"
          />
        ))}
      </g>

      {/* 2-р алхам: хүсэлт илгээгчид */}
      <g>
        {APPLICANTS.map(a => (
          <g
            key={a.i}
            className={`scene-applicant scene-applicant-${a.i}`}
            opacity="0"
            style={{ transformOrigin: `${a.x}px ${a.y}px` }}
          >
            {/* Бага зэрэг цайвар дугуй + ЦАГААН бүдүүвч. Дугуй нь картын
                дэвсгэрээс (#0E1522) ялгарах ёстой тул түүнээс нэг шат
                цайвар, ирмэг нь акцентын өнгөтэй. */}
            <circle cx={a.x} cy={a.y} r="17" fill="#1E2A3E" stroke="#8ECBFB" strokeOpacity="0.35" strokeWidth="1.5" />
            <circle cx={a.x} cy={a.y - 4} r="5.5" fill="#FFFFFF" />
            <path
              d={`M ${a.x - 8} ${a.y + 10} a 8 8 0 0 1 16 0`}
              fill="#FFFFFF"
            />
          </g>
        ))}
      </g>

      {/* 1-р алхам: зарын карт */}
      <g className="scene-card-group">
        <rect
          className="scene-card-body"
          x={CARD.x}
          y={CARD.y}
          width={CARD.w}
          height={CARD.h}
          rx={CARD.r}
          fill="url(#scene-card)"
          stroke="#B884FF"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          opacity="0"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />

        {CORNERS.map(c => (
          <path
            key={c.id}
            className={`scene-corner scene-corner-${c.id}`}
            d={c.d}
            fill="none"
            stroke="#B884FF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0"
          />
        ))}

        {CARD_LINES.map((line, i) => (
          <rect
            key={i}
            className={`scene-card-line scene-card-line-${i}`}
            x={CARD.x + 22}
            y={line.y}
            width={line.w}
            height={i === 0 ? 9 : 6}
            rx={3}
            fill="#FFFFFF"
            opacity={i === 0 ? 0.85 : 0.4}
            style={{ transformOrigin: `${CARD.x + 22}px ${line.y}px`, transform: 'scaleX(0)' }}
          />
        ))}
      </g>

      {/* 4-р алхам: түвшний тэмдэг */}
      <g className="scene-badge" opacity="0" style={{ transformOrigin: `${CARD.x + CARD.w}px ${CARD.y}px` }}>
        <rect x={CARD.x + CARD.w - 44} y={CARD.y - 20} width="72" height="34" rx="17" fill="#9D174D" />
        <text
          x={CARD.x + CARD.w - 8}
          y={CARD.y + 2}
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="#FFFFFF"
          fontFamily="Inter, system-ui, sans-serif"
        >
          Lv.2
        </text>
      </g>
    </svg>
  )
}

export { CORNERS, CARD_LINES }
