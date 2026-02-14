import { Button } from "@qbs-autonaim/ui";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div className="animate-slide-up-fade relative flex w-auto items-center justify-center px-6 py-2 [--offset:20px] [animation-duration:1.3s] [animation-fill-mode:both]">
        <div className="absolute inset-y-0 left-1/2 aspect-square -translate-x-1/2 opacity-10 mix-blend-overlay">
          <div className="size-full -scale-x-[1.8] blur-[40px]">
            <div className="size-full -rotate-90 saturate-[3] bg-[conic-gradient(from_279deg,#EAB308_47deg,#F00_121deg,#00FFF9_190deg,#855AFC_251deg,#3A8BFD_267deg,#A3ECB3_314deg,#EAB308_360deg)]" />
          </div>
        </div>
        <div className="relative text-black dark:text-white">
          <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">QBS</h1>
        </div>
        <div className="absolute inset-y-0 left-1/2 aspect-square -translate-x-1/2 opacity-50 mix-blend-hard-light">
          <div className="size-full -scale-x-[1.8] blur-[40px]">
            <div className="size-full -rotate-90 saturate-[3] bg-[conic-gradient(from_279deg,#EAB308_47deg,#F00_121deg,#00FFF9_190deg,#855AFC_251deg,#3A8BFD_267deg,#A3ECB3_314deg,#EAB308_360deg)]" />
          </div>
        </div>
      </div>
      <h2 className="animate-slide-up-fade mt-14 text-xl font-semibold text-neutral-900 dark:text-neutral-100 [--offset:10px] [animation-delay:250ms] [animation-duration:1s] [animation-fill-mode:both]">
        Добро пожаловать в&nbsp;QBS&nbsp;Автонайм
      </h2>
      <p className="animate-slide-up-fade mt-2 text-balance text-base text-neutral-500 dark:text-neutral-400 [--offset:10px] [animation-delay:500ms] [animation-duration:1s] [animation-fill-mode:both]">
        Интеллектуальная платформа для автоматизации подбора персонала
        на&nbsp;основе технологий искусственного интеллекта.
      </p>
      <div className="animate-slide-up-fade mt-8 w-full [--offset:10px] [animation-delay:750ms] [animation-duration:1s] [animation-fill-mode:both]">
        <Button
          onClick={onGetStarted}
          className="group flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 text-sm transition-all border-black bg-black dark:bg-white dark:border-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:ring-4 hover:ring-neutral-200 dark:hover:ring-neutral-800"
        >
          <div className="min-w-0 truncate">Начать</div>
        </Button>
      </div>
    </div>
  );
}
