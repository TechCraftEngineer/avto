import { Button } from "@qbs-autonaim/ui/components/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { COPY } from "@/lib/seo";

interface ScreeningCtaProps {
  signupUrl: string;
}

export function ScreeningCta({ signupUrl }: ScreeningCtaProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-b from-muted/40 to-muted/10 p-6 text-center shadow-sm">
      <div className="absolute right-0 top-0 size-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-2xl" />
      <Sparkles className="mx-auto mb-3 size-8 text-primary/70" />
      <h3 className="mb-2 font-semibold text-foreground text-base">
        {COPY.cta.headline}
      </h3>
      <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
        {COPY.cta.text}
      </p>
      <Button size="lg" asChild className="shadow-sm">
        <a
          href={signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${COPY.cta.button} (открывается в новой вкладке)`}
        >
          {COPY.cta.button}
          <ArrowRight className="size-4 ml-2" />
        </a>
      </Button>
    </div>
  );
}
