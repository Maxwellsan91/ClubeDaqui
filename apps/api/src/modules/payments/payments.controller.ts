import {
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  MemberAuthGuard,
  type AuthenticatedRequest,
} from "../members/member-auth.guard.js";
import { PaymentsService } from "./payments.service.js";

type RawRequest = { rawBody?: Buffer };

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("checkout")
  @UseGuards(MemberAuthGuard)
  async checkout(@Req() request: AuthenticatedRequest) {
    return { data: await this.payments.createCheckout(request) };
  }

  @Post("webhook")
  async webhook(
    @Req() request: RawRequest,
    @Headers("stripe-signature") signature?: string,
  ) {
    if (!signature || !request.rawBody) {
      throw new UnauthorizedException("Stripe webhook signature required");
    }
    await this.payments.handleWebhook(request.rawBody, signature);
    return { received: true };
  }
}
