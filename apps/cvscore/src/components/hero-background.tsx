export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 isolate overflow-hidden bg-background">
      {/* Grid + beam mask */}
      <div className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2 [mask-composite:intersect] [mask-image:linear-gradient(black,transparent_320px),linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]">
        <svg
          className="pointer-events-none absolute inset-0 text-muted-foreground/30"
          width="100%"
          height="100%"
          aria-hidden
        >
          <title>Grid pattern</title>
          <defs>
            <pattern
              id="cvscore-grid"
              x="-0.25"
              y="-1"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect fill="url(#cvscore-grid)" width="100%" height="100%" />
        </svg>
      </div>
      {/* Conic gradient glow */}
      <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] mix-blend-overlay">
        <div
          className="absolute -inset-16 blur-[50px] saturate-[2] mix-blend-overlay"
          style={{
            background:
              "conic-gradient(from 90deg,#F00 5deg,#EAB308 63deg,#5CFF80 115deg,#1E00FF 170deg,#855AFC 220deg,#3A8BFD 286deg,#F00 360deg)",
          }}
        />
      </div>
      <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] opacity-10">
        <div
          className="absolute -inset-16 blur-[50px] saturate-[2] mix-blend-overlay"
          style={{
            background:
              "conic-gradient(from 90deg,#F00 5deg,#EAB308 63deg,#5CFF80 115deg,#1E00FF 170deg,#855AFC 220deg,#3A8BFD 286deg,#F00 360deg)",
          }}
        />
      </div>
    </div>
  );
}
