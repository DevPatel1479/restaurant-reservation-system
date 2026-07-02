import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },   // HH:mm
    guests: { type: Number, required: true, min: 1, max: 50 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed', index: true },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

reservationSchema.index({ table: 1, date: 1, status: 1 });
reservationSchema.index({ user: 1, date: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
