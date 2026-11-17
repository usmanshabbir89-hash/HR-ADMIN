// App.jsx - decides which page to show for each URL.
import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Attendance from "./pages/Attendance.jsx";
import CertificateView from "./pages/CertificateView.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Departments from "./pages/Departments.jsx";
import EmployeeDetails from "./pages/EmployeeDetails.jsx";
import Employees from "./pages/Employees.jsx";
import LeaveRequests from "./pages/LeaveRequests.jsx";
import LeaveTypes from "./pages/LeaveTypes.jsx";
import SalaryCertificates from "./pages/SalaryCertificates.jsx";
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
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/salary-requests" element={<SalaryRequests />} />
        <Route path="/salary-certificates" element={<SalaryCertificates />} />
        <Route path="/salary-certificates/:id" element={<CertificateView />} />
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
