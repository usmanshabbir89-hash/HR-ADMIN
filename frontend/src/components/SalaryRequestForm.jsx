// SalaryRequestForm - advance, increment, correction, loan or other salary request.
import { useState } from "react";

import { api } from "../api.js";
import { formatMoney } from "../utils.js";
import EmployeeSelect from "./EmployeeSelect.jsx";
import Modal from "./Modal.jsx";

export const SALARY_REQUEST_TYPES = ["Salary Advance", "Salary Increment", "Salary Correction", "Loan", "Other"];

export default function SalaryRequestForm({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_id: "", request_type: "", amount: "", reason: "" });
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
      const saved = await api("/api/salary-requests", {
        method: "POST",
        body: { ...form, amount: Number(form.amount) },
      });
      onSaved(`Salary request ${saved.id} submitted.`);
    } catch (err) {
      setError(err.message); // e.g. "Salary advance cannot be more than one month's gross salary"
      setSaving(false);
    }
  }

  // Show the employee's monthly gross salary to help HR check the amount
  const employee = employees.find((e) => e.id === form.employee_id);
  const gross = employee ? employee.basic_salary + employee.allowances : 0;
  const overLimit = form.request_type === "Salary Advance" && employee && Number(form.amount) > gross;

  return (
    <Modal title="New salary request" subtitle="The request starts as Pending until HR approves or rejects it." onClose={onClose} width={520}>
      <form onSubmit={handleSubmit} className="stack-sm">
        <div className="form-grid">
          <label className="field span-2">
            <span>Employee *</span>
            <EmployeeSelect name="employee_id" employees={employees} activeOnly value={form.employee_id} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Request type *</span>
            <select name="request_type" value={form.request_type} onChange={handleChange} required>
              <option value="">Select type…</option>
              {SALARY_REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Amount *</span>
            <input type="number" name="amount" value={form.amount} onChange={handleChange} required min={1} step="any" />
          </label>
          <label className="field span-2">
            <span>Reason *</span>
            <textarea name="reason" rows={2} value={form.reason} onChange={handleChange} required minLength={3} maxLength={300} />
          </label>
        </div>

        {employee && (
          <div className={`info-box ${overLimit ? "info-warn" : ""}`}>
            <span>{employee.full_name}'s monthly gross salary: <b>{formatMoney(gross)}</b></span>
            {overLimit && <span>A salary advance cannot be more than this.</span>}
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
