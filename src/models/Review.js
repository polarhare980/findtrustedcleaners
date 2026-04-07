import mongoose, { Schema, models } from 'mongoose';

const ReviewSchema = new Schema(
  {
    cleanerId: { type: Schema.Types.ObjectId, ref: 'Cleaner', index: true, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', index: true, required: true, unique: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, trim: true, maxlength: 1200, default: '' },
    highlights: { type: [String], default: [] },
    wouldBookAgain: { type: Boolean, default: true },
    serviceName: { type: String, trim: true, default: '' },
    appointmentAt: { type: Date, default: null },
    verifiedBooking: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ cleanerId: 1, createdAt: -1 });

export default models.Review || mongoose.model('Review', ReviewSchema);
