import mongoose, { Schema, models } from 'mongoose';
const SubscriberSchema = new Schema({ email: { type: String, unique: true, index: true }, verified: { type: Boolean, default: false }, verifyToken: String, verifyExpires: Date, unsubscribed: { type: Boolean, default: false }, unsubToken: String }, { timestamps: true });
export default models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
