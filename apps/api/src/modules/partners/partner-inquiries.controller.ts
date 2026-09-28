import {
  Body,
  Controller,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UsePipes,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";

const partnerInquirySchema = z
  .object({
    businessName: z.string().trim().min(1).max(120),
    contactName: z.string().trim().min(1).max(120),
    contact: z.string().trim().min(3).max(240),
  })
  .strict();

type Inquiry = z.infer<typeof partnerInquirySchema> & { createdAt: string };
const inquiries: Inquiry[] = [];
@Controller("partner-inquiries")
export class PartnerInquiriesController {
  constructor(private readonly supabase: SupabaseService) {}
  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(partnerInquirySchema))
  async create(@Body() body: z.infer<typeof partnerInquirySchema>) {
    const { businessName, contactName, contact } = body;
    try {
      const { error } = await this.supabase
        .createAdminClient()
        .from("partner_inquiries")
        .insert({
          business_name: businessName,
          contact_name: contactName,
          contact,
        });
      if (error) throw error;
    } catch {
      if (process.env.NODE_ENV === "production") {
        throw new ServiceUnavailableException(
          "Não foi possível receber o pedido",
        );
      }
      inquiries.push({
        businessName,
        contactName,
        contact,
        createdAt: new Date().toISOString(),
      });
    }
    return { message: "Pedido recebido", data: { businessName, contactName } };
  }
}
