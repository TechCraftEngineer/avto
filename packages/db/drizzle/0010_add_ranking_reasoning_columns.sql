-- Add reasoning columns for explainable AI
-- These columns store explanations for each ranking score to provide transparency

ALTER TABLE "responses" ADD COLUMN "price_score_reasoning" text;
ALTER TABLE "responses" ADD COLUMN "delivery_score_reasoning" text;
ALTER TABLE "responses" ADD COLUMN "skills_match_score_reasoning" text;
ALTER TABLE "responses" ADD COLUMN "experience_score_reasoning" text;
ALTER TABLE "responses" ADD COLUMN "composite_score_reasoning" text;
ALTER TABLE "responses" ADD COLUMN "evaluation_reasoning" jsonb;

-- Add comments for documentation
COMMENT ON COLUMN "responses"."price_score_reasoning" IS 'Объяснение оценки цены кандидата (explainable AI)';
COMMENT ON COLUMN "responses"."delivery_score_reasoning" IS 'Объяснение оценки сроков выполнения (explainable AI)';
COMMENT ON COLUMN "responses"."skills_match_score_reasoning" IS 'Объяснение соответствия навыков требованиям (explainable AI)';
COMMENT ON COLUMN "responses"."experience_score_reasoning" IS 'Объяснение оценки опыта кандидата (explainable AI)';
COMMENT ON COLUMN "responses"."composite_score_reasoning" IS 'Общее объяснение итоговой оценки кандидата (explainable AI)';
COMMENT ON COLUMN "responses"."evaluation_reasoning" IS 'Структурированные объяснения по dimensions для вакансий (hardSkills, softSkills, cultureFit, salaryAlignment)';
