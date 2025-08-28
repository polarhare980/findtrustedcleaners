// File: src/models/Cleaner.js
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

    // Structured services with durations/buffers
    servicesDetailed: { type: [ServiceSchema], default: [] },

    bio: {
      type: String,
      maxlength: 1000,
      default: '',
    },

    /**
     * Base weekly pattern (Mon–Sun, hour "7".."19") used as the fallback.
     * Values: true | false | 'unavailable'
     * Do NOT persist pending/accepted here.
     *
     * Example:
     * { Monday: { "7": true, "8": false, ... }, Tuesday: { ... }, ... }
     */
    availability: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /**
     * NEW: Date-specific overrides keyed by ISO date (YYYY-MM-DD).
     * Each value is an object of hour -> true | false | 'unavailable'
     * Only store cells that differ from the weekly pattern for that date.
     *
     * Example:
     * {
     *   "2025-08-25": { "9": true, "10": true, "11": "unavailable" },
     *   "2025-08-26": { "14": false }
     * }
     */
    availabilityOverrides: {
      type: Map, // Map<string, Mixed>
      of: mongoose.Schema.Types.Mixed,
      default: undefined, // omitted if empty (keeps docs lean)
    },

    // Premium Status + dial for how far ahead premium can set (in weeks, beyond current)
    isPremium: { type: Boolean, default: false },
    premiumWeeksAhead: { type: Number, default: 3 }, // 0 = this week only; 3 = +3 => total 4

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
