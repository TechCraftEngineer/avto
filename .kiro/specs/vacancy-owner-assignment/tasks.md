# Implementation Plan: Vacancy Owner Assignment

## Overview

Реализация функции назначения ответственного рекрутера для вакансий включает расширение схемы базы данных, создание tRPC процедур для управления owner, валидацию через Zod v4 и интеграцию с существующей системой прав доступа. План разбит на инкрементальные шаги с ранней валидацией через тесты.

## Tasks

- [x] 1. Расширить схему базы данных и типы
  - Добавить поле `owner_id` в схему Drizzle для таблицы `vacancies`
  - Обновить TypeScript типы для `Vacancy` и создать тип `VacancyWithOwner`
  - Настроить foreign key связь с таблицей `users`
  - _Requirements: 1.1, 1.4, 2.1_

- [ ] 2. Создать Zod схемы валидации
  - [ ] 2.1 Создать схемы для назначения и обновления owner
    - Создать `assignOwnerSchema` с валидацией UUID для vacancyId и recruiterId
    - Создать `updateOwnerSchema` с поддержкой nullable recruiterId
    - Использовать Zod v4 синтаксис
    - _Requirements: 5.1, 5.2_
  
  - [ ] 2.2 Расширить схему фильтров для списка вакансий
    - Добавить поля `ownerId`, `ownerIds`, `withoutOwner` в `vacancyListFiltersSchema`
    - Все поля должны быть optional
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ]* 2.3 Написать property test для валидации UUID
    - **Property 14: Валидация UUID входных параметров**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 3. Реализовать service layer функции
  - [ ] 3.1 Создать функцию валидации recruiter в workspace
    - Реализовать `validateRecruiterInWorkspace` с проверкой активного статуса
    - Запрос к таблице workspace_members
    - _Requirements: 1.2, 1.3, 2.2_
  
  - [ ] 3.2 Создать функцию проверки прав доступа
    - Реализовать `checkVacancyEditPermission` с проверкой ролей admin/manager
    - Поддержка проверки owner вакансии
    - _Requirements: 6.1, 6.3_
  
  - [ ]* 3.3 Написать property tests для service функций
    - **Property 2: Валидация workspace при назначении owner**
    - **Property 3: Валидация активного статуса рекрутера**
    - **Property 16: Контроль доступа на основе ролей**
    - **Validates: Requirements 1.2, 1.3, 2.2, 6.1, 6.2, 6.3, 6.4**

- [ ] 4. Checkpoint - Убедиться, что базовая валидация работает
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Реализовать tRPC процедуру assignOwner
  - [ ] 5.1 Создать mutation для назначения owner
    - Использовать `assignOwnerSchema` для input
    - Реализовать проверки: существование вакансии, права доступа, валидация recruiter
    - Обновить `owner_id` в таблице vacancies
    - Вернуть вакансию с полной информацией об owner через JOIN
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [ ]* 5.2 Написать property test для assignOwner
    - **Property 1: Сохранение связи vacancy-owner**
    - **Property 4: Полнота информации об owner в ответах**
    - **Validates: Requirements 1.1, 1.5**
  
  - [ ]* 5.3 Написать unit tests для edge cases
    - Тест для несуществующей вакансии (404)
    - Тест для recruiter из другого workspace (403)
    - Тест для пользователя без прав (403)
    - _Requirements: 5.4, 5.5, 6.2_

- [ ] 6. Реализовать tRPC процедуру updateOwner
  - [ ] 6.1 Создать mutation для обновления owner
    - Использовать `updateOwnerSchema` для input
    - Поддержка установки owner в null
    - Обновить `updated_at` timestamp
    - Вернуть обновленную вакансию с информацией об owner
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  
  - [ ]* 6.2 Написать property tests для updateOwner
    - **Property 5: Обновление связи при изменении owner**
    - **Property 6: Обновление timestamp при изменении owner**
    - **Property 7: Удаление owner (установка null)**
    - **Validates: Requirements 2.1, 2.3, 2.4**
  
  - [ ]* 6.3 Написать unit test для удаления owner
    - Тест установки owner в null
    - Проверка, что owner_id становится null
    - _Requirements: 2.4_

