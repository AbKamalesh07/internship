import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import VendorDashboardLayout from "./pages/vendor/VendorDashboardLayout";
import ProductListPage from "./pages/vendor/ProductListPage";
import AddProductPage from "./pages/vendor/AddProductPage";
import EditProductPage from "./pages/vendor/EditProductPage";
import ShopLayout from "./components/layout/ShopLayout";
import ProductBrowsePage from "./pages/shop/ProductBrowsePage";
import CheckoutPage from "./pages/shop/CheckoutPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Public storefront — browsing and the cart don't require login */}
      <Route element={<ShopLayout />}>
        <Route path="/shop" element={<ProductBrowsePage />} />

        {/* Checkout requires a customer account (the backend's /checkout
            route is customer-only) but keeps the same navbar/cart drawer */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>
      </Route>

      {/* Any authenticated role can reach these */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Vendor-only dashboard */}
      <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
        <Route path="/vendor" element={<VendorDashboardLayout />}>
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<AddProductPage />} />
          <Route path="products/:id/edit" element={<EditProductPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  );
}

export default App;
