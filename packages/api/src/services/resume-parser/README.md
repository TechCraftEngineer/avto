# Resume Parser Service

Сервис для парсинга резюме из различных форматов документов с использованием Docling и AI-структурирования.

## Возможности

- **Универсальный парсинг**: Поддержка PDF, DOCX, DOC через Docling
- **AI-структурирование**: Автоматическое извлечение структурированных данных (имя, контакты, опыт, образование, навыки)
- **Валидация**: Проверка формата, размера файла и качества извлечённого текста
- **Обработка ошибок**: Понятные сообщения об ошибках на русском языке

## Архитектура

```
ResumeParserService
  ├── DoclingProcessor (извлечение текста через API)
  └── AI Agent (структурирование данных)
```

## Настройка

### 1. Запуск Docling через Docker

```bash
# Запустить Docling сервис
docker-compose up -d docling

# Проверить статус
docker ps | grep docling
```

### 2. Переменные окружения

Добавьте в `.env`:

```env
# URL Docling API (docling-serve: порт 5001, Docker маппит 8001:5001)
DOCLING_API_URL='http://localhost:8001'

# API ключ (опционально для локального Docker)
DOCLING_API_KEY=''
```

### 3. Проверка работоспособности

```bash
# Проверить доступность API (порт соответствует DOCLING_API_URL)
curl http://localhost:8001/health
```

## Использование

### Базовый пример

```typescript
import { ResumeParserService } from "@qbs-autonaim/api";
import { openai } from "@ai-sdk/openai";

const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  doclingApiUrl: process.env.DOCLING_API_URL,
  doclingApiKey: process.env.DOCLING_API_KEY,
});

// Валидация формата
const validation = parser.validateFormat("resume.pdf");
if (!validation.isValid) {
  console.error(validation.error);
  return;
}

// Парсинг резюме
const result = await parser.parse({
  type: validation.fileType!,
  content: fileBuffer,
  filename: "resume.pdf",
});

console.log("Имя:", result.structured.personalInfo.name);
console.log("Email:", result.structured.personalInfo.email);
console.log("Опыт работы:", result.structured.experience.length);
console.log("Confidence:", result.confidence);
```

### С Langfuse мониторингом

```typescript
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
});

const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  langfuse,
});
```

### Кастомная конфигурация

```typescript
const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  config: {
    maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
    minTextLength: 100,
    aiTimeoutMs: 60000, // 60 секунд
  },
});
```

## Поддерживаемые форматы

| Формат | Расширение | Описание |
|--------|-----------|----------|
| PDF | `.pdf` | Portable Document Format |
| DOCX | `.docx` | Microsoft Word (2007+) |
| DOC | `.doc` | Microsoft Word (старые версии) |
| TXT | `.txt` | Простой текст |
| RTF | `.rtf` | Rich Text Format |
| ODT | `.odt` | OpenDocument Text |

## Структура данных

### ParsedResume

```typescript
interface ParsedResume {
  rawText: string;              // Извлечённый текст
  structured: StructuredResume; // Структурированные данные
  confidence: number;           // Уверенность (0-1)
}
```

### StructuredResume

```typescript
interface StructuredResume {
  personalInfo: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: Language[];
  summary: string | null;
}
```

## Обработка ошибок

```typescript
import { ResumeParserError } from "@qbs-autonaim/api";

try {
  const result = await parser.parse(input);
} catch (error) {
  if (error instanceof ResumeParserError) {
    console.error("Код:", error.code);
    console.error("Сообщение:", error.userMessage);
    console.error("Детали:", error.details);
    
    switch (error.code) {
      case "UNSUPPORTED_FORMAT":
        // Неподдерживаемый формат
        break;
      case "FILE_TOO_LARGE":
        // Файл слишком большой
        break;
      case "CORRUPTED_FILE":
        // Повреждённый файл
        break;
      case "EMPTY_CONTENT":
        // Пустой документ
        break;
      case "PARSE_FAILED":
        // Ошибка парсинга (сервис недоступен)
        break;
      case "AI_STRUCTURING_FAILED":
        // Ошибка AI структурирования
        break;
    }
  }
}
```

## Миграция с mammoth/pdf-parse

### Было (старый подход)

```typescript
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

// Для DOCX
const docxResult = await mammoth.extractRawText({ buffer: content });
const text = docxResult.value;

// Для PDF
const pdfData = await pdfParse(content);
const text = pdfData.text;
```

### Стало (новый подход)

```typescript
import { DoclingProcessor } from "@qbs-autonaim/document-processor";

const parser = new DoclingProcessor({
  apiUrl: process.env.DOCLING_API_URL,
});

// Универсально для всех форматов
const text = await parser.extractText(content, filename);
```

## Преимущества Docling

1. **Универсальность**: Один API для всех форматов документов
2. **Качество**: Высококачественное извлечение текста и структуры
3. **OCR**: Встроенная поддержка отсканированных документов
4. **Масштабируемость**: Отдельный сервис, легко масштабировать
5. **Структура**: Извлечение заголовков, таблиц, списков

## Troubleshooting

### Сервис недоступен

```
Error: Сервис обработки документов недоступен
```

**Решение**: Проверьте, что Docker контейнер запущен:

```bash
docker-compose up -d docling
docker logs docling
```

### Таймаут обработки

```
Error: Превышено время ожидания обработки документа
```

**Решение**: Увеличьте таймаут в конфигурации:

```typescript
const parser = new ResumeParserService({
  model: openai("gpt-4o-mini"),
  config: {
    aiTimeoutMs: 60000, // 60 секунд
  },
});
```

### Пустой текст

```
Error: Документ не содержит текста
```

**Решение**: Возможно, это отсканированный документ. Docling поддерживает OCR автоматически, но убедитесь что enableOcr включен.

## Дополнительные ресурсы

- [Docling Documentation](https://ds4sd.github.io/docling/)
- [Docling GitHub](https://github.com/DS4SD/docling)
