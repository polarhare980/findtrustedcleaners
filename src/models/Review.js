import mongoose, { Schema, models } from 'mongoose';
const ReviewSchema = new Schema({ cleanerId: { type: Schema.Types.ObjectId, ref: 'Cleaner', index:true }, clientId: { type: Schema.Types.ObjectId, ref: 'Client' }, purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase' }, rating: { type: Number, min:1, max:5 }, text: String }, { timestamps: true });
export default models.Review || mongoose.model('Review', ReviewSchema);
