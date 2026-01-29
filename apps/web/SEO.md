# SEO для QBS Автонайм

## Созданные файлы

### Основные SEO-файлы
- `public/robots.txt` - правила для поисковых роботов
- `src/app/sitemap.ts` - карта сайта
- `src/app/manifest.ts` - манифест PWA
- `public/browserconfig.xml` - конфигурация для Windows
- `public/humans.txt` - информация о команде
- `public/.well-known/security.txt` - контакты безопасности

### Утилиты и компоненты
- `src/lib/seo.ts` - функции для генерации метаданных
- `src/lib/seo-constants.ts` - константы для SEO
- `src/components/seo/structured-data.tsx` - компонент для структурированных данных
- `src/components/seo/breadcrumbs.tsx` - хлебные крошки

## Использование

### Добавление метаданных на страницу

```typescript
// src/app/your-page/page.tsx
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "Заголовок страницы",
  description: "Описание страницы",
  keywords: ["ключевое слово 1", "ключевое слово 2"],
  canonical: "/your-page",
})
```

### Добавление структурированных данных

```typescript
import { StructuredData } from "@/components/seo"
import { structuredData } from "@/lib/seo"

export default function Page() {
  return (
    <>
      <StructuredData data={structuredData.organization} />
      {/* Контент страницы */}
    </>
  )
}
```

### Добавление хлебных крошек

```typescript
import { Breadcrumbs } from "@/components/seo"

export default function Page() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Блог", url: "/blog" },
          { name: "Статья", url: "/blog/article" },
        ]}
      />
      {/* Контент страницы */}
    </>
  )
}
```

### Типы структурированных данных

- `structuredData.organization` - информация об организации
- `structuredData.softwareApplication` - информация о приложении
- `structuredData.faqPage(faqs)` - страница с вопросами и ответами
- `structuredData.article(article)` - статья блога
- `structuredData.breadcrumb(items)` - хлебные крошки

## Проверка SEO

### Инструменты для проверки
1. Google Search Console - https://search.google.com/search-console
2. Яндекс.Вебмастер - https://webmaster.yandex.ru
3. Schema.org Validator - https://validator.schema.org
4. Google Rich Results Test - https://search.google.com/test/rich-results

### Чек-лист
- [ ] robots.txt доступен по адресу /robots.txt
- [ ] Sitemap доступен по адресу /sitemap.xml
- [ ] Все страницы имеют уникальные title и description
- [ ] Структурированные данные валидны
- [ ] Open Graph теги настроены
- [ ] Canonical URL указаны корректно
- [ ] Изображения имеют alt-теги
- [ ] Страницы загружаются быстро (Core Web Vitals)

## Оптимизация производительности

### Настройки Next.js
- Включено сжатие (compress: true)
- Отключен заголовок X-Powered-By
- Настроены заголовки безопасности
- Настроены редиректы

### Рекомендации
- Используйте компонент Image из next/image
- Оптимизируйте шрифты через next/font
- Минимизируйте JavaScript бандлы
- Используйте lazy loading для изображений
