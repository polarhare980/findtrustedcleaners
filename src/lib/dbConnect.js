import mongoose from 'mongoose';

let isConnected = false;

export default async function dbConnect() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  try {
    await mongoose.connect(uri); // ✅ No need for extra options

    isConnected = mongoose.connection.readyState === 1;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}
