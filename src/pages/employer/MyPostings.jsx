
import { useState } from 'react';
import { Search, MapPin, DollarSign, Clock, XCircle, PlusCircle, Users, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { DISTRICTS } from '../../data/constants';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { useShifts, useApplications, useReviews, useProfiles, useWorkerDirectory, combine } from '../../hooks/useData';
import { createShift, setApplicationStatus, createReview } from '../../data/queries';
import { Loading, ErrorBox } from '../../components/States';

const tabs = ['Бүгд', 'Идэвхтэй', 'Дүүрсэн', 'Хаагдсан'];

const getStatusColor = (status) => {
  switch(status) {
    case 'Идэвхтэй':
    case 'Active':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'Дүүрсэн':
    case 'Filled':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'Хаагдсан':
    case 'Closed':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
};

const statusColors = {
  'applied': 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  'approved': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'in-progress': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'completed': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'cancelled': 'text-red-400 bg-red-400/10 border-red-400/20',
};

const statusLabels = {
  'applied': 'Оролцсон',
  'approved': 'Зөвшөөрсөн',
  'in-progress': 'Хийгдэж буй',
  'completed': 'Дууссан',
  'cancelled': 'Цуцлагдсан',
};

const StarRating = ({ rating, onChange, size = "w-5 h-5" }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        onChange ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
            />
          </button>
        ) : (
          <Star
            key={star}
            className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
          />
        )
      ))}
    </div>
  );
};

