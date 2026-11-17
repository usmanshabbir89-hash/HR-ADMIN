// RequestActions - the buttons at the end of a request row.
//   Pending  -> Approve, Reject, Cancel
//   Approved / Rejected -> "Reviewed <date>" (no buttons: a decision is final)
import { Check, Trash2, X } from "lucide-react";

import { formatDate } from "../utils.js";

export default function RequestActions({ request, label, onReview, onCancel }) {
  if (request.status !== "Pending") {
    return <span className="muted small nowrap">Reviewed {formatDate(request.reviewed_on)}</span>;
  }
  return (
    <div className="row-actions">
      <button className="icon-btn success" title="Approve" aria-label={`Approve ${label}`}
        onClick={() => onReview("approve")}>
        <Check size={16} />
      </button>
      <button className="icon-btn danger" title="Reject" aria-label={`Reject ${label}`}
        onClick={() => onReview("reject")}>
        <X size={16} />
      </button>
      <button className="icon-btn" title="Cancel request" aria-label={`Cancel ${label}`}
        onClick={onCancel}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
