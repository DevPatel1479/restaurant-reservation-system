import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    capacity: { type: Number, required: true, min: 1, max: 50 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Table = mongoose.model('Table', tableSchema);
