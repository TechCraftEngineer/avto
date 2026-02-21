# Паттерны компонентов

## Структура компонентов

Каждый домен компонентов должен следовать единой структуре:

```
components/{domain}/
├── components/          # UI компоненты
│   ├── {feature}/      # Группировка по фичам
│   │   ├── {component}.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/              # Бизнес-логика и state management
│   ├── use-{feature}.ts
│   └── index.ts
├── types/              # Локальные типы
│   ├── {feature}.ts
│   └── index.ts
├── utils/              # Утилиты
│   ├── {helper}.ts
│   └── index.ts
├── index.ts            # Публичный API
└── README.md           # Документация
```

## Разделение ответственности

### 1. Presentation Components (UI)

**Цель**: Чистый UI без бизнес-логики

```typescript
// ✅ Правильно: Чистый UI компонент
interface VacancyCardProps {
  vacancy: Vacancy;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function VacancyCard({ vacancy, onEdit, onDelete }: VacancyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{vacancy.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{vacancy.description}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onEdit(vacancy.id)}>Редактировать</Button>
        <Button onClick={() => onDelete(vacancy.id)} variant="destructive">
          Удалить
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Правила**:
- Только props и локальный UI state
- Никаких API вызовов
- Никакой бизнес-логики
- Легко тестировать
- Легко переиспользовать

### 2. Business Logic Hooks

**Цель**: Инкапсуляция бизнес-логики

```typescript
// ✅ Правильно: Хук с бизнес-логикой
export function useVacancyOperations(workspaceId: string) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    api.vacancy.update.mutationOptions({
      onSuccess: () => {
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

  const deleteMutation = useMutation(
    api.vacancy.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: api.vacancy.list.queryKey({ workspaceId }),
        });
        toast.success("Вакансия удалена");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  return {
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

**Правила**:
- Вся бизнес-логика в хуках
- API вызовы через tRPC
- Обработка ошибок
- Инвалидация кэша
- Возвращать простой API

### 3. Container Components

**Цель**: Связывание UI и бизнес-логики

```typescript
// ✅ Правильно: Контейнер связывает UI и логику
export function VacancyCardContainer({ vacancyId, workspaceId }: Props) {
  const api = useTRPC();
  const operations = useVacancyOperations(workspaceId);
  
  const { data: vacancy, isLoading } = useQuery(
    api.vacancy.get.queryOptions({ id: vacancyId })
  );

  if (isLoading) return <VacancyCardSkeleton />;
  if (!vacancy) return <VacancyCardEmpty />;

  return (
    <VacancyCard
      vacancy={vacancy}
      onEdit={operations.update}
      onDelete={operations.delete}
    />
  );
}
```

**Правила**:
- Минимальная логика
- Только связывание
- Обработка loading/error states
- Передача данных в UI компоненты

## Антипаттерны

### ❌ Смешивание UI и бизнес-логики

```typescript
// ❌ Плохо: Все в одном компоненте
export function VacancyCard({ vacancyId }: Props) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  
  // Бизнес-логика в UI компоненте
  const { data } = useQuery(api.vacancy.get.queryOptions({ id: vacancyId }));
  
  const updateMutation = useMutation(
    api.vacancy.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({...});
        toast.success("...");
      },
    })
  );
  
  // UI смешан с логикой
  return (
    <Card>
      <Button onClick={() => updateMutation.mutate({...})}>
        Обновить
      </Button>
    </Card>
  );
}
```

### ❌ Prop Drilling

```typescript
// ❌ Плохо: Прокидывание пропсов через много уровней
<VacancyList
  workspaceId={workspaceId}
  onUpdate={onUpdate}
  onDelete={onDelete}
  isUpdating={isUpdating}
  isDeleting={isDeleting}
>
  <VacancyItem
    workspaceId={workspaceId}
    onUpdate={onUpdate}
    onDelete={onDelete}
    isUpdating={isUpdating}
    isDeleting={isDeleting}
  >
    <VacancyCard
      workspaceId={workspaceId}
      onUpdate={onUpdate}
      onDelete={onDelete}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
    />
  </VacancyItem>
</VacancyList>

// ✅ Правильно: Используйте хуки или контекст
function VacancyCard() {
  const operations = useVacancyOperations(); // Хук доступен везде
  return <Card>...</Card>;
}
```

## Управление состоянием

### Server State (tRPC + TanStack Query)

```typescript
// ✅ Правильно: Server state через tRPC
export function useVacancy(id: string) {
  const api = useTRPC();
  
  return useQuery(
    api.vacancy.get.queryOptions({ id })
  );
}
```

### Client State (Zustand)

```typescript
// ✅ Правильно: Глобальный client state через Zustand
import { create } from 'zustand';

interface VacancyFiltersStore {
  filters: VacancyFilters;
  setFilters: (filters: VacancyFilters) => void;
  resetFilters: () => void;
}

export const useVacancyFiltersStore = create<VacancyFiltersStore>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
```

### UI State (useState)

```typescript
// ✅ Правильно: Локальный UI state через useState
export function VacancyCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return <Card>...</Card>;
}
```

### Form State (React Hook Form)

```typescript
// ✅ Правильно: Form state через React Hook Form
export function VacancyForm() {
  const form = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancyFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  
  return <Form {...form}>...</Form>;
}
```

## Композиция компонентов

### Compound Components Pattern

```typescript
// ✅ Правильно: Compound components для гибкости
export function VacancyCard({ children }: Props) {
  return <Card>{children}</Card>;
}

VacancyCard.Header = function VacancyCardHeader({ children }: Props) {
  return <CardHeader>{children}</CardHeader>;
};

VacancyCard.Title = function VacancyCardTitle({ children }: Props) {
  return <CardTitle>{children}</CardTitle>;
};

VacancyCard.Content = function VacancyCardContent({ children }: Props) {
  return <CardContent>{children}</CardContent>;
};

// Использование
<VacancyCard>
  <VacancyCard.Header>
    <VacancyCard.Title>Заголовок</VacancyCard.Title>
  </VacancyCard.Header>
  <VacancyCard.Content>
    Контент
  </VacancyCard.Content>
</VacancyCard>
```

### Render Props Pattern

```typescript
// ✅ Правильно: Render props для кастомизации
interface VacancyListProps {
  workspaceId: string;
  renderItem: (vacancy: Vacancy) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

export function VacancyList({ workspaceId, renderItem, renderEmpty }: VacancyListProps) {
  const { data: vacancies } = useVacancies(workspaceId);
  
  if (!vacancies?.length) {
    return renderEmpty?.() ?? <EmptyState />;
  }
  
  return (
    <div>
      {vacancies.map(renderItem)}
    </div>
  );
}

// Использование
<VacancyList
  workspaceId={workspaceId}
  renderItem={(vacancy) => <VacancyCard key={vacancy.id} vacancy={vacancy} />}
  renderEmpty={() => <CustomEmptyState />}
/>
```

## Тестирование

### UI компоненты

```typescript
// ✅ Правильно: Тестирование чистых UI компонентов
describe('VacancyCard', () => {
  it('renders vacancy data', () => {
    const vacancy = createMockVacancy();
    render(<VacancyCard vacancy={vacancy} onEdit={vi.fn()} onDelete={vi.fn()} />);
    
    expect(screen.getByText(vacancy.title)).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    const vacancy = createMockVacancy();
    render(<VacancyCard vacancy={vacancy} onEdit={onEdit} onDelete={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Редактировать'));
    expect(onEdit).toHaveBeenCalledWith(vacancy.id);
  });
});
```

### Хуки

```typescript
// ✅ Правильно: Тестирование хуков
describe('useVacancyOperations', () => {
  it('updates vacancy', async () => {
    const { result } = renderHook(() => useVacancyOperations('workspace-id'));
    
    act(() => {
      result.current.update({ id: 'vacancy-id', title: 'New Title' });
    });
    
    await waitFor(() => {
      expect(result.current.isUpdating).toBe(false);
    });
  });
});
```

## Чеклист для нового компонента

- [ ] Компонент в правильной папке (`components/{domain}/components/{feature}/`)
- [ ] Бизнес-логика вынесена в хуки (`hooks/use-{feature}.ts`)
- [ ] Типы определены (`types/{feature}.ts`)
- [ ] Компонент экспортирован через `index.ts`
- [ ] Нет prop drilling (используются хуки/контекст)
- [ ] Нет прямых API вызовов в UI компонентах
- [ ] Обработаны loading/error states
- [ ] Добавлены тесты
- [ ] Компонент доступен (accessibility)
- [ ] Компонент responsive

## Примеры из проекта

### Хорошие примеры

1. `components/vacancies/` - правильная структура
2. `components/gigs/` - разделение на hooks/components/types
3. `components/candidates/` - использование хуков для логики

### Требуют рефакторинга

1. Компоненты с прямыми API вызовами
2. Компоненты с бизнес-логикой внутри
3. Глубокий prop drilling
