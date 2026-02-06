export function LoadingScreen() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)]"
        style={{ backgroundSize: "64px 64px" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 animate-pulse">
        <div className="h-[400px] w-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,182,193,0.15)_0%,transparent_70%)] blur-3xl" />
      </div>
      <div className="pointer-events-none absolute left-1/4 top-20 animate-pulse delay-1000">
        <div className="h-[300px] w-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.15)_0%,transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30">
            <svg
              className="h-10 w-10 text-white animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-purple-400/20 animate-ping animation-delay-300" />
        </div>

        <div className="flex flex-col items-center gap-4 max-w-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce animation-delay-100" />
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce animation-delay-200" />
            </div>
            <span className="text-sm font-medium">Подготовка AI-интервью</span>
          </div>

          <div className="w-full max-w-xs">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-purple-600 rounded-full animate-pulse"
                style={{
                  width: "60%",
                  animation: "shimmer 2s infinite linear",
                }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground animate-fade-in">
              Загрузка персонализированных вопросов…
            </p>
            <p className="text-xs text-muted-foreground/70">
              Это займет всего несколько секунд
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animate-fade-in {
          animation: fadeIn 2s ease-in-out infinite alternate;
        }
        @keyframes fadeIn {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
