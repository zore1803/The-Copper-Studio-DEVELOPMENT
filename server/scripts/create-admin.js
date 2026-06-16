import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["client", "admin"], default: "client", required: true },
    profile: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, default: "active" },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdminUser() {
  const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI ?? "";
  
  if (!mongoUri) {
    console.error("MONGODB_URI is missing from environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const adminEmail = "chaitya.doshi@somaiya.edu";
    const adminPassword = "Admin123!";

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      console.log(`Admin user already exists with email: ${adminEmail}`);
      console.log("User details:", {
        email: existingUser.email,
        role: existingUser.role,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        status: existingUser.status,
      });
      await mongoose.disconnect();
      return;
    }

    // Hash the password using bcrypt (same as login system)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create the admin user
    const adminUser = await User.create({
      email: adminEmail,
      passwordHash: passwordHash,
      firstName: "Chaitya",
      lastName: "Doshi",
      role: "admin",
      status: "active",
      profile: {},
    });

    console.log("Admin user created successfully:");
    console.log({
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role,
      status: adminUser.status,
      createdAt: adminUser.createdAt,
    });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error creating admin user:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdminUser();
