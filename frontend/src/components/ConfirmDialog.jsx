// ConfirmDialog - "Are you sure?" pop-up used before deleting or deactivating.
//
// onConfirm must be an async function that calls the API.
// If the API returns an error (e.g. "department has employees"), it is shown inside the dialog.
import { useState } from "react";

import Modal from "./Modal.jsx";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", tone = "danger", onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} width={440}>
      <p className="muted">{message}</p>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
