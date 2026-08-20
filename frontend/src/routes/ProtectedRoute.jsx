import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

// Wraps a set of routes. Usage in the router:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/dashboard" element={<DashboardPage />} />
//   </Route>
//
// Pass allowedRoles to also gate by role:
//   <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
function ProtectedRoute({ allowedRoles }) {
  const { user, accessToken } = useSelector((state) => state.auth);

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
