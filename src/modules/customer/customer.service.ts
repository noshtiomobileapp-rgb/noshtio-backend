import mongoose from "mongoose";
import Customer, { ICustomer } from "../models/Customer.model";

/* ============================================================
   CUSTOMER PROFILE SERVICE
============================================================ */

export interface CreateCustomerInput {
  userId: string;
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
}

export interface UpdateCustomerInput {
  phone?: string;
  firstName?: string;
  lastName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

/* ============================================================
   GET CUSTOMER PROFILE
============================================================ */

export async function getCustomerProfile(
  userId: string
): Promise<ICustomer | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  return Customer.findOne({ userId }).lean();
}

/* ============================================================
   CREATE CUSTOMER PROFILE
============================================================ */

export async function createCustomerProfile(
  input: CreateCustomerInput
): Promise<ICustomer> {
  if (!mongoose.Types.ObjectId.isValid(input.userId)) {
    throw new Error("Invalid user ID");
  }

  // Check if customer already exists
  const existing = await Customer.findOne({ userId: input.userId });
  if (existing) {
    throw new Error("Customer profile already exists for this user");
  }

  return Customer.create({
    userId: input.userId,
    email: input.email,
    phone: input.phone || null,
    firstName: input.firstName || null,
    lastName: input.lastName || null,
    address: input.address || {
      street: null,
      city: null,
      state: null,
      postalCode: null,
    },
  });
}

/* ============================================================
   UPDATE CUSTOMER PROFILE
============================================================ */

export async function updateCustomerProfile(
  userId: string,
  input: UpdateCustomerInput
): Promise<ICustomer | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const updateData: any = {};

  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.firstName !== undefined) updateData.firstName = input.firstName;
  if (input.lastName !== undefined) updateData.lastName = input.lastName;
  if (input.address) {
    updateData.address = input.address;
  }

  return Customer.findOneAndUpdate(
    { userId },
    updateData,
    { new: true }
  ).lean();
}

/* ============================================================
   DELETE CUSTOMER PROFILE (GDPR cleanup)
============================================================ */

export async function deleteCustomerProfile(userId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const result = await Customer.deleteOne({ userId });
  return result.deletedCount > 0;
}
