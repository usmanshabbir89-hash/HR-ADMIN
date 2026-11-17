// Alert - a success or error message bar with a close button.
import { CircleAlert, CircleCheck, X } from "lucide-react";

export default function Alert({ type = "error", children, onClose }) {
  if (!children) return null;
  const Icon = type === "success" ? CircleCheck : CircleAlert;
  return (
    <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon size={18} />
      <span>{children}</span>
      {onClose && (
        <button className="icon-button" onClick={onClose} aria-label="Close message">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
