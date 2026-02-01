import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  CheckCircle,
  FileText,
  Lightbulb,
  Settings,
  Target,
  Wrench,
} from "lucide-react";

interface GigRequirementsProps {
  requirements?: {
    summary?: string | null;
    deliverables?: string[] | null;
    required_skills?: string[] | null;
    nice_to_have_skills?: string[] | null;
    tech_stack?: string[] | null;
  } | null;
}

export function GigRequirements({ requirements }: GigRequirementsProps) {
  if (!requirements) return null;

  const hasRequirements =
    requirements.summary ||
    (requirements.deliverables && requirements.deliverables.length > 0) ||
    (requirements.required_skills && requirements.required_skills.length > 0) ||
    (requirements.nice_to_have_skills &&
      requirements.nice_to_have_skills.length > 0) ||
    (requirements.tech_stack && requirements.tech_stack.length > 0);

  if (!hasRequirements) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Требования к проекту
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {requirements.summary && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">
                Описание проекта
              </h3>
            </div>
            <div className="pl-6">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap hyphens-auto leading-relaxed">
                {requirements.summary}
              </p>
            </div>
          </section>
        )}

        {requirements.deliverables && requirements.deliverables.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">
                Что нужно сделать
              </h3>
            </div>
            <div className="pl-6">
              <ul className="space-y-2">
                {requirements.deliverables.map((item: string, _idx: number) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-sm text-muted-foreground hyphens-auto leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {requirements.required_skills &&
          requirements.required_skills.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base">
                  Обязательные навыки
                </h3>
              </div>
              <div className="pl-6">
                <div className="flex flex-wrap gap-2">
                  {requirements.required_skills.map(
                    (skill: string, _idx: number) => (
                      <Badge
                        key={skill}
                        variant="default"
                        className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                      >
                        {skill}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            </section>
          )}

        {requirements.nice_to_have_skills &&
          requirements.nice_to_have_skills.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base">
                  Желательные навыки
                </h3>
              </div>
              <div className="pl-6">
                <div className="flex flex-wrap gap-2">
                  {requirements.nice_to_have_skills.map(
                    (skill: string, _idx: number) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="border-dashed"
                      >
                        {skill}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            </section>
          )}

        {requirements.tech_stack && requirements.tech_stack.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">Технологии</h3>
            </div>
            <div className="pl-6">
              <div className="flex flex-wrap gap-2">
                {requirements.tech_stack.map((tech: string, _idx: number) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
