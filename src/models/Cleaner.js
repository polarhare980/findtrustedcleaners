import mongoose from 'mongoose';

const cleanerSchema = new mongoose.Schema({
  realName: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  rates: { type: Number, required: true },
  services: [String],
  availability: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  businessInsurance: { type: Boolean, default: false },
  image: { type: String },
  address: {
    houseNameNumber: { type: String },
    street: { type: String },
    county: { type: String },
    postcode: { type: String },
  },
  isPremium: { type: Boolean, default: false }, // ✅ Required for Stripe upgrade

  // ✅ NEW: Google Review Fields
  googleReviewUrl: { type: String },
  googleReviewRating: { type: Number },
  googleReviewCount: { type: Number },
}, {
  timestamps: true,
});

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
