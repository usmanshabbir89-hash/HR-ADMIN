// Small pieces shown inside request tables.

// Employee name with the ID underneath
export function EmployeeCell({ name, id }) {
  return (
    <>
      <div className="strong">{name}</div>
      <div className="muted small">{id}</div>
    </>
  );
}

// Long text cut to one line; hover to see all of it
export function ShortText({ text }) {
  if (!text) return <span className="muted">—</span>;
  return (
    <span className="truncate" title={text}>
      {text}
    </span>
  );
}
