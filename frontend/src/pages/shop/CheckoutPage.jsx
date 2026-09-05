import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "../../stripe";
import api from "../../api/axios";
import {
  selectCartItems,
  selectCartGroupedByStore,
  selectCartSubtotal,
  clearCart,
} from "../../features/cart/cartSlice";
import StripePaymentForm from "../../components/checkout/StripePaymentForm";

function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const storeGroups = useSelector(selectCartGroupedByStore);
  const subtotal = useSelector(selectCartSubtotal);

  const [address, setAddress] = useState({
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [clientSecret, setClientSecret] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | failed
  const [error, setError] = useState(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  // Step 1: send the cart to the backend, which validates stock, creates
  // the pending order(s), and returns a Stripe clientSecret for the total.
  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const items = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      }));

      const res = await api.post("/checkout", { items, shippingAddress: address });
      setClientSecret(res.data.clientSecret);
      setOrderCount(res.data.count);
      setStatus("idle");
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed");
      setStatus("failed");
    }
  };

  const handlePaymentSuccess = () => {
    dispatch(clearCart());
    setPaymentSucceeded(true);
  };

  if (paymentSucceeded) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment successful 🎉</h1>
        <p className="text-gray-500 mb-6">
          {orderCount} order{orderCount !== 1 ? "s" : ""} placed. Order status will update to
          "paid" once the payment webhook is processed.
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="bg-blue-600 text-white rounded px-5 py-2 font-medium hover:bg-blue-700"
        >
          Continue shopping
        </button>
      </div>
    );
  }

  if (cartItems.length === 0 && !clientSecret) {
    return <p className="text-gray-500">Your cart is empty.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>

      {/* Order summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Order Summary</h2>
        {storeGroups.map((group) => (
          <div key={group.storeId} className="mb-3 last:mb-0">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
              {group.storeName || "Store"}
            </p>
            {group.items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || "base"}`}
                className="flex justify-between text-sm text-gray-600"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-800 border-t border-gray-100 mt-3 pt-3">
          <span>Total</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Step 1: shipping address, shown until we have a clientSecret */}
      {!clientSecret && (
        <form
          onSubmit={handleContinueToPayment}
          className="bg-white border border-gray-200 rounded-lg p-5 space-y-3"
        >
          <h2 className="font-semibold text-gray-800 mb-2">Shipping Address</h2>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <input
            name="line1"
            placeholder="Address line 1"
            value={address.line1}
            onChange={handleAddressChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="city"
              placeholder="City"
              value={address.city}
              onChange={handleAddressChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              name="state"
              placeholder="State"
              value={address.state}
              onChange={handleAddressChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              name="postalCode"
              placeholder="Postal code"
              value={address.postalCode}
              onChange={handleAddressChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              name="country"
              placeholder="Country"
              value={address.country}
              onChange={handleAddressChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "loading" ? "Preparing payment..." : "Continue to Payment"}
          </button>
        </form>
      )}

      {/* Step 2: Stripe payment form, shown once the backend has created
          the order(s) and returned a clientSecret */}
      {clientSecret && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Payment</h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm onSuccess={handlePaymentSuccess} />
          </Elements>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
