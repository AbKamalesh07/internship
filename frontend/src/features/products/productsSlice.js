import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  createStatus: "idle",
  createError: null,
  updateStatus: "idle",
  updateError: null,
  deletingId: null, // tracks which row is mid-delete, for per-row spinners
};

// GET /products/vendor/mine — the vendor's own products, incl. drafts.
// Auto-scoped server-side to the vendor's store; no storeId is ever sent.
export const fetchMyProducts = createAsyncThunk(
  "products/fetchMyProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/products/vendor/mine");
      return res.data.products;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load products");
    }
  }
);

// POST /products — accepts a FormData payload (see AddProductPage) so
// image files travel alongside the text fields in one multipart request.
export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/products", formData);
      return res.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create product");
    }
  }
);

// PATCH /products/:id
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/products/${id}`, formData);
      return res.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update product");
    }
  }
);

// DELETE /products/:id
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete product");
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearCreateError: (state) => {
      state.createError = null;
    },
    clearUpdateError: (state) => {
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchMyProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create
      .addCase(createProduct.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload;
      })
      // Update
      .addCase(updateProduct.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const idx = state.items.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload;
      })
      // Delete
      .addCase(deleteProduct.pending, (state, action) => {
        state.deletingId = action.meta.arg;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
        state.deletingId = null;
      })
      .addCase(deleteProduct.rejected, (state) => {
        state.deletingId = null;
      });
  },
});

export const { clearCreateError, clearUpdateError } = productsSlice.actions;
export default productsSlice.reducer;
