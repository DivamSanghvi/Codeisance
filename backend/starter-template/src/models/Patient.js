import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    uppercase: true
  },
  unitsNeeded: {
    type: Number,
    required: [true, 'Units needed is required'],
    min: [1, 'At least 1 unit needed']
  },
  status: {
    type: String,
    enum: ['PENDING', 'FULFILLED'],
    default: 'PENDING'
  },
  confirmedCount: {
    type: Number,
    default: 0
  },
  fulfilledAt: Date
}, {
  timestamps: true
});

// Indexes
patientSchema.index({ hospitalId: 1, status: 1 });
patientSchema.index({ bloodType: 1 });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
