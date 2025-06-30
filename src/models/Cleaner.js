import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Availability schema remains flexible
const availabilitySchema = new mongoose.Schema({}, { strict: false });

const cleanerSchema = new mongoose.Schema({
  realName: { type: String, required: true },
  companyName: { type: String, required: true },
  houseNameNumber: { type: String, required: true },
  street: { type: String, required: true },
  county: { type: String, required: true },
  postcode: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  rates: { type: Number, required: true },
  availability: availabilitySchema, // Availability schema, flexible
  services: { type: [String], required: true },
  image: { type: String },
  allowPending: { type: Boolean, default: false },
  googleReviewUrl: { type: String, default: '' },
  facebookReviewUrl: { type: String, default: '' },
  embedCode: { type: String, default: '' },
  premium: { type: Boolean, default: false },
  businessInsurance: { type: Boolean, default: false }, // Business insurance status
}, { timestamps: true });

// Hash the password before saving it to the database
cleanerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash if password is modified
  this.password = await bcrypt.hash(this.password, 10); // Hash password with bcrypt
  next();
});

// Method to compare entered password with the stored hashed password
cleanerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password); // Compare hashed password
};

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
