"use client";

interface ChatHeaderProps {
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  isProcessing: boolean;
}

export function ChatHeader({ status, isProcessing }: ChatHeaderProps) {
  const getStatusText = () => {
    if (status === "COMPLETED") return "Интервью завершено";
    if (status === "CANCELLED") return "Интервью отменено";
    if (isProcessing) return "Обрабатывается…";
    return "AI Интервью";
  };

  const getStatusColor = () => {
    if (status === "COMPLETED") return "text-green-600";
    if (status === "CANCELLED") return "text-red-600";
    if (isProcessing) return "text-blue-600";
    return "text-gray-900";
  };

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div>
          <h1 className={`text-lg font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </h1>
          {status === "ACTIVE" && !isProcessing && (
            <p className="text-sm text-gray-500">
              Отвечайте на вопросы AI-ассистента
            </p>
          )}
        </div>
        {isProcessing && (
          <output
            className="flex items-center gap-2 text-sm text-blue-600"
            aria-live="polite"
          >
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Обработка</span>
          </output>
        )}
      </div>
    </header>
  );
}
