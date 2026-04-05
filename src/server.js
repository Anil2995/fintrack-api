require("dotenv").config();

const app       = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// I deliberately boot the DB first and only start listening after it's up.
// Starting Express before Mongo is connected causes early requests to fail silently
// and those bugs are annoying to track down.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running → http://localhost:${PORT}`);
  });
});
