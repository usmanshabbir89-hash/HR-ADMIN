// Attendance - the daily attendance sheet.
// Pick a date; every active employee is listed with their record for that day,
// or "Not marked" with a button to mark them.
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import AttendanceForm from "../components/AttendanceForm.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { EmployeeCell } from "../components/RequestText.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatLongDate, todayISO } from "../utils.js";

const FILTERS = ["All", "Present", "Late", "Absent", "Not marked"];

// Move a "YYYY-MM-DD" date by +1 or -1 day
function shiftDate(isoDate, days) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return date.toLocaleDateString("en-CA");
}

export default function Attendance() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formFor, setFormFor] = useState(null); // { employee, record }
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadDay(day) {
    setLoading(true);
    try {
      const [emps, recs] = await Promise.all([api("/api/employees"), api(`/api/attendance?date=${day}`)]);
      setEmployees(emps);
      setRecords(recs);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reload whenever the date changes
  useEffect(() => {
    loadDay(date);
  }, [date]);

  // One row per employee: active employees, plus anyone who already has a record that day
  const recordByEmployee = Object.fromEntries(records.map((r) => [r.employee_id, r]));
  const rows = employees
    .filter((e) => e.status === "Active" || recordByEmployee[e.id])
    .map((e) => ({ employee: e, record: recordByEmployee[e.id] }));

  const statusOf = (row) => (row.record ? row.record.status : "Not marked");
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f, f === "All" ? rows.length : rows.filter((r) => statusOf(r) === f).length])
  );
  const visible = filter === "All" ? rows : rows.filter((r) => statusOf(r) === filter);

  function afterChange(message) {
    setFormFor(null);
    setDeleteTarget(null);
    setSuccess(message);
    loadDay(date);
  }

  async function deleteRecord() {
    await api(`/api/attendance/${deleteTarget.record.id}`, { method: "DELETE" });
    afterChange(`Attendance for ${deleteTarget.employee.full_name} removed.`);
  }

  return (
    <div className="stack">
      <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>

      {/* ---------- Date picker ---------- */}
      <div className="date-bar">
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day">
          <ChevronLeft size={18} />
        </button>
        <input type="date" className="input" value={date} max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Attendance date" />
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, 1))} disabled={date >= today} aria-label="Next day">
          <ChevronRight size={18} />
        </button>
        <h2 className="date-title">{formatLongDate(date)}</h2>
        {date !== today && <button className="link-button" onClick={() => setDate(today)}>Go to today</button>}
      </div>

      {/* ---------- Summary chips (click to filter) ---------- */}
      <div className="chip-row">
        {FILTERS.map((f) => (
          <button key={f} className={`chip chip-${f.replace(" ", "-").toLowerCase()} ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}>
            <b>{counts[f]}</b> {f}
          </button>
        ))}
      </div>

      <section className="card">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="empty-state small"><p>No employees in this list.</p></div>
        ) : (
          <div className="table-wrap flush-top">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th className="right">Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ employee, record }) => (
                  <tr key={employee.id}>
                    <td><EmployeeCell name={employee.full_name} id={employee.id} /></td>
                    <td>{employee.department_name}</td>
                    <td>{record?.check_in || "—"}</td>
                    <td>{record?.check_out || "—"}</td>
                    <td className="right">{record?.hours_worked ?? "—"}</td>
                    <td>{record ? <StatusBadge status={record.status} /> : <span className="badge badge-gray">Not marked</span>}</td>
                    <td className="muted">{record?.remarks || "—"}</td>
                    <td>
                      {record ? (
                        <div className="row-actions">
                          <button className="icon-btn" title="Edit" aria-label={`Edit attendance for ${employee.full_name}`}
                            onClick={() => { setSuccess(""); setFormFor({ employee, record }); }}>
                            <Pencil size={16} />
                          </button>
                          <button className="icon-btn danger" title="Delete" aria-label={`Delete attendance for ${employee.full_name}`}
                            onClick={() => setDeleteTarget({ employee, record })}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button className="btn btn-sm btn-primary" onClick={() => { setSuccess(""); setFormFor({ employee, record: null }); }}>
                            Mark
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formFor && (
        <AttendanceForm employee={formFor.employee} record={formFor.record} date={date}
          onClose={() => setFormFor(null)} onSaved={afterChange} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete attendance record?"
          message={`${deleteTarget.employee.full_name}'s attendance for ${formatLongDate(date)} will be removed and show as Not marked.`}
          confirmLabel="Delete"
          onConfirm={deleteRecord}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
