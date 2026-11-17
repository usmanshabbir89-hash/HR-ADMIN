// ComingSoon - a temporary page for screens we build in later phases.
import { Hammer } from "lucide-react";

export default function ComingSoon({ phase }) {
  return (
    <div className="card empty-state">
      <Hammer size={32} />
      <h2>Coming in Phase {phase}</h2>
      <p className="muted">The API for this page is ready. The screen is built in a later phase.</p>
    </div>
  );
}
