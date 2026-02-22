// File: src/models/Purchase.js
// NOTE: "Purchase" is the single source of truth for bookings/holds.
// It covers:
//  - Pending holds (client has authorised payment, cleaner must accept)
//  - Accepted/declined outcomes
//  - Span-aware blocking (multi-hour jobs)
//  - Stripe references for manual capture/cancel
import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    cleanerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner', required: true, index: true },

    // Stripe refs (manual-capture flow)
    paymentIntentId: { type: String, index: true },
    stripeSessionId: { type: String },

    // Price in pounds (optional)
    amount: { type: Number },
    currency: { type: String, default: 'GBP' },

    // Calendar placement
    day: { type: String, required: true, index: true },
    hour: { type: String, required: true, index: true }, // "7".."19" etc.

    // Span-aware support
    span: { type: Number, default: 1 },
    serviceKey: { type: String },
    serviceName: { type: String },
    durationMins: { type: Number },
    bufferBeforeMins: { type: Number, default: 0 },
    bufferAfterMins: { type: Number, default: 0 },

    // Lifecycle
    // pending: client started flow but not completed payment (legacy)
    // pending_approval: payment authorised; cleaner must accept
    // accepted: cleaner accepted and payment captured
    // declined: cleaner declined and payment cancelled/refunded
    status: {
      type: String,
      enum: ['pending', 'pending_approval', 'approved', 'accepted', 'declined', 'cancelled', 'confirmed', 'booked'],
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