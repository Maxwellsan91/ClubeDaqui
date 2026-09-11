import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
type Inquiry = {
  businessName: string;
  contactName: string;
  contact: string;
  createdAt: string;
};
const inquiries: Inquiry[] = [];
@Controller("partner-inquiries")
export class PartnerInquiriesController {
  constructor(private readonly supabase: SupabaseService) {}
  @Post()
  @HttpCode(201)
  async create(@Body() body: Record<string, unknown>) {
    const businessName =
      typeof body.businessName === "string" ? body.businessName.trim() : "";
    const contactName =
      typeof body.contactName === "string" ? body.contactName.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    if (!businessName || !contactName || !contact)
      throw new BadRequestException("Campos obrigatórios em falta");
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
