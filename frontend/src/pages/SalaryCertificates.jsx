// SalaryCertificates - list of issued certificates + "Generate" button.
// Click a certificate to open the printable view.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FilePlus2, Printer } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import CertificateForm from "../components/CertificateForm.jsx";
import EmployeeSelect from "../components/EmployeeSelect.jsx";
import { EmployeeCell, ShortText } from "../components/RequestText.jsx";
import { formatDate, formatMoney } from "../utils.js";

export default function SalaryCertificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([api("/api/salary-certificates"), api("/api/employees")])
      .then(([certs, emps]) => {
        setCertificates(certs);
        setEmployees(emps);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = employeeId ? certificates.filter((c) => c.employee_id === employeeId) : certificates;

  return (
    <div className="stack">
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>

      <section className="card">
        <div className="toolbar">
          <EmployeeSelect className="input" employees={employees} value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)} placeholder="All employees" aria-label="Filter by employee" />
          <div className="toolbar-spacer" />
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <FilePlus2 size={16} /> Generate certificate
          </button>
        </div>

        <p className="result-count">{loading ? "Loading…" : `${visible.length} certificate${visible.length === 1 ? "" : "s"}`}</p>

        {!loading && visible.length === 0 ? (
          <div className="empty-state small"><p>No certificates issued yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Certificate no.</th>
                  <th>Employee</th>
                  <th>Purpose</th>
                  <th>Addressed to</th>
                  <th>Issued</th>
                  <th className="right">Gross salary</th>
                  <th className="right">Open</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id}>
                    <td className="nowrap">
                      <Link to={`/salary-certificates/${c.id}`} className="strong link">{c.certificate_no}</Link>
                    </td>
                    <td><EmployeeCell name={c.employee_name} id={c.employee_id} /></td>
                    <td><ShortText text={c.purpose} /></td>
                    <td><ShortText text={c.addressed_to} /></td>
                    <td className="nowrap">{formatDate(c.issue_date)}</td>
                    <td className="right nowrap">{formatMoney(c.total_salary)}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/salary-certificates/${c.id}`} className="icon-btn" title="View and print"
                          aria-label={`View and print ${c.certificate_no}`}>
                          <Printer size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <CertificateForm
          employees={employees}
          onClose={() => setShowForm(false)}
          onSaved={(saved) => navigate(`/salary-certificates/${saved.id}`, { state: { justCreated: true } })}
        />
      )}
    </div>
  );
}
