// src/sku/dto/update-sku.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateSkuDto } from './create-sku.dto';

export class UpdateSkuDto extends PartialType(CreateSkuDto) {}
