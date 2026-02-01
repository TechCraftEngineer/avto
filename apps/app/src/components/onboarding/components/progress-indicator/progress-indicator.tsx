interface ProgressIndicatorProps {
  currentStep: "organization" | "workspace";
}

const TOTAL_STEPS = 2;

const stepToNumber = (step: "organization" | "workspace"): number => {
  switch (step) {
    case "organization":
      return 1;
    case "workspace":
      return 2;
  }
};

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentStepNumber = stepToNumber(currentStep);

  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-label="Прогресс онбординга"
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={currentStepNumber}
    >
      <div
        className={`h-2 w-16 rounded-full transition-colors ${
          currentStep === "organization" ? "bg-primary" : "bg-primary/30"
        }`}
        aria-hidden="true"
      />
      <div
        className={`h-2 w-16 rounded-full transition-colors ${
          currentStep === "workspace" ? "bg-primary" : "bg-muted"
        }`}
        aria-hidden="true"
      />
    </div>
  );
}
