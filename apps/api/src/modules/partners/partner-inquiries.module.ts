import { Module } from "@nestjs/common";
import { PartnerInquiriesController } from "./partner-inquiries.controller.js";
@Module({ controllers: [PartnerInquiriesController] })
export class PartnerInquiriesModule {}
