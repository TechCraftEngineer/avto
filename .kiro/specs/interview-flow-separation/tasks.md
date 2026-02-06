# План реализации: Разделение потоков интервью

## Обзор

Данный план описывает пошаговую реализацию рефакторинга системы интервью с использованием паттерна Strategy для разделения логики gig и vacancy интервью. Реализация будет выполнена на TypeScript с использованием AI SDK v6 и Zod v4 для валидации.

## Задачи

- [x] 1. Создать базовую инфраструктуру типов и интерфейсов
  - Создать структуру директорий для стратегий, промптов, инструментов, стадий и схем оценки
  - Определить branded типы для GigLike и VacancyLike
  - Создать интерфейс InterviewStrategy со всеми необходимыми методами
  - Создать типы для конфигурации стадий (InterviewStageConfig, StageTransitionConfig)
  - Создать вспомогательные типы (WelcomeMessageConfig, ContextCardConfig, TransitionContext)
  - _Requirements: 1.1, 4.1, 8.1, 11.1, 11.2, 11.3_

- [ ]* 1.1 Написать property test для консистентности типов
  - **Property 1: Консистентность фабрик стратегий**
  - **Validates: Requirements 1.5, 2.5, 5.5**

- [x] 2. Реализовать фабрику стратегий
  - [x] 2.1 Создать класс InterviewStrategyFactory с Map для хранения стратегий
    - Реализовать метод create(entityType) для создания стратегий
    - Реализовать метод register(entityType, factory) для регистрации новых стратегий
    - Реализовать метод isSupported(entityType) как type guard
    - Создать singleton экземпляр strategyFactory
    - Создать helper функцию getInterviewStrategy(gig, vacancy)
    - _Requirements: 1.5, 12.1, 12.2_

  - [ ]* 2.2 Написать property test для регистрации стратегий
    - **Property 11: Полный цикл регистрации новой стратегии**
    - **Validates: Requirements 12.1, 12.2, 12.4**

  - [ ]* 2.3 Написать unit test для fallback на vacancy
    - Проверить что неизвестный тип возвращает VacancyInterviewStrategy
    - Проверить что null/undefined возвращает VacancyInterviewStrategy
    - _Requirements: 1.6, 10.7_

- [x] 3. Определить конфигурации стадий интервью
  - [x] 3.1 Создать базовые стадии (intro, org, tech, wrapup)
    - Определить allowedTools для каждой стадии
    - Установить maxQuestions и autoAdvance для каждой стадии
    - Определить entryActions для каждой стадии
    - _Requirements: 4.2_

  - [x] 3.2 Создать стадии для gig (intro, profile_review, org, tech, task_approach, wrapup)
    - Добавить специфичные для gig стадии (profile_review, task_approach)
    - Настроить allowedTools включая getInterviewProfile для profile_review
    - _Requirements: 4.3_

  - [x] 3.3 Создать стадии для vacancy (intro, org, tech, motivation, wrapup)
    - Добавить специфичную для vacancy стадию motivation
    - Настроить allowedTools для каждой стадии
    - _Requirements: 4.4_

  - [ ]* 3.4 Написать property test для автоматического перехода стадий
    - **Property 6: Автоматический переход при достижении лимита вопросов**
    - **Validates: Requirements 4.5**

  - [ ]* 3.5 Написать property test для выполнения действий при входе в стадию
    - **Property 7: Выполнение действий при входе в стадию**
    - **Validates: Requirements 4.6**

- [x] 4. Создать схемы оценки кандидатов
  - [x] 4.1 Создать gigScoringSchema с Zod
    - Определить критерии: strengths_weaknesses, expertise_depth, problem_solving, communication_quality, timeline_feasibility
    - Добавить поле authenticityPenalty для учета детекции ботов
    - Добавить поле metadata с версией "v3-gig"
    - Добавить поле summary с keyTakeaways, redFlags, greenFlags
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 4.2 Создать vacancyScoringSchema с Zod
    - Определить критерии: completeness, relevance, motivation, communication
    - Добавить поле authenticityPenalty для учета детекции ботов
    - Добавить поле metadata с версией "v2"
    - Добавить поле summary с keyTakeaways, concerns, positives
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 4.3 Создать ScoringFactory для получения схемы по типу сущности
    - Реализовать метод createSchema(entityType)
    - Экспортировать singleton scoringFactory
    - _Requirements: 5.5_

  - [ ]* 4.4 Написать property test для валидации Zod схем
    - **Property 10: Zod схемы отклоняют невалидные данные**
    - **Validates: Requirements 11.4**

