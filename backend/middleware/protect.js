const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");

// Verifies the access token on protected routes and attaches the
// authenticated user to req.user. This is the FIRST link in the RBAC
// chain: protect -> authorize(...roles) -> tenantScope (Day 4).
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Not authorized, no token provided");
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token); // throws if invalid/expired

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      const err = new Error("Not authorized, user no longer exists or is inactive");
      err.statusCode = 401;
      throw err;
    }

    req.user = user; // available to every downstream controller/middleware
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      err.statusCode = 401;
      err.message = "Not authorized, token invalid or expired";
    }
    next(err);
  }
};

module.exports = protect;
