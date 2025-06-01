/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AddressModule } from './address/address.module';
import { ProductModule } from './product/product.module';
import { SkuModule } from './sku/sku.module';
import { CacheModule } from '@nestjs/cache-manager';
import redisStore from 'cache-manager-ioredis';

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI not set in environment variables');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        socket: {
          host: 'redis',
          port: 6379,
        },
      }),
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule,
    AuthModule,
    AddressModule,
    ProductModule,
    SkuModule,
  ],
})
export class AppModule {}
