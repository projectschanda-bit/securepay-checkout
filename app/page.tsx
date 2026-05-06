import { LencoPaymentForm } from "@/lenco-module/components/payment";

export default function Home() {
  return (
    <>
      {/* ── Top App Bar ── */}
      <header className="bg-white/40 backdrop-blur-xl sticky top-0 z-50 shadow-sm border-b border-white/40">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max-width mx-auto h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
            <span className="text-headline-md font-bold text-on-surface">SecurePay</span>
          </div>
          <span className="material-symbols-outlined text-primary cursor-pointer">verified_user</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-grow flex items-center justify-center py-section-gap px-gutter relative overflow-hidden">
        {/* Decorative blurred card images */}
        <div className="absolute top-1/4 left-10 md:left-20 w-72 h-48 rounded-2xl overflow-hidden opacity-10 -rotate-12 shadow-2xl pointer-events-none blur-[2px] z-0 hidden md:block">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
        </div>
        <div className="absolute bottom-1/4 right-10 md:right-20 w-80 h-56 rounded-2xl overflow-hidden opacity-10 rotate-12 shadow-2xl pointer-events-none blur-[3px] z-0 hidden md:block">
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-tertiary/30" />
        </div>

        <div className="w-full max-w-container-max-width relative z-10">
          <LencoPaymentForm />

          {/* ── Trust Bar ── */}
          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap px-4">
            {[
              {
                icon: (
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                  </svg>
                ),
                label: "PCI DSS Compliant"
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ),
                label: "256-bit SSL Encrypted"
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-violet-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ),
                label: "Verified Checkout"
              },
              {
                icon: (
                  <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ),
                label: "Trusted by 10,000+ Users"
              },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
                {icon}
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-transparent w-full border-t border-outline-variant/20 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-page py-stack-lg max-w-container-max-width mx-auto">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="font-bold text-on-surface text-body-sm">SecurePay</span>
            <span className="text-body-sm text-on-surface-variant">© 2024 SecurePay. All transactions are encrypted and secure.</span>
          </div>
          <div className="flex gap-4">
            {["Privacy Policy", "Terms of Service", "Help Center"].map((l) => (
              <a key={l} href="#" className="text-label-caps text-on-surface-variant hover:text-primary transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
