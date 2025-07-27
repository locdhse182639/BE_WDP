import { UpdateProfileDto } from './dto/update-profile.dto';
import { randomBytes } from 'crypto';
import { EmailService } from '@/email/email.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      email: dto.email,
      password: hashed,
    });
    return user.save();
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ email: regex }, { name: regex }, { phone: regex }];
    }

    const [data, totalItems] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.skinType !== undefined) user.skinType = dto.skinType;
    await user.save();
    return user;
  }

  async sendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    // Generate a token
    const token = randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    await user.save();
    await this.emailService.sendVerificationEmail(user.email, token);
    return { message: 'Verification email sent' };
  }

  async verifyEmail(
    userId: string,
    token: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.emailVerificationToken)
      throw new NotFoundException('Invalid or expired verification token');
    if (user.emailVerificationToken !== token)
      throw new NotFoundException('Invalid or expired verification token');
    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    await user.save();
    return { message: 'Email verified successfully' };
  }

  /**
   * Find all users with delivery role, with separate regex filters and pagination
   */
  async findDeliveryPersonnel({
    page = 1,
    limit = 10,
    email,
    name,
    phone,
  }: {
    page?: number;
    limit?: number;
    email?: string;
    name?: string;
    phone?: string;
  }) {
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = { role: 'delivery' };
    if (email) {
      filter.email = { $regex: new RegExp(email, 'i') };
    }
    if (name) {
      filter.fullName = { $regex: new RegExp(name, 'i') };
    }
    if (phone) {
      filter.phone = { $regex: new RegExp(phone, 'i') };
    }
    const [data, totalItems] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit),
      this.userModel.countDocuments(filter),
    ]);
    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findByEmailPartial(email: string): Promise<UserDocument[]> {
    console.log('Finding users by partial email:', email);
    return this.userModel.find({ email: { $regex: email, $options: 'i' } });
  }

  // Request password reset: generate OTP and email to user
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOtp = otp;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 min expiry
    await user.save();
    await this.emailService.sendPasswordResetEmail(user.email, otp);
    return { message: 'Password reset OTP sent' };
  }

  // Reset password using OTP
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email, passwordResetOtp: otp });
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new NotFoundException('Invalid or expired OTP');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtp = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return { message: 'Password has been reset' };
  }

  // Admin: update user role
  async updateUserRole(userId: string, role: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    await user.save();
    return user;
  }
}
