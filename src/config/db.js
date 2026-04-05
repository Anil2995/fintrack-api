const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // Nothing works without a DB, so just exit rather than running in a broken state
    console.error(`DB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
