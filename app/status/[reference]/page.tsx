"use client";

import { useParams, useRouter } from "next/navigation";
import { LencoPaymentStatus } from "@/lenco-module/components/payment";

export default function StatusPage() {
  const params    = useParams();
  const router    = useRouter();
  const reference = params.reference as string;

  return (
    <>
      {/* Header */}
      <header className="bg-white/40 backdrop-blur-xl sticky top-0 z-50 shadow-sm border-b border-white/40">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max-width mx-auto h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
            <span className="text-headline-md font-bold text-on-surface">SecurePay</span>
          </div>
          <span className="material-symbols-outlined text-primary">verified_user</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-section-gap px-gutter">
        <div className="w-full max-w-lg">
          <LencoPaymentStatus reference={reference} onRestart={() => router.push("/")} />
          <p className="mt-6 text-center text-label-caps text-on-surface-variant">
            🔐 256-BIT SECURE ENCRYPTION · POWERED BY LENCO
          </p>
        </div>
      </main>
    </>
  );
}
