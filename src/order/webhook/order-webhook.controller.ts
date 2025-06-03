import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('webhook')
export class OrderWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    interface RawBodyRequest extends Request {
      rawBody?: Buffer | string;
    }
    const rawBody = (req as RawBodyRequest).rawBody ?? req.body;
    if (!signature)
      throw new BadRequestException('Missing Stripe signature header');
    if (
      !rawBody ||
      (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody))
    ) {
      throw new BadRequestException('Invalid request body format');
    }
    await this.stripeWebhookService.handleStripeEvent(rawBody, signature);
  }
}
