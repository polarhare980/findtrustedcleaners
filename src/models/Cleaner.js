import mongoose from 'mongoose';

/* ---------- Subschemas ---------- */

const ServiceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },

    // Simplified service config
    defaultDurationMins: { type: Number, default: 60, min: 15 },
    price: { type: Number, min: 0 },

    // Legacy fields kept for backwards compatibility
    minDurationMins: { type: Number, default: 60, min: 15 },
    maxDurationMins: { type: Number, default: 240, min: 15 },
    incrementMins: { type: Number, default: 60, enum: [15, 30, 60] },
    bufferBeforeMins: { type: Number, default: 0, min: 0 },
    bufferAfterMins: { type: Number, default: 0, min: 0 },
    basePrice: { type: Number, min: 0 },
    pricePerHour: { type: Number, min: 0 },
  },
  { _id: false }
);

const PhotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String },
    hasText: { type: Boolean, default: false },
  },
  { _id: false }
);

const cleanerSchema = new mongoose.Schema(
  {
    realName: { type: String, required: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    // Optional hourly rate for hourly-based cleaners only
    rates: { type: Number, required: false, default: undefined },

    services: { type: [String], default: [] },
    servicesDetailed: { type: [ServiceSchema], default: [] },

    bio: {
      type: String,
      maxlength: 1000,
      default: '',
    },

    availability: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    availabilityOverrides: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    isPremium: { type: Boolean, default: false },
    premiumWeeksAhead: { type: Number, default: 3 },

    businessInsurance: { type: Boolean, default: false },
    dbsChecked: { type: Boolean, default: false },

    image: { type: String },
    imageHasText: { type: Boolean, default: false },

    address: {
      houseNameNumber: { type: String, default: '' },
      street: { type: String, default: '' },
      town: { type: String, default: '' },
      county: { type: String, default: '' },
      postcode: { type: String, default: '' },
    },

    googleReviewUrl: { type: String },
    googleReviewRating: { type: Number },
    googleReviewCount: { type: Number },

    views: { type: Number, default: 0 },
    profileUnlocks: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    rating: { type: Number },

    photos: { type: [PhotoSchema], default: [] },
    videoUrl: { type: String },

    additionalPostcodes: { type: [String], default: [] },

    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    premiumSince: { type: Date },
    premiumEndedAt: { type: Date },

    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cleanerSchema.virtual('googleReviews').get(function () {
  return {
    rating: typeof this.googleReviewRating === 'number' ? this.googleReviewRating : null,
    count: typeof this.googleReviewCount === 'number' ? this.googleReviewCount : null,
    url: this.googleReviewUrl || '',
  };
});

cleanerSchema.index({
  companyName: 'text',
  realName: 'text',
  'address.town': 'text',
  'address.postcode': 1,
  'address.county': 1,
});

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
