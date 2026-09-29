import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { z } from "zod";
import type { SupabaseService } from "./infrastructure/supabase/supabase.service.js";
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe.js";
import { MemberAuthGuard } from "./modules/members/member-auth.guard.js";
import { PartnerAuthGuard } from "./modules/partners/partner-auth.guard.js";
import { AdminAuthGuard } from "./modules/admin/admin-auth.guard.js";

function fakeSupabase(options: {
  user?: { id: string; email?: string } | null;
  authError?: Error | null;
  profile?: { role?: string; is_active?: boolean } | null;
}) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: options.profile ?? null, error: null }),
  };
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: options.user ?? null },
        error: options.authError ?? null,
      }),
    },
    from: () => query,
  };
  return {
    createUserClient: () => client,
    createAdminClient: () => client,
  } as unknown as SupabaseService;
}

function request(authorization?: string) {
  return { headers: { authorization } };
}

test("ZodValidationPipe accepts valid bodies and rejects unknown fields", () => {
  const pipe = new ZodValidationPipe(
    z.object({ name: z.string().min(1) }).strict(),
  );
  const metadata = { type: "body" as const, metatype: undefined, data: "body" };
  assert.deepEqual(pipe.transform({ name: "Clube" }, metadata), { name: "Clube" });
  assert.throws(
    () => pipe.transform({ name: "Clube", role: "ADMIN" }, metadata),
    BadRequestException,
  );
});

test("MemberAuthGuard rejects missing and invalid sessions", async () => {
  const guard = new MemberAuthGuard(
    fakeSupabase({ authError: new Error("invalid") }),
  );
  await assert.rejects(
    () => guard.canActivate({ switchToHttp: () => ({ getRequest: () => request() }) } as never),
    UnauthorizedException,
  );
  await assert.rejects(
    () => guard.canActivate({ switchToHttp: () => ({ getRequest: () => request("Bearer bad") }) } as never),
    UnauthorizedException,
  );
});

test("PartnerAuthGuard allows partners and rejects other roles", async () => {
  const memberGuard = new PartnerAuthGuard(
    fakeSupabase({ user: { id: "member" }, profile: { role: "MEMBER", is_active: true } }),
  );
  await assert.rejects(
    () => memberGuard.canActivate({ switchToHttp: () => ({ getRequest: () => request("Bearer token") }) } as never),
    ForbiddenException,
  );

  const partnerGuard = new PartnerAuthGuard(
    fakeSupabase({ user: { id: "partner" }, profile: { role: "PARTNER", is_active: true } }),
  );
  await assert.doesNotReject(() =>
    partnerGuard.canActivate({ switchToHttp: () => ({ getRequest: () => request("Bearer token") }) } as never),
  );
});

test("AdminAuthGuard allows only active admins", async () => {
  const memberGuard = new AdminAuthGuard(
    fakeSupabase({ user: { id: "member" }, profile: { role: "MEMBER", is_active: true } }),
  );
  await assert.rejects(
    () => memberGuard.canActivate({ switchToHttp: () => ({ getRequest: () => request("Bearer token") }) } as never),
    ForbiddenException,
  );

  const adminGuard = new AdminAuthGuard(
    fakeSupabase({ user: { id: "admin" }, profile: { role: "ADMIN", is_active: true } }),
  );
  await assert.doesNotReject(() =>
    adminGuard.canActivate({ switchToHttp: () => ({ getRequest: () => request("Bearer token") }) } as never),
  );
});
