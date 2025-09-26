import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";

// Helper to geocode a single pincode via OSM
async function geocodePincodeToPoint(pincode) {
  const osmResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      postalcode: pincode,
      country: "India",
      format: "json",
      limit: 1
    },
    headers: { "User-Agent": "CommunityDonationApp/1.0" }
  });

  if (!osmResponse.data || osmResponse.data.length === 0) {
    throw new Error("Invalid pincode");
  }
  const { lat, lon } = osmResponse.data[0];
  return {
    type: "Point",
    coordinates: [parseFloat(lon), parseFloat(lat)]
  };
}

// Helper to sign a lightweight JWT for demo/conditional rendering
function signBasicToken(payload) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

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

    const token = signBasicToken({
      kind: "user",
      userId: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email || null,
      bloodType: newUser.bloodType,
      isVerifiedDonor: newUser.isVerifiedDonor,
      availabilityStatus: newUser.availabilityStatus
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser._id, token });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: "Phone number or email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};


// Controller for website/app registration
export const registerWebUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      age,
      gender,
      bloodType,
      organDonation,
      anomalies,
      pincode
    } = req.body;

    // Check mandatory fields
    if (!name || !phone || !email || !password || !age || !gender || !bloodType || !pincode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Geocode
    let location;
    try {
      location = await geocodePincodeToPoint(pincode);
    } catch (e) {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    // Create new user
    const newUser = new User({
      name,
      phone,
      email,
      password, // ideally hash before saving
      age,
      gender,
      bloodType,
      organDonation,
      anomalies,
      pincode,
      location,
      isVerifiedDonor: false,
      availabilityStatus: "unavailable"
    });

    await newUser.save();

    const token = signBasicToken({
      kind: "user",
      userId: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email || null,
      bloodType: newUser.bloodType,
      isVerifiedDonor: newUser.isVerifiedDonor,
      availabilityStatus: newUser.availabilityStatus
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser._id, token });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: "Phone number or email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Bulk registration for website/app users
export const registerWebUsersBulk = async (req, res) => {
  try {
    const users = Array.isArray(req.body) ? req.body : req.body?.users;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "Provide an array of users" });
    }

    // Prepare docs with geocoding in parallel but with modest concurrency
    const preparedDocs = await Promise.all(users.map(async (u, index) => {
      const {
        name, phone, email, password, age, gender, bloodType, organDonation, anomalies, pincode
      } = u || {};

      if (!name || !phone || !email || !password || !age || !gender || !bloodType || !pincode) {
        return { error: `Missing required fields at index ${index}` };
      }

      try {
        const location = await geocodePincodeToPoint(pincode);
        return {
          name,
          phone,
          email,
          password,
          age,
          gender,
          bloodType,
          organDonation: Array.isArray(organDonation) ? organDonation : [],
          anomalies: anomalies || "",
          pincode,
          location,
          isVerifiedDonor: false,
          availabilityStatus: "unavailable"
        };
      } catch (e) {
        return { error: `Invalid pincode at index ${index}` };
      }
    }));

    const docsToInsert = preparedDocs.filter(d => !d.error);
    const errors = preparedDocs
      .map((d, i) => (d.error ? { index: i, message: d.error } : null))
      .filter(Boolean);

    let result = { insertedCount: 0, errors };
    if (docsToInsert.length > 0) {
      try {
        const insertResult = await User.insertMany(docsToInsert, { ordered: false });
        result.insertedCount = insertResult.length;
      } catch (e) {
        // Duplicate key errors will throw a BulkWriteError; count successful inserts
        if (e.writeErrors && Array.isArray(e.writeErrors)) {
          const successful = e.result?.nInserted ?? 0;
          result.insertedCount = successful;
          errors.push(...e.writeErrors.map(we => ({ index: we.index, message: we.errmsg || "Write error" })));
        } else {
          return res.status(500).json({ message: "Bulk insert failed", error: e.message });
        }
      }
    }

    return res.status(207).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// User login with email/password (web)
export const loginWebUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signBasicToken({
      kind: "user",
      userId: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email || null,
      bloodType: user.bloodType,
      isVerifiedDonor: user.isVerifiedDonor,
      availabilityStatus: user.availabilityStatus
    });
    return res.json({ message: "Login successful", userId: user._id, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// User login with phone/PIN (phone-call)
export const loginPhoneUser = async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      return res.status(400).json({ message: "Phone and PIN are required" });
    }
    const user = await User.findOne({ phone });
    if (!user || String(user.pin) !== String(pin)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signBasicToken({
      kind: "user",
      userId: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email || null,
      bloodType: user.bloodType,
      isVerifiedDonor: user.isVerifiedDonor,
      availabilityStatus: user.availabilityStatus
    });
    return res.json({ message: "Login successful", userId: user._id, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Hospital registration (similar to user, with lat/long stored)
export const registerHospital = async (req, res) => {
  try {
    const { name, licenseNo, address = {}, contact = {}, type, services } = req.body;
    const { line1, line2, city, state, pincode, country } = address;

    if (!name || !licenseNo || !line1 || !city || !state || !pincode || !country) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Geocode pincode to coordinates
    let location;
    try {
      location = await geocodePincodeToPoint(pincode);
    } catch (e) {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    const hospital = new Hospital({
      name,
      type: type || undefined,
      licenseNo,
      contact: {
        phone: contact.phone,
        email: contact.email
      },
      address: {
        line1,
        line2,
        city,
        state,
        pincode: String(pincode),
        country
      },
      location,
      services: Array.isArray(services) ? services : undefined
    });

    await hospital.save();

    const token = signBasicToken({
      kind: "hospital",
      hospitalId: hospital._id,
      name: hospital.name,
      licenseNo: hospital.licenseNo,
      type: hospital.type,
      address: { city: hospital.address.city, state: hospital.address.state },
    });

    return res.status(201).json({ message: "Hospital registered successfully", hospitalId: hospital._id, token });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate license or unique field" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

// Hospital login (simple: by licenseNo)
export const loginHospital = async (req, res) => {
  try {
    const { licenseNo } = req.body;
    if (!licenseNo) {
      return res.status(400).json({ message: "licenseNo is required" });
    }
    const hospital = await Hospital.findOne({ licenseNo });
    if (!hospital) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signBasicToken({
      kind: "hospital",
      hospitalId: hospital._id,
      name: hospital.name,
      licenseNo: hospital.licenseNo,
      type: hospital.type,
      address: { city: hospital.address.city, state: hospital.address.state },
    });
    return res.json({ message: "Login successful", hospitalId: hospital._id, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
