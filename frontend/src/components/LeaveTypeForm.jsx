// LeaveTypeForm - Add / Edit a leave type (Annual, Sick, ...).
import { useState } from "react";

import { api } from "../api.js";
import Modal from "./Modal.jsx";

export default function LeaveTypeForm({ leaveType, onClose, onSaved }) {
  const isEdit = Boolean(leaveType);
  const [form, setForm] = useState({
    name: leaveType?.name ?? "",
    code: leaveType?.code ?? "",
    days_per_year: String(leaveType?.days_per_year ?? ""),
    is_paid: leaveType?.is_paid ?? true,
    description: leaveType?.description ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    // Checkboxes use "checked" (true/false) instead of "value"
    setForm((old) => ({ ...old, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { ...form, days_per_year: Number(form.days_per_year) };
      const saved = isEdit
        ? await api(`/api/leave-types/${leaveType.id}`, { method: "PUT", body })
        : await api("/api/leave-types", { method: "POST", body });
      onSaved(isEdit ? `${saved.name} updated.` : `${saved.name} added as ${saved.id}.`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${leaveType.name}` : "Add leave type"} subtitle={leaveType?.id} onClose={onClose} width={500}>
      <form onSubmit={handleSubmit} className="stack-sm">
        <div className="form-grid">
          <label className="field span-2">
            <span>Name *</span>
            <input name="name" value={form.name} onChange={handleChange} required minLength={2} placeholder="e.g. Maternity Leave" />
          </label>
          <label className="field">
            <span>Code *</span>
            <input name="code" value={form.code} onChange={handleChange} required minLength={2} maxLength={20} placeholder="MATERNITY" />
          </label>
          <label className="field">
            <span>Days per year *</span>
            <input type="number" name="days_per_year" value={form.days_per_year} onChange={handleChange} required min={0} max={365} />
          </label>
          <label className="checkbox span-2">
            <input type="checkbox" name="is_paid" checked={form.is_paid} onChange={handleChange} />
            <span>Paid leave (salary is not deducted)</span>
          </label>
          <label className="field span-2">
            <span>Description</span>
            <textarea name="description" rows={2} maxLength={300} value={form.description} onChange={handleChange} />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add leave type"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
