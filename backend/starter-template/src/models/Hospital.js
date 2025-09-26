import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [120, 'Name must be at most 120 characters'],
    trim: true
  },
  type: {
    type: String,
    enum: ['HOSPITAL', 'BLOOD_BANK', 'CLINIC'],
    default: 'HOSPITAL',
    uppercase: true
  },
  licenseNo: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  address: {
    line1: {
      type: String,
      required: [true, 'Address line1 is required'],
      trim: true
    },
    line2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      uppercase: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      uppercase: true
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates: [longitude, latitude]'
      }
    }
  },
  services: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
hospitalSchema.index({ licenseNo: 1 }, { unique: true });
hospitalSchema.index({ name: 1, 'address.city': 1 });
hospitalSchema.index({ location: '2dsphere' });

// Pre-save middleware for normalization
hospitalSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('type')) {
    this.type = this.type.toUpperCase();
  }
  if (this.isModified('licenseNo')) {
    this.licenseNo = this.licenseNo.trim();
  }
  if (this.isModified('contact.phone')) {
    this.contact.phone = this.contact.phone?.trim();
  }
  if (this.isModified('contact.email')) {
    this.contact.email = this.contact.email?.trim().toLowerCase();
  }
  if (this.isModified('address')) {
    this.address.line1 = this.address.line1.trim();
    this.address.line2 = this.address.line2?.trim();
    this.address.city = this.address.city.trim();
    this.address.state = this.address.state.toUpperCase();
    this.address.pincode = String(this.address.pincode).trim();
    this.address.country = this.address.country.toUpperCase();
  }
  if (this.isModified('services')) {
    this.services = this.services.map(s => s.trim());
  }
  next();
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;
