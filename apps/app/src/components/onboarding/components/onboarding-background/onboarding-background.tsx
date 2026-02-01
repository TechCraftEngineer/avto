import Image from "next/image";

export function OnboardingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-white transition-opacity duration-300 dark:bg-neutral-950">
      <div className="absolute left-1/2 top-[57%] -translate-x-1/2 -translate-y-1/2 opacity-50 transition-all sm:opacity-100 [mask-composite:intersect] [mask-image:linear-gradient(transparent,black_5%,black_95%,transparent),linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]">
        <Image
          alt=""
          loading="lazy"
          width={1750}
          height={1046}
          className="absolute inset-0"
          src="/welcome-background-grid.svg"
          aria-hidden="true"
        />
        <Image
          alt=""
          loading="lazy"
          width={1750}
          height={1046}
          className="relative min-w-[1000px] max-w-screen-2xl transition-opacity duration-300 [mask-composite:intersect] [mask-image:radial-gradient(black,transparent)]"
          src="/welcome-background.svg"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
