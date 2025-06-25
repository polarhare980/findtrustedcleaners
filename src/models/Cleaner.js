import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({}, { strict: false });

const cleanerSchema = new mongoose.Schema({
  realName: String,
  companyName: String,
  postcode: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  rates: Number, 
  availability: Object, 
  services: [String],
  image: String,
  allowPending: Boolean,

  // ✅ New fields for reviews and embeds
  googleReviewUrl: { type: String, default: '' },
  facebookReviewUrl: { type: String, default: '' },
  embedCode: { type: String, default: '' },

  // ✅ New field for premium status
  premium: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
