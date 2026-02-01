"use client";

import { Briefcase, Calendar, MapPin } from "lucide-react";
import { useMemo } from "react";

interface ExperienceSectionProps {
  experience: string;
}

interface ParsedExperience {
  company: string;
  position: string;
  period: string;
  location?: string;
  description: string[];
}

function parseHTMLExperience(html: string): ParsedExperience[] {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const experiences: ParsedExperience[] = [];
  const sections = doc.querySelectorAll("section, .experience-item, article");

  if (sections.length === 0) {
    const headings = doc.querySelectorAll("h2, h3, h4, strong");
    headings.forEach((heading) => {
      const company = heading.textContent?.trim() || "";
      const nextElements: string[] = [];
      let current = heading.nextElementSibling;

      while (
        current &&
        !["H2", "H3", "H4", "STRONG"].includes(current.tagName)
      ) {
        const text = current.textContent?.trim();
        if (text) nextElements.push(text);
        current = current.nextElementSibling;
      }

      if (company && nextElements.length > 0) {
        experiences.push({
          company,
          position: nextElements[0] || "",
          period: nextElements[1] || "",
          description: nextElements.slice(2),
        });
      }
    });
  } else {
    sections.forEach((section) => {
      const company =
        section.querySelector("h2, h3, h4, .company")?.textContent?.trim() ||
        "";
      const position =
        section.querySelector(".position, .title")?.textContent?.trim() || "";
      const period =
        section.querySelector(".period, .date, time")?.textContent?.trim() ||
        "";
      const location = section.querySelector(".location")?.textContent?.trim();
      const descItems = Array.from(section.querySelectorAll("li, p")).map(
        (el) => el.textContent?.trim() || "",
      );

      if (company || position) {
        experiences.push({
          company,
          position,
          period,
          location,
          description: descItems.filter(Boolean),
        });
      }
    });
  }

  if (experiences.length === 0) {
    const text = doc.body.textContent?.trim() || "";
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length > 0) {
      experiences.push({
        company: "Опыт работы",
        position: "",
        period: "",
        description: lines.slice(0, 10),
      });
    }
  }

  return experiences;
}

export function ExperienceSection({ experience }: ExperienceSectionProps) {
  const parsedExperiences = useMemo(
    () => parseHTMLExperience(experience),
    [experience],
  );

  if (parsedExperiences.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Опыт работы
        </h3>
        <div className="p-4 bg-muted/30 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Информация об опыте работы отсутствует
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" />
        Опыт работы
      </h3>
      <div className="space-y-4">
        {parsedExperiences.map((exp, idx) => (
          <div
            key={`exp-${idx}-${exp.company}`}
            className="p-4 bg-muted/30 rounded-lg border space-y-3"
          >
            <div className="space-y-2">
              {exp.company && (
                <h4 className="font-semibold text-base">{exp.company}</h4>
              )}
              {exp.position && (
                <p className="text-sm font-medium text-muted-foreground">
                  {exp.position}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {exp.period && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{exp.period}</span>
                  </div>
                )}
                {exp.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{exp.location}</span>
                  </div>
                )}
              </div>
            </div>
            {exp.description.length > 0 && (
              <ul className="space-y-1.5 text-sm">
                {exp.description.slice(0, 5).map((desc, descIdx) => (
                  <li
                    key={`desc-${idx}-${descIdx}-${desc.slice(0, 20)}`}
                    className="flex gap-2"
                  >
                    <span className="text-muted-foreground mt-1.5">•</span>
                    <span className="flex-1">{desc}</span>
                  </li>
                ))}
                {exp.description.length > 5 && (
                  <li className="text-xs text-muted-foreground italic">
                    +{exp.description.length - 5} дополнительных пунктов
                  </li>
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
