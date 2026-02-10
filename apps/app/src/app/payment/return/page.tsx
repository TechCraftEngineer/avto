import { Suspense } from "react";
import { PaymentReturnContent } from "~/components/payment/payment-return-content";

export const metadata = {
  title: "Результат оплаты",
};

export default function PaymentReturnPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Suspense fallback={<PaymentReturnSkeleton />}>
        <PaymentReturnContent />
      </Suspense>
    </div>
  );
}

function PaymentReturnSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="space-y-4">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
      </div>
      <div className="h-10 w-32 bg-muted rounded" />
    </div>
  );
}
