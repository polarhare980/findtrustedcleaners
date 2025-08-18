// src/models/Purchase.js
import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema(
  {
    clientId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client',  required: true, index: true },
    cleanerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner', required: true, index: true },

    // Optional Stripe fields (kept for compatibility)
    paymentIntentId: { type: String },
    stripeSessionId: { type: String },

    amount:          { type: Number }, // pounds (optional)

    day:             { type: String, required: true, index: true },
    hour:            { type: String, required: true, index: true }, // <-- string, not number

    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

// Helpful compound indexes
PurchaseSchema.index({ cleanerId: 1, day: 1, hour: 1, status: 1 });
PurchaseSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
