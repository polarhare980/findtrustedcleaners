import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  cleanerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cleaner',
    required: true,
  },
  paymentIntentId: {
    type: String,
    required: false, // ✅ Stripe-only
  },
  stripeSessionId: {
    type: String,
    required: false, // ✅ Stripe-only
  },
  day: {
    type: String,
    required: true,
  },
  hour: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
  },
}, { timestamps: true }); // ✅ Adds createdAt, updatedAt

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
