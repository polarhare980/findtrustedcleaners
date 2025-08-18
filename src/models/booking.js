// File: src/models/booking.js
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    cleanerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner', required: true },
    clientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Client',  required: true },

    // Calendar placement
    day:  { type: String, required: true },   // e.g. "Monday"
    hour: { type: String, required: true },   // "7".."19" (stringified hour)
    date: { type: Date },                     // optional absolute timestamp used for sorting

    // Status lifecycle (covering all values used in routes/UI)
    status: {
      type: String,
      enum: ['pending', 'approved', 'accepted', 'confirmed', 'booked', 'declined', 'cancelled'],
      default: 'pending',
    },

    // Payments / price
    amount: { type: Number },                 // optional job price

    // (Optional) span-aware fields so longer jobs can be supported later
    serviceKey:       { type: String },
    durationMins:     { type: Number },       // e.g. 60, 90, 120
    bufferBeforeMins: { type: Number },
    bufferAfterMins:  { type: Number },

    // (Optional) Stripe refs if you ever store them here
    paymentIntentId:  { type: String },
    stripeSessionId:  { type: String },
  },
  { timestamps: true }
);

// IMPORTANT: model name is "Booking"; keep imports consistent with the FILE name:
//   import Booking from '@/models/booking'   // <-- lowercase path to match filename
export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
