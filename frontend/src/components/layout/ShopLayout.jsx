import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import CartButton from "../cart/CartButton";
import CartDrawer from "../cart/CartDrawer";

function ShopLayout() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/shop" className="font-bold text-gray-800">
            Marketplace
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="text-sm text-gray-600 hover:underline">
                {user.name}
              </Link>
            ) : (
              <Link to="/login" className="text-sm text-gray-600 hover:underline">
                Log in
              </Link>
            )}
            <CartButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      <CartDrawer />
    </div>
  );
}

export default ShopLayout;
