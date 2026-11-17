// CertificateForm - generate a new salary certificate for an employee.
import { useState } from "react";

import { api } from "../api.js";
import { formatMoney } from "../utils.js";
import EmployeeSelect from "./EmployeeSelect.jsx";
import Modal from "./Modal.jsx";

export default function CertificateForm({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({ employee_id: "", purpose: "", addressed_to: "To Whom It May Concern" });
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
      const saved = await api("/api/salary-certificates", { method: "POST", body: form });
      onSaved(saved); // the page opens the new certificate
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const employee = employees.find((e) => e.id === form.employee_id);

  return (
    <Modal title="Generate salary certificate" subtitle="The employee's current salary is copied onto the certificate." onClose={onClose} width={520}>
      <form onSubmit={handleSubmit} className="stack-sm">
        <label className="field">
          <span>Employee *</span>
          <EmployeeSelect name="employee_id" employees={employees} activeOnly value={form.employee_id} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>Purpose *</span>
          <input name="purpose" value={form.purpose} onChange={handleChange} required minLength={3} maxLength={200}
            placeholder="e.g. Bank loan application, Visa application" />
        </label>
        <label className="field">
          <span>Addressed to *</span>
          <input name="addressed_to" value={form.addressed_to} onChange={handleChange} required minLength={3} maxLength={200} />
        </label>

        {employee && (
          <div className="info-box">
            <span>{employee.designation}, {employee.department_name}</span>
            <span>Gross salary: <b>{formatMoney(employee.basic_salary + employee.allowances)}</b></span>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Generating…" : "Generate certificate"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
