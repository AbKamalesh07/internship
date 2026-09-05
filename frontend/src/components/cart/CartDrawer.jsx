import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  closeCartDrawer,
  removeItem,
  updateQuantity,
  selectCartGroupedByStore,
  selectCartSubtotal,
} from "../../features/cart/cartSlice";

function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector((state) => state.cart.isDrawerOpen);
  const storeGroups = useSelector(selectCartGroupedByStore);
  const subtotal = useSelector(selectCartSubtotal);
  const { user } = useSelector((state) => state.auth);

  if (!isOpen) return null;

  const lineKey = (item) => `${item.productId}::${item.variantId || "base"}`;

  const handleCheckout = () => {
    dispatch(closeCartDrawer());
    navigate(user ? "/checkout" : "/login");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => dispatch(closeCartDrawer())}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Your Cart</h2>
          <button
            onClick={() => dispatch(closeCartDrawer())}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {storeGroups.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-10">Your cart is empty.</p>
          )}

          {storeGroups.map((group) => (
            <div key={group.storeId} className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {group.storeName || "Store"}
              </p>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={lineKey(item)} className="flex gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded bg-gray-100" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-xs text-gray-400">{item.variantLabel}</p>
                      )}
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                variantId: item.variantId,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="w-6 h-6 border border-gray-300 rounded text-sm hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                variantId: item.variantId,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          disabled={
                            typeof item.maxStock === "number" && item.quantity >= item.maxStock
                          }
                          className="w-6 h-6 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-40"
                        >
                          +
                        </button>

                        <button
                          onClick={() =>
                            dispatch(
                              removeItem({ productId: item.productId, variantId: item.variantId })
                            )
                          }
                          className="text-xs text-red-500 hover:underline ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm text-gray-500 mt-3 pt-2 border-t border-gray-100">
                <span>Store subtotal</span>
                <span>${group.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {storeGroups.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4">
            <div className="flex justify-between text-base font-bold text-gray-800 mb-3">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {storeGroups.length > 1
                ? `Checkout will create ${storeGroups.length} separate orders, one per store.`
                : "Ready to check out."}
            </p>
            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700"
            >
              Checkout
            </button>
            {!user && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                You'll need to log in as a customer to check out.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default CartDrawer;
