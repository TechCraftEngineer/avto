type MetaMatchPhase = "stabilization" | "growth" | "change";

export type MetaMatchSummaryMetrics = {
  synergy: number;
  temporalResonance: number;
  conflictRisk: number;
  moneyFlow: number;
};

export type MetaMatchSummaryLabels = {
  synergy: string;
  temporalResonance: string;
  conflictRisk: string;
  moneyFlow: string;
};

export type MetaMatchEvaluation = {
  summaryMetrics: MetaMatchSummaryMetrics;
  summaryLabels: MetaMatchSummaryLabels;
  narrative: string[];
  recommendations: string[];
  riskFlags: string[];
  disclaimer: string;
  algorithmVersion: string;
  indices: {
    coreIndex: number;
    stabilityIndex: number;
    changeIndex: number;
    cycleIndex: number;
    phase: MetaMatchPhase;
  };
};

const ALGORITHM_VERSION = "v1";

const PHASE_LABELS: Record<MetaMatchPhase, string> = {
  stabilization: "фаза стабилизации",
  growth: "фаза роста",
  change: "фаза перемен",
};

const PHASE_WEIGHTS: Record<
  MetaMatchPhase,
  { synergy: number; risk: number; money: number }
> = {
  stabilization: { synergy: 1.0, risk: 0.75, money: 0.85 },
  growth: { synergy: 0.9, risk: 0.9, money: 1.0 },
  change: { synergy: 0.75, risk: 1.05, money: 0.85 },
};

const DISCLAIMER =
  "Модуль носит рекомендательный характер и не является основанием для отказа в найме.";

const clampScore = (value: number) =>
  Math.max(0, Math.min(10, Math.round(value)));

const normalizeIndex = (value: number) =>
  clampScore(((value - 1) / 8) * 10);

const digitalRoot = (value: number) =>
  value === 0 ? 9 : 1 + ((value - 1) % 9);

const sumDigits = (value: number) =>
  Math.abs(value)
    .toString()
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);

