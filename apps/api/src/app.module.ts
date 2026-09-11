import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/environment";
import { HealthModule } from "./modules/health/health.module";
import { SupabaseModule } from "./infrastructure/supabase/supabase.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    HealthModule,
    SupabaseModule,
  ],
})
export class AppModule {}
