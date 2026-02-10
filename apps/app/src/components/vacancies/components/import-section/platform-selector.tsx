import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";

interface PlatformSelectorProps {
  activeIntegrations: Array<{ id: string; type: string }>;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  getPlatformName: (type: string) => string;
}

export function PlatformSelector({
  activeIntegrations,
  selectedPlatform,
  onPlatformChange,
  getPlatformName,
}: PlatformSelectorProps) {
  if (activeIntegrations.length === 0) {
    return null;
  }

  if (activeIntegrations.length === 1) {
    const integration = activeIntegrations[0];
    if (!integration) return null;

    return (
      <Badge variant="secondary" className="shrink-0">
        {getPlatformName(integration.type)}
      </Badge>
    );
  }

  return (
    <Select value={selectedPlatform} onValueChange={onPlatformChange}>
      <SelectTrigger className="w-[180px] shrink-0">
        <SelectValue placeholder="Выберите платформу" />
      </SelectTrigger>
      <SelectContent>
        {activeIntegrations.map((integration) => (
          <SelectItem key={integration.id} value={integration.type}>
            {getPlatformName(integration.type)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
