import { useDispatch, useSelector } from "react-redux";
import { toggleCartDrawer, selectCartCount } from "../../features/cart/cartSlice";

function CartButton() {
  const dispatch = useDispatch();
  const count = useSelector(selectCartCount);

  return (
    <button
      onClick={() => dispatch(toggleCartDrawer())}
      className="relative px-3 py-2 rounded hover:bg-gray-100"
      aria-label="Open cart"
    >
      <span className="text-xl">🛒</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}

export default CartButton;
