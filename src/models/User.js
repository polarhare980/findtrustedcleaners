import mongoose, { Schema, models } from 'mongoose';
const UserSchema = new Schema({
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  type: { type: String, enum: ['client','cleaner','admin'], default: 'client' },
  linkedId: { type: Schema.Types.ObjectId },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationExpires: Date,
  resetToken: String,
  resetExpires: Date
}, { timestamps: true });
export default models.User || mongoose.model('User', UserSchema);
