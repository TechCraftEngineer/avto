# Performance Guidelines

Рекомендации по оптимизации производительности компонентов на основе лучших практик от Vercel Engineering.

## React Compiler

Если в проекте включен React Compiler, многие оптимизации выполняются автоматически:

- Автоматическая мемоизация компонентов
- Оптимизация re-renders
- Удаление неиспользуемых зависимостей

## Bundle Size Optimization

### 1. Прямые импорты вместо barrel files

```typescript
// ❌ Замедляет сборку, увеличивает bundle
import { Button, Input } from '@qbs-autonaim/ui';

// ✅ Оптимизированный импорт
import Button from '@qbs-autonaim/ui/Button';
import Input from '@qbs-autonaim/ui/Input';
```

### 2. Динамические импорты для тяжелых компонентов

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('./components/HeavyChart'),
  { ssr: false }
);
```

### 3. Ленивая загрузка по взаимодействию

```typescript
function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Показать график
      </button>
      {showChart && <HeavyChart />}
    </div>
  );
}
```

## Server Components (по умолчанию)

### 1. Используйте Server Components для статичного контента

```typescript
// ✅ Server Component для статичных данных
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId);
  return <div>{user.name}</div>;
}
```

### 2. Client Components только при необходимости

```typescript
// ✅ Client Component только для интерактивности
'use client';

function InteractiveButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click me</button>;
}
```

## Suspense Boundaries

### 1. Стратегическое использование Suspense

```typescript
function Page() {
  return (
    <div>
      <Header /> {/* Показывается сразу */}
      <Suspense fallback={<Skeleton />}>
        <DataComponent /> {/* Загружается асинхронно */}
      </Suspense>
      <Footer /> {/* Показывается сразу */}
    </div>
  );
}
```

### 2. Совместное использование Promise

```typescript
function Page() {
  const dataPromise = fetchData();

  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <Chart dataPromise={dataPromise} />
        <Stats dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}
```

## Re-render Optimization

### 1. Правильное использование useCallback и useMemo

```typescript
// ✅ Мемоизация тяжелых вычислений
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// ✅ Стабильные колбэки
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data);
}, []);
```

### 2. Избегайте лишних зависимостей

```typescript
// ❌ Зависимость от объекта
useEffect(() => {
  console.log(user.id);
}, [user]); // Перезапускается при любом изменении user

// ✅ Зависимость от примитивного значения
useEffect(() => {
  console.log(user.id);
}, [user.id]); // Перезапускается только при изменении id
```

### 3. Функциональные обновления состояния

```typescript
// ✅ Безопасное обновление на основе предыдущего состояния
const [count, setCount] = useState(0);

const increment = useCallback(() => {
  setCount(prev => prev + 1);
}, []);
```

## Другие оптимизации

### 1. Content Visibility для длинных списков

```typescript
// CSS
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

### 2. Оптимизация изображений

```typescript
import Image from 'next/image';

// ✅ Автоматическая оптимизация
<Image
  src={user.avatar}
  width={40}
  height={40}
  alt={user.name}
/>
```

### 3. Кэширование API запросов

```typescript
import { useSWR } from 'swr';

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSWR(`/api/users/${userId}`, fetcher);
  // Автоматическое кэширование и дедупликация
}
```

## Мониторинг производительности

### 1. React DevTools Profiler
Используйте React DevTools для анализа re-renders и производительности компонентов.

### 2. Lighthouse
Регулярно проверяйте показатели производительности с помощью Lighthouse.

### 3. Bundle Analyzer
Анализируйте размер бандла с помощью `@next/bundle-analyzer`.

## Ссылки

- [Vercel React Best Practices](https://github.com/vercel/react-best-practices)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React Compiler](https://react.dev/learn/react-compiler)