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
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
    guestName: { type: String, trim: true },
    guestEmail: { type: String, trim: true, lowercase: true },
    guestPhone: { type: String, trim: true },
    serviceAddress: { type: String, trim: true },
    cleanerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner', required: true, index: true },

    // Stripe refs (manual-capture flow)
    paymentIntentId: { type: String, index: true },
    stripeSessionId: { type: String },
    // Checkout Session created for the client (used for idempotence / debugging)
    checkoutSessionId: { type: String },
    // Amount charged in pence (optional, but useful for audits)
    amountPence: { type: Number },

    // Price in pounds (optional)
    amount: { type: Number },
    currency: { type: String, default: 'GBP' },

    // Calendar placement
    day: { type: String, required: true, index: true },
    hour: { type: String, required: true, index: true }, // "7".."19" etc.

    // Optional: explicit ISO date (YYYY-MM-DD) if/when you move to date-based booking
    isoDate: { type: String },

    // Span-aware support
    span: { type: Number, default: 1 },
    serviceKey: { type: String },
    serviceName: { type: String },
    durationMins: { type: Number },
    bufferBeforeMins: { type: Number, default: 0 },
    bufferAfterMins: { type: Number, default: 0 },

    // Optional client notes
    notes: { type: String },

    // Lifecycle
    // pending: client started flow but not completed payment (legacy)
    // pending_approval: payment authorised; cleaner must accept
    // accepted: cleaner accepted and payment captured
    // declined: cleaner declined and payment cancelled/refunded
    status: {
      type: String,
      enum: ['pending', 'pending_approval', 'approved', 'accepted', 'declined', 'cancelled', 'confirmed', 'booked', 'failed'],
      default: 'pending',
      index: true,
    },
    appointmentAt: { type: Date, default: null, index: true },
    cleanerReminderSentAt: { type: Date, default: null },
    clientReminderSentAt: { type: Date, default: null },
    reviewToken: { type: String, unique: true, sparse: true, index: true },
    reviewTokenCreatedAt: { type: Date, default: null },
    reviewRequestSentAt: { type: Date, default: null },
    reviewSubmittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// Helpful compound indexes
PurchaseSchema.index({ cleanerId: 1, day: 1, hour: 1, status: 1 });
PurchaseSchema.index({ clientId: 1, createdAt: -1 });
PurchaseSchema.index({ appointmentAt: 1, status: 1 });
PurchaseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);