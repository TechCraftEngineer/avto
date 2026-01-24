# AI Agents (AI SDK 6)

Новое поколение агентов на базе AI SDK 6 `ToolLoopAgent`.

## Основные улучшения

✅ **Автоматический парсинг** - Zod схемы валидируются автоматически  
✅ **Structured Output** - Типизированные ответы из коробки  
✅ **Tools Support** - Возможность добавлять инструменты для агентов  
✅ **Loop Control** - Встроенное управление multi-step выполнением  
✅ **Меньше кода** - Убрали весь ручной парсинг JSON  

## Доступные агенты

### Интервью агенты

#### InterviewerAgent
Проводит интервью с кандидатом.

```typescript
import { InterviewerAgent } from "@qbs-autonaim/ai";

const agent = new InterviewerAgent({ model: getAIModel() });

const result = await agent.execute({
  currentAnswer: "У меня 5 лет опыта в React",
  currentQuestion: "Расскажите о вашем опыте",
  previousQA: [],
  questionNumber: 1,
}, context);
```

#### EscalationDetectorAgent
Определяет необходимость эскалации к человеку.

```typescript
import { EscalationDetectorAgent } from "@qbs-autonaim/ai";

const agent = new EscalationDetectorAgent({ model: getAIModel() });

const result = await agent.execute({
  message: "Хочу поговорить с живым человеком",
  conversationLength: 5,
}, context);
```

#### InterviewCompletionAgent
Генерирует финальное сообщение после интервью.

```typescript
import { InterviewCompletionAgent } from "@qbs-autonaim/ai";

const agent = new InterviewCompletionAgent({ model: getAIModel() });

const result = await agent.execute({
  questionCount: 5,
  score: 4,
}, context);
```

#### InterviewOrchestrator
Координирует работу всех агентов для голосовых интервью.

```typescript
import { InterviewOrchestrator } from "@qbs-autonaim/ai";

const orchestrator = new InterviewOrchestrator({
  model: getAIModel(),
  maxSteps: 10,
});

const result = await orchestrator.execute(input, context);
```

#### WebInterviewOrchestrator
Координирует работу всех агентов для WEB интервью со стримингом.

```typescript
import { WebInterviewOrchestrator } from "@qbs-autonaim/ai";

const orchestrator = new WebInterviewOrchestrator({
  model: getAIModel(),
});

const result = await orchestrator.execute({
  message: "Здравствуйте!",
  history: [],
}, context);
```

### Рекрутерские агенты

#### IntentClassifierAgent
Классифицирует намерение пользователя.

```typescript
import { IntentClassifierAgent } from "@qbs-autonaim/ai";

const agent = new IntentClassifierAgent({ model: getAIModel() });

const result = await agent.execute({
  message: "Найди кандидатов на позицию frontend разработчика",
  conversationHistory: [],
}, context);
```

#### CandidateSearchAgent
Ищет кандидатов по заданным критериям.

```typescript
import { CandidateSearchAgent } from "@qbs-autonaim/ai";

const agent = new CandidateSearchAgent({ model: getAIModel() });

const result = await agent.execute({
  position: "Frontend Developer",
  skills: ["React", "TypeScript"],
  experience: 3,
}, context);
```

#### ContentGeneratorAgent
Генерирует контент вакансий (заголовки, описания, требования).

```typescript
import { ContentGeneratorAgent } from "@qbs-autonaim/ai";

const agent = new ContentGeneratorAgent({ model: getAIModel() });

const result = await agent.execute({
  type: "full_vacancy",
  position: "Frontend Developer",
  context: {
    company: "TechCorp",
    industry: "IT",
    skills: ["React", "TypeScript", "Next.js"],
    experience: 3,
    salaryFrom: 100000,
    salaryTo: 150000,
    location: "Москва",
    remote: true,
  },
}, context);
```

#### CommunicationAgent
Генерирует персонализированные сообщения для кандидатов.

