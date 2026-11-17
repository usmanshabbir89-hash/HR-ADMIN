// EmployeeForm - the Add / Edit employee pop-up.
//
// Props:
//   employee    = the employee to edit, or null to add a new one
//   departments = list for the Department dropdown
//   onClose     = close without saving
//   onSaved     = called with a success message after the API saved it
import { useState } from "react";

import { api } from "../api.js";
import { formatMoney, todayISO } from "../utils.js";
import Modal from "./Modal.jsx";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  department_id: "",
  designation: "",
  join_date: "",
  basic_salary: "",
  allowances: "0",
};

export default function EmployeeForm({ employee, departments, onClose, onSaved }) {
  const isEdit = Boolean(employee);

  // Start with the employee's current values (edit) or empty boxes (add)
  const [form, setForm] = useState(() =>
    isEdit
      ? Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, String(employee[key] ?? "")]))
      : EMPTY_FORM
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // One change handler for every input: uses the input's "name" to know which field changed
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((old) => ({ ...old, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        basic_salary: Number(form.basic_salary),
        allowances: Number(form.allowances || 0),
      };
      const saved = isEdit
        ? await api(`/api/employees/${employee.id}`, { method: "PUT", body })
        : await api("/api/employees", { method: "POST", body });
      onSaved(isEdit ? `${saved.full_name} updated.` : `${saved.full_name} added as ${saved.id}.`);
    } catch (err) {
      setError(err.message); // e.g. "Email ... is already used by EMP003"
      setSaving(false);
    }
  }

  // Only active departments can be chosen (but keep the current one when editing)
  const departmentOptions = departments.filter(
    (d) => d.status === "Active" || d.id === form.department_id
  );

  return (
    <Modal
      title={isEdit ? `Edit ${employee.full_name}` : "Add employee"}
      subtitle={isEdit ? employee.id : "The employee ID is created automatically."}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="stack-sm">
        <div className="form-grid">
          <label className="field span-2">
            <span>Full name *</span>
            <input name="full_name" value={form.full_name} onChange={handleChange} required minLength={3} />
          </label>
          <label className="field">
            <span>Email *</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Phone *</span>
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="0300-1234567" />
          </label>
          <label className="field">
            <span>Department *</span>
            <select name="department_id" value={form.department_id} onChange={handleChange} required>
              <option value="">Select department…</option>
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Designation *</span>
            <input name="designation" value={form.designation} onChange={handleChange} required minLength={2} />
          </label>
          <label className="field">
            <span>Join date *</span>
            <input type="date" name="join_date" value={form.join_date} onChange={handleChange} required max={todayISO()} />
          </label>
          <label className="field">
            <span>Basic salary *</span>
            <input type="number" name="basic_salary" value={form.basic_salary} onChange={handleChange} required min={0} step="any" />
          </label>
          <label className="field">
            <span>Allowances</span>
            <input type="number" name="allowances" value={form.allowances} onChange={handleChange} min={0} step="any" />
          </label>
          <div className="field">
            <span>Gross salary</span>
            <div className="readonly-box">{formatMoney(Number(form.basic_salary || 0) + Number(form.allowances || 0))}</div>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
