-- Проверка данных в таблице responses

-- 1. Общее количество откликов
SELECT COUNT(*) as total_responses FROM responses;

-- 2. Количество откликов по типу сущности
SELECT entity_type, COUNT(*) as count 
FROM responses 
GROUP BY entity_type;

-- 3. Количество откликов для вакансий
SELECT COUNT(*) as vacancy_responses 
FROM responses 
WHERE entity_type = 'vacancy';

-- 4. Первые 5 откликов для вакансий с основными полями
SELECT 
  id,
  entity_type,
  entity_id,
  candidate_name,
  status,
  created_at,
  responded_at
FROM responses 
WHERE entity_type = 'vacancy'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Проверка конкретной вакансии (замените YOUR_VACANCY_ID на реальный ID)
-- SELECT 
--   id,
--   entity_type,
--   entity_id,
--   candidate_name,
--   status,
--   created_at
-- FROM responses 
-- WHERE entity_type = 'vacancy' 
--   AND entity_id = 'YOUR_VACANCY_ID'
-- ORDER BY created_at DESC;
