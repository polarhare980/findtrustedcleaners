import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Flexible availability schema
const availabilitySchema = new mongoose.Schema({
  monday: { type: Boolean, default: false },
  tuesday: { type: Boolean, default: false },
  // Add more days if needed
}, { _id: false });

const cleanerSchema = new mongoose.Schema({
  realName: { type: String, required: true },
  companyName: { type: String, required: true },
  houseNameNumber: { type: String, required: true },
  street: { type: String, required: true },
  county: { type: String, required: true },
  postcode: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    required: true,
    match: [/^(?:0(?:7\d{9}|[123]\d{8,9}))$/, 'Please enter a valid UK mobile or landline number'],
  },
  password: { type: String, required: true },
  rates: { type: Number, required: true },
  availability: availabilitySchema, // Flexible availability schema
  services: { type: [String], required: true },
  image: { type: String },
  allowPending: { type: Boolean, default: false },
  googleReviewUrl: { type: String, default: '' },
  facebookReviewUrl: { type: String, default: '' },
  embedCode: { type: String, default: '' },
  premium: { type: Boolean, default: false },
  businessInsurance: { type: Boolean, default: false },
}, { timestamps: true });

// Password hashing before save
cleanerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password comparison method
cleanerSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Indexes for efficient queries
cleanerSchema.index({ phone: 1 });
cleanerSchema.index({ services: 1 });

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
