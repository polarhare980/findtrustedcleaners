import mongoose from 'mongoose';

/* ---------- Subschemas ---------- */

const ServiceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },          // e.g. 'domestic_cleaning', 'car_detailing'
    name: { type: String, required: true },         // human label
    active: { type: Boolean, default: true },

    // Duration config (minutes)
    defaultDurationMins: { type: Number, default: 60, min: 15 },
    minDurationMins: { type: Number, default: 60, min: 15 },
    maxDurationMins: { type: Number, default: 240, min: 15 },

    // Granularity (keep 60 for 1h grid; 15/30 optional later)
    incrementMins: { type: Number, default: 60, enum: [15, 30, 60] },

    // Turnover/setup buffers (minutes)
    bufferBeforeMins: { type: Number, default: 0, min: 0 },
    bufferAfterMins: { type: Number, default: 0, min: 0 },

    // Optional pricing
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

/* ---------- Main schema ---------- */

const cleanerSchema = new mongoose.Schema(
  {
    realName: { type: String, required: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    rates: { type: Number, required: true },

    // Flat tags (keep for filters)
    services: { type: [String], default: [] },

    // NEW: structured services with durations/buffers (span-aware bookings)
    servicesDetailed: { type: [ServiceSchema], default: [] },

    bio: {
      type: String,
      maxlength: 1000,
      default: '',
    },

    // Availability grid (7–19 by 1h cells). Values: true | false | 'unavailable'
    // (Pending/accepted are injected from purchases; don’t persist them here.)
    availability: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    businessInsurance: { type: Boolean, default: false },
    dbsChecked: { type: Boolean, default: false },

    image: { type: String },
    imageHasText: { type: Boolean, default: false },

    address: {
      houseNameNumber: { type: String, default: '' },
      street: { type: String, default: '' },
      county: { type: String, default: '' },
      postcode: { type: String, default: '' },
    },

    // Premium Status
    isPremium: { type: Boolean, default: false },

    // Legacy Google review fields (kept for compatibility)
    googleReviewUrl: { type: String },
    googleReviewRating: { type: Number },
    googleReviewCount: { type: Number },

    // Analytics
    views: { type: Number, default: 0 },
    profileUnlocks: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    rating: { type: Number },

    // Premium Media Uploads
    photos: { type: [PhotoSchema], default: [] },

    videoUrl: { type: String }, // Optional intro video

    // Additional service coverage
    additionalPostcodes: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ---------- Virtuals / Indexes ---------- */

// Public-friendly virtual to keep API stable: { rating, count, url }
cleanerSchema.virtual('googleReviews').get(function () {
  return {
    rating: typeof this.googleReviewRating === 'number' ? this.googleReviewRating : null,
    count: typeof this.googleReviewCount === 'number' ? this.googleReviewCount : null,
    url: this.googleReviewUrl || '',
  };
});

// Helpful text index for search
cleanerSchema.index({ companyName: 'text', realName: 'text', 'address.postcode': 1 });

export default mongoose.models.Cleaner || mongoose.model('Cleaner', cleanerSchema);
