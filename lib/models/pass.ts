import { ObjectId } from 'mongodb';

export interface Pass {
  _id?: ObjectId;
  passId: string;          // Unique: VIS-0001
  eventId: string;
  status: 'unused' | 'used';
  qrUrl: string;
  qrDataUrl?: string;      // Base64 encoded QR code image
  name?: string;
  mobile?: string;
  city?: string;
  age?: number | string;
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date;
}

export interface PassDocument extends Pass {
  _id: ObjectId;
}