- [x] 5. Реализовать систему промптов
  - [x] 5.1 Создать интерфейс SystemPromptBuilder
    - Определить метод build(isFirstResponse, currentStage)
    - _Requirements: 2.1_

  - [x] 5.2 Реализовать BaseSystemPromptBuilder
    - Реализовать метод getBaseRules()
    - Реализовать метод getStageInstructions(stage)
    - Реализовать метод getBotDetectionInstructions()
    - Реализовать метод getCommunicationStyle()
    - Реализовать метод getFirstResponseInstructions()
    - _Requirements: 2.2_

  - [x] 5.3 Реализовать GigSystemPromptBuilder
    - Наследовать от BaseSystemPromptBuilder
    - Добавить метод getGigPurpose()
    - Добавить метод getGigSpecificInstructions()
    - Включить инструкции о запрещенных и разрешенных темах для gig
    - _Requirements: 2.3_

  - [x] 5.4 Реализовать VacancySystemPromptBuilder
    - Наследовать от BaseSystemPromptBuilder
    - Добавить метод getVacancySpecificInstructions()
    - Включить инструкции о защите от попыток сломать систему
    - _Requirements: 2.4_

  - [x] 5.5 Создать PromptFactory
    - Реализовать метод create(entityType)
    - Реализовать метод buildCompletePrompt(entityType, isFirstResponse, currentStage)
    - Экспортировать singleton promptFactory
    - _Requirements: 2.5_

  - [ ]* 5.6 Написать property test для промптов
    - **Property 3: Промпты содержат инструкции для стадии**
    - **Validates: Requirements 2.6**

- [x] 6. Реализовать фабрику инструментов
  - [x] 6.1 Создать интерфейс ToolFactory
    - Определить метод create(...) возвращающий ToolSet
    - Определить метод getAvailableTools(stage) возвращающий string[]
    - Определить метод isToolAvailable(toolName, stage) возвращающий boolean
    - _Requirements: 3.1_

  - [x] 6.2 Реализовать BaseToolFactory
    - Реализовать метод create() создающий базовый набор инструментов
    - Реализовать метод getAvailableTools(stage) с фильтрацией по стадиям
    - Реализовать метод isToolAvailable(toolName, stage)
    - _Requirements: 3.2_

  - [x] 6.3 Реализовать GigToolFactory
    - Наследовать от BaseToolFactory
    - Добавить создание инструмента getInterviewProfile
    - Переопределить getAvailableTools для включения gig-специфичных инструментов
    - _Requirements: 3.3_

  - [x] 6.4 Реализовать VacancyToolFactory
    - Наследовать от BaseToolFactory
    - Использовать только базовые инструменты
    - _Requirements: 3.4_

  - [ ]* 6.5 Написать property test для консистентности доступности инструментов
    - **Property 4: Консистентность доступности инструментов**
    - **Validates: Requirements 3.6, 3.7**

  - [ ]* 6.6 Написать property test для фильтрации инструментов по стадии
    - **Property 5: Фильтрация инструментов по стадии**
    - **Validates: Requirements 3.5**

- [x] 7. Реализовать базовую стратегию
  - [x] 7.1 Создать BaseInterviewStrategy
    - Реализовать абстрактный класс с общей функциональностью
    - Реализовать метод getWelcomeMessage() с дефолтными значениями
    - Реализовать метод getContextCardData() с дефолтными полями
    - Реализовать метод createTools() делегирующий toolFactory
    - Реализовать метод createScoringSchema() возвращающий _scoring.schema
    - Реализовать метод canTransition() разрешающий все переходы по умолчанию
    - Реализовать метод getNextQuestion() с базовой логикой
    - _Requirements: 1.2_

- [x] 8. Реализовать GigInterviewStrategy
  - [x] 8.1 Создать класс GigInterviewStrategy
    - Наследовать от BaseInterviewStrategy
    - Установить entityType = "gig"
    - Определить _questionBank с gig-специфичными вопросами
    - Определить _scoring с gigScoringSchema
    - _Requirements: 1.3_

  - [x] 8.2 Переопределить методы для gig
    - Переопределить getWelcomeMessage() с текстами для разового задания
    - Переопределить getContextCardData() с полями budget, deadline, estimatedDuration
    - Переопределить canTransition() с логикой переходов для gig стадий
    - Переопределить getNextQuestion() с логикой для gig стадий
    - _Requirements: 7.3, 8.2, 9.2_

  - [ ]* 8.3 Написать unit тесты для GigInterviewStrategy
    - Проверить что включает инструмент getInterviewProfile
    - Проверить переходы между gig-специфичными стадиями
    - Проверить getNextQuestion для каждой стадии
    - _Requirements: 14.1_

