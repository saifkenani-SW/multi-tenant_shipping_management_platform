import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProofOfDeliveryQueryRepository } from '../../infrastructure/repositories/proof-of-delivery.query.repository';
import { ProofOfDeliveryResponseDto } from '../dtos/responses/proof-of-delivery.response.dto';
import { ProofOfDeliveryMapper } from '../mappers/proof-of-delivery.mapper';
import type { IStorageProvider } from '../../../../../packages/storage/src';
import { STORAGE_PROVIDER } from '../../../../../packages/storage/src';
import { Readable } from 'stream';
import { extname } from 'path';
import * as mime from 'mime-types';

@Injectable()
export class ProofOfDeliveryQueryService {
  constructor(
    private readonly queryRepository: ProofOfDeliveryQueryRepository,
    private readonly mapper: ProofOfDeliveryMapper,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<ProofOfDeliveryResponseDto> {
    const record =
      await this.queryRepository.findByTrackingNumber(trackingNumber);

    if (!record) {
      throw new NotFoundException('Proof of delivery not found');
    }

    return this.mapper.toResponse(record);
  }

  async getPhotoStream(
    trackingNumber: string,
    photoType: 'signature' | 'idPhoto' | 'parcelPhoto' | 'additionalPhoto',
    index: number = 0,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const record = await this.findByTrackingNumber(trackingNumber);
    let key: string | null = null;

    if (photoType === 'signature') key = record.signatureKey;
    if (photoType === 'idPhoto') key = record.idPhotoKey;
    if (photoType === 'parcelPhoto') key = record.parcelPhotoKey;
    if (photoType === 'additionalPhoto') {
      const keys = record.additionalPhotoKey?.split(',') || [];
      key = keys[index] || null;
    }

    if (!key) {
      throw new NotFoundException(
        `Photo of type ${photoType} not found for this delivery`,
      );
    }

    const stream = await this.storageProvider.get(key);
    const mimeType = mime.lookup(extname(key)) || 'application/octet-stream';

    return { stream, mimeType };
  }
}
