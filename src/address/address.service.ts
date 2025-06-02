import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  create(userId: string, dto: CreateAddressDto) {
    return this.addressModel.create({ ...dto, userId });
  }

  findByUser(userId: string) {
    return this.addressModel
      .find({ userId })
      .sort({ isDefault: -1, createdAt: -1 });
  }

  setDefault(userId: string, addressId: string) {
    return this.addressModel.updateMany({ userId }, [
      {
        $set: {
          isDefault: {
            $eq: ['$_id', new Types.ObjectId(addressId)],
          },
        },
      },
    ]);
  }
}
