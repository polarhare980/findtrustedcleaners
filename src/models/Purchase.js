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
    required: false,
  },
  stripeSessionId: {
    type: String,
    required: false,
  },
  amount: {
    type: Number, // in pounds
    required: false,
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
    enum: ['pending_approval', 'confirmed', 'declined'], // aligned with webhook
    default: 'pending_approval',
  },
}, { timestamps: true });

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
