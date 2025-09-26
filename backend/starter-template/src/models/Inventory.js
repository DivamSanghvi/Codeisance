import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      unique: true, // one inventory per hospital
    },

    items: [
      {
        type: {
          type: String,
          enum: ["BLOOD", "ORGAN"],
          required: true,
        },
        bloodType: {
          type: String,
          enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
          required: function () {
            return this.type === "BLOOD";
          },
        },
        organType: {
          type: String,
          enum: [
            "Kidney",
            "Liver",
            "Heart",
            "Lungs",
            "Pancreas",
            "Cornea",
            "Bone Marrow",
            "Other",
          ],
          required: function () {
            return this.type === "ORGAN";
          },
        },
        quantity: { type: Number, required: true, min: 1 },
        donatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
        receivedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        status: {
          type: String,
          enum: ["AVAILABLE", "USED", "EXPIRED"],
          default: "AVAILABLE",
        },
      },
    ],

    // For dashboard
    dailyUsage: [
      {
        date: { type: Date, default: Date.now },
        itemsUsed: [
          {
            itemIndex: { type: Number }, // index in items array
            quantity: { type: Number, default: 1 },
          },
        ],
      },
    ],

    stockStatus: [
      {
        type: String, // BLOOD / ORGAN
        bloodType: String,
        organType: String,
        availableQuantity: Number,
      },
    ],
  },
  { timestamps: true }
);

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
