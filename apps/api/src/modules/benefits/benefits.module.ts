import { Module } from "@nestjs/common";
import { BenefitsController } from "./benefits.controller.js";
@Module({ controllers: [BenefitsController] })
export class BenefitsModule {}
