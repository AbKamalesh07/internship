import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

// Day 5: cartReducer will be added here in Week 3.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // cart: cartReducer,
  },
});