- [x] 9. Реализовать VacancyInterviewStrategy
  - [x] 9.1 Создать класс VacancyInterviewStrategy
    - Наследовать от BaseInterviewStrategy
    - Установить entityType = "vacancy"
    - Определить _questionBank с vacancy-специфичными вопросами
    - Определить _scoring с vacancyScoringSchema
    - _Requirements: 1.4_

  - [x] 9.2 Переопределить методы для vacancy
    - Переопределить getWelcomeMessage() с текстами для вакансии
    - Переопределить getContextCardData() с полями region, workLocation
    - Переопределить canTransition() с логикой переходов для vacancy стадий
    - Переопределить getNextQuestion() с логикой для vacancy стадий
    - _Requirements: 7.4, 8.3, 9.3_

  - [ ]* 9.3 Написать unit тесты для VacancyInterviewStrategy
    - Проверить что НЕ включает инструмент getInterviewProfile
    - Проверить наличие стадии motivation
    - Проверить getNextQuestion для каждой стадии
    - _Requirements: 14.1_

- [x] 10. Интегрировать AI SDK v6 в stream executor
  - [x] 10.1 Обновить stream-executor.ts
    - Добавить параметр activeTools в StreamOptionsV6
    - Добавить параметр onPrepareStep в StreamOptionsV6
    - Добавить параметр onStepFinish в StreamOptionsV6
    - Добавить параметр toolChoice в StreamOptionsV6
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [x] 10.2 Реализовать executeStreamWithFallbackV6
    - Передавать activeTools в streamText
    - Передавать prepareStep callback для логирования
    - Передавать onStepFinish callback для отслеживания вызовов инструментов
    - Добавить experimental_telemetry с OpenTelemetry интеграцией
    - Сохранить использование smoothStream и stepCountIs
    - _Requirements: 6.4, 6.7, 6.8_

  - [ ]* 10.3 Написать integration тесты для AI SDK v6
    - Проверить что activeTools передается в streamText
    - Проверить что onStepFinish вызывается для каждого шага
    - Проверить что experimental_telemetry настроен
    - _Requirements: 14.4_

- [x] 11. Обновить handler.ts для использования стратегий
  - [x] 11.1 Интегрировать strategyFactory в handler
    - Определить entityType на основе gig/vacancy
    - Создать стратегию через strategyFactory.create(entityType)
    - Получить currentStage из метаданных сессии
    - _Requirements: 1.5_

  - [x] 11.2 Использовать стратегию для создания компонентов
    - Создать tools через strategy.createTools(..., currentStage)
    - Построить systemPrompt через strategy.systemPromptBuilder.build(...)
    - Получить activeTools через strategy.toolFactory.getAvailableTools(currentStage)
    - _Requirements: 2.6, 3.5_

  - [x] 11.3 Передать AI SDK v6 параметры
    - Передать activeTools в executeStreamWithFallbackV6
    - Передать onPrepareStep для логирования шагов
    - Передать onStepFinish для отслеживания вызовов инструментов
    - Добавить entityType в метаданные трассировки
    - _Requirements: 6.1, 6.2, 6.3, 13.5_

  - [ ]* 11.4 Написать integration тесты для полного потока
    - Проверить полный поток для gig от intro до wrapup
    - Проверить полный поток для vacancy от intro до wrapup
    - Проверить что используются правильные инструменты на каждой стадии
    - _Requirements: 14.4_

