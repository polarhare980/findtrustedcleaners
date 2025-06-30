import mongoose from 'mongoose';

// Availability schema remains flexible
const availabilitySchema = new mongoose.Schema({}, { strict: false });

const cleanerSchema = new mongoose.Schema({
  realName: String,
  companyName: String,
  houseNameNumber: String,  // New field
  street: String,           // New field
  county: String,           // New field
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

  // ✅ New field for business insurance
  businessInsurance: { type: Boolean, default: false }, // New field for business insurance

}, { timestamps: true });

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
