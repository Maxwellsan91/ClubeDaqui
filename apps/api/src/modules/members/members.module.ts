import { Module } from "@nestjs/common";
import { MembersController } from "./members.controller.js";
import { MemberAuthGuard } from "./member-auth.guard.js";

@Module({ controllers: [MembersController], providers: [MemberAuthGuard] })
export class MembersModule {}
