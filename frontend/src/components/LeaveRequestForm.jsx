// LeaveRequestForm - HR submits a leave request for an employee.
// While filling in, it shows how many days are requested and how many are left.
import { useEffect, useState } from "react";

import { api } from "../api.js";
import EmployeeSelect from "./EmployeeSelect.jsx";
import Modal from "./Modal.jsx";

// Number of days from start to end, both included. "2026-12-01" to "2026-12-03" = 3
function countDays(start, end) {
  if (!start || !end) return 0;
  const days = (new Date(end) - new Date(start)) / 86400000 + 1;
  return days > 0 ? days : 0;
}

export default function LeaveRequestForm({ employees, leaveTypes, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((old) => ({ ...old, [name]: value }));
  }

  // When the employee changes, load their leave balance
  useEffect(() => {
    setBalance(null);
    if (!form.employee_id) return;
    api(`/api/leave-requests/balance/${form.employee_id}`)
      .then((data) => setBalance(data.balance))
      .catch(() => setBalance(null));
  }, [form.employee_id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await api("/api/leave-requests", { method: "POST", body: form });
      onSaved(`Leave request ${saved.id} submitted (${saved.days} day${saved.days === 1 ? "" : "s"}).`);
    } catch (err) {
      setError(err.message); // e.g. "Not enough Emergency Leave balance..."
      setSaving(false);
    }
  }

  const days = countDays(form.start_date, form.end_date);
  const selectedBalance = balance?.find((b) => b.leave_type_id === form.leave_type_id);

  return (
    <Modal title="New leave request" subtitle="The request starts as Pending until HR approves or rejects it." onClose={onClose}>
      <form onSubmit={handleSubmit} className="stack-sm">
        <div className="form-grid">
          <label className="field">
            <span>Employee *</span>
            <EmployeeSelect name="employee_id" employees={employees} activeOnly value={form.employee_id} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Leave type *</span>
            <select name="leave_type_id" value={form.leave_type_id} onChange={handleChange} required>
              <option value="">Select leave type…</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>From *</span>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>To *</span>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required min={form.start_date || undefined} />
          </label>
          <label className="field span-2">
            <span>Reason *</span>
            <textarea name="reason" rows={2} value={form.reason} onChange={handleChange} required minLength={3} maxLength={300} />
          </label>
        </div>

        {/* Live summary: days requested and balance left */}
        {(days > 0 || selectedBalance) && (
          <div className="info-box">
            {days > 0 && <span>Requesting <b>{days}</b> day{days === 1 ? "" : "s"}</span>}
            {selectedBalance && (
              <span>
                {selectedBalance.leave_type_name}: <b>{selectedBalance.remaining}</b> of {selectedBalance.allowed} days left
                {selectedBalance.pending > 0 && ` (${selectedBalance.pending} pending)`}
              </span>
            )}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
