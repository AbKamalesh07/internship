const Store = require("../models/Store");
const User = require("../models/User");

// Turn "My Cool Shop" into "my-cool-shop", with a random suffix to
// avoid collisions without making the vendor pick a unique slug themselves.
const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// POST /api/v1/stores
// vendor only. Creates the vendor's single store and links it back onto
// their User document (req.user.store) — that link is what tenantScope
// reads on every subsequent request.
const createStore = async (req, res, next) => {
  try {
    if (req.user.store) {
      const err = new Error("This vendor account already has a store");
      err.statusCode = 409;
      throw err;
    }

    const { name, description, contactEmail } = req.body;
    if (!name) {
      const err = new Error("Store name is required");
      err.statusCode = 400;
      throw err;
    }

    const baseSlug = slugify(name);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

    const store = await Store.create({
      name,
      slug,
      owner: req.user._id,
      description,
      contactEmail,
    });

    // Link the store back onto the vendor's own user record.
    req.user.store = store._id;
    await req.user.save();

    res.status(201).json({ success: true, store });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/stores/:storeId
// Public. Anyone can view a storefront, approved or not doesn't matter
// for this read (approval gating for product visibility happens at the
// product level in Week 2).
const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      const err = new Error("Store not found");
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ success: true, store });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/stores/:storeId
// vendor only, and only the owner of that exact store (tenantScope has
// already confirmed req.tenantStoreId === req.user.store; here we also
// double check the :storeId param matches, so a vendor can't edit another
// store just by changing the URL).
const updateStore = async (req, res, next) => {
  try {
    if (req.params.storeId !== String(req.tenantStoreId)) {
      const err = new Error("You do not have permission to modify this store");
      err.statusCode = 403;
      throw err;
    }

    const allowedFields = ["name", "description", "logoUrl", "bannerUrl", "contactEmail"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const store = await Store.findByIdAndUpdate(req.tenantStoreId, updates, {
      new: true,
      runValidators: true,
    });

    if (!store) {
      const err = new Error("Store not found");
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({ success: true, store });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/stores
// super_admin only. Platform-wide list, e.g. for an approval queue.
const listAllStores = async (req, res, next) => {
  try {
    const stores = await Store.find().populate("owner", "name email");
    res.status(200).json({ success: true, count: stores.length, stores });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/stores/:storeId/approve
// super_admin only. Toggles isApproved / isActive.
const approveStore = async (req, res, next) => {
  try {
    const { isApproved, isActive } = req.body;
    const updates = {};
    if (isApproved !== undefined) updates.isApproved = isApproved;
    if (isActive !== undefined) updates.isActive = isActive;

    const store = await Store.findByIdAndUpdate(req.params.storeId, updates, {
      new: true,
      runValidators: true,
    });

    if (!store) {
      const err = new Error("Store not found");
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({ success: true, store });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createStore,
  getStoreById,
  updateStore,
  listAllStores,
  approveStore,
};
