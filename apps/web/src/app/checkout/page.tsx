import { CheckoutButton } from "@/components/checkout-button";

export default function CheckoutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="text-center">
        <p className="text-wine-700 text-[11px] font-semibold tracking-[0.25em] uppercase">
          Adesão ao Clube
        </p>
        <h1 className="font-display mt-4 text-3xl text-olive-900">
          A preparar o seu pagamento…
        </h1>
        <p className="mt-3 text-sm text-olive-700">
          Será encaminhado para o Stripe em segurança.
        </p>
        <div className="mt-6">
          <CheckoutButton autoStart />
        </div>
      </div>
    </main>
  );
}
