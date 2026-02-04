export function analyzeSkillMatch(
  candidateSkills: string[],
  vacancyRequirements?: {
    mandatory_requirements: string[];
    nice_to_have_skills: string[];
    tech_stack: string[];
    experience_years: {
      min: number | null;
      description: string;
    };
  },
) {
  if (!vacancyRequirements) {
    return {
      matchedRequired: 0,
      totalRequired: 0,
      matchedPreferred: 0,
      totalPreferred: 0,
      missingRequired: [],
      experienceMatch: false,
      matchPercentage: 0,
    };
  }

  const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());
  const requiredSkillsLower = vacancyRequirements.mandatory_requirements.map(
    (s) => s.toLowerCase(),
  );
  const preferredSkillsLower = vacancyRequirements.nice_to_have_skills.map(
    (s) => s.toLowerCase(),
  );

  const matchedRequired = requiredSkillsLower.filter((skill) =>
    candidateSkillsLower.some(
      (candidateSkill) =>
        candidateSkill.includes(skill) || skill.includes(candidateSkill),
    ),
  );

  const matchedPreferred = preferredSkillsLower.filter((skill) =>
    candidateSkillsLower.some(
      (candidateSkill) =>
        candidateSkill.includes(skill) || skill.includes(candidateSkill),
    ),
  );

  const missingRequired = vacancyRequirements.mandatory_requirements.filter(
    (skill) => !matchedRequired.includes(skill.toLowerCase()),
  );

  const experienceMatch =
    vacancyRequirements.experience_years.min === null ||
    vacancyRequirements.experience_years.min <= 3;

  return {
    matchedRequired: matchedRequired.length,
    totalRequired: vacancyRequirements.mandatory_requirements.length,
    matchedPreferred: matchedPreferred.length,
    totalPreferred: vacancyRequirements.nice_to_have_skills.length,
    missingRequired,
    experienceMatch,
    matchPercentage: Math.round(
      ((matchedRequired.length + matchedPreferred.length * 0.5) /
        (vacancyRequirements.mandatory_requirements.length +
          vacancyRequirements.nice_to_have_skills.length * 0.5)) *
        100,
    ),
  };
}
