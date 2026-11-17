// EmployeeDetails - one employee's profile at /employees/EMP001.
// Shows personal details, leave balance, recent leave requests and attendance.
// The ID comes from the URL using useParams().
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate, formatMoney, initials } from "../utils.js";

export default function EmployeeDetails() {
  const { id } = useParams(); // "EMP001"
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    // Four API calls at the same time
    Promise.all([
      api(`/api/employees/${id}`),
      api(`/api/leave-requests/balance/${id}`),
      api(`/api/leave-requests?employee_id=${id}`),
      api(`/api/attendance?employee_id=${id}`),
    ])
      .then(([employee, balance, leaves, attendance]) =>
        setData({ employee, balance: balance.balance, year: balance.year, leaves, attendance })
      )
      .catch((err) => setError(err.message));
  }, [id]);

  const backLink = (
    <Link to="/employees" className="back-link">
      <ArrowLeft size={16} /> Back to employees
    </Link>
  );

  if (error) {
    return <div className="stack">{backLink}<Alert type="error">{error}</Alert></div>;
  }
  if (!data) {
    return <div className="card loading">Loading employee…</div>;
  }

  const { employee, balance, year, leaves, attendance } = data;

  return (
    <div className="stack">
      {backLink}

      {/* ---------- Profile ---------- */}
      <section className="card profile">
        <div className="avatar avatar-lg">{initials(employee.full_name)}</div>
        <div className="profile-main">
          <div className="profile-title">
            <h2>{employee.full_name}</h2>
            <StatusBadge status={employee.status} />
          </div>
          <p className="muted">{employee.designation} · {employee.department_name} · {employee.id}</p>
        </div>
        <dl className="detail-list">
          <div><dt>Email</dt><dd>{employee.email}</dd></div>
          <div><dt>Phone</dt><dd>{employee.phone}</dd></div>
          <div><dt>Joined</dt><dd>{formatDate(employee.join_date)}</dd></div>
          <div><dt>Basic salary</dt><dd>{formatMoney(employee.basic_salary)}</dd></div>
          <div><dt>Allowances</dt><dd>{formatMoney(employee.allowances)}</dd></div>
          <div><dt>Gross salary</dt><dd className="strong">{formatMoney(employee.basic_salary + employee.allowances)}</dd></div>
        </dl>
      </section>

      <div className="two-columns">
        {/* ---------- Leave balance ---------- */}
        <section className="card">
          <div className="card-header"><h3>Leave balance {year}</h3></div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Leave type</th>
                  <th className="right">Allowed</th>
                  <th className="right">Used</th>
                  <th className="right">Pending</th>
                  <th className="right">Left</th>
                </tr>
              </thead>
              <tbody>
                {balance.map((b) => (
                  <tr key={b.leave_type_id}>
                    <td>{b.leave_type_name}</td>
                    <td className="right">{b.allowed}</td>
                    <td className="right">{b.approved}</td>
                    <td className="right">{b.pending}</td>
                    <td className="right strong">{b.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- Leave history ---------- */}
        <section className="card">
          <div className="card-header"><h3>Leave requests</h3></div>
          {leaves.length === 0 ? (
            <p className="muted">No leave requests yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Type</th><th>Dates</th><th className="right">Days</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {leaves.map((r) => (
                    <tr key={r.id}>
                      <td>{r.leave_type_name}</td>
                      <td className="nowrap">{formatDate(r.start_date)} – {formatDate(r.end_date)}</td>
                      <td className="right">{r.days}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ---------- Attendance history ---------- */}
      <section className="card">
        <div className="card-header"><h3>Recent attendance</h3></div>
        {attendance.length === 0 ? (
          <p className="muted">No attendance records yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th className="right">Hours</th><th>Status</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {attendance.slice(0, 10).map((a) => (
                  <tr key={a.id}>
                    <td className="nowrap">{formatDate(a.date)}</td>
                    <td>{a.check_in || "—"}</td>
                    <td>{a.check_out || "—"}</td>
                    <td className="right">{a.hours_worked ?? "—"}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="muted">{a.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
