import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Any authenticated role can reach these */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Example of a role-gated route group for later use, e.g.:
      <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
        <Route path="/vendor/products" element={<VendorProductsPage />} />
      </Route>
      */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
