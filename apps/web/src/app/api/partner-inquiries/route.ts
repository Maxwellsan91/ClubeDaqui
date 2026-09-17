import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : "";
  const contactName =
    typeof body.contactName === "string" ? body.contactName.trim() : "";
  const contact =
    typeof body.contact === "string" ? body.contact.trim() : "";

  if (!businessName || !contactName || !contact) {
    return Response.json(
      { message: "Campos obrigatórios em falta" },
      { status: 400 },
    );
  }
  if (
    businessName.length > 120 ||
    contactName.length > 120 ||
    contact.length > 240
  ) {
    return Response.json(
      { message: "Os campos excedem o tamanho permitido" },
      { status: 400 },
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (serviceKey) {
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    await adminClient
      .from("partner_inquiries")
      .insert({ business_name: businessName, contact_name: contactName, contact });
  }

  return Response.json(
    { message: "Pedido recebido", data: { businessName, contactName } },
    { status: 201 },
  );
}