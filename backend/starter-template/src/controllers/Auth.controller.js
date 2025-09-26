import axios from "axios";
import User from "../models/User.js";

// Controller for phone-call registration
export const registerPhoneUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      age,
      gender,
      bloodType,
      organDonation,
      anomalies,
      pincode,
      pin
    } = req.body;

    // Check mandatory fields
    if (!name || !phone || !age || !gender || !bloodType || !pincode || !pin) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Call OpenStreetMap Nominatim API to get coordinates from pincode
    const osmResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        postalcode: pincode,
        country: "India",
        format: "json",
        limit: 1
      },
      headers: { "User-Agent": "CommunityDonationApp/1.0" } // required by OSM
    });

    if (!osmResponse.data || osmResponse.data.length === 0) {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    const { lat, lon } = osmResponse.data[0];

    // Create new user
    const newUser = new User({
      name,
      phone,
      age,
      gender,
      bloodType,
      organDonation,
      anomalies,
      pincode,
      pin,
      location: {
        type: "Point",
        coordinates: [parseFloat(lon), parseFloat(lat)]
      },
      isVerifiedDonor: false,
      availabilityStatus: "unavailable"
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully", userId: newUser._id });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: "Phone number or email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};
