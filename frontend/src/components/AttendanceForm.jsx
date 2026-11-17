// AttendanceForm - mark or correct one employee's attendance for one day.
// The SERVER decides the final status; the preview here just shows what it will be.
import { useState } from "react";

import { api } from "../api.js";
import { formatLongDate } from "../utils.js";
import Modal from "./Modal.jsx";
import StatusBadge from "./StatusBadge.jsx";

// Same rule as backend/settings.py: checking in after 09:15 is Late
export const LATE_AFTER = "09:15";

export function previewStatus(checkIn) {
  if (!checkIn) return "Absent";
  return checkIn > LATE_AFTER ? "Late" : "Present"; // "09:32" > "09:15" works for HH:MM text
}

export default function AttendanceForm({ employee, date, record, onClose, onSaved }) {
  const isEdit = Boolean(record);
  const [absent, setAbsent] = useState(isEdit ? record.status === "Absent" : false);
  const [checkIn, setCheckIn] = useState(record?.check_in ?? "09:00");
  const [checkOut, setCheckOut] = useState(record?.check_out ?? "");
  const [remarks, setRemarks] = useState(record?.remarks ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      employee_id: employee.id,
      date,
      check_in: absent ? null : checkIn || null,
      check_out: absent ? null : checkOut || null,
      remarks,
    };
    try {
      const saved = isEdit
        ? await api(`/api/attendance/${record.id}`, { method: "PUT", body })
        : await api("/api/attendance", { method: "POST", body });
      onSaved(`${employee.full_name} marked ${saved.status}.`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const status = absent ? "Absent" : previewStatus(checkIn);

  return (
    <Modal
      title={`${isEdit ? "Edit" : "Mark"} attendance — ${employee.full_name}`}
      subtitle={`${employee.id} · ${formatLongDate(date)}`}
      onClose={onClose}
      width={480}
    >
      <form onSubmit={handleSubmit} className="stack-sm">
        <label className="checkbox">
          <input type="checkbox" checked={absent} onChange={(e) => setAbsent(e.target.checked)} />
          <span>Employee was absent (no check-in)</span>
        </label>

        {!absent && (
          <div className="form-grid">
            <label className="field">
              <span>Check-in *</span>
              <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
            </label>
            <label className="field">
              <span>Check-out</span>
              <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || undefined} />
            </label>
          </div>
        )}

        <label className="field">
          <span>Remarks</span>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={200} placeholder="e.g. Traffic, sick, on site visit" />
        </label>

        <div className="info-box">
          <span>Status will be: <StatusBadge status={status} /></span>
          <span className="small">Late = check-in after {LATE_AFTER}</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Save attendance"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
