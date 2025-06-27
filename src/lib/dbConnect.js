import mongoose from 'mongoose';

let isConnected = false;

export default async function dbConnect() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  try {
    // ✅ Recommended for Mongoose v7+ to suppress strict query warnings
    mongoose.set('strictQuery', false);

    // ✅ Clean connection without deprecated options
    await mongoose.connect(uri);

    isConnected = mongoose.connection.readyState === 1;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}
