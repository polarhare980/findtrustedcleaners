import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ✅ Flexible per-hour availability schema
const availabilitySchema = new mongoose.Schema({}, { strict: false, _id: false });

const cleanerSchema = new mongoose.Schema({
  realName: { type: String },
  companyName: { type: String },
  houseNameNumber: { type: String },
  street: { type: String },
  county: { type: String },
  postcode: { type: String },
  email: {
    type: String,
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    match: [/^(?:0(?:7\d{9}|[123]\d{8,9}))$/, 'Please enter a valid UK mobile or landline number'],
  },
  password: { type: String },
  rates: { type: Number },

  // ✅ Updated availability
  availability: availabilitySchema,

  services: { type: [String] },
  image: { type: String },
  allowPending: { type: Boolean, default: false },
  googleReviewUrl: { type: String, default: '' },
  facebookReviewUrl: { type: String, default: '' },
  embedCode: { type: String, default: '' },
  premium: { type: Boolean, default: false },
  businessInsurance: { type: Boolean, default: false },
}, { timestamps: true });

// 🔐 Password hashing before saving
cleanerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔍 Password comparison
cleanerSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// 📌 Useful indexes
cleanerSchema.index({ phone: 1 });
cleanerSchema.index({ services: 1 });

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
