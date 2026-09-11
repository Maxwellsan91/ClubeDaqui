import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";

import type { Environment } from "../../config/environment.js";

@Injectable()
export class SupabaseService {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  createUserClient(accessToken: string) {
    return createClient(
      this.config.getOrThrow("SUPABASE_URL", { infer: true }),
      this.config.getOrThrow("SUPABASE_PUBLISHABLE_KEY", { infer: true }),
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );
  }

  createAdminClient() {
    const serviceRoleKey = this.config.get("SUPABASE_SERVICE_ROLE_KEY", {
      infer: true,
    });

    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin access");
    }

    return createClient(
      this.config.getOrThrow("SUPABASE_URL", { infer: true }),
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  }
}