export default function MyPostings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Бүгд');
  const [search, setSearch] = useState('');
  const { notify } = useNotification();
  const shiftsQ = useShifts();
  const appsQ = useApplications();
  const reviewsQ = useReviews();
  const profilesQ = useProfiles();
  const directory = useWorkerDirectory();
  const { loading, error, refreshAll } = combine(shiftsQ, appsQ, reviewsQ, profilesQ, directory);

  const shifts = shiftsQ.data;
  const users = profilesQ.data;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedShift, setExpandedShift] = useState(null);
  const [newShift, setNewShift] = useState({
    title: '',
    category: 'food',
    description: '',
    district: 'Баянзүрх',
    startAtLocal: '',
    endAtLocal: '',
    hourlyWage: 10000,
    slots: 1,
    status: 'Active'
  });
  const localApplications = appsQ.data;
  const localReviews = reviewsQ.data;
  const [ratingModal, setRatingModal] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const handleCreateShift = async () => {
    const missing = [];
    if (!newShift.title) missing.push('Гарчиг');
    if (!newShift.description) missing.push('Тайлбар');
    if (missing.length > 0) {
      alert('Дараах талбаруудыг бөглөнө үү: ' + missing.join(', '));
      return;
    }

    // Анхдагч цаг: 1 цагийн дараа эхэлж, 4 цаг үргэлжилнэ.
    // `datetime-local` нь ЛОКАЛ цаг хүлээж авдаг тул toISOString() ашиглаж
    // болохгүй — өмнө нь энэ нь дуусах цагийг эхлэхээс өмнө болгодог байсан.
    const start = newShift.startAtLocal
      ? new Date(newShift.startAtLocal)
      : new Date(Date.now() + 60 * 60 * 1000);

    const end = newShift.endAtLocal
      ? new Date(newShift.endAtLocal)
      : new Date(start.getTime() + 4 * 60 * 60 * 1000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      alert('Огноо, цагийг зөв оруулна уу.');
      return;
    }
    if (end <= start) {
      alert('Дуусах цаг эхлэх цагаас хойш байх ёстой.');
      return;
    }

    const result = await createShift({
      employerId: user.id,
      title: newShift.title,
      category: newShift.category,
      description: newShift.description,
      district: newShift.district,
      lat: 47.9189,
      lng: 106.9177,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      hourlyWage: newShift.hourlyWage,
      slots: newShift.slots,
      status: 'Active',
    });

    if (!result.ok) {
      // Захиалгын хугацаа дууссан бол өгөгдлийн сангийн триггер энд барина
      notify({ type: 'error', message: 'Зар үүсгэж чадсангүй', description: result.error });
      return;
    }

    notify({ type: 'success', message: 'Зар нийтлэгдлээ' });
    shiftsQ.refresh();
    setShowCreateModal(false);
    setNewShift({
      title: '',
      category: 'food',
      description: '',
      district: 'Баянзүрх',
      startAtLocal: '',
      endAtLocal: '',
      hourlyWage: 10000,
      slots: 1,
      status: 'Active'
    });
  };

  const filterByStatus = (shift) => {
    if (activeTab === 'Бүгд') return true;
    if (activeTab === 'Идэвхтэй') return shift.status === 'Active' || shift.status === 'Идэвхтэй';
    if (activeTab === 'Дүүрсэн') return shift.status === 'Filled' || shift.status === 'Дүүрсэн';
    if (activeTab === 'Хаагдсан') return shift.status === 'Closed' || shift.status === 'Хаагдсан';
    return true;
  };

  const filtered = shifts.filter((shift) => {
    return filterByStatus(shift) &&
      (search === '' || shift.title.toLowerCase().includes(search.toLowerCase())) &&
      shift.employerId === (user?.id || 'u2');
  });

  const getWorker = (workerId) => users.find(u => u.id === workerId);
  // Бодит ур чадвар/үнэлгээ — өмнө нь mockData-гаас хайдаг тул хэзээ ч олддоггүй байв
  const getWorkerProfile = (workerId) => directory.get(workerId);
  const getReview = (applicationId, reviewerId) =>
    localReviews.find(r => r.applicationId === applicationId && r.reviewerId === reviewerId);
  const getApplicationsForShift = (shiftId) =>
    localApplications.filter(app => app.shiftId === shiftId);

  const handleSubmitRating = async () => {
    if (!ratingModal || !user) return;

    const result = await createReview({
      applicationId: ratingModal.applicationId,
      reviewerId: user.id,
      revieweeId: ratingModal.revieweeId,
      stars: newRating,
      comment: newComment,
    });

    if (!result.ok) {
      notify({ type: 'error', message: 'Үнэлгээ өгч чадсангүй', description: result.error });
      return;
    }

    notify({ type: 'success', message: 'Үнэлгээ илгээгдлээ' });
    reviewsQ.refresh();
    setRatingModal(null);
    setNewRating(5);
    setNewComment('');
  };

  const updateApplicationStatus = async (applicationId, status) => {
    const result = await setApplicationStatus(applicationId, status, user?.id);
    if (!result.ok) {
      notify({ type: 'error', message: 'Төлөв өөрчилж чадсангүй', description: result.error });
      return;
    }
    appsQ.refresh();
  };

  if (loading) return <Loading label="Зарууд ачаалж байна…" />;
  if (error) return <ErrorBox message={error} onRetry={refreshAll} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold wrk-text-heading">Миний зар</h1>
          <p className="mt-1 wrk-text-body">Ажлын заруудыг удирда.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="wrk-btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> Шинэ зар
        </button>
      </div>

      {/* Filters */}
      <div className="wrk-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-wrk-muted" />
            <input
              type="text"
              placeholder="Зар хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="wrk-input pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-wrk-accent text-white' : 'bg-wrk-card text-wrk-text border border-wrk-border hover:bg-wrk-card-hover'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div className="space-y-4">
        {filtered.map((shift) => {
          const apps = getApplicationsForShift(shift.id);
          const isExpanded = expandedShift === shift.id;
          return (
            <div key={shift.id} className="wrk-card animate-slide-up">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold wrk-text-heading">{shift.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="wrk-badge bg-wrk-accent/10 text-wrk-accent border border-wrk-accent/20 text-xs">
                        {shift.category}
                      </span>
                    </div>
                  </div>
                  <span className={`wrk-badge border flex items-center gap-1 ${getStatusColor(shift.status)}`}>
                    {shift.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm wrk-text-body mb-3">
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {shift.hourlyWage} ₮/цаг</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(shift.startAt), 'yyyy-MM-dd HH:mm')}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {shift.district}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {shift.slots} суваг</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {apps.length} оролцсон</span>
                </div>
                <p className="text-sm text-wrk-muted mb-3">{shift.description}</p>
                <button
                  onClick={() => setExpandedShift(isExpanded ? null : shift.id)}
                  className="flex items-center gap-2 text-sm text-wrk-accent hover:text-wrk-accent-hover"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Оролцууд ({apps.length})
                </button>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-wrk-border space-y-3">
                  {apps.length === 0 ? (
                    <p className="text-wrk-muted text-sm">Оролцол алга</p>
                  ) : (
                    apps.map((app) => {
                      const worker = getWorker(app.workerId);
                      const workerProfile = getWorkerProfile(app.workerId);
                      const existingReview = getReview(app.id, user?.id || 'u2');
                      const canRate = app.status === 'completed' && !existingReview;
                      return (
                        <div key={app.id} className="bg-wrk-bg/50 p-3 rounded-xl">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium wrk-text-heading">{worker?.name}</p>
                                {workerProfile?.ratingAvg && (
                                  <div className="flex items-center gap-1">
                                    <StarRating rating={workerProfile.ratingAvg} size="w-3.5 h-3.5" />
                                    <span className="text-xs text-wrk-muted">({workerProfile.ratingAvg})</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-wrk-muted mt-1">
                                {app.appliedAt && format(new Date(app.appliedAt), 'yyyy-MM-dd')}
                              </p>
                              <span className={`wrk-badge border flex items-center gap-1 ${statusColors[app.status] || statusColors['applied']} mt-2`}>
                                {statusLabels[app.status]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {app.status === 'applied' && (
                                <>
                                  <button
                                    onClick={() => updateApplicationStatus(app.id, 'approved')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                  >
                                    Зөвшөөрөх
                                  </button>
                                  <button
                                    onClick={() => updateApplicationStatus(app.id, 'cancelled')}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-sm text-red-400 hover:bg-red-500/20 transition-all"
                                  >
                                    Татгалзах
                                  </button>
                                </>
                              )}
                              {app.status === 'approved' && (
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'in-progress')}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-sm text-amber-400 hover:bg-amber-500/20 transition-all"
                                >
                                  Ажилдаа
                                </button>
                              )}
                              {app.status === 'in-progress' && (
                                <button
                                  onClick={() => updateApplicationStatus(app.id, 'completed')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                >
                                  Дуусгах
                                </button>
                              )}
                              {canRate && (
                                <button
                                  onClick={() => setRatingModal({
                                    applicationId: app.id,
                                    revieweeId: app.workerId,
                                    revieweeName: worker?.name,
                                  })}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-wrk-text hover:bg-white/10 transition-all"
                                >
                                  Үнэлэх
                                </button>
                              )}
                              {existingReview && (
                                <div className="flex flex-col items-end">
                                  <StarRating rating={existingReview.stars} size="w-3.5 h-3.5" />
                                  <p className="text-xs text-wrk-muted mt-1">{existingReview.comment}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 wrk-card">
            <Search className="w-12 h-12 text-wrk-muted mx-auto mb-4" />
            <p className="text-lg wrk-text-heading">Зар олдсонгүй</p>
          </div>
        )}
      </div>

      {/* Create Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="wrk-card max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold wrk-text-heading">Шинэ зар үүсгэх</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-wrk-muted hover:text-wrk-text">
                <XCircle />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm wrk-text-body mb-1 block">Гарчиг</label>
                <input
                  type="text"
                  value={newShift.title}
                  onChange={(e) => setNewShift(prev => ({ ...prev, title: e.target.value }))}
                  className="wrk-input"
                  placeholder="Ажлын гарчиг"
                />
              </div>
              <div>
                <label className="text-sm wrk-text-body mb-1 block">Ангилал</label>
                <select
                  value={newShift.category}
                  onChange={(e) => setNewShift(prev => ({ ...prev, category: e.target.value }))}
                  className="wrk-input"
                >
                  <option value="food">Хоол</option>
                  <option value="retail">Зарчим</option>
                  <option value="delivery">Хүргэлт</option>
                  <option value="cleaning">Цэвэрлэгээ</option>
                  <option value="other">Бусад</option>
                </select>
              </div>
              <div>
                <label className="text-sm wrk-text-body mb-1 block">Тайлбар</label>
                <textarea
                  value={newShift.description}
                  onChange={(e) => setNewShift(prev => ({ ...prev, description: e.target.value }))}
                  className="wrk-input min-h-[100px]"
                  placeholder="Ажлын тайлбар"
                />
              </div>
              <div>
                <label className="text-sm wrk-text-body mb-1 block">Дүүрэг</label>
                <select
                  value={newShift.district}
                  onChange={(e) => setNewShift(prev => ({ ...prev, district: e.target.value }))}
                  className="wrk-input"
                >
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm wrk-text-body mb-1 block">Эхлэх огноо, цаг</label>
                  <input
                    type="datetime-local"
                    value={newShift.startAtLocal}
                    onChange={(e) => setNewShift(prev => ({ ...prev, startAtLocal: e.target.value }))}
                    className="wrk-input"
                  />
                </div>
                <div>
                  <label className="text-sm wrk-text-body mb-1 block">Дуусах огноо, цаг</label>
                  <input
                    type="datetime-local"
                    value={newShift.endAtLocal}
                    onChange={(e) => setNewShift(prev => ({ ...prev, endAtLocal: e.target.value }))}
                    className="wrk-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm wrk-text-body mb-1 block">Цагийн зарплат (₮)</label>
                  <input
                    type="number"
                    value={newShift.hourlyWage}
                    onChange={(e) => setNewShift(prev => ({ ...prev, hourlyWage: parseInt(e.target.value) || 0 }))}
                    className="wrk-input"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="text-sm wrk-text-body mb-1 block">Суурин</label>
                  <input
                    type="number"
                    value={newShift.slots}
                    onChange={(e) => setNewShift(prev => ({ ...prev, slots: parseInt(e.target.value) || 1 }))}
                    className="wrk-input"
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="wrk-btn-secondary flex-1">
                  Хаах
                </button>
                <button type="button" onClick={handleCreateShift} className="bg-wrk-accent text-white rounded-xl px-6 py-2 hover:bg-wrk-accent-hover transition-colors">
                  Үүсгэх
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="wrk-card max-w-md w-full">
            <h3 className="text-lg font-bold wrk-text-heading mb-4">
              {ratingModal.revieweeName}-г үнэлэх
            </h3>
            <div className="flex justify-center mb-4">
              <StarRating rating={newRating} onChange={setNewRating} size="w-8 h-8" />
            </div>
            <textarea
              placeholder="Сэтгэгдэлээ бичнэ үү..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="wrk-input w-full mb-4 min-h-[100px] resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRatingModal(null)}
                className="wrk-btn-secondary flex-1"
              >
                Болих
              </button>
              <button
                onClick={handleSubmitRating}
                className="bg-wrk-accent text-white rounded-xl px-4 py-2 hover:bg-wrk-accent-hover transition-colors"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
