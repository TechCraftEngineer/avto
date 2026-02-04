import { Badge } from "@qbs-autonaim/ui/badge";
import { Separator } from "@qbs-autonaim/ui/separator";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

interface ResumeProfileProps {
  profile: {
    summary?: string;
    experience?: unknown;
    education?: unknown;
    skills?: string[];
    location?: string;
  };
}

export function ResumeProfile({ profile }: ResumeProfileProps) {
  return (
    <>
      {profile.summary && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold">О кандидате</h4>
          <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
            {profile.summary}
          </p>
        </div>
      )}

      {profile.experience && (
        <>
          {profile.summary && <Separator />}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold">Опыт работы</h4>
            {Array.isArray(profile.experience) ? (
              <div className="space-y-3">
                {profile.experience.map((item, index) => {
                  const exp = item.experience || item;
                  const key =
                    exp.company && exp.position
                      ? `${exp.company}-${exp.position}-${index}`
                      : `exp-${index}`;
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg border space-y-1.5"
                    >
                      {exp.position && (
                        <div className="font-medium text-xs sm:text-sm">
                          {exp.position}
                        </div>
                      )}
                      {exp.company && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {exp.company}
                        </div>
                      )}
                      {exp.period && (
                        <div className="text-xs text-muted-foreground">
                          {exp.period}
                        </div>
                      )}
                      {exp.description && (
                        <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word mt-2">
                          {exp.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtmlFunction(
                    typeof profile.experience === "string"
                      ? profile.experience
                      : String(profile.experience),
                  ),
                }}
              />
            )}
          </div>
        </>
      )}

      {profile.education && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold">Образование</h4>
            {Array.isArray(profile.education) ? (
              <div className="space-y-3">
                {profile.education.map((item, index) => {
                  const edu = item;
                  const key =
                    edu.institution && edu.degree
                      ? `${edu.institution}-${edu.degree}-${index}`
                      : `edu-${index}`;
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg border space-y-1.5"
                    >
                      {item.degree && (
                        <div className="font-medium text-xs sm:text-sm">
                          {item.degree}
                        </div>
                      )}
                      {item.institution && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {item.institution}
                        </div>
                      )}
                      {item.period && (
                        <div className="text-xs text-muted-foreground">
                          {item.period}
                        </div>
                      )}
                      {item.specialization && (
                        <div className="text-xs sm:text-sm text-foreground mt-1">
                          {item.specialization}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed wrap-break-word"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtmlFunction(
                    typeof profile.education === "string"
                      ? profile.education
                      : String(profile.education),
                  ),
                }}
              />
            )}
          </div>
        </>
      )}

      {profile.skills && profile.skills.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">Навыки</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {profile.skills.map((skill: string) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-xs sm:text-sm"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {profile.location && (
        <>
          <Separator />
          <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
            <span className="text-xs sm:text-sm font-medium">
              Местоположение
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {profile.location}
            </span>
          </div>
        </>
      )}
    </>
  );
}
