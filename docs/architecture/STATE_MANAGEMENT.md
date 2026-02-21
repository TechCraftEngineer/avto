# Управление состоянием

## Стратегия управления состоянием

Проект использует разные инструменты для разных типов состояния:

```
┌─────────────────────────────────────────────────────────┐
│                    Типы состояния                        │
├─────────────────────────────────────────────────────────┤
│ Server State    → TanStack Query + tRPC                 │
│ Global Client   → Zustand                               │
│ Local UI        → useState                              │
│ Form            → React Hook Form                       │
│ URL             → nuqs                                  │
└─────────────────────────────────────────────────────────┘
```

## 1. Server State (TanStack Query + tRPC)

**Когда использовать**: Данные с сервера (вакансии, кандидаты, workspace и т.д.)

### Queries (чтение данных)

```typescript
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";

export function useVacancy(id: string) {
  const api = useTRPC();
  
  return useQuery(
    api.vacancy.get.queryOptions({ id })
  );
}

// Использование
function VacancyDetail({ id }: Props) {
  const { data: vacancy, isLoading, error } = useVacancy(id);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error error={error} />;
  if (!vacancy) return <NotFound />;
  
  return <div>{vacancy.title}</div>;
}
```

### Mutations (изменение данных)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useVacancyOperations(workspaceId: string) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    api.vacancy.update.mutationOptions({
      onSuccess: () => {
        // Инвалидация кэша
        queryClient.invalidateQueries({
          queryKey: api.vacancy.list.queryKey({ workspaceId }),
        });
        toast.success("Вакансия обновлена");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  return {
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
```

### Оптимистичные обновления

```typescript
export function useVacancyOptimisticUpdate(workspaceId: string) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    api.vacancy.update.mutationOptions({
      onMutate: async (newData) => {
        // Отменяем текущие запросы
        await queryClient.cancelQueries({
          queryKey: api.vacancy.get.queryKey({ id: newData.id }),
        });
        
        // Сохраняем предыдущее значение
        const previousVacancy = queryClient.getQueryData(
          api.vacancy.get.queryKey({ id: newData.id })
        );
        
        // Оптимистично обновляем
        queryClient.setQueryData(
          api.vacancy.get.queryKey({ id: newData.id }),
          (old) => ({ ...old, ...newData })
        );
        
        return { previousVacancy };
      },
      onError: (err, newData, context) => {
        // Откатываем при ошибке
        if (context?.previousVacancy) {
          queryClient.setQueryData(
            api.vacancy.get.queryKey({ id: newData.id }),
            context.previousVacancy
          );
        }
        toast.error(err.message);
      },
      onSettled: (data, error, variables) => {
        // Синхронизируем с сервером
        queryClient.invalidateQueries({
          queryKey: api.vacancy.get.queryKey({ id: variables.id }),
        });
      },
    })
  );
}
```

### Prefetching

```typescript
// Server-side prefetch
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createServerSideHelpers } from "@trpc/tanstack-react-query/server";

export default async function VacancyPage({ params }: Props) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(),
  });
  
  // Prefetch на сервере
  await helpers.vacancy.get.prefetch({ id: params.id });
  
  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <VacancyDetail id={params.id} />
    </HydrationBoundary>
  );
}

// Client-side prefetch
function VacancyList() {
  const queryClient = useQueryClient();
  const api = useTRPC();
  
  const handleMouseEnter = (id: string) => {
    // Prefetch при hover
    queryClient.prefetchQuery(
      api.vacancy.get.queryOptions({ id })
    );
  };
  
  return <div onMouseEnter={() => handleMouseEnter(id)}>...</div>;
}
```

## 2. Global Client State (Zustand)

**Когда использовать**: Глобальное клиентское состояние (фильтры, UI preferences, модальные окна)

### Базовый store

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VacancyFiltersStore {
  filters: VacancyFilters;
  setFilters: (filters: VacancyFilters) => void;
  resetFilters: () => void;
}

export const useVacancyFiltersStore = create<VacancyFiltersStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name: 'vacancy-filters', // localStorage key
    }
  )
);

// Использование
function VacancyFilters() {
  const { filters, setFilters } = useVacancyFiltersStore();
  
  return (
    <Select
      value={filters.status}
      onValueChange={(status) => setFilters({ ...filters, status })}
    />
  );
}
```

### Store с actions

