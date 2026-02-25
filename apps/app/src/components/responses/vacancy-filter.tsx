"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { Checkbox } from "@qbs-autonaim/ui/components/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@qbs-autonaim/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@qbs-autonaim/ui/components/popover";
import { IconChevronDown } from "@tabler/icons-react";
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
                className="cursor-pointer gap-2"
              >
                <Checkbox
                  checked={selectedCount === 0}
                  aria-label="Все вакансии"
                  className="pointer-events-none"
                />
                <span className="font-medium">Все вакансии</span>
              </CommandItem>
              {vacancies.map((vacancy) => {
                const isSelected = selectedVacancyIds.includes(vacancy.id);
                return (
                  <CommandItem
                    key={vacancy.id}
                    onSelect={() => handleToggle(vacancy.id)}
                    className="cursor-pointer gap-2"
                  >
                    <Checkbox
                      checked={isSelected}
                      aria-label={vacancy.title}
                      className="pointer-events-none"
                    />
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
