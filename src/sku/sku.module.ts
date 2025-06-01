// src/sku/sku.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sku, SkuSchema } from './schemas/sku.schema';
import { SkuService } from './sku.service';
import { SkuController } from './sku.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sku.name, schema: SkuSchema }])],
  providers: [SkuService],
  controllers: [SkuController],
  exports: [SkuService],
})
export class SkuModule {}
