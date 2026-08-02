import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ParcelQueryService } from '../../application/services/parcel.query.service';
import { Readable } from 'stream';

@ApiTags('Parcels')
@Controller('parcels')
export class ParcelController {
  constructor(private readonly parcelService: ParcelQueryService) {}

  @Get(':trackingNumber')
  @ApiOperation({ summary: 'Get parcel details with tracking history' })
  async getParcelWithHistory(@Param('trackingNumber') trackingNumber: string) {
    return this.parcelService.getParcelWithHistory(trackingNumber);
  }

  @Get(':trackingNumber/label')
  @ApiOperation({ summary: 'Generate and download parcel PDF label' })
  async generateLabelPdf(
    @Param('trackingNumber') trackingNumber: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.parcelService.generateParcelLabelPdf(trackingNumber);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="label-${trackingNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    const stream = new Readable();
    stream.push(pdfBuffer);
    stream.push(null);

    stream.pipe(res);
  }
}
