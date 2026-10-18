import "dotenv/config";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

const createAdmin = async () => {
  try {
    await connectDB();

    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      console.error("❌ Admin details .env me missing hain");
      process.exit(1);
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists:", email);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      name,
      email,
      passwordHash,
      role: "superadmin",
      isActive: true,
    });

    console.log("=================================");
    console.log("✅ ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("=================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Admin creation failed:");
    console.error(error);
    process.exit(1);
  }
};

createAdmin();