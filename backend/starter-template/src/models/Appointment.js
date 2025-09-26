import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED'
  }
}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ donorId: 1 });
appointmentSchema.index({ hospitalId: 1, dateTime: 1 });
appointmentSchema.index({ matchId: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
