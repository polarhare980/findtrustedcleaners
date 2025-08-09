// File: /models/Client.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  houseNameNumber: { type: String, required: true },
  street: { type: String, required: true },
  county: { type: String, required: true },
  postcode: {
    type: String,
    required: true,
    match: /^[A-Za-z0-9\s]{5,10}$/, // basic postcode validation
  },
});

const clientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone:    { type: String, required: true },
    address:  { type: addressSchema, required: true },

    // Store as "favorites" in Mongo, but allow UK spelling "favourites" in code.
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cleaner',
      default: [],
      alias: 'favourites', // you can use doc.favourites and it maps to "favorites"
    }],
  },
  { timestamps: true }
);

// Hash password before save
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
  return bcrypt.compare(password, this.password);
};

// Convenience helpers for favourites
clientSchema.methods.hasFavourite = function(cleanerId) {
  const id = String(cleanerId);
  return Array.isArray(this.favorites) && this.favorites.some(x => String(x) === id);
};

clientSchema.methods.toggleFavourite = function(cleanerId) {
  const id = String(cleanerId);
  if (!Array.isArray(this.favorites)) this.favorites = [];
  const idx = this.favorites.findIndex(x => String(x) === id);
  if (idx === -1) this.favorites.push(cleanerId);
  else this.favorites.splice(idx, 1);
  return this.favorites.map(x => String(x));
};

export default mongoose.models.Client || mongoose.model('Client', clientSchema);
