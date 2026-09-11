import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from "@nestjs/common";
type Inquiry = {
  businessName: string;
  contactName: string;
  contact: string;
  createdAt: string;
};
const inquiries: Inquiry[] = [];
@Controller("partner-inquiries")
export class PartnerInquiriesController {
  @Post()
  @HttpCode(201)
  create(@Body() body: Record<string, unknown>) {
    const businessName =
      typeof body.businessName === "string" ? body.businessName.trim() : "";
    const contactName =
      typeof body.contactName === "string" ? body.contactName.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    if (!businessName || !contactName || !contact)
      throw new BadRequestException("Campos obrigatórios em falta");
    inquiries.push({
      businessName,
      contactName,
      contact,
      createdAt: new Date().toISOString(),
    });
    return { message: "Pedido recebido", data: { businessName, contactName } };
  }
}
