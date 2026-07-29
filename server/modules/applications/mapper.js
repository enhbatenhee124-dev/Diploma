export const toApplication = r => r && ({
  id: r.id,
  shiftId: r.shift_id,
  workerId: r.worker_id,
  status: r.status,
  appliedAt: r.applied_at,
  decidedAt: r.decided_at,
  cancelledBy: r.cancelled_by,
  cancelReason: r.cancel_reason,
})
