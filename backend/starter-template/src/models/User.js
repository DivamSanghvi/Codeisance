import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },

  // Optional for web/app users
  email: { type: String, unique: true, sparse: true },
  password: { type: String }, // alphanumeric for web/app
  pin: { type: Number, min: 1000, max: 999999 }, // numeric PIN for phone-call users

  age: { type: Number, required: true, min: 18, max: 65 },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true },

  organDonation: {
    type: [String],
    enum: ["Kidney", "Liver", "Heart", "Lungs", "Pancreas", "Cornea", "Bone Marrow", "Other"],
    default: [],
  },
  anomalies: { type: String, default: "" },

  pincode: { type: String, required: true },

  // location resolved via OpenStreetMap
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] }, // [lng, lat] from OSM
  },

  isVerifiedDonor: { type: Boolean, default: false },
  availabilityStatus: { type: String, enum: ["available", "unavailable"], default: "unavailable" },
  lastDonationAt: {
    type: Date,
    default: null
  },
  lastPingedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Ensure at least password or pin exists
userSchema.pre("validate", function(next) {
  if (!this.password && !this.pin) {
    next(new Error("Either password or PIN must be provided"));
  } else {
    next();
  }
});

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);
export default User;
