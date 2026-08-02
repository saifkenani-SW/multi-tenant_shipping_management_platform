import { Module } from '@nestjs/common';
import { LabelGeneratorService } from './services/label-generator.service';
import { QRCodeGenerator } from './generators/qr-code.generator';
import { BarcodeGenerator } from './generators/barcode.generator';

@Module({
  providers: [LabelGeneratorService, QRCodeGenerator, BarcodeGenerator],
  exports: [LabelGeneratorService],
})
export class LabelGeneratorModule {}
