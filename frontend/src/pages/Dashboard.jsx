// Dashboard - the HR Admin home page.
// Loads two things from the API:
//   /api/dashboard/summary  -> numbers for the stat cards
//   /api/dashboard/pending  -> all pending requests (with Approve / Reject)
import { useEffect, useState } from "react";
import {
  AlarmClock,
  Banknote,
  Building2,
  Check,
  Inbox,
  RefreshCw,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import ReviewDialog from "../components/ReviewDialog.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatDate, formatLongDate, formatMoney } from "../utils.js";

const TYPE_TONE = { Leave: "blue", "Short Leave": "purple", Salary: "teal" };

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null); // which request the dialog is for

  // Load both API calls at the same time
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [summaryData, pendingData] = await Promise.all([
        api("/api/dashboard/summary"),
        api("/api/dashboard/pending"),
      ]);
      setSummary(summaryData);
      setPending(pendingData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Run loadData once when the page opens
  useEffect(() => {
    loadData();
  }, []);

  function openReview(item, action) {
    setSuccess("");
    setReviewTarget({
      endpoint: item.endpoint,
      action,
      title: `${item.type} ${item.id} · ${item.employee_name} · ${item.details}`,
    });
  }

  function handleReviewed(message) {
    setReviewTarget(null);
    setSuccess(message);
    loadData(); // refresh numbers and the pending list
  }

  if (loading && !summary) {
    return <div className="card loading">Loading dashboard…</div>;
  }

  if (error && !summary) {
    return (
      <div className="stack">
        <Alert type="error">{error}</Alert>
        <button className="btn btn-primary" onClick={loadData}>
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    );
  }

  const { employees, attendance, pending_requests, monthly_payroll } = summary;
  const attendanceTotal =
    attendance.present + attendance.late + attendance.absent + attendance.on_leave + attendance.not_marked;
  const biggestDepartment = Math.max(1, ...summary.employees_per_department.map((d) => d.count));

  return (
    <div className="stack">
      <div className="page-intro">
        <div>
          <p className="muted">{formatLongDate(summary.date)}</p>
          <h2 className="welcome">Welcome back, HR Admin</h2>
        </div>
        <button className="btn btn-ghost" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>

      {/* ---------- Stat cards ---------- */}
      <section className="stat-grid">
        <StatCard icon={Users} label="Active employees" value={employees.active}
          hint={`${employees.inactive} inactive`} tone="blue" />
        <StatCard icon={Building2} label="Departments" value={summary.departments} tone="purple" />
        <StatCard icon={UserCheck} label="Present today" value={attendance.present} tone="green" />
        <StatCard icon={AlarmClock} label="Late today" value={attendance.late} tone="amber" />
        <StatCard icon={UserX} label="Absent today" value={attendance.absent} tone="red" />
        <StatCard icon={Inbox} label="Pending requests" value={pending_requests.total}
          hint={`${pending_requests.leave} leave · ${pending_requests.short_leave} short · ${pending_requests.salary} salary`}
          tone="amber" />
        <StatCard icon={Banknote} label="Monthly payroll"
          value={formatMoney(monthly_payroll.amount, monthly_payroll.currency)} tone="teal" />
      </section>

      <div className="dashboard-columns">
        {/* ---------- Pending requests table ---------- */}
        <section className="card">
          <div className="card-header">
            <h3>Pending requests</h3>
            <span className="count-pill">{pending.length}</span>
          </div>

          {pending.length === 0 ? (
            <div className="empty-state small">
              <Check size={28} />
              <p>All caught up — no pending requests.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Employee</th>
                    <th>Details</th>
                    <th>Submitted</th>
                    <th className="right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((item) => (
                    <tr key={item.endpoint}>
                      <td>
                        <span className={`badge badge-${TYPE_TONE[item.type]}`}>{item.type}</span>
                      </td>
                      <td>
                        <div className="strong">{item.employee_name}</div>
                        <div className="muted small">{item.employee_id}</div>
                      </td>
                      <td className="details-cell">{item.details}</td>
                      <td className="nowrap">{formatDate(item.submitted_on)}</td>
                      <td className="right nowrap">
                        <button className="btn btn-sm btn-success" onClick={() => openReview(item, "approve")}>
                          <Check size={14} /> Approve
                        </button>{" "}
                        <button className="btn btn-sm btn-danger-outline" onClick={() => openReview(item, "reject")}>
                          <X size={14} /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="stack">
          {/* ---------- Today's attendance bar ---------- */}
          <section className="card">
            <div className="card-header">
              <h3>Today's attendance</h3>
            </div>
            <div className="split-bar" aria-hidden="true">
              {[
                ["present", "green"],
                ["late", "amber"],
                ["absent", "red"],
                ["on_leave", "blue"],
                ["not_marked", "gray"],
              ].map(([key, tone]) =>
                attendance[key] > 0 ? (
                  <div key={key} className={`fill-${tone}`}
                    style={{ width: `${(attendance[key] / attendanceTotal) * 100}%` }} />
                ) : null
              )}
            </div>
            <ul className="legend">
              <li><i className="fill-green" /> Present <b>{attendance.present}</b></li>
              <li><i className="fill-amber" /> Late <b>{attendance.late}</b></li>
              <li><i className="fill-red" /> Absent <b>{attendance.absent}</b></li>
              <li><i className="fill-blue" /> On leave <b>{attendance.on_leave}</b></li>
              <li><i className="fill-gray" /> Not marked <b>{attendance.not_marked}</b></li>
            </ul>
          </section>

          {/* ---------- Employees per department ---------- */}
          <section className="card">
            <div className="card-header">
              <h3>Employees by department</h3>
            </div>
            <ul className="bar-list">
              {summary.employees_per_department.map((d) => (
                <li key={d.department}>
                  <div className="bar-label">
                    <span>{d.department}</span>
                    <b>{d.count}</b>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(d.count / biggestDepartment) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <ReviewDialog target={reviewTarget} onClose={() => setReviewTarget(null)} onDone={handleReviewed} />
    </div>
  );
}
