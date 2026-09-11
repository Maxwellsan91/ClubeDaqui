import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";

export type AuthenticatedRequest = {
  headers: { authorization?: string };
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
    request.user = { id: data.user.id, email: data.user.email };
    request.accessToken = token;
    return true;
  }
}
