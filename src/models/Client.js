import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Address schema to structure the address fields
const addressSchema = new mongoose.Schema({
  houseNameNumber: { type: String, required: true },
  street: { type: String, required: true },
  county: { type: String, required: true },
  postcode: { type: String, required: true },
});

const clientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: addressSchema, required: true },
}, { timestamps: true });

// Hash the password before saving it to the database
clientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash if password is modified
  this.password = await bcrypt.hash(this.password, 10); // Hash password with bcrypt
  next();
});

// Method to compare entered password with the stored hashed password
clientSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password); // Compare hashed password
};

export default mongoose.models.Client || mongoose.model('Client', clientSchema);
