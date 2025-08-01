import mongoose from 'mongoose';

const cleanerSchema = new mongoose.Schema({
  realName: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  rates: { type: Number, required: true },
  services: [String],

bio: {
  type: String,
  maxlength: 1000,
  default: '',
},


  availability: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  businessInsurance: { type: Boolean, default: false },

  image: { type: String },

  // ✅ Blur flag for profile image
  imageHasText: { type: Boolean, default: false },

  address: {
    houseNameNumber: { type: String },
    street: { type: String },
    county: { type: String },
    postcode: { type: String },
  },

  // ✅ Premium Status
  isPremium: { type: Boolean, default: false },

  // ✅ Google Review Fields
  googleReviewUrl: { type: String },
  googleReviewRating: { type: Number },
  googleReviewCount: { type: Number },

  // ✅ Analytics Fields
  views: { type: Number, default: 0 },
  profileUnlocks: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  rating: { type: Number },

  // ✅ Premium Media Uploads
  photos: {
    type: [
      {
        url: String,
        public_id: String,
        hasText: { type: Boolean, default: false },
      },
    ],
    default: [],
  },

  videoUrl: { type: String }, // Optional intro video

  // ✅ NEW: Additional service coverage
  additionalPostcodes: {
    type: [String],
    default: [],
  },

}, {
  timestamps: true,
});

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