const getDateDigits = (birthDate: Date) => {
  const day = birthDate.getUTCDate().toString().padStart(2, "0");
  const month = (birthDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = birthDate.getUTCFullYear().toString().padStart(4, "0");
  return `${day}${month}${year}`.split("").map(Number);
};

export const determinePhase = (cycleIndex: number): MetaMatchPhase => {
  if (cycleIndex <= 2) return "stabilization";
  if (cycleIndex <= 5) return "growth";
  return "change";
};

const getInterpretation = (score: number) => {
  if (score >= 8) return "высокий";
  if (score >= 4) return "средний";
  return "низкий";
};

const buildRecommendations = (
  phase: MetaMatchPhase,
  stabilityIndex: number,
  changeIndex: number,
) => {
  const phaseRecommendation: Record<MetaMatchPhase, string> = {
    stabilization:
      "Оптимальный выход на работу — в ближайшие 1–2 месяца с фокусом на стабильный ритм.",
    growth:
      "Оптимальный выход на работу — в ближайшие 2–4 недели, лучше в задачах развития.",
    change:
      "Лучше стартовать через проектный запуск или пилотную фазу с гибкой постановкой задач.",
  };

  let taskMode = "Подойдет смешанный режим задач с понятными целями.";
  if (stabilityIndex >= 7) {
    taskMode =
      "Предпочтителен режим последовательных задач с четкими правилами и сроками.";
  } else if (changeIndex >= 7) {
    taskMode =
      "Лучше подойдет динамичная среда с вариативными задачами и короткими циклами.";
  }

  return [phaseRecommendation[phase], taskMode];
};

const buildNarrative = (
  phase: MetaMatchPhase,
  indices: {
    coreIndex: number;
    stabilityIndex: number;
    changeIndex: number;
    cycleIndex: number;
  },
  metrics: MetaMatchSummaryMetrics,
) => [
  `Профиль отражает ${PHASE_LABELS[phase]} с базовым темпом ${indices.coreIndex} и индексом устойчивости ${indices.stabilityIndex}. Это помогает оценить ожидаемый ритм работы и чувствительность к изменениям.`,
  `Темпоральный резонанс — ${getInterpretation(
    metrics.temporalResonance,
  )}, риск конфликтных циклов — ${getInterpretation(
    metrics.conflictRisk,
  )}. Метрики используются как дополнительный сигнал для принятия решения.`,
  `Прогноз денежного потока оценивается как ${getInterpretation(
    metrics.moneyFlow,
  )} и дополняет общий контекст совместимости.`,
];

const buildRiskFlags = (metrics: MetaMatchSummaryMetrics) => {
  const flags: string[] = [];

  if (metrics.conflictRisk >= 7) {
    flags.push("Повышенный риск конфликтных циклов в текущей фазе.");
  }
  if (metrics.temporalResonance <= 3) {
    flags.push("Низкий темпоральный резонанс — возможна адаптация дольше обычного.");
  }
  if (metrics.moneyFlow <= 3) {
    flags.push("Низкий прогноз денежного потока — стоит усилить контроль целей.");
  }
  if (metrics.synergy <= 4) {
    flags.push("Низкий коэффициент синергии — возможен дисбаланс ожиданий.");
  }

  if (flags.length === 0) {
    flags.push("Критичных риск-флагов не выявлено.");
  }

  return flags;
};

export const evaluateMetaMatch = (
  birthDate: Date,
  currentDate = new Date(),
): MetaMatchEvaluation => {
  const dateDigits = getDateDigits(birthDate);
  const coreIndex = digitalRoot(dateDigits.reduce((sum, digit) => sum + digit, 0));
  const stabilityIndex = digitalRoot(
    birthDate.getUTCDate() + (birthDate.getUTCMonth() + 1),
  );
  const changeIndex = digitalRoot(sumDigits(birthDate.getUTCFullYear() % 100));
  const cycleIndexRaw =
    (currentDate.getUTCFullYear() - birthDate.getUTCFullYear()) % 9;
  const cycleIndex = cycleIndexRaw < 0 ? cycleIndexRaw + 9 : cycleIndexRaw;
  const phase = determinePhase(cycleIndex);

  const coreScore = normalizeIndex(coreIndex);
  const stabilityScore = normalizeIndex(stabilityIndex);
  const changeScore = normalizeIndex(changeIndex);
  const cycleScore = normalizeIndex(cycleIndex + 1);
  const weights = PHASE_WEIGHTS[phase];

  const summaryMetrics: MetaMatchSummaryMetrics = {
    synergy: clampScore(stabilityScore * weights.synergy + cycleScore * 0.2),
    temporalResonance: clampScore((coreScore + cycleScore) / 2),
    conflictRisk: clampScore(changeScore * weights.risk),
    moneyFlow: clampScore(coreScore * weights.money + cycleScore * 0.15),
  };

  const summaryLabels = getSummaryLabels(summaryMetrics);

  return {
    summaryMetrics,
    summaryLabels,
    narrative: buildNarrative(
      phase,
      {
        coreIndex,
        stabilityIndex,
        changeIndex,
        cycleIndex,
      },
      summaryMetrics,
    ),
    recommendations: buildRecommendations(phase, stabilityIndex, changeIndex),
    riskFlags: buildRiskFlags(summaryMetrics),
    disclaimer: DISCLAIMER,
    algorithmVersion: ALGORITHM_VERSION,
    indices: {
      coreIndex,
      stabilityIndex,
      changeIndex,
      cycleIndex,
      phase,
    },
  };
};

export const getSummaryLabels = (
  metrics: MetaMatchSummaryMetrics,
): MetaMatchSummaryLabels => ({
  synergy: getInterpretation(metrics.synergy),
  temporalResonance: getInterpretation(metrics.temporalResonance),
  conflictRisk: getInterpretation(metrics.conflictRisk),
  moneyFlow: getInterpretation(metrics.moneyFlow),
});

export const getRiskFlags = (metrics: MetaMatchSummaryMetrics) =>
  buildRiskFlags(metrics);

export const getMetaMatchStatus = (
  reportExists: boolean,
  hasBirthDate: boolean,
) => {
  if (reportExists) return "ready";
  if (hasBirthDate) return "needs_evaluation";
  return "no_data";
};
