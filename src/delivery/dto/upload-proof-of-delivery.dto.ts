import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional } from 'class-validator';

export class UploadProofOfDeliveryDto {
  @ApiProperty({
    description: 'URL or file path to the proof of delivery image/signature',
  })
  @IsUrl()
  proofOfDeliveryUrl: string;

  @ApiProperty({
    description: 'Optional delivery note from personnel',
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryNotes?: string;
}
