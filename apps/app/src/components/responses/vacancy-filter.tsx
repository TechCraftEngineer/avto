"use client";

import { cn } from "@qbs-autonaim/ui";
import { Button } from "@qbs-autonaim/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@qbs-autonaim/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@qbs-autonaim/ui/popover";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

interface Vacancy {
  id: string;
  title: string;
}

interface VacancyFilterProps {
  vacancies: Vacancy[];
  selectedVacancyIds: string[];
  onSelectionChange: (vacancyIds: string[]) => void;
  isLoading?: boolean;
}

export function VacancyFilter({
  vacancies,
  selectedVacancyIds,
  onSelectionChange,
  isLoading,
}: VacancyFilterProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (vacancyId: string) => {
    const newSelection = selectedVacancyIds.includes(vacancyId)
      ? selectedVacancyIds.filter((id) => id !== vacancyId)
      : [...selectedVacancyIds, vacancyId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedVacancyIds.length;
  const displayText =
    selectedCount === 0
      ? "Все вакансии"
      : selectedCount === 1
        ? vacancies.find((v) => v.id === selectedVacancyIds[0])?.title ||
          "1 вакансия"
        : `${selectedCount} вакансий`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Выбрать вакансии"
          className="w-full sm:w-[280px] justify-between"
          disabled={isLoading}
        >
          <span className="truncate">{displayText}</span>
          <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск вакансий…" />
          <CommandList>
            <CommandEmpty>Вакансии не найдены</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={handleSelectAll}
                className="cursor-pointer"
              >
                <div
                  className={cn(
                    "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                    selectedCount === 0
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50",
                  )}
                >
                  {selectedCount === 0 && <IconCheck className="size-3" />}
                </div>
                <span className="font-medium">Все вакансии</span>
              </CommandItem>
              {vacancies.map((vacancy) => {
                const isSelected = selectedVacancyIds.includes(vacancy.id);
                return (
                  <CommandItem
                    key={vacancy.id}
                    onSelect={() => handleToggle(vacancy.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50",
                      )}
                    >
                      {isSelected && <IconCheck className="size-3" />}
                    </div>
                    <span className="truncate">{vacancy.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
