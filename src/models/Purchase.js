import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  cleanerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner', required: true },
  paymentIntentId: { type: String, required: true }, // 👈 needed for Stripe capture
  day: { type: String, required: true },             // 👈 store which day
  hour: { type: String, required: true },            // 👈 store which hour
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  purchasedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
