import mongoose, { Schema, Document } from "mongoose";

/* ============================================================
   CUSTOMER PROFILE
   Links to User model, stores customer-specific data
============================================================ */

export interface ICustomer extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      index: true,
    },

    phone: {
      type: String,
      default: null,
    },

    firstName: {
      type: String,
      default: null,
    },

    lastName: {
      type: String,
      default: null,
    },

    address: {
      street: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      postalCode: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomer>("Customer", CustomerSchema);
