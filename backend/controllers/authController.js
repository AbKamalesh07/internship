const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

// Helper: shape the response consistently, never leak password/refreshToken.
const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  store: user.store,
});

// POST /api/v1/auth/register
// Registers as customer or vendor. (super_admin accounts are seeded
// directly in the DB, never created through this public endpoint.)
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      const err = new Error("Name, email, and password are required");
      err.statusCode = 400;
      throw err;
    }

    const allowedRoles = ["customer", "vendor"];
    const finalRole = allowedRoles.includes(role) ? role : "customer";

    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error("An account with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    const user = await User.create({ name, email, password, role: finalRole });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      user: buildUserResponse(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.statusCode = 400;
      throw err;
    }

    // password has `select: false` in the schema, so it must be requested explicitly
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error("This account has been deactivated");
      err.statusCode = 403;
      throw err;
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      user: buildUserResponse(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/refresh
// Exchanges a valid refresh token for a new access token, without
// requiring the user to log in again.
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      const err = new Error("Refresh token is required");
      err.statusCode = 400;
      throw err;
    }

    const decoded = verifyRefreshToken(refreshToken); // throws if invalid/expired

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      const err = new Error("Refresh token is invalid or has been revoked");
      err.statusCode = 401;
      throw err;
    }

    const accessToken = generateAccessToken(user._id, user.role);
    res.status(200).json({ success: true, accessToken });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      err.statusCode = 401;
      err.message = "Refresh token invalid or expired, please log in again";
    }
    next(err);
  }
};

// POST /api/v1/auth/logout
// Clears the stored refresh token so it can no longer be exchanged.
const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: buildUserResponse(req.user) });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, getMe };
