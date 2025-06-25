import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  address: String,
  postcode: String,
  phone: String
}, { timestamps: true });

export default mongoose.models.Client || mongoose.model('Client', clientSchema);