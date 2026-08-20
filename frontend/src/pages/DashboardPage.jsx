import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../features/auth/authSlice";

// Placeholder landing page after login. Real per-role dashboards
// (Vendor inventory management, Super Admin analytics, Customer
// order history) get built out starting Week 2.
function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
        <p className="text-gray-500">
          Logged in as <span className="font-medium">{user?.role}</span>
        </p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-gray-800 text-white rounded px-4 py-2 hover:bg-gray-900"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
