import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";

export type AuthenticatedRequest = {
  headers: { authorization?: string; origin?: string };
  user: { id: string; email?: string };
  accessToken: string;
};

@Injectable()
export class MemberAuthGuard implements CanActivate {
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
      .createUserClient(token)
      .from("profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile && profile.is_active === false) {
      throw new ForbiddenException("Conta desativada");
    }
    request.user = { id: data.user.id, email: data.user.email };
    request.accessToken = token;
    return true;
  }
}
