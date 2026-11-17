// LeaveTypes - Leave Master screen. Shown as cards because there are only a few types.
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { api } from "../api.js";
import Alert from "../components/Alert.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LeaveTypeForm from "../components/LeaveTypeForm.jsx";

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formFor, setFormFor] = useState(undefined); // undefined closed | null add | type edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadLeaveTypes() {
    try {
      setLeaveTypes(await api("/api/leave-types"));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  function handleSaved(message) {
    setFormFor(undefined);
    setSuccess(message);
    loadLeaveTypes();
  }

  async function deleteLeaveType() {
    await api(`/api/leave-types/${deleteTarget.id}`, { method: "DELETE" });
    setSuccess(`${deleteTarget.name} deleted.`);
    setDeleteTarget(null);
    loadLeaveTypes();
  }

  return (
    <div className="stack">
      <div className="page-intro">
        <p className="muted">The leave types employees can apply for, and how many days each allows per year.</p>
        <button className="btn btn-primary" onClick={() => { setSuccess(""); setFormFor(null); }}>
          <Plus size={16} /> Add leave type
        </button>
      </div>

      <Alert type="success" onClose={() => setSuccess("")}>{success}</Alert>
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>

      {loading ? (
        <div className="card loading">Loading…</div>
      ) : (
        <div className="type-grid">
          {leaveTypes.map((lt) => (
            <article key={lt.id} className="card type-card">
              <div className="type-card-head">
                <span className="code">{lt.code}</span>
                <span className={`badge ${lt.is_paid ? "badge-green" : "badge-gray"}`}>
                  {lt.is_paid ? "Paid" : "Unpaid"}
                </span>
              </div>
              <h3>{lt.name}</h3>
              <div className="type-days">
                <b>{lt.days_per_year}</b> days / year
              </div>
              <p className="muted small type-desc">{lt.description || "No description"}</p>
              <div className="type-card-foot">
                <span className="muted small">{lt.id}</span>
                <div className="row-actions">
                  <button className="icon-btn" title="Edit" aria-label={`Edit ${lt.name}`}
                    onClick={() => { setSuccess(""); setFormFor(lt); }}>
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn danger" title="Delete" aria-label={`Delete ${lt.name}`}
                    onClick={() => setDeleteTarget(lt)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formFor !== undefined && (
        <LeaveTypeForm leaveType={formFor} onClose={() => setFormFor(undefined)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete leave type?"
          message={`${deleteTarget.name} will be permanently removed. Leave types already used by a leave request cannot be deleted.`}
          confirmLabel="Delete"
          onConfirm={deleteLeaveType}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
