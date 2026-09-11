import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/environment.js";
import { HealthModule } from "./modules/health/health.module.js";
import { SupabaseModule } from "./infrastructure/supabase/supabase.module.js";
import { BusinessesModule } from "./modules/businesses/businesses.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    HealthModule,
    SupabaseModule,
    BusinessesModule,
  ],
})
export class AppModule {}
