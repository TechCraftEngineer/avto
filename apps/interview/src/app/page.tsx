"use client";

import { cn } from "@qbs-autonaim/ui/utils";
import { MessageSquare } from "lucide-react";
import { BubbleIcon } from "@/components/ui/bubble-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { FeaturesSection } from "@/components/ui/features-section";
import { Hero } from "@/components/ui/hero";

export default function PlaceholderContent() {
  return (
    <div className="bg-background">
      <Hero>
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
          <BubbleIcon>
            <MessageSquare className="size-10 text-primary-foreground" />
          </BubbleIcon>

          <h1
            className={cn(
              "mt-16 text-center text-4xl font-bold tracking-tight text-foreground sm:text-6xl",
              "animate-slide-up-fade motion-reduce:animate-fade-in [--offset:20px] animation-duration-[1s] fill-mode-[both]",
            )}
          >
            Платформа для интервью с&nbsp;ИИ
          </h1>

          <p
            className={cn(
              "mt-6 max-w-2xl text-balance text-center text-lg text-muted-foreground sm:text-xl",
              "animate-slide-up-fade motion-reduce:animate-fade-in [--offset:10px] [animation-delay:200ms] animation-duration-[1s] fill-mode-[both]",
            )}
          >
            Проводите умные интервью с&nbsp;помощью ИИ, который адаптируется
            к&nbsp;ответам, задаёт релевантные вопросы и&nbsp;предоставляет
            мгновенную аналитику.
          </p>

          <div
            className={cn(
              "relative mx-auto mt-10 flex max-w-fit flex-col items-center gap-4 sm:flex-row",
              "animate-slide-up-fade motion-reduce:animate-fade-in [--offset:5px] [animation-delay:300ms] animation-duration-[1s] fill-mode-[both]",
            )}
          >
            <ButtonLink variant="default" href="/signup">
              Начать работу
            </ButtonLink>
            <ButtonLink variant="outline" href="/about">
              Узнать больше
            </ButtonLink>
          </div>
        </div>
      </Hero>

      <div className="mt-24 border-t">
        <FeaturesSection />
      </div>
    </div>
  );
}
