const Order = require("../models/Order");

// GET /api/v1/orders/mine
// customer only. Own orders — filtered by customer, never by a
// client-supplied id.
const listMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("store", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/orders/:id
// A customer can view their own order; a vendor can view an order placed
// against their own store; a super_admin can view any order.
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("store", "name slug")
      .populate("customer", "name email");

    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    const isOwner = String(order.customer._id) === String(req.user._id);
    const isVendorOfStore =
      req.user.role === "vendor" && String(order.store._id) === String(req.user.store);
    const isAdmin = req.user.role === "super_admin";

    if (!isOwner && !isVendorOfStore && !isAdmin) {
      const err = new Error("You do not have permission to view this order");
      err.statusCode = 403;
      throw err;
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

module.exports = { listMyOrders, getOrderById };
