import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Address schema to structure the address fields
const addressSchema = new mongoose.Schema({
  houseNameNumber: { type: String, required: true },
  street: { type: String, required: true },
  county: { type: String, required: true },
  postcode: { 
    type: String, 
    required: true,
    match: /^[A-Za-z0-9\s]{5,10}$/  // Basic validation for postcode
  },
});

// Client schema
const clientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: addressSchema, required: true },

  // ✅ Add this line to store favorite cleaners
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner' }],

}, { timestamps: true });

// Hash the password before saving it to the database
clientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed password
clientSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.Client || mongoose.model('Client', clientSchema);
