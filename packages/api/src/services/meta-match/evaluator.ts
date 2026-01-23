type MetaMatchPhase = "stabilization" | "growth" | "change";

export type MetaMatchSummaryMetrics = {
  synergy: number;
  temporalResonance: number;
  conflictRisk: number;
  moneyFlow: number;
  companySynergy?: number;
  managerSynergy?: number;
  teamBalance?: number;
};

export type TeamMemberProfile = {
  coreIndex: number;
  stabilityIndex: number;
  changeIndex: number;
  phase: MetaMatchPhase;
};

export type TeamData = {
  memberProfiles: TeamMemberProfile[];
  teamSize: number;
  dominantProfile: string;
};

export type MetaMatchSummaryLabels = {
  synergy: string;
  temporalResonance: string;
  conflictRisk: string;
  moneyFlow: string;
  companySynergy?: string;
  managerSynergy?: string;
  teamBalance?: string;
};

export type MetaMatchEvaluation = {
  summaryMetrics: MetaMatchSummaryMetrics;
  summaryLabels: MetaMatchSummaryLabels;
  narrative: string[];
  recommendations: string[];
  riskFlags: string[];
  disclaimer: string;
  algorithmVersion: string;
  teamData?: TeamData;
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

// Расчет синергии между кандидатом и другой сущностью (компания/руководитель)
const calculateEntitySynergy = (
  candidateIndices: {
    coreIndex: number;
    stabilityIndex: number;
    changeIndex: number;
    cycleIndex: number;
  },
  entityBirthDate: Date,
  currentDate: Date,
): number => {
  const entityDigits = getDateDigits(entityBirthDate);
  const entityCoreIndex = digitalRoot(
    entityDigits.reduce((sum, digit) => sum + digit, 0),
  );
  const entityStabilityIndex = digitalRoot(
    entityBirthDate.getUTCDate() + (entityBirthDate.getUTCMonth() + 1),
  );
  const entityChangeIndex = digitalRoot(
    sumDigits(entityBirthDate.getUTCFullYear() % 100),
  );
  const entityCycleIndexRaw =
    (currentDate.getUTCFullYear() - entityBirthDate.getUTCFullYear()) % 9;
  const entityCycleIndex =
    entityCycleIndexRaw < 0 ? entityCycleIndexRaw + 9 : entityCycleIndexRaw;

  // Синергия рассчитывается как гармония между индексами кандидата и сущности
  // Чем ближе индексы, тем выше синергия
  const coreHarmony =
    10 - Math.abs(candidateIndices.coreIndex - entityCoreIndex);
  const stabilityHarmony =
    10 - Math.abs(candidateIndices.stabilityIndex - entityStabilityIndex);
  const changeHarmony =
    10 - Math.abs(candidateIndices.changeIndex - entityChangeIndex);
  const cycleHarmony =
    10 - Math.min(Math.abs(candidateIndices.cycleIndex - entityCycleIndex), 9);

  // Взвешенная синергия
  return (
    coreHarmony * 0.4 +
    stabilityHarmony * 0.3 +
    changeHarmony * 0.2 +
    cycleHarmony * 0.1
  );
};

// Анализ баланса команды на основе профилей участников
const analyzeTeamBalance = (teamProfiles: TeamMemberProfile[]): TeamData => {
  const phaseCount: Record<MetaMatchPhase, number> = {
    stabilization: 0,
    growth: 0,
    change: 0,
  };

  teamProfiles.forEach((profile) => {
    phaseCount[profile.phase]++;
  });

  // Определение доминирующего профиля
  const dominantPhase = Object.entries(phaseCount).reduce((a, b) =>
    phaseCount[a[0] as MetaMatchPhase] > phaseCount[b[0] as MetaMatchPhase]
      ? a
      : b,
  )[0] as MetaMatchPhase;

  return {
    memberProfiles: teamProfiles,
    teamSize: teamProfiles.length,
    dominantProfile: PHASE_LABELS[dominantPhase],
  };
};

// Расчет баланса кандидата с командой
const calculateTeamBalance = (
  candidateProfile: TeamMemberProfile,
  teamData: TeamData,
): number => {
  const teamPhaseCount: Record<MetaMatchPhase, number> = {
    stabilization: 0,
    growth: 0,
    change: 0,
  };

  teamData.memberProfiles.forEach((profile) => {
    teamPhaseCount[profile.phase]++;
  });

  // Расчет разнообразия фаз в команде (чем равномернее распределение, тем лучше баланс)
  const totalMembers = teamData.teamSize;
  const phaseDistribution = Object.values(teamPhaseCount).map(
    (count) => count / totalMembers,
  );
  const diversityScore =
    1 - phaseDistribution.reduce((sum, ratio) => sum + (ratio - 1 / 3) ** 2, 0);

  // Оценка вклада кандидата в баланс команды
  const candidatePhaseCount = teamPhaseCount[candidateProfile.phase];
  const candidateRatio = candidatePhaseCount / totalMembers;

  // Кандидат улучшает баланс, если:
  // 1. Его профиль underrepresented в команде (< 1/3)
  // 2. Или если команда хорошо сбалансирована
  let balanceContribution = 0;
  if (candidateRatio < 0.3) {
    balanceContribution = 8; // Хорошо балансирует underrepresented профиль
  } else if (candidateRatio < 0.5) {
    balanceContribution = 6; // Умеренно улучшает баланс
  } else if (candidateRatio > 0.7) {
    balanceContribution = 3; // Может создать дисбаланс
  } else {
    balanceContribution = 5; // Нейтральное влияние
  }

  // Финальный баланс = разнообразие команды * вклад кандидата
  return diversityScore * balanceContribution * 10;
};

const DISCLAIMER =
  "Модуль носит рекомендательный характер и не является основанием для отказа в найме.";

const clampScore = (value: number) =>
  Math.max(0, Math.min(10, Math.round(value)));

const normalizeIndex = (value: number) => clampScore(((value - 1) / 8) * 10);

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
  teamBalance?: number,
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

  const recommendations = [phaseRecommendation[phase], taskMode];

  // Добавляем рекомендации по командному балансу
  if (teamBalance !== undefined) {
    if (teamBalance >= 7) {
      recommendations.push(
        "Кандидат хорошо дополнит существующий баланс команды и повысит эффективность работы.",
      );
    } else if (teamBalance >= 4) {
      recommendations.push(
        "Кандидат умеренно улучшит командный баланс, рекомендуется мониторинг адаптации.",
      );
    } else {
      recommendations.push(
        "Возможно влияние на командную динамику, стоит оценить потенциальные конфликты.",
      );
    }
  }

  return recommendations;
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
    flags.push(
      "Низкий темпоральный резонанс — возможна адаптация дольше обычного.",
    );
  }
  if (metrics.moneyFlow <= 3) {
    flags.push(
      "Низкий прогноз денежного потока — стоит усилить контроль целей.",
    );
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
  options?: {
    companyBirthDate?: Date;
    managerBirthDate?: Date;
    teamData?: TeamMemberProfile[];
  },
): MetaMatchEvaluation => {
  const dateDigits = getDateDigits(birthDate);
  const coreIndex = digitalRoot(
    dateDigits.reduce((sum, digit) => sum + digit, 0),
  );
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

  // Расчет расширенных метрик, если предоставлены даты компании/руководителя
  if (options?.companyBirthDate) {
    const companySynergy = calculateEntitySynergy(
      { coreIndex, stabilityIndex, changeIndex, cycleIndex },
      options.companyBirthDate,
      currentDate,
    );
    summaryMetrics.companySynergy = clampScore(companySynergy);
  }

  if (options?.managerBirthDate) {
    const managerSynergy = calculateEntitySynergy(
      { coreIndex, stabilityIndex, changeIndex, cycleIndex },
      options.managerBirthDate,
      currentDate,
    );
    summaryMetrics.managerSynergy = clampScore(managerSynergy);
  }

  // Расчет командного баланса, если предоставлены данные команды
  let teamData: TeamData | undefined;
  if (options?.teamData && options.teamData.length > 0) {
    teamData = analyzeTeamBalance(options.teamData);
    const candidateProfile = { coreIndex, stabilityIndex, changeIndex, phase };
    const teamBalanceScore = calculateTeamBalance(candidateProfile, teamData);
    summaryMetrics.teamBalance = clampScore(teamBalanceScore);
  }

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
    recommendations: buildRecommendations(
      phase,
      stabilityIndex,
      changeIndex,
      summaryMetrics.teamBalance,
    ),
    riskFlags: buildRiskFlags(summaryMetrics),
    disclaimer: DISCLAIMER,
    algorithmVersion: ALGORITHM_VERSION,
    teamData,
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
  companySynergy: metrics.companySynergy
    ? getInterpretation(metrics.companySynergy)
    : undefined,
  managerSynergy: metrics.managerSynergy
    ? getInterpretation(metrics.managerSynergy)
    : undefined,
  teamBalance: metrics.teamBalance
    ? getInterpretation(metrics.teamBalance)
    : undefined,
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
