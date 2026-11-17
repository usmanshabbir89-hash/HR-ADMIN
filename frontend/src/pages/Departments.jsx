// Departments - Department Master screen (list, search, add, edit, delete).
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import DepartmentForm from "../components/DepartmentForm.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formFor, setFormFor] = useState(undefined); // undefined closed | null add | dept edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      setDepartments(await api(`/api/departments${query}`));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    api("/api/employees").then(setEmployees).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadDepartments, 300);
    return () => clearTimeout(timer);
  }, [loadDepartments]);

  function handleSaved(message) {
    setFormFor(undefined);
    setSuccess(message);
    loadDepartments();
  }

  async function deleteDepartment() {
    // If the department still has employees, the API refuses and
    // ConfirmDialog shows that error message.
    await api(`/api/departments/${deleteTarget.id}`, { method: "DELETE" });
    setSuccess(`${deleteTarget.name} deleted.`);
    setDeleteTarget(null);
    loadDepartments();
  }

  return (
    <div className="stack">
      <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>

      <section className="card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input type="search" placeholder="Search by name, code or ID…" value={search}
              onChange={(e) => setSearch(e.target.value)} aria-label="Search departments" />
          </div>
          <button className="btn btn-primary" onClick={() => { setSuccess(""); setFormFor(null); }}>
            <Plus size={16} /> Add department
          </button>
        </div>

        <p className="result-count">
          {loading ? "Loading…" : `${departments.length} department${departments.length === 1 ? "" : "s"}`}
        </p>

        {!loading && departments.length === 0 ? (
          <div className="empty-state small"><p>No departments found.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Head</th>
                  <th className="right">Employees</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td><span className="code">{d.code}</span></td>
                    <td>
                      <div className="strong">{d.name}</div>
                      <div className="muted small">{d.id}{d.description ? ` · ${d.description}` : ""}</div>
                    </td>
                    <td>
                      {d.head_name ? (
                        <Link to={`/employees/${d.head_employee_id}`} className="link">{d.head_name}</Link>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="right">{d.employee_count}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" title="Edit" aria-label={`Edit ${d.name}`}
                          onClick={() => { setSuccess(""); setFormFor(d); }}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn danger" title="Delete" aria-label={`Delete ${d.name}`}
                          onClick={() => setDeleteTarget(d)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formFor !== undefined && (
        <DepartmentForm department={formFor} employees={employees}
          onClose={() => setFormFor(undefined)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete department?"
          message={`${deleteTarget.name} (${deleteTarget.id}) will be permanently removed. Departments that still have employees cannot be deleted.`}
          confirmLabel="Delete"
          onConfirm={deleteDepartment}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
