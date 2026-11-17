// App.jsx - decides which page to show for each URL.
import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <Routes>
      {/* Every page is shown inside the Layout (sidebar + top bar) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<ComingSoon phase={6} />} />
        <Route path="/departments" element={<ComingSoon phase={6} />} />
        <Route path="/leave-types" element={<ComingSoon phase={7} />} />
        <Route path="/leave-requests" element={<ComingSoon phase={7} />} />
        <Route path="/short-leaves" element={<ComingSoon phase={7} />} />
        <Route path="/attendance" element={<ComingSoon phase={8} />} />
        <Route path="/salary-requests" element={<ComingSoon phase={7} />} />
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