```typescript
import { CommunicationAgent } from "@qbs-autonaim/ai";

const agent = new CommunicationAgent({ model: getAIModel() });

const result = await agent.execute({
  type: "invite",
  candidate: {
    id: "123",
    name: "Иван Иванов",
    position: "Frontend Developer",
    experience: 3,
    skills: ["React", "TypeScript"],
  },
  vacancy: {
    id: "vac123",
    title: "Frontend Developer",
    company: "TechCorp",
  },
  channel: "email",
}, context);
```

## Конфигурация

```typescript
interface AgentConfig {
  model: LanguageModel;        // AI модель
  maxSteps?: number;            // Максимум шагов (default: 25)
  langfuse?: Langfuse;         // Langfuse для трассировки
  traceId?: string;            // ID трассировки
  tools?: ToolSet;             // Инструменты для агентов
}
```

## Фабрика агентов

Для удобного создания агентов используйте `AgentFactory`:

```typescript
import { AgentFactory } from "@qbs-autonaim/ai";
import { getAIModel } from "@qbs-autonaim/lib";

const factory = new AgentFactory({
  model: getAIModel(),
  langfuse: getLangfuseInstance(),
  maxSteps: 10,
});

// Создание интервью агента
const interviewer = factory.createInterviewer();

// Создание рекрутерского агента
const intentClassifier = factory.createIntentClassifierAgent();
```

## Архитектура

```
BaseAgent (абстрактный)
├── Интервью агенты
│   ├── InterviewerAgent
│   ├── EscalationDetectorAgent
│   ├── InterviewCompletionAgent
│   ├── InterviewOrchestrator
│   └── WebInterviewOrchestrator
├── Рекрутерские агенты
│   ├── IntentClassifierAgent
│   ├── CandidateSearchAgent
│   ├── ContentGeneratorAgent
│   ├── CommunicationAgent
│   ├── VacancyAnalyticsAgent
│   ├── PriorityAgent
│   ├── InterviewQuestionsAgent
│   ├── CareerTrajectoryAgent
│   ├── CandidateEvaluatorAgent
│   ├── ComparisonAgent
│   ├── RecommendationAgent
│   └── SummaryAgent
└── Дополнительные агенты
    ├── ContextAnalyzerAgent
    ├── GreetingDetectorAgent
    ├── ResumeStructurerAgent
    ├── SalaryExtractionAgent
    ├── BotUsageDetectorAgent
    └── BotSummaryAnalyzerAgent
```

Каждый агент:
1. Наследуется от `BaseAgent`
2. Определяет Zod схему для output
3. Реализует `validate()` и `buildPrompt()`
4. Автоматически получает structured output через AI SDK
## Структура папок

После рефакторинга агенты организованы по функциональным группам:

```
agents/
├── core/              # Базовые компоненты
│   ├── base-agent.ts
│   ├── agent-factory.ts
│   ├── config.ts
│   └── types.ts
│
├── interview/         # Интервью агенты
│   ├── types.ts
│   ├── prompts.ts
│   ├── web-orchestrator.ts
│   └── index.ts
│
├── detection/         # Детекторы и анализаторы
│   ├── context-analyzer.ts
│   ├── escalation-detector.ts
│   ├── greeting-detector.ts
│   └── index.ts
│
├── handlers/          # Обработчики событий
│   ├── escalation-handler.ts
│   ├── pin-handler.ts
│   ├── welcome.ts
│   └── index.ts
│
├── extraction/        # Извлечение данных
│   ├── resume-structurer.ts
│   ├── salary-extraction.ts
│   └── index.ts
│
└── recruiter/         # Рекрутер агенты
    └── ...
```

## Импорты

```typescript
// Новый способ (рекомендуется)
import { WebInterviewOrchestrator } from "@qbs-autonaim/ai/agents/interview";
import { ContextAnalyzerAgent } from "@qbs-autonaim/ai/agents/detection";

// Старый способ (обратная совместимость)
import { WebInterviewOrchestrator, ContextAnalyzerAgent } from "@qbs-autonaim/ai/agents";
```