- [x] 12. Обновить UI компоненты
  - [x] 12.1 Обновить InterviewChat
    - Определить entityType из interviewContext
    - Создать strategy через strategyFactory.create(entityType)
    - Получить greetingMessage через strategy.getWelcomeMessage()
    - Передать entityType в body запроса к API
    - _Requirements: 7.7_

  - [x] 12.2 Обновить InterviewGreeting
    - Добавить prop entityType?: SupportedEntityType
    - Добавить prop customMessage?: WelcomeMessageConfig
    - Использовать customMessage если предоставлен, иначе дефолт по entityType
    - Создать функцию getDefaultMessage(entityType)
    - _Requirements: 7.1_

  - [x] 12.3 Обновить InterviewContextCard
    - Добавить prop entityType?: SupportedEntityType
    - Условно отображать поля на основе entityType
    - Для gig показывать: budget, deadline, estimatedDuration
    - Для vacancy показывать: region, workLocation, experience
    - Использовать правильный badge label: "Разовое задание" для gig, "Вакансия" для vacancy
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 12.4 Написать property test для UI компонентов
    - **Property 8: UI компоненты отображают entity-specific контент**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 13. Добавить логирование и телеметрию
  - [x] 13.1 Добавить логирование в prepareStep
    - Логировать начало каждого шага с номером шага
    - _Requirements: 13.1_

  - [x] 13.2 Добавить логирование в onStepFinish
    - Логировать каждый вызов инструмента с именем и аргументами
    - _Requirements: 13.2_

  - [x] 13.3 Добавить логирование переходов между стадиями
    - Логировать переходы с информацией о причине
    - _Requirements: 13.3_

  - [x] 13.4 Настроить OpenTelemetry трассировку
    - Добавить entityType в метаданные трассировки
    - Добавить vacancyId/gigId в метаданные
    - Добавить sessionId в метаданные
    - _Requirements: 13.4, 13.5_

  - [x] 13.5 Добавить логирование ошибок
    - Логировать ошибки с полным стеком
    - Включать контекст: entityType, stage, lastQuestion
    - _Requirements: 13.6, 13.7_

- [ ] 14. Написать property-based тесты
  - [ ]* 14.1 Property 2: Fallback на vacancy для неизвестных типов
    - **Validates: Requirements 1.6, 10.7**

  - [ ]* 14.2 Property 9: getNextQuestion возвращает незаданный вопрос
    - **Validates: Requirements 9.6, 9.7**

- [ ] 15. Написать unit тесты
  - [ ]* 15.1 Unit тесты для фабрик
    - Тесты для InterviewStrategyFactory
    - Тесты для PromptFactory
    - Тесты для ScoringFactory
    - Тесты для ToolFactory
    - _Requirements: 14.2_

  - [ ]* 15.2 Unit тесты для построителей промптов
    - Тесты для BaseSystemPromptBuilder
    - Тесты для GigSystemPromptBuilder
    - Тесты для VacancySystemPromptBuilder
    - _Requirements: 14.3_

  - [ ]* 15.3 Unit тесты для переходов между стадиями
    - Тесты для canTransition в GigInterviewStrategy
    - Тесты для canTransition в VacancyInterviewStrategy
    - _Requirements: 14.5_

  - [ ]* 15.4 Unit тесты для фильтрации инструментов
    - Тесты для getAvailableTools по стадиям
    - Тесты для isToolAvailable
    - _Requirements: 14.6_

  - [ ]* 15.5 Unit тесты для генерации оценок
    - Тесты для gigScoringSchema с валидными данными
    - Тесты для vacancyScoringSchema с валидными данными
    - Тесты для отклонения невалидных данных
    - _Requirements: 14.7_

- [ ] 16. Достичь покрытия тестами >= 80%
  - [ ]* 16.1 Измерить текущее покрытие
    - Запустить Jest с флагом --coverage
    - Проанализировать отчет покрытия
    - _Requirements: 14.8_

  - [ ]* 16.2 Добавить недостающие тесты
    - Покрыть непокрытые ветки кода
    - Добавить тесты для edge cases
    - _Requirements: 14.8_

- [x] 17. Провести code review и оптимизацию
  - [x] 17.1 Code review
    - Проверить соответствие SOLID принципам
    - Проверить типобезопасность
    - Проверить обработку ошибок
    - _Requirements: 15.7_

  - [x] 17.2 Performance тестирование
    - Измерить время создания стратегии (< 10ms)
    - Измерить время создания инструментов (< 50ms)
    - Измерить время построения п ромпта (< 5ms)
    - _Requirements: Метрики успеха_

  - [x] 17.3 Оптимизация
    - Оптимизировать узкие места если найдены
    - Убедиться что нет регрессий в производительности
    - _Requirements: 10.4_

- [ ] 18. Подготовить к развертыванию
  - [ ] 18.1 Создать feature flag
    - Добавить флаг для постепенного раскатывания
    - Настроить логику переключения между старой и новой реализацией
    - _Requirements: 10.1, 10.2_

  - [ ] 18.2 Обновить документацию
    - Создать README с описанием архитектуры
    - Добавить примеры использования стратегий
    - Добавить руководство по добавлению новых типов сущностей
    - _Requirements: 15.1, 15.4, 15.5_

  - [ ] 18.3 Подготовить rollback план
    - Документировать шаги для отката изменений
    - Подготовить скрипты для быстрого отката
    - _Requirements: План миграции_
