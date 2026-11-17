// EmployeeSelect - a dropdown of employees, used by every request form and filter.
// activeOnly = true shows only Active employees (requests can't be made for inactive ones).
export default function EmployeeSelect({ employees, value, onChange, activeOnly = false, placeholder = "Select employee…", ...rest }) {
  const list = activeOnly ? employees.filter((e) => e.status === "Active") : employees;
  return (
    <select value={value} onChange={onChange} {...rest}>
      <option value="">{placeholder}</option>
      {list.map((e) => (
        <option key={e.id} value={e.id}>
          {e.full_name} ({e.id})
        </option>
      ))}
    </select>
  );
}
