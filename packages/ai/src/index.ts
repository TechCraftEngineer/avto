import OpenAI from 'openai';
import { z } from 'zod';

// Настройки для РФ рынка
const RUSSIAN_JOB_MARKET_CONTEXT = `
Учитывай специфику российского рынка труда:
- Компании: Сбер, Тинькофф, Яндекс, Mail.ru, Ozon, Wildberries, Газпром, Роснефть, Ростелеком
- Образование: МГУ, МФТИ, СПбГУ, ВШЭ, ИТМО, МИСиС, Бауманка
- Сертификаты: Oracle, Microsoft, AWS, Yandex Cloud, 1C, SAP
- Тренды: удаленная работа, гибридный формат, релокация в регионы
- Зарплаты: в рублях, учитывать региональные различия (Москва/СПб vs регионы)
- Опыт: стаж в российских/международных компаниях, знание русского законодательства
`;

const getAIClient = () => {
  const provider = process.env.AI_PROVIDER;
  if (provider === 'deepseek') {
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1'
    });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const getModel = () => process.env.AI_MODEL || 'gpt-4o-mini';

// Существующие функции
export async function analyzeResume(params: { resumeText: string; vacancyDescription: string; provider: string }) {
  const client = getAIClient();

  const prompt = `Проанализируй соответствие резюме вакансии для российского рынка труда.

${RUSSIAN_JOB_MARKET_CONTEXT}

ВАКАНСИЯ:
${params.vacancyDescription}

РЕЗЮМЕ:
${params.resumeText}

Проанализируй:
1. Соответствие навыков требованиям вакансии (0-100)
2. Релевантность опыта (0-100)
3. Общий уровень соответствия (composite score 0-100)
4. Обоснование оценки на русском языке

Верни JSON с полями: compositeScore, skillsMatchScore, experienceScore, reasoning`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    compositeScore: Math.min(100, Math.max(0, result.compositeScore || 75)),
    skillsMatchScore: Math.min(100, Math.max(0, result.skillsMatchScore || 80)),
    experienceScore: Math.min(100, Math.max(0, result.experienceScore || 70)),
    reasoning: result.reasoning || 'Анализ выполнен'
  };
}

export async function extractRequirements(description: string) {
  const client = getAIClient();

  const prompt = `Извлеки ключевые требования к кандидату из описания вакансии для российского рынка.

${RUSSIAN_JOB_MARKET_CONTEXT}

ОПИСАНИЕ ВАКАНСИИ:
${description}

Извлеки требования в формате массива строк. Включи:
- Технические навыки (языки программирования, фреймворки, инструменты)
- Опыт работы (лет/месяцев)
- Образование
- Сертификаты
- Мягкие навыки
- Знание языков
- Регион работы

Верни JSON с полем requirements: string[]`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result.requirements || ['Требования не определены'];
}

// Новые функции для расширенного анализа
export async function analyzeEmotionalTone(text: string, context: 'resume' | 'application' | 'interview') {
  const client = getAIClient();

  const contextNames = {
    resume: 'резюме кандидата',
    application: 'сопроводительного письма',
    interview: 'ответа в интервью'
  };

  const prompt = `Проанализируй эмоциональный тон текста ${contextNames[context]} для российского рынка труда.

${RUSSIAN_JOB_MARKET_CONTEXT}

ТЕКСТ ДЛЯ АНАЛИЗА:
"${text}"

Оцени по шкале 0-100:
- enthusiasm: уровень энтузиазма и мотивации
- confidence: уверенность в своих навыках
- stressLevel: уровень стресса или неуверенности
- authenticity: аутентичность (не похоже ли на сгенерированный текст)

Также предоставь reasoning на русском языке.

Верни JSON с полями: enthusiasm, confidence, stressLevel, authenticity, reasoning`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    enthusiasm: Math.min(100, Math.max(0, result.enthusiasm || 50)),
    confidence: Math.min(100, Math.max(0, result.confidence || 50)),
    stressLevel: Math.min(100, Math.max(0, result.stressLevel || 50)),
    authenticity: Math.min(100, Math.max(0, result.authenticity || 50)),
    reasoning: result.reasoning || 'Эмоциональный анализ выполнен'
  };
}

export async function analyzeCareerStability(experience: Array<{company: string, position: string, startDate: string, endDate?: string, reasonForLeaving?: string}>) {
  const client = getAIClient();

  const prompt = `Проанализируй карьерную стабильность кандидата на российском рынке труда.

${RUSSIAN_JOB_MARKET_CONTEXT}

ОПЫТ РАБОТЫ:
${JSON.stringify(experience, null, 2)}

Оцени:
- jobTenure: средняя продолжительность работы в месяцах
- growthRate: скорость карьерного роста (0-100)
- riskFactors: массив потенциальных рисков (частая смена работы, короткие контракты и т.д.)
- stabilityScore: общая оценка стабильности (0-100)
- reasoning: обоснование на русском

Верни JSON с указанными полями.`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    jobTenure: result.jobTenure || 24,
    growthRate: Math.min(100, Math.max(0, result.growthRate || 50)),
    riskFactors: result.riskFactors || [],
    stabilityScore: Math.min(100, Math.max(0, result.stabilityScore || 50)),
    reasoning: result.reasoning || 'Анализ стабильности выполнен'
  };
}

