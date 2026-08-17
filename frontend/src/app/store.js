import { configureStore } from "@reduxjs/toolkit";

// Day 5+: authReducer, cartReducer will be added here as they're built.
export const store = configureStore({
  reducer: {
    // auth: authReducer,
    // cart: cartReducer,
  },
});
