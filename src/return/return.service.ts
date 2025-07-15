import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReturnRequest,
  ReturnRequestDocument,
} from './schemas/return-request.schema';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { FirebaseService } from '@/firebase/firebase.service';

@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(ReturnRequest.name)
    private readonly returnRequestModel: Model<ReturnRequestDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async createReturnRequest(
    userId: string,
    dto: CreateReturnRequestDto,
    files?: Express.Multer.File[],
  ) {
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await Promise.all(
        files.map((file) =>
          this.firebaseService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
          ),
        ),
      );
    }
    const request = new this.returnRequestModel({
      ...dto,
      userId,
      images: imageUrls.length > 0 ? imageUrls : dto.images,
      status: 'pending',
    });
    return request.save();
  }

  async approveReturnRequest(requestId: string, adminNotes?: string) {
    const request = await this.returnRequestModel.findById(requestId);
    if (!request) {
      throw new Error('Return request not found');
    }
    if (request.status !== 'pending') {
      throw new Error('Return request is not pending');
    }
    request.status = 'approved';
    if (adminNotes) request.adminNotes = adminNotes;
    await request.save();
    return request;
  }

  async rejectReturnRequest(requestId: string, adminNotes?: string) {
    const request = await this.returnRequestModel.findById(requestId);
    if (!request) {
      throw new Error('Return request not found');
    }
    if (request.status !== 'pending') {
      throw new Error('Return request is not pending');
    }
    request.status = 'rejected';
    if (adminNotes) request.adminNotes = adminNotes;
    await request.save();
    return request;
  }

  async completeReturnRequest(requestId: string, adminNotes?: string) {
    const request = await this.returnRequestModel.findById(requestId);
    if (!request) {
      throw new Error('Return request not found');
    }
    if (request.status !== 'approved') {
      throw new Error('Return request must be approved before completion');
    }
    request.status = 'completed';
    if (adminNotes) request.adminNotes = adminNotes;
    await request.save();
    return request;
  }
}
