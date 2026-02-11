# Интеграция PostHog

PostHog интегрирован в приложение для аналитики пользовательского поведения.

**Важно:** PostHog работает только в production окружении (VERCEL_ENV=production).

## Настройка

1. Добавьте переменные окружения в `.env`:

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

2. Получите ключ API в настройках проекта PostHog

## Использование

### Базовое отслеживание событий

```tsx
import { usePostHog } from "~/hooks/use-posthog";
import { POSTHOG_EVENTS } from "~/lib/posthog-events";

function MyComponent() {
  const { capture, isEnabled } = usePostHog();

  const handleAction = () => {
    // Автоматически проверяет окружение
    capture(POSTHOG_EVENTS.VACANCY_CREATED, {
      vacancyId: "123",
      title: "Разработчик",
    });
  };

  return <button onClick={handleAction}>Создать вакансию</button>;
}
```

### Идентификация пользователя

```tsx
import { PostHogAuthTracker } from "~/components";

function Layout({ user }) {
  return (
    <>
      <PostHogAuthTracker user={user} />
      {/* остальной контент */}
    </>
  );
}
```

### Прямой доступ к PostHog

```tsx
import { usePostHog } from "~/hooks/use-posthog";

function AdvancedComponent() {
  const { posthog, isEnabled } = usePostHog();

  useEffect(() => {
    if (!isEnabled) return;

    // Установка свойств пользователя
    posthog.people.set({
      plan: "premium",
      company: "Acme Inc",
    });

    // Feature flags
    const isFeatureEnabled = posthog.isFeatureEnabled("new-ui");
  }, [posthog, isEnabled]);
}
```

## Автоматическое отслеживание

- Просмотры страниц отслеживаются автоматически (только в production)
- Навигация между страницами фиксируется
- Выход со страницы (pageleave) записывается

## Окружения

- **Production**: PostHog полностью активен
- **Development/Preview**: PostHog отключен, все вызовы игнорируются

## Конфиденциальность

- Профили пользователей создаются только для идентифицированных пользователей
- При выходе из системы вызывается `reset()` для очистки данных
- Данные собираются только в production окружении
