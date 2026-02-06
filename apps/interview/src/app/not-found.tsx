import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="mb-2 text-7xl font-bold tracking-tight text-foreground">
          404
        </h1>

        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
          Страница не найдена
        </h2>

        <p className="mb-8 text-base text-muted-foreground">
          К сожалению, запрошенная страница не существует или была перемещена
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться на главную
        </Link>
      </div>
    </main>
  );
}
