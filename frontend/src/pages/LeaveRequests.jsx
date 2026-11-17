// LeaveRequests - list leave requests, filter them, submit new ones,
// and approve / reject / cancel.
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmployeeSelect from "../components/EmployeeSelect.jsx";
import LeaveRequestForm from "../components/LeaveRequestForm.jsx";
import RequestActions from "../components/RequestActions.jsx";
import { EmployeeCell, ShortText } from "../components/RequestText.jsx";
import ReviewDialog from "../components/ReviewDialog.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusTabs from "../components/StatusTabs.jsx";
import { formatDate } from "../utils.js";

export default function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [status, setStatus] = useState("Pending"); // open on the Pending tab - that's HR's to-do list
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  async function loadRequests() {
    try {
      setRequests(await api("/api/leave-requests"));
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
    api("/api/leave-types").then(setLeaveTypes).catch((err) => setError(err.message));
  }, []);

  // Employee and leave-type filters first; the tabs then count what is left
  const filtered = requests.filter(
    (r) => (!employeeId || r.employee_id === employeeId) && (!leaveTypeId || r.leave_type_id === leaveTypeId)
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
    await api(`/api/leave-requests/${cancelTarget.id}`, { method: "DELETE" });
    afterChange(`Leave request ${cancelTarget.id} cancelled.`);
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
          <select className="input" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} aria-label="Filter by leave type">
            <option value="">All leave types</option>
            {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setSuccess(""); setShowForm(true); }}>
            <Plus size={16} /> New request
          </button>
        </div>

        <p className="result-count">{loading ? "Loading…" : `${visible.length} request${visible.length === 1 ? "" : "s"}`}</p>

        {!loading && visible.length === 0 ? (
          <div className="empty-state small"><p>No {status ? `${status.toLowerCase()} ` : ""}leave requests.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Leave type</th>
                  <th>Dates</th>
                  <th className="right">Days</th>
                  <th>Reason</th>
                  <th>Applied</th>
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
                    <td className="nowrap">{r.leave_type_name}</td>
                    <td className="nowrap">{formatDate(r.start_date)} – {formatDate(r.end_date)}</td>
                    <td className="right">{r.days}</td>
                    <td><ShortText text={r.reason} /></td>
                    <td className="nowrap">{formatDate(r.applied_on)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td><ShortText text={r.hr_remarks} /></td>
                    <td className="right">
                      <RequestActions
                        request={r}
                        label={r.id}
                        onReview={(action) => {
                          setSuccess("");
                          setReviewTarget({
                            endpoint: `/api/leave-requests/${r.id}`,
                            action,
                            title: `${r.id} · ${r.employee_name} · ${r.leave_type_name}, ${r.days} day(s) from ${formatDate(r.start_date)}`,
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
        <LeaveRequestForm employees={employees} leaveTypes={leaveTypes}
          onClose={() => setShowForm(false)} onSaved={afterChange} />
      )}

      <ReviewDialog target={reviewTarget} onClose={() => setReviewTarget(null)} onDone={afterChange} />

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel leave request?"
          message={`${cancelTarget.id} for ${cancelTarget.employee_name} will be removed. Only Pending requests can be cancelled.`}
          confirmLabel="Cancel request"
          onConfirm={cancelRequest}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