- [ ] 7. Checkpoint - Убедиться, что назначение и обновление работают
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Расширить существующую процедуру getById
  - [ ] 8.1 Добавить JOIN для загрузки информации об owner
    - Модифицировать запрос для включения данных owner (id, name, email, avatarUrl)
    - Обработать случай, когда owner = null
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 8.2 Написать property test для структуры owner
    - **Property 8: Соответствие структуры owner модели пользователя**
    - **Validates: Requirements 3.3**
  
  - [ ]* 8.3 Написать unit test для вакансии без owner
    - Тест возврата null для owner
    - _Requirements: 3.2_

- [ ] 9. Расширить существующую процедуру list с фильтрацией
  - [ ] 9.1 Добавить фильтрацию по owner
    - Реализовать фильтр по `ownerId` (один owner)
    - Реализовать фильтр по `ownerIds` (массив owners)
    - Реализовать фильтр `withoutOwner` (owner IS NULL)
    - Добавить JOIN для загрузки информации об owner для каждой вакансии
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 3.4_
  
  - [ ]* 9.2 Написать property tests для фильтрации
    - **Property 9: Фильтрация по одному owner**
    - **Property 10: Отсутствие фильтра возвращает все вакансии**
    - **Property 11: Фильтрация по нескольким owner**
    - **Property 12: Фильтрация вакансий без owner**
    - **Property 13: Комбинирование фильтров**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
  
  - [ ]* 9.3 Написать unit tests для специфических сценариев фильтрации
    - Тест комбинации фильтра owner + status
    - Тест пустого результата при фильтрации
    - _Requirements: 4.5_

- [ ] 10. Реализовать обработку ошибок
  - [ ] 10.1 Добавить обработку всех типов ошибок
    - Обработка TRPCError для 400, 403, 404, 500
    - Логирование ошибок для внутреннего использования
    - Возврат понятных сообщений об ошибках
    - _Requirements: 5.3, 5.4, 5.5, 6.2_
  
  - [ ]* 10.2 Написать property test для кодов ошибок
    - **Property 15: Ошибка для несуществующей вакансии**
    - **Validates: Requirements 5.5**
  
  - [ ]* 10.3 Написать unit tests для обработки ошибок
    - Тест для невалидного UUID (400)
    - Тест для несуществующей вакансии (404)
    - Тест для recruiter из другого workspace (403)
    - Тест для пользователя без прав (403)
    - _Requirements: 5.3, 5.4, 5.5, 6.2_

- [ ] 11. Реализовать проверку прав на чтение
  - [ ] 11.1 Добавить проверку прав для просмотра owner
    - Разрешить всем членам workspace просматривать информацию об owner
    - Интегрировать с существующей системой прав
    - _Requirements: 6.5_
  
  - [ ]* 11.2 Написать property test для прав на чтение
    - **Property 17: Права на чтение для всех членов workspace**
    - **Validates: Requirements 6.5**

- [ ] 12. Final checkpoint - Интеграция и финальная проверка
  - Ensure all tests pass, ask the user if questions arise.
  - Проверить, что все компоненты интегрированы корректно
  - Убедиться, что все requirements покрыты

## Notes

- Задачи, помеченные `*`, являются optional и могут быть пропущены для более быстрого MVP
- Каждая задача ссылается на конкретные requirements для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности (минимум 100 итераций на тест)
- Unit tests валидируют конкретные примеры и edge cases
- Не создаются миграции БД - предполагается, что схема будет обновлена вручную или через существующий процесс
- Используется Zod v4 для всех схем валидации
- Используется bun как пакетный менеджер