export async function runPredictiveModel(candidateData: any) {
  const client = getAIClient();

  const prompt = `Спрогнозируй метрики успеха кандидата на российском рынке труда.

${RUSSIAN_JOB_MARKET_CONTEXT}

ДАННЫЕ КАНДИДАТА:
${JSON.stringify(candidateData, null, 2)}

Оцени вероятность (0-100):
- retentionProbability: вероятность удержания в компании более 1 года
- performanceScore: прогнозируемая производительность
- culturalFitScore: соответствие корпоративной культуре
- growthPotential: потенциал роста и развития

Верни JSON с указанными полями.`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    retentionProbability: Math.min(100, Math.max(0, result.retentionProbability || 70)),
    performanceScore: Math.min(100, Math.max(0, result.performanceScore || 75)),
    culturalFitScore: Math.min(100, Math.max(0, result.culturalFitScore || 80)),
    growthPotential: Math.min(100, Math.max(0, result.growthPotential || 65))
  };
}

// Функции для детекции AI-ботов
export async function analyzeResponseAuthenticity(text: string, responseTime?: number, conversationHistory?: any[]) {
  const client = getAIClient();

  const timeAnalysis = responseTime ? `
ВРЕМЯ ОТВЕТА: ${responseTime} секунд
АНАЛИЗ ВРЕМЕНИ: ${responseTime < 10 ? 'Очень быстро - подозрительно' : responseTime > 300 ? 'Очень медленно - возможно отвлекся' : 'Нормально'}` : '';

  const historyContext = conversationHistory ? `
ИСТОРИЯ РАЗГОВОРА:
${conversationHistory.slice(-5).map((msg, i) => `${i+1}. ${msg.role}: ${msg.content.substring(0, 100)}...`).join('\n')}` : '';

  const prompt = `Проанализируй аутентичность ответа кандидата на российском рынке труда.

${RUSSIAN_JOB_MARKET_CONTEXT}

${timeAnalysis}
${historyContext}

ТЕКСТ ОТВЕТА:
"${text}"

Оцени:
- isAuthentic: boolean - является ли ответ естественным
- confidence: number 0-100 - уверенность в оценке
- redFlags: string[] - признаки неаутентичности
- shouldWarn: boolean - нужно ли предупреждение
- warningMessage: string - текст предупреждения на русском (если shouldWarn=true)

Верни JSON с указанными полями.`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    isAuthentic: result.isAuthentic ?? true,
    confidence: Math.min(100, Math.max(0, result.confidence || 80)),
    redFlags: result.redFlags || [],
    shouldWarn: result.shouldWarn || false,
    warningMessage: result.warningMessage || ''
  };
}

export async function getBotDetectionSummary(sessionData: any) {
  const client = getAIClient();

  const prompt = `Создай итоговую оценку использования AI-ботов в сессии интервью.

ДАННЫЕ СЕССИИ:
${JSON.stringify(sessionData, null, 2)}

Рассчитай:
- totalSuspicionScore: общий уровень подозрений (0-100)
- highRiskIndicators: количество высокорискованных индикаторов
- recommendedAction: рекомендация (approve/reject/review)
- summary: краткое резюме на русском

Верни JSON с указанными полями.`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    totalSuspicionScore: Math.min(100, Math.max(0, result.totalSuspicionScore || 0)),
    highRiskIndicators: result.highRiskIndicators || 0,
    recommendedAction: result.recommendedAction || 'review',
    summary: result.summary || 'Анализ завершен'
  };
}

// Функции для анализа портфолио
export async function analyzePortfolio(githubUsername?: string, portfolioLinks?: string[]) {
  const client = getAIClient();

  const prompt = `Проанализируй техническое портфолио кандидата для российского IT-рынка.

GITHUB: ${githubUsername || 'не указан'}
ПОРТФОЛИО ССЫЛКИ: ${portfolioLinks?.join(', ') || 'не указаны'}

Оцени:
- technicalSkill: уровень технических навыков (0-100)
- codeQuality: качество кода (0-100)
- projectComplexity: сложность проектов (0-100)
- consistency: последовательность стиля (0-100)
- russianMarketRelevance: релевантность российскому рынку (0-100)
- strengths: массив сильных сторон
- weaknesses: массив слабых сторон
- recommendations: рекомендации по улучшению

Верни JSON с указанными полями.`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    technicalSkill: Math.min(100, Math.max(0, result.technicalSkill || 50)),
    codeQuality: Math.min(100, Math.max(0, result.codeQuality || 50)),
    projectComplexity: Math.min(100, Math.max(0, result.projectComplexity || 50)),
    consistency: Math.min(100, Math.max(0, result.consistency || 50)),
    russianMarketRelevance: Math.min(100, Math.max(0, result.russianMarketRelevance || 50)),
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    recommendations: result.recommendations || []
  };
}

// DEI анализ
export async function analyzeDEI(candidateInfo: any, companyContext?: any) {
  const client = getAIClient();

  const prompt = `Проанализируй DEI (Diversity, Equity, Inclusion) аспекты кандидата для российской компании.

ИНФОРМАЦИЯ О КАНДИДАТЕ:
${JSON.stringify(candidateInfo, null, 2)}

КОНТЕКСТ КОМПАНИИ:
${JSON.stringify(companyContext || {}, null, 2)}

Оцени:
- diversity: {gender, ageGroup, ethnicity, geography, disability}
- biasRisk: уровень риска bias (0-100)
- inclusionFit: соответствие принципам инклюзии (0-100)
- equityConsiderations: соображения справедливости
- recommendations: рекомендации по DEI

Верни JSON с указанными полями.`;

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    diversity: result.diversity || {},
    biasRisk: Math.min(100, Math.max(0, result.biasRisk || 20)),
    inclusionFit: Math.min(100, Math.max(0, result.inclusionFit || 80)),
    equityConsiderations: result.equityConsiderations || [],
    recommendations: result.recommendations || []
  };
}
