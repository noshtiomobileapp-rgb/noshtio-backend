import mongoose, { Schema, Document } from 'mongoose';

export type QRType = 'table' | 'takeaway' | 'delivery';

export interface IQRCode extends Document {
  vendorId: mongoose.Types.ObjectId;
  type: QRType;
  tableIdentifier?: string;   // e.g. "T1", "T2" — only for type=table
  url: string;                // the deep link the QR encodes
  shortCode: string;          // 6-char unique code for the URL
  isActive: boolean;
  createdAt: Date;
}

const QRCodeSchema = new Schema<IQRCode>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    type: { type: String, enum: ['table', 'takeaway', 'delivery'], required: true },
    tableIdentifier: { type: String },
    url: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IQRCode>('QRCode', QRCodeSchema);