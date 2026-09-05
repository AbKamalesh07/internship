import { loadStripe } from "@stripe/stripe-js";

// loadStripe should only be called once per publishable key — calling it
// on every render would create a new Stripe instance each time. Module
// scope means this runs exactly once when the module is first imported.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default stripePromise;
