import mongoose from 'mongoose';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Stripe details (kept optional; supports both PI + Checkout Session)
const StripeSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String },
    checkoutSessionId: { type: String }, // (a.k.a. stripeSessionId)
    customerId: { type: String },
    clientSecret: { type: String },
    // add more as needed (chargeId, etc.)
  },
  { _id: false }
);

/**
 * Purchase
 * --------
 * Represents a client’s booking request that starts at {day, hour}
 * and blocks `span` consecutive 1-hour cells.
 */
const PurchaseSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    cleanerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cleaner',
      required: true,
      index: true,
    },

    // Start time on your 1-hour grid
    day: {
      type: String,
      enum: DAYS,
      required: true,
      index: true,
    },
    hour: {
      type: Number, // 24h start hour, e.g. 9 for 09:00–10:00
      min: 0,
      max: 23,
      required: true,
      index: true,
    },

    // How many 1-hour cells are blocked (duration + buffers, rounded up)
    span: {
      type: Number,
      min: 1,
      required: true,
      default: 1,
    },

    // Service snapshot (so records stay meaningful if cleaner later edits services)
    serviceKey: { type: String, required: true }, // e.g. 'car_detailing'
    serviceName: { type: String },                // optional label
    durationMins: { type: Number, required: true },
    bufferBeforeMins: { type: Number, default: 0 },
    bufferAfterMins: { type: Number, default: 0 },

    // Money (keep your current semantics: amount stored in pounds)
    currency: { type: String, default: 'GBP' },
    amount: { type: Number }, // pounds; if you switch to minor units later, rename or add amountMinor

    // Lifecycle
    status: {
      type: String,
      // include both old and new values for compatibility
      enum: [
        'pending_approval', // your current default
        'pending',          // legacy UI checks
        'accepted',         // preferred name going forward
        'confirmed',        // alias some code may still use
        'declined',
        'cancelled',
        'refunded',
      ],
      default: 'pending_approval',
      index: true,
    },

    // Stripe details (new structured field)
    stripe: { type: StripeSchema, default: () => ({}) },

    // Legacy Stripe fields (kept so old code doesn’t break)
    paymentIntentId: { type: String },
    stripeSessionId: { type: String }, // equals stripe.checkoutSessionId

    // Optional notes
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ------------ Virtuals & Indexes ------------ */

// End hour (not persisted)
PurchaseSchema.virtual('endHour').get(function () {
  return (this.hour || 0) + (this.span || 1);
});

// Helpful compound indexes
PurchaseSchema.index({ cleanerId: 1, day: 1, hour: 1, status: 1 });
PurchaseSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
