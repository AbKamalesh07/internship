import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../features/auth/authSlice";

// Placeholder landing page after login. Real per-role dashboards
// (Super Admin analytics, Customer order history) still land later;
// vendors now get routed into the real dashboard built Day 9.
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

        {user?.role === "vendor" && (
          <Link
            to="/vendor/products"
            className="inline-block mt-2 text-blue-600 hover:underline text-sm"
          >
            Go to your vendor dashboard →
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="mt-4 bg-gray-800 text-white rounded px-4 py-2 hover:bg-gray-900 block mx-auto"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