```typescript
interface ModalStore {
  modals: Record<string, boolean>;
  open: (id: string) => void;
  close: (id: string) => void;
  toggle: (id: string) => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  modals: {},
  open: (id) => set((state) => ({
    modals: { ...state.modals, [id]: true }
  })),
  close: (id) => set((state) => ({
    modals: { ...state.modals, [id]: false }
  })),
  toggle: (id) => set((state) => ({
    modals: { ...state.modals, [id]: !state.modals[id] }
  })),
}));
```

### Selectors для оптимизации

```typescript
// ❌ Плохо: Компонент ре-рендерится при любом изменении store
function Component() {
  const store = useVacancyFiltersStore();
  return <div>{store.filters.status}</div>;
}

// ✅ Правильно: Компонент ре-рендерится только при изменении status
function Component() {
  const status = useVacancyFiltersStore((state) => state.filters.status);
  return <div>{status}</div>;
}
```

## 3. Local UI State (useState)

**Когда использовать**: Локальное UI состояние (открыт/закрыт, hover, focus)

```typescript
function VacancyCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Свернуть' : 'Развернуть'}
      </Button>
      {isExpanded && <Details />}
    </Card>
  );
}
```

## 4. Form State (React Hook Form)

**Когда использовать**: Формы с валидацией

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const vacancyFormSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
});

type VacancyFormValues = z.infer<typeof vacancyFormSchema>;

function VacancyForm() {
  const form = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancyFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = (values: VacancyFormValues) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Сохранить</Button>
      </form>
    </Form>
  );
}
```

## 5. URL State (nuqs)

**Когда использовать**: Состояние, которое должно быть в URL (фильтры, пагинация, табы)

```typescript
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';

function VacancyList() {
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [status, setStatus] = useQueryState('status', parseAsString);
  
  return (
    <div>
      <Input
        value={search ?? ''}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select
        value={status ?? 'all'}
        onValueChange={setStatus}
      />
      <Pagination
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
```

## Правила выбора инструмента

```typescript
// Server State → TanStack Query + tRPC
const { data } = useQuery(api.vacancy.get.queryOptions({ id }));

// Global Client State → Zustand
const filters = useVacancyFiltersStore((state) => state.filters);

// Local UI State → useState
const [isOpen, setIsOpen] = useState(false);

// Form State → React Hook Form
const form = useForm<FormValues>();

// URL State → nuqs
const [search, setSearch] = useQueryState('search');
```

## Антипаттерны

### ❌ Дублирование server state в client state

```typescript
// ❌ Плохо: Дублирование данных
function Component() {
  const { data } = useQuery(api.vacancy.get.queryOptions({ id }));
  const [vacancy, setVacancy] = useState(data); // Дублирование!
  
  return <div>{vacancy?.title}</div>;
}

// ✅ Правильно: Используйте server state напрямую
function Component() {
  const { data: vacancy } = useQuery(api.vacancy.get.queryOptions({ id }));
  
  return <div>{vacancy?.title}</div>;
}
```

### ❌ Использование useState для server state

```typescript
// ❌ Плохо: useState для server данных
function Component() {
  const [vacancy, setVacancy] = useState(null);
  
  useEffect(() => {
    fetch('/api/vacancy').then(setVacancy);
  }, []);
  
  return <div>{vacancy?.title}</div>;
}

// ✅ Правильно: TanStack Query для server данных
function Component() {
  const { data: vacancy } = useQuery(
    api.vacancy.get.queryOptions({ id })
  );
  
  return <div>{vacancy?.title}</div>;
}
```

### ❌ Prop drilling вместо хуков/контекста

```typescript
// ❌ Плохо: Prop drilling
<Parent filters={filters} setFilters={setFilters}>
  <Child filters={filters} setFilters={setFilters}>
    <GrandChild filters={filters} setFilters={setFilters} />
  </Child>
</Parent>

// ✅ Правильно: Zustand store
function GrandChild() {
  const { filters, setFilters } = useVacancyFiltersStore();
  return <div>...</div>;
}
```

## Чеклист

- [ ] Server state через TanStack Query + tRPC
- [ ] Global client state через Zustand
- [ ] Local UI state через useState
- [ ] Form state через React Hook Form
- [ ] URL state через nuqs
- [ ] Нет дублирования server state
- [ ] Нет prop drilling
- [ ] Используются selectors для оптимизации
- [ ] Оптимистичные обновления где нужно
- [ ] Prefetching для улучшения UX
