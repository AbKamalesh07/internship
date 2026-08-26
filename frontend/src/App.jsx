import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import VendorDashboardLayout from "./pages/vendor/VendorDashboardLayout";
import ProductListPage from "./pages/vendor/ProductListPage";
import AddProductPage from "./pages/vendor/AddProductPage";

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

      {/* Vendor-only dashboard */}
      <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
        <Route path="/vendor" element={<VendorDashboardLayout />}>
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<AddProductPage />} />
          {/* products/:id/edit lands with the edit flow in Part 2 (Day 10) */}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
