import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import type { AuthenticatedRequest } from "../members/member-auth.guard.js";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) throw new UnauthorizedException("Bearer token required");

    const { data, error } = await this.supabase
      .createUserClient(token)
      .auth.getUser();
    if (error || !data.user) throw new UnauthorizedException("Invalid session");

    const { data: profile } = await this.supabase
      .createAdminClient()
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.role !== "ADMIN") {
      throw new ForbiddenException("Acesso restrito a administradores");
    }

    request.user = { id: data.user.id, email: data.user.email };
    request.accessToken = token;
    return true;
  }
}