import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { Briefcase } from "lucide-react";
import { SafeHtml } from "~/components/safe-html";

interface ExperienceCardProps {
  experience: string;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Briefcase className="h-6 w-6 text-primary" />
          Резюме
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <SafeHtml
          html={experience}
          className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert [&_p]:leading-relaxed [&_p]:mb-3"
        />
      </CardContent>
    </Card>
  );
}
