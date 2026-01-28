# Генерация видео с Remotion

## Быстрый старт

### 1. Предпросмотр видео
```bash
cd apps/web
bun remotion:preview
```

Откроется браузер с интерфейсом Remotion, где вы сможете:
- Просмотреть видео в реальном времени
- Изменить параметры
- Протестировать анимации

### 2. Рендеринг финального видео
```bash
cd apps/web
bun remotion:render
```

Видео будет сохранено в `apps/web/public/videos/qbs-platform-overview-demo.mp4`

## Что включено

Видео состоит из 5 сцен по 9 секунд каждая:

1. **Dashboard** (0-9с) - Метрики и статистика
2. **Candidates** (9-18с) - Список кандидатов с match score
3. **AI-Screening** (18-27с) - Анализ навыков
4. **Interview** (27-36с) - Чат-интерфейс интервью
5. **Analytics** (36-45с) - Воронка найма и метрики

## Кастомизация

### Изменить тайминги
Отредактируйте `src/remotion/compositions/PlatformOverview.tsx`:

```typescript
const scenes = [
  { start: 0, duration: 9, component: DashboardScene },
  // измените duration для каждой сцены
];
```

### Изменить данные
Каждая сцена имеет свои данные:
- `DashboardScene.tsx` - метрики дашборда
- `CandidatesScene.tsx` - список кандидатов
- `AIScreeningScene.tsx` - навыки для анализа
- `InterviewScene.tsx` - сообщения чата
- `AnalyticsScene.tsx` - метрики аналитики

### Изменить цвета
Каждая сцена использует свой градиент в `background`:
```typescript
background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
```

## Требования

- Node.js 18+
- Bun
- FFmpeg (устанавливается автоматически при первом рендере)

## Экспорт в другие форматы

### GIF
```bash
remotion render src/remotion/index.ts PlatformOverview out.gif --codec gif
```

### WebM
```bash
remotion render src/remotion/index.ts PlatformOverview out.webm --codec vp8
```

### Разные разрешения
```bash
remotion render src/remotion/index.ts PlatformOverview out.mp4 --width 1280 --height 720
```
