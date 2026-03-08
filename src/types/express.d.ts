import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      userId?: string;
      vendorId?: string;
      role: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};