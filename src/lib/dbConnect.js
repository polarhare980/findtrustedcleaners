import mongoose from 'mongoose';

let isConnected = false;

export default async function dbConnect() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || 'cleanmatch', // ✅ force correct DB
    });

    isConnected = mongoose.connection.readyState === 1;
    console.log("✅ MongoDB connected to", mongoose.connection.name);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}
