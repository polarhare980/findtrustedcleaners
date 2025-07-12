import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  cleanerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner', required: true },
  purchasedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);

