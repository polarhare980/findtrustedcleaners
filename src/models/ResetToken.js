import mongoose from 'mongoose';

const ResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  userType: { type: String, enum: ['cleaner', 'client'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ResetToken || mongoose.model('ResetToken', ResetTokenSchema);
