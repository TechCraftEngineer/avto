# QBS Platform Overview Video

Видео-обзор платформы QBS, созданное с помощью Remotion.

## Запуск

### Предварительный просмотр
```bash
cd apps/web
bun remotion:preview
```

### Рендеринг видео
```bash
cd apps/web
bun remotion:render
```

Видео будет сохранено в `apps/web/public/videos/qbs-platform-overview-demo.mp4`

## Структура

- **Root.tsx** - главный компонент с композициями
- **compositions/PlatformOverview.tsx** - основная композиция с переходами между сценами
- **scenes/** - отдельные сцены:
  - DashboardScene - дашборд с метриками
  - CandidatesScene - список кандидатов
  - AIScreeningScene - AI-анализ резюме
  - InterviewScene - интерфейс интервью
  - AnalyticsScene - аналитика и воронка найма

## Параметры видео

- Длительность: 45 секунд
- FPS: 30
- Разрешение: 1920x1080 (16:9)
- Формат: MP4 (H.264)

## Кастомизация

Вы можете изменить:
- Тайминги сцен в `compositions/PlatformOverview.tsx`
- Контент и анимации в файлах сцен
- Цвета градиентов
- Данные (метрики, кандидаты, навыки)
