// ShortLeaves - short leave requests (employee, date, from, to, reason, status).
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmployeeSelect from "../components/EmployeeSelect.jsx";
import RequestActions from "../components/RequestActions.jsx";
import { EmployeeCell, ShortText } from "../components/RequestText.jsx";
import ReviewDialog from "../components/ReviewDialog.jsx";
import ShortLeaveForm from "../components/ShortLeaveForm.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusTabs from "../components/StatusTabs.jsx";
import { formatDate } from "../utils.js";

export default function ShortLeaves() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState("Pending");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  async function loadRequests() {
    try {
      setRequests(await api("/api/short-leaves"));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
    api("/api/employees").then(setEmployees).catch((err) => setError(err.message));
  }, []);

  const filtered = requests.filter(
    (r) => (!employeeId || r.employee_id === employeeId) && (!date || r.date === date)
  );
  const visible = status ? filtered.filter((r) => r.status === status) : filtered;

  function afterChange(message) {
    setShowForm(false);
    setReviewTarget(null);
    setCancelTarget(null);
    setSuccess(message);
    loadRequests();
  }

  async function cancelRequest() {
    await api(`/api/short-leaves/${cancelTarget.id}`, { method: "DELETE" });
    afterChange(`Short leave ${cancelTarget.id} cancelled.`);
  }

  return (
    <div className="stack">
      <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>

      <section className="card">
        <div className="toolbar">
          <StatusTabs items={filtered} value={status} onChange={setStatus} />
          <div className="toolbar-spacer" />
          <EmployeeSelect className="input" employees={employees} value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)} placeholder="All employees" aria-label="Filter by employee" />
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
          <button className="btn btn-primary" onClick={() => { setSuccess(""); setShowForm(true); }}>
            <Plus size={16} /> New short leave
          </button>
        </div>

        <p className="result-count">
          {loading ? "Loading…" : `${visible.length} request${visible.length === 1 ? "" : "s"}`}
          {date && <button className="link-button" onClick={() => setDate("")}>Clear date</button>}
        </p>

        {!loading && visible.length === 0 ? (
          <div className="empty-state small"><p>No {status ? `${status.toLowerCase()} ` : ""}short leave requests.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th className="right">Hours</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>HR remarks</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">{r.id}</td>
                    <td><EmployeeCell name={r.employee_name} id={r.employee_id} /></td>
                    <td className="nowrap">{formatDate(r.date)}</td>
                    <td className="nowrap">{r.from_time} – {r.to_time}</td>
                    <td className="right">{r.hours ?? "—"}</td>
                    <td><ShortText text={r.reason} /></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td><ShortText text={r.hr_remarks} /></td>
                    <td className="right">
                      <RequestActions
                        request={r}
                        label={r.id}
                        onReview={(action) => {
                          setSuccess("");
                          setReviewTarget({
                            endpoint: `/api/short-leaves/${r.id}`,
                            action,
                            title: `${r.id} · ${r.employee_name} · ${formatDate(r.date)}, ${r.from_time} – ${r.to_time}`,
                          });
                        }}
                        onCancel={() => setCancelTarget(r)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <ShortLeaveForm employees={employees} onClose={() => setShowForm(false)} onSaved={afterChange} />
      )}

      <ReviewDialog target={reviewTarget} onClose={() => setReviewTarget(null)} onDone={afterChange} />

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel short leave?"
          message={`${cancelTarget.id} for ${cancelTarget.employee_name} will be removed. Only Pending requests can be cancelled.`}
          confirmLabel="Cancel request"
          onConfirm={cancelRequest}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
