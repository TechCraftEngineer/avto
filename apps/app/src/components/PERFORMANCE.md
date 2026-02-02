# Performance Guidelines

Рекомендации по оптимизации производительности компонентов на основе лучших практик от Vercel Engineering и TanStack Query.

## React Compiler

Если в проекте включен React Compiler, многие оптимизации выполняются автоматически:

- Автоматическая мемоизация компонентов
- Оптимизация re-renders
- Удаление неиспользуемых зависимостей

**Важно**: С React Compiler можно избегать ручной мемоизации (`useMemo`, `useCallback`) в большинстве случаев.

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

### 1. React Compiler делает большую часть работы

С включенным React Compiler ручная мемоизация часто не нужна. Используйте `useCallback` и `useMemo` только когда:
- Передаете функции в сторонние библиотеки
- Есть измеримые проблемы с производительностью
- Зависимости используются в других хуках

```typescript
// ✅ React Compiler автоматически оптимизирует
function Component({ data }: { data: Data[] }) {
  const processedData = data.map(item => transform(item));
  
  const handleClick = () => {
    console.log('clicked');
  };

  return <Child data={processedData} onClick={handleClick} />;
}

// ✅ Мемоизация нужна для тяжелых вычислений
const processedData = useMemo(() => {
  return expensiveCalculation(rawData); // > 10ms
}, [rawData]);

// ✅ useCallback для сторонних библиотек
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data);
}, []); // Библиотека форм ожидает стабильную ссылку
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

const increment = () => {
  setCount(prev => prev + 1); // Не требует зависимости от count
};
```

### 4. Разделение состояния

```typescript
// ❌ Одно большое состояние
const [state, setState] = useState({ name: '', email: '', age: 0 });

// ✅ Разделенное состояние
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [age, setAge] = useState(0);
// Обновление name не вызовет re-render компонентов, использующих email
```

## React Query (TanStack Query) Optimization

### 1. Правильная настройка staleTime и cacheTime

```typescript
// ✅ Глобальная конфигурация
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 минута - данные считаются свежими
      gcTime: 5 * 60 * 1000, // 5 минут - время хранения в кэше (ранее cacheTime)
      refetchOnWindowFocus: false, // Отключить рефетч при фокусе окна
      retry: 1, // Одна попытка повтора при ошибке
    },
  },
});

// ✅ Индивидуальная настройка для статичных данных
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: Infinity, // Данные никогда не устаревают
});

// ✅ Для часто меняющихся данных
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 0, // Всегда рефетчить
  refetchInterval: 30000, // Обновлять каждые 30 секунд
});
```

### 2. Prefetching для улучшения UX

```typescript
// ✅ Prefetch при наведении
function UserCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
    });
  };

  return <div onMouseEnter={handleMouseEnter}>...</div>;
}

// ✅ Prefetch на сервере (Server Components)
async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserList />
    </HydrationBoundary>
  );
}
```

### 3. Оптимизация с помощью select

```typescript
// ✅ Избегайте лишних re-renders с помощью select
const { data: userName } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  select: (user) => user.name, // Компонент обновится только при изменении имени
});

// ✅ Трансформация данных
const { data: activeUsers } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  select: (users) => users.filter(u => u.isActive),
});
```

### 4. Параллельные запросы

```typescript
// ✅ Параллельное выполнение независимых запросов
function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  // Оба запроса выполняются параллельно
}

// ✅ useQueries для динамического списка
function MultiUserView({ userIds }: { userIds: string[] }) {
  const queries = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id),
      staleTime: 60000,
    })),
  });

  const isLoading = queries.some(q => q.isLoading);
}
```

### 5. Зависимые запросы

```typescript
// ✅ Правильная последовательность зависимых запросов
function UserProjects({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => fetchProjects(user!.id),
    enabled: !!user, // Запрос выполнится только после загрузки user
  });
}
```

### 6. Оптимистичные обновления

```typescript
// ✅ Оптимистичное обновление для мгновенного UX
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    // Отменяем текущие запросы
    await queryClient.cancelQueries({ queryKey: ['user', newUser.id] });

    // Сохраняем предыдущее значение
    const previousUser = queryClient.getQueryData(['user', newUser.id]);

    // Оптимистично обновляем
    queryClient.setQueryData(['user', newUser.id], newUser);

    return { previousUser };
  },
  onError: (err, newUser, context) => {
    // Откатываем при ошибке
    queryClient.setQueryData(['user', newUser.id], context?.previousUser);
  },
  onSettled: (data, error, variables) => {
    // Инвалидируем после завершения
    queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
  },
});
```

### 7. Инвалидация кэша

```typescript
// ✅ Точечная инвалидация
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    // Инвалидируем только список постов
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});

// ✅ Инвалидация по паттерну
queryClient.invalidateQueries({ 
  queryKey: ['posts'], 
  exact: false // Инвалидирует ['posts'], ['posts', 1], ['posts', 2] и т.д.
});

// ✅ Ручное обновление без рефетча
queryClient.setQueryData(['posts'], (old) => [...old, newPost]);
```

### 8. Suspense режим

```typescript
// ✅ Использование Suspense для декларативной загрузки
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // data всегда определена, нет проверок на loading
  return <div>{user.name}</div>;
}

// Обертка с Suspense
function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

## Другие оптимизации

### 1. Виртуализация длинных списков

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5, // Рендерим 5 дополнительных элементов за пределами видимости
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Content Visibility для длинных списков

```css
/* CSS */
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

### 3. Оптимизация изображений

```typescript
import Image from 'next/image';

// ✅ Автоматическая оптимизация
<Image
  src={user.avatar}
  width={40}
  height={40}
  alt={user.name}
  loading="lazy"
  placeholder="blur"
/>

// ✅ Приоритетная загрузка для LCP
<Image
  src={hero.image}
  priority
  fill
  alt={hero.title}
/>
```

### 4. Debounce для поисковых запросов

```typescript
import { useDeferredValue } from 'react';

function SearchResults() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const { data } = useQuery({
    queryKey: ['search', deferredSearch],
    queryFn: () => searchAPI(deferredSearch),
    enabled: deferredSearch.length > 2,
  });

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <Results data={data} />
    </>
  );
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