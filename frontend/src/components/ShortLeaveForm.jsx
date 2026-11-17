// ShortLeaveForm - a few hours off on one day (maximum 4 hours).
import { useState } from "react";

import { api } from "../api.js";
import EmployeeSelect from "./EmployeeSelect.jsx";
import Modal from "./Modal.jsx";

const MAX_HOURS = 4; // same rule as the backend (schemas.py)

// "10:00" and "12:30" -> 2.5
function hoursBetween(from, to) {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  return (th * 60 + tm - (fh * 60 + fm)) / 60;
}

export default function ShortLeaveForm({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_id: "", date: "", from_time: "", to_time: "", reason: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((old) => ({ ...old, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await api("/api/short-leaves", { method: "POST", body: form });
      onSaved(`Short leave ${saved.id} submitted (${saved.hours} hours).`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const hours = hoursBetween(form.from_time, form.to_time);
  const tooLong = hours > MAX_HOURS;
  const badOrder = form.from_time && form.to_time && hours <= 0;

  return (
    <Modal title="New short leave" subtitle={`A few hours off on one day — maximum ${MAX_HOURS} hours.`} onClose={onClose} width={520}>
      <form onSubmit={handleSubmit} className="stack-sm">
        <div className="form-grid">
          <label className="field span-2">
            <span>Employee *</span>
            <EmployeeSelect name="employee_id" employees={employees} activeOnly value={form.employee_id} onChange={handleChange} required />
          </label>
          <label className="field span-2">
            <span>Date *</span>
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>From *</span>
            <input type="time" name="from_time" value={form.from_time} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>To *</span>
            <input type="time" name="to_time" value={form.to_time} onChange={handleChange} required />
          </label>
          <label className="field span-2">
            <span>Reason *</span>
            <textarea name="reason" rows={2} value={form.reason} onChange={handleChange} required minLength={3} maxLength={300} />
          </label>
        </div>

        {hours > 0 && (
          <div className={`info-box ${tooLong ? "info-warn" : ""}`}>
            Duration: <b>{hours} hour{hours === 1 ? "" : "s"}</b>
            {tooLong && ` — more than the ${MAX_HOURS}-hour limit`}
          </div>
        )}
        {badOrder && <div className="info-box info-warn">“To” time must be after “From” time.</div>}

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
