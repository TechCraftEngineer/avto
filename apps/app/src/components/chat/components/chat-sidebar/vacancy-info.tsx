interface VacancyInfoProps {
  title: string;
  description?: string | null;
}

export function VacancyInfo({ title, description }: VacancyInfoProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Вакансия</h2>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Название</p>
          <p className="text-sm font-medium">{title}</p>
        </div>
        {description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Описание</p>
            <p className="text-sm line-clamp-3">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
