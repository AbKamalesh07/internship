import { NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../features/auth/authSlice";

const navLinkClass = ({ isActive }) =>
  `block px-4 py-2 rounded text-sm font-medium ${
    isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
  }`;

function VendorDashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <p className="text-sm text-gray-400">Vendor Dashboard</p>
          <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/vendor/products" className={navLinkClass} end>
            Products
          </NavLink>
          <NavLink to="/vendor/products/new" className={navLinkClass}>
            Add Product
          </NavLink>
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default VendorDashboardLayout;
