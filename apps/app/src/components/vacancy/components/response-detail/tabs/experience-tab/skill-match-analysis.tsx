import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { AlertTriangle, Award, CheckCircle2, XCircle } from "lucide-react";
import { analyzeSkillMatch } from "./utils";

type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

interface SkillMatchAnalysisProps {
  response: VacancyResponseDetail;
  requirements: {
    mandatory_requirements: string[];
    nice_to_have_skills: string[];
    tech_stack: string[];
    experience_years: {
      min: number | null;
      description: string;
    };
  };
}

export function SkillMatchAnalysis({
  response,
  requirements,
}: SkillMatchAnalysisProps) {
  const candidateSkills = response.skills || [];
  const analysis = analyzeSkillMatch(candidateSkills, requirements);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          Соответствие требованиям вакансии
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <span className="font-medium">Общее соответствие</span>
          <div className="flex items-center gap-2">
            <div
              className={`text-2xl font-bold ${
                analysis.matchPercentage >= 80
                  ? "text-green-600"
                  : analysis.matchPercentage >= 60
                    ? "text-blue-600"
                    : analysis.matchPercentage >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
              }`}
            >
              {analysis.matchPercentage}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Обязательные навыки ({analysis.matchedRequired}/
              {analysis.totalRequired})
            </h4>
            <div className="space-y-1">
              {requirements.mandatory_requirements.map((skill) => {
                const isMatched =
                  analysis.matchedRequired > 0 &&
                  requirements.mandatory_requirements.findIndex(
                    (req) =>
                      req.toLowerCase() === skill.toLowerCase() ||
                      candidateSkills.some(
                        (candidateSkill) =>
                          candidateSkill
                            .toLowerCase()
                            .includes(skill.toLowerCase()) ||
                          skill
                            .toLowerCase()
                            .includes(candidateSkill.toLowerCase()),
                      ),
                  ) !== -1;

                return (
                  <div key={skill} className="flex items-center gap-2 text-sm">
                    {isMatched ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                    )}
                    <span
                      className={isMatched ? "text-green-700" : "text-red-700"}
                    >
                      {skill}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              Предпочитаемые навыки ({analysis.matchedPreferred}/
              {analysis.totalPreferred})
            </h4>
            <div className="space-y-1">
              {requirements.nice_to_have_skills.map((skill) => {
                const isMatched =
                  analysis.matchedPreferred > 0 &&
                  requirements.nice_to_have_skills.findIndex(
                    (pref) =>
                      pref.toLowerCase() === skill.toLowerCase() ||
                      candidateSkills.some(
                        (candidateSkill) =>
                          candidateSkill
                            .toLowerCase()
                            .includes(skill.toLowerCase()) ||
                          skill
                            .toLowerCase()
                            .includes(candidateSkill.toLowerCase()),
                      ),
                  ) !== -1;

                return (
                  <div key={skill} className="flex items-center gap-2 text-sm">
                    {isMatched ? (
                      <CheckCircle2 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    )}
                    <span
                      className={isMatched ? "text-blue-700" : "text-gray-600"}
                    >
                      {skill}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {analysis.matchPercentage < 70 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Рекомендация:</p>
                <p className="text-yellow-700 mt-1">
                  Уровень соответствия ниже оптимального. Рассмотрите кандидатов
                  с более подходящими навыками или организуйте дополнительное
                  обучение.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
