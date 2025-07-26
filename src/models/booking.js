import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  cleanerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cleaner', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  day: { type: String, required: true },
  time: { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'], // Use 'accepted' for confirmed earnings
    default: 'pending',
  },

  amount: { type: Number, required: true }, // 💰 job price
}, {
  timestamps: true,
});

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
