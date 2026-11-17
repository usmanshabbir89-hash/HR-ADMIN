// SalaryRequests - salary-related requests and their status.
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmployeeSelect from "../components/EmployeeSelect.jsx";
import RequestActions from "../components/RequestActions.jsx";
import { EmployeeCell, ShortText } from "../components/RequestText.jsx";
import ReviewDialog from "../components/ReviewDialog.jsx";
import SalaryRequestForm, { SALARY_REQUEST_TYPES } from "../components/SalaryRequestForm.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusTabs from "../components/StatusTabs.jsx";
import { formatDate, formatMoney } from "../utils.js";

export default function SalaryRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState("Pending");
  const [employeeId, setEmployeeId] = useState("");
  const [requestType, setRequestType] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  async function loadRequests() {
    try {
      setRequests(await api("/api/salary-requests"));
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
    (r) => (!employeeId || r.employee_id === employeeId) && (!requestType || r.request_type === requestType)
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
    await api(`/api/salary-requests/${cancelTarget.id}`, { method: "DELETE" });
    afterChange(`Salary request ${cancelTarget.id} cancelled.`);
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
          <select className="input" value={requestType} onChange={(e) => setRequestType(e.target.value)} aria-label="Filter by request type">
            <option value="">All types</option>
            {SALARY_REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setSuccess(""); setShowForm(true); }}>
            <Plus size={16} /> New request
          </button>
        </div>

        <p className="result-count">{loading ? "Loading…" : `${visible.length} request${visible.length === 1 ? "" : "s"}`}</p>

        {!loading && visible.length === 0 ? (
          <div className="empty-state small"><p>No {status ? `${status.toLowerCase()} ` : ""}salary requests.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th className="right">Amount</th>
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
                    <td className="nowrap">
                      <div>{r.request_type}</div>
                      <div className="muted small">requested {formatDate(r.requested_on)}</div>
                    </td>
                    <td className="right nowrap">{formatMoney(r.amount)}</td>
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
                            endpoint: `/api/salary-requests/${r.id}`,
                            action,
                            title: `${r.id} · ${r.employee_name} · ${r.request_type}: ${formatMoney(r.amount)}`,
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
        <SalaryRequestForm employees={employees} onClose={() => setShowForm(false)} onSaved={afterChange} />
      )}

      <ReviewDialog target={reviewTarget} onClose={() => setReviewTarget(null)} onDone={afterChange} />

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel salary request?"
          message={`${cancelTarget.id} for ${cancelTarget.employee_name} will be removed. Only Pending requests can be cancelled.`}
          confirmLabel="Cancel request"
          onConfirm={cancelRequest}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
