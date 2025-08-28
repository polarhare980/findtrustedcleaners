import mongoose from 'mongoose';

const ResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

export default mongoose.models.ResetToken || mongoose.model('ResetToken', ResetTokenSchema);
