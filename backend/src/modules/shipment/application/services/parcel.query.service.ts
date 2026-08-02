import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ParcelQueryRepository } from '../../infrastructure/repositories/parcel.query.repository';
import { TrackingFacade } from '../../../tracking/application/facades/tracking.facade';
import { LabelGeneratorService } from '../../../../packages/label-generator/services/label-generator.service';
import { PdfGeneratorService } from '../../../../packages/pdf-generator/services/pdf-generator.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ParcelQueryService implements OnModuleInit {
  private cachedLogoSrc: string = '';

  constructor(
    private readonly repository: ParcelQueryRepository,
    private readonly trackingFacade: TrackingFacade,
    private readonly labelGeneratorService: LabelGeneratorService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  onModuleInit() {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        this.cachedLogoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (e) {
      console.warn('Failed to load logo image during initialization:', e);
    }
  }

  async getParcelWithHistory(trackingNumber: string) {
    const parcel = await this.repository.findByTrackingNumber(trackingNumber);
    if (!parcel) {
      throw new NotFoundException(
        `Parcel with tracking number ${trackingNumber} not found`,
      );
    }

    const history = await this.trackingFacade.getParcelHistory(parcel.id);

    return {
      parcel,
      history,
    };
  }

  async generateParcelLabelPdf(trackingNumber: string): Promise<Buffer> {
    const data =
      await this.repository.findLabelDataByTrackingNumber(trackingNumber);
    if (!data) {
      throw new NotFoundException(
        `Parcel with tracking number ${trackingNumber} not found`,
      );
    }

    // Generate HTML
    const html = await this.labelGeneratorService.generate({
      logo: { src: this.cachedLogoSrc, enabled: !!this.cachedLogoSrc },
      qr: { value: data.tracking_number },
      barcode: { value: data.tracking_number, enabled: true },
      fields: [
        { label: 'Sender', value: data.sender_name || 'N/A' },
        { label: 'Sender Phone', value: data.sender_phone || 'N/A' },
        { label: 'Receiver', value: data.receiver_name || 'N/A' },
        { label: 'Receiver Phone', value: data.receiver_phone || 'N/A' },
        { label: 'Weight', value: `${data.actual_weight_kg || 0} kg` },
        {
          label: 'Dimensions',
          value: `${data.length_cm || 0}x${data.width_cm || 0}x${data.height_cm || 0} cm`,
        },
      ],
    });

    // Generate PDF Buffer
    return this.pdfGeneratorService.generate(html);
  }
}
