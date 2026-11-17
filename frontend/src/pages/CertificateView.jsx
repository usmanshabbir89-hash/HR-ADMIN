// CertificateView - the printable salary certificate at /salary-certificates/SC002.
// "Print" calls window.print(). The @media print rules in index.css hide the
// sidebar, top bar and buttons, so only the certificate is printed.
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Printer } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import { formatLongDate, formatMoney, numberToWords } from "../utils.js";

export default function CertificateView() {
  const { id } = useParams();
  const location = useLocation();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/salary-certificates/${id}`).then(setCert).catch((err) => setError(err.message));
  }, [id]);

  const toolbar = (
    <div className="page-intro no-print">
      <Link to="/salary-certificates" className="back-link">
        <ArrowLeft size={16} /> Back to certificates
      </Link>
      {cert && (
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Print / Save as PDF
        </button>
      )}
    </div>
  );

  if (error) return <div className="stack">{toolbar}<Alert type="error">{error}</Alert></div>;
  if (!cert) return <div className="card loading">Loading certificate…</div>;

  const { company } = cert;
  const money = (amount) => formatMoney(amount, company.currency);

  return (
    <div className="stack">
      {toolbar}
      {location.state?.justCreated && (
        <div className="no-print">
          <Alert type="success">Certificate {cert.certificate_no} generated.</Alert>
        </div>
      )}

      <article className="certificate">
        {/* ---------- Letterhead ---------- */}
        <header className="cert-head">
          <div className="cert-logo"><Briefcase size={22} /></div>
          <div>
            <div className="cert-company">{company.name}</div>
            <div className="cert-contact">{company.address}</div>
            <div className="cert-contact">{company.phone} · {company.email}</div>
          </div>
        </header>

        <div className="cert-meta">
          <span>Ref: <b>{cert.certificate_no}</b></span>
          <span>Date: <b>{formatLongDate(cert.issue_date)}</b></span>
        </div>

        <p className="cert-to">{cert.addressed_to}</p>

        <h1 className="cert-title">Salary Certificate</h1>

        {/* ---------- Body ---------- */}
        <p>
          This is to certify that <b>{cert.employee_name}</b> (Employee ID {cert.employee_id}) has been
          working with <b>{company.name}</b> as <b>{cert.designation}</b>
          {cert.department_name && <> in the <b>{cert.department_name}</b> department</>} since{" "}
          <b>{formatLongDate(cert.join_date)}</b>.
        </p>
        <p>The monthly salary details of {cert.employee_name} are as follows:</p>

        <table className="cert-table">
          <tbody>
            <tr><td>Basic salary</td><td>{money(cert.basic_salary)}</td></tr>
            <tr><td>Allowances</td><td>{money(cert.allowances)}</td></tr>
            <tr className="cert-total"><td>Gross monthly salary</td><td>{money(cert.total_salary)}</td></tr>
          </tbody>
        </table>
        <p className="cert-words">
          ({company.currency} {numberToWords(cert.total_salary)} only)
        </p>

        <p>
          This certificate is issued at the request of the employee for the purpose of{" "}
          <b>{cert.purpose}</b>, and carries no financial liability on the part of the company.
        </p>

        {/* ---------- Signature ---------- */}
        <footer className="cert-sign">
          <div className="cert-line" />
          <b>{company.signatory}</b>
          <span>{company.name}</span>
        </footer>
      </article>
    </div>
  );
}
