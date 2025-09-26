import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PROPOSED', 'CONFIRMED', 'EXPIRED'],
    default: 'PROPOSED'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// TTL index to auto-expire after 24 hours
matchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes
matchSchema.index({ patientId: 1, status: 1 });
matchSchema.index({ donorId: 1 });
matchSchema.index({ token: 1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;
