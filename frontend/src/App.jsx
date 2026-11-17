// App.jsx - decides which page to show for each URL.
import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Departments from "./pages/Departments.jsx";
import EmployeeDetails from "./pages/EmployeeDetails.jsx";
import Employees from "./pages/Employees.jsx";
import LeaveRequests from "./pages/LeaveRequests.jsx";
import LeaveTypes from "./pages/LeaveTypes.jsx";
import SalaryRequests from "./pages/SalaryRequests.jsx";
import ShortLeaves from "./pages/ShortLeaves.jsx";

export default function App() {
  return (
    <Routes>
      {/* Every page is shown inside the Layout (sidebar + top bar) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        {/* :id is a placeholder - /employees/EMP001 gives id = "EMP001" */}
        <Route path="/employees/:id" element={<EmployeeDetails />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/leave-types" element={<LeaveTypes />} />
        <Route path="/leave-requests" element={<LeaveRequests />} />
        <Route path="/short-leaves" element={<ShortLeaves />} />
        <Route path="/attendance" element={<ComingSoon phase={8} />} />
        <Route path="/salary-requests" element={<SalaryRequests />} />
        <Route path="/salary-certificates" element={<ComingSoon phase={8} />} />
        <Route
          path="*"
          element={
            <div className="card empty-state">
              <h2>Page not found</h2>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
