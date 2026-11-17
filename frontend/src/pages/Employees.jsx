// Employees - Employee Master screen.
// Search + filters at the top, a table of employees, and buttons to
// add, edit, view, deactivate and activate.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Plus, Search, UserCheck, UserX } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmployeeForm from "../components/EmployeeForm.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate, formatMoney, initials } from "../utils.js";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pop-ups: formFor = undefined (closed) | null (add new) | employee (edit)
  const [formFor, setFormFor] = useState(undefined);
  const [statusTarget, setStatusTarget] = useState(null); // employee to activate/deactivate

  // Build the URL with the chosen filters, e.g. /api/employees?search=ali&status=Active
  const loadEmployees = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (departmentId) params.set("department_id", departmentId);
    if (status) params.set("status", status);

    setLoading(true);
    try {
      setEmployees(await api(`/api/employees?${params}`));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, departmentId, status]);

  // Load departments once (for the filter and the form)
  useEffect(() => {
    api("/api/departments").then(setDepartments).catch((err) => setError(err.message));
  }, []);

  // Reload employees when a filter changes. The 300 ms wait means we don't
  // call the API on every single key press while typing in the search box.
  useEffect(() => {
    const timer = setTimeout(loadEmployees, 300);
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  function handleSaved(message) {
    setFormFor(undefined);
    setSuccess(message);
    loadEmployees();
  }

  async function changeStatus() {
    const action = statusTarget.status === "Active" ? "deactivate" : "activate";
    await api(`/api/employees/${statusTarget.id}/${action}`, { method: "PATCH" });
    setSuccess(`${statusTarget.full_name} is now ${action === "deactivate" ? "Inactive" : "Active"}.`);
    setStatusTarget(null);
    loadEmployees();
  }

  const hasFilters = search || departmentId || status;

  return (
    <div className="stack">
      <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>

      <section className="card">
        {/* ---------- Toolbar: search, filters, add button ---------- */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search by name, ID, email, phone, designation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search employees"
            />
          </div>
          <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Filter by department">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button className="btn btn-primary" onClick={() => { setSuccess(""); setFormFor(null); }}>
            <Plus size={16} /> Add employee
          </button>
        </div>

        <p className="result-count">
          {loading ? "Loading…" : `${employees.length} employee${employees.length === 1 ? "" : "s"}`}
          {hasFilters && !loading && (
            <button className="link-button" onClick={() => { setSearch(""); setDepartmentId(""); setStatus(""); }}>
              Clear filters
            </button>
          )}
        </p>

        {/* ---------- Table ---------- */}
        {!loading && employees.length === 0 ? (
          <div className="empty-state small">
            <p>No employees match these filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joined</th>
                  <th className="right">Gross salary</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className={emp.status === "Inactive" ? "row-faded" : ""}>
                    <td>
                      <div className="person">
                        <div className="avatar">{initials(emp.full_name)}</div>
                        <div>
                          <Link to={`/employees/${emp.id}`} className="strong link">{emp.full_name}</Link>
                          <div className="muted small">{emp.id} · {emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department_name}</td>
                    <td>{emp.designation}</td>
                    <td className="nowrap">{formatDate(emp.join_date)}</td>
                    <td className="right nowrap">{formatMoney(emp.basic_salary + emp.allowances)}</td>
                    <td><StatusBadge status={emp.status} /></td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/employees/${emp.id}`} className="icon-btn" title="View details" aria-label={`View ${emp.full_name}`}>
                          <Eye size={16} />
                        </Link>
                        <button className="icon-btn" title="Edit" aria-label={`Edit ${emp.full_name}`}
                          onClick={() => { setSuccess(""); setFormFor(emp); }}>
                          <Pencil size={16} />
                        </button>
                        {emp.status === "Active" ? (
                          <button className="icon-btn danger" title="Deactivate" aria-label={`Deactivate ${emp.full_name}`}
                            onClick={() => setStatusTarget(emp)}>
                            <UserX size={16} />
                          </button>
                        ) : (
                          <button className="icon-btn success" title="Activate" aria-label={`Activate ${emp.full_name}`}
                            onClick={() => setStatusTarget(emp)}>
                            <UserCheck size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Pop-ups ---------- */}
      {formFor !== undefined && (
        <EmployeeForm
          employee={formFor}
          departments={departments}
          onClose={() => setFormFor(undefined)}
          onSaved={handleSaved}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          title={statusTarget.status === "Active" ? "Deactivate employee?" : "Activate employee?"}
          message={
            statusTarget.status === "Active"
              ? `${statusTarget.full_name} (${statusTarget.id}) will be marked Inactive. Their old records are kept, but no new requests can be made for them.`
              : `${statusTarget.full_name} (${statusTarget.id}) will be marked Active again.`
          }
          confirmLabel={statusTarget.status === "Active" ? "Deactivate" : "Activate"}
          tone={statusTarget.status === "Active" ? "danger" : "primary"}
          onConfirm={changeStatus}
          onClose={() => setStatusTarget(null)}
        />
      )}
    </div>
  );
}
