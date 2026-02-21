import { Badge } from "@qbs-autonaim/ui/components/badge";

interface SkillsListProps {
  skills: string[];
}

export function SkillsList({ skills }: SkillsListProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs sm:text-sm font-semibold">Навыки</h4>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {skills.map((skill: string) => (
          <Badge key={skill} variant="secondary" className="text-xs sm:text-sm">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
