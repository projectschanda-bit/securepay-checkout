/**
 * BackgroundSlash — layered radial + diagonal gradient background.
 * Stripe-inspired light purple mesh. pointer-events: none throughout.
 */
export default function BackgroundSlash() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      {/* Layer 1 — top-right radial blob, rotated */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(167,139,250,0.45) 0%, transparent 65%), " +
            "radial-gradient(ellipse at 80% 80%, rgba(216,180,254,0.35) 0%, transparent 65%)",
          transform: "rotate(-18deg) scale(1.35)",
          transformOrigin: "center center",
        }}
      />

      {/* Layer 2 — bottom-right radial blob */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 85% 70%, rgba(196,181,253,0.28) 0%, transparent 55%)",
          transform: "rotate(-18deg) scale(1.2)",
          transformOrigin: "bottom right",
        }}
      />

      {/* Layer 3 — linear diagonal slash accent */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(160deg, rgba(196,181,253,0.18) 0%, transparent 60%)",
          transform: "skewX(-18deg) scale(1.2)",
          transformOrigin: "top right",
        }}
      />
    </div>
  );
}
