import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "cart";

const loadCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // Corrupted or unavailable localStorage shouldn't crash the app —
    // just start with an empty cart.
    return [];
  }
};

const persistCart = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

// A cart line is uniquely identified by product + variant (a product
// without variants uses variantId: null). This is what lets the same
// product with two different variants sit as two separate lines.
const sameLine = (a, b) => a.productId === b.productId && a.variantId === b.variantId;

const initialState = {
  items: loadCart(),
  isDrawerOpen: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // payload: { productId, variantId, name, variantLabel, price, image,
    //            storeId, storeName, maxStock, quantity }
    // If the same product+variant is already in the cart, quantities are
    // merged (capped at maxStock, when known) instead of adding a duplicate line.
    addItem: (state, action) => {
      const incoming = { quantity: 1, variantId: null, ...action.payload };
      const existing = state.items.find((item) => sameLine(item, incoming));

      if (existing) {
        const nextQty = existing.quantity + incoming.quantity;
        existing.quantity =
          typeof existing.maxStock === "number"
            ? Math.min(nextQty, existing.maxStock)
            : nextQty;
      } else {
        state.items.push(incoming);
      }

      persistCart(state.items);
    },

    // payload: { productId, variantId }
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => !sameLine(item, action.payload));
      persistCart(state.items);
    },

    // payload: { productId, variantId, quantity } — quantity <= 0 removes the line.
    updateQuantity: (state, action) => {
      const { quantity } = action.payload;

      if (quantity <= 0) {
        state.items = state.items.filter((item) => !sameLine(item, action.payload));
      } else {
        const line = state.items.find((item) => sameLine(item, action.payload));
        if (line) {
          line.quantity =
            typeof line.maxStock === "number" ? Math.min(quantity, line.maxStock) : quantity;
        }
      }

      persistCart(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      persistCart(state.items);
    },

    openCartDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    toggleCartDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
} = cartSlice.actions;

// --- Selectors ---
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// Groups cart lines by store — checkout (Day 12) creates one Order per
// store, so the UI shows totals broken down the same way ahead of time.
export const selectCartGroupedByStore = (state) => {
  const groups = {};
  for (const item of state.cart.items) {
    const key = item.storeId;
    if (!groups[key]) {
      groups[key] = { storeId: item.storeId, storeName: item.storeName, items: [], subtotal: 0 };
    }
    groups[key].items.push(item);
    groups[key].subtotal += item.price * item.quantity;
  }
  return Object.values(groups);
};

export default cartSlice.reducer;
