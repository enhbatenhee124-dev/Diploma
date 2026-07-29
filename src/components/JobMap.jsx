import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DISTRICT_COORDS, CITY_CENTER } from '../data/constants'
import { formatCurrency } from '../utils/helpers'

// ============================================================
// Ойролцоох ажлуудын газрын зураг (FR-5.3)
// ============================================================
// OpenStreetMap ашиглана — API түлхүүр, төлбөр шаардахгүй.
//
// ⚠ Энэ файлыг `lazy()`-ээр дуудна: Leaflet нь ~150KB бөгөөд хэрэглэгчдийн
//   дийлэнх нь жагсаалтаар хайдаг. Газрын зураг руу шилжсэн үед л татна.
// ============================================================

// ------------------------------
// Тэмдэглэгээний дүрс
// ------------------------------
// Leaflet-ийн анхдагч дүрс нь харьцангуй замаар (`marker-icon.png`) ачаалдаг
// тул bundler-тэй үед эвдэрдэг. Тиймээс SVG-г шууд өгнө — нэмэлт файл
// татахгүй, өнгө нь аппын загвартай нийцнэ.
const pinIcon = (highlighted = false) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width: 30px; height: 40px;
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
                fill="${highlighted ? '#f59e0b' : '#8b5cf6'}" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="4.5" fill="white"/>
        </svg>
      </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
  })

/** Бүх тэмдэглэгээ багтахаар зургийг тохируулна. */
function FitToMarkers({ points }) {
  const map = useMap()

  useMemo(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0].position, 14)
      return
    }
    map.fitBounds(L.latLngBounds(points.map(p => p.position)), { padding: [40, 40] })
  }, [points, map])

  return null
}

export default function JobMap({ shifts, appliedIds = new Set(), basePath = '/jobs' }) {
  // Солбицолгүй зарыг дүүргийнх нь төвд байрлуулна
  const points = useMemo(
    () =>
      shifts
        .map(shift => {
          const exact = shift.lat != null && shift.lng != null
          const position = exact
            ? [shift.lat, shift.lng]
            : DISTRICT_COORDS[shift.district]

          return position ? { shift, position, exact } : null
        })
        .filter(Boolean),
    [shifts]
  )

  const approximate = points.filter(p => !p.exact).length

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <p className="text-white/60">Газрын зураг дээр харуулах ажил алга</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <MapContainer
          center={CITY_CENTER}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '28rem', width: '100%', background: '#0f172a' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitToMarkers points={points} />

          {points.map(({ shift, position, exact }) => (
            <Marker key={shift.id} position={position} icon={pinIcon(appliedIds.has(shift.id))}>
              <Popup>
                <div style={{ minWidth: '11rem' }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>{shift.title}</strong>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    <div>{formatCurrency(shift.hourlyWage)} / цаг</div>
                    <div>
                      {shift.district}
                      {!exact && ' (ойролцоо)'}
                    </div>
                  </div>
                  <Link
                    to={`${basePath}/${shift.id}`}
                    style={{ display: 'inline-block', marginTop: 8, fontWeight: 600, color: '#7c3aed' }}
                  >
                    Дэлгэрэнгүй →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {approximate > 0 && (
        <p className="text-xs text-white/40">
          {approximate} ажлын яг байршил заагаагүй тул дүүргийнх нь төвд харуулав.
        </p>
      )}
    </div>
  )
}
