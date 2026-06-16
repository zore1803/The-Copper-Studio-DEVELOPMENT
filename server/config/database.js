import mongoose from "mongoose";

async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI missing");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);

  console.log("MongoDB connected");
}

export { connectDatabase };