import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Bootstrap initial state from localStorage so a page refresh doesn't
// log the user out. Only the token/user are persisted — never the password.
const storedUser = localStorage.getItem("user");
const storedAccessToken = localStorage.getItem("accessToken");
const storedRefreshToken = localStorage.getItem("refreshToken");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const persistAuth = ({ user, accessToken, refreshToken }) => {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

const clearPersistedAuth = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// --- Async thunks ---

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password, role }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/register", { name, email, password, role });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { rejectWithValue }) => {
  try {
    await api.post("/auth/logout");
    return true;
  } catch (err) {
    // Even if the server call fails, we still want to clear local state.
    return rejectWithValue(err.response?.data?.message || "Logout failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Used by the axios interceptor after a successful silent refresh,
    // to update the access token without a full login round-trip.
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
    // Used by the axios interceptor when a refresh attempt itself fails
    // (refresh token expired/revoked) — forces the user back to login.
    forceLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      clearPersistedAuth();
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persistAuth(action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persistAuth(action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.status = "idle";
        clearPersistedAuth();
      })
      .addCase(logoutUser.rejected, (state) => {
        // Clear local state regardless — the server-side token may already
        // be invalid, but the user still expects to be logged out locally.
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        clearPersistedAuth();
      });
  },
});

export const { setAccessToken, forceLogout } = authSlice.actions;
export default authSlice.reducer;
