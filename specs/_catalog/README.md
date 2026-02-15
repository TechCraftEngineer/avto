# Каталог гигов (разовых заданий)

Placeholder с примерами. Реализация полного каталога отложена.

## Структура записи (согласована с GigLike)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | да | UUID гига |
| `title` | string | да | Заголовок (макс. 500 символов) |
| `description` | string \| null | нет | Описание задания |
| `type` | string \| null | нет | Тип: DEVELOPMENT, DESIGN, COPYWRITING, MARKETING, TRANSLATION, VIDEO, AUDIO, DATA_ENTRY, RESEARCH, CONSULTING, OTHER |
| `budgetMin` | number \| null | нет | Минимальный бюджет |
| `budgetMax` | number \| null | нет | Максимальный бюджет |
| `estimatedDuration` | string \| null | нет | Ожидаемая длительность |
| `deadline` | string \| null | нет | Дедлайн (ISO 8601) |
| `metadata` | object | нет | Дополнительные параметры конфигурации |
