import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller.js";
import { AdminAuthGuard } from "./admin-auth.guard.js";

@Module({
  controllers: [AdminController],
  providers: [AdminAuthGuard],
})
export class AdminModule {}
