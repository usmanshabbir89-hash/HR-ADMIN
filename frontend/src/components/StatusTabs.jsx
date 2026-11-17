// StatusTabs - "All | Pending | Approved | Rejected" tabs with a count on each.
// items = the full list of requests; value = selected status ("" = All)
const STATUSES = ["", "Pending", "Approved", "Rejected"];

export default function StatusTabs({ items, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {STATUSES.map((status) => {
        const count = status ? items.filter((i) => i.status === status).length : items.length;
        return (
          <button
            key={status || "all"}
            role="tab"
            aria-selected={value === status}
            className={`tab ${value === status ? "active" : ""}`}
            onClick={() => onChange(status)}
          >
            {status || "All"} <span className="tab-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
