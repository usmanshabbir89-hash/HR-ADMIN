// ReviewDialog - the pop-up where HR approves or rejects a request.
//
// Props:
//   target  = { endpoint: "/api/leave-requests/LR001", action: "approve" | "reject", title: "..." }
//             (null = dialog closed)
//   onClose = called when the user cancels
//   onDone  = called after the server saved the decision
import { useState } from "react";

import { api } from "../api.js";

export default function ReviewDialog({ target, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!target) return null;
  const isReject = target.action === "reject";

  async function handleSubmit(event) {
    event.preventDefault();
    // Same rule as the backend: rejecting needs a reason
    if (isReject && !remarks.trim()) {
      setError("Please write a reason for rejecting.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api(`${target.endpoint}/${target.action}`, {
        method: "PATCH",
        body: { hr_remarks: remarks.trim() },
      });
      setRemarks("");
      onDone(isReject ? "Request rejected." : "Request approved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setRemarks("");
    setError("");
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      {/* stopPropagation: clicking inside the box should not close it */}
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isReject ? "Reject request" : "Approve request"}</h2>
        <p className="muted">{target.title}</p>

        <label className="field">
          <span>HR remarks {isReject ? "(required)" : "(optional)"}</span>
          <textarea
            rows={3}
            value={remarks}
            maxLength={300}
            autoFocus
            placeholder={isReject ? "Why is this request rejected?" : "Any note for the employee"}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className={`btn ${isReject ? "btn-danger" : "btn-success"}`} disabled={saving}>
            {saving ? "Saving…" : isReject ? "Reject" : "Approve"}
          </button>
        </div>
      </form>
    </div>
  );
}
