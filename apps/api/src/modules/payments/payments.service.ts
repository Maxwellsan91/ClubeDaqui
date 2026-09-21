import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import type { Environment } from "../../config/environment.js";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import type { AuthenticatedRequest } from "../members/member-auth.guard.js";

const MEMBERSHIP_PRICE_CENTS = 5900;

@Injectable()
export class PaymentsService {
  private stripeClient: Stripe | null = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService<Environment, true>,
    private readonly supabase: SupabaseService,
  ) {}

  private stripe(): Stripe {
    if (!this.stripeClient) {
      const secret = this.config.get("STRIPE_SECRET_KEY", { infer: true });
      if (!secret) {
        throw new ServiceUnavailableException(
          "Pagamentos ainda não estão configurados",
        );
      }
      this.stripeClient = new Stripe(secret);
    }
    return this.stripeClient;
  }

  async createCheckout(request: AuthenticatedRequest) {
    const priceId = this.config.get("STRIPE_PRICE_ID", { infer: true });
    if (!priceId) {
      throw new ServiceUnavailableException(
        "O preço Stripe ainda não está configurado",
      );
    }

    const admin = this.supabase.createAdminClient();
    const { data: activeMembership } = await admin
      .from("memberships")
      .select("id,ends_at")
      .eq("profile_id", request.user.id)
      .eq("status", "active")
      .gt("ends_at", new Date().toISOString())
      .maybeSingle();
    if (activeMembership) {
      throw new ConflictException("Já tem uma adesão ativa");
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", request.user.id)
      .maybeSingle();

    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setUTCFullYear(endsAt.getUTCFullYear() + 1);

    const { data: membership, error: membershipError } = await admin
      .from("memberships")
      .insert({
        profile_id: request.user.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "pending",
      })
      .select("id")
      .single();
    if (membershipError || !membership) {
      throw new BadRequestException(
        membershipError?.message ?? "Não foi possível iniciar a adesão",
      );
    }

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        membership_id: membership.id,
        provider: "stripe",
        amount_cents: MEMBERSHIP_PRICE_CENTS,
        currency: "EUR",
        status: "pending",
      })
      .select("id")
      .single();
    if (paymentError || !payment) {
      await admin.from("memberships").delete().eq("id", membership.id);
      throw new BadRequestException(
        paymentError?.message ?? "Não foi possível criar o pagamento",
      );
    }

    const configuredWebUrl = this.config.getOrThrow("WEB_URL", { infer: true });
    const requestOrigin = request.headers.origin?.replace(/\/$/, "");
    const webUrl =
      configuredWebUrl.startsWith("http://localhost") &&
      (requestOrigin === "https://clube-daqui-web.vercel.app" ||
        requestOrigin === "https://clube-ribatejo-web.vercel.app")
        ? requestOrigin
        : configuredWebUrl;
    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe().checkout.sessions.create(
        {
          mode: "payment",
          line_items: [{ price: priceId, quantity: 1 }],
          customer_email: request.user.email,
          client_reference_id: membership.id,
          metadata: {
            membership_id: membership.id,
            payment_id: payment.id,
            profile_id: request.user.id,
          },
          success_url: `${webUrl}/conta?payment=success`,
          cancel_url: `${webUrl}/clube?payment=cancelled`,
          locale: "pt",
          submit_type: "pay",
        },
        { idempotencyKey: `membership-checkout-${membership.id}` },
      );
    } catch (error) {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      const stripeMessage = error instanceof Stripe.errors.StripeError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Não foi possível abrir o Checkout";
      const message = stripeMessage.includes("No such price")
        ? "O preço Stripe configurado é inválido. Configure o ID do preço (price_...), não o ID do produto (prod_...)."
        : stripeMessage;
      throw new BadRequestException(
        message,
      );
    }

    await admin
      .from("payments")
      .update({ provider_checkout_session_id: session.id })
      .eq("id", payment.id);

    return { url: session.url, sessionId: session.id, name: profile?.full_name };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get("STRIPE_WEBHOOK_SECRET", {
      infer: true,
    });
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        "O webhook Stripe ainda não está configurado",
      );
    }

    let event: Stripe.Event;
    try {
      event = this.stripe().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException("Assinatura do webhook Stripe inválida");
    }

    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "checkout.session.async_payment_succeeded"
    ) {
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return;

    const membershipId = session.metadata?.membership_id ?? session.client_reference_id;
    const paymentId = session.metadata?.payment_id;
    if (!membershipId || !paymentId) return;

    const admin = this.supabase.createAdminClient();
    const { data: updatedPayment } = await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
      })
      .eq("id", paymentId)
      .eq("membership_id", membershipId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!updatedPayment) return;

    await admin
      .from("memberships")
      .update({ status: "active" })
      .eq("id", membershipId)
      .eq("status", "pending");

    const email = session.customer_details?.email ?? session.customer_email;
    await this.sendWelcomeEmail(email);
  }

  private async sendWelcomeEmail(email: string | null) {
    const apiKey = this.config.get("RESEND_API_KEY", { infer: true });
    const from = this.config.get("EMAIL_FROM", { infer: true });
    if (!apiKey || !from || !email) {
      this.logger.warn(
        "Email de boas-vindas não enviado: RESEND_API_KEY, EMAIL_FROM ou email ausente",
      );
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Bem-vindo ao Clube Daqui",
        html: `
          <h1>Bem-vindo ao Clube Daqui!</h1>
          <p>A sua adesão foi confirmada e já tem acesso aos benefícios exclusivos do Clube.</p>
          <p>A adesão é válida por 12 meses. Explore os parceiros e aproveite.</p>
          <p><a href="${this.config.getOrThrow("WEB_URL", { infer: true })}/conta">Abrir a minha área de membro</a></p>
        `,
      }),
    });
    if (!response.ok) {
      this.logger.error(`Falha ao enviar email de boas-vindas: ${response.status}`);
    }
  }
}
