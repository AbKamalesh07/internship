import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Renders inside an <Elements> provider that already has the clientSecret
// (see CheckoutPage) — useStripe/useElements pick that context up automatically.
function StripePaymentForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe.js hasn't finished loading yet

    setSubmitting(true);
    setError(null);

    // redirect: "if_required" keeps the customer on this page for cards
    // (the common case) and only redirects for payment methods that
    // require it (e.g. certain bank redirects) — no return_url needed
    // for the card-only flow this project uses.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please check your card details.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      // Covers less common intermediate states (e.g. "processing") —
      // rare for test cards, but don't leave the customer stuck silently.
      setError("Payment is still processing — please wait a moment and check your orders.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

export default StripePaymentForm;
