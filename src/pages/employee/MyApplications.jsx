import { FileText, Clock, CheckCircle, XCircle, ArrowRight, Star } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../hooks/useNotification'
import {
  useShifts, useApplications, useReviews, useEmployerProfiles, combine,
} from '../../hooks/useData'
import { setApplicationStatus, createReview } from '../../data/queries'
import { Loading, ErrorBox } from '../../components/States'

const statusColors = {
  'applied': 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  'approved': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'in-progress': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'completed': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'cancelled': 'text-red-400 bg-red-400/10 border-red-400/20',
}

const statusLabels = {
  'applied': 'Оролцсон',
  'approved': 'Зөвшөөрсөн',
  'in-progress': 'Хийгдэж буй',
  'completed': 'Дууссан',
  'cancelled': 'Цуцлагдсан',
}

const StarRating = ({ rating, onChange, size = "w-5 h-5" }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function MyApplications() {
  const { user } = useAuth()
  const { notify } = useNotification()
  const shiftsQ = useShifts()
  const appsQ = useApplications()
  const reviewsQ = useReviews()
  const orgsQ = useEmployerProfiles()
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, reviewsQ)

  const shifts = shiftsQ.data
  const localApplications = appsQ.data
  const localReviews = reviewsQ.data
  const [ratingModal, setRatingModal] = useState(null)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')

  const getShift = shiftId => shifts.find(s => s.id === shiftId)
  const getEmployerProfile = employerId => orgsQ.data.find(p => p.userId === employerId)
  const getEmployer = employerId => {
    const org = getEmployerProfile(employerId)
    return org ? { name: org.orgName } : null
  }
  const getReview = (applicationId, reviewerId) =>
    localReviews.find(r => r.applicationId === applicationId && r.reviewerId === reviewerId)

  const handleSubmitRating = async () => {
    if (!ratingModal || !user) return

    const result = await createReview({
      applicationId: ratingModal.applicationId,
      reviewerId: user.id,
      revieweeId: ratingModal.revieweeId,
      stars: newRating,
      comment: newComment,
    })

    if (!result.ok) {
      notify({ type: 'error', message: 'Үнэлгээ өгч чадсангүй', description: result.error })
      return
    }

    notify({ type: 'success', message: 'Үнэлгээ илгээгдлээ', description: 'Таны санал бодол чухал!' })
    reviewsQ.refresh()
    setRatingModal(null)
    setNewRating(5)
    setNewComment('')
  }

  const updateApplicationStatus = async (applicationId, status) => {
    const result = await setApplicationStatus(applicationId, status, user?.id)
    if (!result.ok) {
      notify({ type: 'error', message: 'Төлөв өөрчилж чадсангүй', description: result.error })
      return
    }
    appsQ.refresh()
  }

  if (loading) return <Loading label="Хүсэлтүүд ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />

  // Filter to only show current user's applications
  const userApps = localApplications.filter(app => app.workerId === user?.id)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold emp-text-heading">Миний оролцууд</h1>
        <p className="mt-1 emp-text-body">Бүх оролцуудaa нэг дороос хяна.</p>
      </div>

      <div className="space-y-4">
        {userApps.map(app => {
          const shift = getShift(app.shiftId)
          const employer = getEmployer(shift?.employerId)
          const employerProfile = getEmployerProfile(shift?.employerId)
          const existingReview = getReview(app.id, user?.id)
          const canRate = app.status === 'completed' && !existingReview
          return (
            <div key={app.id} className="emp-card animate-slide-up">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold emp-text-heading">{shift?.title}</h3>
                                <span className={`emp-badge border flex items-center gap-1 ${statusColors[app.status] || statusColors['applied']}`}>
                                  {statusLabels[app.status]}
                                </span>
                              </div>
                              <p className="emp-text-body">{employerProfile?.orgName || employer?.name}</p>
                              <p className="text-sm emp-text-body mt-1">
                                {app.appliedAt && format(new Date(app.appliedAt), 'yyyy-MM-dd')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {app.status === 'applied' && (
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'cancelled')}
                                  className="emp-btn-secondary py-2 px-3 text-sm flex items-center gap-1"
                                >
                                  Цуцлах
                                </button>
                              )}
                              {canRate && (
                                <button
                                  onClick={() => setRatingModal({
                                    applicationId: app.id,
                                    revieweeId: shift?.employerId,
                                    revieweeName: employerProfile?.orgName || employer?.name,
                                  })}
                                  className="emp-btn-secondary py-2 px-3 text-sm flex items-center gap-1"
                                >
                                  Үнэлэх
                                </button>
                              )}
                              {existingReview && (
                                <div className="flex flex-col items-end">
                                  <StarRating rating={existingReview.stars} size="w-4 h-4" />
                                  <p className="text-xs emp-text-body mt-1">{existingReview.comment}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
          )
        })}
        {userApps.length === 0 && (
          <div className="text-center py-16 emp-card">
            <FileText className="w-12 h-12 text-emp-muted mx-auto mb-4" />
            <p className="text-lg emp-text-heading">Оролцол алга</p>
            <p className="emp-text-body">Ажилд анхны оролцоо оруулаарай!</p>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="emp-card max-w-md w-full">
            <h3 className="text-lg font-bold emp-text-heading mb-4">
              {ratingModal.revieweeName}-г үнэлэх
            </h3>
            <div className="flex justify-center mb-4">
              <StarRating rating={newRating} onChange={setNewRating} size="w-8 h-8" />
            </div>
            <textarea
              placeholder="Сэтгэгдэлээ бичнэ үү..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="emp-input w-full mb-4 min-h-[100px] resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRatingModal(null)}
                className="emp-btn-secondary flex-1"
              >
                Болих
              </button>
              <button
                onClick={handleSubmitRating}
                className="bg-emp-accent text-white rounded-xl px-4 py-2 hover:bg-emp-accent-hover transition-colors"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
