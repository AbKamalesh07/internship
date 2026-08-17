// Simple health check so we have something real to test once the
// server boots — proves DB connection + server wiring both work.
const mongoose = require("mongoose");

const getHealth = (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.status(200).json({
    success: true,
    message: "API is running",
    db: dbStates[mongoose.connection.readyState],
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
