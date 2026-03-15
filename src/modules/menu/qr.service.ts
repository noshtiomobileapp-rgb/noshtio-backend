import { nanoid } from 'nanoid';
import QRCode, { IQRCode, QRType } from './qr.model';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.noshtio.com';

export class QRService {
  async generateQR(vendorId: string, type: QRType, tableIdentifier?: string): Promise<IQRCode> {
    const shortCode = nanoid(6);

    let url: string;
    if (type === 'table' && tableIdentifier) {
      url = `${BASE_URL}/menu?v=${vendorId}&t=${tableIdentifier}&ref=${shortCode}`;
    } else if (type === 'takeaway') {
      url = `${BASE_URL}/menu?v=${vendorId}&mode=takeaway&ref=${shortCode}`;
    } else {
      url = `${BASE_URL}/menu?v=${vendorId}&mode=delivery&ref=${shortCode}`;
    }

    const qr = await QRCode.create({ vendorId, type, tableIdentifier, url, shortCode });
    return qr;
  }

  async getVendorQRCodes(vendorId: string): Promise<IQRCode[]> {
    return QRCode.find({ vendorId, isActive: true }).sort({ createdAt: -1 });
  }

  async deactivateQR(qrId: string, vendorId: string): Promise<boolean> {
    const result = await QRCode.findOneAndUpdate(
      { _id: qrId, vendorId },
      { isActive: false }
    );
    return !!result;
  }

  async bulkGenerateTableQRs(vendorId: string, tableCount: number): Promise<IQRCode[]> {
    const qrs: IQRCode[] = [];
    for (let i = 1; i <= tableCount; i++) {
      const qr = await this.generateQR(vendorId, 'table', `T${i}`);
      qrs.push(qr);
    }
    return qrs;
  }
}