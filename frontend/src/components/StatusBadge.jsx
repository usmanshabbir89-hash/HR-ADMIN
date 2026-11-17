// StatusBadge - a small coloured label like "Pending", "Approved", "Late".
// The colour is chosen from the status text (see .badge-* classes in index.css).

const TONES = {
  Active: "green",
  Approved: "green",
  Present: "green",
  Pending: "amber",
  Late: "amber",
  Rejected: "red",
  Absent: "red",
  Inactive: "gray",
};

export default function StatusBadge({ status }) {
  const tone = TONES[status] || "blue";
  return <span className={`badge badge-${tone}`}>{status}</span>;
}
