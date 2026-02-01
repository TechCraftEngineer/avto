import { InfoTooltip } from "@qbs-autonaim/ui";

interface PageHeaderProps {
  title: string;
  description?: string;
  tooltipContent?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  tooltipContent,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
          {tooltipContent && <InfoTooltip content={tooltipContent} />}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
