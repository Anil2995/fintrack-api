// seed.js — populates the DB with sample users and financial records for local testing.
// Run with: node seed.js
// WARNING: This will clear existing users and records before inserting fresh data.

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./src/models/User");
const Record   = require("./src/models/Record");

const users = [
  { name: "Anil Kumar",    email: "admin@finance.dev",   password: "admin123",   role: "admin"   },
  { name: "Priya Sharma",  email: "analyst@finance.dev", password: "analyst123", role: "analyst" },
  { name: "Ravi Teja",     email: "viewer@finance.dev",  password: "viewer123",  role: "viewer"  },
];

// Spread across the past 6 months so trends endpoints return real looking data
const buildRecords = (adminId) => {
  const now = new Date();
  const months = (n) => { const d = new Date(now); d.setMonth(d.getMonth() - n); return d; };

  return [
    { amount: 85000, type: "income",  category: "Salary",      date: months(0), notes: "March salary credit",            createdBy: adminId },
    { amount: 3200,  type: "expense", category: "Food",        date: months(0), notes: "Groceries and dining out",        createdBy: adminId },
    { amount: 1800,  type: "expense", category: "Transport",   date: months(0), notes: "Cab and metro recharges",         createdBy: adminId },
    { amount: 12000, type: "expense", category: "Rent",        date: months(0), notes: "Monthly apartment rent",          createdBy: adminId },
    { amount: 85000, type: "income",  category: "Salary",      date: months(1), notes: "February salary",                 createdBy: adminId },
    { amount: 5000,  type: "income",  category: "Freelance",   date: months(1), notes: "UI design contract payment",      createdBy: adminId },
    { amount: 2900,  type: "expense", category: "Food",        date: months(1), notes: "Groceries",                       createdBy: adminId },
    { amount: 12000, type: "expense", category: "Rent",        date: months(1), notes: "February rent",                   createdBy: adminId },
    { amount: 85000, type: "income",  category: "Salary",      date: months(2), notes: "January salary",                  createdBy: adminId },
    { amount: 4500,  type: "expense", category: "Utilities",   date: months(2), notes: "Electricity and internet bills",  createdBy: adminId },
    { amount: 6000,  type: "income",  category: "Freelance",   date: months(2), notes: "Backend consulting",              createdBy: adminId },
    { amount: 12000, type: "expense", category: "Rent",        date: months(2), notes: "January rent",                    createdBy: adminId },
    { amount: 85000, type: "income",  category: "Salary",      date: months(3), notes: "December salary",                 createdBy: adminId },
    { amount: 15000, type: "expense", category: "Shopping",    date: months(3), notes: "Year-end shopping",               createdBy: adminId },
    { amount: 3500,  type: "expense", category: "Food",        date: months(3), notes: "Holiday dining",                  createdBy: adminId },
    { amount: 20000, type: "income",  category: "Bonus",       date: months(3), notes: "Annual performance bonus",        createdBy: adminId },
    { amount: 85000, type: "income",  category: "Salary",      date: months(4), notes: "November salary",                 createdBy: adminId },
    { amount: 8000,  type: "expense", category: "Medical",     date: months(4), notes: "Hospital checkup and medicines",  createdBy: adminId },
    { amount: 12000, type: "expense", category: "Rent",        date: months(4), notes: "November rent",                   createdBy: adminId },
    { amount: 85000, type: "income",  category: "Salary",      date: months(5), notes: "October salary",                  createdBy: adminId },
    { amount: 3000,  type: "expense", category: "Transport",   date: months(5), notes: "Flight tickets",                  createdBy: adminId },
    { amount: 12000, type: "expense", category: "Rent",        date: months(5), notes: "October rent",                    createdBy: adminId },
  ];
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clean slate — remove old seed data
    await User.deleteMany({});
    await Record.deleteMany({});
    console.log("Cleared existing data");

    // Hash passwords manually here since we're using insertMany which skips pre-save hooks
    const hashed = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 12),
      }))
    );

    const created = await User.insertMany(hashed);
    console.log(`Created ${created.length} users`);

    const admin = created.find(u => u.role === "admin");
    const records = buildRecords(admin._id);
    await Record.insertMany(records);
    console.log(`Created ${records.length} financial records`);

    console.log("\n✅ Seed complete. Test accounts:");
    console.log("   admin@finance.dev   / admin123   (role: admin)");
    console.log("   analyst@finance.dev / analyst123 (role: analyst)");
    console.log("   viewer@finance.dev  / viewer123  (role: viewer)");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
