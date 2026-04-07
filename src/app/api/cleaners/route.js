// File: src/app/api/cleaners/route.js
import dbConnect from "@/lib/dbConnect";
import Cleaner from "@/models/Cleaner";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

function firstPhotoUrl(photos) {
  if (!Array.isArray(photos)) return "";
  for (const photo of photos) {
    if (typeof photo === "string" && photo.trim()) return photo.trim();
    if (photo && typeof photo.url === "string" && photo.url.trim()) return photo.url.trim();
  }
  return "";
}

function resolveCleanerImage(cleaner = {}) {
  const image = typeof cleaner?.image === "string" ? cleaner.image.trim() : "";
  if (image) return image;

  const legacyProfileImage = typeof cleaner?.profileImage === "string" ? cleaner.profileImage.trim() : "";
  if (legacyProfileImage) return legacyProfileImage;

  const galleryImage = firstPhotoUrl(cleaner?.photos);
  if (galleryImage) return galleryImage;

  return "/default-avatar.png";
}

// 🧠 Compute bookingStatus from nested availability object
function determineBookingStatus(availability = {}) {
  let hasAvailable = false;
  let hasPending = false;

  for (const day in availability) {
    for (const hour in availability[day]) {
      const val = availability[day][hour];
      const status = typeof val === "object" ? val?.status : val;
      if (status === true || status === "available") hasAvailable = true;
      if (status === "pending" || status === "pending_approval") hasPending = true;
    }
  }

  if (hasPending) return "pending";
  if (hasAvailable) return "available";
  return "unavailable";
}

// GET - Fetch cleaner(s)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const postcode = searchParams.get("postcode")?.trim() || "";
  const minRating = parseFloat(searchParams.get("minRating")) || 0;
  const bookingStatus = searchParams.get("bookingStatus") || "all";
  const serviceType = searchParams.get("serviceType")?.trim();

  try {
    // ---- Single cleaner by id (used by some cards)
    if (id) {
      const cleaner = await Cleaner.findById(id).select("-password");

      if (!cleaner) {
        return NextResponse.json({ success: false, message: "Cleaner not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          success: true,
          cleaner: {
            _id: cleaner._id,
            realName: cleaner.realName,
            companyName: cleaner.companyName,
            postcode: cleaner.address?.postcode || cleaner.postcode, // support both
            image: resolveCleanerImage(cleaner),
            rates: cleaner.rates,
            isPremium: !!cleaner.isPremium,
            rating: cleaner.rating || null,
            availability: cleaner.availability || {},
            googleReviewUrl: cleaner.googleReviewUrl || null,
            facebookReviewUrl: cleaner.facebookReviewUrl || null,
            googleReviewRating: cleaner.googleReviewRating || null,
            googleReviewCount: cleaner.googleReviewCount || 0,
            businessInsurance: !!cleaner.businessInsurance,
            insurance: !!cleaner.businessInsurance, // alias for JSX use
            dbsChecked: !!cleaner.dbsChecked,       // ✅ correct variable
          },
        },
        { status: 200 }
      );
    }

    // ---- List cleaners (homepage)
    const query = {};

    // Expanded service area: main postcode or additionalPostcodes
    if (postcode && postcode.length >= 2) {
      query.$or = [
        { "address.postcode": { $regex: postcode, $options: "i" } },
        { additionalPostcodes: { $regex: postcode, $options: "i" } },
      ];
    }

    if (minRating > 0) {
      // use Google review rating field you already store
      query.googleReviewRating = { $gte: minRating };
    }

    if (serviceType) {
      query.services = { $in: [serviceType] };
    }

    const rawCleaners = await Cleaner.find(query)
      .select("-password")
      .sort({ isPremium: -1 });

    const cleaners = rawCleaners
      .map((obj) => {
        try {
          const c = typeof obj.toObject === "function" ? obj.toObject() : JSON.parse(JSON.stringify(obj));
          const bookingStatusDerived = determineBookingStatus(c.availability || {});

          return {
            _id: c._id,
            realName: c.realName,
            companyName: c.companyName,
            postcode: c.address?.postcode || c.postcode,
            image: resolveCleanerImage(c),
            rates: c.rates,
            isPremium: !!c.isPremium,
            rating: c.rating || null,
            availability: c.availability || {},
            googleReviewUrl: c.googleReviewUrl || null,
            facebookReviewUrl: c.facebookReviewUrl || null,
            googleReviewRating: c.googleReviewRating || null,
            googleReviewCount: c.googleReviewCount || 0,
            bookingStatus: bookingStatusDerived,
            businessInsurance: !!c.businessInsurance,
            insurance: !!c.businessInsurance, // alias for JSX use
            dbsChecked: !!c.dbsChecked,       // ✅ correct variable
          };
        } catch (err) {
          console.error("❌ Failed to format cleaner object:", err);
          return null;
        }
      })
      .filter(Boolean);

    const finalFiltered =
      bookingStatus === "all" ? cleaners : cleaners.filter((c) => c.bookingStatus === bookingStatus);

    return NextResponse.json({ success: true, cleaners: finalFiltered }, { status: 200 });
  } catch (err) {
    console.error("❌ GET cleaner error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch cleaner(s)." }, { status: 500 });
  }
}

// POST - Register new cleaner
export async function POST(req) {
  await dbConnect();
  const data = await req.json();

  try {
    const existing = await Cleaner.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already in use." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const cleaner = await Cleaner.create({
      realName: data.realName,
      companyName: data.companyName,
      houseNameNumber: data.houseNameNumber,
      street: data.street,
      county: data.county,
      postcode: data.postcode,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      rates: data.rates,
      availability: data.availability,
      services: data.services,
      businessInsurance: data.businessInsurance,
      googleReviewRating: data.googleReviewRating || null,
      googleReviewCount: data.googleReviewCount || 0,
      googleReviewUrl: data.googleReviewUrl || "",
    });

    return NextResponse.json({ success: true, id: cleaner._id }, { status: 201 });
  } catch (err) {
    console.error("❌ Error creating cleaner:", err);
    return NextResponse.json({ success: false, message: "Failed to create cleaner." }, { status: 500 });
  }
}
