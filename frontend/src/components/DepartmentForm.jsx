// DepartmentForm - the Add / Edit department pop-up.
// department = the department to edit, or null to add a new one.
import { useState } from "react";

import { api } from "../api.js";
import Modal from "./Modal.jsx";

export default function DepartmentForm({ department, employees, onClose, onSaved }) {
  const isEdit = Boolean(department);
  const [form, setForm] = useState({
    name: department?.name ?? "",
    code: department?.code ?? "",
    head_employee_id: department?.head_employee_id ?? "",
    description: department?.description ?? "",
    status: department?.status ?? "Active",
  });
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
      const saved = isEdit
        ? await api(`/api/departments/${department.id}`, { method: "PUT", body: form })
        : await api("/api/departments", { method: "POST", body: form });
      onSaved(isEdit ? `${saved.name} updated.` : `${saved.name} added as ${saved.id}.`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${department.name}` : "Add department"} subtitle={department?.id} onClose={onClose}>
      <form onSubmit={handleSubmit} className="stack-sm">
        <div className="form-grid">
          <label className="field">
            <span>Department name *</span>
            <input name="name" value={form.name} onChange={handleChange} required minLength={2} />
          </label>
          <label className="field">
            <span>Code *</span>
            <input name="code" value={form.code} onChange={handleChange} required minLength={2} maxLength={10}
              placeholder="e.g. MKT" style={{ textTransform: "uppercase" }} />
          </label>
          <label className="field">
            <span>Head of department</span>
            <select name="head_employee_id" value={form.head_employee_id} onChange={handleChange}>
              <option value="">— None —</option>
              {employees
                .filter((e) => e.status === "Active" || e.id === form.head_employee_id)
                .map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name} ({e.id})</option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
